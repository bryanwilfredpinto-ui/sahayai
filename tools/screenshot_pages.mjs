import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const pages = process.argv.slice(2);
if (!pages.length) {
  console.error("Usage: node tools/screenshot_pages.mjs page1.html page2.html");
  process.exit(1);
}
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
for (const p of pages) {
  const url = pathToFileURL(join(ROOT, p)).href;
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const outPath = join(ROOT, "tools", p.replace(".html", ".png"));
  await page.screenshot({ path: outPath, fullPage: false });
  console.log("wrote", outPath);
  // Also dump computed body styles for a quick palette diff.
  const palette = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return {
      backgroundColor: cs.backgroundColor,
      backgroundImage: cs.backgroundImage.slice(0, 200),
      fontFamily: cs.fontFamily,
      color: cs.color,
      headerColor: getComputedStyle(document.querySelector('header,[role=banner]') || document.body).backgroundColor,
    };
  });
  console.log(p, palette);
  await page.close();
}
await browser.close();
