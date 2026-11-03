import { spawn } from "node:child_process";
import { resolveMx, resolveNs, resolveTxt } from "node:dns/promises";
import { fileURLToPath } from "node:url";
import baseline from "../config/precutover-dns-baseline.json" with { type: "json" };
import resendConfig from "../config/resend-dns-records.json" with { type: "json" };
import { canonicalOrigin, stagingOrigin } from "./lib/hostnames.mjs";

const defaultBaseUrl = canonicalOrigin;
const baseUrl = new URL(process.argv[2] ?? defaultBaseUrl);
const previewBaseUrl = stagingOrigin;
const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const resendDkim = resendConfig.records.find(({ purpose }) => purpose === "DKIM");
const resendReturnPath = resendConfig.records.find(({ purpose }) => purpose === "Return path");
const resendSpf = resendConfig.records.find(({ purpose }) => purpose === "SPF");
const resendDkimHost = resendDkim.name;
const resendBounceHost = resendReturnPath.name;
const expectedResendDkim = resendDkim.content;
const expectedResendSpf = resendSpf.content;
const expectedResendMx = `${resendReturnPath.priority} ${resendReturnPath.content}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeHost(value) {
  return value.toLowerCase().replace(/\.$/, "");
}

function normalizeMx(records) {
  return records
    .map(({ priority, exchange }) => `${priority} ${normalizeHost(exchange)}`)
    .sort();
}

function normalizeTxt(records) {
  return records.map((chunks) => chunks.join("").trim());
}

async function runScript(name, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`${scriptDirectory}${name}`, ...args], {
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${name} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

async function verifyDnsAndMail() {
  const [nameservers, googleMx, resendDkim, resendBounceMx, resendSpf] = await Promise.all([
    resolveNs(baseline.domain),
    resolveMx(baseline.domain),
    resolveTxt(resendDkimHost),
    resolveMx(resendBounceHost),
    resolveTxt(resendBounceHost),
  ]);

  const normalizedNameservers = nameservers.map(normalizeHost).sort();
  assert(normalizedNameservers.length === 2, `Expected two authoritative nameservers, received ${normalizedNameservers.length}`);
  assert(
    normalizedNameservers.every((nameserver) => nameserver.endsWith(".ns.cloudflare.com")),
    "Authoritative nameservers are not both managed by Cloudflare.",
  );

  const actualGoogleMx = normalizeMx(googleMx);
  const expectedGoogleMx = normalizeMx(baseline.mx);
  assert(
    JSON.stringify(actualGoogleMx) === JSON.stringify(expectedGoogleMx),
    `Google Workspace MX records changed. Expected ${JSON.stringify(expectedGoogleMx)}, received ${JSON.stringify(actualGoogleMx)}`,
  );

  assert(normalizeTxt(resendDkim).includes(expectedResendDkim), `Resend DKIM is missing at ${resendDkimHost}`);
  assert(normalizeMx(resendBounceMx).includes(expectedResendMx), `Resend return-path MX is missing at ${resendBounceHost}`);
  assert(normalizeTxt(resendSpf).includes(expectedResendSpf), `Resend SPF is missing at ${resendBounceHost}`);

  console.log(`Post-cutover DNS and mail contract passed for ${baseline.domain}`);
  console.log("Cloudflare authority, Google Workspace MX, and Resend DKIM, return-path MX, and SPF verified");
}

assert(baseUrl.protocol === "https:", "Production verification requires an HTTPS base URL.");
assert(baseUrl.origin === defaultBaseUrl, `Production verification must run against ${defaultBaseUrl}.`);
assert(baseUrl.pathname === "/" && !baseUrl.search && !baseUrl.hash, "Base URL must be an origin without a path, query, or fragment.");

console.log(`Verifying production launch at ${baseUrl.origin}`);
await runScript("verify-secret-templates.mjs", []);
await runScript("verify-cloudflare-only.mjs", []);
await runScript("verify-indexing-mode.mjs", ["production", baseUrl.origin]);
await runScript("verify-indexing-mode.mjs", ["preview", previewBaseUrl]);
await runScript("verify-canonical-origin.mjs", [baseUrl.origin]);
await runScript("verify-security-headers.mjs", [baseUrl.origin]);
await runScript("verify-live-migration.mjs", [baseUrl.origin]);
await runScript("verify-live-crawl.mjs", [baseUrl.origin]);
await verifyDnsAndMail();
console.log(`Production launch contract passed at ${baseUrl.origin}`);
