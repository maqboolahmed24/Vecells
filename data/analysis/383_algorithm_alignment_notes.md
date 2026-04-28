# 383 Algorithm Alignment Notes

The route readiness algorithm is intentionally fail-closed.

## Inputs

For each journey path the verifier resolves:

- manifest route exposure and release tuple
- `NHSAppContinuityEvidenceBundle`
- `AccessibleContentVariant`
- route and global `AuditEvidenceReference`
- `UIStateContract`
- active `BridgeSupportProfile`

## Failure Reason Mapping

- `release_tuple_drift`: expected manifest version, config fingerprint, release candidate, release freeze, behavior contract, surface schema, or compatibility evidence does not match the pinned Phase 7 tuple.
- `continuity_evidence_missing`: no route-level continuity bundle exists.
- `continuity_evidence_stale`: continuity bundle is degraded, stale, superseded, blocked, or too old.
- `accessibility_audit_missing`: accessible content variant is absent, not verified, incomplete, or points to missing/failed/stale audit evidence.
- `compatibility_evidence_missing`: compatibility, bridge support, or shell semantic evidence is absent or not current.
- `ui_state_contract_missing`: no route-level UI state contract exists.
- `incompatible_ui_state`: UI contract lacks embedded-safe semantics, host resize, safe area, reduced motion, or is explicitly incompatible.
- `bridge_support_mismatch`: route requires a bridge action not in the current verified support profile.
- `placeholder_contract_missing`: adaptation-first route lacks a placeholder contract or the UI state does not support placeholders.
- `route_requires_embedded_adaptation`: route is tracked as adaptation-first and can only be placeholder-only until upgraded.
- `route_not_suitable`: route is out of Phase 7 NHS App scope.
- `manual_observation_pending`: route evidence is otherwise coherent but still conditional.
- `promotion_policy_not_ready`: promotion was requested for a non-ready route.

## Verdict Precedence

1. Hard blockers win: release drift, route not suitable, incompatible UI state, bridge mismatch, or missing placeholder contract returns `blocked`.
2. Missing or stale required evidence returns `evidence_missing`.
3. Adaptation-first routes with current placeholder evidence return `placeholder_only`.
4. Conditional audit/UI state returns `conditionally_ready`.
5. Fully current evidence returns `ready`.

Promotion is `promotable` only when every route is `ready`, except that non-production callers may explicitly allow `conditionally_ready` routes.
