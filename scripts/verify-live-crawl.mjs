import pageContract from "../config/page-contract.json" with { type: "json" };
import { canonicalOrigin, stagingOrigin } from "./lib/hostnames.mjs";

const baseUrl = new URL(process.argv[2] ?? stagingOrigin);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? decodeHtml(match[1] ?? match[2] ?? "") : null;
}

function metaContent(html, selector) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = attribute(tag, selector.attribute);
    if (key?.toLowerCase() === selector.value.toLowerCase()) return attribute(tag, "content");
  }
  return null;
}

function linkHref(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (attribute(tag, "rel")?.toLowerCase().split(/\s+/).includes(rel)) return attribute(tag, "href");
  }
  return null;
}

function pagePath(url) {
  return `${url.pathname}${url.search}`;
}

async function fetchPage(path) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  return { response, html: await response.text() };
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", baseUrl));
assert(sitemapResponse.status === 200, `sitemap.xml returned ${sitemapResponse.status}`);
assert(sitemapResponse.headers.get("content-type")?.includes("xml"), "sitemap.xml is not served as XML");

const sitemapXml = await sitemapResponse.text();
const canonicalUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(decodeHtml(match[1])));
assert(
  canonicalUrls.length === pageContract.paths.length,
  `sitemap.xml contains ${canonicalUrls.length} URLs instead of the ${pageContract.paths.length} in config/page-contract.json`,
);
{
  const listed = canonicalUrls.map((url) => url.pathname).sort();
  const expected = [...pageContract.paths].sort();
  assert(
    JSON.stringify(listed) === JSON.stringify(expected),
    `sitemap.xml paths do not match config/page-contract.json.\n  sitemap:  ${listed.join(", ")}\n  contract: ${expected.join(", ")}`,
  );
}
assert(new Set(canonicalUrls.map(String)).size === canonicalUrls.length, "sitemap.xml contains duplicate URLs");
for (const url of canonicalUrls) {
  assert(url.origin === canonicalOrigin, `sitemap.xml contains a non-canonical origin: ${url.origin}`);
  assert(!url.search && !url.hash, `sitemap.xml contains a query or fragment: ${url}`);
}

