import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/**
 * Renders every social card in design/og-pages.json from design/og-card.html.
 * The card definitions are the source of truth: verify-social-cards.mjs proves
 * they stay in step with the page catalogue.
 */
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const templateUrl = new URL("../design/og-card.html", import.meta.url);
const cards = JSON.parse(await readFile(new URL("../design/og-pages.json", import.meta.url), "utf8"));
const outputDirectory = new URL("../public/og/", import.meta.url);

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

for (const card of cards) {
  const params = new URLSearchParams();
  for (const key of ["eyebrow", "title", "subtitle", "position", "badge", "footer"]) {
    if (card[key]) params.set(key, card[key]);
  }
  if (card.image) params.set("image", `file://${projectRoot}${card.image.replace(/^\//, "")}`);

  await page.goto(`${templateUrl.href}?${params.toString()}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot({ type: "jpeg", quality: 88 });
  await writeFile(new URL(`${card.file}.jpg`, outputDirectory), buffer);
  console.log(`${card.file}.jpg  ${(buffer.length / 1024).toFixed(0)} KB`);
}

await browser.close();
console.log(`Generated ${cards.length} social cards`);
