# 376 Phase 7 Embedded Artifact And Guardrail API

## API Posture

These APIs are contract targets for later runtime work. This task freezes request and response semantics, not executable endpoints.

## Artifact APIs

### POST `/internal/nhs-app/artifacts:prepare`

Prepares an embedded artifact surface.

Required behavior:

- resolve `ArtifactPresentationContract`
- resolve `ArtifactModeTruthProjection`
- require current `BridgeCapabilityMatrix` and `PatientEmbeddedNavEligibility` in embedded mode
- return structured summary or placeholder first
- block richer preview or byte delivery when parity, masking, channel, bridge, or return tuple is stale

### POST `/internal/nhs-app/artifacts/byte-grants`

Issues an `ArtifactByteGrant`.

Required behavior:

- bind artifact, artifact surface context, artifact mode truth projection, bridge matrix, nav eligibility, selected anchor, return contract, subject-binding mode, and byte ceiling
- set `maxDownloads`
- set `expiresAt`
- reject oversized files before calling NHS App download APIs
- block grant issuance when bridge capability or nav eligibility is not live

### POST `/internal/nhs-app/artifacts/transfers:settle`

Settles a byte delivery, overlay handoff, external browser handoff, or secure-send-later fallback.

Required behavior:

- compare transfer tuple to the latest `ArtifactModeTruthProjection.truthTupleHash`
- classify outcome as transferred, returned, expired, blocked, or recovery required
- keep last safe summary visible when return tuple or grant state is stale

## Degraded Mode APIs

### GET `/internal/nhs-app/degraded-mode/:journeyPathId`

Returns `ChannelDegradedMode` for a route.

Required behavior:

- resolve shared `PatientDegradedModeProjection` first
- bind `RouteFreezeDisposition` and `ReleaseRecoveryDisposition`
- return one primary action and support code
- never widen shared actionability for embedded copy

### GET `/internal/nhs-app/errors/:errorCode`

Returns one `EmbeddedErrorContract`.

Required behavior:

- map error to category, retry mode, preferred exit, message ref, and support code
- avoid generic maintenance copy for route freezes, unsupported actions, and missing context
- preserve last safe summary and route anchor where policy allows

## Accessibility APIs

### GET `/internal/nhs-app/accessibility/routes/:journeyPathId`

Returns `AccessibilitySemanticCoverageProfile` plus UI-state coverage.

Required behavior:

- include loading, empty, warning, success, and error state refs
- include keyboard, focus, assistive announcement, timeout recovery, freshness, automation-anchor, and design-publication refs
- include visualization fallback and table contracts where visual summaries exist

## Environment And Release APIs

### GET `/internal/nhs-app/environments/:environment`

Returns `NHSAppEnvironmentProfile`.

Required behavior:

- pin base URL, manifest version, config fingerprint, release candidate, release approval freeze, behavior set, surface schema set, compatibility evidence, telemetry namespace, cohorts, and guardrail policy
- fail closed on tuple drift

### GET `/internal/nhs-app/telemetry/contracts`

Returns `ChannelTelemetryPlan` and `TelemetryEventContract` rows.

Required behavior:

- expose allowed fields and prohibited fields
- block fields not explicitly listed
- map events to monthly data packs and cohort breakdowns

### POST `/internal/nhs-app/release-freezes:evaluate`

Evaluates `ReleaseGuardrailPolicy`.

Required behavior:

- open `ChannelReleaseFreezeRecord` when telemetry is missing, thresholds breach, assurance slices degrade, compatibility drifts, or continuity evidence becomes stale
- block cohort expansion while freeze is active
- activate route-freeze policy matrix without redeploy

## Error Codes

| Code                                | Meaning                                                               |
| ----------------------------------- | --------------------------------------------------------------------- |
| `ARTIFACT_SUMMARY_REQUIRED`         | richer artifact action attempted before summary or placeholder exists |
| `BYTE_GRANT_REQUIRED`               | byte transfer attempted without current `ArtifactByteGrant`           |
| `ARTIFACT_TOO_LARGE_FOR_WEBVIEW`    | byte size exceeds bridge capability ceiling                           |
| `PRINT_UNSUPPORTED_IN_WEBVIEW`      | print path attempted in embedded mode                                 |
| `OUTBOUND_GRANT_REQUIRED`           | overlay or external browser handoff lacks `OutboundNavigationGrant`   |
| `CHANNEL_DEGRADED_MODE_REQUIRED`    | embedded degradation attempted without shared degraded truth          |
| `TELEMETRY_FIELD_BLOCKED`           | telemetry contains a field outside the allowlist                      |
| `ROUTE_FREEZE_DISPOSITION_REQUIRED` | freeze attempted without patient-facing route disposition             |
| `RELEASE_GUARDRAIL_FREEZE_ACTIVE`   | cohort or route is frozen by guardrail policy                         |
