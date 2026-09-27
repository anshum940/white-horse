import { RULESET_VERSION, TAXONOMY_VERSION, taxonomyByCode } from './taxonomy';
import { createDivisionINoteTemplates } from './noteTemplates';
import type {
  Adjustment,
  AdjustmentLine,
  AuditEvent,
  Company,
  LedgerAccount,
  LedgerMapping,
  LocalUser,
  NoteDisclosure,
  ReportingPeriod,
  TrialBalanceImport,
  ValidationResult
} from '../domain/types';

const rupees = (value: number) => Math.round(value * 100);
const DEMO_DATE = '2026-04-18T10:30:00.000Z';

export const demoCompany: Company = {
  id: 'demo-company',
  legalName: 'Saffron Industries Private Limited',
  tradeName: 'Saffron Industries',
  cin: 'U27100MH2014PTC123456',
  registeredOffice: 'Pune, Maharashtra, India',
  industry: 'Industrial components manufacturing',
  framework: 'SCHEDULE_III_DIV_I',
  currency: 'INR',
  displayScale: 'LAKHS',
  active: true,
  createdAt: DEMO_DATE,
  updatedAt: DEMO_DATE
};

export const demoPeriod: ReportingPeriod = {
  id: 'demo-period-2026',
  companyId: demoCompany.id,
  activeImportId: 'demo-import-1',
  label: 'FY 2025–26',
  startDate: '2025-04-01',
  endDate: '2026-03-31',
  comparativeLabel: 'FY 2024–25',
  comparativeStartDate: '2024-04-01',
  comparativeEndDate: '2025-03-31',
  status: 'READY_FOR_REVIEW',
  revision: 1,
  materialityPaise: rupees(250_000),
  taxonomyVersion: TAXONOMY_VERSION,
  rulesetVersion: RULESET_VERSION,
  cashFlowInputs: {
    incomeTaxesPaid: rupees(1_300_000),
    interestPaid: rupees(1_000_000),
    interestIncomeReceived: rupees(800_000),
    ppePurchases: rupees(2_700_000),
    ppeDisposalProceeds: rupees(300_000),
    intangiblePurchases: rupees(100_000),
    investmentPurchases: rupees(200_000),
    dividendsPaid: rupees(2_850_000)
  },
  comparativeCashFlowSummary: {
    operating: rupees(5_200_000),
    investing: rupees(-2_100_000),
    financing: rupees(-2_400_000),
    openingCash: rupees(800_000)
  },
  createdAt: DEMO_DATE,
  updatedAt: DEMO_DATE
};

export const demoImport: TrialBalanceImport = {
  id: 'demo-import-1',
  companyId: demoCompany.id,
  periodId: demoPeriod.id,
  fileName: 'Saffron_Industries_TB_FY2025-26.xlsx',
  sourceType: 'DEMO',
  importedAt: DEMO_DATE,
  importedBy: 'demo-preparer',
  rowCount: 27,
  debitTotalPaise: rupees(75_550_000),
  creditTotalPaise: rupees(75_550_000),
  differencePaise: 0,
  status: 'ACTIVE',
  contentHash: 'sha256:demo-balanced-trial-balance-fy2025-26'
};

interface DemoLedgerSeed {
  code: string;
  name: string;
  group: string;
  subGroup: string;
  currentRupees: number;
  comparativeRupees: number;
  taxonomyCode: string;
}

