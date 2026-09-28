import { db, nextAuditEvent } from '../db';
import { rupeesToPaise, sumMoney } from '../domain/money';
import { sha256 } from '../domain/security';
import type { LedgerAccount, LedgerMapping, TrialBalanceImport } from '../domain/types';
import { taxonomyByCode } from '../data/taxonomy';
import { trialBalanceTemplateHeaders } from './trialBalanceTemplate';

export type TrialBalanceCellValue = string | number | boolean | Date | null | undefined;
export type SignedBalanceConvention = 'DEBIT_POSITIVE' | 'CREDIT_POSITIVE';

export const trialBalanceColumnRoles = [
  { key: 'code', label: 'Ledger code', requirement: 'Optional — generated if blank' },
  { key: 'name', label: 'Ledger name', requirement: 'Required' },
  { key: 'group', label: 'Group', requirement: 'Optional' },
  { key: 'subGroup', label: 'Sub-group', requirement: 'Optional' },
  { key: 'openingDebit', label: 'Opening debit', requirement: 'Optional' },
  { key: 'openingCredit', label: 'Opening credit', requirement: 'Optional' },
  { key: 'debit', label: 'Period debit movement', requirement: 'Optional' },
  { key: 'credit', label: 'Period credit movement', requirement: 'Optional' },
  { key: 'closingDebit', label: 'Closing debit', requirement: 'Use with closing credit' },
  { key: 'closingCredit', label: 'Closing credit', requirement: 'Use with closing debit' },
  { key: 'closingBalance', label: 'Signed closing balance', requirement: 'Alternative to closing debit/credit' },
  { key: 'closingDirection', label: 'Closing Dr/Cr indicator', requirement: 'Optional with signed balance' },
  { key: 'comparativeDebit', label: 'Comparative debit', requirement: 'Optional' },
  { key: 'comparativeCredit', label: 'Comparative credit', requirement: 'Optional' },
  { key: 'comparativeBalance', label: 'Signed comparative balance', requirement: 'Optional' },
  { key: 'comparativeDirection', label: 'Comparative Dr/Cr indicator', requirement: 'Optional' }
] as const;

export type TrialBalanceColumnRole = typeof trialBalanceColumnRoles[number]['key'];
export type TrialBalanceColumnMap = Partial<Record<TrialBalanceColumnRole, number>>;

export interface TrialBalanceImportOptions {
  worksheetName?: string;
  headerRowNumber?: number;
  headerDepth?: 1 | 2;
  columnMap?: TrialBalanceColumnMap;
  signedBalanceConvention?: SignedBalanceConvention;
}

export interface TrialBalanceSourceSheet {
  sheet: string;
  data: TrialBalanceCellValue[][];
}

export interface TrialBalanceAvailableColumn {
  index: number;
  label: string;
  samples: string[];
}

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
  formatStatus: 'STANDARD' | 'COMPATIBLE' | 'NEEDS_MAPPING' | 'INVALID';
  detectedHeaders: string[];
  worksheetNames: string[];
  selectedWorksheet: string;
  headerRowNumber: number;
  headerDepth: 1 | 2;
  availableColumns: TrialBalanceAvailableColumn[];
  columnMap: TrialBalanceColumnMap;
  signedBalanceConvention?: SignedBalanceConvention;
  mappingRequired: boolean;
  detectionConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  detectionSummary: string;
  rows: ParsedTrialBalanceRow[];
  debitTotalPaise: number;
  creditTotalPaise: number;
  differencePaise: number;
  errors: string[];
  warnings: string[];
  contentHash: string;
}

