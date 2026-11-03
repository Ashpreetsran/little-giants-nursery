# Performance report

Date: 12 July 2026

## Baseline

The first review audit served the original JPEG for every `<Image>` component and used the original TTF font files.

- Home mobile LCP ranged from 3.5 to 5.6 seconds.
- Contact mobile LCP was 2.9 seconds.
- Home mobile transferred 1.47 MB, including 1.12 MB of images.
- Home desktop transferred 3.13 MB, including 2.73 MB of images.
- Lighthouse estimated 432 KB of responsive-image savings on mobile and 1.75 MB on desktop.
- Desktop navigation and footer prefetching produced roughly 90 requests on the home page.

## Improvements

- Enabled the OpenNext Cloudflare Images binding and Next.js responsive image candidates.
- Enabled AVIF and WebP negotiation.
- Replaced the 116 KB and 85 KB TTF files with subsetted 17 KB and 12 KB WOFF2 files.
- Preloaded both local WOFF2 files and configured both faces to swap in reliably after first-load fallback rendering.
- Disabled route prefetching for hidden desktop dropdowns, mobile menu destinations, and footer links.
- Added explicit long-lived caching for source images and one-day caching for Open Graph cards.

Cloudflare image optimization can incur usage charges. Review Cloudflare Images pricing before the production custom-domain launch.

## Cloudflare preview results

Original Lighthouse target: `https://little-giants-nursery.understandingdata.workers.dev`

Current review target: `https://little-giants-nursery-preview.bold-bonus-58f7.workers.dev`

| Page and profile | Performance | Accessibility | Best practices | FCP | LCP | TBT | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Home, mobile | 99 | 100 | 100 | 1.0 s | 2.2 s | 0 ms | 0 | 541 KiB |
| Contact, mobile | 95 | 100 | 100 | 1.4 s | 2.6 s | 0 ms | 0 | 350 KiB |
| Home, desktop | 100 | 100 | 100 | 0.3 s | 0.6 s | 0 ms | 0 | 682 KiB |

The preview SEO score is intentionally reduced because both the meta robots directive and `robots.txt` block indexing on review hosts. The production build emits indexable metadata.

The Cloudflare image endpoint was also verified directly: a 640-pixel request for a local JPEG returned `Content-Type: image/avif`.

The first-load font follow-up confirmed that the previous optional display setting could leave Amatic headings in the fallback face for an entire visit. The current Cloudflare build preloads both local fonts, requests them together, and marks both faces as `swap`. A cold-cache check loaded Amatic in 70 milliseconds and Josefin Sans in 58 milliseconds. The 17 KB Amatic asset returned `CF-Cache-Status: HIT` with one-year immutable caching.

The production and named preview environments now use distinct Workers and distinct rate-limit namespaces. Workers Cache is enabled for repeated image transformations. On the current preview, the first optimized AVIF request returned `CF-Cache-Status: MISS` with approximately 0.655 seconds TTFB. Two repeats returned `HIT` with approximately 0.049 and 0.055 seconds TTFB.

## Fresh Cloudflare samples

Three mobile and three desktop Lighthouse runs were repeated on the dedicated preview after the caching and accessibility passes.

- Mobile median performance: 98, with 1.083 seconds FCP, 2.271 seconds LCP, 0 milliseconds TBT, and 0 CLS.
- Desktop median performance: 100, with 0.274 seconds FCP, 0.454 seconds LCP, 0 milliseconds TBT, and 0 CLS.
- Accessibility and best practices scored 100 in every sample.
- Preview SEO scored 69 only because the review Worker intentionally emits noindex and blocks crawling.

A final follow-up after adding the hero priority hint scored 99 on mobile and 100 on desktop, with 1.986 seconds mobile LCP and 0.666 seconds desktop LCP. The current deployment renders the LCP image with both `fetchpriority="high"` and `loading="eager"`.

The largest remaining responsive-image estimate came from a portrait source being cropped into a 2.3:1 mosaic slot. A deterministic landscape derivative of the same nursery photograph now removes those discarded pixels. A 480-pixel device candidate and tighter room-card and Ofsted `sizes` values also reduce oversized below-fold selections without changing the layout.

Live verification reduced the optimized 640-pixel mosaic response from the earlier 114,648 bytes to 50,774 bytes, a 63,874-byte or approximately 56 percent reduction. The first request was a cache miss and the repeat was a cache hit. At a 1440-pixel viewport, a 375-pixel room card now selects the new 480-pixel candidate instead of 640 pixels.

The final paired Lighthouse audit measured 97 mobile performance with 2.498 seconds LCP and 523,405 bytes transferred, plus 100 desktop performance with 0.344 seconds LCP and 559,440 bytes transferred. Accessibility and best practices remained 100. The remaining image-delivery estimate fell from 168 KiB to 27 KiB, an improvement of about 84 percent, while desktop transfer fell by roughly 112 KiB or 17 percent from the earlier sample.

The handoff audit on deployed version `95b925d0-d3e2-4a04-926d-7a657805848f` scored 99 mobile performance with 2.2 seconds LCP and 512 KiB transferred. Desktop scored 100 with 0.6 seconds LCP and 544 KiB transferred. Accessibility and best practices scored 100 in both runs. Preview SEO remained the expected 69 because the review Worker deliberately blocks indexing at the page, edge, and robots.txt layers.

The final scoped-token deployment, version `6c83748b-e360-4ac6-9e63-5c12663be5e4`, scored 100 on both mobile and desktop performance. Mobile LCP was 1.9 seconds with 509 KiB transferred, while desktop LCP was 0.6 seconds with 545 KiB transferred. Accessibility and best practices remained 100. Preview SEO remained the expected 69 because noindex protection is intentional.
