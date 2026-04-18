# 285 External Reference Notes

Accessed on 2026-04-18.

## Official sources reviewed

- HL7 FHIR R4 Appointment: <https://hl7.org/fhir/R4/appointment.html>
- HL7 FHIR R4 Slot: <https://hl7.org/fhir/R4/slot.html>
- NHS England directly bookable appointments guidance: <https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/>
- NHS England online appointment booking: <https://www.england.nhs.uk/long-read/online-appointment-booking/>
- NHS GP appointments and bookings guidance: <https://www.nhs.uk/nhs-services/gps/gp-appointments-and-bookings/>
- MDN BigInt reference: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt>
- MDN Array.prototype.sort reference: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort>

## Borrowed into the repository design

- Borrowed: NHS England directly bookable guidance makes directly bookable appointments a practice-determined subset and says the same appointment types should be available online, by phone, or in person. That supports audience-aware bookability without assuming every lawful slot is patient-self-service safe.
- Borrowed: NHS England online-booking guidance treats clinician-calendar placeholders as unbookable. That reinforces the 284-to-285 rule that only normalized, lawful snapshot candidates may enter ranking.
- Borrowed: NHS patient appointment guidance says surgeries may ask what the patient needs help with and may make only some appointments available online. That supports keeping patient self-service narrower than staff-assisted offer sessions.
- Borrowed: FHIR Appointment and Slot semantics helped keep ranking separate from reservation and booked truth. A ranked or selected slot is still not an Appointment record and is not confirmation authority.
- Borrowed: MDN BigInt guidance and sort-stability guidance informed the use of integer micro-scores plus stable comparator ordering so replay does not depend on engine-specific floating-point tie noise.

## Rejected approaches

- Rejected: using supplier payload order, calendar order, or browser sorting as booking order authority.
- Rejected: treating FHIR Appointment or Slot presence as proof that a ranked candidate is reserved, booked, or calm.
- Rejected: treating `OfferSession.expiresAt` as hold truth or countdown authority.
- Rejected: letting convenience or preference signals leapfrog materially earlier safe slots outside the same-band frontier.
- Rejected: mixing implicit floating-point comparisons with hidden runtime tie-break behavior when the repository can persist quantized feature values and one explicit tie-break key.

## Why the blueprint still dominates

These sources were used only to calibrate external semantics:

- what counts as directly bookable supply
- how patient online-booking access differs from staff-assisted access
- why ranking must stay separate from reservation or booked truth
- how to keep deterministic numeric behavior in the JavaScript runtime

Where an external source could have widened booking meaning, the local Phase 4 blueprint remained the stronger source of truth.
