# White Horse Standard Trial Balance Import Format

## Purpose

Use vendor-neutral format `WH-TB-1.0` to import a company Trial Balance into White Horse. First export the Trial Balance from the source accounting software, then copy the ledger-level values into this format. Do not upload a native accounting-software export unless its headings already match a recognised layout. The application parses the file locally in the browser; it does not upload the file to a server.

Downloadable templates are available inside **Trial Balance → Standard TB template** in both CSV and XLSX formats. The XLSX contains a blank first sheet named `Trial Balance Import`, an `Instructions` sheet, and a separate `Worked Example` sheet. Only the first sheet is imported. The repository CSV copy is `samples/white-horse-tb-template.csv`.

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

Keep all eight headings in row 1 exactly as supplied. Group, Subgroup, Previous Debit and Previous Credit may be blank when genuinely unavailable, but their columns remain in the standard file. Total closing debits must equal total closing credits exactly in paise.

## Converting an export from any accounting package

| Source export concept | White Horse column | Conversion rule |
| --- | --- | --- |
| Account / ledger identifier | `Ledger Code` | Supply a unique, stable code. If the source has no code, create and retain a controlled code such as `L000001`; do not use the row number when it changes between periods. |
| Account / ledger description | `Ledger Name` | Copy the ledger-level name, not a group heading or narration. |
| Primary account class | `Group` | Copy the source group or classify as Assets, Liabilities, Equity, Income or Expenses. |
| Detailed account class | `Subgroup` | Copy the closest source subgroup when available. |
| Current closing debit balance | `Closing Debit` | Positive INR value or zero. Move negative debit balances to Closing Credit as a positive value after accounting review. |
| Current closing credit balance | `Closing Credit` | Positive INR value or zero. Only one current closing side may be non-zero for a ledger. |
| Prior closing debit balance | `Previous Debit` | Positive INR value or zero. Leave blank only when a comparative is genuinely unavailable. |
| Prior closing credit balance | `Previous Credit` | Positive INR value or zero. Only one prior-period side may be non-zero for a ledger. |

Remove title rows, report dates, group-total rows, subtotals, grand totals, blank separator rows and narrations from the source export before copying it. One import row must represent one posting ledger.

## File rules

- Accepted formats: `.csv` and `.xlsx`.
- Put the header in row 1 and ledger records immediately below it.
- For XLSX, place the Trial Balance on the first worksheet.
- Maximum size: 25 MB; maximum rows including the header: 50,001.
- Use positive numbers in the appropriate debit or credit column; do not use signed/negative balances.
- Do not include total rows, blank headings, merged cells, formulas, macros, subtotals or narration-only rows.
- Do not copy the `Worked Example` sheet into the first sheet. It is guidance only and is never imported.
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

1. Download the standard XLSX template.
2. Export the ledger-level Trial Balance from the source accounting software.
3. Copy and convert the source values into the blank first sheet without changing row 1.
4. Confirm the converted totals agree with the source system and that closing debit equals closing credit.
5. Import the completed standard file and review the in-browser format status and preview.
6. Correct every blocking error and assess warnings.
7. Confirm and activate the balanced version.
8. Review every suggested Schedule III mapping before locking the mapping version.

Amounts, classifications and disclosures remain the responsibility of the preparer and reviewer. A balanced Trial Balance alone does not establish Schedule III or accounting-standard compliance.