const roleAliases: Record<TrialBalanceColumnRole, string[]> = {
  code: ['ledgercode', 'accountcode', 'glcode', 'glaccountcode', 'accountnumber', 'accountno', 'ledgerid', 'accountid', 'code'],
  name: ['ledgername', 'accountname', 'glname', 'glaccountname', 'glaccount', 'accountdescription', 'accountdesc', 'accounttitle', 'ledgerdescription', 'particulars', 'description', 'ledger', 'account', 'name'],
  group: ['ledgergroup', 'accountgroup', 'primarygroup', 'parentgroup', 'accountcategory', 'category', 'group'],
  subGroup: ['ledgersubgroup', 'accountsubgroup', 'secondarygroup', 'subcategory', 'subgroup'],
  openingDebit: ['openingdebit', 'openingbalancedebit', 'openingbalancedr', 'openingdr', 'opendebit', 'opbaldr', 'broughtforwarddebit', 'bfdebit'],
  openingCredit: ['openingcredit', 'openingbalancecredit', 'openingbalancecr', 'openingcr', 'opencredit', 'opbalcr', 'broughtforwardcredit', 'bfcredit'],
  debit: ['debitmovement', 'perioddebit', 'transactiondebit', 'transactionsdebit', 'turnoverdebit', 'currentdebitmovement', 'debittransactions'],
  credit: ['creditmovement', 'periodcredit', 'transactioncredit', 'transactionscredit', 'turnovercredit', 'currentcreditmovement', 'credittransactions'],
  closingDebit: ['closingdebit', 'closingbalancedebit', 'closingbalancedr', 'closingdr', 'debitbalance', 'endingdebit', 'endingbalancedebit', 'currentdebit', 'debitamount', 'dramount', 'debit', 'dr'],
  closingCredit: ['closingcredit', 'closingbalancecredit', 'closingbalancecr', 'closingcr', 'creditbalance', 'endingcredit', 'endingbalancecredit', 'currentcredit', 'creditamount', 'cramount', 'credit', 'cr'],
  closingBalance: ['closingbalance', 'endingbalance', 'currentbalance', 'netbalance', 'balanceamount', 'closingamount', 'currentyearbalance', 'balance', 'amount'],
  closingDirection: ['closingdrcr', 'balancedrcr', 'debitcreditindicator', 'drcrindicator', 'balancedirection', 'closingdirection', 'drcr', 'debitcredit'],
  comparativeDebit: ['comparativedebit', 'comparativebalancedebit', 'previousdebit', 'previousyeardebit', 'prioryeardebit', 'priorperioddebit', 'previousdr', 'pydebit'],
  comparativeCredit: ['comparativecredit', 'comparativebalancecredit', 'previouscredit', 'previousyearcredit', 'prioryearcredit', 'priorperiodcredit', 'previouscr', 'pycredit'],
  comparativeBalance: ['comparativebalance', 'previousbalance', 'previousyearbalance', 'prioryearbalance', 'priorperiodbalance', 'pybalance'],
  comparativeDirection: ['comparativedrcr', 'previousdrcr', 'prioryeardrcr', 'previousbalancedirection', 'comparativedirection']
};

const rolePriority: TrialBalanceColumnRole[] = [
  'name', 'code', 'subGroup', 'group',
  'openingDebit', 'openingCredit', 'debit', 'credit',
  'comparativeDebit', 'comparativeCredit', 'comparativeBalance', 'comparativeDirection',
  'closingDebit', 'closingCredit', 'closingBalance', 'closingDirection'
];

function parseDelimited(text: string, delimiter: string): string[][] {
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
    } else if (character === delimiter && !quoted) {
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
  if (quoted) throw new Error('The delimited file contains an unterminated quoted field.');
  return rows;
}

