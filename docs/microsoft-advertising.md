# Microsoft Advertising conversion tracking

Configured 16 September 2026 for Little Giants Nursery, Microsoft Advertising account `189322012` (`G107CVD9`), customer `254981826`.

- UET tag: `187274718`, Little Giants Nursery - Website.
- GTM container: `GTM-K5K5F4L4`, account `4702995475`, container `258103966`.
- Workspace: `10`.

| Goal | UET event action | Source | Bidding |
|---|---|---|---|
| EyLog enquiry link click | `eylog_enquiry_click` | Existing EyLog custom event | Included |
| Telephone link click | `telephone_click` | Existing Tel Links trigger | Included |
| Email link click | `email_click` | Existing Mailto Links trigger | Reporting only |

All goals use Unique counting, a 30-day click window, last-click attribution, and no assigned monetary value. Link clicks do not prove a completed phone call, email, or EyLog submission. Email clicks include careers links and are intentionally excluded from bidding.

**The `nursery_enquiry_success` goal is no longer reachable.** It fired on a successful `/api/contact`
response, and the self-hosted enquiry form was retired in favour of the nursery's EyLog form on
29 July 2026. The goal reinstated alongside this tracking work on 16 September was removed again on
21 September. `eylog_enquiry_click` is now the enquiry signal. Remove or repoint the goal in
Microsoft Advertising so it does not sit permanently at zero conversions, and note that an enquiry
link click is a weaker signal than a submission: it records intent to open EyLog, not a completed
enquiry.

The base UET tag uses the native Microsoft GTM template, All Pages, automatic SPA page views, and query-string removal. Enhanced conversions and Clarity are not enabled. Events contain no form field values.

The custom HTML consent tag runs at Consent Initialization and queues a denied default before reading `little-giants-cookie-consent-v2`. It updates UET consent for the stored choice and changes to the website cookie preference. The website itself withholds GTM until consent is granted and reloads on withdrawal to stop loaded tracking scripts. Version 1 analytics choices do not grant version 2 consent.

The CSP explicitly allows Microsoft UET script, image, and connection hosts. Without this website change the native UET base tag fails in GTM Preview because the browser blocks its script.

Validation: `tests/conversion-tracking.spec.ts` covers the EyLog enquiry click being measured, other
outbound links not being measured, every setting's enquiry route pointing at EyLog rather than an
on-site form, and old analytics consent not granting the new advertising choice. Live UET receipt and
Microsoft Ads attribution are separate checks; a goal can remain unverified until Microsoft processes
traffic.
