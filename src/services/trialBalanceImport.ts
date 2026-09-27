import { db, nextAuditEvent } from '../db';
import { rupeesToPaise, sumMoney } from '../domain/money';
import { sha256 } from '../domain/security';
import type { LedgerAccount, LedgerMapping, TrialBalanceImport } from '../domain/types';
import { taxonomyByCode } from '../data/taxonomy';
import { trialBalanceTemplateHeaders, trialBalanceTemplateVersion } from './trialBalanceTemplate';

type CellValue = string | number | boolean | Date | null | undefined;

export interface ParsedTrialBalanceRow {
  rowNumber: number;
  code: string;
  name: string;
  group: string;
  subGroup: string;
  openingDebitPaise: number;
  openingCreditPaise: number;
  debitPaise: number;
  creditPaise: number;
  closingDebitPaise: number;
  closingCreditPaise: number;
  comparativeDebitPaise: number;
  comparativeCreditPaise: number;
  signedCurrentPaise: number;
  signedComparativePaise: number;
  suggestedTaxonomyCode?: string;
}

export interface TrialBalancePreview {
  fileName: string;
  sourceType: 'CSV' | 'XLSX';
  formatStatus: 'STANDARD' | 'COMPATIBLE' | 'INVALID';
  detectedHeaders: string[];
  rows: ParsedTrialBalanceRow[];
  debitTotalPaise: number;
  creditTotalPaise: number;
  differencePaise: number;
  errors: string[];
  warnings: string[];
  contentHash: string;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] ?? '';
    const next = text[index + 1] ?? '';
    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  return rows;
}

function normaliseHeader(value: CellValue): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const headerAliases: Record<string, string[]> = {
  code: ['ledgercode', 'accountcode', 'code', 'glcode'],
  name: ['ledgername', 'accountname', 'ledger', 'account', 'particulars'],
  group: ['group', 'ledgergroup', 'accountgroup'],
  subGroup: ['subgroup', 'ledgersubgroup', 'accountsubgroup'],
  openingDebit: ['openingdebit', 'openingdr', 'opendebit'],
  openingCredit: ['openingcredit', 'openingcr', 'opencredit'],
  debit: ['debit', 'debitmovement', 'currentdebit', 'dr'],
  credit: ['credit', 'creditmovement', 'currentcredit', 'cr'],
  closingDebit: ['closingdebit', 'closingdr', 'debitbalance', 'closingbalancedr'],
  closingCredit: ['closingcredit', 'closingcr', 'creditbalance', 'closingbalancecr'],
  comparativeDebit: ['previousdebit', 'prioryeardebit', 'comparativedebit', 'previousdr'],
  comparativeCredit: ['previouscredit', 'prioryearcredit', 'comparativecredit', 'previouscr']
};

function findColumn(headers: string[], key: keyof typeof headerAliases): number | undefined {
  const aliases = headerAliases[key] ?? [];
  const index = headers.findIndex((header) => aliases.includes(header));
  return index >= 0 ? index : undefined;
}

function cellText(row: CellValue[], index: number | undefined): string {
  if (index === undefined) return '';
  const value = row[index];
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').trim();
}

function cellMoney(row: CellValue[], index: number | undefined): number {
  if (index === undefined) return 0;
  const value = row[index];
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'boolean' || value instanceof Date) throw new TypeError('Expected a monetary number.');
  return rupeesToPaise(value);
}

