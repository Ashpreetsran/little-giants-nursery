# Deployment and launch checklist

## Current target

OpenNext deploys the Next.js application to Cloudflare Workers with Workers Static Assets. All 15 marketing routes are pre-rendered at build time. The explicit 410 response for the retired cart uses a route handler. The site hosts no contact form or contact API route: enquiries go through the EyLog enquiry URL and direct mailto and tel links on `/contact`.

The noindex review Worker is live at `https://little-giants-nursery-preview.bold-bonus-58f7.workers.dev`. Version `6c83748b-e360-4ac6-9e63-5c12663be5e4` is deployed at 100 percent. It uses the separate preview Worker, preview rate-limit namespace, Cloudflare Images, Workers Cache, pre-generated page caches, raw-query-safe legacy redirects, structured delivery-failure logs, layered preview indexing protection, and the Resend secret.

The indexable production artifact is deployed as version `2285e059-5ac0-44cf-b115-350eb13aee8d` on the separate `little-giants-nursery` Worker. Its workers.dev URL is disabled and it has no route, so it cannot be crawled until the custom domains are attached after DNS onboarding. Both current services were deployed with the dedicated scoped client token, not the shared global Cloudflare key.

Before either Worker is uploaded, the build guard checks all 18 pre-rendered pages in both the Next.js output and OpenNext cache for the intended robots mode, exact canonical URL, Open Graph URL, Open Graph image origin, and pre-render marker.

## Before deployment

- Confirm the domain is renewed and auto-renew is healthy. Public WHOIS on 12 July 2026 reports registry expiry on 11 August 2026.
- Keep the dedicated `Little Giants Nursery Worker Deploy` token active in 1Password. It replaces the shared global key for this repo and is scoped to account-level Workers deployment and observability permissions.
- Keep the production Worker named `little-giants-nursery` and the review Worker named `little-giants-nursery-preview`.
- Review `wrangler.jsonc`. The retired contact form's email vars, rate-limit binding, and `RESEND_API_KEY` Worker secret are all gone; `verify:cloudflare-services` asserts the secret stays absent.
- Run the full local verification sequence.
- Complete Squarespace email 2FA, export every account-side DNS record, and confirm domain renewal and billing before any DNS mutation.
- Keep the exact-zone DNS token separate from the Worker deployment token and follow `docs/dns-staging-automation.md`. Do not accept the 11 quick-scan candidates until the complete Squarespace export proves they are a subset of the full zone.

## DNS migration

The domain currently uses Squarespace-managed DNS on NS1 nameservers, Squarespace web records, and Google Workspace mail records. A Worker custom domain requires an active Cloudflare zone. Credentials are valid and stored in 1Password, but account access is currently awaiting email 2FA. The read-only public record baseline is in `docs/dns-cutover-inventory.md`.

Before changing nameservers:

- Export every current DNS entry from Squarespace and save a timestamped copy.
- Recreate the current Squarespace web records as DNS-only records first, so moving DNS authority does not also move the website or activate Cloudflare redirect rules early.
- Recreate every Google Workspace MX record exactly.
- Preserve SPF, DKIM, DMARC, site verification, and every other TXT or CNAME record from the complete export.
- Add the Resend DKIM and return-path records.
- Query both assigned Cloudflare nameservers directly and compare their MX and TXT answers with the export before delegation.
- Lower TTLs ahead of the planned move if the current DNS provider allows it.
- Change the registrar to the complete pair of assigned Cloudflare nameservers. Never mix nameservers from the old and new providers.
- Confirm the existing Squarespace site and Google Workspace inbound and outbound delivery still work after Cloudflare becomes authoritative.

## Staging

`https://staging.littlegiantsnursery.org` is the client review environment. It is the `preview` Wrangler environment (`little-giants-nursery-preview`) with the hostname attached as a Worker Custom Domain, so the same Worker also answers on its workers.dev URL. Deploy to it with:

```bash
op run --env-file=.env.cloudflare -- npm run deploy:preview
```

