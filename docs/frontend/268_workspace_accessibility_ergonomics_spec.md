# 268 Workspace Accessibility Ergonomics Spec

## Task

- taskId: `par_268_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_accessibility_and_ergonomic_refinements_for_clinical_workspace`
- visual mode: `Quiet_Clinical_Ergonomic_Hardening`

## Core outcome

This slice hardens the existing Phase 3 workspace rather than replacing it. The workspace now publishes one explicit accessibility and ergonomics layer across queue, task, peer-route, and recovery states.

The shell now makes these contracts first-class:

- `AccessibleSurfaceContract`
- `KeyboardInteractionContract`
- `FocusTransitionContract`
- `AssistiveAnnouncementContract`
- `FreshnessAccessibilityContract`
- `AssistiveTextPolicy`
- `AccessibilitySemanticCoverageProfile`

## Production surfaces covered

- `WorkspaceShellRouteFamily`
- `WorkspaceNavRail`
- `QueueScanManager`
- `QueueWorkboardFrame`
- `QueuePreviewPocket`
- `ActiveTaskShell`
- `TaskCanvas`
- `DecisionDock`
- `PromotedSupportRegion`
- `ApprovalInboxRoute`
- `EscalationWorkspaceRoute`
- `ChangedWorkRoute`
- `CallbackWorklistRoute`
- `ClinicianMessageThreadSurface`
- `SelfCareAdminViewsRoute`
- stale, recovery-only, blocked, and mission-stack folds for the same surfaces

## Route coverage

- `/workspace`
- `/workspace/queue/:queueKey`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`
- `/workspace/approvals`
- `/workspace/escalations`
- `/workspace/changed`
- `/workspace/search`
- `/workspace/callbacks`
- `/workspace/messages`
- `/workspace/consequences`

## Interaction laws

1. One shell, one semantic spine. Queue, task, peer routes, and child stages stay inside one same-shell accessibility contract.
2. Queue focus, queue selection, and preview pin remain distinct. Arrow keys move scan focus, `Space` pins preview, and `Enter` opens the selected task.
3. Pane order is explicit. Task-family focus order is `workboard -> task canvas -> decision dock -> context`.
4. Pane switching is keyboard-reachable. Skip links stay available and the shell also supports `Alt+Shift+ArrowLeft`, `Alt+Shift+ArrowRight`, and direct `Alt+Shift+1..4` pane jumps where more than one pane is present.
5. Announcements are batched. Buffered queue churn, stale review, recovery posture, and blockers emit one digest rather than transport chatter.
6. Recovery stays in place. Stale, degraded, blocked, and recovery-only states keep the last safe region, anchor, and next safe action visible in shell.
7. High-risk actions keep lawful targets. Dense controls stay compact, but primary dock actions and open-task actions remain at least `44px` high.

## Semantic contract

### Landmarks

- shell root publishes one named `main`
- nav rail publishes the named workspace `navigation`
- queue workboard publishes a focusable `region`
- task canvas publishes a focusable `region`
- decision dock and context region publish named `complementary` landmarks
- peer routes publish one focusable `region` instead of detached route-local shells

### Keyboard model

- `queue_workboard`: `listbox`, `explicit_commit`
- `task_canvas`: `tab_ring`, `selection_independent`
- `decision_dock`: `tab_ring`, `explicit_commit`
- `peer_route`: `tab_ring`, `selection_independent`
- shell-level pane switching supplements, but does not replace, the declared surface models

### Assistive announcement law

- steady live route entry: `surface_summary`, `polite`
- buffered queue change digest: `routine_status`, `polite`
- stale review posture: `freshness_actionability`, `polite`
- recovery-only posture: `recovery`, `assertive`
- blocked posture: `blocker`, `assertive`
- dedupe is keyed by route path, selected anchor, runtime posture, and buffered digest state

## Ergonomic refinements

- quieter blue-gray chrome with narrow, purposeful semantic accents
- denser queue rows without shrinking text below canonical roles
- tabular numerics for queue rank, time deltas, counters, and summary strips
- wider padding discipline in the workboard so focus rings and row borders do not collapse into the scrollbar gutter
- one protected support region at a time, kept aligned with the same shell instead of spawning detached panes
- reduced motion removes travel but keeps state meaning through focus ring, opacity, and structural persistence

## DOM contract

- `data-surface`
- `data-surface-state`
- `data-selected-anchor`
- `data-focus-model`
- `data-freshness-state`
- `data-recovery-posture`
- `data-semantic-coverage-hash`
- `data-semantic-coverage-state`
- `data-keyboard-region-order`

## Responsive and reflow posture

- wide desktop keeps queue and task visible together
- medium desktop keeps the queue present and allows promoted peer-route or context work without a second shell
- `mission_stack` preserves queue context, selected anchor, buffered changes, and next-task posture as folded views of the same shell
- 200% zoom and 400% reflow may stack the planes, but the dominant action, current anchor, and recovery summary remain visible

## Proof expectations

- Playwright covers semantic attributes and aria snapshots for queue, task, approval, callback, and self-care/admin states
- Playwright proves expert keyboard traversal across workboard, task canvas, decision dock, and context region
- Playwright proves reduced motion, narrow widths, and reflow remain usable without horizontal overflow
- the validator checks the published bundle, keyboard matrix, announcement matrix, references, and the runtime DOM hooks in source
