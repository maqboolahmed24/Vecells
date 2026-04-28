# 424 Same-Shell Assistive Stage Spec

`Assistive_Same_Shell_Stage` turns the Phase 8 assistive layer into a governed staff-workspace support region.

## Shell Placement

- Query key: `assistiveStage`
- Fixtures: `summary-stub`, `promoted`, `pinned`, `downgraded`, `folded`
- Summary state renders inside the active task composition before telemetry.
- Promoted, pinned, downgraded, and folded states replace the older fourth-column assistive rail for that fixture and render one `AssistiveWorkspaceStageHost`.
- The stage never replaces `TaskCanvas`, `DecisionDock`, the route shell, queue scan context, or selected anchor.

## Components

- `AssistiveWorkspaceStageHost`: labelled complementary host for promoted and folded states.
- `AssistiveWorkspaceStageBindingView`: displays binding, workspace trust, assistive trust, and policy refs.
- `AssistiveSummaryStubCluster`: summary-first row with min height 56px.
- `AssistiveStagePromoter`: promote/collapse button with `aria-expanded` and `aria-controls`.
- `AssistiveStagePinController`: `aria-pressed` pin control that disables when trust downgrades.
- `AssistiveAttentionBudgetCoordinator`: support-region slot, promotion state, stage width, and primary canvas floor.
- `AssistiveAnchorSyncBridge`: selected anchor, insertion point, and quiet return target.
- `AssistiveDecisionDockCoexistenceFrame`: records DecisionDock dominance and actionability.
- `AssistiveResponsiveFoldController`: desktop static state or narrow tablist and tabpanel.
- `AssistiveWorkspaceStageStateAdapter`: maps route, runtime scenario, selected anchor, queue, and fixture to stage state.

## Layout

- `>=1440px`: stage width 440px.
- `1200px-1439px`: stage width 400px.
- `1024px-1199px`: stage width 360px.
- `<1024px`: stage folds into the same shell as a bounded support region.
- Primary canvas floor is represented in contract data as 720px and verified in the attention-budget coordinator.

## Trust And Pinning

Trusted fixtures may promote and pin. Downgraded fixtures remain visible but observe-only, suppress pinning, and preserve provenance. Frozen and degraded runtime scenarios narrow actionability and cannot be widened by the browser.

## Accessibility

Promoted variants use `role="complementary"` with a unique label. Summary uses a labelled region. Folded state uses tab semantics tied to the same stage binding. Escape collapses a promoted stage without trapping focus.