const ledgerSeeds: DemoLedgerSeed[] = [
  { code: '100100', name: 'Plant and machinery — net block', group: 'Assets', subGroup: 'PPE', currentRupees: 15_000_000, comparativeRupees: 13_800_000, taxonomyCode: 'BS-NCA-PPE' },
  { code: '100200', name: 'ERP software — net block', group: 'Assets', subGroup: 'Intangibles', currentRupees: 500_000, comparativeRupees: 400_000, taxonomyCode: 'BS-NCA-INTANGIBLE' },
  { code: '100300', name: 'Quoted strategic investments', group: 'Assets', subGroup: 'Investments', currentRupees: 1_000_000, comparativeRupees: 800_000, taxonomyCode: 'BS-NCA-INVESTMENT' },
  { code: '100400', name: 'Deferred tax asset', group: 'Assets', subGroup: 'Tax', currentRupees: 250_000, comparativeRupees: 150_000, taxonomyCode: 'BS-NCA-DTA' },
  { code: '110100', name: 'Raw materials and finished goods', group: 'Assets', subGroup: 'Inventory', currentRupees: 4_800_000, comparativeRupees: 4_200_000, taxonomyCode: 'BS-CA-INVENTORY' },
  { code: '110200', name: 'Trade receivables — domestic', group: 'Assets', subGroup: 'Receivables', currentRupees: 6_200_000, comparativeRupees: 4_900_000, taxonomyCode: 'BS-CA-RECEIVABLE' },
  { code: '110300', name: 'Cash and bank balances', group: 'Assets', subGroup: 'Cash', currentRupees: 2_400_000, comparativeRupees: 1_500_000, taxonomyCode: 'BS-CA-CASH' },
  { code: '110400', name: 'Prepaid insurance', group: 'Assets', subGroup: 'Prepayments', currentRupees: 350_000, comparativeRupees: 250_000, taxonomyCode: 'BS-CA-PREPAID' },
  { code: '110500', name: 'GST and other recoverables', group: 'Assets', subGroup: 'Other current assets', currentRupees: 750_000, comparativeRupees: 300_000, taxonomyCode: 'BS-CA-OTHER' },
  { code: '200100', name: 'Equity share capital', group: 'Equity', subGroup: 'Share capital', currentRupees: -5_000_000, comparativeRupees: -5_000_000, taxonomyCode: 'BS-EQ-CAPITAL' },
  { code: '200200', name: 'Retained earnings — opening balance', group: 'Equity', subGroup: 'Reserves', currentRupees: -7_000_000, comparativeRupees: -5_600_000, taxonomyCode: 'BS-EQ-RESERVES' },
  { code: '210100', name: 'Term loan from scheduled bank', group: 'Liabilities', subGroup: 'Long-term borrowings', currentRupees: -6_000_000, comparativeRupees: -6_500_000, taxonomyCode: 'BS-NCL-BORROWING' },
  { code: '210200', name: 'Provision for employee benefits', group: 'Liabilities', subGroup: 'Long-term provisions', currentRupees: -450_000, comparativeRupees: -100_000, taxonomyCode: 'BS-NCL-EMPLOYEE' },
  { code: '220100', name: 'Working capital demand loan', group: 'Liabilities', subGroup: 'Short-term borrowings', currentRupees: -2_000_000, comparativeRupees: -1_800_000, taxonomyCode: 'BS-CL-BORROWING' },
  { code: '220200', name: 'Trade payables — MSME and others', group: 'Liabilities', subGroup: 'Trade payables', currentRupees: -4_500_000, comparativeRupees: -3_200_000, taxonomyCode: 'BS-CL-PAYABLE' },
  { code: '220300', name: 'Statutory dues and accrued expenses', group: 'Liabilities', subGroup: 'Other current liabilities', currentRupees: -1_000_000, comparativeRupees: -400_000, taxonomyCode: 'BS-CL-OTHER' },
  { code: '220400', name: 'Provision for warranty', group: 'Liabilities', subGroup: 'Short-term provisions', currentRupees: -500_000, comparativeRupees: -200_000, taxonomyCode: 'BS-CL-PROVISION' },
  { code: '220500', name: 'Provision for current tax', group: 'Liabilities', subGroup: 'Current tax liabilities', currentRupees: -300_000, comparativeRupees: -100_000, taxonomyCode: 'BS-CL-TAX' },
  { code: '300100', name: 'Revenue from sale of manufactured goods', group: 'Income', subGroup: 'Revenue from operations', currentRupees: -48_000_000, comparativeRupees: -42_000_000, taxonomyCode: 'PL-REV-OPERATIONS' },
  { code: '300200', name: 'Interest and miscellaneous income', group: 'Income', subGroup: 'Other income', currentRupees: -800_000, comparativeRupees: -500_000, taxonomyCode: 'PL-REV-OTHER' },
  { code: '400100', name: 'Raw materials consumed', group: 'Expenses', subGroup: 'Materials', currentRupees: 28_000_000, comparativeRupees: 24_800_000, taxonomyCode: 'PL-EXP-MATERIAL' },
  { code: '400200', name: 'Salaries, wages and staff welfare', group: 'Expenses', subGroup: 'Employee benefits', currentRupees: 7_000_000, comparativeRupees: 6_200_000, taxonomyCode: 'PL-EXP-EMPLOYEE' },
  { code: '400300', name: 'Manufacturing, selling and administration', group: 'Expenses', subGroup: 'Other expenses', currentRupees: 5_000_000, comparativeRupees: 4_500_000, taxonomyCode: 'PL-EXP-OTHER' },
  { code: '400400', name: 'Depreciation and amortisation', group: 'Expenses', subGroup: 'Depreciation', currentRupees: 1_500_000, comparativeRupees: 1_300_000, taxonomyCode: 'PL-EXP-DEPRECIATION' },
  { code: '400500', name: 'Interest on borrowings', group: 'Expenses', subGroup: 'Finance costs', currentRupees: 1_000_000, comparativeRupees: 900_000, taxonomyCode: 'PL-EXP-FINANCE' },
  { code: '400600', name: 'Current tax expense', group: 'Expenses', subGroup: 'Tax', currentRupees: 1_500_000, comparativeRupees: 1_200_000, taxonomyCode: 'PL-EXP-TAX-CURRENT' },
  { code: '400700', name: 'Deferred tax expense', group: 'Expenses', subGroup: 'Tax', currentRupees: 300_000, comparativeRupees: 200_000, taxonomyCode: 'PL-EXP-TAX-DEFERRED' }
];