function detectDelimiter(text: string): string {
  const candidates = [',', '\t', ';', '|'];
  const scores = new Map(candidates.map((delimiter) => [delimiter, 0]));
  let quoted = false;
  let logicalRows = 0;
  for (let index = 0; index < text.length && logicalRows < 20; index += 1) {
    const character = text[index] ?? '';
    const next = text[index + 1] ?? '';
    if (character === '"') {
      if (quoted && next === '"') index += 1;
      else quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (scores.has(character)) scores.set(character, (scores.get(character) ?? 0) + 1);
    if (character === '\n') logicalRows += 1;
  }
  return [...scores.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? ',';
}

function normaliseHeader(value: TrialBalanceCellValue): string {
  return String(value ?? '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

function displayCell(value: TrialBalanceCellValue): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').replace(/^\uFEFF/, '').trim();
}

function aliasScore(header: string, role: TrialBalanceColumnRole): number {
  if (!header) return 0;
  const aliases = roleAliases[role];
  if (aliases.includes(header)) return 100;
  const contained = aliases.filter((alias) => alias.length >= 6 && (header.startsWith(alias) || header.endsWith(alias)));
  if (contained.length) return 70 + Math.max(...contained.map((alias) => alias.length / 100));
  if (role === 'comparativeDebit' && /(previous|prior|comparative|py).*(debit|dr)$/.test(header)) return 90;
  if (role === 'comparativeCredit' && /(previous|prior|comparative|py).*(credit|cr)$/.test(header)) return 90;
  if (role === 'closingDebit' && /(closing|ending|current|balance|fy\d).*(debit|dr)$/.test(header)) return 80;
  if (role === 'closingCredit' && /(closing|ending|current|balance|fy\d).*(credit|cr)$/.test(header)) return 80;
  if (role === 'name' && /(ledger|account|gl).*(name|description|title)$/.test(header)) return 80;
  return 0;
}

function autoMapColumns(labels: string[]): TrialBalanceColumnMap {
  const normalised = labels.map(normaliseHeader);
  const used = new Set<number>();
  const columnMap: TrialBalanceColumnMap = {};
  for (const role of rolePriority) {
    let bestIndex: number | undefined;
    let bestScore = 0;
    for (let index = 0; index < normalised.length; index += 1) {
      if (used.has(index)) continue;
      const score = aliasScore(normalised[index] ?? '', role);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    if (bestIndex !== undefined && bestScore >= 70) {
      columnMap[role] = bestIndex;
      used.add(bestIndex);
    }
  }
  return columnMap;
}

function combinedHeaderLabels(data: TrialBalanceCellValue[][], headerIndex: number, depth: 1 | 2): string[] {
  const current = data[headerIndex] ?? [];
  if (depth === 1 || headerIndex === 0) return current.map(displayCell);
  const previous = data[headerIndex - 1] ?? [];
  const length = Math.max(previous.length, current.length);
  const labels: string[] = [];
  let carried = '';
  for (let index = 0; index < length; index += 1) {
    const group = displayCell(previous[index]);
    if (group) carried = group;
    const detail = displayCell(current[index]);
    labels.push([carried, detail].filter((value, itemIndex, values) => value && values.indexOf(value) === itemIndex).join(' ').trim());
  }
  return labels;
}

function hasCurrentLayout(map: TrialBalanceColumnMap): boolean {
  const closingPair = map.closingDebit !== undefined && map.closingCredit !== undefined;
  const movementPair = map.debit !== undefined && map.credit !== undefined;
  return closingPair || movementPair || map.closingBalance !== undefined;
}

function sourceValueLooksNumeric(value: TrialBalanceCellValue): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    rupeesToPaise(value);
    return true;
  } catch {
    return false;
  }
}

interface LayoutCandidate {
  sheetIndex: number;
  headerIndex: number;
  headerDepth: 1 | 2;
  labels: string[];
  columnMap: TrialBalanceColumnMap;
  score: number;
}

function scoreCandidate(sheet: TrialBalanceSourceSheet, sheetIndex: number, headerIndex: number, headerDepth: 1 | 2): LayoutCandidate {
  const labels = combinedHeaderLabels(sheet.data, headerIndex, headerDepth);
  const map = autoMapColumns(labels);
  const nonEmptyHeaders = labels.filter((label) => label.trim()).length;
  let score = Math.min(nonEmptyHeaders, 8) * 0.15;
  if (map.name !== undefined) score += 8;
  if (map.code !== undefined) score += 1;
  if (map.group !== undefined || map.subGroup !== undefined) score += 0.5;
  if (map.closingDebit !== undefined && map.closingCredit !== undefined) score += 8;
  else if (map.debit !== undefined && map.credit !== undefined) score += 7;
  else if (map.closingBalance !== undefined) score += 7;
  if (map.comparativeDebit !== undefined && map.comparativeCredit !== undefined) score += 2;
  else if (map.comparativeBalance !== undefined) score += 1.5;
  if (/trial\s*balance|\btb\b/i.test(sheet.sheet)) score += 1.5;
  const sampleRows = sheet.data.slice(headerIndex + 1, headerIndex + 11);
  const evidenceRows = sampleRows.filter((row) => row.some((value) => typeof value === 'string' && value.trim() !== '') && row.some(sourceValueLooksNumeric)).length;
  score += Math.min(evidenceRows, 4) * 0.5;
  return { sheetIndex, headerIndex, headerDepth, labels, columnMap: map, score };
}

function detectLayout(sheets: TrialBalanceSourceSheet[], options: TrialBalanceImportOptions): LayoutCandidate {
  const requestedSheetIndex = options.worksheetName === undefined ? undefined : sheets.findIndex((sheet) => sheet.sheet === options.worksheetName);
  if (options.worksheetName !== undefined && requestedSheetIndex === -1) throw new Error(`Worksheet “${options.worksheetName}” was not found in the workbook.`);
  const candidates: LayoutCandidate[] = [];
  const allSheetIndexes = sheets.map((_, index) => index);
  const automaticSheetIndexes = allSheetIndexes.filter((index) => !/\b(instructions?|read\s*me|guide|worked\s*example|example|sample)\b/i.test(sheets[index]?.sheet ?? ''));
  const sheetIndexes = requestedSheetIndex === undefined
    ? automaticSheetIndexes.length ? automaticSheetIndexes : allSheetIndexes
    : [requestedSheetIndex];
  for (const sheetIndex of sheetIndexes) {
    const sheet = sheets[sheetIndex];
    if (!sheet) continue;
    const requestedHeaderIndex = options.headerRowNumber === undefined ? undefined : options.headerRowNumber - 1;
    if (requestedHeaderIndex !== undefined && (requestedHeaderIndex < 0 || requestedHeaderIndex >= sheet.data.length)) throw new Error(`Header row ${options.headerRowNumber} is outside worksheet “${sheet.sheet}”.`);
    const headerIndexes = requestedHeaderIndex === undefined ? Array.from({ length: Math.min(50, sheet.data.length) }, (_, index) => index) : [requestedHeaderIndex];
    for (const headerIndex of headerIndexes) {
      const depths: Array<1 | 2> = options.headerDepth ? [options.headerDepth] : headerIndex > 0 ? [1, 2] : [1];
      for (const depth of depths) candidates.push(scoreCandidate(sheet, sheetIndex, headerIndex, depth));
    }
  }
  const best = candidates.sort((left, right) => right.score - left.score || left.headerIndex - right.headerIndex)[0];
  if (!best) throw new Error('The file does not contain a readable worksheet.');
  return best;
}

function cellText(row: TrialBalanceCellValue[], index: number | undefined): string {
  return index === undefined ? '' : displayCell(row[index]);
}

function cellMoney(row: TrialBalanceCellValue[], index: number | undefined): number {
  if (index === undefined) return 0;
  const value = row[index];
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'boolean' || value instanceof Date) throw new TypeError('Expected a monetary number.');
  return rupeesToPaise(value);
}

function hasValue(row: TrialBalanceCellValue[], index: number | undefined): boolean {
  if (index === undefined) return false;
  const value = row[index];
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function directionFromValue(value: TrialBalanceCellValue): 'DEBIT' | 'CREDIT' | undefined {
  const normalised = normaliseHeader(value);
  if (['dr', 'd', 'debit', 'debtor'].includes(normalised)) return 'DEBIT';
  if (['cr', 'c', 'credit', 'creditor'].includes(normalised)) return 'CREDIT';
  return undefined;
}

function suffixDirection(value: TrialBalanceCellValue): 'DEBIT' | 'CREDIT' | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/(?:^|\s)(dr|cr)$/i)?.[1]?.toLowerCase();
  return match === 'dr' ? 'DEBIT' : match === 'cr' ? 'CREDIT' : undefined;
}

