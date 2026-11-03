import { resolveNs } from "node:dns/promises";
import {
  assertCondition,
  assertPlanMatchesLive,
  assertPrivateDnsPath,
  assertPublicNameservers,
  buildDnsPlan,
  cloudflareRequest,
  fetchCloudflareDnsState,
  hashObject,
  loadContractInputs,
  parseApplyArguments,
  readDnsApiToken,
  readJsonFile,
  verifyPlanDocument,
} from "./lib/dns-contract.mjs";

const args = parseApplyArguments(process.argv.slice(2));
const planPath = await assertPrivateDnsPath(args.planPath, {
  mustExist: true,
  missingMessage: `Approved private DNS plan is missing at ${args.planPath}. Run dns:plan only after the complete Squarespace export exists.`,
});
const document = await readJsonFile(planPath);
const saved = verifyPlanDocument(document);
assertCondition(saved.planSha256 === args.approvedSha256, "Approved SHA-256 does not match the saved DNS plan");

const inputs = await loadContractInputs();
const token = readDnsApiToken();
const initialPublicNameservers = await resolveNs(inputs.contract.domain);
const initialCloudflare = await fetchCloudflareDnsState(token, inputs.contract);
const liveCore = buildDnsPlan({
  ...inputs,
  ...initialCloudflare,
  publicNameservers: initialPublicNameservers,
});
assertPlanMatchesLive(saved.core, liveCore, args.approvedSha256);
assertPublicNameservers(initialPublicNameservers, inputs.contract);

const encodedZone = encodeURIComponent(inputs.contract.zoneId);
const scanAccepts = liveCore.operations.scanReview.accepts;
const approvedPosts = liveCore.operations.dnsBatch.posts;

if (scanAccepts.length > 0) {
  await cloudflareRequest({
    token,
    zoneId: inputs.contract.zoneId,
    method: "POST",
    path: `/zones/${encodedZone}/dns_records/scan/review`,
    body: { accepts: scanAccepts, rejects: [] },
    allowMutations: true,
  });
}

const nameserversAfterScan = await resolveNs(inputs.contract.domain);
assertPublicNameservers(nameserversAfterScan, inputs.contract);
const cloudflareAfterScan = await fetchCloudflareDnsState(token, inputs.contract);
const coreAfterScan = buildDnsPlan({
  ...inputs,
  ...cloudflareAfterScan,
  publicNameservers: nameserversAfterScan,
});
assertCondition(coreAfterScan.operations.scanReview.accepts.length === 0, "Cloudflare scan review still contains candidates after acceptance");
assertCondition(
  hashObject(coreAfterScan.operations.dnsBatch.posts) === hashObject(approvedPosts),
  "Cloudflare DNS posts changed after scan acceptance",
);

if (approvedPosts.length > 0) {
  const nameserversBeforePosts = await resolveNs(inputs.contract.domain);
  assertPublicNameservers(nameserversBeforePosts, inputs.contract);
  await cloudflareRequest({
    token,
    zoneId: inputs.contract.zoneId,
    method: "POST",
    path: `/zones/${encodedZone}/dns_records/batch`,
    body: { posts: approvedPosts },
    allowMutations: true,
  });
}

const finalPublicNameservers = await resolveNs(inputs.contract.domain);
assertPublicNameservers(finalPublicNameservers, inputs.contract);
const finalCloudflare = await fetchCloudflareDnsState(token, inputs.contract);
const finalCore = buildDnsPlan({
  ...inputs,
  ...finalCloudflare,
  publicNameservers: finalPublicNameservers,
});
assertCondition(finalCore.summary.activeRecordCount === finalCore.summary.desiredRecordCount, "Cloudflare active DNS count does not match the complete desired inventory");
assertCondition(finalCore.summary.scanAcceptCount === 0, "Cloudflare still has scan candidates after DNS staging");
assertCondition(finalCore.summary.postCount === 0, "Cloudflare is still missing additive DNS records after staging");

console.log(`Cloudflare DNS staging applied for ${inputs.contract.domain}`);
console.log(`${finalCore.summary.activeRecordCount} complete source and Resend records are active in the pending zone`);
console.log("Public nameservers remain on the four pre-cutover NS1 servers");
