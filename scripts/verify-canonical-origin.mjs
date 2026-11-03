import legacyUrlMigration from "../src/content/legacy-url-migration.json" with { type: "json" };

const canonicalOrigin = new URL(process.argv[2] ?? "https://www.littlegiantsnursery.org");
const expectedHostname = "www.littlegiantsnursery.org";
const apexHostname = "littlegiantsnursery.org";
const query = "?utm_source=canonical-check&q=a%2Bb";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function absoluteLocation(location, source) {
  return new URL(location, source).toString();
}

async function expectDirect301(source, target) {
  const response = await fetch(source, { redirect: "manual" });
  const location = response.headers.get("location");
  assert(response.status === 301, `${source}: expected a direct 301, received ${response.status}`);
  assert(location, `${source}: redirect has no Location header`);
  assert(absoluteLocation(location, source) === target, `${source}: expected ${target}, received ${location}`);
}

assert(canonicalOrigin.protocol === "https:", "Canonical verification requires HTTPS.");
assert(canonicalOrigin.hostname === expectedHostname, `Canonical hostname must be ${expectedHostname}.`);
assert(canonicalOrigin.pathname === "/" && !canonicalOrigin.search && !canonicalOrigin.hash, "Canonical URL must be an origin without a path, query, or fragment.");

const canonicalPage = new URL(`/fees-funding${query}`, canonicalOrigin);
const canonicalResponse = await fetch(canonicalPage, { redirect: "manual" });
assert(canonicalResponse.status === 200, `${canonicalPage}: canonical page returned ${canonicalResponse.status}`);

for (const alternateOrigin of [
  `http://${expectedHostname}`,
  `https://${apexHostname}`,
  `http://${apexHostname}`,
]) {
  const source = `${alternateOrigin}/fees-funding${query}`;
  await expectDirect301(source, canonicalPage.toString());
}

for (const { source, destination } of legacyUrlMigration.redirects) {
  const target = new URL(`${destination}${query}`, canonicalOrigin).toString();
  for (const alternateOrigin of [
    `http://${expectedHostname}`,
    `https://${apexHostname}`,
    `http://${apexHostname}`,
  ]) {
    await expectDirect301(`${alternateOrigin}${source}${query}`, target);
    await expectDirect301(`${alternateOrigin}${source}/${query}`, target);
  }
}

console.log(`Canonical origin contract passed for ${canonicalOrigin.origin}`);
console.log(`HTTPS www is canonical, HTTP and apex preserve path and query, and ${legacyUrlMigration.redirects.length} legacy mappings avoid redirect chains`);
