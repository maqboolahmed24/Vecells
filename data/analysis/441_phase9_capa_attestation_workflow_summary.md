# 441 Phase 9 CAPA And Attestation Workflow

Schema version: 441.phase9.capa-attestation-workflow.v1
Generated at: 2026-04-27T11:00:00.000Z
Baseline pack ref: ap_440_bd321a1905909edb
Derived gap count: 1
CAPA completed hash: 2a535521ac9965eccc753fa4c15816b097034a3ee057b85e7db65a13d67326cc
Attestation settlement: aps_441_f678739adc606eed
Replay hash: 206bc9b612077aecf09f63b1e5722c6c3a368465a6fe094459a6d5bff8f0d6c0

## Workflow Contract

- Evidence gap rows are graph, pack, control, scope, and hash bound.
- CAPA mutations require role, purpose-of-use, optimistic concurrency, and audit records.
- Pack attestation, signoff, publish, export, and supersession are pinned to current pack hashes and graph verdict state.
- Queue DTOs expose severity, reason, owner, due date, graph/trust state, CAPA state, next safe action, blockers, evidence refs, and audit refs.
