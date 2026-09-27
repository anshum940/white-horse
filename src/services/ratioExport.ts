import type { RatioScheduleRow } from '../domain/ratios';

function quote(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function rawRatio(value: number | null, format: RatioScheduleRow['format']): string {
  if (value === null) return '';
  return format === '%' ? (value * 100).toFixed(4) : value.toFixed(4);
}

export function buildRatioScheduleCsv(rows: RatioScheduleRow[], currentLabel: string, comparativeLabel: string): string {
  const records = [
    ['Ratio', 'Formula', currentLabel, comparativeLabel, 'Unit', 'Benchmark / review basis', 'Status'],
    ...rows.map((row) => [
      row.name,
      row.formula,
      rawRatio(row.current, row.format),
      rawRatio(row.comparative, row.format),
      row.format === '%' ? 'Percent' : 'Times',
      row.benchmark,
      row.withinRange === null ? 'INPUT REQUIRED / N/A' : row.withinRange ? 'WITHIN ILLUSTRATIVE RANGE' : 'REVIEW'
    ])
  ];
  return `\uFEFF${records.map((record) => record.map(quote).join(',')).join('\r\n')}\r\n`;
}

export function downloadRatioScheduleCsv(rows: RatioScheduleRow[], currentLabel: string, comparativeLabel: string, fileStem: string): void {
  const blob = new Blob([buildRatioScheduleCsv(rows, currentLabel, comparativeLabel)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileStem.replace(/[^a-z0-9_-]+/gi, '_')}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
