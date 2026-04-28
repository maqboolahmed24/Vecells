# 317 Enhanced Access Policy Compiler and Evaluation Engine

`par_317` turns the frozen 312 policy family contract into one executable backend service in [phase5-enhanced-access-policy-engine.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts). The engine owns compilation of the five family packs, deterministic `policyTupleHash` generation, scope-bound `NetworkCoordinationPolicyEvaluation`, replay fixtures, and typed policy exceptions.

## Compiler boundary

`EnhancedAccessPolicy` is compiled only from:

- `HubRoutingPolicyPack`
- `HubVarianceWindowPolicy`
- `HubServiceObligationPolicy`
- `HubPracticeVisibilityPolicy`
- `HubCapacityIngestionPolicy`

The compiler rejects missing required fields, canonicalizes every sortable array, and hashes the canonical tuple payload. Order-only changes therefore keep the same `policyTupleHash`, while any semantic change to thresholds, minimum-necessary contract, trust gates, or effective-window values produces a different hash.

## Evaluation boundary

The service persists the exact 317 scope registry through `phase5PolicyEvaluationScopes`:

- `candidate_snapshot`
- `offer_generation`
- `commit_attempt`
- `practice_visibility_generation`
- `manage_exposure`

Each evaluation row binds:

- the exact `policyTupleHash`
- the exact compiled-policy bundle ref
- the exact five family refs
- the five typed dispositions
- the exact `sourceAdmissionSummary`
- `policyExceptionRefs[]`
- one replay fixture capturing the evaluated facts

Routing, variance, and capacity-admission outputs decide offerability and commit posture. Service-obligation and practice-visibility outputs can mint warning or blocking evidence, but they do not re-rank candidates. That preserves the 312 separation law for later `318` to `323` work.

## Drift and replay

The service exposes `resolvePolicyTupleDrift` and `assertPolicyTupleCurrent` so later tracks can fail closed when a bound tuple no longer matches the current active tuple for the PCN. Replay uses the persisted evaluation fixture rather than ambient state, so historical evaluations can be reproduced from the stored facts and the exact policy ref set that generated them.

## Persistence shape

The durable SQL is in [145_phase5_enhanced_access_policy_engine.sql](/Users/test/Code/V/services/command-api/migrations/145_phase5_enhanced_access_policy_engine.sql). It publishes tables for:

- all five versioned family packs
- compiled `EnhancedAccessPolicy`
- one active policy binding per PCN
- `NetworkCoordinationPolicyEvaluation`
- `PolicyExceptionRecord`
- `PolicyEvaluationReplayFixture`

The active-binding table exists because later tracks need one authoritative current tuple lookup without scanning historical policies.

## 312 contract seam

The 312 frozen schema pack still leaves `312_network_coordination_policy_evaluation.schema.json` scoped to `candidate_snapshot` only, while the blueprint and prompt freeze five evaluation scopes. 317 closes that mismatch without mutating the frozen 312 pack by publishing:

- the executable scope registry in [phase5-enhanced-access-policy-engine.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts)
- the typed seam note [PHASE5_BATCH_316_323_INTERFACE_GAP_POLICY_EVALUATION_SCOPE_REGISTRY.json](/Users/test/Code/V/data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_POLICY_EVALUATION_SCOPE_REGISTRY.json)

That keeps later tracks on one runtime truth while preserving the original freeze artifact.