export function suggestTaxonomyCode(name: string, group: string, subGroup: string): string | undefined {
  const value = `${name} ${group} ${subGroup}`.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/share capital/, 'BS-EQ-CAPITAL'],
    [/reserve|retained|surplus/, 'BS-EQ-RESERVES'],
    [/term loan|long.?term borrow/, 'BS-NCL-BORROWING'],
    [/working capital|cash credit|short.?term borrow/, 'BS-CL-BORROWING'],
    [/trade payable|creditor/, 'BS-CL-PAYABLE'],
    [/tax payable|current tax liab/, 'BS-CL-TAX'],
    [/warranty|short.?term provision/, 'BS-CL-PROVISION'],
    [/employee benefit|gratuity/, 'BS-NCL-EMPLOYEE'],
    [/other current liab|statutory due|accrued/, 'BS-CL-OTHER'],
    [/plant|machinery|building|furniture|vehicle|ppe|fixed asset/, 'BS-NCA-PPE'],
    [/software|intangible|goodwill/, 'BS-NCA-INTANGIBLE'],
    [/investment/, 'BS-NCA-INVESTMENT'],
    [/deferred tax asset/, 'BS-NCA-DTA'],
    [/inventory|stock|raw material|finished good/, 'BS-CA-INVENTORY'],
    [/trade receivable|debtor/, 'BS-CA-RECEIVABLE'],
    [/cash|bank/, 'BS-CA-CASH'],
    [/prepaid|prepayment/, 'BS-CA-PREPAID'],
    [/gst recover|other current asset|advance/, 'BS-CA-OTHER'],
    [/revenue|sales|sale of/, 'PL-REV-OPERATIONS'],
    [/other income|interest income|miscellaneous income/, 'PL-REV-OTHER'],
    [/material consumed|purchase|raw material/, 'PL-EXP-MATERIAL'],
    [/salary|wage|employee|staff welfare/, 'PL-EXP-EMPLOYEE'],
    [/depreciation|amortisation/, 'PL-EXP-DEPRECIATION'],
    [/finance cost|interest on/, 'PL-EXP-FINANCE'],
    [/current tax expense/, 'PL-EXP-TAX-CURRENT'],
    [/deferred tax expense/, 'PL-EXP-TAX-DEFERRED'],
    [/expense|administration|selling|manufacturing/, 'PL-EXP-OTHER']
  ];
  return rules.find(([pattern]) => pattern.test(value))?.[1];
}

async function rowsFromFile(file: File): Promise<CellValue[][]> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseCsv(await file.text());
  }
  if (file.name.toLowerCase().endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    const data = await readSheet(file);
    return data as CellValue[][];
  }
  throw new Error('Unsupported file type. Select a .csv or .xlsx file.');
}

