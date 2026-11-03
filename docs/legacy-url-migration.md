# Legacy URL migration

The live Squarespace sitemap at `https://www.littlegiantsnursery.org/sitemap.xml` was captured on 12 July 2026. It contains six page URLs. Five old paths move to more descriptive canonical pages and one path remains unchanged.

| Existing sitemap URL | New canonical URL | Launch behaviour |
| --- | --- | --- |
| `/home-page-` | `/` | `301 Moved Permanently` |
| `/about-us` | `/about` | `301 Moved Permanently` |
| `/why-choose-us` | `/about` | `301 Moved Permanently` |
| `/parent-information-` | `/starting-nursery` | `301 Moved Permanently` |
| `/get-in-touch` | `/contact` | `301 Moved Permanently` |
| `/careers` | `/careers` | Retained with `200 OK` |

One extra path outside the captured sitemap is also redirected: `/home` was added on 17 August 2026 as a `301` to `/` because the old homepage URL still circulates in external links.

## The Woodley restructure, 21 September 2026

Adding the second nursery moved every Uxbridge page from the site root to `/nurseries/uxbridge/`.
Fourteen new `301`s were added for the moved paths, and the four Squarespace aliases that used to
land on those paths were repointed at the same time, so `/about-us` goes straight to
`/nurseries/uxbridge/about` in one response rather than chaining through `/about`.
`npm run verify:canonical-origin` proves there is no chain.

`/` was not redirected. It is now a group hub listing both settings, which keeps the domain's
strongest URL in place and gives the new nursery an internal link from it.

Each redirect row carries a `reason` of either `squarespace-migration` or `location-restructure`,
so the two migrations stay legible in the contract.

The machine-readable source of truth is `src/content/legacy-url-migration.json`. The custom Cloudflare Worker reads that file before OpenNext parses the request, and the application route handlers provide a local and server fallback. Playwright verifies the following behaviours:

- Every redirected sitemap path returns exactly 301, not 307 or 308.
- Existing campaign query parameter values are preserved, including encoded reserved characters such as `%2B` and `%26`.
- The retained Careers URL still returns 200.

The same JSON file records the six captured Squarespace sitemap paths. `npm run verify:source-sitemap` compares that set with the current live sitemap and fails if a page is added, removed, or renamed before cutover.

The custom Worker also collapses accidental trailing-slash variants into the same single 301 response, with their query string preserved.

The application sitemap contains only the new canonical URLs. After the domain cutover, submit the new sitemap in Google Search Console and keep these redirects in place for at least one year. Permanent retention is preferable because external links and old bookmarks can outlive the migration window.

The live Cloudflare Bulk Redirect List (`little_giants_legacy_redirects`) is managed by `op run --env-file=.env.cloudflare -- npm run sync:cloudflare-redirects`, which pushes the JSON contract to the account list, creates the list if it is missing, and enables the Bulk Redirect Rule that references it, because importing a list alone does not activate it. The production `npm run deploy` script runs this sync after every deploy, so the edge list cannot drift from the contract. The sync authenticates with the dedicated `CLOUDFLARE_REDIRECTS_API_TOKEN` (Account Rule Lists Write plus Mass URL Redirects Write, scoped to the nursery account). `config/cloudflare-bulk-redirects.csv` remains as a manual dashboard-import fallback, and `npm run verify:cloudflare-redirects` fails if that CSV ever drifts from the JSON contract. The edge rules run before the Worker and preserve the original raw query string, while the custom Worker and application handlers remain tested fallbacks.

Attach both the apex and `www` hostnames to the same production Worker. The Worker canonicalizes HTTP, apex, trailing-slash, and fallback legacy requests directly to the final HTTPS `www` destination. Do not put a generic Cloudflare Single Redirect in front of these hostnames. Single Redirects execute before Bulk Redirects, so a generic apex or HTTP rule can add an avoidable hop to old sitemap URLs. `npm run verify:canonical-origin` proves the final one-response behavior after cutover.

## Linked assets and retired paths

A crawl of the source pages found two live parent documents that do not appear as separate entries in the XML sitemap. Both are preserved byte-for-byte at their existing paths so old bookmarks and indexed document results continue to return a PDF with 200:

- `/s/Little-Giants-Parent-Information-Apr-26-96x7.pdf`
- `/s/Parent-TCs.pdf`

Poppler rendered all 26 pages of the Parent Information pack and all 9 pages of the Terms and Conditions without errors. Their source sizes and SHA-256 checksums are recorded in the JSON migration contract and enforced by both the repeatable downloader and the Playwright suite. The Terms document contains bracketed template alternatives, so it is preserved for URL continuity but flagged for nursery confirmation before final cutover.

The old `/get-in-touch#contact` bookmark can carry its fragment through the redirect, so the new Contact page includes a compatible `#contact` target beside the enquiry form.

The source site's `/cart` URL is an empty Squarespace commerce shell. It has no content-equivalent replacement and returns 410 with a noindex header instead of being redirected to an unrelated page.

Run `npm run verify:migration` against the Cloudflare preview, or pass another base URL after `--`. The final review verification on 12 July 2026 passed this complete contract on Cloudflare. Run it again against `https://www.littlegiantsnursery.org` immediately after the production DNS cutover.
