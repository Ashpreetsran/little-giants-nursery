import legacyUrlMigration from "../src/content/legacy-url-migration.json" with { type: "json" };
import { stagingOrigin } from "./lib/hostnames.mjs";

const baseUrl = new URL(process.argv[2] ?? stagingOrigin);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pageResponse = await fetch(baseUrl);
assert(pageResponse.status === 200, `Homepage returned ${pageResponse.status}`);

const pageHeaders = pageResponse.headers;
assert(pageHeaders.get("content-security-policy")?.includes("frame-ancestors 'self'"), "CSP frame protection is missing.");
assert(pageHeaders.get("content-security-policy")?.includes("object-src 'none'"), "CSP object protection is missing.");
assert(pageHeaders.get("strict-transport-security")?.includes("max-age=63072000"), "HSTS is missing or too short.");
assert(pageHeaders.get("x-content-type-options") === "nosniff", "MIME sniffing protection is missing.");
assert(pageHeaders.get("x-frame-options") === "SAMEORIGIN", "Frame protection is missing.");
assert(pageHeaders.get("referrer-policy") === "strict-origin-when-cross-origin", "Referrer policy is missing.");
assert(pageHeaders.get("permissions-policy")?.includes("camera=()"), "Permissions policy is missing.");

const aboutUs = legacyUrlMigration.redirects.find(({ source }) => source === "/about-us");
assert(aboutUs, "The /about-us redirect is missing from the migration contract.");
const redirectResponse = await fetch(new URL("/about-us?q=a%2Bb", baseUrl), { redirect: "manual" });
assert(redirectResponse.status === 301, `Legacy redirect returned ${redirectResponse.status}`);
const expectedLocation = new URL(`${aboutUs.destination}?q=a%2Bb`, baseUrl);
const actualLocation = new URL(redirectResponse.headers.get("location") ?? "", baseUrl);
assert(
  actualLocation.href === expectedLocation.href,
  `Legacy redirect changed an encoded query: expected ${expectedLocation.href}, received ${actualLocation.href}`,
);
assert(redirectResponse.headers.get("strict-transport-security")?.includes("max-age=63072000"), "Redirect HSTS is missing.");
assert(redirectResponse.headers.get("x-content-type-options") === "nosniff", "Redirect MIME protection is missing.");

const cartResponse = await fetch(new URL("/cart", baseUrl), { redirect: "manual" });
assert(cartResponse.status === 410, `Retired cart returned ${cartResponse.status}`);
assert(cartResponse.headers.get("x-robots-tag") === "noindex, nofollow", "Retired cart noindex header is missing.");

console.log(`Security header contract passed at ${baseUrl.origin}`);
console.log("CSP, HSTS, framing, MIME, referrer, permissions, redirect, and 410 protections verified");
