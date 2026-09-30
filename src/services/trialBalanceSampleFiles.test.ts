/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { demoPeriod } from '../data/demo';
import { taxonomy, taxonomyByCode } from '../data/taxonomy';
import { createCompanyWorkspace, db, initializeDatabase, loadWorkspace } from '../db';
import { calculateFinancialStatements } from '../domain/statements';
import type { LedgerAccount, LedgerMapping } from '../domain/types';
import { validateWorkspace } from '../domain/validation';
import { activateTrialBalance, parseTrialBalanceFile, suggestTaxonomyCode } from './trialBalanceImport';

type SampleRow = [string, string, string, string, number, number];
interface SampleSeed { fileName: string; company: string; industry: string; rows: SampleRow[] }
const samples = JSON.parse(
  await readFile(join(process.cwd(), 'tools', 'sample-trial-balances.json'), 'utf8')
) as SampleSeed[];

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
  await initializeDatabase();
});

afterEach(async () => {
  db.close();
  await db.delete();
});

describe('downloadable sample Trial Balances', () => {
  for (const [sampleIndex, sample] of samples.entries()) {
    it(`imports and reconciles ${sample.fileName} end-to-end`, async () => {
      const workbook = await readFile(join(process.cwd(), 'public', 'samples', sample.fileName));
      const preview = await parseTrialBalanceFile(new File([new Uint8Array(workbook)], sample.fileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));

      expect(preview.selectedWorksheet).toBe('Trial Balance Import');
      expect(preview.formatStatus).toBe('STANDARD');
      expect(preview.mappingRequired).toBe(false);
      expect(preview.errors).toEqual([]);
      expect(preview.warnings).toEqual([]);
      expect(preview.rows).toHaveLength(sample.rows.length);
      expect(preview.differencePaise).toBe(0);
      expect(preview.debitTotalPaise).toBe(preview.creditTotalPaise);
      expect(preview.rows.reduce((total, row) => total + row.signedComparativePaise, 0)).toBe(0);

      const ledgers: LedgerAccount[] = preview.rows.map((row, index) => {
        const source = sample.rows[index];
        expect(source).toBeDefined();
        expect([row.code, row.name, row.group, row.subGroup, row.signedCurrentPaise, row.signedComparativePaise])
          .toEqual([source![0], source![1], source![2], source![3], source![4] * 100, source![5] * 100]);
        expect(row.suggestedTaxonomyCode).toBeTruthy();
        return {
          id: `sample-ledger-${index}`, companyId: 'sample-company', periodId: 'sample-period', importId: 'sample-import',
          code: row.code, name: row.name, group: row.group, subGroup: row.subGroup,
          openingDebitPaise: row.openingDebitPaise, openingCreditPaise: row.openingCreditPaise,
          debitPaise: row.debitPaise, creditPaise: row.creditPaise,
          closingDebitPaise: row.closingDebitPaise, closingCreditPaise: row.closingCreditPaise,
          signedCurrentPaise: row.signedCurrentPaise, signedComparativePaise: row.signedComparativePaise,
          active: true, sourceRow: row.rowNumber
        };
      });
      const mappings: LedgerMapping[] = ledgers.map((ledger, index) => {
        const code = preview.rows[index]?.suggestedTaxonomyCode;
        const node = code ? taxonomyByCode.get(code) : undefined;
        expect(node).toBeDefined();
        return {
          id: `sample-mapping-${index}`, companyId: ledger.companyId, periodId: ledger.periodId, ledgerId: ledger.id,
          taxonomyCode: node!.code, status: 'DRAFT', currentNonCurrent: node!.currentNonCurrent,
          cashFlowClass: node!.cashFlowClass, suggestionConfidence: 0.7, suggestionReason: 'Test of actual import suggestion', updatedAt: '2026-09-30T00:00:00.000Z'
        };
      });
      const context = {
        period: {
          ...demoPeriod, id: 'sample-period', companyId: 'sample-company', activeImportId: 'sample-import',
          cashFlowInputs: {
            incomeTaxesPaid: 0, interestPaid: 0, interestIncomeReceived: 0,
            ppePurchases: 0, ppeDisposalProceeds: 0, intangiblePurchases: 0,
            investmentPurchases: 0, dividendsPaid: 0
          },
          comparativeCashFlowSummary: { operating: 0, investing: 0, financing: 0, openingCash: 0 }
        },
        ledgers, mappings, adjustments: [], adjustmentLines: [], taxonomy
      };
      const statements = calculateFinancialStatements(context);
      expect(statements.totals.balanceSheetDifference).toBe(0);
      expect(statements.totals.comparativeBalanceSheetDifference).toBe(0);
      expect(statements.totals.cashFlowDifference).toBe(0);
      expect(statements.totals.currentProfit).toBeGreaterThan(0);
      expect(statements.totals.comparativeProfit).toBeGreaterThan(0);
      expect(validateWorkspace(context).map((finding) => [finding.ruleId, finding.severity])).toEqual([['REV-000', 'INFO']]);

      const companyId = await createCompanyWorkspace({
        legalName: sample.company, tradeName: sample.company.replace(' Private Limited', ''),
        cin: `U62010DL2026PTC65432${sampleIndex}`,
        registeredOffice: 'New Delhi, India', industry: sample.industry, displayScale: 'LAKHS',
        periodLabel: 'FY 2025–26', startDate: '2025-04-01', endDate: '2026-03-31',
        comparativeLabel: 'FY 2024–25', comparativeStartDate: '2024-04-01', comparativeEndDate: '2025-03-31',
        materialityPaise: 10_000_000
      });
      const initial = await loadWorkspace(companyId);
      expect(initial).toBeDefined();
      await activateTrialBalance(preview, companyId, initial!.period.id);
      const imported = await loadWorkspace(companyId);
      expect(imported?.activeImport.fileName).toBe(sample.fileName);
      expect(imported?.ledgers).toHaveLength(sample.rows.length);
      expect(imported?.mappings).toHaveLength(sample.rows.length);
      const importedContext = {
        period: imported!.period, ledgers: imported!.ledgers, mappings: imported!.mappings,
        adjustments: imported!.adjustments, adjustmentLines: imported!.adjustmentLines, taxonomy
      };
      expect(calculateFinancialStatements(importedContext).totals.cashFlowDifference).toBe(0);
      expect(validateWorkspace(importedContext).map((finding) => [finding.ruleId, finding.severity])).toEqual([['REV-000', 'INFO']]);
    });
  }
});

describe('classification guardrails for ambiguous ledger names', () => {
  it('uses the source expense group before balance-sheet keywords', () => {
    expect(suggestTaxonomyCode('Employee benefits expense', 'Expenses', 'Employee benefits')).toBe('PL-EXP-EMPLOYEE');
    expect(suggestTaxonomyCode('Raw materials consumed', 'Expenses', 'Materials consumed')).toBe('PL-EXP-MATERIAL');
    expect(suggestTaxonomyCode('Provision for employee benefits', 'Liabilities', 'Long-term provisions')).toBe('BS-NCL-EMPLOYEE');
    expect(suggestTaxonomyCode('Raw material inventory', 'Assets', 'Inventories')).toBe('BS-CA-INVENTORY');
  });
});
