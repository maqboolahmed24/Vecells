# 421 Override Reason Accessibility Notes

## Semantics

`AssistiveEditedByClinicianTrail` is a labelled section inside the existing assistive rail complementary region. The `FinalHumanArtifact` is a labelled section with normal heading structure and a small definition list for author and settlement metadata.

The reason code group uses native checkbox inputs inside a fieldset and legend. The group is described by persistent helper text or an alerting validation message. This keeps multiple reason selection simple and avoids custom widget keyboard behavior.

The diff drawer and reason sheet are inline disclosures, not modal dialogs. Buttons carry `aria-expanded` and `aria-controls`. `Escape` closes the currently open override detail while focus is inside the surface and returns focus to the disclosure button.

## Validation

Mandatory reason flows display `AssistiveOverrideReasonValidationState` with `role="alert"` only after the clinician tries to submit without a coded reason. The copy is text-based and does not rely on the caution color.

Accepted unchanged flows keep reason capture optional and show that no coded reason is required.

## Privacy

Optional free-text note capture is disclosure-fenced. The visible completed state confirms that a note was captured without rendering note text. Routine telemetry should carry refs and reason codes only, matching 413 feedback-chain rules.

## Motion

The reason sheet uses 140ms reveal, diff detail uses 120ms, and validation hints use 100ms. `prefers-reduced-motion` removes the transitions and animations.

## Keyboard Checks

- Tab reaches the edit delta disclosure before reason capture.
- Enter and Space activate disclosure buttons through native button behavior.
- Space toggles focused reason checkboxes.
- Submit with no code in a mandatory flow exposes the alert.
- Escape closes an open diff or reason sheet and returns focus to the invoking button.