const pages = await Promise.all(canonicalUrls.map(async (canonicalUrl) => {
  const path = pagePath(canonicalUrl);
  const { response, html } = await fetchPage(path);
  assert(response.status === 200, `${path} returned ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/html"), `${path} is not served as HTML`);
  assert(response.headers.get("x-nextjs-prerender")?.includes("1"), `${path} is not served from pre-rendered output`);
  assert(response.headers.get("cache-control")?.includes("s-maxage=31536000"), `${path} does not have the expected edge cache policy`);
  assert(/<html\b[^>]*\slang=["']en(?:-GB)?["']/i.test(html), `${path} does not declare English as the document language`);
  assert((html.match(/<h1\b/gi) ?? []).length === 1, `${path} does not contain exactly one primary heading`);
  assert((html.match(/<main\b/gi) ?? []).length === 1, `${path} does not contain exactly one main landmark`);
  assert(/\sid=["']main-content["']/i.test(html), `${path} has no main-content skip-link target`);

  const title = decodeHtml(html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "").trim();
  const description = metaContent(html, { attribute: "name", value: "description" })?.trim() ?? "";
  const canonical = linkHref(html, "canonical");
  const openGraphUrl = metaContent(html, { attribute: "property", value: "og:url" });
  const openGraphImage = metaContent(html, { attribute: "property", value: "og:image" });
  const openGraphImageAlt = metaContent(html, { attribute: "property", value: "og:image:alt" });
  const openGraphImageWidth = metaContent(html, { attribute: "property", value: "og:image:width" });
  const openGraphImageHeight = metaContent(html, { attribute: "property", value: "og:image:height" });
  const twitterCard = metaContent(html, { attribute: "name", value: "twitter:card" });
  const twitterImage = metaContent(html, { attribute: "name", value: "twitter:image" });

  assert(title.length > 0, `${path} has no title`);
  assert(description.length > 0, `${path} has no meta description`);
  assert(canonical && new URL(canonical).toString() === canonicalUrl.toString(), `${path} canonical is ${canonical}`);
  assert(openGraphUrl && new URL(openGraphUrl).toString() === canonicalUrl.toString(), `${path} Open Graph URL is ${openGraphUrl}`);
  assert(openGraphImage, `${path} has no Open Graph image`);
  assert(openGraphImageAlt?.trim(), `${path} has no Open Graph image alt text`);
  assert(openGraphImageWidth === "1200" && openGraphImageHeight === "630", `${path} has incorrect Open Graph image dimensions`);
  assert(twitterCard === "summary_large_image", `${path} has an incorrect Twitter card type`);
  assert(twitterImage === openGraphImage, `${path} Twitter and Open Graph images do not match`);

  for (const block of html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? []) {
    const json = block.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      JSON.parse(json);
    } catch {
      throw new Error(`${path} contains invalid JSON-LD`);
    }
  }

  const ids = new Set((html.match(/\sid=(?:"[^"]*"|'[^']*')/gi) ?? []).map((item) => attribute(`<i ${item.trim()}>`, "id")));
  const links = (html.match(/<a\b[^>]*>/gi) ?? []).map((tag) => ({
    href: attribute(tag, "href"),
    rel: attribute(tag, "rel") ?? "",
    target: attribute(tag, "target") ?? "",
  })).filter((link) => link.href);
  const images = (html.match(/<img\b[^>]*>/gi) ?? []).map((tag) => ({
    alt: attribute(tag, "alt"),
    src: attribute(tag, "src"),
  }));

  for (const image of images) {
    assert(image.alt !== null, `${path} contains an image without an alt attribute`);
    assert(image.src, `${path} contains an image without a source`);
  }

  return { canonicalUrl, path, title, description, ids, links, images, socialImage: openGraphImage };
}));

for (const field of ["title", "description"]) {
  const values = pages.map((page) => page[field]);
  assert(new Set(values).size === values.length, `Sitemap pages contain duplicate ${field} values`);
}

const pageByPath = new Map(pages.map((page) => [page.canonicalUrl.pathname, page]));
const targetPaths = new Set();
const imageUrls = new Set();
const socialImageUrls = new Set(pages.map((page) => page.socialImage));
let externalLinkInstances = 0;

for (const page of pages) {
  for (const link of page.links) {
    const href = link.href;
    if (/^(?:mailto:|tel:|javascript:)/i.test(href)) continue;
    const target = new URL(href, page.canonicalUrl);
    if (target.origin !== page.canonicalUrl.origin) {
      externalLinkInstances += 1;
      if (link.target.toLowerCase() === "_blank") {
        assert(/\b(?:noopener|noreferrer)\b/i.test(link.rel), `${page.path} has an unsafe new-tab link to ${target.hostname}`);
      }
      continue;
    }
    targetPaths.add(target.pathname);

    if (target.hash) {
      const targetPage = pageByPath.get(target.pathname);
      assert(targetPage, `${page.path} links to an unsitemapped fragment target ${target.pathname}${target.hash}`);
      assert(targetPage.ids.has(decodeURIComponent(target.hash.slice(1))), `${page.path} links to missing fragment ${target.pathname}${target.hash}`);
    }
  }

  for (const image of page.images) {
    const target = new URL(image.src, baseUrl);
    if (target.origin === baseUrl.origin) imageUrls.add(target.toString());
  }
}

const targetResults = await Promise.all([...targetPaths].map(async (path) => {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  return { path, status: response.status };
}));
for (const target of targetResults) assert(target.status === 200, `Internal target ${target.path} returned ${target.status}`);

const imageResults = await Promise.all([...imageUrls].map(async (url) => {
  const response = await fetch(url, { redirect: "manual" });
  return { url, status: response.status, contentType: response.headers.get("content-type") };
}));
for (const image of imageResults) {
  assert(image.status === 200, `Image ${image.url} returned ${image.status}`);
  assert(image.contentType?.startsWith("image/"), `Image ${image.url} has content type ${image.contentType}`);
}

assert(socialImageUrls.size === pages.length, "Sitemap pages do not have unique social images");
const socialImageResults = await Promise.all([...socialImageUrls].map(async (url) => {
  const response = await fetch(url, { redirect: "manual" });
  return { url, status: response.status, contentType: response.headers.get("content-type") };
}));
for (const image of socialImageResults) {
  assert(image.status === 200, `Social image ${image.url} returned ${image.status}`);
  assert(image.contentType?.startsWith("image/"), `Social image ${image.url} has content type ${image.contentType}`);
}

const manifestResponse = await fetch(new URL("/manifest.webmanifest", baseUrl));
assert(manifestResponse.status === 200, `Web manifest returned ${manifestResponse.status}`);
assert(manifestResponse.headers.get("content-type")?.includes("manifest+json"), "Web manifest has an incorrect content type");
const manifest = await manifestResponse.json();
assert(manifest.name === "Little Giants Nursery", `Web manifest name is ${manifest.name}`);
assert(manifest.start_url === "/", `Web manifest start URL is ${manifest.start_url}`);
assert(manifest.display === "standalone", `Web manifest display mode is ${manifest.display}`);
assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, "Web manifest has no icons");
for (const icon of manifest.icons) {
  const response = await fetch(new URL(icon.src, baseUrl), { redirect: "manual" });
  assert(response.status === 200, `Manifest icon ${icon.src} returned ${response.status}`);
  assert(response.headers.get("content-type")?.startsWith("image/"), `Manifest icon ${icon.src} has an incorrect content type`);
}

console.log(`Live crawl contract passed at ${baseUrl.origin}`);
console.log(`${pages.length} sitemap pages, ${targetPaths.size} internal targets, ${externalLinkInstances} safe external link instances, ${imageUrls.size} rendered images, ${socialImageUrls.size} unique social cards, and the web manifest verified`);
