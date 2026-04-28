
# 278 Phase 4 Booking Case Route and Projection Contract

This document freezes the patient-side route family and projection bundle that later Phase 4 frontend and backend tasks must consume.

## Route-family registry

| Path | Projection | Transition type | History policy | Dominant action |
| --- | --- | --- | --- | --- |
| /appointments | PatientAppointmentListProjection | same_shell_section_switch | push | review_or_manage |
| /bookings/:bookingCaseId | PatientAppointmentWorkspaceProjection | same_object_child | push | search_or_resume |
| /bookings/:bookingCaseId/select | PatientAppointmentWorkspaceProjection | same_object_child | push | select_slot |
| /bookings/:bookingCaseId/confirm | PatientAppointmentWorkspaceProjection | same_object_child | replace | confirm_slot |
| /appointments/:appointmentId | PatientAppointmentManageProjection | same_section_object_switch | push | review_appointment |
| /appointments/:appointmentId/manage | PatientAppointmentManageProjection | same_object_child | push | manage_appointment |
| /appointments/:appointmentId/cancel | PatientAppointmentManageProjection | same_object_child | push | cancel_appointment |
| /appointments/:appointmentId/reschedule | PatientAppointmentManageProjection | same_object_child | push | reschedule_appointment |

### Governing rules

1. All booking and appointment routes stay inside one signed-in `PersistentShell`.
2. `/bookings/:bookingCaseId/select -> /bookings/:bookingCaseId/confirm` uses `historyPolicy = replace` until authoritative settlement lands.
3. `SelectedAnchor`, return contract, continuity evidence, and publication posture are explicit contract fields, not browser-history guesswork.
4. Route publication drift freezes the shell in place through `RouteFreezeDisposition` or `ReleaseRecoveryDisposition`; it does not silently leave stale controls live.

## Patient projection bundle

| Projection | Routes | Surface states |
| --- | --- | --- |
| PatientAppointmentListProjection | /appointments | loading, empty_actionable, ready, partial, recovery_required |
| PatientAppointmentWorkspaceProjection | /bookings/:bookingCaseId, /bookings/:bookingCaseId/select, /bookings/:bookingCaseId/confirm | searching, offers_ready, selecting, revalidating, confirmation_pending, fallback_required, recovery_required |
| PatientAppointmentManageProjection | /appointments/:appointmentId, /appointments/:appointmentId/manage, /appointments/:appointmentId/cancel, /appointments/:appointmentId/reschedule | ready, supplier_pending, reconciliation_required, read_only, recovery_required |
| PatientAppointmentArtifactProjection | /appointments/:appointmentId, /appointments/:appointmentId/manage | summary_only, renderable, handoff_ready, placeholder_only, recovery_required |

## API surface skeleton

| Method | Path | Purpose | Later owner |
| --- | --- | --- | --- |
| POST | /v1/bookings/cases | Create one BookingCase from one current BookingIntent handoff and acknowledge lineage ownership. | par_282 |
| GET | /v1/bookings/cases/{bookingCaseId} | Read the current BookingCase and authoritative same-shell route posture. | par_282 |
| POST | /v1/bookings/cases/{bookingCaseId}:search | Resolve current SearchPolicy and start or refresh local slot search against the active capability tuple. | par_282 |
| POST | /v1/bookings/cases/{bookingCaseId}:select-slot | Select one offered slot under the current OfferSession and selected-anchor tuple hash. | par_282 |
| POST | /v1/bookings/cases/{bookingCaseId}:confirm | Start the BookingTransaction commit path under request and reservation fences. | par_282 |
| GET | /v1/appointments/{appointmentId} | Read one authoritative AppointmentRecord plus manage posture projection. | par_282 |
| POST | /v1/appointments/{appointmentId}:cancel | Run managed appointment cancellation under current fences and capability truth. | par_282 |
| POST | /v1/appointments/{appointmentId}:reschedule | Start replacement search under the governing BookingCase and current manage posture. | par_282 |
| POST | /v1/bookings/cases/{bookingCaseId}:join-waitlist | Join or refresh waitlist continuation under current local-booking truth. | par_282 |
| POST | /v1/bookings/cases/{bookingCaseId}:fallback-callback | Transfer current booking lineage into callback fallback when required fallback route is callback. | par_282 |
| POST | /v1/bookings/cases/{bookingCaseId}:fallback-hub | Transfer current booking lineage into hub fallback when required fallback route is hub. | par_282 |

## Closure law

The booking surface may create, search, select, confirm, waitlist, cancel, reschedule, or transfer fallback state. It does **not** close the canonical request. `LifecycleCoordinator` remains the only request-closure authority.
