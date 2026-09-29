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

export const divisionIDisclosureGuidance: Record<string, string> = {
  '3': 'Present each class of property, plant and equipment separately. Reconcile opening and closing gross carrying amount and accumulated depreciation/impairment, showing additions, disposals, business-combination movements, other adjustments, depreciation and impairment or reversals. Complete title-deed and capital-work-in-progress disclosures where applicable.',
  '4': 'Present each class of intangible asset separately. Reconcile opening and closing gross carrying amount and accumulated amortisation/impairment, showing additions, disposals, business-combination movements, other adjustments, amortisation and impairment or reversals.',
  '5': 'Disclose class, quoted/unquoted status, carrying amount, market value where applicable and impairment for investments.',
  '6': 'Explain the components and recognition basis of deferred tax assets and liabilities, including recoverability evidence.',
  '7': 'Disclose inventory classes, valuation policy, write-downs and any pledged inventory.',
  '8': 'Complete the prescribed trade-receivable ageing schedule from due date (or transaction date where no due date exists), including disputed balances, credit-risk categories, unbilled dues and related-party information.',
  '9': 'Reconcile bank and cash balances and disclose restrictions, earmarked balances and deposit classifications where applicable.',
  '10': 'Describe material prepayments and their expected recognition period.',
  '11': 'Explain material other current assets, advances and recoverability considerations.',
  '12': 'Complete authorised, issued, subscribed and paid-up capital, a share-count and amount reconciliation, rights/preferences/restrictions, holdings above 5%, promoter shareholding and the required five-year issue history.',
  '13': 'Provide a movement schedule and the nature and purpose of each reserve and surplus component.',
  '14': 'Disclose lender, security, repayment terms, interest rate, defaults and current/non-current classification for borrowings.',
  '15': 'Explain the nature, measurement basis and expected timing of long-term provisions.',
  '16': 'Disclose facilities, lender, security, terms, defaults and reconciliation for short-term borrowings.',
  '17': 'Complete the prescribed MSME and other-creditor trade-payable ageing schedules from due date (or transaction date where no due date exists), separately identifying disputed dues, unbilled dues and statutory MSME disclosures.',
  '18': 'Explain material statutory dues, accruals, advances from customers and other current liabilities.',
  '19': 'Provide a movement and utilisation schedule for material short-term provisions.',
  '20': 'Reconcile current-tax liabilities/assets with the tax computation and payments.',
  '21': 'Disaggregate revenue by material product/service and geography where relevant, and document the recognition policy.',
  '22': 'Describe and disaggregate material other-income classes and unusual items.',
  '23': 'Reconcile consumption/purchases to inventory records and explain significant variances.',
  '24': 'Disclose employee-benefit expense classes and cross-reference applicable defined-benefit disclosures.',
  '25': 'Disaggregate material other-expense classes and separately disclose exceptional or prior-period items where applicable.',
  '26': 'Reconcile depreciation and amortisation expense to the property, plant and equipment and intangible-asset schedules.',
  '27': 'Disclose interest and other finance-cost classes, including capitalised borrowing costs where applicable.',
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
      narrative: divisionIDisclosureGuidance[noteNumber] ?? 'Complete all applicable entity-specific disclosures and reconcile the schedule to the mapped statement balance.',
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