Staging is deliberately not password protected, so it stays noindex on three independent layers and `npm run verify:preview-indexing` proves all three: a `Disallow: /` robots.txt, `robots: { index: false, follow: false }` page metadata from `NEXT_PUBLIC_PREVIEW_DEPLOYMENT=true`, and an `X-Robots-Tag: noindex, nofollow` edge header that `custom-worker.ts` injects for every hostname in `src/content/hostnames.json`. That JSON file is the single source of truth for hostnames, shared by the Worker and by every `scripts/verify-*.mjs` through `scripts/lib/hostnames.mjs`; adding a review hostname anywhere else will not receive the noindex guard.

`staging` is absent from the Worker's production hostname set, so it is never canonicalized to `www`. Its build keeps `NEXT_PUBLIC_SITE_URL` pointed at production so canonicals cannot leak the review host, and sets `NEXT_PUBLIC_ASSET_URL` to the staging origin so social cards resolve.

Known drift to clear on the next production deploy: the deployed `little-giants-nursery` Worker still carries the retired `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, and `CONTACT_RATE_LIMITER` bindings from the removed contact form, so `npm run verify:cloudflare-services` fails on the binding contract until it is redeployed from this configuration.

Separating the authority move from the website move keeps rollback small. Once Cloudflare authority, the old site, and mail are stable, deploy the production Worker and attach both the apex and `www` as [Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). The custom Worker entry returns one direct 301 from HTTP or apex to the matching HTTPS `www` URL while preserving the path and raw query string. The production Wrangler configuration disables its workers.dev route, while the named preview environment remains noindex on a separate Worker.

The Bulk Redirect List and its enabling rule are managed automatically: `npm run sync:cloudflare-redirects` (run by `npm run deploy` after every production deploy) pushes the JSON migration contract to the `little_giants_legacy_redirects` account list and enables the Bulk Redirect Rule, because an imported list alone is inert. It authenticates with `CLOUDFLARE_REDIRECTS_API_TOKEN` from `.env.cloudflare`. Every entry uses status 301 and `preserve_query_string=true`, so the edge preserves the original raw query before the application fallback runs. Keep the rule enabled permanently. `config/cloudflare-bulk-redirects.csv` remains as a manual dashboard-import fallback.

Do not add a generic Single Redirect in front of the Worker hostnames. Cloudflare evaluates [Single Redirects before Bulk Redirects](https://developers.cloudflare.com/ruleset-engine/reference/phases-list/), so a generic apex or HTTP redirect can introduce a chain for a legacy URL. The Worker owns canonicalization and is covered by `npm run verify:canonical-origin`. Also review zone-level HTTP redirect settings so an earlier rule does not bypass this one-response contract.

## Resend domain records

The Resend domain `send.littlegiantsnursery.org` has been created in `eu-west-1` with the custom return path `bounce`. It remains `not_started` until these records are published in the `littlegiantsnursery.org` DNS zone:

| Purpose | Type | Name | Priority | Value |
|---|---|---|---:|---|
| DKIM | TXT | `resend._domainkey.send` | | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDO09iDcPHqEX1M/5dXg3aC16vvisSorxCRKB9gqkwyU8WFEbqSnhNytjFU8Hd3YNBMLOdgFMRmFjSn4JB8nZlE4VQmjFHChif6D/yWkvHpNkd6mMhG33jZQDSRrmfgFjESjY+9YKtE8gcXrkqNHp31l/xzFDg6Q5LeELBjrilqKQIDAQAB` |
| Return path | MX | `bounce.send` | 10 | `feedback-smtp.eu-west-1.amazonses.com` |
| SPF | TXT | `bounce.send` | | `v=spf1 include:amazonses.com ~all` |

The website no longer sends email (the self-hosted contact form was retired in favour of the EyLog enquiry URL plus mailto and tel links), so the `RESEND_API_KEY` and its domain verification script have been removed. These DNS records stay in the zone contract so a future transactional sender can reuse them.

## Verification commands

