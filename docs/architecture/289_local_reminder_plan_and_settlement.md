# 289 Local Reminder Plan And Settlement

`ReminderPlan` is the canonical local reminder state object for Phase 4 booked appointments. It exists to stop reminder truth leaking into transient scheduler metadata, raw transport callbacks, or ad hoc resend logic.

## Core model

- One durable `ReminderPlan` binds one authoritative appointment lineage.
- The plan anchors to `BookingConfirmationTruthProjection` and the current `AppointmentRecord`.
- `AppointmentRecord.reminderPlanRef` points back to the live plan so later patient and staff projections can resolve reminder posture from booking truth instead of inferring it from queue rows.
- The plan stores the versioned template set, template version, route profile, channel, payload ref, payload hash, contact-route refs, reachability refs, repair refs, schedule refs, suppression reasons, delivery evidence refs, and a monotone causal token.

## Scheduling law

- `createOrRefreshReminderPlan` starts only from authoritative confirmed booking truth.
- The plan is lawful only when `BookingConfirmationTruthProjection.confirmationTruthState = confirmed`, `AppointmentRecord` exists, and the current appointment remains `booked`.
- `BookingConfirmationTruthProjection.reminderExposureState` moves from `pending_schedule` to `scheduled` only after the plan has been created against current route truth.
- If booking truth drifts, the appointment is cancelled or superseded, or route authority becomes blocked, the plan suppresses or cancels future reminder work immediately.

## Schedule and delivery chain

- `ReminderPlan` owns the aggregate reminder posture.
- `ReminderScheduleEntry` owns each planned reminder send, including due time, queue idempotency key, receipt envelope ref, communication envelope ref, latest transport settlement ref, latest delivery evidence ref, and per-send state.
- `ReminderTransitionJournalEntry` records monotone plan transitions for refresh, queue, transport, delivery evidence, suppression, and repair-required actions.
- Queue and delivery truth run through `phase1_confirmation_communication_envelopes`, `phase1_confirmation_transport_settlements`, `phase1_confirmation_delivery_evidence`, and `phase1_confirmation_receipt_bridges`.

## Route authority and repair

- Scheduling binds to `contact_route_snapshots`, `reachability_dependencies`, and `reachability_assessment_records`.
- When route authority is stale, disputed, or verification is missing, the plan moves into `delivery_blocked` or `disputed` posture instead of silently dropping the reminder.
- `ContactRouteRepairJourney` is opened whenever reminder delivery cannot remain patient-safe under the current route truth.
- Delivery failure and contradictory receipts refresh reachability observations so reminder repair posture and communication posture share the same evidence chain.

## Reminder change and lifecycle drift

- Reminder-change refreshes update or supersede the current `ReminderPlan`; they do not create detached ad hoc jobs.
- Existing open schedule entries are cancelled as `reminder_plan_superseded` before new schedule entries become current.
- The aggregate plan keeps the same `reminderPlanId` across lawful refreshes so downstream surfaces can cite one authoritative reminder chain.

## Known upstream seams

- Authoritative appointment timing is still missing from `AppointmentRecord`; see [PHASE4_BATCH_284_291_INTERFACE_GAP_APPOINTMENT_RECORD_TIMING.json](/Users/test/Code/V/data/analysis/PHASE4_BATCH_284_291_INTERFACE_GAP_APPOINTMENT_RECORD_TIMING.json).
- Persisted widened appointment lifecycle states still depend on `288`; see [PHASE4_BATCH_284_291_INTERFACE_GAP_APPOINTMENT_MANAGE_STATUS_PERSISTENCE.json](/Users/test/Code/V/data/analysis/PHASE4_BATCH_284_291_INTERFACE_GAP_APPOINTMENT_MANAGE_STATUS_PERSISTENCE.json).
