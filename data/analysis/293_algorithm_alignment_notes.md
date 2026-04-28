# 293 Patient Booking Workspace Algorithm Alignment

## Governing object map

| Shell posture | BookingCase | BookingCapabilityProjection | PatientPortalContinuityEvidenceBundle | PatientNavReturnContract | Route publication rule |
| --- | --- | --- | --- | --- | --- |
| `ready` entry | `handoff_received` or `capability_checked` | `surfaceState = self_service_live` | `continuityState = preserved` | required and writable | route remains published and same-shell |
| `loading` entry | `handoff_received` | capability still resolving or freshly rendered | `preserved` | required | no detached loading shell; need summary remains visible |
| `partial` | `searching_local` | `degraded_manual` or bounded live posture | `preserved` | required | partial supplier truth may reduce actionability without replacing shell |
| `read_only` | any current case state | `assisted_only`, `linkage_required`, `local_component_required`, or `blocked` | `preserved` or `read_only` | required | return contract and selected anchor remain readable |
| `recovery_required` | `supplier_reconciliation_pending` or stale tuple | `recovery_required` | `recovery_required` | required but blocked | route freezes in place, provenance survives, ordinary mutation is closed |

## Dominant action law

The shell does not infer its CTA from route labels or cached appointment status. The dominant action is a direct widening of the current `BookingCapabilityProjection`.

- `self_service_live` -> `search_slots`
- `assisted_only` -> `request_staff_assist`
- `linkage_required` -> `repair_gp_linkage`
- `local_component_required` -> `launch_local_component`
- `degraded_manual` -> `fallback_contact_practice_support`
- `recovery_required` -> `refresh_booking_continuity`
- `blocked` -> `fallback_continue_read_only`

## Continuity law

`PatientNavReturnContract` and `PatientPortalContinuityEvidenceBundle` jointly govern the visible return path.

- The shell always records a durable return route and selected anchor.
- Refresh may restore the same child host only when the stored continuity key still matches the current booking case.
- Browser-history travel may change the child host (`workspace` -> `select` -> `confirm`) without replacing the shell continuity key.
- When continuity or publication drifts, the selected slot or booking summary remains visible only as provenance.

## Same-shell host law

Task `293` owns the stable host and not the detailed results, selection, or confirmation payloads.

- `/bookings/:bookingCaseId` hosts the initial entry shell.
- `/bookings/:bookingCaseId/select` hosts frozen slot results from task `294` and truthful selection from `295`.
- `/bookings/:bookingCaseId/confirm` hosts confirmation review, pending proof, and recovery detail from task `296`.

All three routes reuse the same header, summary rail, support rail, and return-contract binder.
