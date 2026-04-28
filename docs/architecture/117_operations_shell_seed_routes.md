# Operations shell seed routes

- Task: `par_117`
- Visual mode: `Operations_Shell_Seed_Routes`
- Shell: `ops-console`
- Route families: `rf_operations_board`, `rf_operations_drilldown`

## Seed route map

The Phase 0 operations shell keeps one calm mission-control frame while the lens changes between overview, queues, capacity, dependencies, audit, assurance, incidents, and resilience. Investigation, intervention, compare, and health are same-shell child routes rather than detached dashboards.

## Board law

1. The shell defaults to a two-plane board: a dominant anomaly field in the main plane and a sticky InterventionWorkbench in the secondary plane.
2. Three-plane posture appears only for compare or incident-command contexts.
3. Return from child routes uses the current OpsReturnToken instead of raw browser history.
4. Governance handoff remains read-only and bounded; it never replaces the operations shell.

## Canonical routes

- `/ops/overview` -> `rf_operations_board` (board) :: Resident operations board root for the overview lens.
- `/ops/queues` -> `rf_operations_board` (board) :: Resident operations board root for the queues lens.
- `/ops/capacity` -> `rf_operations_board` (board) :: Resident operations board root for the capacity lens.
- `/ops/dependencies` -> `rf_operations_board` (board) :: Resident operations board root for the dependencies lens.
- `/ops/audit` -> `rf_operations_board` (board) :: Resident operations board root for the audit lens.
- `/ops/assurance` -> `rf_operations_board` (board) :: Resident operations board root for the assurance lens.
- `/ops/incidents` -> `rf_operations_board` (board) :: Resident operations board root for the incidents lens.
- `/ops/resilience` -> `rf_operations_board` (board) :: Resident operations board root for the resilience lens.
- `/ops/overview/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/overview/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/overview/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/overview/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
- `/ops/queues/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/queues/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/queues/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/queues/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
- `/ops/capacity/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/capacity/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/capacity/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/capacity/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
- `/ops/dependencies/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/dependencies/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/dependencies/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/dependencies/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
- `/ops/audit/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/audit/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/audit/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/audit/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
- `/ops/assurance/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/assurance/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/assurance/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/assurance/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
- `/ops/incidents/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/incidents/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/incidents/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/incidents/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
- `/ops/resilience/investigations/:opsRouteIntentId` -> `rf_operations_drilldown` (investigations) :: Same-shell investigations child route preserving the operations continuity key.
- `/ops/resilience/interventions/:opsRouteIntentId` -> `rf_operations_drilldown` (interventions) :: Same-shell interventions child route preserving the operations continuity key.
- `/ops/resilience/compare/:opsRouteIntentId` -> `rf_operations_drilldown` (compare) :: Same-shell compare child route preserving the operations continuity key.
- `/ops/resilience/health/:opsRouteIntentId` -> `rf_operations_drilldown` (health) :: Same-shell health child route preserving the operations continuity key.
