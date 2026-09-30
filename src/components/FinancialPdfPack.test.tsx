import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { demoDataset } from '../data/demo';
import { taxonomy } from '../data/taxonomy';
import { calculateFinancialStatements, calculateKpis } from '../domain/statements';
import { defaultStatementSignatureSettings } from '../domain/signatureSettings';
import { FinancialPdfPack } from './FinancialPdfPack';

describe('financial PDF print pack', () => {
  it('contains all face statements, notes, ratios and optional signing blocks', () => {
    const workspace = {
      ...demoDataset,
      period: {
        ...demoDataset.period,
        signatureSettings: {
          ...defaultStatementSignatureSettings(demoDataset.period.endDate, demoDataset.company.registeredOffice),
          showDirector: true,
          directorName: 'Asha Rao',
          directorDin: '12345678',
          additionalDirectors: [{ name: 'Neha Kapoor', designation: 'Managing Director', din: '87654321' }],
          showCharteredAccountant: true,
          caFirmName: 'Rao & Co.',
          caName: 'Vikram Rao',
          caMembershipNumber: '123456',
          place: 'Pune'
        }
      }
    };
    const context = {
      period: workspace.period,
      ledgers: workspace.ledgers,
      mappings: workspace.mappings,
      adjustments: workspace.adjustments,
      adjustmentLines: workspace.adjustmentLines,
      taxonomy
    };
    const statements = calculateFinancialStatements(context);
    const kpis = calculateKpis(context, statements);
    const html = renderToStaticMarkup(<FinancialPdfPack workspace={workspace} statements={statements} kpis={kpis}/>);

    expect(html).toContain('Balance Sheet');
    expect(html).toContain('Statement of Profit and Loss');
    expect(html).toContain('Cash Flow Statement');
    expect(html).toContain('Notes to Accounts');
    expect(html).toContain('Automatic company disclosure');
    expect(html).toContain(workspace.company.cin);
    expect(html).toContain('Analytical ratio schedule');
    expect(html).toContain('Asha Rao');
    expect(html).toContain('DIN: 12345678');
    expect(html).toContain('Neha Kapoor');
    expect(html).toContain('DIN: 87654321');
    expect(html).toContain('Vikram Rao');
    expect(html).toContain('Membership No.: 123456');
    expect(html.indexOf('EQUITY AND LIABILITIES')).toBeLessThan(html.indexOf('ASSETS'));
  });

  it('does not report an unsupplied comparative cash-flow summary as zero', () => {
    const workspace = {
      ...demoDataset,
      period: {
        ...demoDataset.period,
        comparativeCashFlowSummary: { operating: 0, investing: 0, financing: 0, openingCash: 0 }
      }
    };
    const context = { period: workspace.period, ledgers: workspace.ledgers, mappings: workspace.mappings, adjustments: workspace.adjustments, adjustmentLines: workspace.adjustmentLines, taxonomy };
    const statements = calculateFinancialStatements(context);
    const kpis = calculateKpis(context, statements);
    const html = renderToStaticMarkup(<FinancialPdfPack workspace={workspace} statements={statements} kpis={kpis}/>);
    expect(html).toContain('Comparative cash-flow details were not supplied');
    expect(html).toContain('<td class="amount-column">—</td>');
  });
});
