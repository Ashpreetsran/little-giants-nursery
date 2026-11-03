import { createHash } from "node:crypto";
import { Resolver, resolve4 } from "node:dns/promises";
import { readFile, realpath } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

const allowedRecordTypes = new Set(["A", "AAAA", "CAA", "CNAME", "MX", "NS", "SRV", "TXT"]);
const proxiableRecordTypes = new Set(["A", "AAAA", "CNAME"]);
const hostnameContentTypes = new Set(["CNAME", "MX", "NS"]);

export function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashObject(value) {
  return sha256(stableStringify(value));
}

export function normalizeHostname(value) {
  assertCondition(typeof value === "string" && value.trim(), "DNS hostname must be a non-empty string");
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export function absoluteRecordName(value, domain) {
  const normalizedDomain = normalizeHostname(domain);
  assertCondition(typeof value === "string" && value.trim(), "DNS record name must be a non-empty string");
  const raw = value.trim().toLowerCase().replace(/\.$/, "");
  const name = raw === "@" ? normalizedDomain : raw.endsWith(`.${normalizedDomain}`) || raw === normalizedDomain ? raw : `${raw}.${normalizedDomain}`;
  assertCondition(
    name === normalizedDomain || name.endsWith(`.${normalizedDomain}`),
    `DNS record ${value} is outside ${normalizedDomain}`,
  );
  return name;
}

function normalizeCaaContent(value) {
  const match = value.match(/^(\d+)\s+(issue|issuewild|iodef)\s+"?(.+?)"?$/i);
  assertCondition(match, `CAA content has an unsupported format: ${value}`);
  return `${Number(match[1])} ${match[2].toLowerCase()} "${match[3]}"`;
}

function normalizeSrvContent(value) {
  const match = value.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/);
  assertCondition(match, `SRV content has an unsupported format: ${value}`);
  return `${Number(match[1])} ${Number(match[2])} ${Number(match[3])} ${normalizeHostname(match[4])}`;
}

function normalizeContent(type, value) {
  assertCondition(typeof value === "string" && value.trim(), `${type} record content must be a non-empty string`);
  const content = value.trim();
  if (hostnameContentTypes.has(type)) return normalizeHostname(content);
  if (type === "CAA") return normalizeCaaContent(content);
  if (type === "SRV") return normalizeSrvContent(content);
  return content;
}

function normalizeTtl(value) {
  assertCondition(Number.isInteger(value), "DNS record TTL must be an integer");
  assertCondition(value === 1 || (value >= 60 && value <= 86400), "DNS record TTL must be 1 or between 60 and 86400");
  return value;
}

export function normalizeRecord(record, domain, options = {}) {
  assertCondition(record && typeof record === "object" && !Array.isArray(record), "DNS record must be an object");
  const type = String(record.type ?? "").toUpperCase();
  assertCondition(allowedRecordTypes.has(type), `Unsupported DNS record type ${type || "(missing)"}`);

  const normalized = {
    type,
    name: absoluteRecordName(record.name, domain),
    content: normalizeContent(type, record.content),
    ttl: normalizeTtl(record.ttl),
  };

  if (type === "MX") {
    assertCondition(Number.isInteger(record.priority) && record.priority >= 0 && record.priority <= 65535, "MX priority must be an integer between 0 and 65535");
    normalized.priority = record.priority;
  } else if (record.priority !== undefined) {
    assertCondition(type === "SRV", `${type} records must not define priority`);
  }

  if (proxiableRecordTypes.has(type)) {
    const proxied = options.forceDnsOnly ? false : record.proxied;
    assertCondition(typeof proxied === "boolean", `${type} record ${normalized.name} must define a boolean proxied state`);
    normalized.proxied = proxied;
  } else {
    assertCondition(record.proxied === undefined || record.proxied === false, `${type} records cannot be proxied`);
  }

  return normalized;
}

export function recordIdentityKey(record) {
  return [record.type, record.name, record.priority ?? "", record.content].join("|");
}

export function recordExactKey(record) {
  return [recordIdentityKey(record), record.ttl, record.proxied ?? ""].join("|");
}

export function sortRecords(records) {
  return [...records].sort((left, right) => recordExactKey(left).localeCompare(recordExactKey(right)));
}

function assertNoDuplicateRecords(records, label) {
  const identities = new Map();
  for (const record of records) {
    const identity = recordIdentityKey(record);
    assertCondition(!identities.has(identity), `${label} contains duplicate record ${identity}`);
    identities.set(identity, record);
  }
}

