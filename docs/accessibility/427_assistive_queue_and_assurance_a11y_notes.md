# 427 Assistive Queue And Assurance Accessibility Notes

## Semantics

- Queue remains a `listbox` with row `option` semantics.
- `AssistiveQueueCue` uses `role="status"` and a short accessible name.
- `AssistiveQueueContextPocket` is a labelled section inside the preview pocket.
- `AssistiveOpsIncidentAndFreezeStrip` uses `role="status"` for normal posture and `role="alert"` for frozen or blocked posture.
- The bridge uses a normal button, not a custom widget.

## Keyboard

- Arrow keys continue moving queue selection.
- Enter opens the selected task.
- Space pins the preview.
- The assistive bridge does not introduce a second navigation model.

## Content

Queue copy avoids raw confidence, raw model labels, and noisy badge stacks. Ops and release surfaces use the same trust words as task 422.

## Visual Stability

Queue cue width is capped at 140px. The preview pocket width is capped at 280px. Reduced motion keeps state changes immediate.

