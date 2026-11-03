import { expect, test } from "@playwright/test";

import { pathFor, sitePages } from "../src/content/site-pages";

const publicRoutes = sitePages.map(pathFor);

test("mobile navigation keeps the nursery tour action available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  const toggle = page.getByRole("button", { name: "Open menu" });
  await expect(toggle).toHaveAttribute("aria-controls", "mobile-navigation");
  await toggle.click();
  await expect(page.getByLabel("Mobile navigation").getByRole("link", { name: "Book a nursery tour" })).toBeVisible();
  await expect(page.locator(".mobile-menu")).toHaveClass(/mobile-menu--open/);
  const menuBox = await page.locator(".mobile-menu").boundingBox();
  expect(menuBox?.height).toBeGreaterThan(300);
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveClass(/menu-open/);
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);

  await toggle.click();
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.locator("body")).not.toHaveClass(/menu-open/);
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
});

test("mobile navigation yields on downward scroll and returns on upward scroll", async ({ page }) => {
  await page.goto("/");
  const header = page.locator(".site-header");

  await page.evaluate(() => window.scrollTo(0, 900));
  await expect(header).toHaveClass(/site-header--hidden/);
  await page.evaluate(() => window.scrollBy(0, -100));
  await expect(header).not.toHaveClass(/site-header--hidden/);

  const toggle = page.locator(".menu-toggle");
  await expect(toggle).toHaveAccessibleName("Open menu");
  await toggle.click();
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect(header).not.toHaveClass(/site-header--hidden/);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAccessibleName("Close menu");
  const menuBox = await page.locator(".mobile-menu").boundingBox();
  expect(menuBox?.height).toBeGreaterThan(300);
});

for (const route of publicRoutes) {
  test(`${route} does not overflow a phone viewport`, async ({ page }) => {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("home sections keep comfortable mobile gutters", async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 740 });
  await page.goto("/nurseries/uxbridge");

  const gutters = await page.locator(".home-hero__grid, .curriculum-feature__grid, .tour-cta__inner").evaluateAll((sections) =>
    sections.map((section) => {
      const box = section.getBoundingClientRect();
      return {
        left: box.left,
        right: document.documentElement.clientWidth - box.right,
      };
    }),
  );

  expect(gutters).toHaveLength(3);
  for (const gutter of gutters) {
    expect(gutter.left).toBeGreaterThanOrEqual(19.5);
    expect(gutter.right).toBeGreaterThanOrEqual(19.5);
  }
});

test("mobile enquiry actions remain comfortable touch targets", async ({ page }) => {
  await page.goto("/nurseries/uxbridge/contact#enquire");
  const boxes = await page.locator(".enquiry-panel__actions a").evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height),
  );
  expect(boxes.length).toBe(3);
  expect(Math.min(...boxes)).toBeGreaterThanOrEqual(44);
});
