import legacyUrlMigration from "../src/content/legacy-url-migration.json" with { type: "json" };

const hostname = "www.littlegiantsnursery.org";
const listName = "little_giants_legacy_redirects";
const listDescription = "Legacy Squarespace URL redirects, synced from src/content/legacy-url-migration.json";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_REDIRECTS_API_TOKEN;
if (!accountId || !apiToken) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_REDIRECTS_API_TOKEN must be set. Run via: op run --env-file=.env.cloudflare -- npm run sync:cloudflare-redirects");
}

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(method, path, body) {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    if (payload.success) return payload.result;

    const rateLimited = response.status === 429 || payload.errors?.some(({ code }) => code === 10040);
    if (rateLimited && attempt < 8) {
      await sleep(5000 * (attempt + 1));
      continue;
    }
    throw new Error(`${method} ${path} failed: ${JSON.stringify(payload.errors)}`);
  }
}

const desiredRedirects = legacyUrlMigration.redirects.map(({ source, destination, statusCode }) => ({
  source_url: `${hostname}${source}`,
  target_url: `https://${hostname}${destination}`,
  status_code: statusCode,
  preserve_query_string: true,
  include_subdomains: false,
  subpath_matching: false,
  preserve_path_suffix: false,
}));

const redirectKey = (r) => JSON.stringify([
  r.source_url,
  r.target_url,
  r.status_code,
  r.preserve_query_string === true,
  r.include_subdomains === true,
  r.subpath_matching === true,
  r.preserve_path_suffix === true,
]);

// 1. Ensure the bulk redirect list exists.
const lists = await api("GET", "/rules/lists");
let list = lists.find(({ name }) => name === listName);
if (!list) {
  list = await api("POST", "/rules/lists", { name: listName, kind: "redirect", description: listDescription });
  console.log(`Created bulk redirect list ${listName}`);
}

// 2. Replace the list items whenever they differ from the JSON contract.
const currentItems = await api("GET", `/rules/lists/${list.id}/items`);
const currentKeys = new Set(currentItems.map(({ redirect }) => redirectKey(redirect)));
const desiredKeys = new Set(desiredRedirects.map(redirectKey));
const inSync = currentKeys.size === desiredKeys.size && [...desiredKeys].every((key) => currentKeys.has(key));

if (inSync) {
  console.log(`List ${listName} already matches all ${desiredRedirects.length} contract redirects`);
} else {
  const { operation_id: operationId } = await api("PUT", `/rules/lists/${list.id}/items`, desiredRedirects.map((redirect) => ({ redirect })));
  for (let attempt = 0; ; attempt += 1) {
    const operation = await api("GET", `/rules/lists/bulk_operations/${operationId}`);
    if (operation.status === "completed") break;
    if (operation.status === "failed") throw new Error(`List replacement failed: ${operation.error}`);
    if (attempt >= 36) throw new Error(`Timed out waiting for the list replacement to complete (last status: ${operation.status})`);
    await sleep(5000);
  }
  console.log(`Replaced list ${listName} items with all ${desiredRedirects.length} contract redirects`);
}

// 3. Ensure an enabled Bulk Redirect Rule references the list. Importing a list alone is inert.
const ruleExpression = `http.request.full_uri in $${listName}`;
const desiredRule = {
  expression: ruleExpression,
  description: `Apply ${listName}`,
  action: "redirect",
  action_parameters: { from_list: { name: listName, key: "http.request.full_uri" } },
  enabled: true,
};

let entrypoint = null;
try {
  entrypoint = await api("GET", "/rulesets/phases/http_request_redirect/entrypoint");
} catch {
  // No entrypoint ruleset exists yet; the PUT below creates it.
}

const existingRules = entrypoint?.rules ?? [];
const matchingRule = existingRules.find((rule) => rule.expression === ruleExpression);

if (matchingRule?.enabled) {
  console.log("Bulk redirect rule already enabled");
} else {
  const rules = matchingRule
    ? existingRules.map((rule) => (rule.expression === ruleExpression ? { ...rule, enabled: true } : rule))
    : [...existingRules, desiredRule];
  await api("PUT", "/rulesets/phases/http_request_redirect/entrypoint", { rules });
  console.log(matchingRule ? "Enabled the existing bulk redirect rule" : "Created and enabled the bulk redirect rule");
}

console.log(`Cloudflare bulk redirects are in sync with all ${desiredRedirects.length} legacy redirects`);
