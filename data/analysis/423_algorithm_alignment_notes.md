# 423 Algorithm Alignment Notes

Task `par_423` implements the visible stale-session recovery grammar for assistive artifacts.

## Source Alignment

- `AssistiveFreezeFrame` and `AssistiveFreezeDisposition` are represented by `freezeFrameRef`, `recoveryStatus`, `surfacePostureState`, and the preserved artifact frame.
- `ReleaseRecoveryDisposition` is represented by `releaseRecoveryDispositionRef` and the same-shell dominant action.
- `ReviewActionLease`, `AssistiveDraftInsertionPoint`, and `AssistiveDraftPatchLease` remain visible in the recovery detail panel but do not authorize stale local mutation.
- `AssistiveCapabilityTrustEnvelope` remains the upstream authority. The browser narrows actionability by suppressing controls; it does not widen a stale session.
- `DecisionEpoch` and review-version drift are explicit drift categories, not generic refresh errors.

## Gap Closures

- Stale assistive output remains visible as a preserved artifact with provenance where policy allows.
- Accept, insert, stale regenerate, export, and completion-adjacent controls are suppressed immediately.
- The primary safe action is regenerate-in-place or recover-in-place, never a generic page refresh.
- Multiple invalidation reasons are bounded to one primary reason and at most two secondary details.
- Keyboard recovery keeps focus in the action bar for the editing fixture and returns focus to the detail disclosure on Escape.

## Non-Goals

- The surface does not compute backend freshness or freeze truth.
- The surface does not promote to a full same-shell stage; that belongs to `424`.
- The surface does not re-enable draft insertion after recovery. It proves in-place regeneration grammar without claiming backend reclearance.
