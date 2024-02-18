import fs from "fs";
import lev from "fastest-levenshtein";
import { parseMarkdown } from "./utils/parse";
import { extractMatches } from "./utils/extract";

const matchStrings = [
  "Since 7 October 2023, 389 Palestinians have been killed, including 100 children, and 4,503 Palestinians, including 698 children, have been injured in conflict-related incidents across the West Bank, including East Jerusalem, and Israel",
  "Since 7 October 2023 and as of 24 January 2024, 360 Palestinians have been killed, including 92 children, across the West Bank, including East Jerusalem",
];

const files = fs.readdirSync("reports");

const headingMatch = "bank"; // match "west bank"
const levFilterThreshold = 100;

const aggregatedMatches = extractMatches(files, {
  headingMatch,
  matchStrings,
  levFilterThreshold,
});

let parsedReport: string[] = [];
let rawReport: string[] = [];
const addDivider = (section: string[]) =>
  section.push.apply(section, ["", "---", ""]);

const dateFromFile = (reportFile: string) =>
  reportFile.replace("flash-", "").split("T")[0];

aggregatedMatches.forEach(({ reportFile, allTextGroups, closestText }) => {
  parsedReport.push(`## ${dateFromFile(reportFile)}\n`);
  closestText.forEach((group, i) => {
    parsedReport.push((i !== 0 ? "\n" : "") + group.heading + "\n");
    group.matches.forEach((match) => {
      parsedReport.push(
        `${match.text} ((${match.distance} for #${
          match.matchStringIndex + 1
        }))\n`
      );
    });
  });
  addDivider(parsedReport);

  rawReport.push(`## ${dateFromFile(reportFile)}\n`);
  allTextGroups.forEach((group, i) => {
    rawReport.push((i !== 0 ? "\n" : "") + group.heading + "\n");
    group.text.forEach((t) => {
      rawReport.push(t + "\n");
    });
  });
  addDivider(rawReport);
});

const rawReportFileName = "parsed/westbank-raw.md";

const parsedReportHeadSection = [
  "# Closest Extracts\n",
  `This file includes all extracts from ${rawReportFileName} that match one of the following template strings within a Levenshtein distance of <= ${levFilterThreshold}:\n`,
  ...matchStrings.map((matchString) => `* ${matchString}\n`),
  `In double nested brackets you'll see the distance number and which string matched (though more than one string may have matched). For example: ((34 for #2)) would be a distance of 34 vs. the second template string in the list above.\n`,
  "---\n",
];

const rawReportHeadSection = [
  "# Raw Extracts\n",
  `This file includes all sections from flash reports with a header that includes these match term(s): "${headingMatch}". This is the base text document used for extracting other more specific matches found in the non-raw parsed markdown outputs.\n`,
  "---\n",
];

fs.writeFileSync(
  "parsed/westbank-casualties.md",
  parsedReportHeadSection.concat(parsedReport).join("\n")
);
fs.writeFileSync(
  rawReportFileName,
  rawReportHeadSection.concat(rawReport).join("\n")
);
