import { safeRatio, sumMoney } from './money';
import type {
  Adjustment,
  AdjustmentLine,
  FinancialStatements,
  KpiSet,
  LedgerAccount,
  LedgerMapping,
  Money,
  ReportLine,
  ReportingPeriod,
  TaxonomyNode
} from './types';

interface StatementContext {
  period: ReportingPeriod;
  ledgers: LedgerAccount[];
  mappings: LedgerMapping[];
  adjustments: Adjustment[];
  adjustmentLines: AdjustmentLine[];
  taxonomy: TaxonomyNode[];
}

interface NodeBalance {
  code: string;
  currentPaise: Money;
  comparativePaise: Money;
  ledgerIds: string[];
}

function adjustedLedgerAmounts(context: StatementContext): Map<string, Money> {
  const balances = new Map(context.ledgers.map((ledger) => [ledger.id, ledger.signedCurrentPaise]));
  const postedAdjustmentIds = new Set(
    context.adjustments.filter((adjustment) => adjustment.status === 'POSTED').map((adjustment) => adjustment.id)
  );
  for (const line of context.adjustmentLines) {
    if (!postedAdjustmentIds.has(line.adjustmentId)) continue;
    balances.set(line.ledgerId, (balances.get(line.ledgerId) ?? 0) + line.debitPaise - line.creditPaise);
  }
  return balances;
}

function buildNodeBalances(context: StatementContext): Map<string, NodeBalance> {
  const adjusted = adjustedLedgerAmounts(context);
  const ledgerById = new Map(context.ledgers.map((ledger) => [ledger.id, ledger]));
  const nodeByCode = new Map(context.taxonomy.map((node) => [node.code, node]));
  const balances = new Map<string, NodeBalance>();

  for (const mapping of context.mappings) {
    const ledger = ledgerById.get(mapping.ledgerId);
    const node = nodeByCode.get(mapping.taxonomyCode);
    if (!ledger || !node) continue;
    const sign = node.normalBalance === 'CREDIT' ? -1 : 1;
    const existing = balances.get(node.code) ?? {
      code: node.code,
      currentPaise: 0,
      comparativePaise: 0,
      ledgerIds: []
    };
    existing.currentPaise += (adjusted.get(ledger.id) ?? 0) * sign;
    existing.comparativePaise += ledger.signedComparativePaise * sign;
    existing.ledgerIds.push(ledger.id);
    balances.set(node.code, existing);
  }

  return balances;
}

function lineForNode(node: TaxonomyNode, balances: Map<string, NodeBalance>): ReportLine {
  const balance = balances.get(node.code);
  return {
    code: node.code,
    label: node.label,
    noteNumber: node.noteNumber,
    currentPaise: balance?.currentPaise ?? 0,
    comparativePaise: balance?.comparativePaise ?? 0,
    depth: 1,
    kind: 'LINE',
    ledgerIds: balance?.ledgerIds ?? []
  };
}

function totalLine(code: string, label: string, lines: ReportLine[], kind: ReportLine['kind'] = 'TOTAL'): ReportLine {
  return {
    code,
    label,
    currentPaise: sumMoney(lines.map((line) => line.currentPaise)),
    comparativePaise: sumMoney(lines.map((line) => line.comparativePaise)),
    depth: 0,
    kind,
    ledgerIds: lines.flatMap((line) => line.ledgerIds)
  };
}

function sectionLine(code: string, label: string): ReportLine {
  return { code, label, currentPaise: 0, comparativePaise: 0, depth: 0, kind: 'SECTION', ledgerIds: [] };
}

