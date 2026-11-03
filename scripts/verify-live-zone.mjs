import contract from "../config/cloudflare-live-zone.json" with { type: "json" };

/**
 * Post-cutover drift guard for the live Cloudflare zone.
 *
 * It replaces verify:precutover-dns in the launch preflight. That script
 * compares public DNS with the NS1 baseline captured before the migration, so
 * once the domain moved to Cloudflare on 3 August 2026 it could never pass
 * again. This asserts the state the zone is actually supposed to be in now:
 * active on the expected account and nameservers, and holding exactly the
 * expected record set, so a deleted Google Workspace MX or a stray record is
 * caught rather than discovered by a parent whose email bounced.
 *
 * Read-only. It uses the exact-zone token from .env.cloudflare-dns:
 *   op run --env-file=.env.cloudflare-dns -- npm run verify:live-zone
 */
const token = process.env.CLOUDFLARE_DNS_API_TOKEN;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(token, "CLOUDFLARE_DNS_API_TOKEN is required through .env.cloudflare-dns");

async function cloudflare(path) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();
  assert(response.ok && body.success, `${path}: Cloudflare API request failed with ${response.status}`);
  return body.result;
}

function recordKey(record) {
  return [record.type, record.name, record.content, record.priority ?? "", record.proxied ? "proxied" : "dns"].join(" | ");
}

const zone = await cloudflare(`/zones/${contract.zoneId}`);
assert(zone.name === contract.domain, `Zone name is ${zone.name}, expected ${contract.domain}`);
assert(zone.account?.id === contract.accountId, "Zone moved to a different Cloudflare account");
assert(zone.status === contract.expectedZone.status, `Zone status is ${zone.status}, expected ${contract.expectedZone.status}`);
assert(zone.type === contract.expectedZone.type, `Zone type is ${zone.type}, expected ${contract.expectedZone.type}`);
assert(zone.paused === contract.expectedZone.paused, "Zone pause state changed");
assert(zone.plan?.legacy_id === contract.expectedZone.planLegacyId, `Zone plan is ${zone.plan?.legacy_id}`);
assert(zone.activated_on === contract.activatedOn, "Zone activation timestamp changed, which means the zone was recreated");

const nameServers = [...(zone.name_servers ?? [])].sort();
assert(
  JSON.stringify(nameServers) === JSON.stringify(contract.nameServers),
  `Assigned nameservers are ${nameServers.join(", ")}, expected ${contract.nameServers.join(", ")}`,
);

const live = await cloudflare(`/zones/${contract.zoneId}/dns_records?per_page=200`);
const liveKeys = live
  .map((record) => recordKey({ ...record, proxied: Boolean(record.proxied), priority: record.priority ?? null }))
  .sort();
const expectedKeys = contract.expectedRecords.map(recordKey).sort();

const missing = expectedKeys.filter((key) => !liveKeys.includes(key));
const unexpected = liveKeys.filter((key) => !expectedKeys.includes(key));

if (missing.length > 0 || unexpected.length > 0) {
  const lines = [
    ...missing.map((key) => `  missing:    ${key}`),
    ...unexpected.map((key) => `  unexpected: ${key}`),
  ];
  throw new Error(
    `Live DNS has drifted from config/cloudflare-live-zone.json.\n${lines.join("\n")}\n` +
    "If the change was deliberate, recapture the contract and say so in the commit.",
  );
}

const mx = contract.expectedRecords.filter((record) => record.type === "MX" && record.name === contract.domain);
assert(mx.length === 5, `Expected five Google Workspace MX records at the apex, found ${mx.length}`);

console.log(`Live zone contract passed for ${contract.domain}`);
console.log(
  `${zone.status} on ${nameServers.join(" and ")}, ${liveKeys.length} records matching the contract, ` +
  `including the five Google Workspace MX records and the Resend DKIM, SPF and return-path records`,
);
