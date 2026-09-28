# White Horse Trial Balance Import Guide

## Purpose

White Horse can read many tabular Trial Balance exports directly and provides a manual mapper for unfamiliar vendor headings. The application parses the file locally in the browser; it does not upload the file to a server. `WH-TB-1.0` remains the preferred vendor-neutral format for controlled, repeatable onboarding and period-to-period consistency.

Downloadable templates are available inside **Trial Balance → Standard TB template** in both CSV and XLSX formats. The XLSX contains a blank sheet named `Trial Balance Import`, an `Instructions` sheet, and a separate `Worked Example` sheet. White Horse scans candidate worksheets and deliberately excludes clearly named instruction/example/sample sheets from automatic selection whenever another sheet exists; the user can still select any worksheet and header row explicitly. The repository CSV copy is `samples/white-horse-tb-template.csv`.

## Adaptive import workflow

The importer accepts `.xlsx`, `.csv`, `.tsv`, and delimited `.txt` files. It:

1. Detects comma, tab, semicolon, or pipe delimiters for text files.
2. Scans every XLSX worksheet and the first 50 rows for a likely header.
3. Recognises one-row and two-tier headers plus common ledger/account aliases.
4. Supports separate closing debit/credit columns, opening plus period debit/credit movements, signed balances with `DR`/`CR` suffixes, and signed balances with a separate Dr/Cr indicator.
5. Allows the worksheet, header row, header depth, and each semantic column to be corrected in **Review mapping**.
6. Generates stable source-row import codes when a ledger-code column is absent and reports this as a warning.
7. Ignores blank/title/narration rows without balances and excludes exact `Total`, `Grand Total`, `Control Total`, or `Net Total` rows to prevent double counting.
8. Blocks activation until the preview is non-empty, fully mapped, error-free, and balanced exactly in paise.

If a single numeric balance column has no Dr/Cr suffix or indicator, White Horse deliberately requires the preparer to select **Positive = debit** or **Positive = credit**. It does not guess an accounting sign convention.

The importer does not claim to interpret scanned/image PDFs, legacy binary `.xls`, password-protected or corrupt workbooks, macros, or proprietary accounting-database files. Export or convert those sources to a supported tabular file first.

## Prescribed columns

| Column | Requirement | Rule |
| --- | --- | --- |
| `Ledger Code` | Recommended | Unique text/code for every ledger. Duplicate codes are rejected. When absent, White Horse generates a source-row code and warns the user. |
| `Ledger Name` | Required | Plain-text ledger name. |
| `Group` | Recommended | Source-system group, such as Assets, Liabilities, Income or Expenses. |
| `Subgroup` | Recommended | More specific source classification, such as Cash, Inventory or Revenue. |
| `Closing Debit` | Required pair | Positive amount in INR or zero. Do not import values in lakhs/crores. |
| `Closing Credit` | Required pair | Positive amount in INR or zero. Only one closing side may be non-zero on a ledger row. |
| `Previous Debit` | Recommended | Prior-year closing debit in INR for comparative statements. |
| `Previous Credit` | Recommended | Prior-year closing credit in INR for comparative statements. |

For `WH-TB-1.0`, keep all eight headings in row 1 exactly as supplied. Group, Subgroup, Previous Debit and Previous Credit may be blank when genuinely unavailable, but their columns remain in the standard file. Total closing debits must equal total closing credits exactly in paise.

## Converting an export from any accounting package

| Source export concept | White Horse column | Conversion rule |
| --- | --- | --- |
| Account / ledger identifier | `Ledger Code` | Prefer a unique, stable source code. If none exists, White Horse generates an import-row code; adopt controlled permanent codes before relying on cross-period mapping continuity. |
| Account / ledger description | `Ledger Name` | Copy the ledger-level name, not a group heading or narration. |
| Primary account class | `Group` | Copy the source group or classify as Assets, Liabilities, Equity, Income or Expenses. |
| Detailed account class | `Subgroup` | Copy the closest source subgroup when available. |
| Current closing debit balance | `Closing Debit` | Positive INR value or zero. Move negative debit balances to Closing Credit as a positive value after accounting review. |
| Current closing credit balance | `Closing Credit` | Positive INR value or zero. Only one current closing side may be non-zero for a ledger. |
| Prior closing debit balance | `Previous Debit` | Positive INR value or zero. Leave blank only when a comparative is genuinely unavailable. |
| Prior closing credit balance | `Previous Credit` | Positive INR value or zero. Only one prior-period side may be non-zero for a ledger. |

One imported balance row must represent one posting ledger. The adaptive importer can skip title/blank rows and exact total rows, but removing unnecessary presentation rows remains safer and makes review easier.

## File rules

- Accepted formats: `.xlsx`, `.csv`, `.tsv`, and delimited `.txt`.
- Maximum size: 25 MB; maximum selected-sheet data rows: 50,000; maximum workbook rows inspected across sheets: 200,000.
- The automatic detector inspects up to the first 50 rows. Select the correct worksheet/header manually if necessary.
- Dedicated debit/credit columns may contain positive values. A negative number in a dedicated side column is normalised to its stated side and reported as a warning.
- A signed-balance layout must carry a Dr/Cr suffix/indicator or an explicit user-selected positive-value convention.
- Merged presentation headers can be represented by a two-tier header, but macros and password protection are not executed or bypassed.
- The `Worked Example` sheet is guidance only; do not activate it as company data.
- Ledger codes must remain stable between reporting periods to improve mapping continuity and audit traceability.
- Comparative balances are strongly recommended. Missing comparative values are accepted with a review warning.

## Optional extended movement format

White Horse also recognises these optional columns when the source system provides a movement Trial Balance:

- `Opening Debit`
- `Opening Credit`
- `Debit`
- `Credit`

When movement columns and closing columns are both supplied, White Horse checks that opening debit less opening credit plus debit movement less credit movement equals closing debit less closing credit for each row. A mismatch produces a review warning.

## Recognised aliases and manual mapping

The importer accepts common aliases such as `Account Code`, `GL Code`, `GL Account`, `Account Description`, `Account Name`, `Closing Dr`, `Closing Cr`, `Debit Amount`, `Credit Amount`, `Balance`, `Amount`, `Prior Year Debit` and `Prior Year Credit`. For unknown headings, select **Review mapping** and map Ledger Name plus one valid balance layout. Ledger Code, groups, and comparative columns are optional. For repeatable client onboarding, use the prescribed `WH-TB-1.0` names exactly.

## Control sequence

1. Export a ledger-level Trial Balance from the source accounting software as XLSX or delimited text.
2. Import it directly and review the detected worksheet, header row, header depth, mapped columns, sample ledgers, warnings, and totals.
3. If detection is ambiguous, map the columns in the browser. If the source itself is unsuitable, copy it into the standard XLSX template.
4. Confirm the preview totals agree with the source system and that closing debit equals closing credit exactly.
5. Correct every blocking error and assess every warning; never force activation.
6. Confirm and activate the balanced version. The former active import is retained as superseded.
7. Review every suggested Schedule III mapping before locking the mapping version.

Amounts, classifications and disclosures remain the responsibility of the preparer and reviewer. A balanced Trial Balance alone does not establish Schedule III or accounting-standard compliance.
