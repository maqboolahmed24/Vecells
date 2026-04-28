# Phase 7 External Entry And Site Link Service

Track: `par_380`

## Purpose

`Phase7ExternalEntryResolutionService` owns canonical deep-link, NHS App site-link, secure-link, email/SMS continuation, and return-to-journey entry resolution. It does not mint a parallel link authority. Every usable entry token is issued and redeemed by `AccessGrantService`, with the Phase 7 manifest and route-intent tuple treated as immutable scope.

## Components

- `SiteLinkManifest` is generated from `Phase7NhsAppManifestAndJumpOffService` and includes route patterns, exposure state, summary safety tier, placeholder contract, Android asset-link ref, iOS association ref, and environment binding refs.
- `ExternalEntryGrantIssuance` wraps `AccessGrantService.issueGrant` and persists only token hashes through the canonical service.
- `ExternalEntryResolutionResult` wraps `AccessGrantService.redeemGrant`, subject-binding checks, session recovery decisions, draft-resume fences, and safe route instructions.
- `LinkResolutionAudit` records hash-only URL evidence, grant fence state, subject-binding fence state, draft fence state, outcome metrics, and no raw token or URL material.

## Resolution Flow

1. Resolve the incoming path against `SiteLinkManifest`.
2. Redeem the presented token through `AccessGrantService`.
3. Validate manifest version, route family, session epoch, and subject binding version before any return intent is honored.
4. Enforce subject binding and assurance before PHI is released.
5. Enforce draft resume continuity: the resumed draft must still bind the same `SubmissionIngressRecord`.
6. If a draft is already promoted, route to the request shell and never reopen mutable draft state.
7. For replay, expiry, supersession, drift, blocked route exposure, or missing assurance, return a bounded recovery or placeholder route instead of a generic home page.

## Route Law

Site links and secure links share the same grant law. Channel posture differs (`embedded`, `secure_link`, or `sms`), but route family, action scope, governing object, session epoch, subject binding, lineage fence, release freeze, manifest version, audience, and visibility all stay inside the `AccessGrantService` scope envelope.

## Association Exports

The Android `/.well-known/assetlinks.json` and iOS `/.well-known/apple-app-site-association` exports are generated from the same `SiteLinkManifest`. Package names, certificate refs, app IDs, base URLs, and allowed paths are environment-specific and not hand-maintained separately.

## Failure Posture

The service fails closed into explicit states:

- `verification_required` for missing session or insufficient assurance.
- `bounded_recovery` for replay, expiry, supersession, route tuple drift, manifest drift, and promoted draft recovery.
- `placeholder_only` for inventory or blocked routes.
- `denied` for subject mismatch or unknown/revoked grants.

All response instructions include `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.
