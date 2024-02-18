import fs from "fs";
import lev from "fastest-levenshtein";
import { parseMarkdown } from "./utils/parse";

const matchString =
  "* Since 7 October 2023, 389 Palestinians have been killed, including 100 children, and 4,503 Palestinians, including 698 children, have been injured in conflict-related incidents across the West Bank, including East Jerusalem, and Israel.";

const files = fs.readdirSync("reports");

const parseReport = (reportFile: string) => {
  const parsed = parseMarkdown("reports/" + reportFile);
  const allTextGroups = parsed.blocks
    .map((block) => {
      return {
        heading: parsed.textLines[block.heading[0]],
        text: block.textBlocks.map((text) => parsed.textLines[text[0]]),
      };
    })
    .filter((part) => part.heading.toLowerCase().includes("bank"));

  const closestText = allTextGroups.map((group) => {
    return {
      heading: group.heading,
      match: lev.closest(matchString, group.text),
    };
  });

  return { reportFile, allTextGroups, closestText };
};

const aggregated: Array<{
  reportFile: string;
  allTextGroups: Array<{ heading: string; text: string[] }>;
  closestText: Array<{ heading: string; match: string }>;
}> = [];

files.forEach((file) => {
  aggregated.push(parseReport(file));
});

aggregated.sort((a, b) => a.reportFile.localeCompare(b.reportFile));

let parsedReport: string[] = [];
let rawReport: string[] = [];
const addDivider = (section: string[]) =>
  section.push.apply(section, ["", "---", ""]);

const dateFromFile = (reportFile: string) =>
  reportFile.replace("flash-", "").split("T")[0];

parsedReport.push("# Closest Extracts\n");

aggregated.forEach(({ reportFile, allTextGroups, closestText }) => {
  parsedReport.push(`## ${dateFromFile(reportFile)}\n`);
  closestText.forEach((group, i) => {
    parsedReport.push((i !== 0 ? "\n" : "") + group.heading + "\n");
    parsedReport.push(group.match);
  });
  addDivider(parsedReport);

  rawReport.push(`## ${dateFromFile(reportFile)}\n`);
  allTextGroups.forEach((group, i) => {
    rawReport.push((i !== 0 ? "\n" : "") + group.heading + "\n");
    group.text.forEach((t) => {
      rawReport.push(t);
    });
  });
  addDivider(rawReport);
});

parsedReport.push("# Raw Extracts");
addDivider(parsedReport);

const consolidatedReport = [...parsedReport, ...rawReport].join("\n");
fs.writeFileSync("parsed/westbank.md", consolidatedReport);
