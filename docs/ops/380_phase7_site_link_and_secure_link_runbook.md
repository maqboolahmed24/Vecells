# Phase 7 Site Link And Secure Link Runbook

Track: `par_380`

## Normal Checks

1. Confirm `GET /internal/v1/nhs-app/site-links/manifest` returns the expected manifest version, release freeze, base URL, and path set.
2. Confirm `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` match the current environment binding refs.
3. Issue a test grant through `/internal/v1/nhs-app/external-entry/grants:issue`.
4. Resolve it once through `/internal/v1/nhs-app/external-entry:resolve`.
5. Replay the same token and confirm the second request returns bounded recovery with `includePhi=false`.

## Incident Triage

- `not_presented`: the link did not include a usable grant token. Route the user to verification or secure reissue.
- `expired`: confirm grant TTL and continuation resend rules.
- `replayed`: do not reopen the target. Use same-lineage recovery or ask the user to open a fresh link.
- `drifted`: compare manifest version, route family, session epoch, subject binding version, release freeze, and lineage fence.
- `subject_mismatch`: terminate re-entry for that link and require fresh authentication.
- `draft_promoted_request_shell_only`: route to the promoted request shell. Do not mutate or reopen the draft.

## Rollback

1. Pin affected environment routes to placeholder or inventory-only in the Phase 7 manifest service.
2. Keep association files available so mobile operating systems do not cache 404s.
3. Revoke or expire affected grants through `AccessGrantService` if token scope is unsafe.
4. Monitor `phase7.external_entry.grant_fence.*` and `phase7.external_entry.outcome.*` metrics.

## Privacy And Audit

Audit records must retain only hashes for URLs and canonical token hashes from `AccessGrantService`. Raw `token`, `code`, `assertedLoginIdentity`, and `asserted_login_identity` query values are redacted before audit hashing. Recovery responses must include `Cache-Control: no-store`.
