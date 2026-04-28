# 299 Staff Booking Handoff Panel Accessibility Notes

## Landmarks and Structure

- The staff booking route remains inside the existing workspace `main` region and uses the existing shell navigation landmark.
- The booking route itself stays one peer-route region so the shell-level skip links and region cycling rules remain predictable.
- Queue, case summary, slot list, compare stage, recovery, and settlement sections each publish clear headings.

## Keyboard Order

- The keyboard model follows the same shell-first route order so operators can predict where review and action controls appear after queue churn.
- Focus order moves from the booking exception queue into slot actions, then to compare, recovery, and settlement controls.
- Slot detail uses disclosure buttons with `aria-expanded` and `aria-controls`.
- Read-only posture keeps controls reachable for review context only where the shell already allows it; booking mutation buttons are disabled instead of silently hidden.

## Status Messaging

- Live booking posture uses `role="status"` and `aria-atomic="true"` for route-level updates.
- Slot cue messaging is also exposed through status regions so confirmation-pending, held, and recovery cues are announced without moving focus.
- Pending confirmation language stays plain and non-booked.

## Focus and Recovery

- Focus protection is surfaced visually and semantically through the existing shell strip plus route markers.
- Recovery posture does not trap focus in a modal.
- Stale-owner and reminder-repair panels stay inline so the preserved compare target remains visible.

## Reflow and Visual Focus

- The route collapses from rail-plus-two-stage desktop layout to a single mission stack below tablet widths.
- Buttons and queue rows preserve visible focus indicators through the workspace token focus styling.
- Mobile and reduced-motion layouts keep the same hierarchy without horizontal overflow.