function assertCnameExclusivity(records, label) {
  const byName = new Map();
  for (const record of records) {
    const atName = byName.get(record.name) ?? [];
    atName.push(record);
    byName.set(record.name, atName);
  }

  for (const [name, atName] of byName) {
    if (atName.some(({ type }) => type === "CNAME")) {
      assertCondition(atName.length === 1, `${label} has a CNAME conflict at ${name}`);
    }
  }
}

function sameKeys(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

export function baselineRecordsFrom(baseline, contract) {
  assertCondition(baseline.domain === contract.domain, "DNS baseline domain does not match the zone contract");
  const ttl = contract.baselineTtls;
  const records = [
    ...baseline.apexA.map((content) => ({ type: "A", name: "@", content, ttl: ttl.apexA, proxied: false })),
    ...baseline.wwwCname.map((content) => ({ type: "CNAME", name: "www", content, ttl: ttl.wwwCname, proxied: false })),
    ...baseline.domainConnectCname.map((content) => ({
      type: "CNAME",
      name: "_domainconnect",
      content,
      ttl: ttl.domainConnectCname,
      proxied: false,
    })),
    ...baseline.mx.map(({ priority, exchange }) => ({ type: "MX", name: "@", content: exchange, priority, ttl: ttl.mx })),
  ].map((record) => normalizeRecord(record, contract.domain));

  assertCondition(records.length === 11, `Expected 11 positive public baseline records, received ${records.length}`);
  assertNoDuplicateRecords(records, "Public DNS baseline");
  return sortRecords(records);
}

export function validateMutationPolicy(contract) {
  const expected = {
    requireCompleteSourceExport: true,
    requirePublicDelegationUnchanged: true,
    scanRejects: 0,
    deletes: 0,
    patches: 0,
    puts: 0,
    postsOnly: true,
  };
  assertCondition(stableStringify(contract.mutationPolicy) === stableStringify(expected), "Cloudflare DNS mutation policy is not the strict accept-only and add-only contract");
}

export function validateSourceInventory(inventory, contract, baseline) {
  assertCondition(inventory?.schemaVersion === 1, "Squarespace DNS export schemaVersion must be 1");
  assertCondition(inventory.domain === contract.domain, "Squarespace DNS export domain does not match the zone contract");
  assertCondition(inventory.captureComplete === true, "Squarespace DNS export must set captureComplete to true after full account-side review");
  assertCondition(typeof inventory.capturedAt === "string" && Number.isFinite(Date.parse(inventory.capturedAt)), "Squarespace DNS export capturedAt must be an ISO timestamp");
  assertCondition(
    Date.parse(inventory.capturedAt) >= Date.parse(baseline.capturedAt),
    "Squarespace DNS export predates the public DNS baseline",
  );
  assertCondition(inventory.source?.provider === "Squarespace DNS settings", "Squarespace DNS export source.provider must identify the account DNS settings");
  assertCondition(/^[a-f0-9]{64}$/.test(inventory.source?.evidenceSha256 ?? ""), "Squarespace DNS export must include a lowercase SHA-256 of its source evidence");
  assertCondition(Array.isArray(inventory.records) && inventory.records.length > 0, "Squarespace DNS export must contain records");

  const records = inventory.records.map((record) => normalizeRecord(record, contract.domain, { forceDnsOnly: true }));
  assertNoDuplicateRecords(records, "Squarespace DNS export");
  assertCnameExclusivity(records, "Squarespace DNS export");
  assertCondition(
    !records.some((record) => record.type === "NS" && record.name === contract.domain),
    "Squarespace DNS export must not import apex NS records",
  );

  const baselineRecords = baselineRecordsFrom(baseline, contract);
  const inventoryIdentities = new Set(records.map(recordIdentityKey));
  for (const record of baselineRecords) {
    assertCondition(inventoryIdentities.has(recordIdentityKey(record)), `Squarespace DNS export is missing public baseline record ${recordIdentityKey(record)}`);
  }

  const expectedGoogleMx = new Set(
    baselineRecords.filter((record) => record.type === "MX" && record.name === contract.domain).map(recordIdentityKey),
  );
  const actualApexMx = new Set(
    records.filter((record) => record.type === "MX" && record.name === contract.domain).map(recordIdentityKey),
  );
  assertCondition(sameKeys(actualApexMx, expectedGoogleMx), "Squarespace DNS export must contain exactly the five Google Workspace apex MX records");

  return sortRecords(records);
}

export function buildDesiredRecords(sourceRecords, resendConfig, contract) {
  assertCondition(resendConfig?.schemaVersion === 1, "Resend DNS record schemaVersion must be 1");
  assertCondition(resendConfig.domain === contract.domain, "Resend DNS record domain does not match the zone contract");
  assertCondition(Array.isArray(resendConfig.records) && resendConfig.records.length === 3, "Resend DNS contract must contain exactly three records");

  const desired = new Map(sourceRecords.map((record) => [recordIdentityKey(record), record]));
  for (const record of resendConfig.records.map((entry) => normalizeRecord(entry, contract.domain, { forceDnsOnly: true }))) {
    const sameNodeAndType = sourceRecords.filter((entry) => entry.name === record.name && entry.type === record.type);
    if (sameNodeAndType.length > 0) {
      assertCondition(
        sameNodeAndType.some((entry) => recordIdentityKey(entry) === recordIdentityKey(record)),
        `Squarespace DNS export conflicts with required Resend record at ${record.name}`,
      );
    }

    const existing = desired.get(recordIdentityKey(record));
    if (existing) {
      assertCondition(recordExactKey(existing) === recordExactKey(record), `Resend record settings conflict at ${record.name}`);
    } else {
      desired.set(recordIdentityKey(record), record);
    }
  }

  const records = sortRecords([...desired.values()]);
  assertNoDuplicateRecords(records, "Desired Cloudflare DNS set");
  assertCnameExclusivity(records, "Desired Cloudflare DNS set");
  return records;
}

/**
 * `now` is injectable so the unit tests are deterministic. Reading the clock
 * directly meant the suite was always going to start failing on the contract's
 * pendingAutoRemovalRiskAfter date, which is exactly what happened.
 */
export function assertZoneState(zone, contract, { now = Date.now() } = {}) {
  assertCondition(zone?.id === contract.zoneId, "Cloudflare zone ID does not match the tracked contract");
  assertCondition(zone.name === contract.domain, "Cloudflare zone name does not match the tracked contract");
  assertCondition(zone.created_on === contract.createdOn, "Cloudflare zone creation timestamp does not match the tracked contract");
  const pendingRiskAfter = Date.parse(contract.pendingAutoRemovalRiskAfter);
  assertCondition(Number.isFinite(pendingRiskAfter), "Cloudflare pending-zone removal risk timestamp is invalid");
  assertCondition(
    now < pendingRiskAfter,
    `Cloudflare Free may have removed the unactivated pending zone after ${contract.pendingAutoRemovalRiskAfter}; refresh the zone contract before continuing`,
  );
  assertCondition(zone.status === contract.expectedZone.status, `Cloudflare zone must remain ${contract.expectedZone.status}`);
  assertCondition(zone.type === contract.expectedZone.type, `Cloudflare zone must use ${contract.expectedZone.type} setup`);
  assertCondition(zone.paused === contract.expectedZone.paused, "Cloudflare zone pause state changed");
  assertCondition(zone.plan?.legacy_id === contract.expectedZone.planLegacyId, "Cloudflare zone is not on the expected plan");
  assertCondition(zone.plan?.price === contract.expectedZone.planPrice, "Cloudflare zone plan price changed");

  const assigned = (zone.name_servers ?? []).map(normalizeHostname);
  const original = (zone.original_name_servers ?? []).map(normalizeHostname);
  assertCondition(sameKeys(assigned, contract.assignedNameServers.map(normalizeHostname)), "Cloudflare assigned nameservers changed");
  assertCondition(sameKeys(original, contract.originalNameServers.map(normalizeHostname)), "Cloudflare original nameservers changed");
}

export function assertPublicNameservers(publicNameservers, contract) {
  const actual = publicNameservers.map(normalizeHostname);
  const expected = contract.originalNameServers.map(normalizeHostname);
  assertCondition(sameKeys(actual, expected), "Public nameservers changed from the pre-cutover NS1 delegation");
}

function normalizeProviderRecords(records, contract, label) {
  assertCondition(Array.isArray(records), `${label} must be an array`);
  const normalized = records.map((record) => normalizeRecord(record, contract.domain));
  assertNoDuplicateRecords(normalized, label);
  assertCnameExclusivity(normalized, label);
  return sortRecords(normalized);
}

function assertStrictOperations(operations) {
  assertCondition(
    sameKeys(Object.keys(operations ?? {}), ["dnsBatch", "scanReview"]),
    "DNS plan must contain only scanReview and dnsBatch operations",
  );
  assertCondition(Array.isArray(operations.scanReview?.accepts), "DNS plan scanReview.accepts must be an array");
  assertCondition(Array.isArray(operations.scanReview?.rejects) && operations.scanReview.rejects.length === 0, "DNS plan may not reject scan candidates");
  assertCondition(Array.isArray(operations.dnsBatch?.posts), "DNS plan dnsBatch.posts must be an array");
  for (const key of ["deletes", "patches", "puts"]) {
    assertCondition(Array.isArray(operations.dnsBatch?.[key]) && operations.dnsBatch[key].length === 0, `DNS plan may not contain ${key}`);
  }
}

export function buildDnsPlan({
  contract,
  baseline,
  resendConfig,
  inventory,
  inventoryFileSha256,
  zone,
  publicNameservers,
  activeRecords,
  scanCandidates,
  now = Date.now(),
}) {
  validateMutationPolicy(contract);
  assertZoneState(zone, contract, { now });
  assertPublicNameservers(publicNameservers, contract);
  assertCondition(/^[a-f0-9]{64}$/.test(inventoryFileSha256), "Squarespace DNS export file SHA-256 is invalid");

  const sourceRecords = validateSourceInventory(inventory, contract, baseline);
  const desiredRecords = buildDesiredRecords(sourceRecords, resendConfig, contract);
  const baselineRecords = baselineRecordsFrom(baseline, contract);
  const active = normalizeProviderRecords(activeRecords, contract, "Active Cloudflare DNS records");
  const scanned = normalizeProviderRecords(scanCandidates, contract, "Cloudflare scan candidates");

  const desiredByIdentity = new Map(desiredRecords.map((record) => [recordIdentityKey(record), record]));
  const activeByIdentity = new Map(active.map((record) => [recordIdentityKey(record), record]));
  const scannedByIdentity = new Map(scanned.map((record) => [recordIdentityKey(record), record]));
  const baselineIdentities = new Set(baselineRecords.map(recordIdentityKey));

  for (const record of active) {
    const desired = desiredByIdentity.get(recordIdentityKey(record));
    assertCondition(desired, `Cloudflare contains unexpected active record ${recordIdentityKey(record)}`);
    assertCondition(recordExactKey(record) === recordExactKey(desired), `Cloudflare active record settings drifted for ${recordIdentityKey(record)}`);
  }

  for (const record of scanned) {
    const identity = recordIdentityKey(record);
    assertCondition(baselineIdentities.has(identity), `Cloudflare scan contains unreviewed record ${identity}`);
    assertCondition(!activeByIdentity.has(identity), `Cloudflare record ${identity} is both active and pending scan review`);
  }

  for (const record of baselineRecords) {
    const identity = recordIdentityKey(record);
    assertCondition(
      activeByIdentity.has(identity) || scannedByIdentity.has(identity),
      `Cloudflare is missing baseline record ${identity} from both active records and scan review`,
    );
  }

  const scanAccepts = scanned.map((record) => desiredByIdentity.get(recordIdentityKey(record)));
  const scanIdentities = new Set(scanAccepts.map(recordIdentityKey));
  const posts = desiredRecords.filter((record) => !activeByIdentity.has(recordIdentityKey(record)) && !scanIdentities.has(recordIdentityKey(record)));

  const operations = {
    scanReview: {
      accepts: sortRecords(scanAccepts),
      rejects: [],
    },
    dnsBatch: {
      deletes: [],
      patches: [],
      puts: [],
      posts: sortRecords(posts),
    },
  };
  assertStrictOperations(operations);

  return {
    schemaVersion: 1,
    domain: contract.domain,
    zoneId: contract.zoneId,
    state: {
      zoneStatus: zone.status,
      plan: zone.plan.legacy_id,
      assignedNameServers: [...contract.assignedNameServers].sort(),
      publicNameServers: [...publicNameservers].map(normalizeHostname).sort(),
    },
    inputs: {
      contractSha256: hashObject(contract),
      baselineSha256: hashObject(baseline),
      resendRecordsSha256: hashObject(resendConfig),
      squarespaceExportFileSha256: inventoryFileSha256,
      squarespaceExportEvidenceSha256: inventory.source.evidenceSha256,
    },
    summary: {
      sourceRecordCount: sourceRecords.length,
      desiredRecordCount: desiredRecords.length,
      activeRecordCount: active.length,
      scanAcceptCount: scanAccepts.length,
      postCount: posts.length,
      scanRejectCount: 0,
      deleteCount: 0,
      patchCount: 0,
      putCount: 0,
    },
    desiredRecords,
    operations,
  };
}

export function createPlanDocument(core, generatedAt = new Date().toISOString()) {
  assertStrictOperations(core.operations);
  return {
    generatedAt,
    planSha256: hashObject(core),
    ...core,
  };
}

export function verifyPlanDocument(document) {
  assertCondition(document && typeof document === "object" && !Array.isArray(document), "DNS plan must be a JSON object");
  const { generatedAt, planSha256, ...core } = document;
  assertCondition(typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)), "DNS plan generatedAt is invalid");
  assertCondition(/^[a-f0-9]{64}$/.test(planSha256 ?? ""), "DNS plan SHA-256 is invalid");
  assertCondition(hashObject(core) === planSha256, "DNS plan content does not match its SHA-256 approval value");
  assertStrictOperations(core.operations);
  return { core, planSha256 };
}

