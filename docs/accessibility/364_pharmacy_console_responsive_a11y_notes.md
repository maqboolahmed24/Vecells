# 364 Pharmacy Console Responsive Accessibility Notes

## Focus and keyboard order

- the queue peek drawer keeps modal-style focus containment while open and returns focus to `pharmacy-mission-stack-queue-toggle` when closed
- the folded shell keeps a predictable tab order: shell masthead, checkpoint rail, active work region, promoted support region, bottom dock
- the watch-window banner and frozen overlay route back into recovery without losing focus context

## Reflow and obstruction

- the folded shell is proven at `320px` width without horizontal overflow
- the bottom dock reserves layout space through shell and mission-stage padding instead of relying on content being hidden underneath it
- non-actionable mission-dock content is no longer hit-testable, which prevents the sticky region from obscuring lower controls during pointer interaction
- the case resume stub preserves context but no longer blocks pointer access to content beneath it

## Target size and spacing

- mission-stack buttons use roomy touch targets and preserve separation between queue, support, and recovery actions
- the bottom dock remains usable when CTA copy wraps to two lines

## Semantics

- frozen posture uses polite `status` semantics for continuity overlay messaging
- blocked recovery uses `alert` semantics only when the state is genuinely blocking
- the queue drawer uses a dialog-style interaction model and keeps the underlying shell inert while open

## Reduced motion

- reduced-motion mode drops the sticky dock back to normal flow when needed and removes large movement from queue and shell transitions
- compact shell transitions prefer position stability over decorative motion

## Known seam

`PHASE6_BATCH_364_371_INTERFACE_GAP_MISSION_STACK.json` records the remaining browser-occlusion gap: the shell does not yet consume live `visualViewport` keyboard telemetry, so keyboard avoidance relies on safe-area and reserved scroll space rather than runtime viewport signals.