export function calculateFinancialStatements(context: StatementContext): FinancialStatements {
  const balances = buildNodeBalances(context);
  const sortedTaxonomy = [...context.taxonomy].sort((a, b) => a.sortOrder - b.sortOrder);
  const byCode = new Map(sortedTaxonomy.map((node) => [node.code, node]));

  const balanceSheet: ReportLine[] = [];
  const assetSections = ['Non-current assets', 'Current assets'];
  const liabilitySections = ["Shareholders' funds", 'Non-current liabilities', 'Current liabilities'];
  const assetLines: ReportLine[] = [];
  const equityLiabilityLines: ReportLine[] = [];

  balanceSheet.push(sectionLine('BS-ASSETS', 'ASSETS'));
  for (const section of assetSections) {
    const lines = sortedTaxonomy
      .filter((node) => node.statementType === 'BALANCE_SHEET' && node.side === 'ASSET' && node.section === section)
      .map((node) => lineForNode(node, balances));
    balanceSheet.push(sectionLine(`BS-SECTION-${section}`, section), ...lines, totalLine(`BS-TOTAL-${section}`, `Total ${section.toLowerCase()}`, lines));
    assetLines.push(...lines);
  }
  const totalAssets = totalLine('BS-TOTAL-ASSETS', 'TOTAL ASSETS', assetLines);
  balanceSheet.push(totalAssets, sectionLine('BS-EQUITY-LIABILITIES', 'EQUITY AND LIABILITIES'));

  for (const section of liabilitySections) {
    const lines = sortedTaxonomy
      .filter(
        (node) =>
          node.statementType === 'BALANCE_SHEET' && node.side === 'EQUITY_LIABILITY' && node.section === section
      )
      .map((node) => lineForNode(node, balances));
    balanceSheet.push(sectionLine(`BS-SECTION-${section}`, section), ...lines);
    equityLiabilityLines.push(...lines);
    if (section === "Shareholders' funds") {
      // Current-period profit remains in nominal ledgers until closing. It is bridged visibly rather than mutating the TB.
      // The values are filled after the P&L is calculated below.
    } else {
      balanceSheet.push(totalLine(`BS-TOTAL-${section}`, `Total ${section.toLowerCase()}`, lines));
    }
  }

  const incomeNodes = sortedTaxonomy.filter(
    (node) => node.statementType === 'PROFIT_LOSS' && node.side === 'INCOME'
  );
  const expenseNodes = sortedTaxonomy.filter(
    (node) => node.statementType === 'PROFIT_LOSS' && node.side === 'EXPENSE'
  );
  const incomeLines = incomeNodes.map((node) => lineForNode(node, balances));
  const operatingExpenseLines = expenseNodes
    .filter((node) => !node.metricTags.includes('tax'))
    .map((node) => lineForNode(node, balances));
  const taxLines = expenseNodes.filter((node) => node.metricTags.includes('tax')).map((node) => lineForNode(node, balances));
  const totalIncome = totalLine('PL-TOTAL-INCOME', 'Total income', incomeLines);
  const totalOperatingExpenses = totalLine('PL-TOTAL-EXPENSES-BEFORE-TAX', 'Total expenses before tax', operatingExpenseLines);
  const profitBeforeTax: ReportLine = {
    code: 'PL-PBT',
    label: 'Profit before tax',
    currentPaise: totalIncome.currentPaise - totalOperatingExpenses.currentPaise,
    comparativePaise: totalIncome.comparativePaise - totalOperatingExpenses.comparativePaise,
    depth: 0,
    kind: 'CALCULATED',
    ledgerIds: [...totalIncome.ledgerIds, ...totalOperatingExpenses.ledgerIds]
  };
  const totalTax = totalLine('PL-TOTAL-TAX', 'Tax expense', taxLines);
  const profitAfterTax: ReportLine = {
    code: 'PL-PAT',
    label: 'Profit for the year',
    currentPaise: profitBeforeTax.currentPaise - totalTax.currentPaise,
    comparativePaise: profitBeforeTax.comparativePaise - totalTax.comparativePaise,
    depth: 0,
    kind: 'CALCULATED',
    ledgerIds: [...profitBeforeTax.ledgerIds, ...totalTax.ledgerIds]
  };

  const profitAndLoss: ReportLine[] = [
    sectionLine('PL-INCOME', 'INCOME'),
    ...incomeLines,
    totalIncome,
    sectionLine('PL-EXPENSES', 'EXPENSES'),
    ...operatingExpenseLines,
    totalOperatingExpenses,
    profitBeforeTax,
    ...taxLines,
    totalTax,
    profitAfterTax
  ];

  const equityInsertIndex = balanceSheet.findIndex((line) => line.code === 'BS-SECTION-Non-current liabilities');
  const currentProfitBridge: ReportLine = {
    code: 'BS-EQ-CURRENT-PROFIT',
    label: 'Profit for the year (statement bridge)',
    currentPaise: profitAfterTax.currentPaise,
    comparativePaise: profitAfterTax.comparativePaise,
    depth: 1,
    kind: 'CALCULATED',
    ledgerIds: profitAfterTax.ledgerIds
  };
  const shareholderLines = equityLiabilityLines.filter((line) => {
    const node = byCode.get(line.code);
    return node?.section === "Shareholders' funds";
  });
  const shareholderTotal = totalLine(
    'BS-TOTAL-SHAREHOLDERS-FUNDS',
    "Total shareholders' funds",
    [...shareholderLines, currentProfitBridge]
  );
  balanceSheet.splice(equityInsertIndex, 0, currentProfitBridge, shareholderTotal);

  const equityLiabilitiesBeforeProfit = sumMoney(equityLiabilityLines.map((line) => line.currentPaise));
  const comparativeEquityLiabilitiesBeforeProfit = sumMoney(
    equityLiabilityLines.map((line) => line.comparativePaise)
  );
  const totalEquityLiabilities = equityLiabilitiesBeforeProfit + profitAfterTax.currentPaise;
  const comparativeTotalEquityLiabilities =
    comparativeEquityLiabilitiesBeforeProfit + profitAfterTax.comparativePaise;
  balanceSheet.push({
    code: 'BS-TOTAL-EQUITY-LIABILITIES',
    label: 'TOTAL EQUITY AND LIABILITIES',
    currentPaise: totalEquityLiabilities,
    comparativePaise: comparativeTotalEquityLiabilities,
    depth: 0,
    kind: 'TOTAL',
    ledgerIds: [...equityLiabilityLines.flatMap((line) => line.ledgerIds), ...profitAfterTax.ledgerIds]
  });

  // Schedule III permits a vertical presentation. White Horse presents sources of funds first:
  // Equity and Liabilities, followed by Assets. The underlying calculations remain unchanged.
  const equityAndLiabilitiesStart = balanceSheet.findIndex((line) => line.code === 'BS-EQUITY-LIABILITIES');
  if (equityAndLiabilitiesStart > 0) {
    const assetPresentation = balanceSheet.slice(0, equityAndLiabilitiesStart);
    const equityAndLiabilityPresentation = balanceSheet.slice(equityAndLiabilitiesStart);
    balanceSheet.splice(0, balanceSheet.length, ...equityAndLiabilityPresentation, ...assetPresentation);
  }

  const nodeAmount = (code: string, comparative = false) => {
    const balance = balances.get(code);
    return comparative ? balance?.comparativePaise ?? 0 : balance?.currentPaise ?? 0;
  };
  const postedInventoryProvision = sumMoney(
    context.adjustments
      .filter((adjustment) => adjustment.status === 'POSTED' && adjustment.type === 'INVENTORY')
      .flatMap((adjustment) =>
        context.adjustmentLines
          .filter((line) => line.adjustmentId === adjustment.id)
          .map((line) => line.debitPaise)
      )
  );
  const operatingAssetCodes = ['BS-CA-INVENTORY', 'BS-CA-RECEIVABLE', 'BS-CA-PREPAID', 'BS-CA-OTHER'];
  const operatingLiabilityCodes = ['BS-CL-PAYABLE', 'BS-CL-OTHER', 'BS-CL-PROVISION', 'BS-NCL-EMPLOYEE'];
  const workingCapitalEffect =
    -sumMoney(operatingAssetCodes.map((code) => nodeAmount(code) - nodeAmount(code, true))) +
    sumMoney(operatingLiabilityCodes.map((code) => nodeAmount(code) - nodeAmount(code, true)));
  const depreciation = nodeAmount('PL-EXP-DEPRECIATION');
  const financeCosts = nodeAmount('PL-EXP-FINANCE');
  const otherIncome = nodeAmount('PL-REV-OTHER');
  const cashFromOperations =
    profitBeforeTax.currentPaise +
    depreciation +
    financeCosts -
    otherIncome +
    postedInventoryProvision +
    workingCapitalEffect -
    context.period.cashFlowInputs.incomeTaxesPaid;
  const cashFromInvesting =
    -context.period.cashFlowInputs.ppePurchases +
    context.period.cashFlowInputs.ppeDisposalProceeds -
    context.period.cashFlowInputs.intangiblePurchases -
    context.period.cashFlowInputs.investmentPurchases +
    context.period.cashFlowInputs.interestIncomeReceived;
  const currentDebt = nodeAmount('BS-NCL-BORROWING') + nodeAmount('BS-CL-BORROWING');
  const comparativeDebt = nodeAmount('BS-NCL-BORROWING', true) + nodeAmount('BS-CL-BORROWING', true);
  const cashFromFinancing =
    currentDebt -
    comparativeDebt -
    context.period.cashFlowInputs.interestPaid -
    context.period.cashFlowInputs.dividendsPaid;
  const cashFlowMovement = cashFromOperations + cashFromInvesting + cashFromFinancing;
  const openingCash = nodeAmount('BS-CA-CASH', true);
  const closingCash = nodeAmount('BS-CA-CASH');
  const comparativeSummary = context.period.comparativeCashFlowSummary;
  const comparativeMovement =
    comparativeSummary.operating + comparativeSummary.investing + comparativeSummary.financing;
  const comparativeClosing = comparativeSummary.openingCash + comparativeMovement;
  const cashFlow: ReportLine[] = [
    sectionLine('CF-OPERATING-SECTION', 'A. CASH FLOW FROM OPERATING ACTIVITIES'),
    { code: 'CF-PBT', label: 'Profit before tax', currentPaise: profitBeforeTax.currentPaise, comparativePaise: 0, depth: 1, kind: 'LINE', ledgerIds: profitBeforeTax.ledgerIds },
    { code: 'CF-NON-CASH', label: 'Non-cash and financing/investing adjustments', currentPaise: depreciation + financeCosts - otherIncome + postedInventoryProvision, comparativePaise: 0, depth: 1, kind: 'LINE', ledgerIds: [] },
    { code: 'CF-WORKING-CAPITAL', label: 'Changes in operating assets and liabilities', currentPaise: workingCapitalEffect, comparativePaise: 0, depth: 1, kind: 'LINE', ledgerIds: [] },
    { code: 'CF-TAX-PAID', label: 'Income taxes paid', currentPaise: -context.period.cashFlowInputs.incomeTaxesPaid, comparativePaise: 0, depth: 1, kind: 'LINE', ledgerIds: [] },
    { code: 'CF-OPERATING', label: 'Net cash from operating activities', currentPaise: cashFromOperations, comparativePaise: comparativeSummary.operating, depth: 0, kind: 'TOTAL', ledgerIds: [] },
    sectionLine('CF-INVESTING-SECTION', 'B. CASH FLOW FROM INVESTING ACTIVITIES'),
    { code: 'CF-INVESTING', label: 'Net cash used in investing activities', currentPaise: cashFromInvesting, comparativePaise: comparativeSummary.investing, depth: 0, kind: 'TOTAL', ledgerIds: [] },
    sectionLine('CF-FINANCING-SECTION', 'C. CASH FLOW FROM FINANCING ACTIVITIES'),
    { code: 'CF-FINANCING', label: 'Net cash used in financing activities', currentPaise: cashFromFinancing, comparativePaise: comparativeSummary.financing, depth: 0, kind: 'TOTAL', ledgerIds: [] },
    { code: 'CF-NET-MOVEMENT', label: 'Net increase in cash and cash equivalents', currentPaise: cashFlowMovement, comparativePaise: comparativeMovement, depth: 0, kind: 'CALCULATED', ledgerIds: [] },
    { code: 'CF-OPENING-CASH', label: 'Cash and cash equivalents at beginning of year', currentPaise: openingCash, comparativePaise: comparativeSummary.openingCash, depth: 1, kind: 'LINE', ledgerIds: balances.get('BS-CA-CASH')?.ledgerIds ?? [] },
    { code: 'CF-CLOSING-CASH', label: 'Cash and cash equivalents at end of year', currentPaise: closingCash, comparativePaise: comparativeClosing, depth: 0, kind: 'TOTAL', ledgerIds: balances.get('BS-CA-CASH')?.ledgerIds ?? [] }
  ];

  return {
    balanceSheet,
    profitAndLoss,
    cashFlow,
    totals: {
      totalAssets: totalAssets.currentPaise,
      comparativeTotalAssets: totalAssets.comparativePaise,
      equityAndLiabilitiesBeforeProfit: equityLiabilitiesBeforeProfit,
      comparativeEquityAndLiabilitiesBeforeProfit: comparativeEquityLiabilitiesBeforeProfit,
      currentProfit: profitAfterTax.currentPaise,
      comparativeProfit: profitAfterTax.comparativePaise,
      totalEquityAndLiabilities: totalEquityLiabilities,
      comparativeTotalEquityAndLiabilities: comparativeTotalEquityLiabilities,
      balanceSheetDifference: totalAssets.currentPaise - totalEquityLiabilities,
      comparativeBalanceSheetDifference: totalAssets.comparativePaise - comparativeTotalEquityLiabilities,
      cashFlowMovement,
      cashMovementPerBalanceSheet: closingCash - openingCash,
      cashFlowDifference: cashFlowMovement - (closingCash - openingCash)
    }
  };
}

