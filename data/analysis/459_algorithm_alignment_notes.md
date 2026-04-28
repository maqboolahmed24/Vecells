# Task 459 Algorithm Alignment Notes

The compliance ledger projection is a bounded adapter over the same assurance route graph used by the assurance pack factory. It reads the existing `/ops/assurance` projection and maps the route-bound assurance objects into task 459 UI projections without inventing a separate compliance data source.

## Canonical Inputs

- `AssuranceEvidenceGraphSnapshot`: represented by `evidenceGraphSnapshotRef`, graph hash, selected framework, and mini-map nodes/edges.
- `AssuranceGraphCompletenessVerdict`: represented by `graphCompletenessVerdictRef`, `graphBlocker`, and stale/blocked downgrades.
- `ControlStatusSnapshot`: represented by each ledger row's `controlStatusSnapshotId`, coverage, lineage, reproducibility, decision hash, and evidence set hash.
- `AssuranceControlRecord`: represented by `assuranceControlRecordRef`, control family, framework, and owner.
- `EvidenceGapRecord`: represented by `evidenceGapRecordRef`, gap type, queue state, due date, graph edge refs, and blocker refs.
- `CAPAAction`: represented by `capaActionRefs`, owner burden counts, and safe handoff targets.

## Admissibility Rule

Evidence presence alone is not accepted as completeness. The ledger action state is:

- `review_ready` only when the graph verdict is complete.
- `diagnostic_only` when the graph is stale.
- `blocked` when the graph verdict blocks pack or control claims.
- `metadata_only` for permission-denied state.
- `owner_review_only` for overdue-owner triage, with no export authority.

## UI Lens Binding

The implementation is integrated into `/ops/assurance` as `Compliance_Ledger_Calm_Accountability`. It reuses the framework selector state and selected control state from the assurance center and adds task 459 gap filters, owner burden, mini-map, and resolution preview state.

## Export Guardrail

All handoffs are route refs inside the operations shell. Raw artifact URLs are suppressed by contract and tests assert that serialized projections do not render `http://` or `https://` strings.
