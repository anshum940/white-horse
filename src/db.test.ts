import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createCompanyWorkspace,
  db,
  initializeDatabase,
  listCompanyWorkspaces,
  loadWorkspace,
  type CompanyWorkspaceInput
} from './db';

const input = (): CompanyWorkspaceInput => ({
  legalName: 'Persistence Test Private Limited',
  tradeName: 'Persistence Test',
  cin: 'U62010DL2026PTC654321',
  registeredOffice: 'New Delhi, India',
  industry: 'Software services',
  displayScale: 'LAKHS',
  periodLabel: 'FY 2026–27',
  startDate: '2026-04-01',
  endDate: '2027-03-31',
  comparativeLabel: 'FY 2025–26',
  comparativeStartDate: '2025-04-01',
  comparativeEndDate: '2026-03-31',
  materialityPaise: 10_000_000
});

describe('company workspace database controls', () => {
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

  it('rejects an invalid CIN before writing any company records', async () => {
    const before = await db.companies.count();
    await expect(createCompanyWorkspace({ ...input(), cin: 'INVALID' })).rejects.toThrow('exactly 21');
    await expect(db.companies.count()).resolves.toBe(before);
  });

  it('creates one independent workspace and rejects a duplicate CIN', async () => {
    const companyId = await createCompanyWorkspace(input());
    const workspace = await loadWorkspace(companyId);
    expect(workspace?.company.legalName).toBe('Persistence Test Private Limited');
    expect(workspace?.period.label).toBe('FY 2026–27');
    expect(workspace?.notes).toHaveLength(30);
    await expect(createCompanyWorkspace({ ...input(), legalName: 'Duplicate Private Limited' })).rejects.toThrow('already exists');
  });

  it('retains the created workspace after the IndexedDB connection is closed and reopened', async () => {
    const companyId = await createCompanyWorkspace(input());
    db.close();
    await db.open();
    const companies = await listCompanyWorkspaces();
    expect(companies.some((company) => company.companyId === companyId)).toBe(true);
    await expect(loadWorkspace(companyId)).resolves.toMatchObject({
      company: { cin: 'U62010DL2026PTC654321' },
      period: { startDate: '2026-04-01', endDate: '2027-03-31' }
    });
  });
});
