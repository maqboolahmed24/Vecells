# Phase 9 Graph Completeness Verdict Engine

Schema version: 436.phase9.graph-verdict-engine.v1
Complete verdict: agve_436_c08b7bc779f89559
Blocked verdict: agve_436_e46512ecae3bb695
Blocked reason codes: CONTRADICTION, GRAPH_WATERMARK_MISMATCH, LOW_TRUST, MISSING_REQUIRED_NODE, ORPHAN_EDGE, REPLAY_MISMATCH, RETENTION_DEPENDENCY_GAP, SUPERSEDED_EVIDENCE, TENANT_BOUNDARY_VIOLATION, VISIBILITY_GAP
Dashboard stale state: stale
Support replay stale state: blocked

## Guarantees

- Every graph-consuming path can require a structured verdict before authority is granted.
- Orphan edges, missing required edges, stale or superseded evidence, schema mismatch, tenant leakage, visibility gaps, contradictions, low trust, replay mismatch, retention dependency gaps, unsealed snapshots, and cycles produce deterministic blockers.
- Cache keys include graph hash, context, scope, evaluator version, and policy hash.
- Dry-run evaluation is available for admin preview without mutating authoritative verdict storage.
