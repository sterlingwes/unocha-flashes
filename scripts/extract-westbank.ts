import fs from "fs";
import { extractMatches } from "./utils/extract";

const matchStrings = [
  "Since 7 October 2023, 389 Palestinians have been killed, including 100 children, and 4,503 Palestinians, including 698 children, have been injured in conflict-related incidents across the West Bank, including East Jerusalem, and Israel",
  "Since 7 October 2023 and as of 24 January 2024, 360 Palestinians have been killed, including 92 children, across the West Bank, including East Jerusalem",
  "This raises to 331 Palestinians killed, including 84 children, in the West Bank, including East Jerusalem, since 7 October 2023 and as of 10 January 2024",
  "Among the fatalities are 84 children",
  "Since 7 October 2023 and as of 4 January 2024, Israeli forces have injured 3,949 Palestinians, including at least 593 children; 52 per cent in the context of search-and-arrest and other operations and 40 per cent in demonstrations",
  "Another 91 Palestinians have been injured by settlers and 12 other Palestinians have been injured by either Israeli forces or settlers",
  "Since 7 October 2023, OCHA has recorded 552 Israeli settler attacks against Palestinians that resulted in Palestinian casualties (51 incidents), damage to Palestinian-owned property (440 incidents), or both casualties and damage to property (61 incidents)",
  "Since 7 October 2023, a total of 397 Palestinians have been killed, including 101 children, and 4,530 Palestinians have been injured, including 702 children, in conflict-related incidents across the West Bank, including East Jerusalem, and Israel",
];

const files = fs.readdirSync("reports");

const headingMatchStrings = ["bank", "settler"]; // match "west bank"
const levFilterThreshold = 100;

