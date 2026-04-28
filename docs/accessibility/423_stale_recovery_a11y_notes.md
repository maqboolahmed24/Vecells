# 423 Stale Recovery Accessibility Notes

`AssistiveFreezeInPlaceFrame` uses a named region with status or alert semantics depending on severity.
The accessible copy mirrors `AssistiveFreezeFrame`, `ReleaseRecoveryDisposition`, and
`AssistiveDraftPatchLease` state so screen reader users hear the same stale-recovery truth as sighted users.

## Semantics

- Recoverable freeze frames use `role="status"` with `aria-live="polite"`.
- Policy freshness drift uses `role="alert"` with `aria-live="assertive"`.
- The preserved artifact uses an article with a clear accessible label.
- Suppressed controls are rendered as text with `aria-disabled="true"` rather than hidden stale buttons.

## Keyboard

- The dominant action is a native button.
- The reason detail toggle is a native button with `aria-expanded` and `aria-controls`.
- Escape closes the detail panel while focus is inside the frame and returns focus to the detail button.
- The review-version editing fixture focuses the action bar to preserve clinician orientation.

## Motion

Freeze transitions use only opacity and border-color changes. Reduced motion removes transitions and detail animation.

## Screen Reader Copy

The frame states the primary drift reason, the preserved artifact status, the suppressed actions, and the single safe next action in text. No recovery meaning is conveyed through color alone.
