# 365 Algorithm Alignment Notes

## Objective
`par_365` hardens the already-built Phase 6 pharmacy shells without changing route truth or rebuilding the visual family. The work stays inside the frontend lane: semantics, focus continuity, calm announcements, reduced motion, drawer/dialog focus return, target size, and reflow.

## Alignment Summary
- The shared primitive family lives in `@vecells/design-system` so patient and staff shells consume one accessibility and motion contract instead of drifting by route.
- `Pharmacy_Accessible_Quiet_Polish` is intentionally additive. It leaves the same-shell and one-dominant-action laws intact while strengthening exposure for assistive tech and keyboard users.
- Route continuity remains source-of-truth driven. The new `PharmacyFocusRouteMap` publishes the current route, selected anchor, focus return target, and promoted support region without introducing a second routing model.
- Announcement behavior is calm-first. Both shells publish one polite summary channel by default and reserve assertive output for blocked recovery or repair-required states.
- Dialog and drawer semantics are now shared. `PharmacyDialogAndDrawerSemantics` centralizes focus trapping, Escape dismissal, initial focus, and focus return for both the queue peek drawer and referral confirmation drawer.
- Target sizing is enforced through `PharmacyTargetSizeGuard` around route toggles, chooser actions, and drawer triggers. This keeps minimum hit area work explicit rather than relying on incidental padding.
- Reduced motion is frozen through `PharmacyReducedMotionBridge` and a route-local scroll rule that switches mission-stack support scrolling from `smooth` to `auto` when motion is reduced.

## Blueprint References
- `blueprint/accessibility-and-content-system-contract.md`
- `blueprint/pharmacy-console-frontend-architecture.md`
- `blueprint/platform-frontend-blueprint.md`

## Repository Decisions
- Reused the existing patient and pharmacy shell roots instead of introducing new wrapper routes.
- Reused the current visual language and card/posture system instead of restyling the shells.
- Reused existing Playwright pharmacy helpers from the 356 family and added a focused 365 helper for keyboard/focus/aria capture.