function makeLedger(seed: DemoLedgerSeed, index: number): LedgerAccount {
  const current = rupees(seed.currentRupees);
  const comparative = rupees(seed.comparativeRupees);
  return {
    id: `ledger-${seed.code}`,
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    importId: demoImport.id,
    code: seed.code,
    name: seed.name,
    group: seed.group,
    subGroup: seed.subGroup,
    openingDebitPaise: current > 0 ? current : 0,
    openingCreditPaise: current < 0 ? Math.abs(current) : 0,
    debitPaise: 0,
    creditPaise: 0,
    closingDebitPaise: current > 0 ? current : 0,
    closingCreditPaise: current < 0 ? Math.abs(current) : 0,
    signedCurrentPaise: current,
    signedComparativePaise: comparative,
    active: true,
    sourceRow: index + 2
  };
}

export const demoLedgers = ledgerSeeds.map(makeLedger);

export const demoMappings: LedgerMapping[] = ledgerSeeds.map((seed) => {
  const node = taxonomyByCode.get(seed.taxonomyCode);
  if (!node) throw new Error(`Unknown demo taxonomy node ${seed.taxonomyCode}`);
  return {
    id: `mapping-${seed.code}`,
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    ledgerId: `ledger-${seed.code}`,
    taxonomyCode: seed.taxonomyCode,
    status: 'LOCKED',
    currentNonCurrent: node.currentNonCurrent,
    cashFlowClass: node.cashFlowClass,
    suggestionConfidence: 1,
    suggestionReason: 'Approved company mapping carried forward and independently reviewed.',
    reviewedBy: 'demo-reviewer',
    reviewedAt: DEMO_DATE,
    updatedAt: DEMO_DATE
  };
});

export const demoAdjustments: Adjustment[] = [
  {
    id: 'adjustment-depreciation',
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    referenceNumber: 'AJ-2026-001',
    type: 'DEPRECIATION',
    entryDate: '2026-03-31',
    narration: 'True-up depreciation based on the reviewed fixed-asset register.',
    workpaperReference: 'WP-PPE-04',
    status: 'POSTED',
    preparedBy: 'demo-preparer',
    preparedAt: '2026-04-12T09:15:00.000Z',
    reviewedBy: 'demo-reviewer',
    reviewedAt: '2026-04-14T11:00:00.000Z',
    reviewComment: 'Agreed to fixed-asset register and useful-life review.',
    postedAt: '2026-04-14T11:05:00.000Z'
  },
  {
    id: 'adjustment-inventory',
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    referenceNumber: 'AJ-2026-002',
    type: 'INVENTORY',
    entryDate: '2026-03-31',
    narration: 'Provision for slow-moving inventory identified in the ageing review.',
    workpaperReference: 'WP-INV-07',
    status: 'POSTED',
    preparedBy: 'demo-preparer',
    preparedAt: '2026-04-12T10:00:00.000Z',
    reviewedBy: 'demo-reviewer',
    reviewedAt: '2026-04-15T08:30:00.000Z',
    reviewComment: 'Provision basis and ageing sample reviewed.',
    postedAt: '2026-04-15T08:35:00.000Z'
  },
  {
    id: 'adjustment-accrual',
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    referenceNumber: 'AJ-2026-003',
    type: 'ACCRUAL',
    entryDate: '2026-03-31',
    narration: 'Draft utilities accrual pending final vendor confirmation.',
    workpaperReference: 'WP-OPEX-11',
    status: 'SUBMITTED',
    preparedBy: 'demo-preparer',
    preparedAt: '2026-04-16T07:45:00.000Z'
  }
];

