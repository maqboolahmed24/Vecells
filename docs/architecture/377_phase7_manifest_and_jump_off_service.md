# 377 Phase 7 Manifest And Jump-Off Service

## Boundary

`Phase7NhsAppManifestAndJumpOffService` is the executable backend kernel for NHS App route exposure. It consumes the frozen `374` manifest contracts and serves one authoritative manifest truth to later embedded context, SSO, bridge, continuity, release, and frontend tracks.

The implementation lives in `services/command-api/src/phase7-nhs-app-manifest-service.ts`. It is intentionally production-shaped but local and deterministic: no live NHS App onboarding approval, SCAL sign-off, limited release, or full release is claimed.

## Owned Capabilities

- immutable `NHSAppIntegrationManifest` storage keyed by `manifestVersion`
- explicit supersession chains through `supersedesManifestId`
- environment pins for `baseUrl`, `manifestVersion`, `configFingerprint`, and `releaseApprovalFreezeRef`
- journey-path inventory lookup for every manifest and inventory-only route
- deterministic `JumpOffMapping` resolution by placement, ODS visibility rule, release cohort, environment, and release tuple
- onboarding and evidence-pack reference resolution
- audit-safe records for manifest lookup, environment resolution, journey lookup, jump-off resolution, supersession, and evidence lookup

## Exposure Law

Patient-visible NHS App exposure is never read from mutable environment notes or frontend route code. It flows from:

1. the pinned immutable manifest version
2. the pinned config fingerprint
3. the release approval freeze ref
4. the route's presence in `allowedJourneyPaths`
5. route classification and metadata
6. jump-off placement mapping
7. cohort and ODS visibility evaluation
8. current continuity evidence

If any part of that chain is missing or stale, the service returns a blocked posture with machine-readable reasons such as `not_in_manifest`, `cohort_blocked`, `environment_mismatch`, `requires_embedded_adaptation`, or `pending_continuity_validation`.

## Route Metadata Preservation

Every manifest response preserves route owner and downstream-required metadata:

- `visibilityTierRef`
- `summarySafetyTier`
- `placeholderContractRef`
- `intakeConvergenceContractRef`
- `continuityEvidenceContractRef`
- `routeFreezeDispositionRef`

Intake-start and draft-resume routes retain `IntakeConvergenceContract:phase1-browser-and-nhsapp-shared-v1`; the embedded channel cannot create a second intake family.

## Supersession

New manifest versions are accepted only through `saveSupersedingManifest`. The new manifest must:

- use a unique `manifestId`
- use a unique `manifestVersion`
- point `supersedesManifestId` at an existing manifest
- keep the release tuple coherent
- carry a `sha256:` config fingerprint

Existing manifests are never mutated. Environments move to a new manifest only through `pinEnvironment`, which validates the manifest version, config fingerprint, and release approval freeze.

## Non-Production Safety

The seed data is local contract evidence only. Sandpit, AOS, limited release, and full release remain pinned to the same manifest tuple but are not externally approved. Limited-release and full-release exposure remains blocked until later approval and release guardrail work satisfies the declared contract refs.
