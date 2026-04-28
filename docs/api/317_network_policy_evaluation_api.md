# 317 Network Policy Evaluation API

The public Phase 5 policy surface is exported from [index.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/index.ts) through `createPhase5EnhancedAccessPolicyService`.

## Compile API

`compileEnhancedAccessPolicy(input)` accepts one `CompileEnhancedAccessPolicyInput` with:

- one PCN scope
- one effective window
- one network-standard-hours block
- one same-day online booking rule
- one rank-plan version ref
- one uncertainty-model version ref
- one input object for each of the five policy families

It returns:

- `compiledPolicy`
- the five persisted family-pack snapshots
- `tupleCanonicalPayload`

`policyTupleHashFromCompileInput(input)` is the pure helper for deterministic hashing without persistence.

## Load and drift APIs

`loadActivePolicyPacksForScope({ pcnRef, asOf })` resolves the current active tuple and fails closed when no active current tuple exists.

`resolvePolicyTupleDrift({ pcnRef, boundPolicyTupleHash, asOf })` returns:

- `current` when the bound tuple still matches the active tuple
- `drifted` when the active tuple changed underneath downstream mutable work

`assertPolicyTupleCurrent(...)` wraps that result and throws `POLICY_TUPLE_DRIFT` on mismatch.

## Evaluation APIs

`evaluateHubCaseAgainstPolicy(input)` evaluates one case for one scope and persists:

- one `NetworkCoordinationPolicyEvaluation`
- zero or more `PolicyExceptionRecord`
- one `PolicyEvaluationReplayFixture`

`evaluateHubCaseAcrossScopes(input)` batches the same case and fact cut across:

- `candidate_snapshot`
- `offer_generation`
- `commit_attempt`
- `practice_visibility_generation`
- `manage_exposure`

Every returned evaluation binds the same compiled tuple and family refs for that call.

## Replay API

`replayHistoricalEvaluation({ policyEvaluationId })` re-evaluates from the stored fixture facts and returns:

- the replay evaluation result
- `matchesStoredEvaluation`
- `mismatchFields[]`
- `originalEvaluation`

The replay path is safe for audit because it does not depend on current request-scoped browser state or later track heuristics.
