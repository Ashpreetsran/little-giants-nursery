# Visual QA report

Date: 12 July 2026

Primary full-page sweep artifact: the noindex review build before Cloudflare-only consolidation

## Coverage

Playwright CLI captured each public page at these viewports:

- Desktop: 1440 by 1000 pixels
- Mobile: 390 by 844 pixels
- Three positions per viewport: top, middle, and bottom

This produced 108 page screenshots across 18 routes. The six contact sheets below preserve the review evidence:

- [Desktop top](visual-qa/desktop-top.jpg)
- [Desktop middle](visual-qa/desktop-middle.jpg)
- [Desktop bottom](visual-qa/desktop-bottom.jpg)
- [Mobile top](visual-qa/mobile-top.jpg)
- [Mobile middle](visual-qa/mobile-middle.jpg)
- [Mobile bottom](visual-qa/mobile-bottom.jpg)

## Page results

| Page | Desktop | Mobile |
|---|---|---|
| `/` | Pass | Pass |
| `/about` | Pass | Pass |
| `/curriculum` | Pass | Pass |
| `/curriculum/montessori` | Pass | Pass |
| `/curriculum/stem` | Pass | Pass |
| `/rooms/babies` | Pass | Pass |
| `/rooms/toddlers` | Pass | Pass |
| `/rooms/preschool` | Pass | Pass |
| `/fees-funding` | Pass | Pass |
| `/ofsted` | Pass | Pass |
| `/food-nutrition` | Pass | Pass |
| `/nursery-environment` | Pass | Pass |
| `/send-inclusion` | Pass | Pass |
| `/starting-nursery` | Pass | Pass |
| `/contact` | Pass | Pass |
| `/careers` | Pass | Pass |
| `/privacy` | Pass | Pass |
| `/cookies` | Pass | Pass |

## Findings

- No visible horizontal overflow, clipped content, overlapping controls, broken images, or unreadable contrast was found.
- Sticky navigation remained compact and consistent while scrolling.
- Hero layouts, content bands, calls to action, legal content, and footers remained coherent across both viewports.
- The mobile menu was separately verified in its open and closed states.
- The browser session recorded zero console errors and zero warnings across the sweep.
- Google Tag Manager was absent before consent and loaded the requested container only after consent.

Automated Playwright and axe checks complement this visual pass. See `tests/site.spec.ts` and `tests/responsive.spec.ts`.

## Navigation logo adjustment

The main navigation logo was reduced again from 84 to 72 pixels on desktop, with proportional 68, 60, and 50 pixel sizes at narrower breakpoints. The navigation row now measures 92 pixels on desktop and 70 pixels on mobile. Three fresh Playwright CLI passes against the current Cloudflare preview checked the full desktop header, the mobile header, and the open mobile menu. The 44 pixel mobile touch target remains unchanged. Alignment, menu positioning, spacing, image clarity, and viewport overflow all passed, with zero console errors or warnings.

- [Trimmed desktop header](visual-qa/logo-header-desktop-trimmed.png)
- [Trimmed mobile header](visual-qa/logo-header-mobile-trimmed.png)
- [Trimmed open mobile menu](visual-qa/logo-header-mobile-menu-trimmed.png)

## Mobile content padding adjustment

The narrow mobile shell now uses the page content width instead of the full viewport width. This prevents a permanent browser scrollbar from consuming the intended spacing in desktop device previews. The home hero, curriculum panel, and final tour section now keep a measured 20 pixel gutter on both sides at the reviewed 500 pixel viewport. A 390 pixel follow-up also retained the full 20 pixel gutter with no horizontal overflow.

- [Mobile home padding](visual-qa/mobile-padding-home.png)
- [Mobile curriculum padding](visual-qa/mobile-padding-curriculum.png)
- [Mobile tour padding](visual-qa/mobile-padding-tour.png)

## Scroll-aware navigation

The sticky navigation now yields after 24 pixels of downward travel and returns after 8 pixels of upward travel. A 280 millisecond easing curve keeps both movements smooth, while the existing reduced-motion rule removes the animation for visitors who request it. The header remains visible near the top of the page, while a desktop disclosure or mobile menu is open, and whenever keyboard focus is inside the navigation.

Fresh Playwright CLI checks on the current Cloudflare preview used real wheel input at desktop and mobile widths. Both headers moved fully outside the viewport on descent and returned to the exact top edge on ascent. The mobile menu retained its full 774 pixel viewport height, including in a separate mid-transition interaction check.

- [Hidden desktop navigation](visual-qa/navigation-scroll-hidden-desktop.png)
- [Returned desktop navigation](visual-qa/navigation-scroll-returned-desktop.png)
- [Hidden mobile navigation](visual-qa/navigation-scroll-hidden-mobile.png)
- [Returned mobile navigation](visual-qa/navigation-scroll-returned-mobile.png)
- [Open mobile navigation after return](visual-qa/navigation-scroll-menu-mobile.png)

