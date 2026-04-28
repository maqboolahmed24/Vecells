# 211 patient action routing and settlement controls

Task: `par_211_crosscutting_track_backend_build_request_browsing_detail_and_typed_patient_action_routing_projections`

## Fail-closed routing

Patient mutations must resolve a `PatientActionRoutingProjection` before any domain command can run. The routing projection binds the governing request, current request version, route family, route intent binding, capability lease, writable eligibility fence, policy bundle, return bundle, continuity evidence, freshness token, and action type.

If any of those bindings are stale or blocked, `blockedReasonRef` is populated and `routeTargetRef` is null.

## Visibility and placeholder discipline

Request detail never silently omits a branch because the richer child projection is missing. `PatientRequestDownstreamProjection.placeholderPosture` records one of:

- `none`
- `step_up_required`
- `read_only`
- `identity_hold`
- `release_delay`
- `sibling_projection_missing`

The task publishes `PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json` so task 212 can replace the current more-info, callback, and contact-repair placeholders without breaking return-bundle or routing semantics.

## One dominant action

`PatientNextActionProjection` is the only source for a live dominant request CTA. It can return `live`, `read_only`, `blocked`, or `recovery_required`. Stale optimistic actions are suppressed when:

- coverage narrows,
- identity hold activates,
- recovery is required,
- command consistency is pending,
- a safety interruption is active,
- writable eligibility is closed.

## Settlement honesty

`PatientActionSettlementProjection` does not collapse local feedback into final success. It distinguishes:

- `local_acknowledged`
- `pending_authoritative_confirmation`
- `external_observation_received`
- `authoritative_outcome_settled`
- `disputed_recovery_required`

The request shell may show a pending or recovery state, but calm completion requires authoritative settlement.

## Safety interruption

`PatientSafetyInterruptionProjection` can override the active action route when late evidence changes the safety posture. It preserves the selected request anchor and suppresses mutating controls until the safety epoch clears or routes to urgent help.

## Same-shell continuity

`PatientRequestReturnBundle` preserves selected anchor, filter, disclosure posture, scroll state where allowed, return route, lineage tuple, and continuity evidence. Recovery and identity-hold states degrade in place and keep this return context.

## Data minimization

The projections expose patient-safe labels, refs, hashes, posture names, and governed placeholders. They do not expose raw identifiers, raw contact values, raw session claims, cookies, local storage, or route-local controller joins.

## Evidence

- `data/analysis/211_request_lineage_ordering_and_action_matrix.csv`
- `data/analysis/211_request_route_settlement_and_recovery_cases.json`
- `data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json`
- `services/command-api/tests/patient-request-projection-stack.integration.test.js`
- `tests/playwright/211_request_lineage_action_atlas.spec.js`
- `tools/analysis/validate_patient_request_projection_stack.py`
