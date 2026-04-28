# 337 Algorithm Alignment Notes

## Resolver map

- `family_local_confirmed`
  - Truth object: `BookingConfirmationTruthProjection`
  - Support object: `PatientAppointmentManageProjection`
  - Status rule: confirmed only when local confirmation truth is confirmed and manage exposure is writable
  - Pending rule: `Confirmation pending` plus read-only local manage when confirmation truth is still provisional

- `family_network_live`
  - Truth object: `HubOfferToConfirmationTruthProjection`
  - Support object: `PatientNetworkManageProjection330`
  - Status rule: confirmed only when the patient-facing confirmation projection is `calm_confirmed`
  - Pending rule: `Confirmation pending` while the confirmation projection is provisional, even if the network manage route is currently read-only
  - Recovery rule: recovery wording only when confirmation truth itself is blocked

- `family_waitlist_fallback_due`
  - Truth object: local waitlist provenance from `PatientBookingWorkspaceEntryProjection`
  - Support object: network choice route family for the next-safe action
  - Status rule: `Fallback due` and `Callback now safer`
  - Route rule: suppress stale local waitlist CTA and route to hub callback recovery

- `family_callback_follow_on`
  - Truth object: `PatientNetworkAlternativeChoiceProjection`
  - Status rule: choice visibility never becomes appointment confirmation wording
  - Route rule: route back into the current hub choice set with callback fallback explicit

## Shared downstream rules

- `PatientRequestDownstreamWorkRail` must reuse `UnifiedAppointmentFamilyResolver` so request detail and `/appointments` cannot diverge.
- `AppointmentManageEntryResolver` is the only route selector for family rows. Route choice is not allowed to depend on stale button text or stale calmness.
- `AppointmentFamilyTimelineBridge` may reuse timeline clusters from local or network previews, but it must expose one summary-first sequence for the selected family.
- `NetworkLocalContinuityBinder` stores selected family ref, anchor ref, request context, child route, and return target so hub follow-on work can return the patient to the same family slot.

## Wording law

- Equivalent truths use equivalent primary wording:
  - local confirmed -> `Appointment confirmed`
  - network confirmed -> `Appointment confirmed`
- Secondary nuance remains subordinate:
  - local -> `Manage live`
  - network -> `Practice informed`
- Pending network truth may not widen into calm booked language merely because the read-only network manage route exists.

