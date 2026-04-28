# Phase 7 Route Readiness And Promotion Verifier

Task 383 adds `Phase7NHSAppRouteReadinessAndPromotionVerifier` as the backend gate between the NHS App manifest inventory and any route promotion decision. The service does not treat a manifested route as ready by default. It synthesizes a route verdict from the pinned release tuple, continuity evidence, accessibility evidence, compatibility evidence, bridge support, and embedded UI state.

## Runtime Model

The verifier layers on `Phase7NhsAppManifestAndJumpOffService` and keeps four explicit registries:

- `NHSAppContinuityEvidenceBundle` store: validates route continuity control code, governing contract, evidence refs, freeze ref, validation state, blocking refs, supersession, and freshness.
- `AccessibleContentVariant` registry: records WCAG 2.2 AA, NHS service manual alignment, recovery copy, mobile readiness, ARIA pattern refs, and accessibility audit refs per journey path.
- `AuditEvidenceReference` resolver: resolves route and global evidence for accessibility, continuity, compatibility, bridge support, shell semantics, and artifact delivery.
- `UIStateContract` registry: declares embedded shell support, placeholder support, safe area handling, host resize, reduced motion, semantic coverage, interaction posture, and required bridge actions.

`BridgeSupportProfile` is separated from UI state so a route can have correct UI semantics while still failing bridge promotion because the currently verified NHS App JS API capability floor does not support one of its actions.

## Verdicts

The route-level `RouteReadinessVerdict` values are:

- `ready`: release tuple matches and all continuity, accessibility, compatibility, bridge, and UI state checks are current.
- `conditionally_ready`: the route can run in sandpit or controlled preview, but promotion still needs a named observation to close.
- `placeholder_only`: adaptation-first route has a safe, accessible placeholder/summary contract but is not promotable as a live embedded route.
- `blocked`: release tuple drift, bridge mismatch, incompatible UI state, missing placeholder contract, or out-of-scope route.
- `evidence_missing`: required continuity, accessibility, compatibility, or UI state evidence is absent or stale.

Missing evidence is always explicit. The verifier emits reason codes including `accessibility_audit_missing`, `continuity_evidence_stale`, `bridge_support_mismatch`, `release_tuple_drift`, `placeholder_contract_missing`, and `incompatible_ui_state`.

## Promotion Gate

`verifyPromotionReadiness` evaluates each requested journey path and returns `promotable` only when every route is `ready`, unless the caller explicitly allows `conditionally_ready` routes for non-production rehearsals. `placeholder_only`, `blocked`, and `evidence_missing` always block promotion. The output includes `failureReasonsByRoute`, aggregate failure reasons, and a promotion tuple hash so release evidence can be reconciled without exposing patient data.

## Seeded Outcomes

The deterministic seed covers all required states:

- `jp_pharmacy_status`: `ready`
- `jp_manage_local_appointment`: `conditionally_ready`
- `jp_request_status`: `evidence_missing`
- `jp_records_letters_summary`: `placeholder_only`
- `jp_waitlist_offer_response`: `blocked`
- `jp_urgent_emergency_advice`: `blocked`

This gives the promotion verifier positive, conditional, placeholder, missing-evidence, and hard-block cases without relying on external systems.
