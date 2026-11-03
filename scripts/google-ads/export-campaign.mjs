import { writeFile } from "node:fs/promises";
import { account, search } from "./lib/client.mjs";

/**
 * Snapshots a campaign to JSON so its structure can be diffed and copied.
 * config/google-ads/uxbridge-campaign-export.json is the output of this script
 * and is the reference the Woodley definition was built from.
 *
 *   node scripts/google-ads/export-campaign.mjs uxbridge
 *   node scripts/google-ads/export-campaign.mjs woodley
 */
const key = process.argv[2] ?? "uxbridge";
const campaign = account.campaigns[key];
if (!campaign?.id) {
  throw new Error(`Unknown campaign "${key}". Known: ${Object.keys(account.campaigns).join(", ")}`);
}

const id = campaign.id;
const out = {};

out.campaign = (await search(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
         campaign.bidding_strategy_type,
         campaign.network_settings.target_google_search, campaign.network_settings.target_search_network,
         campaign.network_settings.target_content_network, campaign.network_settings.target_partner_search_network,
         campaign.geo_target_type_setting.positive_geo_target_type,
         campaign.geo_target_type_setting.negative_geo_target_type,
         campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros,
         campaign_budget.delivery_method, campaign_budget.explicitly_shared
  FROM campaign WHERE campaign.id = ${id}`))[0];

out.geoTargets = await search(`
  SELECT campaign_criterion.criterion_id, campaign_criterion.type, campaign_criterion.negative,
         campaign_criterion.location.geo_target_constant,
         campaign_criterion.proximity.radius, campaign_criterion.proximity.radius_units,
         campaign_criterion.proximity.address.street_address,
         campaign_criterion.language.language_constant
  FROM campaign_criterion
  WHERE campaign.id = ${id} AND campaign_criterion.type IN (LOCATION, PROXIMITY, LANGUAGE)`);

out.campaignNegatives = await search(`
  SELECT campaign_criterion.criterion_id, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
  FROM campaign_criterion
  WHERE campaign.id = ${id} AND campaign_criterion.type = KEYWORD AND campaign_criterion.negative = TRUE`);

out.adGroups = await search(`
  SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, ad_group.cpc_bid_micros
  FROM ad_group WHERE campaign.id = ${id} ORDER BY ad_group.name`);

out.keywords = await search(`
  SELECT ad_group.id, ad_group.name, ad_group_criterion.criterion_id, ad_group_criterion.status,
         ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
         ad_group_criterion.negative, ad_group_criterion.final_urls
  FROM ad_group_criterion
  WHERE campaign.id = ${id} AND ad_group_criterion.type = KEYWORD`);

out.ads = await search(`
  SELECT ad_group.id, ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status,
         ad_group_ad.ad.final_urls, ad_group_ad.ad.type,
         ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.responsive_search_ad.descriptions,
         ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2
  FROM ad_group_ad WHERE campaign.id = ${id}`);

out.campaignAssets = await search(`
  SELECT campaign.id, campaign_asset.asset, campaign_asset.field_type, campaign_asset.status,
         asset.id, asset.type, asset.name,
         asset.sitelink_asset.link_text, asset.sitelink_asset.description1, asset.sitelink_asset.description2,
         asset.final_urls,
         asset.callout_asset.callout_text,
         asset.structured_snippet_asset.header, asset.structured_snippet_asset.values,
         asset.call_asset.phone_number, asset.call_asset.country_code
  FROM campaign_asset WHERE campaign.id = ${id}`);

out.conversionActions = await search(`
  SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.type,
         conversion_action.category, conversion_action.primary_for_goal, conversion_action.counting_type
  FROM conversion_action`);

const target = new URL(`../../config/google-ads/${key}-campaign-export.json`, import.meta.url);
await writeFile(target, `${JSON.stringify(out, null, 2)}\n`);
for (const [section, value] of Object.entries(out)) {
  console.log(`${section}: ${Array.isArray(value) ? value.length : 1}`);
}
console.log(`Wrote ${target.pathname.split("/").slice(-3).join("/")}`);
