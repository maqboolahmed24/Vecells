# 301 Algorithm Alignment Notes

## Canonical inputs honored

- `PatientActionRecoveryEnvelope`
- `PatientActionRecoveryProjection`
- `PatientIdentityHoldProjection`
- `PatientSecureLinkSessionProjection`
- `RecoveryContinuationToken`
- `PatientNavReturnContract`
- `ContactRouteRepairJourney`

## Booking-local mapping

| Booking-local failure mode | Canonical recovery posture | Booking recovery reason | Preserved summary tier | Next safe action |
| --- | --- | --- | --- | --- |
| workspace continuity drift | same-shell stale recovery | `stale_session` | `booking_safe_summary` | `refresh_surface` |
| selection snapshot stale | same-shell stale recovery | `stale_session` | `booking_safe_summary` | `refresh_surface` |
| selected slot expired or unavailable | expired action recovery | `expired_action` | `booking_safe_summary` | `choose_another_time` |
| confirmation reconciliation required | disputed confirmation recovery | `confirmation_disputed` | `booking_safe_summary` | `choose_another_time` |
| confirmation route freeze stale | same-shell stale recovery | `stale_session` | `booking_safe_summary` | `refresh_surface` |
| confirmation identity repair active | wrong-patient identity hold | `wrong_patient` | `identity_hold_summary` | `request_support` |
| manage confirmation still pending | pending recovery | `confirmation_pending` | `appointment_safe_summary` | `wait_for_confirmation` |
| manage reminder route blocked | reachability-bound recovery | `contact_route_repair_required` | `appointment_safe_summary` | `repair_contact_route` |
| waitlist offer expired | expired action recovery | `expired_action` | `booking_safe_summary` | `choose_another_time` |
| waitlist offer superseded | superseded action recovery | `superseded_action` | `booking_safe_summary` | `choose_another_time` |
| waitlist reachability blocked | reachability-bound recovery | `contact_route_repair_required` | `appointment_safe_summary` | `repair_contact_route` |

## Guardrails kept

- Disputed or pending confirmation never renders booked or fully managed reassurance.
- Wrong-patient recovery stays summary-safe and suppresses booked artifact language.
- Secure-link and authenticated recovery for the same waitlist contact-repair tuple keep the same recovery reason and next safe action.
- Contact-route repair remains a same-shell morph attached to the blocked booking summary instead of a detached stale banner.

## Route-local stale gap closure

The following route-local recovery panels are no longer authoritative for the covered failure states:

- `SelectionRecoveryPanel`
- `ReconciliationRecoveryState`
- `ManagePendingOrRecoveryPanel`
- `WaitlistExpiryOutcome`
- `WaitlistContactRepairMorph`

They still exist as legacy route-local components for non-301 scenarios, but covered booking failures now render `BookingRecoveryShell`.
