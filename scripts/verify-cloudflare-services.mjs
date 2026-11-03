import { apexHostname, canonicalHostname, stagingHostname } from "./lib/hostnames.mjs";

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const services = ["little-giants-nursery", "little-giants-nursery-preview"];
const expectedBindings = {
  ASSETS: "assets",
  IMAGES: "images",
  NEXT_PUBLIC_GTM_ID: "plain_text",
  NEXT_PUBLIC_SITE_URL: "plain_text",
};
const expectedCompatibilityFlags = ["global_fetch_strictly_public", "nodejs_compat"];
const expectedCustomDomains = {
  "little-giants-nursery": [apexHostname, canonicalHostname],
  "little-giants-nursery-preview": [stagingHostname],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(apiToken, "CLOUDFLARE_API_TOKEN is required. Run through the committed .env.cloudflare template.");
assert(accountId, "CLOUDFLARE_ACCOUNT_ID is required. Run through the committed .env.cloudflare template.");
assert(!process.env.CLOUDFLARE_API_KEY, "The shared global Cloudflare key must not be used for this verifier.");

async function cloudflare(path) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const body = await response.json();
  assert(response.ok && body.success, `${path}: Cloudflare API request failed with ${response.status}`);
  return body.result;
}

for (const service of services) {
  const encodedService = encodeURIComponent(service);
  const [deploymentResult, secrets, settings, subdomain] = await Promise.all([
    cloudflare(`/workers/scripts/${encodedService}/deployments`),
    cloudflare(`/workers/scripts/${encodedService}/secrets`),
    cloudflare(`/workers/scripts/${encodedService}/settings`),
    cloudflare(`/workers/scripts/${encodedService}/subdomain`),
  ]);

  const latest = deploymentResult.deployments?.[0];
  assert(latest, `${service}: no deployment exists`);
  assert(latest.versions?.length === 1, `${service}: latest deployment does not have one active version`);
  assert(latest.versions[0].percentage === 100, `${service}: latest version is not at 100 percent`);
  assert(Array.isArray(secrets), `${service}: Cloudflare returned an unexpected secrets response`);
  assert(
    !secrets.some((secret) => secret.name === "RESEND_API_KEY"),
    `${service}: the retired RESEND_API_KEY secret is still present`,
  );

  const bindings = Object.fromEntries((settings.bindings ?? []).map(({ name, type }) => [name, type]));
  assert(
    JSON.stringify(Object.keys(bindings).sort()) === JSON.stringify(Object.keys(expectedBindings).sort()),
    `${service}: deployed binding names do not match the expected contract`,
  );
  for (const [name, type] of Object.entries(expectedBindings)) {
    assert(bindings[name] === type, `${service}: deployed binding ${name} has an unexpected type`);
  }
  assert(settings.compatibility_date === "2026-07-12", `${service}: compatibility date does not match Wrangler`);
  assert(
    JSON.stringify([...(settings.compatibility_flags ?? [])].sort()) === JSON.stringify(expectedCompatibilityFlags),
    `${service}: compatibility flags do not match Wrangler`,
  );
  assert(settings.usage_model === "standard", `${service}: usage model is not standard`);

  const isPreview = service.endsWith("-preview");
  assert(subdomain.enabled === isPreview, `${service}: workers.dev availability does not match the environment contract`);
  assert(subdomain.previews_enabled === isPreview, `${service}: version preview URLs do not match the environment contract`);

  const logs = settings.observability?.logs;
  assert(settings.observability?.enabled === true, `${service}: observability is disabled`);
  assert(logs?.enabled === true, `${service}: Worker logs are disabled`);
  assert(logs?.persist === true, `${service}: Worker logs are not persisted`);
  assert(logs?.invocation_logs === true, `${service}: invocation logs are disabled`);
  assert(logs?.head_sampling_rate === 1, `${service}: Worker logs are sampled below 100 percent`);

  console.log(
    `${service}: version ${latest.versions[0].version_id} is at 100 percent with the expected runtime, bindings, route isolation, and persistent full-sampling logs`,
  );
}

const workerDomains = await cloudflare("/workers/domains");
for (const [service, hostnames] of Object.entries(expectedCustomDomains)) {
  const attached = workerDomains
    .filter((domain) => domain.service === service)
    .map((domain) => domain.hostname)
    .sort();
  assert(
    JSON.stringify(attached) === JSON.stringify([...hostnames].sort()),
    `${service}: attached custom domains ${JSON.stringify(attached)} do not match the expected contract ${JSON.stringify([...hostnames].sort())}`,
  );
  for (const domain of workerDomains.filter((entry) => entry.service === service)) {
    assert(domain.enabled === true, `${service}: custom domain ${domain.hostname} is not enabled`);
    assert(domain.previews_enabled === false, `${service}: custom domain ${domain.hostname} exposes version preview URLs`);
  }
  console.log(`${service}: serves exactly ${attached.join(", ")}`);
}

console.log("Cloudflare service contract passed");
