# 374 Phase 7 Manifest And Jump-Off API

## API Posture

This document freezes the API contract that `par_377` must implement. It is not a running API claim. All responses are governed by `NHSAppIntegrationManifest`, `JourneyPathDefinition`, and `JumpOffMapping` from the `par_374` contract pack.

## Endpoints

### GET `/internal/nhs-app/manifest/current`

Returns the current `NHSAppIntegrationManifest` for a named environment.

Required query:

- `environment`: one of `local_preview`, `sandpit`, `aos`, `limited_release`, `full_release`

Required behavior:

- resolve `baseUrlsByEnvironment[environment]`
- return only the manifest whose `manifestVersion`, `configFingerprint`, `releaseCandidateRef`, `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, and `compatibilityEvidenceRef` match the environment registry
- fail closed with `MANIFEST_TUPLE_DRIFT` if the same release label maps to different tuple values
- return `currentReleaseState = contract_frozen_not_promoted` until partner assurance promotes the manifest

### GET `/internal/nhs-app/journey-paths`

Returns the route inventory with classification and contract refs.

Required query:

- `manifestVersion`

Required behavior:

- include every Phase 1-6 patient-facing route family
- classify each route as exactly one of `safe_for_nhs_app_now`, `needs_embedded_adaptation_first`, or `not_suitable_in_phase7`
- include `JourneyPathDefinition` fields exactly as frozen in the registry
- expose only `safe_for_nhs_app_now` journey path IDs to the manifest

### GET `/internal/nhs-app/jump-off-mappings`

Returns mapped NHS App placements for the supplied environment, ODS code, and cohort.

Required query:

- `environment`
- `odsCode`
- `releaseCohortRef`

Required behavior:

- evaluate `odsVisibilityRule` before returning a mapping
- return mappings only when the referenced journey path is classified `safe_for_nhs_app_now`
- include the `copyVariantRef` selected for the NHS App placement
- never infer visibility from route existence alone

### POST `/internal/nhs-app/manifest/promotions:validate`

Validates a `ManifestPromotionBundle` before a manifest can move environments.

Required body fields:

- `bundleId`
- `manifestVersion`
- `environment`
- `configFingerprint`
- `releaseCandidateRef`
- `releaseApprovalFreezeRef`
- `behaviorContractSetRef`
- `surfaceSchemaSetRef`
- `compatibilityEvidenceRef`
- `approvedBy`
- `promotedAt`
- `rollbackRef`

Required behavior:

- compare the submitted tuple to `374_phase7_environment_base_url_registry.json`
- require a continuity bundle for each promoted journey path
- fail closed if any continuity evidence state is `stale` or `blocked`
- fail closed if external approval is represented as complete without SCAL, product assessment, incident rehearsal, limited-release, and connection-agreement evidence

### POST `/internal/nhs-app/continuity-evidence:validate`

Validates an `NHSAppContinuityEvidenceBundle` for one journey path.

Required body fields:

- `bundleId`
- `manifestVersionRef`
- `journeyPathRef`
- `continuityControlCode`
- `governingContractRef`
- `experienceContinuityEvidenceRefs`
- `validationState`
- `blockingRefs`
- `releaseApprovalFreezeRef`
- `capturedAt`

Required behavior:

- require `validationState` to be `trusted`, `degraded`, `stale`, or `blocked`
- require non-empty `blockingRefs` when the validation state is `stale` or `blocked`
- ensure `continuityControlCode` matches the referenced journey path
- require the same `releaseApprovalFreezeRef` as the manifest tuple

## Error Codes

| Code                            | Meaning                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `MANIFEST_TUPLE_DRIFT`          | environment tuple does not match the frozen manifest version and fingerprint |
| `JOURNEY_PATH_NOT_ELIGIBLE`     | requested route is not classified `safe_for_nhs_app_now`                     |
| `JUMP_OFF_NOT_VISIBLE`          | ODS visibility or cohort policy hides the mapping                            |
| `CONTINUITY_EVIDENCE_MISSING`   | promotion lacks the required continuity evidence bundle                      |
| `EXTERNAL_APPROVAL_NOT_CLAIMED` | partner-facing promotion is requested before external evidence exists        |
| `INTAKE_CONVERGENCE_DRIFT`      | embedded intake route is not bound to the shared `IntakeConvergenceContract` |
