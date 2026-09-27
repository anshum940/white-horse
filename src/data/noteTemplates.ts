import { taxonomy } from './taxonomy';
import type { NoteDisclosure } from '../domain/types';

export interface NoteTemplateInput {
  companyId: string;
  periodId: string;
  companyName: string;
  owner: string;
  now?: string;
  demo?: boolean;
}

const disclosureGuidance: Record<string, string> = {
  '3': 'Reconcile opening gross block, additions, disposals, depreciation, impairment and closing net block to the fixed-asset register.',
  '4': 'Reconcile opening balance, additions, disposals, amortisation, impairment and closing balance for each class of intangible asset.',
  '5': 'Disclose class, quoted/unquoted status, carrying amount, market value where applicable and impairment for investments.',
  '6': 'Explain the components and recognition basis of deferred tax assets and liabilities, including recoverability evidence.',
  '7': 'Disclose inventory classes, valuation policy, write-downs and any pledged inventory.',
  '8': 'Complete the trade-receivable ageing schedule, credit-risk assessment, disputed balances and related-party information.',
  '9': 'Reconcile bank and cash balances and disclose restrictions, earmarked balances and deposit classifications where applicable.',
  '10': 'Describe material prepayments and their expected recognition period.',
  '11': 'Explain material other current assets, advances and recoverability considerations.',
  '12': 'Complete authorised, issued, subscribed and paid-up capital, reconciliation, rights, promoter shareholding and five-year issue history.',
  '13': 'Provide a movement schedule and the nature and purpose of each reserve and surplus component.',
  '14': 'Disclose lender, security, repayment terms, interest rate, defaults and current/non-current classification for borrowings.',
  '15': 'Explain the nature, measurement basis and expected timing of long-term provisions.',
  '16': 'Disclose facilities, lender, security, terms, defaults and reconciliation for short-term borrowings.',
  '17': 'Complete MSME and non-MSME trade-payable ageing, disputed balances and statutory MSME disclosures.',
  '18': 'Explain material statutory dues, accruals, advances from customers and other current liabilities.',
  '19': 'Provide a movement and utilisation schedule for material short-term provisions.',
  '20': 'Reconcile current-tax liabilities/assets with the tax computation and payments.',
  '21': 'Disaggregate revenue by material product/service and geography where relevant, and document the recognition policy.',
  '22': 'Describe and disaggregate material other-income classes and unusual items.',
  '23': 'Reconcile consumption/purchases to inventory records and explain significant variances.',
  '24': 'Disclose employee-benefit expense classes and cross-reference applicable defined-benefit disclosures.',
  '25': 'Reconcile depreciation and amortisation to the PPE and intangible-asset schedules.',
  '26': 'Disclose interest and other finance-cost classes, including capitalised borrowing costs where applicable.',
  '27': 'Disaggregate material expenses and complete additional Schedule III disclosures applicable to the entity.',
  '28': 'Reconcile current and deferred tax expense to supporting computations and explain material components.'
};

export function createDivisionINoteTemplates(input: NoteTemplateInput): NoteDisclosure[] {
  const now = input.now ?? new Date().toISOString();
  const grouped = new Map<string, { title: string; codes: string[] }>();
  for (const node of taxonomy) {
    if (!node.noteNumber) continue;
    const existing = grouped.get(node.noteNumber) ?? { title: node.label, codes: [] };
    existing.codes.push(node.code);
    if (existing.title !== node.label) existing.title = node.noteNumber === '28' ? 'Tax expense' : existing.title;
    grouped.set(node.noteNumber, existing);
  }

  const notes: NoteDisclosure[] = [
    {
      id: `${input.periodId}-note-1`,
      companyId: input.companyId,
      periodId: input.periodId,
      noteNumber: '1',
      title: 'Corporate information',
      taxonomyCodes: [],
      status: input.demo ? 'COMPLETE' : 'PENDING',
      owner: input.owner,
      narrative: input.demo
        ? `${input.companyName} is a synthetic demonstration entity. All names and figures in this workspace are illustrative.`
        : `Complete the legal form, registered office, principal activities and other entity-specific corporate information for ${input.companyName}.`,
      updatedAt: now
    },
    {
      id: `${input.periodId}-note-2`,
      companyId: input.companyId,
      periodId: input.periodId,
      noteNumber: '2',
      title: 'Basis of preparation and significant accounting policies',
      taxonomyCodes: [],
      status: 'PENDING',
      owner: input.owner,
      narrative: 'Complete the basis of preparation, use of estimates, going concern, revenue, PPE, intangible assets, inventory, employee benefits, taxes, provisions, foreign currency and other policies applicable to the entity.',
      updatedAt: now
    }
  ];

  for (const [noteNumber, details] of [...grouped.entries()].sort((left, right) => Number(left[0]) - Number(right[0]))) {
    notes.push({
      id: `${input.periodId}-note-${noteNumber}`,
      companyId: input.companyId,
      periodId: input.periodId,
      noteNumber,
      title: details.title,
      taxonomyCodes: details.codes,
      status: 'PENDING',
      owner: input.owner,
      narrative: disclosureGuidance[noteNumber] ?? 'Complete all applicable entity-specific disclosures and reconcile the schedule to the mapped statement balance.',
      updatedAt: now
    });
  }

  notes.push(
    {
      id: `${input.periodId}-note-29`,
      companyId: input.companyId,
      periodId: input.periodId,
      noteNumber: '29',
      title: 'Analytical ratios and explanations',
      taxonomyCodes: [],
      status: 'PENDING',
      owner: input.owner,
      narrative: 'Review every calculated ratio, confirm the entity-specific formula basis and explain material year-on-year movements.',
      updatedAt: now
    },
    {
      id: `${input.periodId}-note-30`,
      companyId: input.companyId,
      periodId: input.periodId,
      noteNumber: '30',
      title: 'Additional regulatory information',
      taxonomyCodes: [],
      status: 'PENDING',
      owner: input.owner,
      narrative: 'Complete all applicable additional Schedule III regulatory disclosures, including title deeds, loans and advances, benami property, borrowings secured by current assets, wilful defaulter status, struck-off companies, charges, layers, schemes, utilisation of borrowed funds/share premium, undisclosed income, CSR and crypto/virtual currency.',
      updatedAt: now
    }
  );

  return notes;
}
