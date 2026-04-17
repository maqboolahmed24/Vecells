# Component API And Surface Role Contracts

## Surface Role Sections

### Shell plane

Continuity shell, masthead, rail, support pocket, and shared status law.

- `ShellFrame`: ShellFrame({ binding, specimenId, headline, summary, dominantActionLabel, promotedSupportRegion, children })
  Token refs: ref.color.surface.canvas, ref.color.surface.shell, ref.space.32, ref.type.role.section
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `ShellRail`: ShellRail({ title, items, eyebrow, footer })
  Token refs: ref.color.surface.inset, ref.color.border.default, ref.space.16, ref.radius.lg
  Route refs: rf_staff_workspace, rf_operations_board, rf_governance_shell
- `ShellHeader`: ShellHeader({ eyebrow, title, summary, chips, children })
  Token refs: ref.type.role.title, ref.type.role.body, ref.space.24, ref.motion.duration.reveal
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `SharedStatusStrip`: SharedStatusStrip({ tone, stateLabel, freshnessLabel, settlementLabel, continuityKey })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.radius.md, ref.space.12
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `PromotedSupportRegionFrame`: PromotedSupportRegionFrame({ title, eyebrow, children, supportingCopy })
  Token refs: ref.color.surface.panel, ref.radius.lg, ref.space.24, ref.color.border.default
  Route refs: rf_patient_home, rf_staff_workspace, rf_governance_shell

### Semantic working

Mission state, decision, freshness, and anchor primitives.

- `CasePulse`: CasePulse({ label, value, detail, tone })
  Token refs: ref.color.surface.panel, ref.type.role.label, ref.type.role.section, ref.radius.md
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board
- `StateBraid`: StateBraid({ steps, activeStep, tone })
  Token refs: ref.space.8, ref.color.border.default, ref.motion.duration.settle, ref.radius.pill
  Route refs: rf_staff_workspace, rf_operations_board, rf_governance_shell
- `DecisionDock`: DecisionDock({ title, summary, primaryActionLabel, secondaryActionLabel, utilityActionLabel, dominantMarkerRef, selectedAnchorMarkerRef })
  Token refs: ref.color.surface.panel, ref.space.16, ref.motion.duration.attention, ref.radius.md
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `FreshnessChip`: FreshnessChip({ freshnessState, label })
  Token refs: ref.radius.pill, ref.type.role.label, ref.color.border.default, ref.color.surface.panel
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `AmbientStateRibbon`: AmbientStateRibbon({ tone, label, detail })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.space.12, ref.type.role.label
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `SelectedAnchorStub`: SelectedAnchorStub({ markerRef, label, detail })
  Token refs: ref.color.surface.inset, ref.type.role.body.sm, ref.radius.md, ref.color.border.default
  Route refs: rf_staff_workspace, rf_operations_board, rf_governance_shell

### Board

Open mission board surfaces.

- `BoardSurface`: BoardSurface({ eyebrow, title, summary, children })
  Token refs: ref.color.surface.shell, ref.space.24, ref.radius.lg, ref.color.border.default
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board

### Card

Bounded spotlight or support cards only.

- `CardSurface`: CardSurface({ eyebrow, title, summary, children, tone })
  Token refs: comp.card.surface, ref.radius.md, ref.space.16, ref.color.border.default
  Route refs: rf_patient_home, rf_staff_workspace, rf_governance_shell

### Task

Focused action surfaces.

- `TaskSurface`: TaskSurface({ eyebrow, title, summary, children, tone })
  Token refs: ref.color.surface.panel, ref.radius.md, ref.space.16, ref.color.border.default
  Route refs: rf_staff_workspace, rf_operations_board, rf_governance_shell

### Rail

Dense vertical evidence or queue rails.

- `RailSurface`: RailSurface({ eyebrow, title, children })
  Token refs: ref.color.surface.inset, ref.radius.lg, ref.space.16, ref.color.border.default
  Route refs: rf_staff_workspace, rf_operations_board, rf_governance_shell

### Drawer

Elevated preview and support drawers.

- `DrawerSurface`: DrawerSurface({ eyebrow, title, summary, children })
  Token refs: ref.radius.lg, ref.color.surface.panel, ref.space.24, ref.motion.duration.overlay
  Route refs: rf_staff_workspace, rf_operations_board

### Form

Field and grouped input surfaces.

- `FormSurface`: FormSurface({ eyebrow, title, summary, children, errorSummary })
  Token refs: ref.color.surface.panel, ref.radius.md, ref.space.16, ref.color.border.default
  Route refs: rf_patient_home, rf_governance_shell, rf_intake_self_service

### List

List-first request and queue excerpts.

- `ListSurface`: ListSurface({ eyebrow, title, rows })
  Token refs: ref.color.surface.panel, ref.space.12, ref.color.border.default, ref.type.role.body.sm
  Route refs: rf_patient_home, rf_staff_workspace, rf_support_ticket_workspace

### Table

Dense tabular surfaces and chart fallback tables.

