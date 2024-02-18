import fs from "fs";
import { extractMatches } from "./utils/extract";

const matchStrings = [
  "Since 7 October 2023, 389 Palestinians have been killed, including 100 children, and 4,503 Palestinians, including 698 children, have been injured in conflict-related incidents across the West Bank, including East Jerusalem, and Israel",
  "Since 7 October 2023 and as of 24 January 2024, 360 Palestinians have been killed, including 92 children, across the West Bank, including East Jerusalem",
  "This raises to 331 Palestinians killed, including 84 children, in the West Bank, including East Jerusalem, since 7 October 2023 and as of 10 January 2024",
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

const csvFileName = "parsed/westbank-casualties.csv";
const csvHeader = [
  "report_date",
  "killed_cum",
  "killed_children_cum",
  "injured_cum",
  "injured_children_cum",
];
const ifValue = (value: string) => (value ? +value : undefined);
const existingExtractionCsv = fs.readFileSync(csvFileName).toString();
const extractedValues: Record<
  string,
  {
    killedCum: number;
    killedChildrenCum: number;
    injuredCum: number;
    injuredChildrenCum: number;
  }
> = existingExtractionCsv
  .split(/\r?\n/)
  .slice(1)
  .reduce((lookup, row) => {
    const [reportDate, killed, killedChildren, injured, injuredChildren] =
      row.split(",");
    return {
      ...lookup,
      [reportDate]: {
        killedCum: ifValue(killed),
        killedChildrenCum: ifValue(killedChildren),
        injuredCum: ifValue(injured),
        injuredChildrenCum: ifValue(injuredChildren),
      },
    };
  }, {});

const killedMatchers = [
  /(?<all>[0-9,]+)[\\*]* Palestinians have been killed, including (?<child>[0-9,]+)[\\*]* children/,
  /raises to (?<all>[0-9,]+)[\\*]* (the number of )?Palestinians killed, including (?<child>[0-9,]+)[\\*]* children/,
];
const injuredMatchers = [
  /(?<all>[0-9,]+)[\\*]* Palestinians, including (?<child>[0-9,]+)[\\*]* children,( have been)?( were)? injured/,
  /From 7 October 2023 and as of [0-9]+ [A-Za-z]+ 202[34], (?<all>[0-9,]+)[\\*]* Palestinians, including (?<child>[0-9,]+)[\\*]* children, were injured/,
];

aggregatedMatches.forEach(({ reportFile, allTextGroups, closestText }) => {
  const reportDate = dateFromFile(reportFile);
  parsedReport.push(`## ${reportDate}\n`);
  closestText.forEach((group, i) => {
    parsedReport.push((i !== 0 ? "\n" : "") + group.heading + "\n");
    group.matches.forEach((match) => {
      parsedReport.push(
        `${match.text} ((${match.distance} for #${
          match.matchStringIndex + 1
        }))\n`
      );
      killedMatchers.find((killedMatcher) => {
        const killedValuesMatch = match.text.match(killedMatcher);
        if (
          killedValuesMatch &&
          killedValuesMatch.groups?.all &&
          killedValuesMatch.groups?.child
        ) {
          extractedValues[reportDate] = {
            ...extractedValues[reportDate],
            killedCum: +killedValuesMatch.groups.all.replace(/[^0-9]/, ""),
            killedChildrenCum: +killedValuesMatch.groups.child.replace(
              /[^0-9]/,
              ""
            ),
          };
          return true;
        }
      });
      injuredMatchers.find((injuredMatcher) => {
        const injuredValuesMatch = match.text.match(injuredMatcher);
        if (
          injuredValuesMatch &&
          injuredValuesMatch.groups?.all &&
          injuredValuesMatch.groups?.child
        ) {
          extractedValues[reportDate] = {
            ...extractedValues[reportDate],
            injuredCum: +injuredValuesMatch.groups.all.replace(/[^0-9]/, ""),
            injuredChildrenCum: +injuredValuesMatch.groups.child.replace(
              /[^0-9]/,
              ""
            ),
          };
          return true;
        }
      });
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

const csv = [csvHeader.join(",")].concat(
  Object.entries(extractedValues).map(([reportDate, values]) => {
    return [
      reportDate,
      values.killedCum ?? "",
      values.killedChildrenCum ?? "",
      values.injuredCum ?? "",
      values.injuredChildrenCum ?? "",
    ].join(",");
  })
);
fs.writeFileSync(csvFileName, csv.join("\r\n"));
