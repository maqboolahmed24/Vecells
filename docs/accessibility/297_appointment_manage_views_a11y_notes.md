# 297 Appointment manage views accessibility notes

## Landmarks and structure

- Keep the manage route inside the existing booking shell landmarks.
- Use summary lists for appointment facts, reminder posture, and recovery detail so the route stays scan-first.
- Preserve one polite live region for state changes.

## Dialog and focus

- `CancelAppointmentFlow` uses `role="dialog"` and `aria-modal="true"`.
- Focus moves into the dialog on open, traps inside while open, and returns to the initiating control on close.
- Escape closes the dialog without mutating the appointment.

## Form labels

- Administrative update fields use visible top-aligned labels.
- Reminder and repair actions use explicit, verb-first labels.
- The administrative form avoids clinically meaningful free text.

## Reflow and mobile

- The manage layout collapses to a single column below desktop widths.
- The summary card remains visible above reschedule and pending states on small screens.
- Reduced motion removes decorative transitions while preserving focus and state meaning.

## State communication

- Pending and recovery states use text plus structure rather than color alone.
- Reminder repair and continuity recovery remain visible in the same shell rather than behind detached navigation.
- Artifact actions become disabled or summary-only when exposure is not handoff-ready.
