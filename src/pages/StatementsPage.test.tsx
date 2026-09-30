import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { demoDataset } from '../data/demo';
import { taxonomy } from '../data/taxonomy';
import { calculateFinancialStatements, calculateKpis } from '../domain/statements';
import { StatementsPage } from './StatementsPage';

const context = {
  period: demoDataset.period,
  ledgers: demoDataset.ledgers,
  mappings: demoDataset.mappings,
  adjustments: demoDataset.adjustments,
  adjustmentLines: demoDataset.adjustmentLines,
  taxonomy
};
const statements = calculateFinancialStatements(context);
const kpis = calculateKpis(context, statements);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('statement signing settings', () => {
  it('adds and removes a second Director without removing the first', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<StatementsPage workspace={demoDataset} statements={statements} kpis={kpis} validations={[]} notify={() => undefined}/>);
    });
    const button = (label: string) => [...host.querySelectorAll('button')].find((item) => item.textContent?.includes(label));
    await act(async () => button('PDF & signatures')?.click());
    const toggle = host.querySelector('.signature-toggle input[type="checkbox"]') as HTMLInputElement;
    await act(async () => toggle.click());
    expect(host.textContent).toContain('Director 1');
    await act(async () => button('Add another director')?.click());
    expect(host.textContent).toContain('Director 2');
    expect(host.querySelectorAll('.signature-director-heading')).toHaveLength(2);
    await act(async () => button('Remove director')?.click());
    expect(host.textContent).not.toContain('Director 2');
    expect(host.textContent).toContain('Director 1');
    await act(async () => root.unmount());
  });
});
