# 376 Phase 7 Artifact Accessibility And Guardrail Contracts

## Contract Boundary

This pack freezes the `par_376` safety and release envelope for the NHS App channel. It owns embedded artifact delivery, degraded mode, accessibility semantic coverage, telemetry privacy, SCAL evidence, environment profiles, limited-release guardrails, and route-freeze policy.

It does not implement executable file delivery, bridge wrapper behavior, continuity evidence promotion checks, or environment pipelines. Those are owned by later Phase 7 runtime tracks.

The current posture remains `open_phase7_with_constraints`. NHS App limited release, SCAL sign-off, incident rehearsal, connection agreement, and widened live rollback rehearsal are not claimed here.

## Artifact Delivery

`BinaryArtifactDelivery` and `ArtifactByteGrant` narrow the canonical `ArtifactPresentationContract`; they never widen it.

Every embedded artifact route must:

- resolve the static `ArtifactPresentationContract`
- resolve current `ArtifactModeTruthProjection`
- prefer structured summary or governed placeholder before byte delivery
- validate `BridgeCapabilityMatrix` and `PatientEmbeddedNavEligibility`
- use `ArtifactByteGrant` before byte transfer
- use `OutboundNavigationGrant` before overlay or external browser handoff
- materialize an `ArtifactTransferSettlement` in later runtime work

Conventional browser download and print behavior are not valid assumptions inside the NHS App webview. Unsupported or oversized artifacts must fall back before transfer is attempted.

## Degraded Mode

`ChannelDegradedMode` is an embedded copy adapter over already-resolved shared truth. It may change wording, support guidance, or primary action emphasis, but it may not widen actionability or hide the stricter `PatientDegradedModeProjection`, `RouteFreezeDisposition`, `ReleaseRecoveryDisposition`, or `ArtifactFallbackDisposition`.

Embedded errors are represented by `EmbeddedErrorContract`. Missing context, invalid SSO, expired links, file unavailable, bridge unavailable, unsupported action, route freeze, and telemetry-missing states all map to explicit patient-facing dispositions.

## Accessibility Coverage

Accessibility is a first-class contract family, not an appendix. Each embedded route publishes:

- explicit `UIStateContract` rows for loading, empty, warning, success, and error
- `AccessibilitySemanticCoverageProfile`
- `AccessibleContentVariant`
- `AuditEvidenceReference`
- keyboard, focus, assistive announcement, timeout recovery, freshness, and automation-anchor bindings
- visualization fallback and table parity where visual summaries exist

The route may not claim embedded complete while manual assistive testing, device-lab checks, screen-reader review, or WCAG 2.2 AA evidence are missing.

## Environment And Release Guardrails

`NHSAppEnvironmentProfile` binds each environment to:

- base URL
- manifest version
- config fingerprint
- release candidate
- release approval freeze
- behavior contract set
- surface schema set
- compatibility evidence
- telemetry namespace
- guardrail policy

Environment rows inherit the tuple frozen in `par_374`. Sandpit, AOS, limited release, and full release may not drift silently under the same manifest version.

`ReleaseGuardrailPolicy` and `ChannelReleaseFreezeRecord` control limited release. If telemetry is missing, thresholds are breached, required assurance slices degrade, compatibility drifts, or continuity evidence becomes stale, cohort expansion freezes and the affected routes render through `RouteFreezeDisposition`.

## Telemetry Privacy

Telemetry contracts are allowlist-only. If a field is not explicitly allowed, it is blocked.

Allowed telemetry is pseudonymous, route-level, and release-governance focused. Prohibited telemetry includes:

- raw JWTs
- `assertedLoginIdentity`
- access grant tokens or grant identifiers
- NHS number
- raw patient identifiers
- PHI-bearing query strings
- free text submitted by the patient
- full artifact names when they reveal condition, medication, or identity

## Gap Closures

| Gap | Freeze rule |
| --- | --- |
| Desktop browser assumptions survive in webview | download, print, overlay, and external browser behavior require bridge capability, byte grants, or outbound grants |
| Frozen route becomes generic error | every freeze maps to `RouteFreezeDisposition` with patient message, safe route, and support recovery |
| Degraded mode invents calmer NHS-App-only state | `ChannelDegradedMode` narrows copy only and inherits shared degraded truth |
| Accessibility audit is an appendix | accessibility profiles, UI states, audit evidence, and semantic coverage are machine-readable contracts |
| Telemetry or proof leaks JWTs or PHI-bearing query strings | telemetry fields are allowlist-only and prohibited fields are explicit |
| Limited release is operationally gated but not patient-facing | freeze records and kill switches degrade patient routes through declared route-freeze policy |

## Downstream Handoff

`par_382` consumes artifact delivery and byte grant contracts. `par_383` consumes continuity and promotion guardrails. `par_384` consumes degraded-mode and error-copy contracts. `par_385` consumes environment, SCAL, telemetry, and release guardrail contracts. Later frontend tracks consume accessibility and UI-state coverage.
