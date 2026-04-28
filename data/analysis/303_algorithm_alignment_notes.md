# 303 Algorithm Alignment Notes

## Authoritative objects

- `BookingConfirmationTruthProjection`
  - Still decides whether artifact exposure is `hidden`, `summary_only`, or `handoff_ready`.
- `AppointmentPresentationArtifact`
  - Represented as one summary-first route-level frame instead of a detached export or print launcher.
- `PatientAppointmentArtifactProjection`
  - Implemented locally as `PatientBookingArtifactProjection303`, bound to one booking case, one source route, and one artifact mode.
- `ArtifactPresentationContract`
  - Reflected through `grantState`, `printPosture`, and `handoffReadiness`.
- `PatientArtifactFrame`
  - Implemented as `PatientBookingArtifactFrame`.
- `OutboundNavigationGrant`
  - Represented as grant evidence and return-safe handoff posture, not optimistic browser navigation.

## Local decisions

- The artifact route is `/bookings/:bookingCaseId/artifacts`.
- `artifactSource` preserves whether the patient came from confirmation or manage.
- `artifactMode` selects receipt, calendar, print, directions, or browser handoff within the same route.
- Embedded mode can only narrow readiness; it never widens a blocked or summary-only contract.

## Gap closure

- Raw file and print-first escape hatches are replaced by the same-shell artifact frame.
- Print and handoff cannot imply richer meaning than the receipt summary.
- Directions and browser handoff stay tied to grant evidence and a safe return target.
- Summary-only and blocked states still keep the receipt readable instead of hiding the artifact family.
