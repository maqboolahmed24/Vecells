# 471 Phase 9 Exit Gate Approval Runbook

## Purpose

The Phase 9 exit gate is the authoritative completion decision for the assurance ledger. It must be evaluated from machine-readable proof refs and hashes, not from checklist state, dashboard colour, or a narrative signoff.

## Operator Steps

1. Run `pnpm run test:phase9:exit-gate-approval`.
2. Confirm `data/evidence/471_phase9_exit_gate_decision.json` has `decision.decisionState = approved`.
3. Confirm every mandatory `Phase9ExitGateChecklistRow.rowState` is `exact`.
4. Confirm any `deferred_scope` row is non-mandatory and source-backed.
5. Confirm `releaseToBAURecordGuard.guardState = permitted` before creating any `ReleaseToBAURecord`.
6. If blocked, follow each blocker owner and `nextSafeAction`; do not override the settlement.

## Current Evidence

Decision hash: `b6860e7e476c1e0a5dbfaa10ec5266ddcb2d87a7091788103e0ed6a3a807e170`
