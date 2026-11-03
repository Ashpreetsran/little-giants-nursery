import { readFile } from "node:fs/promises";
import { account, mutate, search } from "./lib/client.mjs";
import { canonicalOrigin } from "../lib/hostnames.mjs";

/**
 * Points every ad and sitelink at the URL it should actually land on.
 *
 * Two things make this necessary:
 *  - the Uxbridge pages moved under /nurseries/uxbridge, so ads that still name
 *    the old paths would send every click through a redirect;
 *  - the Woodley ads were created before their pages existed, so they were
 *    parked on the site root.
 *
 * An ad whose destination is broken is disapproved for DESTINATION_NOT_WORKING,
 * so nothing is written unless the intended URL returns 200. Run this straight
 * after the production deploy.
 *
 *   node scripts/google-ads/sync-final-urls.mjs --dry-run
 *   node scripts/google-ads/sync-final-urls.mjs
 */
const dryRun = process.argv.includes("--dry-run");
const customer = `customers/${account.customerId}`;
const woodley = JSON.parse(
  await readFile(new URL("../../config/google-ads/woodley-campaign.json", import.meta.url), "utf8"),
).campaign;

const intendedByAdGroup = new Map(
  woodley.adGroups.map((group) => [group.name, new URL(group.finalUrl, canonicalOrigin).toString()]),
);

const statusCache = new Map();
async function finalDestination(url) {
  if (statusCache.has(url)) return statusCache.get(url);
  let current = url;
  let result = { url: current, status: 0 };
  for (let hop = 0; hop < 5; hop += 1) {
    const response = await fetch(current, { redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;
      current = new URL(location, current).toString();
      continue;
    }
    result = { url: current, status: response.status };
    break;
  }
  statusCache.set(url, result);
  return result;
}

const operations = [];
const changes = [];

const ads = await search(`
  SELECT campaign.id, campaign.name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'`);

for (const row of ads) {
  const current = row.adGroupAd.ad.finalUrls?.[0];
  if (!current) continue;

  // Woodley ads take their intended page from the definition. Everything else
  // simply follows whatever its current URL now redirects to.
  const intended = row.campaign.id === account.campaigns.woodley.id
    ? intendedByAdGroup.get(row.adGroup.name) ?? current
    : (await finalDestination(current)).url;

  if (intended === current) continue;

  const check = await finalDestination(intended);
  if (check.status !== 200) {
    console.warn(`  skipped ${row.campaign.name} / ${row.adGroup.name}: ${intended} returns ${check.status}`);
    continue;
  }

  changes.push(`ad  ${row.campaign.name} / ${row.adGroup.name}\n      ${current}\n   -> ${intended}`);
  operations.push({
    adGroupAdOperation: {
      update: { resourceName: `${customer}/adGroupAds/${row.adGroupAd.ad.id}`, ad: { finalUrls: [intended] } },
      updateMask: "ad.final_urls",
      // Clears a disapproval left over from the period when the page 404ed.
      policyValidationParameter: { ignorablePolicyTopics: ["DESTINATION_NOT_WORKING"] },
    },
  });
}

const assets = await search(`
  SELECT asset.id, asset.name, asset.final_urls, asset.sitelink_asset.link_text
  FROM asset WHERE asset.type = 'SITELINK'`);

for (const row of assets) {
  const current = row.asset.finalUrls?.[0];
  if (!current) continue;
  const intended = (await finalDestination(current)).url;
  if (intended === current) continue;

  const check = await finalDestination(intended);
  if (check.status !== 200) {
    console.warn(`  skipped sitelink ${row.asset.sitelinkAsset?.linkText}: ${intended} returns ${check.status}`);
    continue;
  }

  changes.push(`sitelink  ${row.asset.sitelinkAsset?.linkText}\n      ${current}\n   -> ${intended}`);
  operations.push({
    // AssetOperation has no policyValidationParameter, so a sitelink that is
    // already disapproved on a stale verdict has to be recreated by hand.
    assetOperation: {
      update: { resourceName: `${customer}/assets/${row.asset.id}`, finalUrls: [intended] },
      updateMask: "final_urls",
    },
  });
}

for (const change of changes) console.log(change);

if (operations.length === 0) {
  console.log("Every ad and sitelink already points at its final URL.");
} else if (dryRun) {
  console.log(`\n${operations.length} updates validated. Nothing was written.`);
  await mutate(operations, { validateOnly: true });
} else {
  await mutate(operations, { validateOnly: false });
  console.log(`\nUpdated ${operations.length} final URLs.`);
}
