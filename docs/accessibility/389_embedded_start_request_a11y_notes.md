# 389 Embedded Start Request Accessibility Notes

## Landmarks

`EmbeddedIntakeFrame` is the only `main` landmark. The masthead uses `role="banner"`, progress uses a labelled `nav`, the anchor rail uses a labelled `aside`, and each question, review, contact, validation, and receipt panel is labelled by its visible heading.

## Validation

`EmbeddedValidationSummaryBar` uses `role="alert"`, receives programmatic focus after a blocked forward action, and links to the field using the canonical question key. Field-level errors include an off-screen `Error:` prefix and are included in `aria-describedby`.

## Autosave And Status

`EmbeddedDraftSaveChip` uses `role="status"` with `aria-live="polite"` so saving and saved states are announced without moving focus or adding toast noise.

## Controls

`EmbeddedIntakeFieldsetAdapter` renders radio groups, checkboxes, text inputs, date inputs, and textareas using native controls. The sticky `EmbeddedSubmitActionBar` remains inside the viewport on mobile and exposes one primary action plus an optional secondary back action.

## Motion And Responsive Rules

The CSS includes `prefers-reduced-motion: reduce`, stable action-reserve dimensions, safe-area insets, and a no-horizontal-overflow target for 390px mobile, 430px embedded mobile, and 1024px desktop verification.
