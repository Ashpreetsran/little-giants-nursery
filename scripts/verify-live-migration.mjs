import { createHash } from "node:crypto";
import legacyUrlMigration from "../src/content/legacy-url-migration.json" with { type: "json" };
import { stagingOrigin } from "./lib/hostnames.mjs";

const baseUrl = new URL(process.argv[2] ?? stagingOrigin);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function relativeLocation(location) {
  const url = new URL(location, baseUrl);
  return `${url.pathname}${url.search}${url.hash}`;
}

for (const redirect of legacyUrlMigration.redirects) {
  const response = await fetch(new URL(redirect.source, baseUrl), { redirect: "manual" });
  assert(response.status === redirect.statusCode, `${redirect.source}: expected ${redirect.statusCode}, received ${response.status}`);
  const location = response.headers.get("location");
  assert(location && relativeLocation(location) === redirect.destination, `${redirect.source}: unexpected Location ${location}`);

  const queryResponse = await fetch(new URL(`${redirect.source}?utm_source=migration-check`, baseUrl), { redirect: "manual" });
  const [path, fragment] = redirect.destination.split("#");
  const expectedQueryLocation = `${path}?utm_source=migration-check${fragment ? `#${fragment}` : ""}`;
  const queryLocation = queryResponse.headers.get("location");
  assert(queryResponse.status === 301, `${redirect.source}: query redirect did not return 301`);
  assert(queryLocation && relativeLocation(queryLocation) === expectedQueryLocation, `${redirect.source}: query string was not preserved`);

  for (const encodedQuery of ["q=a%2Bb", "q=a%26b"]) {
    const encodedResponse = await fetch(new URL(`${redirect.source}?${encodedQuery}`, baseUrl), { redirect: "manual" });
    const encodedLocation = encodedResponse.headers.get("location");
    assert(encodedResponse.status === 301, `${redirect.source}: encoded query redirect did not return 301`);
    assert(encodedLocation && relativeLocation(encodedLocation) === `${path}?${encodedQuery}`, `${redirect.source}: encoded query was not preserved exactly`);
  }

  const trailingResponse = await fetch(new URL(`${redirect.source}/?utm_source=trailing-slash`, baseUrl), { redirect: "manual" });
  const trailingLocation = trailingResponse.headers.get("location");
  assert(trailingResponse.status === 301, `${redirect.source}/: trailing slash did not return a single 301`);
  assert(trailingLocation && relativeLocation(trailingLocation) === `${path}?utm_source=trailing-slash`, `${redirect.source}/: trailing slash query was not preserved`);

  const followed = await fetch(new URL(redirect.source, baseUrl));
  assert(followed.status === 200, `${redirect.source}: final page returned ${followed.status}`);
  assert(new URL(followed.url).pathname === path, `${redirect.source}: final path was ${new URL(followed.url).pathname}`);
}

for (const retained of legacyUrlMigration.retained) {
  const response = await fetch(new URL(retained.source, baseUrl), { redirect: "manual" });
  assert(response.status === retained.statusCode, `${retained.source}: expected ${retained.statusCode}, received ${response.status}`);
}

for (const document of legacyUrlMigration.preservedAssets) {
  const headResponse = await fetch(new URL(document.path, baseUrl), { method: "HEAD", redirect: "manual" });
  assert(headResponse.status === document.statusCode, `${document.path}: HEAD expected ${document.statusCode}, received ${headResponse.status}`);
  assert(headResponse.headers.get("content-type")?.includes("application/pdf"), `${document.path}: HEAD is not served as a PDF`);
  assert(Number(headResponse.headers.get("content-length")) === document.size, `${document.path}: HEAD byte size changed`);

  const response = await fetch(new URL(document.path, baseUrl), { redirect: "manual" });
  assert(response.status === document.statusCode, `${document.path}: expected ${document.statusCode}, received ${response.status}`);
  assert(response.headers.get("content-type")?.includes("application/pdf"), `${document.path}: not served as a PDF`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.length === document.size, `${document.path}: byte size changed`);
  assert(createHash("sha256").update(bytes).digest("hex") === document.sha256, `${document.path}: SHA-256 changed`);
}

for (const retired of legacyUrlMigration.retired) {
  const response = await fetch(new URL(retired.source, baseUrl), { redirect: "manual" });
  assert(response.status === retired.statusCode, `${retired.source}: expected ${retired.statusCode}, received ${response.status}`);
  assert(response.headers.get("x-robots-tag") === "noindex, nofollow", `${retired.source}: noindex header is missing`);
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", baseUrl));
assert(sitemapResponse.status === 200, `/sitemap.xml: received ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
// Compare whole paths: a bare source such as /about is a substring of its own
// destination now, so includes() would fail on a correct sitemap.
const listedPaths = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname),
);
for (const { source } of [...legacyUrlMigration.redirects, ...legacyUrlMigration.retired]) {
  assert(!listedPaths.has(source), `/sitemap.xml still contains ${source}`);
}

console.log(`Migration contract passed at ${baseUrl.origin}`);
console.log(`${legacyUrlMigration.redirects.length} redirects, ${legacyUrlMigration.retained.length} retained pages, ${legacyUrlMigration.preservedAssets.length} PDFs, ${legacyUrlMigration.retired.length} retired path`);
