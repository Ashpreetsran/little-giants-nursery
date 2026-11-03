# DNS cutover inventory

Public snapshot captured on 12 July 2026 at 21:22 UTC. This is a read-only baseline, not a complete zone export. Public DNS cannot enumerate unknown record names, so the Squarespace DNS screen must still be exported after email 2FA before any cutover.

The zone recorded here was superseded when the domain was moved to the nursery's own Cloudflare account. The live zone is `3d25f43c6b2e7a7b60a24d87eb38df69` on account `7de2054057a3a4e21a36dc2191ddda20`, delegated to `adel.ns.cloudflare.com` and `ganz.ns.cloudflare.com`; `config/cloudflare-zone-contract.json` is the current source of truth. The NS1 records below are the pre-cutover baseline, kept for rollback reference only. The quick scan found the 11 positive public records in this baseline, but all candidates remain temporary and untouched until they can be compared with the complete Squarespace export. See `docs/dns-staging-automation.md` for the guarded accept-only and add-only workflow.

The matching machine-readable record set is stored in `config/precutover-dns-baseline.json`. Run `npm run verify:precutover-dns` immediately before migration to detect any public NS, web A or AAAA, CAA, Domain Connect, apex or DMARC TXT, or Google Workspace MX change since this snapshot.

## Registration and authority

| Item | Current value |
|---|---|
| Registrar | Tucows Domains Inc, resold through Squarespace |
| Registry expiry | 11 August 2026 at 20:16:18 UTC |
| DNSSEC | Unsigned, no parent DS record |
| Nameservers | `dns1.p02.nsone.net`, `dns2.p02.nsone.net`, `dns3.p02.nsone.net`, `dns4.p02.nsone.net` |
| SOA | `dns1.p02.nsone.net hostmaster.nsone.net 1660248981 43200 7200 1209600 3600` |

Renewal and billing must be confirmed before the DNS migration. The registry expiry is only about 30 days after this snapshot.

## Web records

| Name | Type | TTL | Value |
|---|---|---:|---|
| `@` | A | 14400 | `198.185.159.145` |
| `@` | A | 14400 | `198.49.23.144` |
| `@` | A | 14400 | `198.49.23.145` |
| `@` | A | 14400 | `198.185.159.144` |
| `www` | CNAME | 3600 | `ext-sq.squarespace.com` |
| `_domainconnect` | CNAME | 14400 | `_domainconnect.domains.squarespace.com` |

The apex has no AAAA or CNAME record. `www` resolves through its CNAME to the Squarespace IPv4 set. No CAA record is currently published.

## Google Workspace mail records

All five current MX records must exist in Cloudflare before nameservers change.

| Name | Type | Priority | TTL | Value |
|---|---|---:|---:|---|
| `@` | MX | 1 | 14400 | `aspmx.l.google.com` |
| `@` | MX | 5 | 14400 | `alt1.aspmx.l.google.com` |
| `@` | MX | 5 | 14400 | `alt2.aspmx.l.google.com` |
| `@` | MX | 10 | 14400 | `alt3.aspmx.l.google.com` |
| `@` | MX | 10 | 14400 | `alt4.aspmx.l.google.com` |

## Publicly absent records

The snapshot found no public apex TXT, SPF, DMARC, common Google DKIM selector, autodiscover, MTA-STS, SMTP TLS reporting, or Resend sending-domain record. A zone transfer was refused, as expected. Do not treat an absent public lookup as proof that the Squarespace DNS screen has no uncommon or inactive records.

Do not invent mail-hardening records during the site migration. Preserve the current mail service first. SPF, DKIM, and DMARC should be configured separately using confirmed Google Workspace tenant values.

## Cutover safeguards

1. Complete Squarespace email 2FA and export the complete DNS screen.
2. Confirm auto-renew, payment status, and account ownership.
3. Recreate every current record in Cloudflare, including all five Google Workspace MX records and any account-only TXT or verification records.
4. Query both Cloudflare-assigned nameservers directly before delegation and compare their MX and TXT answers with the complete export. Do not change registrar nameservers until both authoritative servers answer correctly.
5. Add the documented Resend records, then verify the sending domain before a real form delivery test.
6. Confirm the production Worker build is indexable and the preview Worker remains noindex.
7. Attach both apex and `www` to the production Worker. Its edge entry performs one direct HTTP or apex 301 to HTTPS `www` while preserving path and query.
8. Import and enable the Bulk Redirect list for the five existing sitemap paths.
9. Verify web redirects, certificates, inbound and outbound mail with an external mailbox, contact delivery, analytics, and the migration contract before retiring Squarespace.

The current web TTL is up to four hours. Keep the existing Squarespace site and its complete DNS zone available for rollback until the custom domain and email checks pass. Do not enable DNSSEC during the same change window. The domain currently has no parent DS record, so DNSSEC can be introduced as a separate, verified change after the migration is stable.
