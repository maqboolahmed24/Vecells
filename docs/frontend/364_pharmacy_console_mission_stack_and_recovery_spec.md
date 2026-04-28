# 364 Pharmacy Console Mission Stack And Recovery Spec

## Scope

`par_364` finishes the pharmacy console fold behavior for tablet and phone widths without creating a second workflow.

It covers:

- the `mission_stack` fold plan for `/workspace/pharmacy/*`
- queue preservation through `PharmacyQueuePeekDrawer`
- selected-case and selected-line continuity through `PharmacyCaseResumeStub`
- one bounded promoted support region via `PharmacySupportRegionResumeCard`
- one sticky bottom action region via `PharmacyRecoveryDecisionDock` or the existing workbench dock
- same-shell recovery posture for frozen, stale, read-only, and watch-window reopen states
- safe-area and reduced-motion handling for narrow-shell drawers and bottom actions

It does not replace the workbench content owned by `363`, the assurance content owned by `361`, or the bounce-back recovery content owned by `362`.

## Authoritative surfaces

- `PharmacyMissionStackController`
- `PharmacyQueuePeekDrawer`
- `PharmacyCaseResumeStub`
- `PharmacyRecoveryStrip`
- `PharmacyRecoveryDecisionDock`
- `PharmacyContinuityFrozenOverlay`
- `PharmacySupportRegionResumeCard`
- `PharmacyWatchWindowReentryBanner`

## Visual mode

- visual mode name is `Pharmacy_Mission_Stack_Recovery`
- desktop stays in the existing three-region shell
- tablet and phone widths fold into one mission stack with queue context still present
- recovery compresses to one strip plus one dominant action instead of stacked banners

## Shell law

- `/workspace/pharmacy` remains the shell root
- child routes remain in the same pharmacy shell family when folding
- queue context stays reachable through a bounded drawer instead of disappearing
- the selected case, line item, active checkpoint, promoted support region, and dominant action survive fold, reload, and lawful re-entry
- only one promoted support region is active in the normal path
- the bottom dock may move, but it may not hide blocker context or obscure the active work

## Fold-state contract

- `desktop_expanded`: queue spine, main work region, and support region render side-by-side
- `mission_stack_narrow`: queue spine folds to a peek drawer, support region collapses to a resume card, and the dock moves to the sticky bottom region
- `mission_stack_compact`: the same shell remains, spacing tightens, and recovery remains in the main flow

## Recovery posture contract

- `live`: no recovery strip; mission stack remains calm
- `read_only`: show `PharmacyRecoveryStrip` and, when route truth is frozen, `PharmacyContinuityFrozenOverlay`
- `recovery_only`: keep the same shell but surface `PharmacyWatchWindowReentryBanner` and the recovery-owned dock

## Bounded support-region rules

- case and lane routes start with the promoted support region collapsed into `PharmacySupportRegionResumeCard`
- child routes that already are support work reopen that region on reload
- compare, handoff, and assurance work stay same-shell and never become detached pages

## Accessibility and interaction rules

- sticky bottom actions reserve layout space instead of covering the active content
- only actionable controls in the sticky dock are hit-testable on narrow screens
- the queue drawer returns focus to its invoking trigger
- the case resume stub preserves context but does not steal pointer hits from lower content
- frozen overlays keep the case context visible and route the user back into recovery without losing the case lineage

## Scenarios covered

- `PHC-2048`: calm case and inventory routes in `mission_stack`
- `PHC-2103`: watch-window reopen and recovery-owned assurance dock
- `PHC-2124`: support-region promotion for same-shell comparison and resolution flows
- `PHC-2244`: read-only handoff, frozen continuity, and preserved line-item continuity

## Gap note

`PHASE6_BATCH_364_371_INTERFACE_GAP_MISSION_STACK.json` records the remaining seam: the narrow-shell spacing currently relies on safe-area and scroll-padding heuristics because the shell does not yet consume live `visualViewport` keyboard-occlusion telemetry.

## Proof expectations

Playwright must prove that:

1. desktop-to-tablet folding preserves the active case and selected line item
2. queue context remains reachable and focus-safe through the queue peek drawer
3. frozen handoff routes recover in place without losing shell context
4. watch-window reopen routes return to the correct recovery-owned child route
5. tablet and phone widths avoid horizontal overflow and keep the bottom dock visible
