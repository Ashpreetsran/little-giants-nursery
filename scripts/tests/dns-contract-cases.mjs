import assert from "node:assert/strict";
import test from "node:test";
import baseline from "../../config/precutover-dns-baseline.json" with { type: "json" };
import contract from "../../config/cloudflare-zone-contract.json" with { type: "json" };
import resendConfig from "../../config/resend-dns-records.json" with { type: "json" };
import {
  assertPlanMatchesLive,
  baselineRecordsFrom,
  buildDnsPlan,
  cloudflareRequest,
  createPlanDocument,
  hashObject,
  parseApplyArguments,
  verifyPlanDocument,
} from "../lib/dns-contract.mjs";

const evidenceSha256 = "a".repeat(64);
const inventoryFileSha256 = "b".repeat(64);

// Pinned inside the pre-cutover window the contract describes. These cases
// exercise the planning logic, not the wall clock, so they must not start
// failing simply because that window has passed.
const now = Date.parse("2026-08-10T00:00:00Z");

function sourceInventory(records = baselineRecordsFrom(baseline, contract)) {
  return {
    schemaVersion: 1,
    domain: contract.domain,
    capturedAt: "2026-07-13T01:30:00Z",
    captureComplete: true,
    source: {
      provider: "Squarespace DNS settings",
      evidenceSha256,
    },
    records,
  };
}

function zone() {
  return {
    id: contract.zoneId,
    name: contract.domain,
    created_on: contract.createdOn,
    status: "pending",
    type: "full",
    paused: false,
    plan: { legacy_id: "free", price: 0 },
    name_servers: contract.assignedNameServers,
    original_name_servers: contract.originalNameServers,
  };
}

function plan(overrides = {}) {
  return buildDnsPlan({
    contract,
    baseline,
    resendConfig,
    inventory: sourceInventory(),
    inventoryFileSha256,
    zone: zone(),
    publicNameservers: contract.originalNameServers,
    activeRecords: [],
    scanCandidates: baselineRecordsFrom(baseline, contract),
    now,
    ...overrides,
  });
}

test("plans exactly 11 scan accepts and three additive Resend posts", () => {
  const result = plan();
  assert.equal(result.summary.scanAcceptCount, 11);
  assert.equal(result.summary.postCount, 3);
  assert.deepEqual(result.operations.scanReview.rejects, []);
  assert.deepEqual(result.operations.dnsBatch.deletes, []);
  assert.deepEqual(result.operations.dnsBatch.patches, []);
  assert.deepEqual(result.operations.dnsBatch.puts, []);
  assert.equal(result.operations.dnsBatch.posts.every(({ name }) => name.endsWith(`.${contract.domain}`)), true);
});

test("carries every unknown Squarespace-side record into additive posts", () => {
  const unknown = {
    type: "TXT",
    name: "nursery-verification",
    content: "verification-value",
    ttl: 3600,
  };
  const inventory = sourceInventory([...baselineRecordsFrom(baseline, contract), unknown]);
  const result = plan({ inventory });
  assert.equal(result.summary.sourceRecordCount, 12);
  assert.equal(result.summary.postCount, 4);
  assert.equal(result.operations.dnsBatch.posts.some(({ name }) => name === `nursery-verification.${contract.domain}`), true);
});

test("refuses a complete export that is missing one Google Workspace MX record", () => {
  const records = baselineRecordsFrom(baseline, contract);
  const missingMx = records.filter((record) => !(record.type === "MX" && record.priority === 10 && record.content === "alt4.aspmx.l.google.com"));
  assert.throws(() => plan({ inventory: sourceInventory(missingMx) }), /missing public baseline record|exactly the five Google Workspace/);
});

test("refuses a CNAME conflict in the complete export", () => {
  const records = [
    ...baselineRecordsFrom(baseline, contract),
    { type: "TXT", name: "www", content: "conflict", ttl: 3600 },
  ];
  assert.throws(() => plan({ inventory: sourceInventory(records) }), /CNAME conflict/);
});

test("refuses any unexpected active Cloudflare record instead of deleting it", () => {
  const unexpected = { type: "TXT", name: "unexpected", content: "review-me", ttl: 3600, proxied: false };
  assert.throws(() => plan({ activeRecords: [unexpected] }), /unexpected active record/);
});

test("refuses public nameserver drift before producing a plan", () => {
  assert.throws(
    () => plan({ publicNameservers: contract.assignedNameServers }),
    /Public nameservers changed from the pre-cutover NS1 delegation/,
  );
});

test("requires complete source evidence before any plan can exist", () => {
  const inventory = sourceInventory();
  inventory.captureComplete = false;
  assert.throws(() => plan({ inventory }), /captureComplete/);
});

test("requires both an explicit private plan and an exact approval hash", () => {
  const hash = "c".repeat(64);
  assert.deepEqual(
    parseApplyArguments(["--plan", "private/dns/cloudflare-dns-plan.json", "--approve-sha256", hash]),
    { planPath: "private/dns/cloudflare-dns-plan.json", approvedSha256: hash },
  );
  assert.throws(() => parseApplyArguments(["--plan", "private/dns/cloudflare-dns-plan.json"]), /requires a value|Usage/);
  assert.throws(
    () => parseApplyArguments(["--plan", "private/dns/cloudflare-dns-plan.json", "--approve-sha256", "wrong"]),
    /64-character/,
  );
});

test("detects saved plan tampering and live drift after approval", () => {
  const core = plan();
  const document = createPlanDocument(core, "2026-07-13T01:40:00Z");
  const verified = verifyPlanDocument(document);
  assert.equal(verified.planSha256, hashObject(core));
  assert.doesNotThrow(() => assertPlanMatchesLive(core, core, document.planSha256));

  const tamperedDocument = structuredClone(document);
  tamperedDocument.summary.postCount = 2;
  assert.throws(() => verifyPlanDocument(tamperedDocument), /does not match its SHA-256/);

  const driftedLive = structuredClone(core);
  driftedLive.summary.activeRecordCount = 1;
  assert.throws(() => assertPlanMatchesLive(core, driftedLive, document.planSha256), /Live DNS state drifted/);
});

test("supports an idempotent partial state without inventing destructive operations", () => {
  const baselineRecords = baselineRecordsFrom(baseline, contract);
  const activeRecords = baselineRecords.slice(0, 4);
  const scanCandidates = baselineRecords.slice(4);
  const result = plan({ activeRecords, scanCandidates });
  assert.equal(result.summary.activeRecordCount, 4);
  assert.equal(result.summary.scanAcceptCount, 7);
  assert.equal(result.summary.postCount, 3);
  assert.deepEqual(result.operations.dnsBatch.deletes, []);
  assert.deepEqual(result.operations.dnsBatch.patches, []);
  assert.deepEqual(result.operations.dnsBatch.puts, []);
});

test("rejects every provider mutation outside the two explicit POST allowlist entries before fetch", async () => {
  const zoneId = contract.zoneId;
  const scanPath = `/zones/${zoneId}/dns_records/scan/review`;
  const attempts = [
    { method: "DELETE", path: scanPath, allowMutations: true },
    { method: "PUT", path: scanPath, allowMutations: true },
    { method: "PATCH", path: scanPath, allowMutations: true },
    { method: "POST", path: `/zones/${zoneId}/dns_records`, allowMutations: true },
    { method: "POST", path: scanPath, allowMutations: false },
  ];

  for (const attempt of attempts) {
    await assert.rejects(
      cloudflareRequest({ token: "test-token-not-used", zoneId, ...attempt }),
      /outside the DNS staging allowlist/,
    );
  }
});
