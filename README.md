# unocha-flashes

This repo contains the Flash Updates issued by the UN's Office for the Coordination of Humanitarian Affairs (OCHA). They've been converted from HTML into Markdown for easier parseability.

- `reports/` has the full reports
- `parsed/` has extracts from the reports

The reports were daily except for the following reports which consolidated information for hiatus days:

- 2023-12-18 covered two days (17th and 18th) - 1 skipped
- 2023-12-26 covered four days (23rd to 26th) - 3 skipped
- 2024-01-02 covered three days (Dec 31st to Jan 2nd) - 2 skipped
- 2024-01-07 covered two days (6th and 7th) - 1 skipped
- 2024-01-14 covered two days (13th and 14th) - 1 skipped
- 2024-01-21 covered two days (20th and 21st) - 1 skipped
- 2024-01-28 covered two days (27th and 28th) - 1 skipped
- 2024-02-04 covered two days (3rd and 4th) - 1 skipped
- 2024-02-12 covered three days (10th to 12th) - 2 skipped

In total, 13 days will not have a report available.

## Refining Extraction

This is the pipeline in order of refinement:

- full flash update doc is written to `reports/` for reading here with scripts
- `*-raw.md` is written with text extractions fuzzy-matching some template strings examples of what we're looking for
- the non-raw markdown file is written with extractions from the raw file for matching text we want to parse
- the non-raw markdown file is iterated over and matched with regex with groups for desired numbers to extract the values we're looking for
- a CSV file is written with the values in a structured format by report date

Generally to fill in missing values you'd:

- ensure the paragraph exists in the non-raw markdown file holding the values you want for the missing report date, and if it is not in the file you would add a template string to match against
- ensure the regex will match against the resulting string once it exists in the non-raw markdown file and add or amend accordingly until the values show up
