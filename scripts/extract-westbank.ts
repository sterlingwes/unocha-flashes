import fs from "fs";
import MarkdownIt from "markdown-it";

const knownBlockTypes = [
  "paragraph_open",
  "inline",
  "paragraph_close",
  "heading_open",
  "heading_close",
  "bullet_list_open",
  "list_item_open",
  "list_item_close",
  "bullet_list_close",
];

const latest = fs
  .readFileSync("reports/flash-2024-02-16T12:00:00Z.md")
  .toString();
const md = new MarkdownIt();
const env = {};
const result = md.parse(latest, env);
const uniqueBlockTypes = new Set<string>();
const headingLineMaps: [number, number][] = [];

const interestingLines: Array<{
  heading: [number, number];
  textBlocks: [number, number][];
}> = [];
const lastLine = () => interestingLines[interestingLines.length - 1];

result.forEach((item, i) => {
  uniqueBlockTypes.add(item.type);

  if (item.constructor.name !== "Token") {
    console.log(`item at index ${i} NOT a Token`);
  }

  if (item.type === "heading_open") {
    headingLineMaps.push(item.map.slice());
    interestingLines.push({ heading: item.map.slice(), textBlocks: [] });
    return;
  }

  if (item.type === "paragraph_open" || item.type === "list_item_open") {
    const last = lastLine();
    if (last) {
      last.textBlocks.push(item.map.slice());
    }
  }
});

const fileLines = latest.split(/\r?\n/);

const matchString =
  "* Since 7 October 2023, 389 Palestinians have been killed, including 100 children, and 4,503 Palestinians, including 698 children, have been injured in conflict-related incidents across the West Bank, including East Jerusalem, and Israel.";

const parts = interestingLines
  .map((line) => {
    return {
      heading: fileLines[line.heading[0]],
      text: line.textBlocks.map((text) => fileLines[text[0]]),
    };
  })
  .filter((part) => part.heading.toLowerCase().includes("bank"));
console.log(parts);

// const headings = headingLineMaps.map((maps) => {
//   return fileLines[maps[0]];
// });
// console.log(headings);

// console.log(Array.from(uniqueBlockTypes), env);
