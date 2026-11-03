import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [rootEntries, packageText, lockText, wranglerText, devEnv, prodEnv, cloudflareEnv, cloudflareDnsEnv] = await Promise.all([
  readdir(projectRoot),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  readFile(new URL("../.env.dev", import.meta.url), "utf8"),
  readFile(new URL("../.env.prod", import.meta.url), "utf8"),
  readFile(new URL("../.env.cloudflare", import.meta.url), "utf8"),
  readFile(new URL("../.env.cloudflare-dns", import.meta.url), "utf8"),
]);

const packageJson = JSON.parse(packageText);
const packageLock = JSON.parse(lockText);
const packageNames = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.optionalDependencies,
});
const scriptCommands = Object.values(packageJson.scripts ?? {});

for (const entry of [".vercel", ".vercelignore", "vercel.json"]) {
  assert(!rootEntries.includes(entry), `Removed hosting configuration reappeared at ${entry}`);
}

assert(packageNames.includes("@opennextjs/cloudflare"), "The OpenNext Cloudflare adapter dependency is missing.");
assert(packageNames.includes("wrangler"), "The Wrangler dependency is missing.");
assert(!packageNames.some((name) => name === "vercel" || name.startsWith("@vercel/")), "A Vercel package dependency is present.");
assert(!scriptCommands.some((command) => /(?:^|\s)(?:npx\s+)?vercel(?:\s|$)/i.test(command)), "A package script still invokes Vercel.");
assert(
  !Object.keys(packageLock.packages ?? {}).some((name) => name === "node_modules/vercel" || name.startsWith("node_modules/@vercel/")),
  "The package lock still contains a Vercel package.",
);

assert(/"main"\s*:\s*"custom-worker\.ts"/.test(wranglerText), "Wrangler does not use the custom OpenNext Worker entry.");
assert(/"workers_dev"\s*:\s*false/.test(wranglerText), "The production workers.dev route is not disabled.");
assert(!/"pages_build_output_dir"\s*:/.test(wranglerText), "A Cloudflare Pages output setting is present instead of the OpenNext Worker target.");
assert(!/\bVERCEL(?:_|\b)/i.test(`${devEnv}\n${prodEnv}\n${cloudflareEnv}\n${cloudflareDnsEnv}`), "A Vercel environment variable is still configured.");
assert(
  cloudflareEnv.includes("CLOUDFLARE_API_TOKEN=op://client-logins/little-giants-nursery/CLOUDFLARE_API_TOKEN"),
  "The project does not use its dedicated 1Password-backed Cloudflare token.",
);
assert(!/^CLOUDFLARE_API_KEY=/m.test(cloudflareEnv), "The project still references the shared global Cloudflare API key.");
assert(!/^CLOUDFLARE_EMAIL=/m.test(cloudflareEnv), "The project still configures global-key email authentication.");
assert(
  cloudflareDnsEnv === "CLOUDFLARE_DNS_API_TOKEN=op://client-logins/little-giants-nursery/CLOUDFLARE_DNS_API_TOKEN\n",
  "The DNS staging environment must contain only its exact-zone 1Password-backed token.",
);
for (const line of cloudflareEnv.split(/\r?\n/).filter(Boolean)) {
  assert(line.includes("=op://"), `Cloudflare environment value is not a 1Password reference: ${line.split("=")[0]}`);
}
for (const line of cloudflareDnsEnv.split(/\r?\n/).filter(Boolean)) {
  assert(line.includes("=op://"), `Cloudflare DNS environment value is not a 1Password reference: ${line.split("=")[0]}`);
}

console.log("Cloudflare-only deployment contract passed");
console.log("OpenNext Worker adapter, dedicated scoped token, disabled production workers.dev route, and absence of Vercel configuration verified");
