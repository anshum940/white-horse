# White Horse Trial Balance Import Format

## Purpose

Use this format to import a company Trial Balance into White Horse. The application parses the file locally in the browser; it does not upload the file to a server.

Downloadable templates are available inside **Trial Balance → TB import format** in both CSV and XLSX formats. The repository copy is `samples/white-horse-tb-template.csv`.

## Prescribed columns

| Column | Requirement | Rule |
| --- | --- | --- |
| `Ledger Code` | Required | Unique text/code for every ledger. Duplicate codes are rejected. |
| `Ledger Name` | Required | Plain-text ledger name. |
| `Group` | Recommended | Source-system group, such as Assets, Liabilities, Income or Expenses. |
| `Subgroup` | Recommended | More specific source classification, such as Cash, Inventory or Revenue. |
| `Closing Debit` | Required pair | Positive amount in INR or zero. Do not import values in lakhs/crores. |
| `Closing Credit` | Required pair | Positive amount in INR or zero. Only one closing side may be non-zero on a ledger row. |
| `Previous Debit` | Recommended | Prior-year closing debit in INR for comparative statements. |
| `Previous Credit` | Recommended | Prior-year closing credit in INR for comparative statements. |

At least one closing debit/credit column must be present, but the prescribed template includes both. Total closing debits must equal total closing credits exactly in paise.

## File rules

- Accepted formats: `.csv` and `.xlsx`.
- Put the header in row 1 and ledger records immediately below it.
- For XLSX, place the Trial Balance on the first worksheet.
- Maximum size: 25 MB; maximum rows including the header: 50,001.
- Use positive numbers in the appropriate debit or credit column; do not use signed/negative balances.
- Do not include total rows, blank headings, merged cells, formulas, macros, subtotals or narration-only rows.
- Replace/delete both `EXAMPLE-*` rows in the downloaded template before importing a real company Trial Balance.
- Ledger codes must remain stable between reporting periods to improve mapping continuity and audit traceability.
- Comparative balances are strongly recommended. Missing comparative values are accepted with a review warning.

## Optional extended movement format

White Horse also recognises these optional columns when the source system provides a movement Trial Balance:

- `Opening Debit`
- `Opening Credit`
- `Debit`
- `Credit`

When movement columns and closing columns are both supplied, White Horse checks that opening debit less opening credit plus debit movement less credit movement equals closing debit less closing credit for each row. A mismatch produces a review warning.

## Recognised aliases

The importer accepts common aliases such as `Account Code`, `GL Code`, `Account Name`, `Closing Dr`, `Closing Cr`, `Prior Year Debit` and `Prior Year Credit`. For repeatable client onboarding, use the prescribed names exactly.

## Control sequence

1. Download the template.
2. Replace the two example rows with the complete ledger population.
3. Confirm totals in the source system.
4. Import the file and review the in-browser preview.
5. Correct every blocking error and assess warnings.
6. Confirm and activate the balanced version.
7. Review every suggested Schedule III mapping before locking the mapping version.

Amounts, classifications and disclosures remain the responsibility of the preparer and reviewer. A balanced Trial Balance alone does not establish Schedule III or accounting-standard compliance.
