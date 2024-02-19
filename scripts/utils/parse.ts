import fs from "fs";
import MarkdownIt from "markdown-it";

export const parseMarkdown = (filePath: string) => {
  const md = new MarkdownIt();
  const mdText = fs.readFileSync(filePath).toString();
  const mdTokens = md.parse(mdText, {});
  const textLines = mdText.split(/\r?\n/);
  const blocks: Array<{
    heading: [number, number];
    textBlocks: [number, number][];
  }> = [];
  const getLastBlock = () => blocks[blocks.length - 1];
  const uniqueLineMaps = new Set<string>();

  // record lines of interest using markdown token line numbers
  mdTokens.forEach((token, i) => {
    if (!token.map || typeof token.map[0] !== "number") {
      return;
    }

    const lineNumberBookends = token.map.slice() as [number, number];
    if (uniqueLineMaps.has(lineNumberBookends.join("-"))) {
      return; // skip if we're already tracked to avoid duplication
    }

    uniqueLineMaps.add(lineNumberBookends.join("-"));

    if (token.constructor.name !== "Token") {
      console.log(`item at index ${i} NOT a Token`);
    }

    if (token.type === "heading_open") {
      const last = getLastBlock();
      if (last && last.heading && !last.textBlocks.length) {
        return;
      }
      blocks.push({
        heading: lineNumberBookends,
        textBlocks: [],
      });
      return;
    }

    if (token.type === "paragraph_open" || token.type === "list_item_open") {
      const last = getLastBlock();
      if (last) {
        last.textBlocks.push(lineNumberBookends);
      }
    }
  });

  return { textLines, blocks };
};
