import { sumMoney } from './money';
import { calculateFinancialStatements } from './statements';
import type {
  Adjustment,
  AdjustmentLine,
  LedgerAccount,
  LedgerMapping,
  ReportingPeriod,
  Severity,
  TaxonomyNode,
  ValidationResult
} from './types';

interface ValidationContext {
  period: ReportingPeriod;
  ledgers: LedgerAccount[];
  mappings: LedgerMapping[];
  adjustments: Adjustment[];
  adjustmentLines: AdjustmentLine[];
  taxonomy: TaxonomyNode[];
}
function finding(
  context: ValidationContext,
  ruleId: string,
  severity: Severity,
  title: string,
  message: string,
  evidence: string,
  suggestedAction: string,
  extra: Partial<ValidationResult> = {}
): ValidationResult {
  const entityKey = extra.entityId ?? 'workspace';
  return {
    id: `auto-${ruleId}-${entityKey}`,
    companyId: context.period.companyId,
    periodId: context.period.id,
    ruleId,
    severity,
    title,
    message,
    evidence,
    suggestedAction,
    status: 'OPEN',
    generatedAt: new Date().toISOString(),
    ...extra
  };
}

export function validateWorkspace(context: ValidationContext): ValidationResult[] {
  const results: ValidationResult[] = [];
  if (context.ledgers.length === 0) {
    results.push(
      finding(
        context,
        'TB-000',
        'BLOCKING',
        'Trial Balance has not been imported',
        'The active company workspace does not yet contain ledger balances.',
        'Active Trial Balance row count: 0.',
        'Download the prescribed template, populate a balanced Trial Balance and activate the import.',
        { entityType: 'TB_IMPORT', entityId: context.period.activeImportId }
      )
    );
  }
  const tbDifference = sumMoney(context.ledgers.map((ledger) => ledger.signedCurrentPaise));
  if (tbDifference !== 0) {
    results.push(
      finding(
        context,
        'TB-001',
        'BLOCKING',
        'Trial Balance does not balance',
        'Closing debits and credits differ in the active import.',
        `Signed difference: ${tbDifference} paise.`,
        'Correct the source file or column/sign mapping. Do not create a suspense plug.',
        { amountPaise: tbDifference, entityType: 'TB_IMPORT', entityId: context.ledgers[0]?.importId }
      )
    );
  }

  const mappingByLedger = new Map(context.mappings.map((mapping) => [mapping.ledgerId, mapping]));
  const taxonomyByCode = new Map(context.taxonomy.map((node) => [node.code, node]));
  for (const ledger of context.ledgers) {
    const mapping = mappingByLedger.get(ledger.id);
    if (!mapping && Math.abs(ledger.signedCurrentPaise) >= context.period.materialityPaise) {
      results.push(
        finding(
          context,
          'MAP-001',
          'BLOCKING',
          'Material ledger is unmapped',
          `${ledger.code} · ${ledger.name} has no approved statement mapping.`,
          `Absolute balance: ${Math.abs(ledger.signedCurrentPaise)} paise.`,
          'Map the ledger to an active leaf taxonomy node and submit it for review.',
          { amountPaise: ledger.signedCurrentPaise, entityType: 'LEDGER', entityId: ledger.id }
        )
      );
      continue;
    }
    if (!mapping) continue;
    const node = taxonomyByCode.get(mapping.taxonomyCode);
    if (!node) {
      results.push(
        finding(
          context,
          'MAP-002',
          'ERROR',
          'Mapping points to an unavailable taxonomy node',
          `${ledger.code} · ${ledger.name} references ${mapping.taxonomyCode}.`,
          'The taxonomy node was not found in the active taxonomy version.',
          'Select an active Division I leaf node and reapprove the mapping.',
          { entityType: 'MAPPING', entityId: mapping.id }
        )
      );
      continue;
    }
    const displayAmount = ledger.signedCurrentPaise * (node.normalBalance === 'CREDIT' ? -1 : 1);
    if (displayAmount < -context.period.materialityPaise) {
      results.push(
        finding(
          context,
          'MAP-003',
          'WARNING',
          'Ledger balance is opposite to the mapped head',
          `${ledger.code} · ${ledger.name} has a material ${ledger.signedCurrentPaise > 0 ? 'debit' : 'credit'} balance under a ${node.normalBalance.toLowerCase()}-normal head.`,
          `Mapped to ${node.code} · ${node.label}.`,
          'Verify the sign, mapping, and whether separate presentation or disclosure is required.',
          { amountPaise: ledger.signedCurrentPaise, entityType: 'LEDGER', entityId: ledger.id }
        )
      );
    }
  }

  for (const adjustment of context.adjustments) {
    const lines = context.adjustmentLines.filter((line) => line.adjustmentId === adjustment.id);
    const debit = sumMoney(lines.map((line) => line.debitPaise));
    const credit = sumMoney(lines.map((line) => line.creditPaise));
    if (debit !== credit) {
      results.push(
        finding(
          context,
          'ADJ-001',
          'BLOCKING',
          'Adjustment is not balanced',
          `${adjustment.referenceNumber} has unequal debit and credit totals.`,
          `Debit ${debit} paise; credit ${credit} paise; difference ${debit - credit} paise.`,
          'Correct the journal lines before submission or posting.',
          { amountPaise: debit - credit, entityType: 'ADJUSTMENT', entityId: adjustment.id }
        )
      );
    }
    if (adjustment.status === 'SUBMITTED') {
      results.push(
        finding(
          context,
          'ADJ-003',
          'WARNING',
          'Submitted adjustment awaits review',
          `${adjustment.referenceNumber} has been submitted but does not affect the adjusted Trial Balance until approved and posted.`,
          adjustment.narration,
          'Reviewer should approve/post or reject the adjustment explicitly.',
          { entityType: 'ADJUSTMENT', entityId: adjustment.id }
        )
      );
    }
  }

  const statements = calculateFinancialStatements(context);
  if (statements.totals.balanceSheetDifference !== 0) {
    results.push(
      finding(
        context,
        'BS-001',
        'BLOCKING',
        'Balance Sheet does not balance',
        'Total assets do not equal total equity and liabilities after the current-profit bridge.',
        `Difference: ${statements.totals.balanceSheetDifference} paise.`,
        'Trace missing mappings, normal-balance signs, adjustments, and the profit bridge.',
        { amountPaise: statements.totals.balanceSheetDifference, entityType: 'STATEMENT', entityId: 'BALANCE_SHEET' }
      )
    );
  }
  if (statements.totals.cashFlowDifference !== 0) {
    results.push(
      finding(
        context,
        'CF-001',
        'BLOCKING',
        'Cash Flow Statement does not reconcile',
        'The calculated cash movement differs from the movement in cash and cash equivalents.',
        `Difference: ${statements.totals.cashFlowDifference} paise.`,
        'Review cash-flow classifications and explicit non-ledger cash-flow inputs.',
        { amountPaise: statements.totals.cashFlowDifference, entityType: 'STATEMENT', entityId: 'CASH_FLOW' }
      )
    );
  }

  if (results.length === 0) {
    results.push(
      finding(
        context,
        'REV-000',
        'INFO',
        'Core automated reconciliations passed',
        'The active TB, mappings, posted adjustments, Balance Sheet, and cash-flow closing cash reconcile.',
        'Automated checks do not replace disclosure and professional review.',
        'Complete the disclosure checklist and reviewer sign-off before finalisation.'
      )
    );
  }

  return results;
}

export function ragStatus(results: ValidationResult[]): 'RED' | 'AMBER' | 'GREEN' {
  const open = results.filter((result) => result.status === 'OPEN');
  if (open.some((result) => result.severity === 'BLOCKING' || result.severity === 'ERROR')) return 'RED';
  if (open.some((result) => result.severity === 'WARNING')) return 'AMBER';
  return 'GREEN';
}

export function severityRank(severity: Severity): number {
  return { BLOCKING: 0, ERROR: 1, WARNING: 2, INFO: 3 }[severity];
}
