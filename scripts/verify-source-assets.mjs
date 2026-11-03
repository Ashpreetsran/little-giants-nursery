import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const manifestPath = `${projectRoot}/public/images/source/manifest.json`;
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasExpectedSignature(bytes, contentType) {
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === "image/gif") return bytes.subarray(0, 6).toString("ascii") === "GIF87a" || bytes.subarray(0, 6).toString("ascii") === "GIF89a";
  return false;
}

assert(manifest.sourceSite === "https://www.littlegiantsnursery.org", `Unexpected source site ${manifest.sourceSite}`);
assert(Array.isArray(manifest.assets), "Source asset manifest has no assets array.");
assert(manifest.assets.length === 52, `Expected 52 source assets, received ${manifest.assets.length}`);

const localPaths = new Set();
for (const asset of manifest.assets) {
  assert(asset.url.startsWith("https://"), `${asset.filename}: source URL is not HTTPS`);
  assert(asset.localPath === `/images/source/${asset.filename}`, `${asset.filename}: local path does not match its filename`);
  assert(!localPaths.has(asset.localPath), `Duplicate source asset path ${asset.localPath}`);
  localPaths.add(asset.localPath);

  const filePath = `${projectRoot}/public${asset.localPath}`;
  const [fileStat, bytes] = await Promise.all([stat(filePath), readFile(filePath)]);
  assert(fileStat.isFile(), `${asset.localPath}: not a regular file`);
  assert(fileStat.size === asset.bytes, `${asset.localPath}: expected ${asset.bytes} bytes, received ${fileStat.size}`);
  assert(hasExpectedSignature(bytes, asset.contentType), `${asset.localPath}: signature does not match ${asset.contentType}`);
}

const sourceFiles = await readdir(`${projectRoot}/src`, { recursive: true, withFileTypes: true });
const sourceText = (await Promise.all(sourceFiles
  .filter((entry) => entry.isFile() && /\.(?:css|json|ts|tsx)$/.test(entry.name))
  .map((entry) => readFile(`${entry.parentPath}/${entry.name}`, "utf8")))).join("\n");
const referencedPaths = [...localPaths].filter((localPath) => sourceText.includes(localPath));
assert(referencedPaths.length >= 20, `Only ${referencedPaths.length} downloaded source assets are referenced by the application`);

console.log("Source asset contract passed");
console.log(`${manifest.assets.length} downloaded assets verified by path, byte size, content type, and file signature; ${referencedPaths.length} are referenced by the application`);
