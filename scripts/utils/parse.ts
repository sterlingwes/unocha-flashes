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

  // record lines of interest using markdown token line numbers
  mdTokens.forEach((token) => {
    if (token.constructor.name !== "Token") {
      console.log(`item at index ${i} NOT a Token`);
    }

    if (token.type === "heading_open") {
      blocks.push({ heading: token.map.slice(), textBlocks: [] });
      return;
    }

    if (token.type === "paragraph_open" || token.type === "list_item_open") {
      const last = getLastBlock();
      if (last) {
        last.textBlocks.push(token.map.slice());
      }
    }
  });

  return { textLines, blocks };
};
