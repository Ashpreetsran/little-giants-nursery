import { stagingOrigin } from "./lib/hostnames.mjs";

const mode = process.argv[2];
const baseUrl = new URL(process.argv[3] ?? stagingOrigin);

if (mode !== "preview" && mode !== "production") {
  throw new Error("Usage: node scripts/verify-indexing-mode.mjs <preview|production> [base-url]");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [pageResponse, robotsResponse, redirectResponse] = await Promise.all([
  fetch(baseUrl),
  fetch(new URL("/robots.txt", baseUrl)),
  fetch(new URL("/about-us", baseUrl), { redirect: "manual" }),
]);
assert(pageResponse.status === 200, `Homepage returned ${pageResponse.status}`);
assert(robotsResponse.status === 200, `robots.txt returned ${robotsResponse.status}`);
assert(redirectResponse.status === 301, `Legacy redirect returned ${redirectResponse.status}`);

const html = await pageResponse.text();
const robots = await robotsResponse.text();
const robotsMeta = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"[^>]*>/i)?.[1] ?? "";
const robotsHeader = pageResponse.headers.get("x-robots-tag") ?? "";
const redirectRobotsHeader = redirectResponse.headers.get("x-robots-tag") ?? "";
const robotsLines = robots.split(/\r?\n/).map((line) => line.trim());

if (mode === "preview") {
  assert(robotsMeta.includes("noindex") && robotsMeta.includes("nofollow"), `Preview robots meta is unsafe: ${robotsMeta}`);
  assert(robotsHeader.includes("noindex") && robotsHeader.includes("nofollow"), `Preview X-Robots-Tag is unsafe: ${robotsHeader}`);
  assert(redirectRobotsHeader.includes("noindex") && redirectRobotsHeader.includes("nofollow"), `Preview redirect X-Robots-Tag is unsafe: ${redirectRobotsHeader}`);
  assert(robotsLines.some((line) => /^Disallow:\s*\/$/i.test(line)), "Preview robots.txt does not block all crawling.");
} else {
  assert(robotsMeta.includes("index") && robotsMeta.includes("follow") && !robotsMeta.includes("noindex"), `Production robots meta is unsafe: ${robotsMeta}`);
  assert(!robotsHeader.includes("noindex"), `Production X-Robots-Tag is unsafe: ${robotsHeader}`);
  assert(!redirectRobotsHeader.includes("noindex"), `Production redirect X-Robots-Tag is unsafe: ${redirectRobotsHeader}`);
  assert(robotsLines.some((line) => /^Allow:\s*\/$/i.test(line)), "Production robots.txt does not allow crawling.");
  assert(!robotsLines.some((line) => /^Disallow:\s*\/$/i.test(line)), "Production robots.txt still blocks the whole site.");
  assert(robotsLines.includes("Sitemap: https://www.littlegiantsnursery.org/sitemap.xml"), "Production robots.txt does not reference the canonical sitemap.");
  assert(robotsLines.includes("Host: https://www.littlegiantsnursery.org"), "Production robots.txt does not declare the canonical host.");
}

console.log(`${mode} indexing contract passed at ${baseUrl.origin}`);
console.log(`robots meta: ${robotsMeta}; page X-Robots-Tag: ${robotsHeader || "not set"}; redirect X-Robots-Tag: ${redirectRobotsHeader || "not set"}`);
