# 359 Dispatch A11y Notes

## Landmarks and focus

- the staff confirmation drawer uses `role="dialog"` with `aria-modal="true"`
- focus moves to the drawer heading on open
- `Escape` closes the drawer
- focus returns to the invoking button on close
- the patient shell keeps one banner and one main region

## Status semantics

- `DispatchProofStatusStrip` uses `role="status"` for non-blocking live updates
- `PatientDispatchPendingState` uses `role="status"` because it is informative, not interruptive
- `PatientConsentCheckpointNotice` uses `role="alert"` because the current path is blocked
- `DispatchContinuityWarningStrip` switches between `status` and `alert` depending on tone

## Keyboard reachability

- evidence rows are disclosure buttons, not inert summary rows
- artifact-summary expansion is keyboard reachable
- patient next-step actions remain reachable without requiring pointer gestures

## Reflow and narrow widths

- patient dispatch stacks use one-column composition below tablet widths
- chosen-pharmacy anchor remains visible before secondary metadata
- reduced-motion and 390px proofs must remain free of horizontal overflow

## Content law

- patient copy avoids transport-specific jargon such as `MESH`, `bars_fhir`, and adapter-local terms
- blocked and drifted states stay explicit rather than being hidden behind calm reassurance
- provenance remains visible when the governing pharmacy anchor changes