export const demoAdjustmentLines: AdjustmentLine[] = [
  { id: 'adj-line-001-1', adjustmentId: 'adjustment-depreciation', ledgerId: 'ledger-400400', lineNumber: 1, debitPaise: rupees(100_000), creditPaise: 0, description: 'Additional depreciation expense' },
  { id: 'adj-line-001-2', adjustmentId: 'adjustment-depreciation', ledgerId: 'ledger-100100', lineNumber: 2, debitPaise: 0, creditPaise: rupees(100_000), description: 'Reduce PPE net block' },
  { id: 'adj-line-002-1', adjustmentId: 'adjustment-inventory', ledgerId: 'ledger-400300', lineNumber: 1, debitPaise: rupees(150_000), creditPaise: 0, description: 'Slow-moving inventory provision expense' },
  { id: 'adj-line-002-2', adjustmentId: 'adjustment-inventory', ledgerId: 'ledger-110100', lineNumber: 2, debitPaise: 0, creditPaise: rupees(150_000), description: 'Reduce inventory carrying amount' },
  { id: 'adj-line-003-1', adjustmentId: 'adjustment-accrual', ledgerId: 'ledger-400300', lineNumber: 1, debitPaise: rupees(80_000), creditPaise: 0, description: 'Utilities expense accrual' },
  { id: 'adj-line-003-2', adjustmentId: 'adjustment-accrual', ledgerId: 'ledger-220300', lineNumber: 2, debitPaise: 0, creditPaise: rupees(80_000), description: 'Accrued utilities liability' }
];

const demoNoteOverrides: Record<string, Partial<NoteDisclosure>> = {
  '1': { status: 'COMPLETE', narrative: 'Saffron Industries Private Limited manufactures precision industrial components. This company, every person name and all figures are synthetic.', owner: 'Abhijit' },
  '2': { status: 'IN_REVIEW', narrative: 'Basis of preparation, estimates, revenue, PPE, inventory, employee benefits, taxes and provisions.', owner: 'Riya Sharma' },
  '3': { status: 'COMPLETE', narrative: 'Reconciled to the synthetic fixed-asset register.', owner: 'Abhijit' },
  '7': { status: 'COMPLETE', narrative: 'Includes provision for slow-moving inventory.', owner: 'Abhijit' },
  '8': { status: 'IN_REVIEW', narrative: 'Ageing and credit-risk analysis prepared for review.', owner: 'Riya Sharma' },
  '12': { status: 'COMPLETE', narrative: 'Authorised, issued and paid-up capital; synthetic promoter schedule attached.', owner: 'Abhijit' },
  '14': { status: 'COMPLETE', narrative: 'Security, terms and repayment schedule are synthetic.', owner: 'Riya Sharma' },
  '17': { status: 'PENDING', narrative: 'MSME ageing disclosure awaiting final review.', owner: 'Abhijit' },
  '21': { status: 'COMPLETE', narrative: 'Revenue by product group and geography.', owner: 'Abhijit' },
  '29': { status: 'IN_REVIEW', narrative: 'Variances above the configured threshold require explanation.', owner: 'Riya Sharma' }
};

