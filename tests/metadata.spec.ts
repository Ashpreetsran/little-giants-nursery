import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import pageContract from "../config/page-contract.json";
import socialCards from "../design/og-pages.json";
import { pathFor, sitePages, socialCardName } from "../src/content/site-pages";
import { siteConfig } from "../src/lib/site";

test("the page catalogue matches the contract the Node verifiers read", () => {
  // config/page-contract.json is what scripts/verify-*.mjs compare against.
  // Regenerate it with `npm run build && npm run pages:contract` after adding a page.
  expect([...sitePages.map(pathFor)].sort()).toEqual([...pageContract.paths].sort());
  expect([...sitePages.map(socialCardName)].sort()).toEqual([...pageContract.socialCards].sort());
  expect([...socialCards.map((card) => card.file)].sort()).toEqual([...pageContract.socialCards].sort());
});

test("every page has a unique title and description", () => {
  const titles = sitePages.map((page) => page.title);
  const descriptions = sitePages.map((page) => page.description);
  expect(new Set(titles).size).toBe(titles.length);
  expect(new Set(descriptions).size).toBe(descriptions.length);
});

for (const sitePage of sitePages) {
  const route = pathFor(sitePage);
  const card = socialCardName(sitePage);

  test(`${route} exposes valid schema and a purpose-built social card`, async ({ page }) => {
    await page.goto(route);

    const socialImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(socialImage, `${route} has no og:image`).toBeTruthy();
    expect(new URL(socialImage!).pathname).toBe(`/og/${card}.jpg`);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_GB");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", siteConfig.name);

    const localCard = path.join(process.cwd(), "public", "og", `${card}.jpg`);
    expect(existsSync(localCard), `${localCard} is missing`).toBe(true);
    expect(statSync(localCard).size).toBeGreaterThan(50_000);

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.length).toBeGreaterThan(0);
    for (const schema of schemas) expect(() => JSON.parse(schema)).not.toThrow();
  });
}
