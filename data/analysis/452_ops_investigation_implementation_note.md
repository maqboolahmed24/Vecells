# Task 452 Operations Investigation Implementation Note

`/ops/:lens/investigations/:opsRouteIntentId` now renders a same-shell `InvestigationDrawer` with a preserved proof basis, question hash, scope hash, timeline hash, graph verdict, and safe-return target.

`/ops/audit` mounts the `AuditExplorer` route surface with scoped filters, timeline ladder, event evidence table, evidence graph mini-map, break-glass review, support replay boundary, and governed bundle export preview.

The drawer never silently rebases when live proof drifts. Newer proof appears as a delta state while the original `investigationQuestionHash` remains the continuity base.

Graph incompleteness fails closed. Stale graphs downgrade to summary-only or redaction review; quarantined, blocked, and permission-denied states block export and replay exit as appropriate.

Task 452 reuses the existing task 439 investigation timeline service contract and task 443 disposition execution engine contract, so no interface gap artifact is required.

Playwright evidence is written to `.artifacts/operations-investigation-452` for drawer, audit explorer, normal, empty, stale, degraded, quarantined, blocked, permission-denied, settlement-pending, safe return, keyboard, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.
