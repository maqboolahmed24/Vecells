# 70 Duplicate Cluster And Pair Evidence Design

## Core law
`DuplicateCluster` is the review container, not the settlement. `DuplicatePairEvidence` is immutable pairwise proof for one incoming snapshot against one candidate request. `DuplicateResolutionDecision` is the only legal settlement for retry collapse, same-request attach, same-episode linkage, related-episode linkage, separation, or explicit review requirement.

## Canonical objects
- `DuplicatePairEvidence` freezes relation probabilities, class margin, candidate margin, uncertainty, blockers, model version, calibration ref, and threshold policy for each candidate comparison.
- `DuplicateCluster` keeps candidate refs, pair evidence refs, confidence, instability, review posture, and the full decision chain without pretending the cluster itself is the final meaning.
- `DuplicateResolutionDecision` settles duplicate meaning explicitly and keeps reversibility visible through `supersedesDecisionRef` and decision state.

## Attach law
- `same_request_attach` requires an explicit continuity witness. Similarity alone is never sufficient.
- `same_episode_candidate` is clustering signal only. It may open review work, but it may not settle attach or merge by itself.
- Pairwise edges are not transitive proof. Auto settlement requires a canonical center and conflict-free competition margins.

## Closure posture
Unresolved duplicate review remains closure-blocking. The frozen par_070 baseline currently carries `2` closure-blocking clusters: one `in_review` same-episode candidate and one `open` blocked-conflict cluster.

## Parallel block note
The lineage side-effect bridge is intentionally still a bounded parallel gap: `PARALLEL_INTERFACE_GAP_070_DUPLICATE_LINEAGE_SETTLEMENT_PORT`. The duplicate backbone now publishes durable decisions; later tracks will consume them through the named settlement port instead of reconstructing truth from pair scores.
