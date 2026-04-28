# Phase 7 External Entry Resolution API

Track: `par_380`

## Routes

The command API route catalog includes:

- `GET /internal/v1/nhs-app/site-links/manifest`
- `POST /internal/v1/nhs-app/external-entry/grants:issue`
- `POST /internal/v1/nhs-app/external-entry:resolve`
- `GET /.well-known/assetlinks.json`
- `GET /.well-known/apple-app-site-association`

## Issue Grant

`issueExternalEntryGrant(input)` accepts:

- `environment`
- `entryMode`
- `journeyPathId`
- `incomingPath`
- `governingObjectRef`
- `governingObjectVersionRef`
- `sessionEpochRef`
- `subjectBindingVersionRef`
- `lineageFenceRef`
- optional `subjectRef`, `opaqueToken`, `issueIdempotencyKey`, `routeIntentBindingRef`

The response includes the canonical `AccessGrantRecord`, `AccessGrantScopeEnvelopeRecord`, materialized token only on first issue, route definition, route tuple, route-intent binding ref, and audit record.

## Resolve Entry

`resolveExternalEntry(input)` accepts:

- `environment`
- `entryMode`
- `incomingPath`
- `presentedToken`
- `governingObjectRef`
- `governingObjectVersionRef`
- `lineageFenceRef`
- optional expected `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `routeFamilyRef`
- `currentSession`
- optional `draftResume`

The response includes:

- `outcome`: `resolved_full`, `summary_only`, `placeholder_only`, `verification_required`, `bounded_recovery`, or `denied`
- `routeInstruction`
- `grantFenceState`
- `subjectBindingFenceState`
- `draftResumeFenceState`
- `sessionRecoveryDecision`
- canonical redemption result
- audit record

## Response Safety

`routeInstruction.includePhi` is true only for `resolved_full`. Recovery, placeholder, replay, expiry, drift, and subject mismatch responses never carry PHI and always identify the summary or placeholder contract to render.

## Association Responses

`exportAndroidAssetLinks` returns Android App Links JSON for `/.well-known/assetlinks.json`.

`exportIosAssociation` returns Universal Links JSON for `/.well-known/apple-app-site-association`.

Both exports are derived from environment manifest truth and include no user or request data.
