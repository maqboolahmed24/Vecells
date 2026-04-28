# 286 External Reference Notes

Accessed on 2026-04-18.

## Official sources reviewed

- HL7 FHIR R4 Appointment: <https://hl7.org/fhir/R4/appointment.html>
- HL7 FHIR R4 Slot: <https://hl7.org/fhir/R4/slot.html>
- PostgreSQL explicit locking: <https://www.postgresql.org/docs/17/explicit-locking.html>
- NHS England directly bookable appointments guidance: <https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/>
- NHS England online appointment booking: <https://www.england.nhs.uk/long-read/online-appointment-booking/>

## Borrowed into the repository design

- Borrowed: FHIR Slot and Appointment semantics reinforce that visible availability, reservation, and booked truth are different objects. That supports keeping `OfferSession`, `CapacityReservation`, and later commit truth separate.
- Borrowed: PostgreSQL explicit-locking guidance reinforces short critical sections and not holding the serializer across non-database work. That matches the reservation authority shape here: compare-and-set only, then release.
- Borrowed: NHS England directly bookable guidance supports keeping directly bookable posture distinct from general booking intent. That aligns with `truthful_nonexclusive` versus `exclusive_hold` rather than quietly upgrading every selectable slot into reserved truth.
- Borrowed: NHS England online booking guidance supports keeping some supply available only through assisted channels. That matches the explicit nonexclusive and degraded-manual postures instead of pretending every staff-visible offer can become a patient-safe real hold.

## Rejected approaches

- Rejected: treating FHIR Slot presence as reservation or exclusivity proof.
- Rejected: treating Appointment semantics as evidence that a selected slot is already booked before commit and confirmation truth land.
- Rejected: carrying a booking-local pseudo-hold model beside `CapacityReservation`.
- Rejected: holding the reservation serializer across waitlist, notification, or external-adapter work.
- Rejected: importing supplier-specific pseudo-hold semantics into booking-core without a matrix row and binding profile already frozen by `283`.

## Supplier-document posture

No additional supplier-specific documentation was consumed for `286`.

Reason:

- the active adapter semantics needed for this slice were already frozen in `279` and implemented in `283`
- this task needed truthful separation between nonexclusive selection and real hold, not a new supplier onboarding or translation pack

If a later supplier adapter claims real hold semantics, that later track must bind the proof to the exact matrix row and binding profile ids instead of widening booking-core meaning here.

## Why the blueprint still dominates

These sources were used only to avoid category mistakes:

- slot existence is not reservation truth
- reservation truth is not booking confirmation truth
- lock scope must stay short and fenced
- online-bookable posture may be narrower than staff-assisted posture

Where an external source could have widened or simplified the semantics, the local Phase 0 and Phase 4 blueprints remained authoritative.
