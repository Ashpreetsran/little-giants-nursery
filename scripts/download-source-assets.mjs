import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = "https://www.littlegiantsnursery.org";
const sourceAssetRoot = "https://images.squarespace-cdn.com/content/v1/62f5617d3ade073c184c43a9/";
const outputDir = path.join(process.cwd(), "public", "images", "source");

const extraAssets = [
  {
    page: "site",
    title: "Little Giants Nursery logo",
    caption: "Original Little Giants Nursery, Brunel logo",
    url: "https://images.squarespace-cdn.com/content/v1/62f5617d3ade073c184c43a9/6b485c5e-c69c-49a7-b577-29757efc6bb8/Brunel+Little+Giants+Logo+PNG.png",
    filename: "little-giants-nursery-logo.png",
  },
  {
    page: "site",
    title: "Ofsted Good Provider",
    caption: "Ofsted Good Provider badge",
    url: "https://images.squarespace-cdn.com/content/v1/62f5617d3ade073c184c43a9/6f99c5c4-188f-4645-a170-cced7c1d2052/Ofsted_Good_GP_Colour.jpg",
    filename: "ofsted-good-provider.jpg",
  },
  {
    page: "site",
    title: "NDNA member",
    caption: "National Day Nurseries Association member logo",
    url: "https://images.squarespace-cdn.com/content/v1/62f5617d3ade073c184c43a9/757f5a33-5c85-4f51-bd15-c38133df869d/NDNA-member-logo_rgb-dated.png",
    filename: "ndna-member.png",
  },
];

function decodeXml(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function textBetween(value, tag) {
  return decodeXml(value.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "");
}

function pageSlug(url) {
  const slug = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  return slug.replace(/-+$/g, "") || "home";
}

function safeBasename(url) {
  const raw = decodeURIComponent(new URL(url).pathname.split("/").at(-1) ?? "image.jpg").replaceAll("+", "-");
  const extension = path.extname(raw).toLowerCase() || ".jpg";
  const stem = path.basename(raw, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "image";
  return `${stem}${extension}`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "Little Giants Nursery site migration" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function download(asset) {
  const source = new URL(asset.url);
  if (/\.(jpe?g)$/i.test(source.pathname)) {
    source.searchParams.set("format", "1500w");
  }

  const extension = path.extname(source.pathname).toLowerCase();
  const accept = extension === ".png"
    ? "image/png,*/*;q=0.5"
    : extension === ".gif"
      ? "image/gif,*/*;q=0.5"
      : "image/jpeg,*/*;q=0.5";

  const response = await fetch(source, {
    headers: {
      accept,
      "user-agent": "Little Giants Nursery site migration",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${asset.url}: ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
  const extensionForType = {
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
  }[contentType];
  const filename = extensionForType && path.extname(asset.filename).toLowerCase() !== extensionForType
    ? `${path.basename(asset.filename, path.extname(asset.filename))}${extensionForType}`
    : asset.filename;
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(outputDir, filename), bytes);
  return {
    ...asset,
    filename,
    localPath: `/images/source/${filename}`,
    bytes: bytes.length,
    contentType,
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

const sitemap = await fetchText(`${siteUrl}/sitemap.xml`);
const pageBlocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
const assets = [];

for (const block of pageBlocks) {
  const pageUrl = textBetween(block, "loc");
  const page = pageSlug(pageUrl);
  const images = [...block.matchAll(/<image:image>([\s\S]*?)<\/image:image>/g)].map((match) => match[1]);

  images.forEach((imageBlock, index) => {
    const url = textBetween(imageBlock, "image:loc");
    assets.push({
      page,
      title: textBetween(imageBlock, "image:title"),
      caption: textBetween(imageBlock, "image:caption"),
      url,
      filename: `${page}-${String(index + 1).padStart(2, "0")}-${safeBasename(url)}`,
    });
  });
}

const unique = [...assets, ...extraAssets]
  .filter((asset) => asset.url.startsWith(sourceAssetRoot))
  .filter((asset, index, all) => all.findIndex((candidate) => candidate.url === asset.url) === index);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
const downloaded = await mapWithConcurrency(unique, 6, download);
await writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify({ sourceSite: siteUrl, assets: downloaded }, null, 2)}\n`,
);

const totalBytes = downloaded.reduce((sum, asset) => sum + asset.bytes, 0);
console.log(`Downloaded ${downloaded.length} assets (${(totalBytes / 1024 / 1024).toFixed(1)} MB).`);
