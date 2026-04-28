# 364 Algorithm Alignment Notes

## Governing blueprint sources

- `blueprint/phase-6-the-pharmacy-loop.md`
  - same-lineage bounce-back and urgent return must remain explicit
  - operations and exception posture must stay visible to the pharmacy shell
- `blueprint/pharmacy-console-frontend-architecture.md`
  - the pharmacy console is one shell family
  - `MissionStackFoldPlan` folds chrome, not workflow
  - continuity may reopen the same case and anchor only when evidence still validates the tuple
- `blueprint/platform-frontend-blueprint.md`
  - `PersistentShell` and `MissionStackFoldPlan`
  - route-freeze and release-recovery posture must remain bounded in the same shell
- `blueprint/ux-quiet-clarity-redesign.md`
  - low-noise hierarchy
  - one dominant interruption instead of banner accumulation
- `blueprint/staff-workspace-interface-architecture.md`
  - dominant action must stay visible on narrow screens
  - support work may compress, but cannot disappear

## State mapping

| Concern | Governing rule | Implemented region |
| --- | --- | --- |
| Folded shell must preserve queue context | `MissionStackFoldPlan` keeps queue context reachable | `PharmacyMissionStackController` + `PharmacyQueuePeekDrawer` |
| Selected case and line must survive fold and reload | continuity binding is still authoritative when lawful | `PharmacyCaseResumeStub` + root continuity attrs |
| Support work cannot disappear on phone widths | one promoted support region stays reachable | `PharmacySupportRegionResumeCard` |
| Recovery cannot become banner soup | one clear strip plus one dominant action | `PharmacyRecoveryStrip` |
| Frozen truth cannot detach the user from the case | route freeze must preserve context while narrowing actionability | `PharmacyContinuityFrozenOverlay` |
| Watch-window reopen stays same-lineage | bounce-back and urgent return remain explicit and same-shell | `PharmacyWatchWindowReentryBanner` + recovery-owned assurance route |
| Dominant action stays available on touch widths | narrow screens still keep the same decision authority | sticky `PharmacyMissionStackDock` |

## Continuity decisions

- fold and unfold preserve:
  - selected case id
  - selected line item id
  - selected checkpoint id
  - selected case anchor
  - promoted support region
- queue peek is additive only; it does not replace the active case route
- child routes that already are support work reopen the support region on reload

## Recovery posture decisions

- `live`
  - no recovery strip
  - support region may remain collapsed on case routes
- `read_only`
  - recovery strip is visible
  - frozen continuity may additionally overlay the route
- `recovery_only`
  - watch-window reentry banner is visible
  - the recovery-owned dock remains the dominant action surface

## Narrow-screen hit-testing fix

The proof pass exposed a real fold-state bug:

- non-actionable content inside the sticky mission dock could intercept pointer hits intended for other mission-stack controls
- the sticky resume stub could intercept pointer hits while preserving no interactive affordance of its own

The implementation now:

- makes the mission dock pointer-transparent except for actionable controls
- makes the case resume stub pointer-transparent
- preserves dock visibility while removing false hit targets

This aligns with the blueprint requirement that the sticky dock must not obscure or trap the active work.