export function parseApplyArguments(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    assertCondition(value, "dns:apply requires a value after every option");
    if (key === "--plan") parsed.planPath = value;
    else if (key === "--approve-sha256") parsed.approvedSha256 = value;
    else throw new Error(`Unsupported dns:apply option ${key}`);
  }
  assertCondition(args.length === 4, "Usage: npm run dns:apply -- --plan private/dns/cloudflare-dns-plan.json --approve-sha256 <64-character hash>");
  assertCondition(parsed.planPath, "dns:apply requires --plan");
  assertCondition(/^[a-f0-9]{64}$/.test(parsed.approvedSha256 ?? ""), "dns:apply requires an exact lowercase 64-character --approve-sha256 value");
  return parsed;
}

export function assertPlanMatchesLive(savedCore, liveCore, approvedSha256) {
  const savedHash = hashObject(savedCore);
  assertCondition(savedHash === approvedSha256, "Approved SHA-256 does not match the saved DNS plan");
  assertCondition(hashObject(liveCore) === approvedSha256, "Live DNS state drifted after the approved plan was generated");
  assertStrictOperations(liveCore.operations);
}

export async function readJsonFile(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function resolveProjectPath(path) {
  return resolve(projectRoot, path);
}

export async function assertPrivateDnsPath(path, options = {}) {
  const privateRoot = resolve(projectRoot, "private/dns");
  const resolved = resolve(projectRoot, path);
  assertCondition(relative(privateRoot, resolved) && !relative(privateRoot, resolved).startsWith(".."), "DNS export and plan files must live below private/dns");
  if (options.mustExist) {
    let actual;
    try {
      actual = await realpath(resolved);
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw new Error(options.missingMessage ?? `Required private DNS file is missing at ${relative(projectRoot, resolved)}`);
      }
      throw error;
    }
    const actualPrivateRoot = await realpath(dirname(actual));
    assertCondition(
      actual === resolve(actualPrivateRoot, relative(actualPrivateRoot, actual)) && !relative(privateRoot, actual).startsWith(".."),
      "Private DNS file resolves outside private/dns",
    );
  }
  return resolved;
}

