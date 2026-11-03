# DNS staging automation

The Cloudflare zone already exists as a full, free, pending zone. Creating another zone is not part of this workflow. The tracked identity, expected state, assigned nameservers, original NS1 delegation, and strict mutation policy live in `config/cloudflare-zone-contract.json`.

Cloudflare documents that an unactivated Free pending zone can be automatically removed after 28 days. This zone was created at `2026-07-13T00:10:15Z`, so the tracked contract treats `2026-08-10T00:10:15Z` as the removal-risk boundary and fails closed after it. Complete the migration before then, or recreate the zone and update its ID, timestamps, assigned nameservers, token scope, and verification evidence before continuing.

Cloudflare's quick scan found the 11 positive public records in `config/precutover-dns-baseline.json`. Those records remain temporary and must not be accepted until the complete Squarespace account-side DNS screen has been captured after email 2FA. A quick scan is not a complete zone export and can miss uncommon TXT, DKIM, verification, or service records.

## Credentials

Use a separate API token with Zone Read and DNS Write permissions restricted to the `littlegiantsnursery.org` zone. Store it on the existing `little-giants-nursery` item in the `client-logins` vault under the field `CLOUDFLARE_DNS_API_TOKEN`.

The committed `.env.cloudflare-dns` file contains only this 1Password reference. Do not add the Worker deployment token, a global API key, an account email, or a plaintext value. Revoke the DNS token after the staged inventory and cutover work is finished.

## Complete private export

Create `private/dns/squarespace-export.json` only after reviewing the complete Squarespace DNS settings screen. The whole `private/` directory is gitignored. Do not commit the export or generated plan.

The exact machine-readable schema is `config/squarespace-dns-export.schema.json`. The following is a complete valid baseline example. Replace the timestamp and evidence hash, then add every other record visible in Squarespace before keeping `captureComplete` set to true:

```json
{
  "schemaVersion": 1,
  "domain": "littlegiantsnursery.org",
  "capturedAt": "2026-07-13T12:00:00Z",
  "captureComplete": true,
  "source": {
    "provider": "Squarespace DNS settings",
    "evidenceSha256": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  "records": [
    {
      "type": "A",
      "name": "@",
      "content": "198.185.159.144",
      "ttl": 14400
    },
    { "type": "A", "name": "@", "content": "198.185.159.145", "ttl": 14400 },
    { "type": "A", "name": "@", "content": "198.49.23.144", "ttl": 14400 },
    { "type": "A", "name": "@", "content": "198.49.23.145", "ttl": 14400 },
    { "type": "CNAME", "name": "www", "content": "ext-sq.squarespace.com", "ttl": 3600 },
    { "type": "CNAME", "name": "_domainconnect", "content": "_domainconnect.domains.squarespace.com", "ttl": 14400 },
    { "type": "MX", "name": "@", "content": "aspmx.l.google.com", "priority": 1, "ttl": 14400 },
    { "type": "MX", "name": "@", "content": "alt1.aspmx.l.google.com", "priority": 5, "ttl": 14400 },
    { "type": "MX", "name": "@", "content": "alt2.aspmx.l.google.com", "priority": 5, "ttl": 14400 },
    { "type": "MX", "name": "@", "content": "alt3.aspmx.l.google.com", "priority": 10, "ttl": 14400 },
    { "type": "MX", "name": "@", "content": "alt4.aspmx.l.google.com", "priority": 10, "ttl": 14400 }
  ]
}
```

List every account-side record, not only the two examples. Use content without DNS presentation quotes. Supported record types are A, AAAA, CAA, CNAME, MX, NS, SRV, and TXT. Do not include the provider's apex NS or SOA records. Child NS delegations are allowed. The evidence hash should identify the saved screenshot or exported source used for transcription.

The contract refuses an incomplete marker, a missing public baseline record, anything other than the exact five Google Workspace apex MX records, CNAME conflicts, unsupported record types, duplicate records, or a record outside the nursery domain.

## Read-only gates

Before 2FA and the private export, verify that the zone and untouched quick scan remain safe:

```bash
op run --env-file=.env.cloudflare-dns -- npm run verify:pending-zone
```

This requires 0 active records and exactly 11 temporary scan candidates. It also proves that the zone is still pending, full, free, and that public nameservers still use the four NS1 servers.

After the complete export exists, generate a private, deterministic plan:

```bash
op run --env-file=.env.cloudflare-dns -- npm run dns:plan
```

The plan command is read-only with respect to Cloudflare. It writes `private/dns/cloudflare-dns-plan.json` with mode 0600 and prints only action counts and the plan SHA-256. The private plan contains DNS record values, so it must remain gitignored.

Review the plan. It may contain only:

- Acceptance of scan candidates that exactly match the 11 positive baseline records.
- An empty scan rejection list.
- Additive posts for every export-only record and the three tracked Resend records.
- Empty delete, patch, and put lists.

## Guarded apply

Applying is deliberately a separate command. It is impossible without the complete private export, a generated private plan, and the exact approved plan hash:

```bash
op run --env-file=.env.cloudflare-dns -- npm run dns:apply -- \
  --plan private/dns/cloudflare-dns-plan.json \
  --approve-sha256 <exact-plan-sha256>
```

The command recomputes the plan from current Cloudflare and public DNS state before any provider write. It aborts if the plan, export, zone, scan, active records, token boundary, or public NS delegation changed.

Its provider allowlist contains only two POST operations:

1. Accept the approved scan candidates with `rejects: []`.
2. Batch-create the approved missing records using a body containing only `posts`.

The command has no delete, put, patch, registrar, nameserver, route, custom-domain, or zone-settings operation. It checks the public NS1 delegation before the first write, between scan acceptance and additive posts, immediately before additive posts, and after staging.

Do not run the apply command until the nursery's complete Squarespace DNS settings have been exported and reviewed.

## Staged verification

After an explicitly approved apply, run:

```bash
op run --env-file=.env.cloudflare-dns -- npm run verify:staged-dns
```

The verifier requires the exact complete record multiset, all five Google Workspace MX records, all export-only records, all three Resend records, DNS-only A, AAAA, and CNAME records, no remaining scan candidates, no extra records, pending zone status, and the unchanged public NS1 delegation. It then queries both assigned Cloudflare nameservers directly for every exported and Resend record name and type.

Passing this check does not authorize a nameserver change. Registrar delegation remains a separate, explicit cutover step after renewal, mail, Worker routing, redirects, and rollback readiness are confirmed.
