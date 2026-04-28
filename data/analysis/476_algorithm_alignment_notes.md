# Task 476 Algorithm Alignment Notes

- Loaded the release candidate tuple, runtime publication bundle, publication parity record, Phase 7 reconciliation, task 474 migration/cutover evidence, and task 475 BAU/runbook evidence.
- Wave 1 is the smallest safe blast radius: one synthetic tenant cohort, core web/staff/hub only, pharmacy dispatch excluded, NHS App exposure zero, and assistive visible mode zero.
- Every wave binds a tenant selector, channel scope, assistive scope, guardrail snapshot, observation policy, rollback binding, manual fallback binding, communication plan, and eligibility verdict.
- The manifest carries an approved-plan state but keeps activation and widening fail-closed until future signoff, disaster-recovery smoke, promotion settlement, and observation settlement records are current.
- Guardrails include latency, error budget, incident ceiling, projection lag, support load, clinical safety signal, and channel-specific constraints.
- Required edge cases are explicit records: core web without NHS App, patient routes without pharmacy dispatch, narrow assistive visible cohort, superseded runtime bundle, reference-data rollback gap, too-short observation, and selector widening after regrouping.
- No route, channel, tenant, cohort, or assistive exposure is controlled by informal feature flags; every exposure is typed and hash-bound.

Release candidate: RC_LOCAL_V1
Runtime publication bundle: rpb::local::authoritative
Release watch tuple hash: 9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779
