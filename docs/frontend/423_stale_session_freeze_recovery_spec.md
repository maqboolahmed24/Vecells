# 423 Stale Session Freeze Recovery Spec

Task `par_423` adds `Assistive_Freeze_Regen_In_Place`, the rail-level stale recovery surface for assistive artifacts.
It renders the browser-visible expression of `AssistiveFreezeFrame`, `ReleaseRecoveryDisposition`,
and stale `AssistiveDraftPatchLease` truth without recomputing those backend records.

## Components

- `AssistiveStaleSessionBanner`
- `AssistiveFreezeInPlaceFrame`
- `AssistiveFreezeReasonList`
- `AssistivePreservedArtifactView`
- `AssistiveRegenerateInPlaceActionBar`
- `AssistiveRecoveryExplanationPanel`
- `AssistiveRecoverableNotice`
- `AssistiveStaleControlSuppression`
- `AssistiveRecoveryFocusManager`
- `AssistiveFreezeRecoveryStateAdapter`

## State Contract

The route fixture key is `assistiveRecovery`. Supported fixtures cover trust drift, publication drift, selected-anchor drift, insertion-point invalidation, review-version drift while editing, decision-epoch drift, policy freshness drift, open detail, narrow folded layout, and recovered state.

Every stale frame shows:

- one primary drift reason
- bounded secondary reasons
- preserved artifact text when lawful
- preserved provenance refs
- immediate stale-control suppression
- one dominant same-shell action

## Integration

`AssistiveRailStateAdapter` resolves `AssistiveFreezeRecoveryStateAdapter` for active task routes. The rail renders `AssistiveFreezeInPlaceFrame` after trust posture and before draft controls. When stale recovery is active, `AssistiveDraftSectionDeck` is not mounted, so stale insert controls cannot remain visible.

## Recovery Behavior

`Regenerate in place` and `Recover in place` patch the frame without navigating away. The recovered state keeps the same component footprint and marks the preserved artifact as regenerated. Policy freshness drift remains observe-only and does not expose a local recovery button.

## Accessibility

Recoverable stale frames use `role="status"` and polite live announcements. Policy freshness drift uses `role="alert"`. The detail panel is inline disclosure with `aria-expanded`, `aria-controls`, and Escape close with focus return.
