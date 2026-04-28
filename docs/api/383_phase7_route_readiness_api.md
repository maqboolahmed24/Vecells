# Phase 7 Route Readiness API

All endpoints are internal command-api contracts and return refs, hashes, verdicts, and summaries only.

## `GET /internal/v1/nhs-app/readiness/routes`

Lists readiness for the tracked Phase 7 NHS App route set. Query inputs map to `EvaluateRouteReadinessInput` without `journeyPathId`: `environment`, `expectedManifestVersion`, `expectedConfigFingerprint`, release tuple refs, and `now`.

Response body:

- `schemaVersion`: `383.phase7.route-readiness.v1`
- `routeResults`: array of `RouteReadinessResult`
- each route includes `verdict`, `failureReasons`, `releaseTuple`, and evidence refs for continuity, accessibility, audit, UI state, and bridge support.

## `GET /internal/v1/nhs-app/readiness/routes/{journeyPathId}`

Evaluates one journey path. The contract fails closed: unknown journey paths return `evidence_missing` with `manifest_route_missing`, `continuity_evidence_missing`, `accessibility_audit_missing`, and `ui_state_contract_missing`.

## `GET /internal/v1/nhs-app/readiness/evidence`

Returns the current evidence inventory:

- `NHSAppContinuityEvidenceBundle[]`
- `AccessibleContentVariant[]`
- `AuditEvidenceReference[]`
- `UIStateContract[]`
- active `BridgeSupportProfile`

The inventory endpoint is for release assurance and test fixtures. It is not a patient-facing projection.

## `POST /internal/v1/nhs-app/readiness:verify-promotion`

Request:

```json
{
  "environment": "sandpit",
  "journeyPathIds": ["jp_pharmacy_status"],
  "expectedManifestVersion": "nhsapp-manifest-v0.1.0-freeze-374",
  "expectedConfigFingerprint": "sha256:374-manifest-tuples-f488ecd-local-freeze-v1",
  "expectedReleaseApprovalFreezeRef": "ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE",
  "allowConditionallyReadyRoutes": false
}
```

Response:

```json
{
  "schemaVersion": "383.phase7.route-readiness.v1",
  "promotionState": "promotable",
  "environment": "sandpit",
  "aggregateFailureReasons": [],
  "failureReasonsByRoute": {
    "jp_pharmacy_status": []
  }
}
```

Promotion is blocked when any route has `placeholder_only`, `blocked`, or `evidence_missing`. `conditionally_ready` also blocks unless `allowConditionallyReadyRoutes` is set for a non-production rehearsal.