- `TableSurface`: TableSurface({ caption, columns, rows, summary })
  Token refs: comp.table.header, ref.radius.sm, ref.space.8, ref.color.border.default
  Route refs: rf_operations_board, rf_governance_shell, rf_pharmacy_console

### Artifact

Evidence and summary-only artifact planes.

- `ArtifactSurface`: ArtifactSurface({ title, posture, metadata, children })
  Token refs: ref.color.surface.inset, ref.type.role.mono.sm, ref.radius.lg, ref.color.border.default
  Route refs: rf_patient_home, rf_operations_board, rf_governance_shell

### Controls

Buttons, chips, tabs, and field frames.

- `QuietPrimaryButton`: QuietPrimaryButton({ children, markerRef, disabled })
  Token refs: ref.color.accent.active, ref.type.role.label, ref.radius.pill, ref.density.control.public
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `SecondaryButton`: SecondaryButton({ children, disabled })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.radius.pill, ref.density.control.professional
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `InlineUtilityButton`: InlineUtilityButton({ children })
  Token refs: ref.type.role.label, ref.color.text.muted, ref.motion.duration.attention, ref.radius.sm
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board
- `SegmentedTabs`: SegmentedTabs({ items, activeItem })
  Token refs: ref.radius.pill, ref.color.surface.inset, ref.color.border.default, ref.motion.duration.attention
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board
- `QuietChip`: QuietChip({ label, tone })
  Token refs: ref.radius.pill, ref.color.surface.panel, ref.color.border.default, ref.type.role.label
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board
- `FilterPill`: FilterPill({ label, count, selected })
  Token refs: ref.radius.pill, ref.color.surface.inset, ref.color.border.default, ref.type.role.label
  Route refs: rf_staff_workspace, rf_operations_board, rf_support_ticket_workspace
- `InputFieldFrame`: InputFieldFrame({ label, value, placeholder, state, hint })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.radius.sm, ref.density.control.public
  Route refs: rf_patient_home, rf_governance_shell, rf_intake_self_service
- `TextareaFrame`: TextareaFrame({ label, value, placeholder, state, hint })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.radius.md, ref.space.12
  Route refs: rf_patient_home, rf_governance_shell, rf_intake_self_service
- `SelectFrame`: SelectFrame({ label, options, value, state })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.radius.sm, ref.density.control.professional
  Route refs: rf_patient_home, rf_staff_workspace, rf_governance_shell
- `CheckboxRadioFrame`: CheckboxRadioFrame({ legend, kind, options, selectedValues })
  Token refs: ref.color.border.default, ref.color.surface.panel, ref.radius.md, ref.type.role.body.sm
  Route refs: rf_patient_home, rf_governance_shell, rf_intake_self_service

### State postures

Calm loading, empty, stale, blocked, and recovery states.

- `LoadingSkeleton`: LoadingSkeleton({ label })
  Token refs: ref.color.surface.inset, ref.motion.duration.reveal, ref.motion.scale.low, ref.radius.md
  Route refs: rf_patient_home, rf_staff_workspace, rf_operations_board, rf_governance_shell
- `EmptyStateFrame`: EmptyStateFrame({ title, body, actionLabel })
  Token refs: ref.color.surface.panel, ref.radius.md, ref.space.16, ref.type.role.body
  Route refs: rf_patient_home, rf_staff_workspace, rf_support_ticket_workspace
- `StaleStateFrame`: StaleStateFrame({ title, body, freshnessLabel })
  Token refs: ref.color.accent.review, ref.color.surface.panel, ref.radius.md, ref.space.16
  Route refs: rf_operations_board, rf_governance_shell, rf_support_replay_observe
- `BlockedStateFrame`: BlockedStateFrame({ title, body, recoveryActionLabel })
  Token refs: ref.color.accent.danger, ref.color.surface.panel, ref.radius.md, ref.space.16
  Route refs: rf_operations_board, rf_governance_shell, rf_support_replay_observe
- `RecoveryStateFrame`: RecoveryStateFrame({ title, body, helperText })
  Token refs: ref.color.accent.success, ref.color.surface.panel, ref.radius.md, ref.space.16
  Route refs: rf_patient_secure_link_recovery, rf_support_replay_observe, rf_governance_shell
- `PlaceholderArtifactFrame`: PlaceholderArtifactFrame({ title, postureLabel, metadata })
  Token refs: ref.color.surface.inset, ref.radius.lg, ref.type.role.mono.sm, ref.color.border.default
  Route refs: rf_patient_home, rf_operations_board, rf_governance_shell

### Visualization

Comparison and bounded chart primitives with fallback parity.

- `ComparisonLedger`: ComparisonLedger({ title, rows, summary })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.space.16, ref.radius.md
  Route refs: rf_operations_board, rf_governance_shell
- `BoundedVisualizationPanel`: BoundedVisualizationPanel({ title, summary, tableCaption, data, tone })
  Token refs: ref.color.surface.panel, ref.color.border.default, ref.space.16, ref.radius.md
  Route refs: rf_operations_board, rf_governance_shell
