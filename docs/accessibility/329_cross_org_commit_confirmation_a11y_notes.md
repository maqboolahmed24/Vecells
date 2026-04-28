# 329 cross-org commit confirmation accessibility notes

## Modal and disclosure

- `ManualNativeBookingProofModal` uses `role="dialog"` and `aria-modal="true"`
- the modal focuses its heading on open and supports `Escape` close
- `ContinuityDeliveryEvidenceDrawer` uses a disclosure button with `aria-expanded` and `aria-controls`

## Status and separation

- hub and patient routes expose current state through visible text, not color alone
- secondary status cues remain in DOM and readable at 200% zoom
- patient confirmation uses one live region for bounded follow-on announcements without stealing focus

## Reflow and focus

- hub evidence rows and practice panel collapse to one column on narrow widths
- the patient route keeps the headline, summary, and disclosure strip within a single-column mobile flow
- focusable controls stay visible above sticky trays or fixed chrome

## Wording

- `Appointment confirmed`, `Practice informed`, and `Practice acknowledged` remain separate text labels
- disputed and drift states replace calm reassurance with explicit review wording
