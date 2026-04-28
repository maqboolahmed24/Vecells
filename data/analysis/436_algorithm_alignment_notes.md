# Phase 9 Graph Verdict Algorithm Alignment

The verdict engine consumes AssuranceEvidenceGraphSnapshot and AssuranceEvidenceGraphEdge rows from the 435 snapshot service and emits a frozen AssuranceGraphCompletenessVerdict plus a richer structured blocker record.

Evaluation is deterministic: edges are ordered by hash, traversals are bounded and cycle-safe, reason codes are sorted, and verdict hashes include graph hash, consumer context, scope, evaluator version, and policy hash.

Consumer contexts fail closed by default. Audit, replay, pack, retention, archive/delete, incident follow-up, and recovery-proof contexts treat stale evidence as blocking; operational dashboard and generic read contexts degrade to stale diagnostic posture.

Downstream consumers must present a matching complete verdict before using graph state as authority.
