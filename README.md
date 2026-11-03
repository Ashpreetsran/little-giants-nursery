# Little Giants Nursery

A high-quality Next.js replacement for [littlegiantsnursery.org](https://www.littlegiantsnursery.org), built for Little Giants Nursery: the Ofsted Good setting in Uxbridge, and a second nursery opening soon on Headley Road in Woodley, Reading.

## Architecture

- Next.js 16 App Router and React 19
- Twenty-eight pre-rendered pages: a group hub, a nurseries index, fifteen Uxbridge pages under `/nurseries/uxbridge`, eight Woodley pages under `/nurseries/woodley`, and three company pages
- Every setting's name, address, phone, hours, Ofsted record, enquiry URL and landing-page copy lives in `src/content/locations.ts`, so a third nursery is a data change
- `src/content/site-pages.ts` is the single catalogue behind routing, metadata, JSON-LD, the sitemap and the social cards; `config/page-contract.json` mirrors it for the Node verifiers
- Enquiries route to the nursery's EyLog enquiry form, plus direct mailto and tel links, instead of a self-hosted contact form
- OpenNext Cloudflare adapter with Workers Static Assets and a small custom Worker entry for raw-query-safe legacy redirects
- Responsive AVIF and WebP delivery through the Cloudflare Images binding
- Consent-gated Google Tag Manager container `GTM-K5K5F4L4`
- Local copies of 52 source-site assets
- JSON-LD for the group, each nursery, the website, breadcrumbs, and page FAQs
- Static sitemap, robots file, web manifest, 28 purpose-built Open Graph cards, and legacy URL redirects

OpenNext's current supported Cloudflare target is Workers, not the retired Pages adapter. The marketing routes still ship as pre-generated HTML and static assets. Only the legacy redirect handlers and the retired-cart 410 response invoke dynamic server code.

## Local development

```bash
npm install
op run --env-file=.env.dev -- npm run dev
```

The committed `.env.dev` and `.env.prod` files contain 1Password references only. The expected item is `op://client-logins/little-giants-nursery`.

## Checks

```bash
npm run check
npm run test:e2e
npm run build
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run --env=""
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
npm run verify:canonical-origin
npm run verify:security-headers
npm run verify:migration
npm run verify:live-crawl
npm run verify:launch-preflight
npm run verify:production-launch
```

### Adding a page

1. Add it to `src/content/site-pages.ts`.
2. Add a card to `design/og-pages.json` and run `npm run og:generate`.
3. Run `npm run build` then `npm run pages:contract` to refresh `config/page-contract.json`.

Skipping step 3 fails `tests/metadata.spec.ts`, `verify:build-indexing` and `verify:live-crawl`,
which all read the contract rather than a hardcoded page count.

### Locations

`src/content/locations.ts` treats missing facts as missing rather than borrowing them from the
other setting. Woodley has no phone line, so no `tel:` link renders anywhere and `telephone` is
absent from its schema. It has no confirmed postcode, so `postalCode` and `geo` are absent. It has
not been inspected, so the Ofsted badge, award and section do not render. It has had no families,
so the parent testimonials do not appear on it. Each of those is a single field away from
switching on once the fact exists.

The Playwright suite covers all public routes, exact 301s and encoded query preservation, cookie consent focus recovery, the EyLog, email, and phone enquiry links, mobile navigation and Escape handling, touch-friendly enquiry actions, responsive images, viewport overflow, metadata, schema, social cards, the custom 404 and 410, and automated accessibility checks.

## Source assets

Run the repeatable migration script to refresh assets from the public Squarespace sitemap:

```bash
npm run assets:download
npm run images:derive
npm run documents:download
```

The downloader keeps assets owned by the Little Giants Squarespace content collection and excludes unrelated images attached to hidden template data.

The script requests supported 1500-pixel JPEG variants and preserves real PNG and GIF content types. The generated source and local-path mapping is in `public/images/source/manifest.json`.

The derived-image command uses ImageMagick to reproduce the 1500 by 650 landscape mosaic crop from its local source photograph. Run it after refreshing source assets, then repeat visual and performance checks.

The document downloader preserves the two parent PDFs found by the legacy-site crawl at their original `/s/` paths. It rejects a download unless both the expected byte size and SHA-256 checksum match the migration contract.

`npm run verify:source-sitemap` compared the live Squarespace sitemap with the captured migration
contract, so that a page added to the old site before cutover could not be missed by the redirect
plan. It is **historical**: `littlegiantsnursery.org/sitemap.xml` has served this application since
the cutover, so the script now compares our own sitemap with the Squarespace contract and fails by
design. It was removed from `verify:launch-preflight` on 21 September 2026. It still accepts an
explicit sitemap URL as its first argument if an archived copy ever needs checking.

`config/cloudflare-bulk-redirects.csv` is ready for dashboard import when the Cloudflare zone exists. Its verification command proves that every row still matches the JSON contract, uses 301, and preserves the original query string. Importing the list is not enough by itself: the list must also be enabled by a Cloudflare Bulk Redirect Rule, which `npm run sync:cloudflare-redirects` creates and keeps enabled after every production deploy.

### DNS

`npm run verify:live-zone` is the ongoing guard. It proves the Cloudflare zone is still active on the
expected account and nameservers and holds exactly the record set in `config/cloudflare-live-zone.json`,
so a deleted Google Workspace MX record or a stray addition fails the preflight rather than being
discovered by a parent whose email bounced. Recapture the contract deliberately when a record is
meant to change.

The pre-cutover migration tooling is **historical and is not expected to run again**. `dns:plan`,
`dns:apply`, `verify:staged-dns`, `verify:pending-zone` and `verify:precutover-dns` staged records
into a pending Cloudflare zone while Squarespace and NS1 still served the domain. That migration
completed when the zone went active on 3 August 2026, so those scripts now assert a world that no
longer exists and will fail by design. `verify:precutover-dns` was removed from
`verify:launch-preflight` on 21 September 2026 and replaced by `verify:live-zone`.
`config/precutover-dns-baseline.json` and `config/cloudflare-zone-contract.json` are kept as the
rollback record of that migration. `npm run test:dns-contract` still covers the planning logic and
takes an injected clock, so it cannot rot the way it did when it read `Date.now()` directly and
began failing on the contract's 31 August risk date.

The pending Cloudflare zone is tracked in `config/cloudflare-zone-contract.json`. `verify:pending-zone` confirms that it remains full, free, pending, empty, and delegated nowhere publicly, with exactly the 11 untouched quick-scan candidates. The guarded staging workflow is documented in [docs/dns-staging-automation.md](docs/dns-staging-automation.md). It requires a complete gitignored Squarespace export and an exact plan-hash approval before it can accept scan records or add the tracked Resend records.

`npm run verify:preview-indexing` proves the review Worker remains noindex through page metadata, the `X-Robots-Tag` edge header on Worker responses, and a robots.txt rule that blocks the entire preview. Static files keep Cloudflare's faster asset-first routing. After cutover, run `node scripts/verify-indexing-mode.mjs production https://www.littlegiantsnursery.org` to prove the public build is indexable, has no edge noindex header, and references the canonical sitemap.

`npm run verify:live-crawl` checks every deployed sitemap page, canonical, title, description, Open Graph URL, JSON-LD block, internal target, fragment, and rendered image.

`npm run verify:cloudflare-only` proves that the repo has no Vercel project files, package, command, or environment variable, and that OpenNext and Wrangler remain the deployment path.

`gitleaks git --redact --no-banner` scans repository history. The checked-in configuration narrowly allows the JWT-shaped token in the nursery's intentionally public EyLog enquiry URL, which contains only public branch and company identifiers.

`verify:secret-references` asks 1Password to resolve every committed reference and discards every returned value. It fails with only the template and field name if a reference is missing or access has changed.

The preview, production deploy, and production upload commands run a build-artifact indexing guard before any upload. It compares every pre-rendered Next.js page listed in `config/page-contract.json` with its OpenNext cache and rejects incorrect robots, canonical, or Open Graph metadata for the selected environment.

`verify:cloudflare-services` uses the dedicated scoped token for a read-only provider check. It proves that both Workers have one version at 100 percent, the exact runtime settings and binding types, correct workers.dev isolation, the absence of the retired Resend secret, and persistent 100 percent invocation logs without exposing secret values.


`npm run verify:source-assets` checks all 52 downloaded source images against their manifest paths, byte sizes, content types, and file signatures.

`npm run verify:launch-preflight` runs 10 launch guards together: secret-template hygiene, the Cloudflare-only contract, local source assets, source sitemap drift, pre-cutover DNS drift, Cloudflare CSV parity, preview noindex, security headers, the deployed migration contract, and the complete live crawl contract.

After the custom-domain cutover, `npm run verify:production-launch` checks secret-template hygiene, the Cloudflare-only contract, production indexing, continued preview noindex, direct apex and HTTP canonicalization, security headers, legacy migration behavior, the complete live crawl, Cloudflare nameserver authority, the exact Google Workspace MX set, and the public Resend DKIM, return-path MX, and SPF records. The gate intentionally runs only against `https://www.littlegiantsnursery.org`.

## Cloudflare deployment

The Worker configuration lives in `wrangler.jsonc`. The site no longer hosts a contact form or contact API route: enquiries go through the EyLog enquiry URL and direct mailto and tel links, so the Worker needs no email or rate-limit bindings. The `RESEND_API_KEY` Worker secret from the retired form has been deleted from both services, and `verify:cloudflare-services` now asserts it stays gone.

The noindex Cloudflare review deployment is available at `https://little-giants-nursery-preview.bold-bonus-58f7.workers.dev`. It uses the named `preview` Wrangler environment and a separate Worker:

```bash
op run --env-file=.env.cloudflare -- npm run deploy:preview
```

The committed `.env.cloudflare` file contains 1Password references only. It uses the dedicated `Little Giants Nursery Worker Deploy` token stored on the client item, with account-scoped Workers Scripts, Observability, Tail, and Account Settings permissions. It does not use the shared global Cloudflare key. DNS staging uses the separate exact-zone token referenced by `.env.cloudflare-dns`, so the Worker deployment credential cannot accept, create, or edit DNS records.

The noindex Worker preview already has the image binding, pre-generated page caches, and Workers Cache for repeated image transformations. The production service has `workers_dev` disabled in configuration so its alternate hostname cannot become an indexable duplicate. Before the custom-domain launch:

1. Keep the least-privilege Workers deployment token active in 1Password.
2. Onboard the domain to Cloudflare and preserve every Google Workspace MX and TXT record.
3. Build and deploy with `op run --env-file=.env.cloudflare -- npm run deploy`.
4. Attach both the apex and `www` custom domains to the production Worker. The custom Worker canonicalizes HTTP and apex requests directly to HTTPS `www`.
5. Import and enable the Bulk Redirect list, then verify redirects, headers, and the EyLog, email, and phone enquiry links on the public URL.

The domain currently uses Squarespace-managed DNS on NS1 nameservers, so the final custom-domain move is an infrastructure step, not an application build step. The public record baseline is in [docs/dns-cutover-inventory.md](docs/dns-cutover-inventory.md), but the full Squarespace-side record export still requires email 2FA.

## Research and launch notes

- [Uxbridge SEO research and page map](docs/seo-research.md)
- [Woodley keyword and SERP research](docs/seo-research-woodley.md)
- [Legacy URL migration contract](docs/legacy-url-migration.md)
- [Content confirmation checklist](docs/content-confirmation-checklist.md)
- [Deployment and launch checklist](docs/deployment.md)
- [DNS cutover inventory](docs/dns-cutover-inventory.md)
- [DNS staging automation](docs/dns-staging-automation.md)
- [Visual QA report](docs/visual-qa-report.md)
- [Performance report](docs/performance-report.md)
- [Requirement progress ledger](progress.json)

## Google Ads

`config/google-ads/` holds the account identifiers, an export of each live campaign, and the
definition for the Woodley campaign. Credentials resolve from `op://api-keys/Google Marketing APIs`
at call time and are never written to disk or passed in argv.

```bash
npm run ads:export -- uxbridge      # snapshot a campaign to config/google-ads/
npm run ads:create-woodley -- --dry-run
npm run ads:sync-urls -- --dry-run  # move ad and sitelink final URLs onto live pages
```

`ads:sync-urls` must be run straight after a production deploy that moves pages. It refuses to
write a final URL that does not return 200, so an ad can never be pointed at a broken destination.
