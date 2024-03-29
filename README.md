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

If you find a segment is matching when it shouldn't, you can add an exclusion regex matcher.

If there's a hard value to match (like written amount, ie: "Seventy") just add the values directly to the CSV and they won't be overwritten.

## Updating Values

To attempt to pull the latest report (assumes the path formatting hasn't changed): run `bun pull --new`. `bun pull` without the `new` flag will just try to fetch any unfetched links in the links.json file, which is denoted by the truthiness of the third item in each link array.

Commit the updated links.json if the fetch was successful to have a new basis next time.

If two days of pulls are unsuccessful there either: (a) may not be a report for the given day, as they have skipped days in the past; or (b) the expected path formatting may have changed. Check [the OCHA crisis page](https://www.ochaopt.org/crisis) to verify.
