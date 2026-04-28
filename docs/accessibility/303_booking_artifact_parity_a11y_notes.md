# 303 Booking Artifact Parity Accessibility Notes

## Summary-first law

- The route keeps the receipt summary readable in semantic definition lists before any print, calendar, or handoff posture is shown.
- `AppointmentReceiptSummary` and `AttendanceInstructionPanel` remain inside the same `main` landmark.

## Focus and status

- The workspace route still owns the live route announcement.
- The artifact route keeps action changes in place and does not steal focus when switching between receipt, calendar, print, directions, and browser-handoff panels.
- Drawer and return actions stay in the existing responsive mission-stack system from task 302.

## Non-visual parity

- Receipt, attendance, reminder posture, parity evidence, and grant evidence all render as text, not icons alone.
- The print surface reuses the same summary meaning and hides only surrounding chrome in `@media print`.
- Embedded mode narrows print and browser handoff posture to `summary_only` instead of leaving dead or misleading controls.

## Checks covered in Playwright

- aria snapshots for confirmed, pending, and embedded artifact routes
- axe scans against WCAG 2.2 tags
- print-media emulation
- trace capture for continuity, mode changes, and return-safe flow
