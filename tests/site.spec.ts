import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import legacyUrlMigration from "../src/content/legacy-url-migration.json";
import { locations } from "../src/content/locations";
import { pathFor, sitePages } from "../src/content/site-pages";

const marketingRoutes = sitePages
  .filter((page) => page.template !== "standalone")
  .map(pathFor);

const accessibilityRoutes = sitePages.map(pathFor);

test.describe("marketing pages", () => {
  for (const route of marketingRoutes) {
    test(`${route} renders one clear page heading`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page).not.toHaveTitle(/Create Next App/i);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test("every legacy sitemap URL is preserved or redirected with an exact 301", async ({ request }) => {
  for (const { source, destination, statusCode } of legacyUrlMigration.redirects) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status(), source).toBe(statusCode);
    expect(response.headers().location, source).toBe(destination);
  }

  for (const { source, statusCode } of legacyUrlMigration.retained) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status(), source).toBe(statusCode);
  }
});

test("legacy redirects preserve campaign query parameters", async ({ request }) => {
  for (const { source, destination } of legacyUrlMigration.redirects) {
    const response = await request.get(`${source}?utm_source=legacy-sitemap`, { maxRedirects: 0 });
    const [path, fragment] = destination.split("#");
    const expectedLocation = `${path}?utm_source=legacy-sitemap${fragment ? `#${fragment}` : ""}`;
    expect(response.status(), source).toBe(301);
    expect(response.headers().location, source).toBe(expectedLocation);
  }
});

test("legacy redirects preserve encoded reserved characters", async ({ request }) => {
  for (const { source, destination } of legacyUrlMigration.redirects) {
    for (const query of ["q=a%2Bb", "q=a%26b"]) {
      const response = await request.get(`${source}?${query}`, { maxRedirects: 0 });
      expect(response.status(), `${source}?${query}`).toBe(301);
      expect(response.headers().location, `${source}?${query}`).toBe(`${destination}?${query}`);
    }
  }
});

test("legacy parent documents remain available at their original URLs", async ({ request }) => {
  for (const document of legacyUrlMigration.preservedAssets) {
    const headResponse = await request.head(document.path, { maxRedirects: 0 });
    expect(headResponse.status(), `${document.path} HEAD`).toBe(document.statusCode);
    expect(headResponse.headers()["content-type"], `${document.path} HEAD`).toContain("application/pdf");
    expect(Number(headResponse.headers()["content-length"]), `${document.path} HEAD`).toBe(document.size);

    const response = await request.get(document.path, { maxRedirects: 0 });
    expect(response.status(), document.path).toBe(document.statusCode);
    expect(response.headers()["content-type"], document.path).toContain("application/pdf");
    const bytes = await response.body();
    expect(bytes.subarray(0, 5).toString(), document.path).toBe("%PDF-");
    expect(bytes.length, document.path).toBe(document.size);
    expect(createHash("sha256").update(bytes).digest("hex"), document.path).toBe(document.sha256);
  }
});

test("following each legacy redirect reaches a successful canonical page", async ({ request }) => {
  for (const { source, destination } of legacyUrlMigration.redirects) {
    const response = await request.get(source);
    expect(response.status(), source).toBe(200);
    expect(new URL(response.url()).pathname, source).toBe(destination.split("#")[0]);
  }
});

test("the generated sitemap contains no retired legacy page paths", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));
  for (const { source } of legacyUrlMigration.redirects) expect(listed).not.toContain(source);
  for (const { source } of legacyUrlMigration.retired) expect(listed).not.toContain(source);
});

test("the obsolete Squarespace cart is explicitly retired", async ({ request }) => {
  const response = await request.get("/cart", { maxRedirects: 0 });
  expect(response.status()).toBe(410);
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(await response.text()).toContain('<link rel="icon" href="/icon.png" type="image/png">');
});