const aggregatedMatches = extractMatches(files, {
  headingMatchStrings,
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
  "settler_attacks",
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
    settlerAttacks: number;
  }
> = existingExtractionCsv
  .split(/\r?\n/)
  .slice(1)
  .reduce((lookup, row) => {
    const [
      reportDate,
      killed,
      killedChildren,
      injured,
      injuredChildren,
      settlerAttacks,
    ] = row.split(",");
    return {
      ...lookup,
      [reportDate]: {
        killedCum: ifValue(killed),
        killedChildrenCum: ifValue(killedChildren),
        injuredCum: ifValue(injured),
        injuredChildrenCum: ifValue(injuredChildren),
        settlerAttacks: ifValue(settlerAttacks),
      },
    };
  }, {});

const killedMatchers = [
  /(?<all>[0-9,]+)[\\*]* Palestinians have been killed, including (?<child>[0-9,]+)[\\*]* children/,
  /(?<all>[0-9,]+)[\\*]* Palestinians, including (?<child>[0-9,]+)[\\*]* children,? (have been|were) killed/,
  /raises to (?<all>[0-9,]+)[\\*]* (the number of )?Palestinians killed, including (?<child>[0-9,]+)[\\*]* children/,
  /(brings|raises) to (?<all>[0-9,]+)[\\*]* (the number of )?Palestinians? (killed|fatalities)[A-Za-z0-9\s,\\.]+ Among the fatalities (are|were) (?<child>[0-9,]+)[\\*]* children/,
  /A total of (?<all>[0-9,]+)[\\*]* Palestinians (has|have) been killed [A-Za-z0-9\s,\\.]+ Among the fatalities were (?<child>[0-9,]+)[\\*]* children./,
  /brings the total number of Palestinians killed by Israeli forces or settlers since 7 October to (?<all>[0-9,]+)[\\*]*, including (?<child>[0-9,]+)[\\*]* children/,
  /Since 7 October, Israeli forces and settlers have killed (?<all>[0-9,]+)[\\*]* Palestinians, including (?<child>[0-9,]+)[\\*]* children/,
  /Israeli forces or settlers in the West Bank have killed (?<all>[0-9,]+)[\\*]* Palestinians, including (?<child>[0-9,]+)[\\*]* children/,
  /the total number of Palestinians killed by Israeli forces or settlers since the start of the escalation to (?<all>[0-9,]+)[\\*]*, including (?<child>[0-9,]+)[\\*]* children/,
];
const injuredMatchers = [
  /(?<all>[0-9,]+)[\\*]* Palestinians, including (?<child>[0-9,]+)[\\*]* children,( have been)?( were)? injured/,
  /(From|Since) 7 October 2023 and as of [0-9]+ [A-Za-z]+ 202[34], (?<all>[0-9,]+)[\\*]* Palestinians, including (?<child>[0-9,]+)[\\*]* children,? were injured/,
  /Israeli forces have injured (?<allidf>[0-9,]+)[\\*]* Palestinians, including at least (?<childidf>[0-9,]+)[\\*]* children;[A-Za-z0-9.,\s-]* Another (?<allsettler>[0-9,]+)[\\*]* Palestinians have been injured by settlers and (?<alleither>[0-9,]+)[\\*]* (other )?Palestinians have been injured by either/,
  /Israeli forces have injured (?<allidf>[0-9,]+)[\\*]* Palestinians, including at least (?<childidf>[0-9,]+)[\\*]* children(;|,)[A-Za-z0-9.,\s-]* (Another|An additional) (?<allsettler>[0-9,]+)[\\*]* Palestinians have been injured by settlers and (?<alleither>[0-9,]+)[\\*]* (other )?(Palestinians|others) (have been|were)?\s?(injured )?(by )?either/,
  /Israeli forces( and settlers)? have injured (?<allidf>[0-9,]+)[\\*]* Palestinians, including at least (?<childidf>[0-9,]+)[\\*]* children(;|,)?[A-Za-z0-9.,\s-]*(Another|An additional|with an additional)?,?\s?(?<allsettler>[0-9,]+)[\\*]* Palestinians (have been|were) injured by settlers/,
  /Since 7 October, Israeli forces and settlers have injured (?<all>[0-9,]+)[\\*]* Palestinians, including at least (?<child>[0-9,]+)[\\*]* children/,
];
const bulkMatchers = [
  /Since 7 October 2023 and as of [0-9]?[0-9] [A-Za-z]+, (?<all>[0-9,]+)[\\*]* Palestinians have been killed, including (?<child>[0-9,]+)[\\*]* children, and (?<allinj>[0-9,]+)[\\*]* Palestinians have been injured, including (?<childinj>[0-9,]+)[\\*]* children, in conflict-related incidents across the West Bank, including East Jerusalem, and Israel/,
  /Since 7 October 2023, a total of (?<all>[0-9,]+)[\\*]* Palestinians have been killed, including (?<child>[0-9,]+)[\\*]* children, and (?<allinj>[0-9,]+)[\\*]* Palestinians have been injured, including (?<childinj>[0-9,]+)[\\*]* children, in conflict-related incidents across the West Bank, including East Jerusalem, and Israel/,
];
const settlerAttackMatchers = [
  /7 October( 2023)?( and as of [0-9]+ [A-Za-z]+( 202[34])?), OCHA( has)? recorded (?<all>[0-9,]+)[\\*]*( Israeli)? settler attacks/,
  /Since 7 October, OCHA has recorded (?<all>[0-9,]+)[\\*]*( Israeli)? settler attacks/,
];
const exclusionMatchers = [/Between [0-9]+ January and/];

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

      const exclude = exclusionMatchers.find((matcher) =>
        matcher.test(match.text)
      );
      if (exclude) {
        return;
      }

      bulkMatchers.find((bulkMatcher) => {
        const bulkValuesMatch = match.text.match(bulkMatcher);
        if (
          bulkValuesMatch &&
          bulkValuesMatch.groups?.all &&
          bulkValuesMatch.groups?.child &&
          bulkValuesMatch.groups?.allinj &&
          bulkValuesMatch.groups?.childinj
        ) {
          extractedValues[reportDate] = {
            ...extractedValues[reportDate],
            killedCum: +bulkValuesMatch.groups.all.replace(/[^0-9]/, ""),
            killedChildrenCum: +bulkValuesMatch.groups.child.replace(
              /[^0-9]/,
              ""
            ),
            injuredCum: +bulkValuesMatch.groups.allinj.replace(/[^0-9]/, ""),
            injuredChildrenCum: +bulkValuesMatch.groups.childinj.replace(
              /[^0-9]/,
              ""
            ),
          };
          return true;
        }
      });

      killedMatchers.find((killedMatcher) => {
        const killedValuesMatch = match.text.match(killedMatcher);
        // if (
        //   reportDate === "2024-01-08" &&
        //   match.text.includes("A total of 329")
        // ) {
        //   console.log({ killedMatcher, killedValuesMatch, text: match.text });
        // }
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

        if (
          injuredValuesMatch?.groups?.allidf &&
          injuredValuesMatch?.groups?.allsettler
        ) {
          extractedValues[reportDate] = {
            ...extractedValues[reportDate],
            injuredCum:
              +injuredValuesMatch.groups.allidf.replace(/[^0-9]/, "") +
              +injuredValuesMatch.groups.allsettler.replace(/[^0-9]/, "") +
              +(injuredValuesMatch.groups.alleither ?? "").replace(
                /[^0-9]/,
                ""
              ),
            injuredChildrenCum: +injuredValuesMatch.groups.childidf.replace(
              /[^0-9]/,
              ""
            ),
          };
          return true;
        }
      });

      settlerAttackMatchers.find((settlerMatcher) => {
        const settlerValuesMatch = match.text.match(settlerMatcher);
        if (settlerValuesMatch && settlerValuesMatch.groups?.all) {
          extractedValues[reportDate] = {
            ...extractedValues[reportDate],
            settlerAttacks: +settlerValuesMatch.groups.all.replace(
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
  `This file includes all sections from flash reports with a header that includes these match term(s): "${headingMatchStrings}". This is the base text document used for extracting other more specific matches found in the non-raw parsed markdown outputs.\n`,
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
  Object.entries(extractedValues)
    .map(([reportDate, values]) => {
      return [
        reportDate,
        values.killedCum ?? "",
        values.killedChildrenCum ?? "",
        values.injuredCum ?? "",
        values.injuredChildrenCum ?? "",
        values.settlerAttacks ?? "",
      ].join(",");
    })
    .sort((a, b) => b.localeCompare(a))
);
fs.writeFileSync(csvFileName, csv.join("\r\n"));
