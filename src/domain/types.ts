export type Id = string;
export type Money = number;

export type Role = 'ADMIN' | 'PREPARER' | 'REVIEWER' | 'VIEWER';
export type PeriodStatus =
  | 'DRAFT'
  | 'TB_IMPORTED'
  | 'MAPPING_IN_PROGRESS'
  | 'ADJUSTMENT_IN_PROGRESS'
  | 'REVIEW'
  | 'READY_FOR_REVIEW'
  | 'FINALISED'
  | 'REOPENED';
export type NormalBalance = 'DEBIT' | 'CREDIT' | 'EITHER';
export type StatementType = 'BALANCE_SHEET' | 'PROFIT_LOSS';
export type StatementSide = 'ASSET' | 'EQUITY_LIABILITY' | 'INCOME' | 'EXPENSE';
export type CashFlowClass = 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NON_CASH';
export type MappingStatus = 'DRAFT' | 'APPROVED' | 'LOCKED';
export type AdjustmentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'POSTED' | 'REVERSED';
export type Severity = 'BLOCKING' | 'ERROR' | 'WARNING' | 'INFO';
export type ResolutionStatus = 'OPEN' | 'RESOLVED' | 'ACCEPTED';

export interface Company {
  id: Id;
  legalName: string;
  tradeName: string;
  cin: string;
  registeredOffice: string;
  industry: string;
  framework: 'SCHEDULE_III_DIV_I';
  currency: 'INR';
  displayScale: 'RUPEES' | 'THOUSANDS' | 'LAKHS' | 'CRORES';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashFlowInputs {
  incomeTaxesPaid: Money;
  interestPaid: Money;
  interestIncomeReceived: Money;
  ppePurchases: Money;
  ppeDisposalProceeds: Money;
  intangiblePurchases: Money;
  investmentPurchases: Money;
  dividendsPaid: Money;
}

export type CharteredAccountantCapacity = 'PREPARER' | 'COMPILER' | 'STATUTORY_AUDITOR';

export interface StatementSignatureSettings {
  showDirector: boolean;
  directorName: string;
  directorDesignation: string;
  directorDin: string;
  showCharteredAccountant: boolean;
  caCapacity: CharteredAccountantCapacity;
  caFirmName: string;
  caFirmRegistrationNumber: string;
  caName: string;
  caDesignation: string;
  caMembershipNumber: string;
  caUdin: string;
  place: string;
  signingDate: string;
}

export interface ReportingPeriod {
  id: Id;
  companyId: Id;
  activeImportId: Id;
  label: string;
  startDate: string;
  endDate: string;
  comparativeLabel: string;
  comparativeStartDate: string;
  comparativeEndDate: string;
  status: PeriodStatus;
  revision: number;
  materialityPaise: Money;
  taxonomyVersion: string;
  rulesetVersion: string;
  cashFlowInputs: CashFlowInputs;
  comparativeCashFlowSummary: {
    operating: Money;
    investing: Money;
    financing: Money;
    openingCash: Money;
  };
  signatureSettings?: StatementSignatureSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TrialBalanceImport {
  id: Id;
  companyId: Id;
  periodId: Id;
  fileName: string;
  sourceType: 'DEMO' | 'CSV' | 'XLSX' | 'MANUAL';
  importedAt: string;
  importedBy: Id;
  rowCount: number;
  debitTotalPaise: Money;
  creditTotalPaise: Money;
  differencePaise: Money;
  status: 'ACTIVE' | 'SUPERSEDED';
  contentHash: string;
}

export interface LedgerAccount {
  id: Id;
  companyId: Id;
  periodId: Id;
  importId: Id;
  code: string;
  name: string;
  group: string;
  subGroup: string;
  openingDebitPaise: Money;
  openingCreditPaise: Money;
  debitPaise: Money;
  creditPaise: Money;
  closingDebitPaise: Money;
  closingCreditPaise: Money;
  signedCurrentPaise: Money;
  signedComparativePaise: Money;
  active: boolean;
  sourceRow: number;
}

export interface TaxonomyNode {
  code: string;
  label: string;
  shortLabel: string;
  statementType: StatementType;
  side: StatementSide;
  section: string;
  normalBalance: NormalBalance;
  currentNonCurrent: 'CURRENT' | 'NON_CURRENT' | 'NA';
  cashFlowClass: CashFlowClass;
  noteNumber?: string;
  sortOrder: number;
  metricTags: string[];
}

export interface LedgerMapping {
  id: Id;
  companyId: Id;
  periodId: Id;
  ledgerId: Id;
  taxonomyCode: string;
  status: MappingStatus;
  currentNonCurrent: 'CURRENT' | 'NON_CURRENT' | 'NA';
  cashFlowClass: CashFlowClass;
  suggestionConfidence: number;
  suggestionReason: string;
  reviewedBy?: Id;
  reviewedAt?: string;
  updatedAt: string;
}

export interface Adjustment {
  id: Id;
  companyId: Id;
  periodId: Id;
  referenceNumber: string;
  type:
    | 'DEPRECIATION'
    | 'TAX'
    | 'DEFERRED_TAX'
    | 'ACCRUAL'
    | 'PREPAYMENT'
    | 'PROVISION'
    | 'INTEREST'
    | 'BAD_DEBT_ECL'
    | 'INVENTORY'
    | 'PRIOR_PERIOD'
    | 'EXCEPTIONAL'
    | 'REGROUPING'
    | 'OTHER';
  entryDate: string;
  narration: string;
  workpaperReference: string;
  status: AdjustmentStatus;
  preparedBy: Id;
  preparedAt: string;
  reviewedBy?: Id;
  reviewedAt?: string;
  reviewComment?: string;
  postedAt?: string;
}

export interface AdjustmentLine {
  id: Id;
  adjustmentId: Id;
  ledgerId: Id;
  lineNumber: number;
  debitPaise: Money;
  creditPaise: Money;
  description: string;
}

export interface ValidationResult {
  id: Id;
  companyId: Id;
  periodId: Id;
  ruleId: string;
  severity: Severity;
  title: string;
  message: string;
  evidence: string;
  suggestedAction: string;
  amountPaise?: Money;
  entityType?: string;
  entityId?: Id;
  status: ResolutionStatus;
  resolution?: string;
  resolvedBy?: Id;
  resolvedAt?: string;
  generatedAt: string;
}

export interface NoteDisclosure {
  id: Id;
  companyId: Id;
  periodId: Id;
  noteNumber: string;
  title: string;
  taxonomyCodes: string[];
  status: 'COMPLETE' | 'IN_REVIEW' | 'PENDING' | 'NOT_APPLICABLE';
  owner: string;
  narrative: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: Id;
  sequence: number;
  companyId?: Id;
  periodId?: Id;
  timestamp: string;
  actorId: Id;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: Id;
  reason: string;
  previousEventHash: string;
  eventHash: string;
}

export interface LocalUser {
  id: Id;
  username: string;
  displayName: string;
  role: Role;
  active: boolean;
  passwordSalt?: string;
  passwordVerifier?: string;
  kdfIterations?: number;
  createdAt: string;
}

export interface ReportLine {
  code: string;
  label: string;
  noteNumber?: string;
  currentPaise: Money;
  comparativePaise: Money;
  depth: number;
  kind: 'SECTION' | 'LINE' | 'TOTAL' | 'CALCULATED';
  ledgerIds: Id[];
}

export interface FinancialStatements {
  balanceSheet: ReportLine[];
  profitAndLoss: ReportLine[];
  cashFlow: ReportLine[];
  totals: {
    totalAssets: Money;
    comparativeTotalAssets: Money;
    equityAndLiabilitiesBeforeProfit: Money;
    comparativeEquityAndLiabilitiesBeforeProfit: Money;
    currentProfit: Money;
    comparativeProfit: Money;
    totalEquityAndLiabilities: Money;
    comparativeTotalEquityAndLiabilities: Money;
    balanceSheetDifference: Money;
    comparativeBalanceSheetDifference: Money;
    cashFlowMovement: Money;
    cashMovementPerBalanceSheet: Money;
    cashFlowDifference: Money;
  };
}

export interface KpiSet {
  revenue: Money;
  comparativeRevenue: Money;
  ebitda: Money;
  comparativeEbitda: Money;
  ebit: Money;
  comparativeEbit: Money;
  profitAfterTax: Money;
  comparativeProfitAfterTax: Money;
  netWorth: Money;
  comparativeNetWorth: Money;
  totalDebt: Money;
  comparativeTotalDebt: Money;
  workingCapital: Money;
  comparativeWorkingCapital: Money;
  currentRatio: number | null;
  comparativeCurrentRatio: number | null;
  debtEquityRatio: number | null;
  comparativeDebtEquityRatio: number | null;
  interestCoverage: number | null;
  comparativeInterestCoverage: number | null;
  roe: number | null;
  comparativeRoe: number | null;
  roce: number | null;
  comparativeRoce: number | null;
}

export interface WorkspaceData {
  company: Company;
  period: ReportingPeriod;
  activeImport: TrialBalanceImport;
  ledgers: LedgerAccount[];
  mappings: LedgerMapping[];
  adjustments: Adjustment[];
  adjustmentLines: AdjustmentLine[];
  validations: ValidationResult[];
  notes: NoteDisclosure[];
  auditEvents: AuditEvent[];
  users: LocalUser[];
}
