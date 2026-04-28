# 374 Phase 7 Manifest Change Control And Onboarding Rules

## Policy Summary

The Phase 7 NHS App onboarding pack is contract-frozen, not partner-approved. All route exposure, jump-off placement, and environment promotion decisions must read from the frozen manifest tuple and evidence pack.

## Onboarding Rules

1. Submit expression-of-interest and product assessment material only after this manifest pack is internally complete.
2. Treat NHS App Sandpit and AOS as separate assurance environments with the same manifest tuple unless a superseding manifest is approved.
3. Do not represent SCAL, clinical safety, privacy, incident rehearsal, connection agreement, limited release, or full release as complete in this repository until external evidence exists.
4. Keep `requiresNhsLogin = true` for all first-wave NHS App routes.
5. Keep `supportsEmbeddedMode = true` only when the route also has bridge, navigation, continuity, artifact, and fallback contracts.

## Change Control

Any change to the manifest tuple requires:

- a new `manifestVersion`
- a new `configFingerprint`
- a `changeNoticeRef`
- a refreshed `ManifestPromotionBundle`
- refreshed `NHSAppContinuityEvidenceBundle` rows for every promoted path
- explicit review of route classification, ODS visibility, copy variant, cohort, and rollback impact

Minor copy changes to jump-off content still require a change notice and Integration Manager notification before partner-facing release. New functionality or new service journeys require a new product-assessment path and must not ride under the previous tuple.

## Route Exposure Rules

- Route existence is not eligibility.
- Only `safe_for_nhs_app_now` routes may appear in `NHSAppIntegrationManifest.allowedJourneyPaths`.
- `needs_embedded_adaptation_first` routes may be documented in the inventory, but must not have active jump-off mappings.
- `not_suitable_in_phase7` routes must stay absent from NHS App placements.
- ODS and cohort visibility must be encoded in `JumpOffMapping`, not in route handlers.

## Environment Parity Rules

The same release label must not point to different base URL, manifest, bridge, behavior, surface schema, or compatibility tuples across environments. If any row drifts:

- block promotion
- keep the current manifest in `contract_frozen_not_promoted` or `promotion_blocked`
- create a superseding manifest
- preserve the old manifest as auditable history

## Continuity And Intake Rules

Promotion requires trusted or explicitly degraded continuity evidence for every exposed journey path. `stale` and `blocked` continuity states prevent promotion.

Medical intake, admin intake, and draft continuation must all bind to the same `IntakeConvergenceContract` used by browser intake. NHS App embedded context can change shell behavior and SSO proof, but it must not create a separate intake payload, safety shortcut, receipt grammar, or draft authority.

## Service Desk Rules

The service desk profile must be public-facing, reviewed, and linked to the incident path before partner-facing assurance. Major incident, clinical safety, privacy, and service management contacts must be independently traceable in the evidence pack.