export async function loadContractInputs(options = {}) {
  const contract = await readJsonFile(resolveProjectPath("config/cloudflare-zone-contract.json"));
  const baseline = await readJsonFile(resolveProjectPath(contract.baselinePath));
  const resendConfig = await readJsonFile(resolveProjectPath(contract.resendRecordsPath));
  const inventoryPath = await assertPrivateDnsPath(options.inventoryPath ?? contract.privateExportPath, {
    mustExist: true,
    missingMessage: `Complete Squarespace DNS export is required at ${contract.privateExportPath}. Finish email 2FA and follow docs/dns-staging-automation.md before planning or applying DNS changes.`,
  });
  const inventorySource = await readFile(inventoryPath, "utf8");
  const inventory = JSON.parse(inventorySource);
  validateSourceInventory(inventory, contract, baseline);
  return {
    contract,
    baseline,
    resendConfig,
    inventory,
    inventoryPath,
    inventoryFileSha256: sha256(inventorySource),
  };
}

export function readDnsApiToken() {
  const token = process.env.CLOUDFLARE_DNS_API_TOKEN;
  assertCondition(token, "CLOUDFLARE_DNS_API_TOKEN is required through .env.cloudflare-dns");
  assertCondition(!process.env.CLOUDFLARE_API_TOKEN, "The Worker deployment token must not be used for DNS staging");
  assertCondition(!process.env.CLOUDFLARE_API_KEY, "The shared Cloudflare global key must not be used for DNS staging");
  assertCondition(!process.env.CLOUDFLARE_EMAIL, "Cloudflare email and global-key authentication must not be used for DNS staging");
  return token;
}

