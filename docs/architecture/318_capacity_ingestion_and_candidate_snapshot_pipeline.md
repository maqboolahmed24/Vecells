# 318 Capacity Ingestion And Candidate Snapshot Pipeline

## Purpose

`par_318` makes network supply authoritative in one backend path:

1. fetch capacity through one of the four declared `HubCapacityAdapter` seams
2. resolve freshness and trust admission before a row becomes a candidate
3. normalize every source into one `NetworkSlotCandidate` shape
4. bind the snapshot to one active `EnhancedAccessPolicy` evaluation
5. persist one reusable `NetworkCandidateSnapshot`, `CrossSiteDecisionPlan`, `CapacityRankProof`, and `CapacityRankExplanation` set
6. persist operational ledgers for obligation minutes and cancellation make-up

The implementation lives in
[phase5-network-capacity-pipeline.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts).

## Flow

1. The service queries the claimed `HubCoordinationCase` bundle from the 315 kernel.
2. It loads the active policy tuple from the 317 policy engine.
3. Each adapter run resolves:
   - `sourceMode`
   - `sourceRef`
   - `sourceIdentity`
   - `sourceVersion`
   - `fetchedAt`
   - current `AssuranceSliceTrustRecord`-shaped trust evidence
4. The pipeline converts trust evidence into a fail-closed admission:
   - `trusted_admitted`
   - `degraded_callback_only`
   - `degraded_diagnostic_only`
   - `quarantined_excluded`
   - `stale_capacity`
5. Raw rows are normalized into canonical capacity units, deduped, and ranked.
6. The pipeline emits one immutable proof tuple for later queue, offer, commit, and fallback tracks.

## Ranking Law

Stable candidate order is:

1. `windowClass desc`
2. `sourceTrustTier desc`
3. `robustFit desc`
4. `travelMinutes asc`
5. `startAt asc`
6. `candidateId asc`

Dominance filtering is weaker and only reasons over:

1. `windowClass`
2. `sourceTrustTier`
3. `robustFit`
4. `startAt`

That keeps the patient or commit frontier reusable without letting service-obligation or practice-visibility logic rerank candidates after the fact.

## Trust And Freshness

- `trusted` requires lower-bound trust at or above `0.85` with complete evidence and no hard block.
- `degraded` remains visible only where the active capacity-ingestion policy explicitly allows it.
- `quarantined` and `stale` supply never becomes ordinary patient-offerable or direct-commit truth.
- outside-window candidates can survive only as governed reasoning rows when the active variance policy explicitly allows that visibility.

## Durable Outputs

The migration
[146_phase5_network_capacity_snapshot_pipeline.sql](/Users/test/Code/V/services/command-api/migrations/146_phase5_network_capacity_snapshot_pipeline.sql)
creates durable homes for:

- adapter runs
- source-trust admissions
- normalized slot candidates
- candidate snapshots
- rank proofs
- rank explanations
- cross-site decision plans
- minutes ledgers
- cancellation make-up ledgers
- capacity supply exceptions
- replay fixtures

## Reuse Boundary

Later Phase 5 tracks must consume the persisted snapshot and decision plan instead of refetching supplier rows and rescoring live supply. The replay fixture exists specifically to make that law testable.
