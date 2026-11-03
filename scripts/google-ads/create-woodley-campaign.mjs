import { readFile } from "node:fs/promises";
import { account, mutate, search } from "./lib/client.mjs";
import { canonicalOrigin } from "../lib/hostnames.mjs";

/**
 * Creates the Woodley search campaign from config/google-ads/woodley-campaign.json.
 *
 * The campaign is created PAUSED and nothing here can un-pause it, so the only
 * spend risk is the one the operator takes later in the UI.
 *
 * Landing pages: an ad whose final URL 404s is disapproved for
 * DESTINATION_NOT_WORKING, so every target URL is checked first. Any that is not
 * yet live falls back to the site root, which always resolves, and
 * sync-final-urls.mjs moves them onto the real pages once those are deployed.
 *
 *   node scripts/google-ads/create-woodley-campaign.mjs --dry-run
 *   node scripts/google-ads/create-woodley-campaign.mjs
 */
const dryRun = process.argv.includes("--dry-run");
const definition = JSON.parse(
  await readFile(new URL("../../config/google-ads/woodley-campaign.json", import.meta.url), "utf8"),
).campaign;

const customer = `customers/${account.customerId}`;

const existing = await search(
  `SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.name = '${definition.name}'`,
);
if (existing.length > 0) {
  const found = existing[0].campaign;
  throw new Error(
    `Campaign "${definition.name}" already exists as ${found.id} (${found.status}). ` +
    "Delete or rename it before recreating, or edit it with the Ads API directly.",
  );
}

async function resolvesToPage(path) {
  try {
    const response = await fetch(new URL(path, canonicalOrigin), { redirect: "manual" });
    return response.status === 200;
  } catch {
    return false;
  }
}

const landingPages = new Map();
for (const path of new Set(definition.adGroups.map((group) => group.finalUrl))) {
  const live = await resolvesToPage(path);
  landingPages.set(path, live ? new URL(path, canonicalOrigin).toString() : canonicalOrigin);
  if (!live) console.warn(`  not live yet, using the site root for now: ${path}`);
}

// Temporary ids are negative and are referenced by later operations in the same mutate.
let nextTempId = -1;
const temp = () => nextTempId--;

const budgetId = temp();
const campaignId = temp();
const operations = [
  {
    campaignBudgetOperation: {
      create: {
        resourceName: `${customer}/campaignBudgets/${budgetId}`,
        name: definition.budget.name,
        amountMicros: definition.budget.amountMicros,
        deliveryMethod: definition.budget.deliveryMethod,
        explicitlyShared: definition.budget.explicitlyShared,
      },
    },
  },
  {
    campaignOperation: {
      create: {
        resourceName: `${customer}/campaigns/${campaignId}`,
        name: definition.name,
        status: definition.status,
        advertisingChannelType: definition.advertisingChannelType,
        campaignBudget: `${customer}/campaignBudgets/${budgetId}`,
        targetSpend: {},
        networkSettings: definition.networkSettings,
        geoTargetTypeSetting: definition.geoTargetTypeSetting,
        containsEuPoliticalAdvertising: definition.containsEuPoliticalAdvertising,
      },
    },
  },
];

const campaignResource = `${customer}/campaigns/${campaignId}`;

for (const location of definition.locations) {
  operations.push({
    campaignCriterionOperation: {
      create: { campaign: campaignResource, location: { geoTargetConstant: `geoTargetConstants/${location.criterionId}` } },
    },
  });
}

for (const language of definition.languages) {
  operations.push({
    campaignCriterionOperation: {
      create: { campaign: campaignResource, language: { languageConstant: `languageConstants/${language.criterionId}` } },
    },
  });
}

for (const negative of definition.negativeKeywords) {
  operations.push({
    campaignCriterionOperation: {
      create: {
        campaign: campaignResource,
        negative: true,
        keyword: { text: negative.text, matchType: negative.matchType },
      },
    },
  });
}

for (const group of definition.adGroups) {
  const adGroupId = temp();
  const adGroupResource = `${customer}/adGroups/${adGroupId}`;
  operations.push({
    adGroupOperation: {
      create: {
        resourceName: adGroupResource,
        campaign: campaignResource,
        name: group.name,
        status: group.status,
        type: "SEARCH_STANDARD",
      },
    },
  });

  for (const keyword of group.keywords) {
    const exemptions = (definition.exemptKeywordPolicyViolations ?? [])
      .filter((violation) => violation.violatingText === keyword.text)
      .map((violation) => ({ policyName: violation.policyName, violatingText: violation.violatingText }));

    operations.push({
      adGroupCriterionOperation: {
        create: {
          adGroup: adGroupResource,
          status: "ENABLED",
          keyword: { text: keyword.text, matchType: keyword.matchType },
        },
        // AdGroupCriterionOperation takes the keys directly; only
        // AdGroupAdOperation wraps them in a policyValidationParameter.
        ...(exemptions.length > 0 ? { exemptPolicyViolationKeys: exemptions } : {}),
      },
    });
  }

  // The keyword-matched headline goes first so it is always eligible to show.
  const headlines = [group.headline, ...definition.sharedHeadlines].slice(0, 15);
  operations.push({
    adGroupAdOperation: {
      create: {
        adGroup: adGroupResource,
        status: "ENABLED",
        ad: {
          finalUrls: [landingPages.get(group.finalUrl)],
          responsiveSearchAd: {
            headlines: headlines.map((text) => ({ text })),
            descriptions: definition.descriptions.map((text) => ({ text })),
            path1: "nurseries",
            path2: "woodley",
          },
        },
      },
    },
  });
}

console.log(
  `${dryRun ? "Validating" : "Creating"} "${definition.name}": ${definition.status}, ` +
  `£${(Number(definition.budget.amountMicros) / 1e6).toFixed(2)}/day, ` +
  `${definition.adGroups.length} ad groups, ` +
  `${definition.adGroups.reduce((total, group) => total + group.keywords.length, 0)} keywords, ` +
  `${definition.negativeKeywords.length} negatives, ${operations.length} operations`,
);

const response = await mutate(operations, { validateOnly: dryRun });

if (dryRun) {
  console.log("Validation passed. Nothing was created.");
} else {
  const created = response.mutateOperationResponses?.find((entry) => entry.campaignResult)?.campaignResult?.resourceName;
  console.log(`Created ${created}`);
  console.log("The campaign is PAUSED. Record its id in config/google-ads/account.json.");
}