function allowedCloudflareRequest(method, path, zoneId, allowMutations) {
  const encodedZone = encodeURIComponent(zoneId);
  const readPaths = new Set([
    `/zones/${encodedZone}`,
    `/zones/${encodedZone}/dns_records?per_page=5000`,
    `/zones/${encodedZone}/dns_records/scan/review`,
  ]);
  if (method === "GET" && readPaths.has(path)) return true;
  if (!allowMutations || method !== "POST") return false;
  return path === `/zones/${encodedZone}/dns_records/scan/review` || path === `/zones/${encodedZone}/dns_records/batch`;
}

export async function cloudflareRequest({ token, zoneId, method = "GET", path, body, allowMutations = false }) {
  assertCondition(allowedCloudflareRequest(method, path, zoneId, allowMutations), `Cloudflare request is outside the DNS staging allowlist: ${method} ${path}`);
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  const errors = Array.isArray(payload.errors) ? payload.errors.map(({ code, message }) => `${code}: ${message}`).join("; ") : "";
  assertCondition(response.ok && payload.success, `Cloudflare DNS request failed with ${response.status}${errors ? ` (${errors})` : ""}`);
  return payload;
}

export async function fetchCloudflareDnsState(token, contract) {
  const encodedZone = encodeURIComponent(contract.zoneId);
  const [zonePayload, recordsPayload, scanPayload] = await Promise.all([
    cloudflareRequest({ token, zoneId: contract.zoneId, path: `/zones/${encodedZone}` }),
    cloudflareRequest({ token, zoneId: contract.zoneId, path: `/zones/${encodedZone}/dns_records?per_page=5000` }),
    cloudflareRequest({ token, zoneId: contract.zoneId, path: `/zones/${encodedZone}/dns_records/scan/review` }),
  ]);
  assertCondition((recordsPayload.result_info?.total_pages ?? 1) <= 1, "Cloudflare DNS record list unexpectedly requires pagination");
  return {
    zone: zonePayload.result,
    activeRecords: recordsPayload.result,
    scanCandidates: scanPayload.result,
  };
}

