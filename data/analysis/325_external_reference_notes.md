# 325 External Reference Notes

Accessed on 2026-04-23.

These references were used as secondary support only. The local Phase 0 and Phase 5 blueprints remain authoritative where wording differs.

## Reviewed Official Sources

- HL7 FHIR R4 Appointment: https://hl7.org/fhir/R4/appointment.html
- HL7 FHIR R4 Slot: https://hl7.org/fhir/R4/slot.html
- Message Exchange for Social Care and Health (MESH): https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh
- Message Exchange for Social Care and Health API: https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api
- NHS Integration Patterns, interaction methods: https://digital.nhs.uk/developer/architecture/integration-patterns-book/interaction-methods
- NHS App web integration: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration
- Digital clinical safety assurance: https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/
- DCB0129 / DCB0160 applicability guidance: https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance

## Borrowed

- Borrowed: FHIR still distinguishes appointment lifecycle from slot availability, which supports keeping imported or mirrored supplier evidence separate from calm booking truth until correlation is lawful.
- Borrowed: MESH still models delivery and receipt as message-transport evidence, which supports keeping practice continuity delivery checkpoints explicit instead of inferring acknowledgement from dispatch acceptance.
- Borrowed: NHS interaction-method guidance still supports separate synchronous and asynchronous integration modes, which fits the split between imported confirmation, supplier polling, and callback ingestion.
- Borrowed: NHS App integration guidance still supports treating web integration as one governed channel among several, not as a reason to collapse reminder or manage truth into a single outbound status bit.
- Borrowed: NHS clinical-safety guidance still reinforces fail-closed handling for wrong-site booking, stale supplier drift, and ambiguous confirmation.

## Rejected

- Rejected: treating a plausible supplier booking reference or callback arrival as final booking truth without the live provider binding hash and current truth tuple still matching.
- Rejected: thawing frozen manage posture just because a later payload says `booked` when the worker cannot prove it is newer and stronger than the recorded drift.
- Rejected: using message dispatch success as proof that the origin practice has been informed or has acknowledged the booking.
- Rejected: calming backfill into a booked or acknowledged state when lineage remains ambiguous.

## Internal Boundary Note

No public official documentation exists for this repository’s internal worker scheduler, retry queue, lease persistence, or service-definition runtime. Those details remain local implementation territory.
