# 356 Algorithm Alignment Notes

Task `par_356` is grounded against:

- `blueprint/phase-6-the-pharmacy-loop.md`
- `blueprint/pharmacy-console-frontend-architecture.md`
- `blueprint/platform-frontend-blueprint.md`
- `blueprint/patient-account-and-communications-blueprint.md`
- `blueprint/staff-workspace-interface-architecture.md`
- validated outputs from `346`, `348`, `350`, `354`, and `355`

## Governing interpretation

- patient pharmacy work is not appointment work
- workspace pharmacy work is not a generic task-detail view
- same-shell continuity is the default
- `mission_stack` is a fold of the same shell
- one promoted support region is active at a time

## Route map

| Route | Governing shell | Continuity key | Host regions |
| --- | --- | --- | --- |
| `/pharmacy/:pharmacyCaseId/choose` | `PharmacyPatientShell` | `patient-pharmacy::<case>::provider` | request-lineage anchor, chosen-provider anchor, checkpoint rail, support region, `DecisionDock` |
| `/pharmacy/:pharmacyCaseId/instructions` | `PharmacyPatientShell` | `patient-pharmacy::<case>::provider` | request-lineage anchor, chosen-provider anchor, checkpoint rail, support region, `DecisionDock` |
| `/pharmacy/:pharmacyCaseId/status` | `PharmacyPatientShell` | `patient-pharmacy::<case>::provider` | request-lineage anchor, chosen-provider anchor, checkpoint rail, recovery frame, `DecisionDock` |
| `/workspace/pharmacy` | `PharmacyWorkspaceShell` | `rf_pharmacy_console` | queue spine, validation board host, checkpoint rail, support region, chosen-provider anchor, `DecisionDock` |
| `/workspace/pharmacy/:pharmacyCaseId` | `PharmacyWorkspaceShell` | `rf_pharmacy_console` | queue spine, validation board host, checkpoint rail, support region, chosen-provider anchor, `DecisionDock` |
| `/workspace/pharmacy/:pharmacyCaseId/validate` | `PharmacyWorkspaceShell` | `rf_pharmacy_console` | queue spine, validation board host, checkpoint rail, support region, chosen-provider anchor, `DecisionDock` |
| `/workspace/pharmacy/:pharmacyCaseId/inventory` | `PharmacyWorkspaceShell` | `rf_pharmacy_console` | queue spine, validation board host, checkpoint rail, support region, chosen-provider anchor, `DecisionDock` |
| `/workspace/pharmacy/:pharmacyCaseId/resolve` | `PharmacyWorkspaceShell` | `rf_pharmacy_console` | queue spine, validation board host, checkpoint rail, support region, chosen-provider anchor, `DecisionDock` |
| `/workspace/pharmacy/:pharmacyCaseId/handoff` | `PharmacyWorkspaceShell` | `rf_pharmacy_console` | queue spine, validation board host, checkpoint rail, support region, chosen-provider anchor, `DecisionDock` |
| `/workspace/pharmacy/:pharmacyCaseId/assurance` | `PharmacyWorkspaceShell` | `rf_pharmacy_console` | queue spine, validation board host, checkpoint rail, support region, recovery frame, chosen-provider anchor, `DecisionDock` |

## Named component closure

- `PharmacyShellFrame`: workspace root composition and shell markers
- `PharmacyPatientShell`: patient root composition and patient route registration
- `PharmacyWorkspaceShell`: stateful workspace shell app
- `PharmacyQueueSpineHost`: left queue lane and selected case continuity
- `PharmacyValidationBoardHost`: central validation board and line-item stage
- `PharmacySupportRegionHost`: promoted child-route region
- `PharmacyCheckpointRail`: explicit checkpoint summary locus
- `PharmacyCasePulseHost`: consistent `CasePulse` host
- `PharmacyDecisionDockHost`: single dominant action locus
- `PharmacyChosenProviderAnchor`: persistent provider anchor in both shells
- `PharmacyRouteRecoveryFrame`: stale, blocked, or recovery strip

## Continuity closure

- workspace continuity is serialised in the existing shell model and route path
- patient continuity is encoded in the route family itself; chosen-provider and request-lineage anchors are deterministic for each shell seed
- browser back or forward remains same-shell because every child route is a bounded member of the family instead of a detached page

## Intentional exclusions

- detailed provider-choice ranking remains owned by `358`
- detailed patient instructions and outcome copy remain owned by `360`
- detailed assurance, bounce-back, and operations workbench remain owned by `361`, `362`, and `363`
