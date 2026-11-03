import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const expected = {
  ".env.dev": {
    NEXT_PUBLIC_SITE_URL: "op://client-logins/little-giants-nursery/NEXT_PUBLIC_SITE_URL",
    NEXT_PUBLIC_ASSET_URL: "op://client-logins/little-giants-nursery/NEXT_PUBLIC_ASSET_URL",
    NEXT_PUBLIC_GTM_ID: "op://client-logins/little-giants-nursery/NEXT_PUBLIC_GTM_ID",
  },
  ".env.prod": {
    NEXT_PUBLIC_SITE_URL: "op://client-logins/little-giants-nursery/NEXT_PUBLIC_SITE_URL",
    NEXT_PUBLIC_ASSET_URL: "op://client-logins/little-giants-nursery/NEXT_PUBLIC_ASSET_URL",
    NEXT_PUBLIC_GTM_ID: "op://client-logins/little-giants-nursery/NEXT_PUBLIC_GTM_ID",
  },
  ".env.cloudflare": {
    CLOUDFLARE_API_TOKEN: "op://client-logins/little-giants-nursery/CLOUDFLARE_API_TOKEN",
    CLOUDFLARE_ACCOUNT_ID: "op://client-logins/little-giants-nursery/CLOUDFLARE_ACCOUNT_ID",
    CLOUDFLARE_REDIRECTS_API_TOKEN: "op://client-logins/little-giants-nursery/CLOUDFLARE_REDIRECTS_API_TOKEN",
  },
  ".env.cloudflare-dns": {
    CLOUDFLARE_DNS_API_TOKEN: "op://client-logins/little-giants-nursery/CLOUDFLARE_DNS_API_TOKEN",
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const trackedTemplates = execFileSync("git", ["ls-files", "--", ".env*"], {
  cwd: projectRoot,
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .sort();
const expectedTemplates = Object.keys(expected).sort();

assert(
  JSON.stringify(trackedTemplates) === JSON.stringify(expectedTemplates),
  `Tracked environment templates must be exactly ${expectedTemplates.join(", ")}`,
);

for (const [file, expectedEntries] of Object.entries(expected)) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  assert(source.endsWith("\n"), `${file} must end with a newline`);

  const actualEntries = {};
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Z][A-Z0-9_]*)=(op:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+)$/);
    assert(match, `${file}:${index + 1} must contain only an unquoted KEY=op://vault/item/field reference`);
    const [, key, reference] = match;

    assert(!Object.hasOwn(actualEntries, key), `${file} contains duplicate key ${key}`);
    assert(!/^VERCEL(?:_|$)/.test(key), `${file} must not contain Vercel key ${key}`);
    assert(!/^CLOUDFLARE_(?:API_KEY|EMAIL)$/.test(key), `${file} must not contain global-key credential ${key}`);
    assert(!/(?:^|_)PASSWORD(?:_|$)/.test(key), `${file} must not contain password key ${key}`);
    actualEntries[key] = reference;
  }

  assert(
    JSON.stringify(Object.keys(actualEntries).sort()) === JSON.stringify(Object.keys(expectedEntries).sort()),
    `${file} does not contain the exact approved key set`,
  );

  for (const [key, reference] of Object.entries(expectedEntries)) {
    assert(actualEntries[key] === reference, `${file} has an unapproved 1Password route for ${key}`);
  }
}

console.log("Secret template contract passed");
console.log(`${expectedTemplates.length} tracked environment templates contain only the approved 1Password references`);
