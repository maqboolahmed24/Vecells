# 292 External Reference Notes

Accessed on 2026-04-19.

## Official references reviewed

- [HL7 FHIR R4 Appointment](https://hl7.org/fhir/r4/appointment.html)
- [HL7 FHIR R4 Slot](https://hl7.org/fhir/r4/slot.html)
- [GP Connect: Appointment Management - FHIR API](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
- [Interface Mechanism 1 API standards](https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards)
- [NHS England online appointment booking guidance](https://www.england.nhs.uk/long-read/online-appointment-booking/)
- [NHS England directly bookable appointments guidance](https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/)
- [GitHub webhook signature validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [Node.js timers](https://nodejs.org/download/release/v24.1.0/docs/api/timers.html)

## Borrowed

Borrowed: FHIR still treats `Slot` free/busy posture separately from `Appointment` lifecycle, so the worker keeps slot truth and appointment confirmation distinct.

Borrowed: FHIR `Appointment` remains the object that carries the authoritative booking lifecycle, so callback acceptance alone cannot become booked reassurance.

Borrowed: GP Connect Appointment Management is still an appointment-management API for booking and managing appointments on behalf of a patient, which supports the repository’s read-after-write and retrieve semantics for authoritative settlement.

Borrowed: IM1 standards still separate patient-facing and transaction-style access and still describe real-time retrieval and update behaviour, which supports a typed authoritative-read adapter seam rather than callback-only truth handling.

Borrowed: NHS England online and directly bookable appointment guidance still sharpens the difference between making appointments available or directly bookable and providing truthful patient reassurance about booked state.

Borrowed: GitHub’s webhook guidance still reflects the fail-closed pattern needed here: verify the shared-secret signature before processing the delivery further.

Borrowed: Node.js timers remain the simplest official basis for bounded in-process retry scheduling and deadline handling.

## Rejected

Rejected: treating accepted-for-processing, callback arrival, or provider-reference echo as final booked truth.

Rejected: treating the `vecells_local_gateway` simulator callback shape as a public supplier contract.

Rejected: leaving contradictory booking evidence in silent retry loops without one operational object that later staff surfaces can consume.

## Missing public docs

No public official documentation exists for this repository’s internal queue, scheduler, outbox, or retry orchestration contract.

No public official documentation exists for the `vecells_local_gateway` simulator callback contract or the repository-owned authoritative-read adapter bridge.
