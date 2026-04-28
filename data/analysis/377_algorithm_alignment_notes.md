# 377 Algorithm Alignment Notes

## Upstream Inputs

- `372` opens Phase 7 only with carry-forward constraints.
- `373` marks `par_377` ready under `open_phase7_with_constraints`.
- `374` freezes `NHSAppIntegrationManifest`, `JourneyPathDefinition`, `JumpOffMapping`, environment tuple parity, onboarding evidence, and route inventory.
- `375` provides the bridge and embedded navigation refs consumed as opaque route metadata.
- `376` provides release guardrail and route-freeze contract refs consumed by downstream tracks.

## Implementation Alignment

- Immutable manifest repository: `InMemoryNhsAppManifestRepository`
- Supersession logic: `saveSupersedingManifest`
- Environment tuple resolution: `resolveEnvironment`
- Journey inventory lookup: `lookupJourneyPath`
- Jump-off mapping resolution: `resolveJumpOff`
- ODS visibility evaluation: `createDefaultOdsVisibilityEvaluator`
- Manifest exposure API surface: `phase7ManifestExposureRoutes`
- Evidence reference plumbing: `resolveOnboardingEvidence`
- Audit-safe records: `ManifestAuditRecord`

## Gap Closures

| Gap | Closure |
| --- | --- |
| Environment config hand-edits patient route exposure | environment pins reference immutable `manifestVersion` and `configFingerprint`; route exposure is computed from the manifest |
| Route has no owner or test plan in executable form | route lookup and exposure responses retain owner, summary, placeholder, continuity, and freeze refs |
| Mapping changes are nondeterministic by environment or cohort | jump-off resolution uses stable placement, ODS rule, cohort, environment, manifest, and config inputs |
| Manifest promotion hides missing prerequisites | degraded or absent continuity evidence returns `pending_continuity_validation` |
| Embedded entry creates a second intake family | intake routes retain `IntakeConvergenceContract:phase1-browser-and-nhsapp-shared-v1` |

## Downstream Contract

Tasks `378`, `379`, `380`, `381`, and `383` must consume this service rather than reconstructing NHS App route exposure from query hints, frontend routes, or partner notes.
