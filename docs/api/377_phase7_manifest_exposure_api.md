# 377 Phase 7 Manifest Exposure API

## Service

`createDefaultPhase7NhsAppManifestApplication()` returns the local deterministic application service.

Primary export:

```ts
import { createDefaultPhase7NhsAppManifestApplication } from "./phase7-nhs-app-manifest-service";
```

## Routes

The command API route catalog includes:

| Route ID                                  | Method | Path                                                 | Contract                                     |
| ----------------------------------------- | ------ | ---------------------------------------------------- | -------------------------------------------- |
| `phase7_nhs_app_manifest_current`         | GET    | `/internal/v1/nhs-app/manifest/current`              | `NHSAppIntegrationManifestExposureContract`  |
| `phase7_nhs_app_journey_path_lookup`      | GET    | `/internal/v1/nhs-app/journey-paths/{journeyPathId}` | `JourneyPathDefinitionLookupContract`        |
| `phase7_nhs_app_jump_off_resolve`         | POST   | `/internal/v1/nhs-app/jump-offs:resolve`             | `JumpOffMappingResolutionContract`           |
| `phase7_nhs_app_environment_resolve`      | GET    | `/internal/v1/nhs-app/environments/{environment}`    | `NHSAppEnvironmentProfileResolutionContract` |
| `phase7_nhs_app_onboarding_evidence_refs` | GET    | `/internal/v1/nhs-app/onboarding/evidence`           | `IntegrationEvidencePackReferenceContract`   |

## `resolveEnvironment`

Input:

- `environment`
- optional `expectedManifestVersion`
- optional `expectedConfigFingerprint`
- optional `expectedReleaseApprovalFreezeRef`

Output:

- `baseUrl`
- pinned `manifestVersion`
- pinned `configFingerprint`
- pinned `releaseApprovalFreezeRef`
- `parityState`
- `blockedReasons`
- audit record

## `resolveJumpOff`

Input:

- `environment`
- `nhsAppPlacement`
- `odsCode`
- `releaseCohortRef`
- optional expected manifest tuple fields

Output:

- `status = resolved | blocked`
- `exposureState = exposed | blocked | inventory_only | excluded`
- `blockedReasons`
- matched `JumpOffMapping`
- matched `JourneyPathDefinition`
- `jumpOffUrlTemplate`
- `copyVariantRef`
- route metadata refs
- audit record

Blocked reasons are deterministic and machine-readable. The service never exposes a route because code exists elsewhere in the product.

## `getManifestExposure`

Returns the environment tuple, release tuple, route inventory, jump-off mappings, evidence pack ref, and service desk profile ref. Route rows retain owner, visibility, summary safety, placeholder, intake convergence, continuity, and route-freeze refs for downstream tasks.

## Audit Safety

Audit records hash ODS code values and never include raw patient identifiers, JWTs, access grants, PHI-bearing query strings, or patient-submitted free text.
