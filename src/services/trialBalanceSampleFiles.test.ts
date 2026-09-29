/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTrialBalanceFile } from './trialBalanceImport';

const samples = [
  {
    fileName: 'Sample_Meridian_Manufacturing_TB_FY2025-26.xlsx',
    rowCount: 25,
    currentTotalPaise: 11_740_000_000,
    comparativeTotalPaise: 10_030_000_000
  },
  {
    fileName: 'Sample_BluePeak_Digital_Services_TB_FY2025-26.xlsx',
    rowCount: 21,
    currentTotalPaise: 5_120_000_000,
    comparativeTotalPaise: 3_655_000_000
  },
  {
    fileName: 'Sample_GreenTrail_Foods_TB_FY2025-26.xlsx',
    rowCount: 24,
    currentTotalPaise: 12_030_000_000,
    comparativeTotalPaise: 9_870_000_000
  }
] as const;

describe('downloadable sample Trial Balances', () => {
  for (const sample of samples) {
    it(`imports ${sample.fileName} without an error`, async () => {
      const workbook = await readFile(join(process.cwd(), 'public', 'samples', sample.fileName));
      const preview = await parseTrialBalanceFile(new File([new Uint8Array(workbook)], sample.fileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));

      expect(preview.selectedWorksheet).toBe('Trial Balance Import');
      expect(preview.formatStatus).toBe('STANDARD');
      expect(preview.mappingRequired).toBe(false);
      expect(preview.errors).toEqual([]);
      expect(preview.rows).toHaveLength(sample.rowCount);
      expect(preview.debitTotalPaise).toBe(sample.currentTotalPaise);
      expect(preview.creditTotalPaise).toBe(sample.currentTotalPaise);
      expect(preview.rows.reduce((total, row) => total + Math.max(row.signedComparativePaise, 0), 0)).toBe(sample.comparativeTotalPaise);
      expect(preview.rows.reduce((total, row) => total + Math.max(-row.signedComparativePaise, 0), 0)).toBe(sample.comparativeTotalPaise);
      expect(preview.differencePaise).toBe(0);
    });
  }
});
