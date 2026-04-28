# 306 Booking Triage Notification Integration Spec

## Purpose

`306` publishes one governed seam between Phase 3 triage, Phase 4 booking, lifecycle coordination, and patient-safe booking notifications.

## Integration objects

- `BookingIntent` from direct resolution remains the only launch object.
- `BookingCase.sourceDecisionEpochRef` anchors the downstream booking lineage to the source decision.
- `LineageCaseLink(caseFamily = booking)` remains proposed until booking accepts it.
- `LifecycleCoordinator` records handoff, pending, confirmed, waitlist, and reopened milestones.
- notification entry routes stay inside the owning patient booking shell.

## Route surface

### Query

- `GET /v1/bookings/cases/{bookingCaseId}/triage-notification/current`

### Commands

- `POST /internal/v1/workspace/tasks/{taskId}:accept-booking-handoff`
- `POST /internal/v1/bookings/cases/{bookingCaseId}:refresh-triage-notification`
- `POST /internal/v1/bookings/cases/{bookingCaseId}:dispatch-latest-notification`

## Authoritative rules

1. Booking accepts handoff only while the source decision epoch and proposed lineage link are current.
2. Request workflow state moves through lifecycle-backed handoff milestones instead of booking-local shortcuts.
3. Patient status and notification copy remain coupled to booking confirmation truth.
4. Duplicate downstream events collapse through the booking lineage dedupe key instead of emitting repeat reassurance.
5. Notification entry returns through `/bookings/:bookingCaseId` with continuity and trust markers intact.

## Proven scenarios

| Scenario | Staff route | Patient route | Expected truth |
| --- | --- | --- | --- |
| Live handoff | `/workspace/bookings/booking_case_306_handoff_live` | `/bookings/booking_case_306_handoff_live?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link` | `handoff_active` with no booked reassurance |
| Pending confirmation | `/workspace/bookings/booking_case_306_confirmation_pending` | `/bookings/booking_case_306_confirmation_pending/confirm?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link` | `confirmation_pending` in both shells |
| Confirmed manage entry | `/workspace/bookings/booking_case_306_confirmed` | `/bookings/booking_case_306_confirmed/manage?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link` | authoritative confirmed booking |
| Reopened recovery | `/workspace/bookings/booking_case_306_reopened` | `/bookings/booking_case_306_reopened?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link` | governed reopen back to recovery / triage |

## Dedupe model

- Key shape: `booking_triage_notification::{requestId}::{statusDigest}`
- Replay classes:
  - `accepted_new`
  - `semantic_replay`
  - `stale_ignored`

## Browser contract

### Patient shell

- `data-origin-key`
- `data-notification-state`
- `data-route-key`
- `data-booking-case`

### Staff shell

- `data-booking-case`
- `data-confirmation-truth`
- `data-task-settlement`
- `data-review-lease-state`
- `data-exception-class`
