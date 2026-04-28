# 318 Source Trust Quarantine And Supply Truth Rules

## Fail-Closed Rules

- Missing trust evidence is not treated as offerable supply.
- `quarantined` supply is diagnostic-only.
- `degraded` supply is callback-only or diagnostic-only depending on the active 317 capacity-ingestion policy.
- `stale` supply is never direct-commit truth.
- only `trusted` non-stale supply can become ordinary patient-offerable or direct-commit truth.

## Trust Evidence Interpretation

The pipeline does not import analytics runtime internals. It consumes a local `AssuranceSliceTrustRecord`-shaped input and resolves posture from:

- `trustLowerBound`
- `completenessState`
- `hardBlock`
- current evaluation and review timestamps

This keeps the hub package inside its published dependency boundary while preserving the Phase 0 trust law.

## Hidden Supply

The pipeline emits `CAPACITY_HIDDEN` when a candidate is retained only for callback or diagnostic reasoning. That prevents later UI or queue code from mistaking retained evidence for bookable truth.

## No Silent Policy Reranking

Routing, variance, trust admission, and candidate utility determine order. Service-obligation and practice-visibility outputs can produce exceptions or ledger debt, but they do not reorder candidates.

## Replay And Audit

Every snapshot build persists a replay fixture and typed supply exceptions. That makes wrong-time or wrongly-trusted booking hazards auditable under the current clinical-safety posture instead of relying on ephemeral logs.
