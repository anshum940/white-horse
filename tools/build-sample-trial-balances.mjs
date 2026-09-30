import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const project = process.cwd();
const seeds = JSON.parse(await fs.readFile(path.join(project, 'tools', 'sample-trial-balances.json'), 'utf8'));
const outputDir = path.join(project, 'outputs', 'demo-trial-balances-20260930');
const previewDir = path.join(project, 'tmp', 'sample-workbook-previews');
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

for (const sample of seeds) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add('Trial Balance Import');
  const instructions = workbook.worksheets.add('Instructions');
  const headers = ['Ledger Code', 'Ledger Name', 'Group', 'Subgroup', 'Closing Debit', 'Closing Credit', 'Previous Debit', 'Previous Credit'];
  const values = sample.rows.map(([code, name, group, subGroup, current, comparative]) => [
    code, name, group, subGroup,
    Math.max(current, 0), Math.max(-current, 0),
    Math.max(comparative, 0), Math.max(-comparative, 0)
  ]);
  const sum = (index) => values.reduce((total, row) => total + row[index], 0);
  if (sum(4) !== sum(5) || sum(6) !== sum(7)) throw new Error(`${sample.fileName} does not balance.`);

  sheet.showGridLines = false;
  sheet.getRange('A1:H1').values = [headers];
  sheet.getRangeByIndexes(1, 0, values.length, 8).values = values;
  sheet.getRange(`A1:H${values.length + 1}`).format.font = { name: 'Aptos', size: 11, color: '#233333' };
  sheet.getRange('A1:H1').format = {
    fill: '#143D3B', font: { name: 'Aptos', size: 11, bold: true, color: '#FFFFFF' },
    rowHeight: 28, verticalAlignment: 'center'
  };
  sheet.getRange(`E2:H${values.length + 1}`).setNumberFormat('#,##0.00;[Red](#,##0.00);–');
  sheet.getRange(`E2:H${values.length + 1}`).format.horizontalAlignment = 'right';
  sheet.getRange(`A2:H${values.length + 1}`).format.rowHeight = 23;
  for (let row = 2; row <= values.length + 1; row += 2) sheet.getRange(`A${row}:H${row}`).format.fill = '#F1F6F4';
  for (const [column, width] of Object.entries({ A: 105, B: 300, C: 105, D: 225, E: 150, F: 150, G: 150, H: 150 })) {
    sheet.getRange(`${column}:${column}`).format.columnWidthPx = width;
  }
  sheet.freezePanes.freezeRows(1);

  instructions.showGridLines = false;
  instructions.getRange('A1:B1').values = [[sample.company, null]];
  instructions.getRange('A1:B1').format = {
    fill: '#143D3B', font: { name: 'Aptos Display', size: 16, bold: true, color: '#FFFFFF' }, rowHeight: 34
  };
  instructions.getRange('A3:B11').values = [
    ['Purpose', 'Synthetic, ready-to-import White Horse demonstration Trial Balance'],
    ['Reporting period', 'FY 2025–26, with FY 2024–25 comparatives'],
    ['Industry', sample.industry],
    ['Current debit / credit', `INR ${sum(4).toLocaleString('en-IN')} each`],
    ['Comparative debit / credit', `INR ${sum(6).toLocaleString('en-IN')} each`],
    ['Cash-flow scenario', sample.scenario],
    ['Import step 1', 'Create/select this company and FY 2025–26 reporting period in White Horse.'],
    ['Import step 2', 'Import this XLSX; keep the first worksheet Trial Balance Import selected.'],
    ['Review control', 'Check every suggested Schedule III mapping and all entity-specific disclosures before external use.']
  ];
  instructions.getRange('A3:B11').format.font = { name: 'Aptos', size: 11, color: '#233333' };
  instructions.getRange('A3:A11').format.font = { name: 'Aptos', size: 11, bold: true, color: '#143D3B' };
  instructions.getRange('A:A').format.columnWidthPx = 180;
  instructions.getRange('B:B').format.columnWidthPx = 720;
  instructions.getRange('B8').format.wrapText = true;
  instructions.getRange('A8:B8').format.rowHeight = 82;
  instructions.getRange('A3:B11').format.verticalAlignment = 'center';

  workbook.recalculate();
  const preview = await workbook.render({ sheetName: 'Trial Balance Import', range: 'A1:H10', scale: 1, format: 'png' });
  await fs.writeFile(path.join(previewDir, sample.fileName.replace('.xlsx', '.png')), new Uint8Array(await preview.arrayBuffer()));
  const instructionsPreview = await workbook.render({ sheetName: 'Instructions', range: 'A1:B11', scale: 1, format: 'png' });
  await fs.writeFile(path.join(previewDir, sample.fileName.replace('.xlsx', '-instructions.png')), new Uint8Array(await instructionsPreview.arrayBuffer()));
  const scan = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!', options: { useRegex: true, maxResults: 20 }, maxChars: 1000 });
  if (scan.ndjson?.includes('cell')) throw new Error(`Formula error in ${sample.fileName}: ${scan.ndjson}`);
  const output = await SpreadsheetFile.exportXlsx(workbook);
  const outputPath = path.join(outputDir, sample.fileName);
  await output.save(outputPath);
  await fs.copyFile(outputPath, path.join(project, 'public', 'samples', sample.fileName));
  console.log(`${sample.fileName}: ${values.length} ledgers; current INR ${sum(4).toLocaleString('en-IN')}; comparative INR ${sum(6).toLocaleString('en-IN')}`);
}
