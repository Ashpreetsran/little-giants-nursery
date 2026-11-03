import { resolveNs } from "node:dns/promises";
import {
  assertCondition,
  assertPublicNameservers,
  assertZoneState,
  baselineRecordsFrom,
  fetchCloudflareDnsState,
  normalizeRecord,
  readDnsApiToken,
  readJsonFile,
  recordIdentityKey,
  resolveProjectPath,
} from "./lib/dns-contract.mjs";

assertCondition(process.argv.length === 2, "Usage: npm run verify:pending-zone");

const contract = await readJsonFile(resolveProjectPath("config/cloudflare-zone-contract.json"));
const baseline = await readJsonFile(resolveProjectPath(contract.baselinePath));
const token = readDnsApiToken();
const publicNameservers = await resolveNs(contract.domain);
const cloudflare = await fetchCloudflareDnsState(token, contract);

assertZoneState(cloudflare.zone, contract);
assertPublicNameservers(publicNameservers, contract);
assertCondition(cloudflare.activeRecords.length === 0, "Pending Cloudflare zone already has active DNS records");

const expected = baselineRecordsFrom(baseline, contract).map(recordIdentityKey).sort();
const scanned = cloudflare.scanCandidates
  .map((record) => normalizeRecord(record, contract.domain))
  .map(recordIdentityKey)
  .sort();
assertCondition(new Set(scanned).size === scanned.length, "Cloudflare scan review contains duplicate candidates");
assertCondition(
  JSON.stringify(scanned) === JSON.stringify(expected),
  "Cloudflare scan review no longer contains exactly the 11 positive public baseline records",
);

console.log(`Pending Cloudflare zone contract passed for ${contract.domain}`);
console.log("Full setup, free plan, 0 active records, and exactly 11 untouched scan candidates verified");
console.log("Public nameservers remain on the four pre-cutover NS1 servers");
