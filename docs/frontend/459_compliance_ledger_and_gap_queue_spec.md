# Task 459 Compliance Ledger and Gap Queue Spec

## Route

The ledger is part of `/ops/assurance`. It is not a separate compliance dashboard. The panel is rendered as `ComplianceLedgerPanel` with visual mode `Compliance_Ledger_Calm_Accountability`.

## Surfaces

- `ComplianceLedgerPanel`: route-integrated ledger lens and status wrapper.
- `StandardsVersionContextChip`: framework and standards version selector.
- `ControlStatusLedgerRow`: keyboard-selectable control row backed by `ControlStatusSnapshot`.
- `EvidenceGraphMiniMap`: selected control graph summary backed by graph snapshot and completeness verdict refs.
- `GapOwnerBurdenRail`: owner workload summary derived from gap records and linked incidents/CAPA.
- `ControlEvidenceGapQueue`: filterable/sortable queue backed by evidence gap records.
- `CAPAAndIncidentLinkStrip`: safe operations-shell handoffs to assurance preview, incidents, CAPA, tenant governance, records lifecycle, and resilience evidence.
- `GraphCompletenessBlockerCard`: stale/blocked graph downgrade explanation.
- `EvidenceGapResolutionDrawer`: selected-gap action preview with mutation blocked unless the graph and action state allow it.

## States

- `exact` and `normal`: graph complete, ledger review ready, export routes still require pack settlement.
- `stale`: diagnostic-only; filters, rows, and drawer remain inspectable.
- `blocked` and `graph_drift`: graph blockers prevent completeness claims and mutation handoffs.
- `empty`: empty ledger and queue states render without missing landmarks.
- `permission_denied`: metadata-only inspection, no raw artifacts.
- `overdue_owner`: owner burden rail highlights overdue control evidence review.

## Interaction

Framework selection settles the projection before rows, graph mini-map, and queue counts update. Control rows are mouse and keyboard selectable. Gap filters are buttons, sorting is a native select, and queue items update the drawer.

## Guardrails

No raw artifact URLs are rendered. Handoff links are route refs with return context and scoped payload refs. The graph completeness verdict is shown before any action preview because it is the admissibility boundary for ledger claims.
