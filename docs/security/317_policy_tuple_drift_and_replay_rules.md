# 317 Policy Tuple Drift and Replay Rules

317 is a fail-closed policy authority. It does not allow later tracks to reinterpret Enhanced Access semantics from queue state, offer UI filters, or commit-side convenience logic.

## Drift rules

Any downstream mutable artifact that binds a `policyTupleHash` must re-check it before mutation. The sanctioned helper is `assertPolicyTupleCurrent` in [phase5-enhanced-access-policy-engine.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts).

The helper is intended for:

- candidate snapshots
- offer sessions
- commit attempts
- practice-visibility generations
- manage-capability leases

If the tuple changed, the helper throws `POLICY_TUPLE_DRIFT`. Later tracks must treat that as stale mutable posture, not as a best-effort warning.

## Replay rules

Replay must use the stored `PolicyEvaluationReplayFixture.facts` and the stored tuple refs. It must not rebuild facts from current queue order, current capacity feeds, or current visibility context. That preserves the Phase 0 replay law and keeps historical diagnostics auditable.

## Exception publication rules

Exceptions are typed data, not log text. The safe operator contract is:

- family
- code
- severity
- safe summary
- scope
- case ref
- tuple hash

The safe summary intentionally avoids patient-identifiable or cross-org hidden detail. Richer explanations belong in later minimum-necessary projections, not in the policy exception record itself.

## Boundary rules

Routing, variance, and capacity admission decide patient-offerable or direct-commit legality. Service obligation and practice visibility can:

- mint ledgers
- open acknowledgement debt
- raise warnings or blocks
- constrain visibility posture

They cannot silently reorder candidates. That boundary is preserved in code and called out again here because later queue and offer tracks depend on it for proof-bearing ranking.

## Frozen-contract seam

The 312 schema pack underspecifies `evaluationScope`. 317 therefore publishes the runtime scope registry and the typed seam note [PHASE5_BATCH_316_323_INTERFACE_GAP_POLICY_EVALUATION_SCOPE_REGISTRY.json](/Users/test/Code/V/data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_POLICY_EVALUATION_SCOPE_REGISTRY.json) instead of mutating the frozen upstream schema in place.
