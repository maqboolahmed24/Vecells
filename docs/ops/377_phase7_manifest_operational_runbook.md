# 377 Phase 7 Manifest Operational Runbook

## Purpose

Use this runbook when changing or inspecting NHS App route exposure. Route exposure must not be hand-edited in environment config or frontend code.

## Inspect Current Environment Pin

Call `resolveEnvironment` for the target environment and verify:

- `manifestVersion`
- `configFingerprint`
- `releaseApprovalFreezeRef`
- `parityState`
- `blockedReasons`

If parity is blocked, do not expose jump-off routes. Fix the manifest tuple or create a superseding manifest.

## Inspect Route Exposure

Call `getManifestExposure` and review each route's:

- `classification`
- `exposureState`
- `blockedReasons`
- `routeOwner`
- `visibilityTierRef`
- `summarySafetyTier`
- `placeholderContractRef`
- `intakeConvergenceContractRef`
- `continuityEvidenceContractRef`

Routes with `pending_continuity_validation`, `requires_embedded_adaptation`, or `route_excluded` cannot be treated as healthy NHS App entries.

## Resolve A Jump-Off

Call `resolveJumpOff` with placement, ODS code, release cohort, and environment. A resolved jump-off requires:

- matching pinned environment tuple
- placement present in the manifest
- cohort allowed in the environment
- ODS visibility rule passing
- route in `allowedJourneyPaths`
- route classification `safe_for_nhs_app_now`
- trusted continuity evidence

## Supersede Manifest

Use `saveSupersedingManifest` for a new immutable manifest version. Then use `pinEnvironment` only after the new manifest's config fingerprint and release approval freeze match the intended environment pin.

Never mutate a previous manifest in place.

## Required Operator Posture

- Missing prerequisites must remain visible as blocked reasons.
- Limited-release and full-release exposure are future gates.
- Any route freeze later applied by release guardrails must use `RouteFreezeDisposition`, not generic errors.
- Support and evidence refs must remain in the manifest response for later SCAL, AOS, and service-management workflows.
