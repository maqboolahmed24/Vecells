# 376 Phase 7 Webview Limit Accessibility And Release Rules

## Artifact Rules

- Structured summary is the default patient-facing artifact mode.
- Download, print, overlay, and external browser actions are secondary and governed.
- Conventional browser download is not assumed in NHS App webview.
- Browser print is not exposed in embedded mode.
- `ArtifactByteGrant` is required before byte delivery.
- `OutboundNavigationGrant` is required before overlay or external browser handoff.
- Oversized or unsupported artifacts must route to secure-send-later, safe-browser-handoff, placeholder, or recovery before unsupported transfer is attempted.
- Stale byte grants, stale outbound grants, stale parity, stale masking, stale bridge capability, or stale return tuple must keep the last safe summary visible and remove richer actions.

## Degraded Mode Rules

- Embedded degraded mode may adapt copy only.
- Embedded degraded mode may not hide the stricter shared degraded truth.
- Channel-specific copy may not widen actionability, audience visibility, artifact access, or mutation posture.
- Missing context, invalid SSO, expired links, file unavailable, unsupported action, bridge unavailable, telemetry missing, and active freeze states require explicit `EmbeddedErrorContract` rows.

## Accessibility Rules

- WCAG 2.2 AA is the minimum target for NHS App integrated routes.
- Manual assistive technology and device-lab testing remain required before limited release.
- Accessibility coverage is represented by `AccessibilitySemanticCoverageProfile`, `UIStateContract`, `AccessibleContentVariant`, and `AuditEvidenceReference`.
- Each embedded route must publish keyboard, focus, assistive announcement, timeout recovery, freshness, automation-anchor, state semantics, and design publication refs.
- Visual summaries require non-colour cues and table-first fallback.
- Accessibility evidence may be automated, manual, screen-reader, device-lab, or user-research based, but automated checks alone are not enough.

## Telemetry Rules

- Telemetry is allowlist-only.
- Raw JWTs, `assertedLoginIdentity`, access grant tokens, grant identifiers, NHS numbers, raw patient IDs, PHI-bearing query strings, patient free text, and artifact names that disclose sensitive detail are prohibited.
- Monthly data packs must be generated from the same telemetry contracts that power limited-release guardrails.
- Proof artifacts and browser traces must apply the same redaction policy as production telemetry.

## Release Rules

- Sandpit, AOS, limited release, and full release inherit the manifest tuple frozen in `par_374`.
- SCAL, clinical safety, privacy, incident rehearsal, connection agreement, limited-release plan, and live rollback rehearsal are future external controls, not complete evidence in this pack.
- Guardrail freezes must block cohort expansion and render patient-facing route-freeze dispositions.
- Kill switches must work without redeploy.
- Change notices are required for journey changes and must name affected journeys and manifest version.
- Route or cohort freeze state must never appear as a healthy normal journey.