```bash
npm run check
npm run test:e2e
npm run build
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run --env=""
npx wrangler deploy --dry-run --env preview
npm run verify:source-sitemap
npm run verify:source-assets
npm run verify:precutover-dns
op run --env-file=.env.cloudflare-dns -- npm run verify:pending-zone
npm run test:dns-contract
npm run verify:cloudflare-redirects
npm run verify:cloudflare-only
npm run verify:secret-templates
npm run verify:secret-references
op run --env-file=.env.cloudflare -- npm run verify:cloudflare-services
npm run verify:build-indexing:production
npm run verify:preview-indexing
npm run verify:security-headers
op run --env-file=.env.cloudflare -- npm run deploy:preview
npm run verify:migration
npm run verify:live-crawl
npm run verify:launch-preflight
```

After nameserver propagation and custom-domain attachment, run the combined read-only production gate:

```bash
npm run verify:production-launch
```

The command intentionally verifies only `https://www.littlegiantsnursery.org`. It checks secret-template hygiene, the Cloudflare-only contract, production indexability, continued preview noindex, direct canonical-host behavior, security headers, migration redirects, and the complete live crawl. It then confirms Cloudflare authority, the exact five Google Workspace MX records, and the documented public Resend DKIM, return-path MX, and SPF records. It does not change external state.

## Live smoke test

- Home, all age pages, Funding, Ofsted, Contact, Careers, Privacy, and Cookies return 200.
- Every source-sitemap path satisfies the tested contract in `docs/legacy-url-migration.md`: an exact 301 for every redirected path and one retained 200.
- Both legacy parent PDFs return 200 with `application/pdf`, unchanged byte sizes, and matching SHA-256 hashes.
- The retired Squarespace cart returns 410 with a noindex header.
- Canonical URLs and OpenGraph images use the production domain.
- Sitemap and robots use the production domain.
- GTM remains absent before consent and loads after consent.
- The `/contact` enquiry panel links to the EyLog enquiry form, `mailto:info@littlegiantsnursery.org`, and `tel:+441895603097`, and the EyLog form loads.
- The site has no mixed content, JavaScript errors, broken images, or horizontal overflow.
- Google Workspace inbound and outbound mail still works.
- The production domain returns index, follow metadata and an allowing robots.txt, while the separate preview Worker remains noindex.
- `node scripts/verify-indexing-mode.mjs production https://www.littlegiantsnursery.org` passes on the final custom domain.
- `npm run verify:canonical-origin` confirms that HTTP, apex, legacy, query-string, and trailing-slash probes reach the final HTTPS `www` URL in one 301.
- The imported Bulk Redirect List has an enabled Bulk Redirect Rule and Cloudflare Trace shows it matching a legacy `www` request.
- Ofsted and official funding links open correctly.

## Rollback

Keep the timestamped Squarespace zone export, the old site, the four old NS1 nameservers, and the previous known-good Worker version until the new custom domain, enquiry links, analytics, redirects, and mail have remained healthy beyond the previous four-hour web TTL.

Use the smallest rollback that resolves the failure:

1. For an application regression, roll the production Worker back to its previous known-good version. Leave DNS, MX, TXT, custom domains, and redirect rules unchanged.
2. For a Worker routing or certificate failure, keep Cloudflare authoritative. Disable the Bulk Redirect Rule without deleting its list, remove the Worker Custom Domains, then recreate the captured Squarespace apex A records and `www` CNAME as DNS-only records in Cloudflare. Do not change any MX or TXT record. Confirm the old site and external inbound and outbound mail before ending the incident.
3. Restore the old NS1 nameservers only if Cloudflare authority itself is the failure. Before changing the registrar, prove that the Squarespace zone still contains the exact five Google Workspace MX records and every required TXT or CNAME record. Restore the complete old nameserver set, never a mixed set.

After any rollback, query the active authoritative nameservers, run the relevant web migration checks, and test Google Workspace mail with an external mailbox. Do not delete the Cloudflare zone, Worker, Bulk Redirect List, or old Squarespace configuration during the same incident. Preserve them for diagnosis and a controlled retry.