function directionalMoney(row: TrialBalanceCellValue[], balanceIndex: number | undefined, directionIndex: number | undefined, convention: SignedBalanceConvention | undefined): number {
  if (balanceIndex === undefined || !hasValue(row, balanceIndex)) return 0;
  const raw = row[balanceIndex];
  const parsed = cellMoney(row, balanceIndex);
  const direction = directionFromValue(row[directionIndex ?? -1]) ?? suffixDirection(raw);
  if (direction) return direction === 'DEBIT' ? Math.abs(parsed) : -Math.abs(parsed);
  if (convention === 'DEBIT_POSITIVE') return parsed;
  if (convention === 'CREDIT_POSITIVE') return -parsed;
  throw new TypeError('Select whether positive signed balances represent debit or credit.');
}

function hasDirectionalEvidence(data: TrialBalanceCellValue[][], startIndex: number, balanceIndex: number, directionIndex?: number): boolean {
  let populated = 0;
  let directional = 0;
  for (const row of data.slice(startIndex, startIndex + 200)) {
    if (!hasValue(row, balanceIndex)) continue;
    populated += 1;
    if (directionFromValue(row[directionIndex ?? -1]) || suffixDirection(row[balanceIndex])) directional += 1;
  }
  return populated > 0 && directional === populated;
}

function isRepeatedHeader(name: string): boolean {
  return roleAliases.name.includes(normaliseHeader(name));
}

function isSummaryRow(name: string): boolean {
  return /^(grand\s+total|total|net\s+total|trial\s+balance\s+total|closing\s+balance\s+total|difference)$/i.test(name.trim());
}

function duplicateMappingErrors(map: TrialBalanceColumnMap): string[] {
  const byIndex = new Map<number, TrialBalanceColumnRole[]>();
  for (const role of trialBalanceColumnRoles.map((item) => item.key)) {
    const index = map[role];
    if (index === undefined) continue;
    byIndex.set(index, [...(byIndex.get(index) ?? []), role]);
  }
  return [...byIndex.entries()].filter(([, roles]) => roles.length > 1).map(([index, roles]) => `Column ${index + 1} is assigned more than once (${roles.join(', ')}).`);
}

