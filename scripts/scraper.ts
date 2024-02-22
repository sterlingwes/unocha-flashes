import fs from "fs";
import puppeteer from "puppeteer";
import { NodeHtmlMarkdown } from "node-html-markdown";
import reportLinks from "./links.json";

// @ts-expect-error forcing type
const unfetchedLinks: [string, string, boolean][] = reportLinks.filter(
  ([, , fetched]) => !fetched
);

const getReport = async (slug: string) => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(`https://www.ochaopt.org/${slug}`);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Wait and click on first result
  const reportTimeBox = ".l-field-publish-date";
  await page.waitForSelector(reportTimeBox);

  // Locate the full title with a unique string
  const timeNode = await page.waitForSelector(`${reportTimeBox} time`);
  const isoTime = await timeNode?.evaluate((el) => el.getAttribute("datetime"));

  console.log('Report datetime "%s".', isoTime);

  const content = await page.waitForSelector(".container .content .layout");
  const contentHtml = await content?.evaluate((el) => el.innerHTML);

  await browser.close();

  const markdown = NodeHtmlMarkdown.translate(/* html */ contentHtml);
  fs.writeFileSync(`reports/flash-${isoTime}.md`, markdown);
};

console.log(`fetching from ${unfetchedLinks.length} unfetched links`);
unfetchedLinks.reduce(async (chain, [linkText, href]) => {
  await chain;
  console.log(`fetching ${linkText} at ${href}`);
  await getReport(href);
}, Promise.resolve());