export async function parseTrialBalanceFile(file: File): Promise<TrialBalancePreview> {
  if (file.size > 25 * 1024 * 1024) throw new Error('File exceeds the 25 MB safety limit.');
  const rawRows = await rowsFromFile(file);
  if (rawRows.length < 2) throw new Error('The file must contain a header row and at least one ledger row.');
  if (rawRows.length > 50_001) throw new Error('The file exceeds the 50,000-row import limit.');
  const headerRow = rawRows[0] ?? [];
  const detectedHeaders = headerRow
    .map((value) => String(value ?? '').trim())
    .filter((value) => value !== '');
  const headers = headerRow.map(normaliseHeader);
  const columns = {
    code: findColumn(headers, 'code'),
    name: findColumn(headers, 'name'),
    group: findColumn(headers, 'group'),
    subGroup: findColumn(headers, 'subGroup'),
    openingDebit: findColumn(headers, 'openingDebit'),
    openingCredit: findColumn(headers, 'openingCredit'),
    debit: findColumn(headers, 'debit'),
    credit: findColumn(headers, 'credit'),
    closingDebit: findColumn(headers, 'closingDebit'),
    closingCredit: findColumn(headers, 'closingCredit'),
    comparativeDebit: findColumn(headers, 'comparativeDebit'),
    comparativeCredit: findColumn(headers, 'comparativeCredit')
  };
  const errors: string[] = [];
  const warnings: string[] = [];
  const hasClosing = columns.closingDebit !== undefined || columns.closingCredit !== undefined;
  const hasMovement = columns.debit !== undefined || columns.credit !== undefined;
  const missingRequiredHeaders: string[] = [];
  if (columns.code === undefined) missingRequiredHeaders.push('Ledger Code');
  if (columns.name === undefined) missingRequiredHeaders.push('Ledger Name');
  if (!hasClosing && !hasMovement) missingRequiredHeaders.push('Closing Debit and Closing Credit');
  const isStandardFormat = trialBalanceTemplateHeaders.every((header, index) => String(headerRow[index] ?? '').trim() === header)
    && detectedHeaders.length === trialBalanceTemplateHeaders.length;
  const formatStatus: TrialBalancePreview['formatStatus'] = missingRequiredHeaders.length > 0
    ? 'INVALID'
    : isStandardFormat ? 'STANDARD' : 'COMPATIBLE';
  if (missingRequiredHeaders.length > 0) {
    errors.push(`This file is not in the White Horse Standard TB format (${trialBalanceTemplateVersion}). Download the template and keep its row-1 headers unchanged.`);
    errors.push(`Missing required row-1 columns: ${missingRequiredHeaders.join(', ')}.`);
    errors.push(`Detected row-1 headers: ${detectedHeaders.slice(0, 20).join(', ') || 'none'}.`);
  } else if (!isStandardFormat) {
    warnings.push(`Compatible non-standard headers were recognised. Use the ${trialBalanceTemplateVersion} template for repeatable future imports.`);
  }
  if (errors.length) {
    return { fileName: file.name, sourceType: file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'XLSX', formatStatus, detectedHeaders, rows: [], debitTotalPaise: 0, creditTotalPaise: 0, differencePaise: 0, errors, warnings, contentHash: await sha256(new Uint8Array(await file.arrayBuffer())) };
  }

  const parsedRows: ParsedTrialBalanceRow[] = [];
  const seenCodes = new Set<string>();
  for (let index = 1; index < rawRows.length; index += 1) {
    const row = rawRows[index] ?? [];
    const code = cellText(row, columns.code);
    const name = cellText(row, columns.name);
    if (!code && !name) continue;
    if (!code || !name) {
      errors.push(`Row ${index + 1}: ledger code and name are both required.`);
      continue;
    }
    if (seenCodes.has(code.toLowerCase())) {
      errors.push(`Row ${index + 1}: duplicate ledger code ${code}.`);
      continue;
    }
    seenCodes.add(code.toLowerCase());
    try {
      const openingDebitPaise = cellMoney(row, columns.openingDebit);
      const openingCreditPaise = cellMoney(row, columns.openingCredit);
      const debitPaise = cellMoney(row, columns.debit);
      const creditPaise = cellMoney(row, columns.credit);
      const calculated = openingDebitPaise - openingCreditPaise + debitPaise - creditPaise;
      const closingDebitPaise = hasClosing ? cellMoney(row, columns.closingDebit) : Math.max(calculated, 0);
      const closingCreditPaise = hasClosing ? cellMoney(row, columns.closingCredit) : Math.max(-calculated, 0);
      if (closingDebitPaise && closingCreditPaise) {
        errors.push(`Row ${index + 1}: closing debit and credit cannot both be non-zero.`);
        continue;
      }
      if (hasClosing && hasMovement && calculated !== closingDebitPaise - closingCreditPaise) {
        warnings.push(`Row ${index + 1}: reported closing balance does not equal opening plus movements.`);
      }
      const comparativeDebitPaise = cellMoney(row, columns.comparativeDebit);
      const comparativeCreditPaise = cellMoney(row, columns.comparativeCredit);
      const group = cellText(row, columns.group);
      const subGroup = cellText(row, columns.subGroup);
      parsedRows.push({
        rowNumber: index + 1,
        code,
        name,
        group,
        subGroup,
        openingDebitPaise,
        openingCreditPaise,
        debitPaise,
        creditPaise,
        closingDebitPaise,
        closingCreditPaise,
        comparativeDebitPaise,
        comparativeCreditPaise,
        signedCurrentPaise: closingDebitPaise - closingCreditPaise,
        signedComparativePaise: comparativeDebitPaise - comparativeCreditPaise,
        suggestedTaxonomyCode: suggestTaxonomyCode(name, group, subGroup)
      });
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'invalid amount'}`);
    }
  }

  const debitTotalPaise = sumMoney(parsedRows.map((row) => row.closingDebitPaise));
  const creditTotalPaise = sumMoney(parsedRows.map((row) => row.closingCreditPaise));
  const differencePaise = debitTotalPaise - creditTotalPaise;
  if (differencePaise !== 0) errors.push(`Trial Balance difference is ${differencePaise} paise.`);
  if (parsedRows.some((row) => row.signedComparativePaise === 0)) {
    warnings.push('One or more ledgers have no comparative balance; confirm applicability before finalisation.');
  }

  return {
    fileName: file.name,
    sourceType: file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'XLSX',
    formatStatus,
    detectedHeaders,
    rows: parsedRows,
    debitTotalPaise,
    creditTotalPaise,
    differencePaise,
    errors,
    warnings,
    contentHash: await sha256(new Uint8Array(await file.arrayBuffer()))
  };
}

export async function activateTrialBalance(preview: TrialBalancePreview, companyId: string, periodId: string): Promise<void> {
  if (preview.errors.length || preview.differencePaise !== 0 || preview.rows.length === 0) {
    throw new Error('Only a non-empty, balanced, error-free preview can be activated.');
  }
  const period = await db.periods.get(periodId);
  if (!period || period.companyId !== companyId) throw new Error('Reporting period was not found.');
  const importId = crypto.randomUUID();
  const now = new Date().toISOString();
  const imported: TrialBalanceImport = {
    id: importId,
    companyId,
    periodId,
    fileName: preview.fileName,
    sourceType: preview.sourceType,
    importedAt: now,
    importedBy: 'demo-preparer',
    rowCount: preview.rows.length,
    debitTotalPaise: preview.debitTotalPaise,
    creditTotalPaise: preview.creditTotalPaise,
    differencePaise: preview.differencePaise,
    status: 'ACTIVE',
    contentHash: preview.contentHash
  };
  const ledgers: LedgerAccount[] = preview.rows.map((row) => ({
    id: crypto.randomUUID(),
    companyId,
    periodId,
    importId,
    code: row.code,
    name: row.name,
    group: row.group,
    subGroup: row.subGroup,
    openingDebitPaise: row.openingDebitPaise,
    openingCreditPaise: row.openingCreditPaise,
    debitPaise: row.debitPaise,
    creditPaise: row.creditPaise,
    closingDebitPaise: row.closingDebitPaise,
    closingCreditPaise: row.closingCreditPaise,
    signedCurrentPaise: row.signedCurrentPaise,
    signedComparativePaise: row.signedComparativePaise,
    active: true,
    sourceRow: row.rowNumber
  }));
  const mappings: LedgerMapping[] = ledgers.flatMap((ledger, index) => {
    const suggestion = preview.rows[index]?.suggestedTaxonomyCode;
    const node = suggestion ? taxonomyByCode.get(suggestion) : undefined;
    if (!suggestion || !node) return [];
    return [
      {
        id: crypto.randomUUID(),
        companyId,
        periodId,
        ledgerId: ledger.id,
        taxonomyCode: suggestion,
        status: 'DRAFT',
        currentNonCurrent: node.currentNonCurrent,
        cashFlowClass: node.cashFlowClass,
        suggestionConfidence: 0.7,
        suggestionReason: 'Keyword/group suggestion; preparer and reviewer approval required.',
        updatedAt: now
      }
    ];
  });
  const event = await nextAuditEvent({
    companyId,
    periodId,
    actorId: 'demo-preparer',
    actorRole: 'PREPARER',
    action: 'TB_IMPORT_ACTIVATED',
    entityType: 'TB_IMPORT',
    entityId: importId,
    reason: `Activated ${preview.fileName}; previous import remains immutable and superseded.`
  });
  await db.transaction('rw', db.imports, db.ledgers, db.mappings, db.periods, db.auditEvents, async () => {
    await db.imports.update(period.activeImportId, { status: 'SUPERSEDED' });
    await db.imports.add(imported);
    await db.ledgers.bulkAdd(ledgers);
    if (mappings.length) await db.mappings.bulkAdd(mappings);
    await db.periods.update(periodId, {
      activeImportId: importId,
      status: 'MAPPING_IN_PROGRESS',
      updatedAt: now
    });
    await db.auditEvents.add(event);
  });
}