export const demoNotes: NoteDisclosure[] = createDivisionINoteTemplates({
  companyId: demoCompany.id,
  periodId: demoPeriod.id,
  companyName: demoCompany.legalName,
  owner: 'Abhijit',
  now: DEMO_DATE,
  demo: true
}).map((note) => ({ ...note, ...demoNoteOverrides[note.noteNumber] }));

export const demoUsers: LocalUser[] = [
  { id: 'demo-admin', username: 'admin', displayName: 'Local Administrator', role: 'ADMIN', active: true, createdAt: DEMO_DATE },
  { id: 'demo-preparer', username: 'abhijit', displayName: 'Abhijit', role: 'PREPARER', active: true, createdAt: DEMO_DATE },
  { id: 'demo-reviewer', username: 'rsharma', displayName: 'Riya Sharma', role: 'REVIEWER', active: true, createdAt: DEMO_DATE }
];

export const demoValidations: ValidationResult[] = [
  {
    id: 'validation-disc-msme',
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    ruleId: 'DISC-003',
    severity: 'WARNING',
    title: 'Trade payable ageing review pending',
    message: 'The mapped trade-payables balance is complete, but the synthetic MSME ageing disclosure remains in review.',
    evidence: 'Note 17 is marked Pending.',
    suggestedAction: 'Complete the MSME and ageing schedule, then obtain reviewer sign-off.',
    entityType: 'NOTE',
    entityId: `${demoPeriod.id}-note-17`,
    status: 'OPEN',
    generatedAt: DEMO_DATE
  },
  {
    id: 'validation-ratio-receivables',
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    ruleId: 'RATIO-001',
    severity: 'WARNING',
    title: 'Receivables increased faster than revenue',
    message: 'Trade receivables increased by approximately 26.5% while revenue increased by 14.3%.',
    evidence: 'Current ₹62.00 lakh; comparative ₹49.00 lakh.',
    suggestedAction: 'Add collection and ageing commentary to the Board Pack.',
    entityType: 'TAXONOMY_NODE',
    entityId: 'BS-CA-RECEIVABLE',
    status: 'ACCEPTED',
    resolution: 'Collections after year end were reviewed; variance commentary added to the synthetic Board Pack.',
    resolvedBy: 'demo-reviewer',
    resolvedAt: DEMO_DATE,
    generatedAt: DEMO_DATE
  }
];

export const demoAuditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    sequence: 1,
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    timestamp: '2026-04-10T08:00:00.000Z',
    actorId: 'demo-preparer',
    actorRole: 'PREPARER',
    action: 'TB_IMPORT_ACTIVATED',
    entityType: 'TB_IMPORT',
    entityId: demoImport.id,
    reason: 'Initial year-end Trial Balance import.',
    previousEventHash: 'GENESIS',
    eventHash: 'sha256:demo-audit-1'
  },
  {
    id: 'audit-2',
    sequence: 2,
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    timestamp: '2026-04-11T12:30:00.000Z',
    actorId: 'demo-reviewer',
    actorRole: 'REVIEWER',
    action: 'MAPPING_VERSION_LOCKED',
    entityType: 'MAPPING_VERSION',
    entityId: 'demo-mapping-v1',
    reason: 'All material ledgers reviewed against Division I taxonomy.',
    previousEventHash: 'sha256:demo-audit-1',
    eventHash: 'sha256:demo-audit-2'
  },
  {
    id: 'audit-3',
    sequence: 3,
    companyId: demoCompany.id,
    periodId: demoPeriod.id,
    timestamp: '2026-04-15T08:35:00.000Z',
    actorId: 'demo-reviewer',
    actorRole: 'REVIEWER',
    action: 'ADJUSTMENT_POSTED',
    entityType: 'ADJUSTMENT',
    entityId: 'adjustment-inventory',
    reason: 'Reviewed inventory ageing provision posted.',
    previousEventHash: 'sha256:demo-audit-2',
    eventHash: 'sha256:demo-audit-3'
  }
];

export const demoDataset = {
  company: demoCompany,
  period: demoPeriod,
  activeImport: demoImport,
  ledgers: demoLedgers,
  mappings: demoMappings,
  adjustments: demoAdjustments,
  adjustmentLines: demoAdjustmentLines,
  notes: demoNotes,
  users: demoUsers,
  validations: demoValidations,
  auditEvents: demoAuditEvents
};
