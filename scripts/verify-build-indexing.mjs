import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pageContract from "../config/page-contract.json" with { type: "json" };
import { canonicalOrigin, stagingOrigin } from "./lib/hostnames.mjs";

const mode = process.argv[2];
if (mode !== "preview" && mode !== "production") {
  throw new Error("Usage: node scripts/verify-build-indexing.mjs <preview|production>");
}

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const productionOrigin = canonicalOrigin;
const previewOrigin = stagingOrigin;
const expectedAssetOrigin = mode === "preview" ? previewOrigin : productionOrigin;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/(?:^|\s)([\w:-]+)="([^"]*)"/g)].map((match) => [match[1].toLowerCase(), match[2]]));
}

function metaContent(html, attribute, value) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const parsed = attributes(tag);
    if (parsed[attribute] === value) return parsed.content ?? "";
  }
  return "";
}

function robotsMeta(html) {
  return metaContent(html, "name", "robots");
}

function canonicalHref(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const parsed = attributes(tag);
    if (parsed.rel?.split(/\s+/).includes("canonical")) return parsed.href ?? "";
  }
  return "";
}

const buildId = (await readFile(`${projectRoot}/.next/BUILD_ID`, "utf8")).trim();
assert(buildId, "The Next.js build ID is empty.");

const [prerenderManifestSource, robots] = await Promise.all([
  readFile(`${projectRoot}/.next/prerender-manifest.json`, "utf8"),
  readFile(`${projectRoot}/.next/server/app/robots.txt.body`, "utf8"),
]);
const prerenderManifest = JSON.parse(prerenderManifestSource);
const pageRoutes = Object.keys(prerenderManifest.routes)
  .filter((route) => route === "/" || (!route.startsWith("/_") && !/\.[a-z0-9]+$/i.test(route)))
  .sort();
const expectedRoutes = [...pageContract.paths].sort();
assert(
  JSON.stringify(pageRoutes) === JSON.stringify(expectedRoutes),
  `Pre-rendered pages do not match config/page-contract.json.\n  built:    ${pageRoutes.join(", ")}\n  contract: ${expectedRoutes.join(", ")}`,
);

for (const route of pageRoutes) {
  const relativePath = route === "/" ? "index" : route.slice(1);
  const [nextHtml, openNextCacheSource] = await Promise.all([
    readFile(`${projectRoot}/.next/server/app/${relativePath}.html`, "utf8"),
    readFile(`${projectRoot}/.open-next/cache/${buildId}/${relativePath}.cache`, "utf8"),
  ]);

  const openNextCache = JSON.parse(openNextCacheSource);
  assert(openNextCache.type === "app", `${route}: OpenNext cache has type ${openNextCache.type}`);
  assert(openNextCache.meta?.headers?.["x-nextjs-prerender"] === "1", `${route}: OpenNext cache is not marked as pre-rendered`);
  assert(typeof openNextCache.html === "string", `${route}: OpenNext cache has no HTML`);

  const nextRobotsMeta = robotsMeta(nextHtml);
  const openNextRobotsMeta = robotsMeta(openNextCache.html);
  assert(nextRobotsMeta === openNextRobotsMeta, `${route}: Next.js and OpenNext robots metadata do not match`);

  if (mode === "preview") {
    assert(nextRobotsMeta.includes("noindex") && nextRobotsMeta.includes("nofollow"), `${route}: preview robots metadata is unsafe`);
  } else {
    assert(
      nextRobotsMeta.includes("index") && nextRobotsMeta.includes("follow") && !nextRobotsMeta.includes("noindex"),
      `${route}: production robots metadata is unsafe`,
    );
  }

  const expectedCanonical = route === "/" ? productionOrigin : `${productionOrigin}${route}`;
  const nextCanonical = canonicalHref(nextHtml);
  const openNextCanonical = canonicalHref(openNextCache.html);
  assert(nextCanonical === expectedCanonical, `${route}: Next.js canonical is incorrect`);
  assert(openNextCanonical === expectedCanonical, `${route}: OpenNext canonical is incorrect`);

  const nextOpenGraphUrl = metaContent(nextHtml, "property", "og:url");
  const openNextOpenGraphUrl = metaContent(openNextCache.html, "property", "og:url");
  assert(nextOpenGraphUrl === expectedCanonical, `${route}: Next.js Open Graph URL is incorrect`);
  assert(openNextOpenGraphUrl === expectedCanonical, `${route}: OpenNext Open Graph URL is incorrect`);

  const nextOpenGraphImage = metaContent(nextHtml, "property", "og:image");
  const openNextOpenGraphImage = metaContent(openNextCache.html, "property", "og:image");
  assert(nextOpenGraphImage.startsWith(`${expectedAssetOrigin}/og/`), `${route}: Next.js Open Graph image is not on the expected asset origin`);
  assert(openNextOpenGraphImage === nextOpenGraphImage, `${route}: Next.js and OpenNext Open Graph images do not match`);
}

const robotsLines = robots.split(/\r?\n/).map((line) => line.trim());
if (mode === "preview") {
  assert(robotsLines.some((line) => /^Disallow:\s*\/$/i.test(line)), "Preview build robots.txt does not block crawling.");
} else {
  assert(robotsLines.some((line) => /^Allow:\s*\/$/i.test(line)), "Production build robots.txt does not allow crawling.");
  assert(!robotsLines.some((line) => /^Disallow:\s*\/$/i.test(line)), "Production build robots.txt blocks the whole site.");
  assert(robotsLines.includes("Host: https://www.littlegiantsnursery.org"), "Production build robots.txt has an incorrect host.");
  assert(robotsLines.includes("Sitemap: https://www.littlegiantsnursery.org/sitemap.xml"), "Production build robots.txt has an incorrect sitemap.");
}

console.log(`${mode} build indexing contract passed for ${buildId}`);
console.log(`${pageRoutes.length} Next.js and OpenNext pages have matching robots, canonical, and Open Graph metadata`);
