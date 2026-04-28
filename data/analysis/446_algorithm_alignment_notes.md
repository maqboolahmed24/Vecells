# Phase 9 Projection Rebuild And Slice Quarantine Algorithm Alignment

Task 446 proves projection integrity as a control-plane concern. Rebuilds replay raw inputs in deterministic order, compare canonical rebuild hashes to stored snapshot hashes, and freeze command-following actionability on exact replay divergence.

Producer and namespace quarantine is slice-bounded. Conflicting duplicates, out-of-order mandatory sequences, incompatible schemas, unknown mandatory namespaces, and hard trust blocks quarantine only dependent slices while preserving unaffected producers and slices.

Slice trust uses the Phase 9 hysteresis thresholds: two consecutive lower-bound evaluations at or above 0.88 are required to enter trusted, trusted state leaves below 0.82, and hard blocks or lower bounds below 0.40 quarantine immediately.

Quarantine and governed release both write trust-evaluation evidence to the assurance ledger so operations, packs, retention, and resilience surfaces can explain which producers and namespaces are blocking authority.
