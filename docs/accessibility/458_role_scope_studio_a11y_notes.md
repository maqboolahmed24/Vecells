# Role Scope Studio Accessibility Notes

The studio uses native landmarks, headings, buttons, and table semantics.

## Keyboard

- Route navigation, matrix row buttons, matrix cell buttons, persona controls, denied-action controls, and action rail controls are keyboard reachable.
- Focus remains on real interactive controls; the matrix does not use ARIA grid because it does not implement spreadsheet-style arrow-key navigation.
- Selected rows use a 2px inset border and background plane without relying on color alone.

## Semantics

- The matrix is a table with a caption, column headers, and row headers.
- Every capability cell has an accessible name that includes route family, capability column, state label, and consequence.
- Denied and frozen controls expose the control state through visible text, button disabled state, `data-control-state`, and the denied-action explainer.
- Status changes use bounded `aria-live` only on action rails.

## Masking

- Synthetic fields are the only examples in fixtures and screenshots.
- Masked fields render as masked text with visible state copy.
- Hidden fields are not rendered in the mask diff after state. They are represented by aggregate "Hidden field withheld" copy in the preview pane.
- Telemetry preview uses route/persona/scope hashes and redaction class only.

## Responsive And Motion

- Desktop uses a 7:5 matrix/preview split.
- Narrow layouts fold into `mission_stack` while preserving scope, posture, selected matrix row, preview, freeze cards, tuple inspector, and return context.
- Reduced motion removes non-essential transitions while retaining state text.

## Evidence

The Playwright suite captures desktop, laptop, tablet, narrow, reduced-motion, and 200% zoom screenshots plus accessibility snapshots. It also asserts that denied, frozen, stale, permission-missing, and masked states are semantic and keyboard reachable.