export function suggestTaxonomyCode(name: string, group: string, subGroup: string): string | undefined {
  const value = `${name} ${group} ${subGroup}`.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/share capital/, 'BS-EQ-CAPITAL'], [/reserve|retained|surplus/, 'BS-EQ-RESERVES'],
    [/term loan|long.?term borrow/, 'BS-NCL-BORROWING'], [/working capital|cash credit|short.?term borrow/, 'BS-CL-BORROWING'],
    [/trade payable|creditor/, 'BS-CL-PAYABLE'], [/tax payable|current tax liab/, 'BS-CL-TAX'],
    [/warranty|short.?term provision/, 'BS-CL-PROVISION'], [/employee benefit|gratuity/, 'BS-NCL-EMPLOYEE'],
    [/other current liab|statutory due|accrued/, 'BS-CL-OTHER'], [/plant|machinery|building|furniture|vehicle|ppe|fixed asset/, 'BS-NCA-PPE'],
    [/software|intangible|goodwill/, 'BS-NCA-INTANGIBLE'], [/investment/, 'BS-NCA-INVESTMENT'],
    [/deferred tax asset/, 'BS-NCA-DTA'], [/inventory|stock|raw material|finished good/, 'BS-CA-INVENTORY'],
    [/trade receivable|debtor/, 'BS-CA-RECEIVABLE'], [/cash|bank/, 'BS-CA-CASH'],
    [/prepaid|prepayment/, 'BS-CA-PREPAID'], [/gst recover|other current asset|advance/, 'BS-CA-OTHER'],
    [/revenue|sales|sale of/, 'PL-REV-OPERATIONS'], [/other income|interest income|miscellaneous income/, 'PL-REV-OTHER'],
    [/material consumed|purchase|raw material/, 'PL-EXP-MATERIAL'], [/salary|wage|employee|staff welfare/, 'PL-EXP-EMPLOYEE'],
    [/depreciation|amortisation/, 'PL-EXP-DEPRECIATION'], [/finance cost|interest on/, 'PL-EXP-FINANCE'],
    [/current tax expense/, 'PL-EXP-TAX-CURRENT'], [/deferred tax expense/, 'PL-EXP-TAX-DEFERRED'],
    [/expense|administration|selling|manufacturing/, 'PL-EXP-OTHER']
  ];
  return rules.find(([pattern]) => pattern.test(value))?.[1];
}

function inferConfidence(score: number, mappingRequired: boolean): TrialBalancePreview['detectionConfidence'] {
  if (!mappingRequired && score >= 16) return 'HIGH';
  return score >= 8 ? 'MEDIUM' : 'LOW';
}