## First-load font reliability

The original Amatic configuration used `font-display: optional` and did not preload the file. A throttled cold-cache reproduction showed the home heading in the sans-serif fallback, where it remained after the Amatic file finished loading. The display font now uses `swap` and joins Josefin Sans in the initial font preload list.

The current Cloudflare preview requested both files together on a fresh browser profile. Amatic loaded in 70 milliseconds, Josefin Sans loaded in 58 milliseconds, and both browser font faces reported loaded with `display: swap`. The page recorded zero console errors or warnings. The fixed screenshot was captured from the deployed Worker at a 500 by 740 pixel viewport.

- [Fallback reference](visual-qa/font-first-load-baseline.png)
- [Fixed first load](visual-qa/font-first-load-fixed.png)

## Earlier live deployment pass

The original Cloudflare Worker was checked after the first performance, logo, metadata, and migration changes were deployed.

- [Cloudflare desktop home](visual-qa/live-cloudflare-desktop.png)
- [Cloudflare mobile home](visual-qa/live-cloudflare-mobile.png)
- [Cloudflare legacy contact fragment](visual-qa/live-cloudflare-contact-fragment.png)

The Cloudflare browser pass confirmed that the old `/get-in-touch#contact` URL reaches the visible enquiry form. GTM was absent before consent, and the requested `GTM-K5K5F4L4` script plus the configured analytics tag loaded after consent. The Worker served complete responsive imagery, noindex review metadata, working Open Graph cards, and zero console errors or warnings.

## Contact form recovery pass

The current dedicated Cloudflare preview was checked at a 390 by 844 pixel viewport after the contact accessibility and delivery-safety changes.

- [Before focus recovery](visual-qa/contact-errors-before-focus-fix.png)
- [Focused validation state](visual-qa/contact-errors-focused.png)

The first invalid field now receives focus, field errors clear as users edit, and mobile form controls compute to 16 pixels to avoid browser zoom. Automated browser coverage also verifies that delivery failures focus direct phone and email recovery links without clearing entered data, success receives focus, and the Send another enquiry action returns focus to the name field. Fast valid submissions are no longer silently discarded.

The empty-form negative test intentionally returned HTTP 400. The zero-console-error result above applies to the earlier normal-browsing sweeps, not that expected validation request.

## Current preview navigation and metadata pass

The dedicated preview at `https://little-giants-nursery-preview.bold-bonus-58f7.workers.dev` was checked with Playwright CLI after the environment split. Desktop disclosure buttons open and close with pointer clicks, keyboard Enter opens them, and Escape closes them with focus retained. Mobile Escape closes the menu and returns focus to its button. Contact, Careers, Privacy, and Cookies expose noindex metadata, production canonicals, and complete Open Graph site fields. Normal browsing across six representative pages recorded zero console errors and warnings.

- [Cloudflare desktop dropdown](visual-qa/cloudflare-desktop-dropdown-click.png)
- [Cloudflare mobile menu](visual-qa/cloudflare-mobile-menu-open.png)

The focused keyboard retest confirmed that closed desktop dropdowns are hidden from Tab order, Cookie settings moves focus into the dialog and returns it on Escape or a choice, the skip link has a visible focus ring, the mobile menu restores focus and scrolling, and 320-pixel and 390-pixel layouts do not overflow.

## Error and retirement pages

The Cloudflare custom 404 and true 410 retirement page were visually reviewed at 1440 by 1000 pixels. The 410 keeps its correct noindex response and was upgraded from raw HTML to a small branded card. Automated axe coverage reports no violations.

- [Cloudflare custom 404](visual-qa/cloudflare-custom-404.png)
- [Cloudflare retired cart 410](visual-qa/cloudflare-retired-cart-410.png)

## Mosaic image optimization

The main curriculum mosaic now uses a deterministic landscape derivative of the same source photograph rather than downloading a portrait and cropping most of it in CSS. The crop was visually inspected at the full desktop layout to confirm the small-world tray remains clear and balanced.

- [Landscape mosaic crop](visual-qa/mosaic-landscape-crop.png)

## Open Graph cards

Eighteen purpose-built 1200 by 630 social cards were rendered from `design/og-card.html` with Playwright CLI.

- Pass 1 reviewed all cards together for clipping, contrast, title wrapping, and image crops.
- Pass 2 inspected the longest titles at their original 1200 by 630 size and corrected an unbalanced title wrap on the Starting Nursery card.
- Pass 3 reviewed representative cards at 600 by 315 pixels to prove that the heading, summary, location, and Ofsted line remain readable at likely social-feed size.

[View the final Open Graph contact sheet](visual-qa/open-graph-cards.jpg).
