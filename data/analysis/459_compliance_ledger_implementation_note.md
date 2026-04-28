# Phase 9 Compliance Ledger Implementation Note

Task 459 adds a compliance ledger and control evidence gap queue to `/ops/assurance`.

The projection is a bounded adapter over the existing assurance graph, pack preview, control heat map, gap queue, CAPA tracker, settlement, and artifact-presentation state. Because no named ComplianceLedgerProjection contract existed, the implementation records the required interface-gap artifact and publishes the task 459 projection schema.

The UI fails closed: stale graphs are diagnostic-only, blocked graphs prevent handoffs, permission-denied state shows metadata only, and all handoff links suppress raw artifact URLs.