export function parseTrialBalanceSheets(
  sheets: TrialBalanceSourceSheet[],
  input: { fileName: string; sourceType: 'CSV' | 'XLSX'; contentHash?: string },
  options: TrialBalanceImportOptions = {}
): TrialBalancePreview {
  if (!sheets.length) throw new Error('The file does not contain a worksheet.');
  if (sheets.reduce((total, sheet) => total + sheet.data.length, 0) > 200_000) throw new Error('The workbook exceeds the 200,000-row safety limit across all worksheets.');
  const candidate = detectLayout(sheets, options);
  const selected = sheets[candidate.sheetIndex];
  if (!selected) throw new Error('The selected worksheet could not be read.');
  if (selected.data.length > 50_001) throw new Error('The selected worksheet exceeds the 50,000-data-row import limit.');

  const headerDepth = options.headerDepth ?? candidate.headerDepth;
  const labels = combinedHeaderLabels(selected.data, candidate.headerIndex, headerDepth);
  const columnMap = options.columnMap ? { ...options.columnMap } : autoMapColumns(labels);
  const warnings: string[] = [];
  const errors = duplicateMappingErrors(columnMap);
  const hasName = columnMap.name !== undefined;
  const hasCurrent = hasCurrentLayout(columnMap);
  const signedNeedsConvention = columnMap.closingBalance !== undefined
    && !hasDirectionalEvidence(selected.data, candidate.headerIndex + 1, columnMap.closingBalance, columnMap.closingDirection)
    && options.signedBalanceConvention === undefined;
  const mappingRequired = !hasName || !hasCurrent || signedNeedsConvention || errors.length > 0;
  const isStandardFormat = candidate.sheetIndex === 0 && candidate.headerIndex === 0 && headerDepth === 1
    && trialBalanceTemplateHeaders.every((header, index) => displayCell((selected.data[0] ?? [])[index]) === header)
    && labels.filter(Boolean).length === trialBalanceTemplateHeaders.length;
  const availableColumns: TrialBalanceAvailableColumn[] = labels.map((label, index) => ({
    index,
    label: label || `Column ${index + 1}`,
    samples: selected.data.slice(candidate.headerIndex + 1, candidate.headerIndex + 8).map((row) => displayCell(row[index])).filter(Boolean).slice(0, 3)
  }));

  if (!hasName) warnings.push('Choose the column containing the ledger or account name.');
  if (!hasCurrent) warnings.push('Map either closing debit and closing credit, a signed closing balance, or period debit and credit movements.');
  if (signedNeedsConvention) warnings.push('The signed balance column has no complete Dr/Cr indicator. Select its positive-value convention before importing.');
  if (columnMap.code === undefined && hasName) warnings.push('No ledger-code column was found. White Horse will generate stable import codes from source row numbers.');

  const confidence = inferConfidence(candidate.score, mappingRequired);
  const commonResult = {
    fileName: input.fileName,
    sourceType: input.sourceType,
    detectedHeaders: labels.filter(Boolean),
    worksheetNames: sheets.map((sheet) => sheet.sheet),
    selectedWorksheet: selected.sheet,
    headerRowNumber: candidate.headerIndex + 1,
    headerDepth,
    availableColumns,
    columnMap,
    signedBalanceConvention: options.signedBalanceConvention,
    mappingRequired,
    detectionConfidence: confidence,
    detectionSummary: mappingRequired
      ? 'Review the detected worksheet and header row, then map the required columns.'
      : `${confidence.toLowerCase()}-confidence match on worksheet “${selected.sheet}”, header row ${candidate.headerIndex + 1}.`,
    contentHash: input.contentHash ?? 'test-content'
  } satisfies Omit<TrialBalancePreview, 'formatStatus' | 'rows' | 'debitTotalPaise' | 'creditTotalPaise' | 'differencePaise' | 'errors' | 'warnings'>;

  if (mappingRequired) {
    return { ...commonResult, formatStatus: 'NEEDS_MAPPING', rows: [], debitTotalPaise: 0, creditTotalPaise: 0, differencePaise: 0, errors, warnings };
  }

  const parsedRows: ParsedTrialBalanceRow[] = [];
  const seenCodes = new Set<string>();
  let generatedCodeCount = 0;
  let ignoredHeadingCount = 0;
  let ignoredSummaryCount = 0;
  let normalisedNegativeSideCount = 0;
  const currentAmountIndexes = [columnMap.openingDebit, columnMap.openingCredit, columnMap.debit, columnMap.credit, columnMap.closingDebit, columnMap.closingCredit, columnMap.closingBalance];

  for (let index = candidate.headerIndex + 1; index < selected.data.length; index += 1) {
    const row = selected.data[index] ?? [];
    const suppliedCode = cellText(row, columnMap.code);
    const name = cellText(row, columnMap.name);
    const hasAmount = currentAmountIndexes.some((column) => hasValue(row, column));
    if (!suppliedCode && !name && !hasAmount) continue;
    if (isRepeatedHeader(name)) continue;
    if (isSummaryRow(name)) { ignoredSummaryCount += 1; continue; }
    if (!hasAmount) { ignoredHeadingCount += 1; continue; }
    if (!name) { errors.push(`Row ${index + 1}: a ledger name is required for a row containing balances.`); continue; }
    const code = suppliedCode || `AUTO-${String(index + 1).padStart(5, '0')}`;
    if (!suppliedCode) generatedCodeCount += 1;
    if (seenCodes.has(code.toLowerCase())) { errors.push(`Row ${index + 1}: duplicate ledger code ${code}.`); continue; }
    seenCodes.add(code.toLowerCase());
    try {
      const openingDebitRaw = cellMoney(row, columnMap.openingDebit);
      const openingCreditRaw = cellMoney(row, columnMap.openingCredit);
      const debitRaw = cellMoney(row, columnMap.debit);
      const creditRaw = cellMoney(row, columnMap.credit);
      const openingDebitPaise = Math.abs(openingDebitRaw);
      const openingCreditPaise = Math.abs(openingCreditRaw);
      const debitPaise = Math.abs(debitRaw);
      const creditPaise = Math.abs(creditRaw);
      if ([openingDebitRaw, openingCreditRaw, debitRaw, creditRaw].some((value) => value < 0)) normalisedNegativeSideCount += 1;
      const calculated = openingDebitPaise - openingCreditPaise + debitPaise - creditPaise;

      let signedCurrentPaise: number;
      if (columnMap.closingDebit !== undefined && columnMap.closingCredit !== undefined) {
        const closingDebitRaw = cellMoney(row, columnMap.closingDebit);
        const closingCreditRaw = cellMoney(row, columnMap.closingCredit);
        if (closingDebitRaw < 0 || closingCreditRaw < 0) normalisedNegativeSideCount += 1;
        const closingDebitPaise = Math.abs(closingDebitRaw);
        const closingCreditPaise = Math.abs(closingCreditRaw);
        if (closingDebitPaise && closingCreditPaise) { errors.push(`Row ${index + 1}: closing debit and credit cannot both be non-zero.`); continue; }
        signedCurrentPaise = closingDebitPaise - closingCreditPaise;
        if (columnMap.debit !== undefined && columnMap.credit !== undefined && calculated !== signedCurrentPaise) warnings.push(`Row ${index + 1}: reported closing balance does not equal opening plus period movements.`);
      } else if (columnMap.closingBalance !== undefined) {
        signedCurrentPaise = directionalMoney(row, columnMap.closingBalance, columnMap.closingDirection, options.signedBalanceConvention);
      } else {
        signedCurrentPaise = calculated;
      }

      let signedComparativePaise = 0;
      if (columnMap.comparativeDebit !== undefined && columnMap.comparativeCredit !== undefined) {
        const comparativeDebitRaw = cellMoney(row, columnMap.comparativeDebit);
        const comparativeCreditRaw = cellMoney(row, columnMap.comparativeCredit);
        if (comparativeDebitRaw < 0 || comparativeCreditRaw < 0) normalisedNegativeSideCount += 1;
        const comparativeDebitPaise = Math.abs(comparativeDebitRaw);
        const comparativeCreditPaise = Math.abs(comparativeCreditRaw);
        if (comparativeDebitPaise && comparativeCreditPaise) { errors.push(`Row ${index + 1}: comparative debit and credit cannot both be non-zero.`); continue; }
        signedComparativePaise = comparativeDebitPaise - comparativeCreditPaise;
      } else if (columnMap.comparativeBalance !== undefined) {
        signedComparativePaise = directionalMoney(row, columnMap.comparativeBalance, columnMap.comparativeDirection, options.signedBalanceConvention);
      }

      const group = cellText(row, columnMap.group);
      const subGroup = cellText(row, columnMap.subGroup);
      parsedRows.push({
        rowNumber: index + 1, code, name, group, subGroup,
        openingDebitPaise, openingCreditPaise, debitPaise, creditPaise,
        closingDebitPaise: Math.max(signedCurrentPaise, 0), closingCreditPaise: Math.max(-signedCurrentPaise, 0),
        comparativeDebitPaise: Math.max(signedComparativePaise, 0), comparativeCreditPaise: Math.max(-signedComparativePaise, 0),
        signedCurrentPaise, signedComparativePaise,
        suggestedTaxonomyCode: suggestTaxonomyCode(name, group, subGroup)
      });
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'invalid amount'}`);
    }
  }

  const debitTotalPaise = sumMoney(parsedRows.map((row) => row.closingDebitPaise));
  const creditTotalPaise = sumMoney(parsedRows.map((row) => row.closingCreditPaise));
  const differencePaise = debitTotalPaise - creditTotalPaise;
  if (!parsedRows.length) errors.push('No ledger rows with balances were found below the selected header.');
  if (differencePaise !== 0) errors.push(`Trial Balance difference is ${differencePaise} paise.`);
  if (generatedCodeCount) warnings.push(`${generatedCodeCount} ledger code${generatedCodeCount === 1 ? ' was' : 's were'} generated from source row numbers.`);
  if (ignoredHeadingCount) warnings.push(`${ignoredHeadingCount} heading or narration row${ignoredHeadingCount === 1 ? ' was' : 's were'} ignored because no balance was present.`);
  if (ignoredSummaryCount) warnings.push(`${ignoredSummaryCount} total row${ignoredSummaryCount === 1 ? ' was' : 's were'} excluded to prevent double counting.`);
  if (normalisedNegativeSideCount) warnings.push('Negative values found in dedicated debit/credit columns were treated as positive values on their stated side.');
  if (columnMap.comparativeDebit === undefined && columnMap.comparativeCredit === undefined && columnMap.comparativeBalance === undefined) warnings.push('No comparative balance columns were mapped; comparative balances will be zero until separately supplied.');
  if (!isStandardFormat) warnings.push('Adaptive import was used. Review the worksheet, header row, mapping, totals and sample ledgers before activation.');

  return {
    ...commonResult,
    mappingRequired: false,
    formatStatus: errors.length ? 'INVALID' : isStandardFormat ? 'STANDARD' : 'COMPATIBLE',
    rows: parsedRows,
    debitTotalPaise,
    creditTotalPaise,
    differencePaise,
    errors,
    warnings
  };
}

async function sheetsFromFile(file: File): Promise<TrialBalanceSourceSheet[]> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.csv') || lowerName.endsWith('.tsv') || lowerName.endsWith('.txt')) {
    const text = await file.text();
    return [{ sheet: lowerName.endsWith('.tsv') ? 'TSV import' : 'Delimited import', data: parseDelimited(text, lowerName.endsWith('.tsv') ? '\t' : detectDelimiter(text)) }];
  }
  if (lowerName.endsWith('.xlsx')) {
    const { default: readWorkbook } = await import('read-excel-file/browser');
    const sheets = await readWorkbook(file);
    return sheets.map((sheet) => ({ sheet: sheet.sheet, data: sheet.data as TrialBalanceCellValue[][] }));
  }
  throw new Error('Unsupported file type. Select an .xlsx, .csv, .tsv or delimited .txt file.');
}

export async function parseTrialBalanceFile(file: File, options: TrialBalanceImportOptions = {}): Promise<TrialBalancePreview> {
  if (file.size > 25 * 1024 * 1024) throw new Error('File exceeds the 25 MB safety limit.');
  const lowerName = file.name.toLowerCase();
  const sourceType = lowerName.endsWith('.xlsx') ? 'XLSX' : 'CSV';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sheets = await sheetsFromFile(file);
  return parseTrialBalanceSheets(sheets, { fileName: file.name, sourceType, contentHash: await sha256(bytes) }, options);
}

export async function activateTrialBalance(preview: TrialBalancePreview, companyId: string, periodId: string): Promise<void> {
  if (preview.mappingRequired || preview.errors.length || preview.differencePaise !== 0 || preview.rows.length === 0) throw new Error('Only a non-empty, balanced, fully mapped and error-free preview can be activated.');
  const period = await db.periods.get(periodId);
  if (!period || period.companyId !== companyId) throw new Error('Reporting period was not found.');
  const importId = crypto.randomUUID();
  const now = new Date().toISOString();
  const imported: TrialBalanceImport = {
    id: importId, companyId, periodId, fileName: preview.fileName, sourceType: preview.sourceType, importedAt: now,
    importedBy: 'demo-preparer', rowCount: preview.rows.length, debitTotalPaise: preview.debitTotalPaise,
    creditTotalPaise: preview.creditTotalPaise, differencePaise: preview.differencePaise, status: 'ACTIVE', contentHash: preview.contentHash
  };
  const ledgers: LedgerAccount[] = preview.rows.map((row) => ({
    id: crypto.randomUUID(), companyId, periodId, importId, code: row.code, name: row.name, group: row.group, subGroup: row.subGroup,
    openingDebitPaise: row.openingDebitPaise, openingCreditPaise: row.openingCreditPaise, debitPaise: row.debitPaise,
    creditPaise: row.creditPaise, closingDebitPaise: row.closingDebitPaise, closingCreditPaise: row.closingCreditPaise,
    signedCurrentPaise: row.signedCurrentPaise, signedComparativePaise: row.signedComparativePaise, active: true, sourceRow: row.rowNumber
  }));
  const mappings: LedgerMapping[] = ledgers.flatMap((ledger, index) => {
    const suggestion = preview.rows[index]?.suggestedTaxonomyCode;
    const node = suggestion ? taxonomyByCode.get(suggestion) : undefined;
    if (!suggestion || !node) return [];
    return [{
      id: crypto.randomUUID(), companyId, periodId, ledgerId: ledger.id, taxonomyCode: suggestion, status: 'DRAFT' as const,
      currentNonCurrent: node.currentNonCurrent, cashFlowClass: node.cashFlowClass, suggestionConfidence: 0.7,
      suggestionReason: 'Keyword/group suggestion; preparer and reviewer approval required.', updatedAt: now
    }];
  });
  const event = await nextAuditEvent({
    companyId, periodId, actorId: 'demo-preparer', actorRole: 'PREPARER', action: 'TB_IMPORT_ACTIVATED', entityType: 'TB_IMPORT', entityId: importId,
    reason: `Activated ${preview.fileName} from worksheet ${preview.selectedWorksheet}, header row ${preview.headerRowNumber}; previous import remains immutable and superseded.`
  });
  await db.transaction('rw', db.imports, db.ledgers, db.mappings, db.periods, db.auditEvents, async () => {
    await db.imports.update(period.activeImportId, { status: 'SUPERSEDED' });
    await db.imports.add(imported);
    await db.ledgers.bulkAdd(ledgers);
    if (mappings.length) await db.mappings.bulkAdd(mappings);
    await db.periods.update(periodId, { activeImportId: importId, status: 'MAPPING_IN_PROGRESS', updatedAt: now });
    await db.auditEvents.add(event);
  });
}
