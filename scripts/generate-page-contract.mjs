import { readFile, writeFile } from "node:fs/promises";
import { canonicalOrigin } from "./lib/hostnames.mjs";

/**
 * The page catalogue lives in TypeScript (src/content/site-pages.ts) but the
 * verify-*.mjs guards are plain Node. This writes the agreed list of indexable
 * paths and social cards to JSON so both can read it. tests/metadata.spec.ts
 * fails if the catalogue and this contract ever disagree, so regenerating it is
 * a deliberate act rather than something that can drift unnoticed.
 *
 * Run after `npm run build`.
 */
const sitemap = await readFile(new URL("../.next/server/app/sitemap.xml.body", import.meta.url), "utf8");
const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => match[1].replace(canonicalOrigin, ""))
  .map((path) => (path === "" ? "/" : path));

if (paths.length === 0) throw new Error("No sitemap entries found. Run npm run build first.");

const cards = JSON.parse(await readFile(new URL("../design/og-pages.json", import.meta.url), "utf8"))
  .map((card) => card.file);

const contract = { generatedAt: new Date().toISOString().slice(0, 10), paths, socialCards: cards };
await writeFile(new URL("../config/page-contract.json", import.meta.url), `${JSON.stringify(contract, null, 2)}\n`);
console.log(`Wrote page contract with ${paths.length} paths and ${cards.length} social cards`);
