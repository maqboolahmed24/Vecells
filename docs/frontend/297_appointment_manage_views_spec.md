# 297 Appointment manage views spec

`PatientAppointmentDetailView` in `Manage_Appointment_Studio` is the patient-facing manage child surface for the signed-in booking shell.

## Route

- `/bookings/:bookingCaseId/manage`

## Required regions

- `AppointmentSummaryCard`
- `AttendanceInstructionPanel`
- `ManageActionDeck`
- `ReminderPreferencePanel`
- `ManagePendingOrRecoveryPanel`
- `AssistedFallbackStub`
- `CancelAppointmentFlow`
- `RescheduleEntryStage`
- `AppointmentDetailUpdateForm`

## Behavior

- Keep the booked appointment summary visible while cancel, reschedule, reminder, and detail-update child states change.
- Render cancel as a short destructive confirmation with an optional short reason only.
- Reuse the 294 and 295 slot-selection surface inside `RescheduleEntryStage` rather than creating a second picker family.
- Treat reminder posture as authoritative only through `reminderExposureState`; do not imply reminder scheduling succeeded while it is `pending_schedule` or `blocked`.
- Keep stale continuity, confirmation-pending, reminder-repair, and manage-pending states inside the same shell with explicit next-step language.
- Keep artifact and browser-handoff actions summary-first and exposure-gated from the current confirmation and artifact posture.

## Gating law

- `BookingConfirmationTruthProjection` must remain `confirmed` and `manageExposureState=writable` before ordinary manage controls are live.
- `BookingContinuityEvidenceProjection` must remain current before quiet manage success or writable manage posture is allowed.
- `ReachabilityDependency`, `ContactRouteRepairJourney`, and current route authority govern reminder-dependent reassurance and edits.
- `ArtifactPresentationContract` and `OutboundNavigationGrant` govern print and directions actions.

## Copy law

- Use calm, factual language with one next step per state.
- Use compact summary-list structure for appointment facts, reminder posture, and repair steps.
- Keep destructive wording consequence-aware and short.
- Avoid success language while manage settlement or confirmation truth is still pending or disputed.

## Reference posture

- NHS guidance informs compact summary lists, confirmation-style reassurance, date formatting, and verb-first action labels.
- Linear informs the calm hierarchy, low-noise spacing, and mature task-detail posture.
- Carbon informs bounded loading, status visibility, and concise form labeling.
- WCAG 2.2 and WAI-ARIA APG govern the cancel dialog, focus return, labels, reflow, and same-shell recovery semantics.
- Playwright governs traces, aria snapshots, visual captures, and browser-proof coverage.
