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
  return isoTime;
};

console.log(`fetching from ${unfetchedLinks.length} unfetched links`);

const fetchedLinks: Record<string, string> = {}; // href => reportDate

unfetchedLinks.reduce(async (chain, [label, href]) => {
  await chain;
  console.log(`fetching ${label} at ${href}`);
  const reportDate = await getReport(href);
  fetchedLinks[href] = reportDate;
}, Promise.resolve());

// write fetched status to report
const newLinks = reportLinks.map((link) => {
  const reportDate = fetchedLinks[link[1] as string];
  if (reportDate) {
    return [link[0], link[1], reportDate];
  }
  return link;
});
fs.writeFileSync("scripts/links.json", JSON.stringify(newLinks, null, 2));
