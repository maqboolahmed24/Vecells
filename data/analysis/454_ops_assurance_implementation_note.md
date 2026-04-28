# Task 454 Operations Assurance Implementation Note

`/ops/assurance` now renders a same-shell Assurance Center with framework selection, control heat-map triads, table parity, evidence completeness status, evidence-gap queue, CAPA tracker, continuity evidence, settlement state, pack preview, and export manifest posture.

Each control cell renders freshness, trust, and completeness as separate text-bearing states. The table fallback carries the same triad values, graph verdict, evidence counts, and blockers.

Pack preview is summary-first and exposes pack version hash, evidence-set hash, continuity-set hash, graph hash, graph verdict decision hash, query plan hash, render template hash, redaction policy hash, reproduction state, required trust refs, and governed artifact handoff refs before any export control is armed.

Attestation, signoff, publish, and export controls are bound to `AssurancePackSettlement`; local button acknowledgement never implies export readiness.

Task 454 reuses task 440 assurance pack factory, task 441 CAPA/attestation workflow, and task 446 slice quarantine contracts, so no pack settlement interface gap artifact is required.

Playwright evidence is written to `.artifacts/operations-assurance-454` for normal, empty, stale, degraded, quarantined, blocked, permission-denied, settlement-pending, freeze, framework selection, control selection, keyboard action, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.
