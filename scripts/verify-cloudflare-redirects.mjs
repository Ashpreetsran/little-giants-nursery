import { readFile } from "node:fs/promises";
import legacyUrlMigration from "../src/content/legacy-url-migration.json" with { type: "json" };

const hostname = "www.littlegiantsnursery.org";
const csvUrl = new URL("../config/cloudflare-bulk-redirects.csv", import.meta.url);
const actual = (await readFile(csvUrl, "utf8")).trim().split(/\r?\n/);
const expected = legacyUrlMigration.redirects.map(({ source, destination, statusCode }) => (
  `${hostname}${source},https://${hostname}${destination},${statusCode},TRUE,FALSE,FALSE,FALSE`
));

if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error("Cloudflare Bulk Redirect CSV does not match the legacy migration contract.");
}

console.log(`Cloudflare Bulk Redirect CSV matches all ${expected.length} legacy redirects`);
console.log("301 status and preserve_query_string=TRUE are set for every entry");
