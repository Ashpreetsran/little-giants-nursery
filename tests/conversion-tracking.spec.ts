import { expect, test } from "@playwright/test";
import { locations } from "../src/content/locations";

// The self-hosted enquiry form was retired in favour of the nursery's EyLog
// form, so the conversion signal is the outbound click on that link rather than
// a form submission. These cases replace the form-submission measurement tests
// that shipped alongside the Microsoft Advertising work.

test("an EyLog enquiry click is measurable once optional cookies are accepted", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("little-giants-cookie-consent-v2", "granted");
  });
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.goto("/nurseries/uxbridge/contact#enquire");

  const enquiry = page.locator(".enquiry-panel").getByRole("link", { name: "Complete the enquiry form" });
  await expect(enquiry).toHaveAttribute("href", /littlegiantsnursery\.eylog\.co\.uk/);

  // The link opens in a new tab, so the click is dispatched without navigating.
  await enquiry.evaluate((element) => {
    element.removeAttribute("target");
    element.addEventListener("click", (event) => event.preventDefault());
    (element as HTMLElement).click();
  });

  const events = await page.evaluate(() => {
    const layer = (window as typeof window & { dataLayer?: { event?: string }[] }).dataLayer ?? [];
    return layer.filter((item) => item.event === "eylog_enquiry_click");
  });
  expect(events).toHaveLength(1);
});

test("only the EyLog link is measured, not every outbound link", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("little-giants-cookie-consent-v2", "granted");
  });
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.goto("/nurseries/uxbridge/contact");

  const maps = page.getByRole("link", { name: "Open Google Maps" });
  await maps.evaluate((element) => {
    element.removeAttribute("target");
    element.addEventListener("click", (event) => event.preventDefault());
    (element as HTMLElement).click();
  });

  const events = await page.evaluate(() => {
    const layer = (window as typeof window & { dataLayer?: { event?: string }[] }).dataLayer ?? [];
    return layer.filter((item) => item.event === "eylog_enquiry_click");
  });
  expect(events).toHaveLength(0);
});

test("old analytics consent does not grant the new advertising measurement choice", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("little-giants-cookie-consent-v1", "granted"));
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Cookie preferences" })).toBeVisible();
  await expect(page.locator("#little-giants-gtm")).toHaveCount(0);
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.reload();
  await expect(page.locator("#little-giants-gtm")).toHaveCount(0);
});

test("every setting's enquiry link points at EyLog rather than an on-site form", async ({ page }) => {
  for (const location of locations) {
    await page.goto(`/nurseries/${location.slug}/contact`);
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.locator(".enquiry-panel").getByRole("link", { name: "Complete the enquiry form" }))
      .toHaveAttribute("href", /littlegiantsnursery\.eylog\.co\.uk/);
  }
});