export function calculateKpis(context: StatementContext, statements: FinancialStatements): KpiSet {
  const balances = buildNodeBalances(context);
  const amount = (code: string, comparative = false) => {
    const balance = balances.get(code);
    return comparative ? balance?.comparativePaise ?? 0 : balance?.currentPaise ?? 0;
  };

  const revenue = amount('PL-REV-OPERATIONS');
  const comparativeRevenue = amount('PL-REV-OPERATIONS', true);
  const otherIncome = amount('PL-REV-OTHER');
  const comparativeOtherIncome = amount('PL-REV-OTHER', true);
  const operatingExpenses = amount('PL-EXP-MATERIAL') + amount('PL-EXP-EMPLOYEE') + amount('PL-EXP-OTHER');
  const comparativeOperatingExpenses = amount('PL-EXP-MATERIAL', true) + amount('PL-EXP-EMPLOYEE', true) + amount('PL-EXP-OTHER', true);
  const ebitda = revenue + otherIncome - operatingExpenses;
  const comparativeEbitda = comparativeRevenue + comparativeOtherIncome - comparativeOperatingExpenses;
  const ebit = ebitda - amount('PL-EXP-DEPRECIATION');
  const comparativeEbit = comparativeEbitda - amount('PL-EXP-DEPRECIATION', true);
  const currentAssets = ['BS-CA-INVENTORY', 'BS-CA-RECEIVABLE', 'BS-CA-CASH', 'BS-CA-PREPAID', 'BS-CA-OTHER'].reduce((total, code) => total + amount(code), 0);
  const comparativeCurrentAssets = ['BS-CA-INVENTORY', 'BS-CA-RECEIVABLE', 'BS-CA-CASH', 'BS-CA-PREPAID', 'BS-CA-OTHER'].reduce((total, code) => total + amount(code, true), 0);
  const currentLiabilities = ['BS-CL-BORROWING', 'BS-CL-PAYABLE', 'BS-CL-OTHER', 'BS-CL-PROVISION', 'BS-CL-TAX'].reduce((total, code) => total + amount(code), 0);
  const comparativeCurrentLiabilities = ['BS-CL-BORROWING', 'BS-CL-PAYABLE', 'BS-CL-OTHER', 'BS-CL-PROVISION', 'BS-CL-TAX'].reduce((total, code) => total + amount(code, true), 0);
  const totalDebt = amount('BS-NCL-BORROWING') + amount('BS-CL-BORROWING');
  const comparativeTotalDebt = amount('BS-NCL-BORROWING', true) + amount('BS-CL-BORROWING', true);
  const netWorth = amount('BS-EQ-CAPITAL') + amount('BS-EQ-RESERVES') + statements.totals.currentProfit;
  const comparativeNetWorth = amount('BS-EQ-CAPITAL', true) + amount('BS-EQ-RESERVES', true) + statements.totals.comparativeProfit;
  const averageNetWorth = (netWorth + comparativeNetWorth) / 2;
  const capitalEmployed = netWorth + totalDebt;
  const comparativeCapitalEmployed = comparativeNetWorth + comparativeTotalDebt;
  const averageCapitalEmployed = (capitalEmployed + comparativeCapitalEmployed) / 2;

  return {
    revenue,
    comparativeRevenue,
    ebitda,
    comparativeEbitda,
    ebit,
    comparativeEbit,
    profitAfterTax: statements.totals.currentProfit,
    comparativeProfitAfterTax: statements.totals.comparativeProfit,
    netWorth,
    comparativeNetWorth,
    totalDebt,
    comparativeTotalDebt,
    workingCapital: currentAssets - currentLiabilities,
    comparativeWorkingCapital: comparativeCurrentAssets - comparativeCurrentLiabilities,
    currentRatio: safeRatio(currentAssets, currentLiabilities),
    comparativeCurrentRatio: safeRatio(comparativeCurrentAssets, comparativeCurrentLiabilities),
    debtEquityRatio: safeRatio(totalDebt, netWorth),
    comparativeDebtEquityRatio: safeRatio(comparativeTotalDebt, comparativeNetWorth),
    interestCoverage: safeRatio(ebit, amount('PL-EXP-FINANCE')),
    comparativeInterestCoverage: safeRatio(comparativeEbit, amount('PL-EXP-FINANCE', true)),
    roe: safeRatio(statements.totals.currentProfit, averageNetWorth),
    comparativeRoe: safeRatio(statements.totals.comparativeProfit, comparativeNetWorth),
    roce: safeRatio(ebit, averageCapitalEmployed),
    comparativeRoce: safeRatio(comparativeEbit, comparativeCapitalEmployed)
  };
}