test("the retired cart renders an accessible nursery-branded page", async ({ page }) => {
  const response = await page.goto("/cart");
  expect(response?.status()).toBe(410);
  await expect(page.getByRole("heading", { name: "This page is no longer available" })).toBeVisible();
  await expect(page.getByAltText("Little Giants Nursery")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("the legacy contact fragment still targets the enquiry section", async ({ page }) => {
  await page.goto("/nurseries/uxbridge/contact#contact");
  await expect(page.locator("#contact")).toBeAttached();
  await expect(page.locator("#enquire")).toBeVisible();
});

test("analytics waits for consent", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Cookie preferences" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("#little-giants-gtm")).toHaveCount(0);
  await page.getByRole("button", { name: "Accept optional cookies" }).click();
  await expect(page.locator("#little-giants-gtm")).toHaveCount(1);

  const settings = page.getByRole("button", { name: "Cookie settings" });
  await settings.click();
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(settings).toBeFocused();
});

test("hero photography uses responsive image candidates", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByAltText("The spacious, light-filled interior of Little Giants Nursery in Uxbridge");
  await expect(hero).toHaveAttribute("srcset", /_next\/image/);
  await expect(hero).toHaveAttribute("sizes", /100vw/);
  await expect(hero).toHaveAttribute("fetchpriority", "high");
  await expect(hero).toHaveAttribute("loading", "eager");
});

test("below-fold imagery uses crop-aware responsive candidates", async ({ page }) => {
  await page.goto("/nurseries/uxbridge");
  const mosaic = page.getByAltText("A small-world investigation with animals, natural materials, and vehicles");
  await expect(mosaic).toHaveAttribute("srcset", /about-us-14-img-9421-landscape/);
  await expect(mosaic).toHaveAttribute("sizes", /600px/);
  await expect(page.getByAltText("A calm baby area with soft seating, books, and sensory toys")).toHaveAttribute("sizes", /400px/);
});

test("desktop navigation exposes and closes disclosure menus", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Discover" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "About us" })).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Learning" })).toBeFocused();
});

test("desktop navigation yields on downward scroll and returns on upward scroll", async ({ page }) => {
  await page.goto("/");
  const header = page.locator(".site-header");

  await expect(header).not.toHaveClass(/site-header--hidden/);
  await page.evaluate(() => window.scrollTo(0, 1000));
  await expect(header).toHaveClass(/site-header--hidden/);
  await expect.poll(async () => (await header.boundingBox())?.y ?? 0).toBeLessThan(-20);

  await page.evaluate(() => window.scrollBy(0, -120));
  await expect(header).not.toHaveClass(/site-header--hidden/);
  await expect.poll(async () => (await header.boundingBox())?.y ?? -100).toBeGreaterThanOrEqual(-1);

  const trigger = page.getByRole("button", { name: "Discover" });
  await trigger.click();
  await page.evaluate(() => window.scrollBy(0, 300));
  await expect(header).not.toHaveClass(/site-header--hidden/);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

for (const location of locations) {
  test(`the ${location.slug} contact page offers every enquiry route the setting has`, async ({ page }) => {
    await page.goto(`/nurseries/${location.slug}/contact#enquire`);
    const panel = page.locator(".enquiry-panel");

    const enquiryLink = panel.getByRole("link", { name: "Complete the enquiry form" });
    await expect(enquiryLink).toBeVisible();
    await expect(enquiryLink).toHaveAttribute("href", /littlegiantsnursery\.eylog\.co\.uk/);
    await expect(enquiryLink).toHaveAttribute("target", "_blank");

    await expect(panel.getByRole("link", { name: `Email ${location.email}` }))
      .toHaveAttribute("href", `mailto:${location.email}`);

    if (location.phoneHref) {
      await expect(panel.getByRole("link", { name: `Call ${location.phoneDisplay}` }))
        .toHaveAttribute("href", `tel:${location.phoneHref}`);
    } else {
      // A setting without a phone line must not borrow the other nursery's number.
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    }
  });
}

test("pages include the production security policy", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("SAMEORIGIN");
});

for (const route of accessibilityRoutes) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("unknown routes render an accessible nursery-branded page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That page has wandered off");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
