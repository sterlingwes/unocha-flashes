import lev from "fastest-levenshtein";
import { parseMarkdown } from "./parse";

type MatchOptions = {
  matchStrings: string[];
  levFilterThreshold?: number;
};

/**
 * match strings are expected to be sentences or substrings so for best lev distancing
 * we should split larger blocks of text into their constituent parts and apply "matches"
 * to the containing paragraph
 *
 * @returns a flattened array of all sentences in the provided paragraphs
 */
const splitTextToSentences = (paragraphs: string[]) => {
  return paragraphs.reduce((sentences, para) => {
    const parts = para
      .replace(/^[*]\s/, "")
      .replace(/[.]$/, "")
      .split(".");
    return sentences.concat(parts);
  }, [] as string[]);
};

const getParagraphMinMatchDistance = (
  paragraphs: string[],
  matchStrings: string[],
  levFilterThreshold?: number
) => {
  return matchStrings.map((matchString) => {
    return paragraphs.map((para) => {
      // if it's a "strong header" style paragraph, treat it as a match so we keep doc structure
      if (/^[_**]+[A-Z]+/.test(para)) {
        return { text: para, distance: 0 };
      }

      const sentences = splitTextToSentences([para]);
      const distances = sentences.map((sentence) =>
        lev.distance(matchString, sentence)
      );
      return { text: para, distance: Math.min(...distances) };
    });
  });
};

const parseReportMatches = (reportFile: string, options: MatchOptions) => {
  const parsed = parseMarkdown("reports/" + reportFile);
  const allTextGroups = parsed.blocks
    .map((block) => {
      return {
        heading: parsed.textLines[block.heading[0]],
        text: block.textBlocks.map(
          (blockLineBookends) => parsed.textLines[blockLineBookends[0]]
        ),
      };
    })
    .filter((part) => part.heading.toLowerCase().includes("bank"));

  const maxDistance = options.levFilterThreshold ?? 100;
  const closestText = allTextGroups.map((group) => {
    const uniqueMatches: Record<string, [number, number]> = {};
    getParagraphMinMatchDistance(
      group.text,
      options.matchStrings,
      options.levFilterThreshold
    ).forEach((matchGroup) =>
      matchGroup.forEach((match, matchStringIndex) => {
        if (match.distance <= maxDistance) {
          uniqueMatches[match.text] = [match.distance, matchStringIndex];
        }
      })
    );

    return {
      heading: group.heading,
      matches: Object.entries(uniqueMatches).map(
        ([text, [distance, matchStringIndex]]) => ({
          text,
          distance,
          matchStringIndex,
        })
      ),
    };
  });

  return { reportFile, allTextGroups, closestText };
};

export const extractMatches = (files: string[], options: MatchOptions) => {
  const aggregated: Array<{
    reportFile: string;
    allTextGroups: Array<{ heading: string; text: string[] }>;
    closestText: Array<{
      heading: string;
      matches: Array<{
        text: string;
        distance: number;
        matchStringIndex: number;
      }>;
    }>;
  }> = [];

  files.forEach((file) => {
    aggregated.push(parseReportMatches(file, options));
  });

  aggregated.sort((a, b) => b.reportFile.localeCompare(a.reportFile));

  return aggregated;
};
