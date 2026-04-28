# Shared Component Primitives And Token Bindings

## Outcome

Vecells now has a first real shared primitive layer bound to the par_103 token foundation and the par_104 kernel publication. The primitives below are the reusable route-safe source for later patient, workspace, support, pharmacy, operations, and governance shells.

## Summary

- Components: 38
- Specimens: 4
- Shell profile lenses: 8
- Exact route bindings across specimens: 2
- Blocked route bindings across specimens: 2

## Specimens

### Patient_Mission_Frame

- Route: `rf_patient_home`
- Shell: `patient`
- Layout: `focus_frame`
- Density posture: `quiet`
- Components: ShellFrame, ShellHeader, SharedStatusStrip, BoardSurface, CardSurface, DecisionDock, ListSurface, PromotedSupportRegionFrame, ArtifactSurface, FormSurface

Calm section entry with a spotlight card, quiet action row, bounded record excerpt, and one promoted support region.

### Workspace_Quiet_Mission_Control

- Route: `rf_staff_workspace`
- Shell: `staff`
- Layout: `two_plane`
- Density posture: `mixed`
- Components: ShellFrame, ShellRail, ShellHeader, SharedStatusStrip, RailSurface, TaskSurface, DrawerSurface, DecisionDock, SelectedAnchorStub, ListSurface

Compact queue spine, preview pocket, active task surface, decision dock, and interruption digest stub.

### Operations_Control_Room_Preview

- Route: `rf_operations_board`
- Shell: `operations`
- Layout: `three_plane`
- Density posture: `dense`
- Components: ShellFrame, ShellRail, ShellHeader, SharedStatusStrip, BoardSurface, TableSurface, BoundedVisualizationPanel, ComparisonLedger, DrawerSurface, BlockedStateFrame

North-star band, one table-first health grid, one bounded chart with summary and table fallback, and intervention workbench stub.

### Governance_Approval_Frame

- Route: `rf_governance_shell`
- Shell: `governance`
- Layout: `two_plane`
- Density posture: `mixed`
- Components: ShellFrame, ShellRail, ShellHeader, SharedStatusStrip, CardSurface, TaskSurface, ComparisonLedger, StateBraid, ArtifactSurface, FormSurface

Scope ribbon, change envelope, impact preview, approval stepper, and evidence rail held in one quiet review shell.

## Gap Resolutions

- `GAP_RESOLUTION_COMPONENT_API_SURFACE_ROLE_FRAMING_V1`: Every surface primitive now takes explicit `eyebrow`, `title`, and `summary` props so route-safe semantics stay visible and card-like wrappers do not absorb board, task, rail, or artifact roles.
- `GAP_RESOLUTION_COMPONENT_API_DECISION_DOCK_ACTIONS_V1`: DecisionDock now requires one `primaryActionLabel` plus optional secondary and utility labels, which encodes the one-dominant-action law into the API instead of leaving it to shell-local conventions.
- `GAP_RESOLUTION_COMPONENT_API_VISUALIZATION_PARITY_V1`: BoundedVisualizationPanel requires `summary`, `tableCaption`, and `data` props together so chart and table parity cannot be skipped or added ad hoc by specimen code.

## Follow-On Dependencies

- `FOLLOW_ON_DEPENDENCY_PATIENT_SHELL_SPECIALIZATION_V1` (par_154-par_163): Patient shell work should compose `ShellFrame`, `SharedStatusStrip`, `CardSurface`, `ListSurface`, and `FormSurface` directly instead of creating patient-only container primitives.
- `FOLLOW_ON_DEPENDENCY_WORKSPACE_QUEUE_SPECIALIZATION_V1` (par_220-par_222): Support and staff workspace shells should specialize queue and replay content through `RailSurface`, `TaskSurface`, `DecisionDock`, and `SelectedAnchorStub` without forking state semantics or automation markers.
- `FOLLOW_ON_DEPENDENCY_GOVERNANCE_APPROVAL_SPECIALIZATION_V1` (phase3 governance and release tracks): Governance approval and release flows should keep `StateBraid`, `ArtifactSurface`, `ComparisonLedger`, and `BoundedVisualizationPanel` intact while adding route-specific copy and evidence data later.

## Source Precedence

- prompt/105.md
- prompt/shared_operating_contract_096_to_105.md
- prompt/AGENT.md
- prompt/checklist.md
- blueprint/design-token-foundation.md
- blueprint/canonical-ui-contract-kernel.md
- blueprint/platform-frontend-blueprint.md#PersistentShell
- blueprint/platform-frontend-blueprint.md#CasePulse
- blueprint/platform-frontend-blueprint.md#StateBraid
- blueprint/platform-frontend-blueprint.md#DecisionDock
- blueprint/platform-frontend-blueprint.md#status-strip law
- blueprint/ux-quiet-clarity-redesign.md
- blueprint/accessibility-and-content-system-contract.md
- blueprint/forensic-audit-findings.md#Finding 86
- blueprint/forensic-audit-findings.md#Finding 92
- blueprint/forensic-audit-findings.md#Finding 93
- blueprint/forensic-audit-findings.md#Finding 97
- blueprint/forensic-audit-findings.md#Finding 116
- blueprint/forensic-audit-findings.md#Finding 117
- blueprint/forensic-audit-findings.md#Finding 118
- blueprint/forensic-audit-findings.md#Finding 120
- data/analysis/design_token_export_artifact.json
- data/analysis/profile_selection_resolutions.json
- data/analysis/design_contract_publication_bundle.json
- data/analysis/automation_anchor_maps.json
- data/analysis/accessibility_semantic_coverage_profiles.json
