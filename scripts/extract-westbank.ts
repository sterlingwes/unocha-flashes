import fs from "fs";
import lev from "fastest-levenshtein";
import { parseMarkdown } from "./utils/parse";
import { extractMatches } from "./utils/extract";

const matchStrings = [
  "Since 7 October 2023, 389 Palestinians have been killed, including 100 children, and 4,503 Palestinians, including 698 children, have been injured in conflict-related incidents across the West Bank, including East Jerusalem, and Israel",
  "Since 7 October 2023 and as of 24 January 2024, 360 Palestinians have been killed, including 92 children, across the West Bank, including East Jerusalem",
];

const files = fs.readdirSync("reports");

const aggregatedMatches = extractMatches(files, {
  matchStrings,
});

let parsedReport: string[] = [];
let rawReport: string[] = [];
const addDivider = (section: string[]) =>
  section.push.apply(section, ["", "---", ""]);

const dateFromFile = (reportFile: string) =>
  reportFile.replace("flash-", "").split("T")[0];

parsedReport.push("# Closest Extracts\n");

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

fs.writeFileSync("parsed/westbank-casualties.md", parsedReport.join("\n"));
fs.writeFileSync(
  "parsed/westbank-raw.md",
  ["# Raw Extracts\n"].concat(rawReport).join("\n")
);
