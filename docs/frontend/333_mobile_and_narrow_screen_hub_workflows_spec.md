# 333 Mobile And Narrow-Screen Hub Workflows

## Visual mode

- `Hub_Mission_Stack_Premium`

## Outcome

The hub shell now folds into one truthful `mission_stack` workspace below the split-plane threshold. Queue anchor, selected option, support-region access, recovery posture, and dominant action meaning remain the same shell contract rather than a second mobile IA.

## Folded regions

1. `HubNarrowStatusAuthorityStrip`
2. `HubCasePulseCompact`
3. `HubNarrowQueueWorkbench`
4. dominant route content inside `HubMissionStackLayout`
5. `HubSupportTriggerRow` plus `HubSupportDrawer`
6. `HubDecisionDockBar`
7. `HubMissionStackContinuityBinder`

## Route behavior

- `/hub/queue`: keeps saved-view switching, queue risk context, selected row, and ranked option stack in one folded column.
- `/hub/case/:hubCoordinationCaseId`: preserves the active case, recovery canvas, ranked options, and commit surface while the right rail becomes drawer-only support.
- `/hub/alternatives/:offerSessionId`: keeps the same case lineage and option evidence in folded form without leaving the hub route family.
- `/hub/exceptions`: keeps table-first exception review in the same shell and moves detail into the support drawer instead of a second page.
- `/hub/audit/:hubCoordinationCaseId`: stays read-mostly, keeps the active case anchor, and exposes evidence support through the drawer plus sticky `DecisionDock`.

## Governing laws

1. `mission_stack` is the same hub shell, not a second mobile workflow.
2. Fold, unfold, rotate, resize, and refresh preserve `selectedCaseId`, `selectedOptionCardId`, `selectedExceptionId`, and `DecisionDock` meaning.
3. The support rail becomes a drawer; support content may collapse, but it may not disappear.
4. The bottom sticky `DecisionDock` keeps the current dominant action hierarchy and blocks soft duplicate CTA systems.
5. Touch, external keyboard, reduced motion, and 320px reflow remain first-class operating modes.

## Proof surface

- local `hub-desk` build and vitest coverage
- Playwright proof for narrow desktop, tablet portrait, tablet landscape, mobile width, reload, resize, and exceptions parity
- validator coverage for runtime thresholds, DOM markers, artifact completeness, and continuity invariants