export function normalizeResolvedRecords(type, name, values, domain) {
  if (type === "A" || type === "AAAA" || type === "CNAME" || type === "NS") {
    return values.map((content) => normalizeRecord({ type, name, content, ttl: 1, ...(proxiableRecordTypes.has(type) ? { proxied: false } : {}) }, domain));
  }
  if (type === "MX") {
    return values.map(({ exchange, priority }) => normalizeRecord({ type, name, content: exchange, priority, ttl: 1 }, domain));
  }
  if (type === "TXT") {
    return values.map((chunks) => normalizeRecord({ type, name, content: chunks.join(""), ttl: 1 }, domain));
  }
  if (type === "CAA") {
    return values.map((value) => {
      const tag = ["issue", "issuewild", "iodef"].find((key) => value[key] !== undefined);
      assertCondition(tag, `Authoritative CAA response for ${name} has no supported tag`);
      return normalizeRecord({ type, name, content: `${value.critical ?? 0} ${tag} "${value[tag]}"`, ttl: 1 }, domain);
    });
  }
  if (type === "SRV") {
    return values.map(({ name: target, port, priority, weight }) =>
      normalizeRecord({ type, name, content: `${priority} ${weight} ${port} ${target}`, ttl: 1 }, domain),
    );
  }
  throw new Error(`Direct authoritative verification does not support ${type}`);
}

export async function verifyAssignedNameserverRecords(contract, desiredRecords) {
  const groups = new Map();
  for (const record of desiredRecords) {
    const key = `${record.type}|${record.name}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  for (const nameserver of contract.assignedNameServers) {
    const addresses = await resolve4(nameserver);
    assertCondition(addresses.length > 0, `Assigned nameserver ${nameserver} has no IPv4 address`);
    const resolver = new Resolver();
    resolver.setServers([addresses[0]]);

    for (const [key, expected] of groups) {
      const [type, name] = key.split("|");
      const values = await resolver.resolve(name, type);
      const actual = normalizeResolvedRecords(type, name, values, contract.domain);
      const actualIdentities = new Set(actual.map(recordIdentityKey));
      const expectedIdentities = new Set(expected.map(recordIdentityKey));
      assertCondition(
        sameKeys(actualIdentities, expectedIdentities),
        `${nameserver} does not serve the expected ${type} records at ${name}`,
      );
    }
  }
}
