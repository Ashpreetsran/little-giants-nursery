import legacyUrlMigration from "../src/content/legacy-url-migration.json" with { type: "json" };

const sitemapUrl = new URL(process.argv[2] ?? legacyUrlMigration.sourceSitemap);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const response = await fetch(sitemapUrl);
assert(response.status === 200, `${sitemapUrl}: expected 200, received ${response.status}`);

const xml = await response.text();
const currentPaths = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname)
  .sort();
const expectedPaths = [...legacyUrlMigration.sourceSitemapPaths].sort();

const added = currentPaths.filter((path) => !expectedPaths.includes(path));
const removed = expectedPaths.filter((path) => !currentPaths.includes(path));

assert(added.length === 0, `Unmapped source sitemap paths: ${added.join(", ")}`);
assert(removed.length === 0, `Contracted source sitemap paths are missing: ${removed.join(", ")}`);

console.log(`Source sitemap contract is current at ${sitemapUrl}`);
console.log(`${currentPaths.length} page paths match the migration contract`);
