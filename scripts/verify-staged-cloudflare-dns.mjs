import { resolveNs } from "node:dns/promises";
import {
  assertCondition,
  buildDnsPlan,
  fetchCloudflareDnsState,
  loadContractInputs,
  readDnsApiToken,
  verifyAssignedNameserverRecords,
} from "./lib/dns-contract.mjs";

assertCondition(process.argv.length === 2, "Usage: npm run verify:staged-dns");

const inputs = await loadContractInputs();
const token = readDnsApiToken();
const publicNameservers = await resolveNs(inputs.contract.domain);
const cloudflare = await fetchCloudflareDnsState(token, inputs.contract);
const core = buildDnsPlan({
  ...inputs,
  ...cloudflare,
  publicNameservers,
});

assertCondition(core.summary.activeRecordCount === core.summary.desiredRecordCount, "Pending Cloudflare zone does not contain the complete desired DNS set");
assertCondition(core.summary.scanAcceptCount === 0, "Pending Cloudflare zone still has unaccepted scan records");
assertCondition(core.summary.postCount === 0, "Pending Cloudflare zone is missing source or Resend records");
await verifyAssignedNameserverRecords(inputs.contract, core.desiredRecords);

console.log(`Staged Cloudflare DNS contract passed for ${inputs.contract.domain}`);
console.log(`${core.summary.activeRecordCount} exact records verified through the API and both assigned nameservers`);
console.log("The zone remains pending and public delegation remains on the four NS1 nameservers");
