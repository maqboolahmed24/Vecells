# 290 External Reference Notes

Accessed on 2026-04-19.

Reviewed official references:

- NHS England Online appointment booking: [https://www.england.nhs.uk/long-read/online-appointment-booking/](https://www.england.nhs.uk/long-read/online-appointment-booking/)
- NHS England directly bookable appointments guidance: [https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/](https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/)
- NHS public GP appointments guidance: [https://www.nhs.uk/nhs-services/gps/gp-appointments-and-bookings/](https://www.nhs.uk/nhs-services/gps/gp-appointments-and-bookings/)
- GP Connect Appointment Management API overview: [https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
- GP Connect appointment troubleshooting, common causes: [https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/appointment-management-troubleshooting-guide/things-to-consider](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/appointment-management-troubleshooting-guide/things-to-consider)
- HL7 FHIR R4 Appointment: [https://hl7.org/fhir/r4/appointment.html](https://hl7.org/fhir/r4/appointment.html)
- HL7 FHIR R4 Appointment definitions: [https://www.hl7.org/fhir/R4/appointment-definitions.html](https://www.hl7.org/fhir/R4/appointment-definitions.html)
- HL7 FHIR R4 Slot: [https://hl7.org/fhir/r4/slot.html](https://hl7.org/fhir/r4/slot.html)

Borrowed:

- Borrowed: NHS England online-booking guidance reinforces that practices decide which appointments are directly bookable, so local waitlist autofill must stay inside already-governed, directly bookable supply rather than treating every future need as self-service eligible.
- Borrowed: NHS England directly bookable guidance emphasizes patient convenience, equitable access, and workflow fit, which supports keeping callback and hub fallback as first-class outcomes when local autofill is no longer truthful or safe.
- Borrowed: NHS public GP booking guidance confirms that only some appointments may be available online, which fits the design choice to keep a durable distinction between local waitlist supply and non-bookable continuation routes.
- Borrowed: GP Connect Appointment Management defines authoritative search, book, amend, and cancel operations for provider-held appointments, so released capacity must originate from authoritative cancellation/release truth rather than inferred UI visibility.
- Borrowed: GP Connect troubleshooting guidance warns that slot embargoes and local configuration drift can make nominally visible slots unavailable, which supports the explicit `stale_capacity_truth` fallback trigger.
- Borrowed: HL7 Slot R4 permits multiple allocations only when the scheduling system explicitly allows it, which supports the default local batch capacity bound of one and the requirement that any truthful-nonexclusive expansion be deliberate and audited.
- Borrowed: HL7 Appointment R4 treats the appointment as the planning/booking artifact for a concrete date and time, which supports sending accepted waitlist offers back through the same reservation and commit pipeline instead of inventing a separate booking path.

Rejected:

- Rejected: treating a merely visible or nominally bookable slot as safe released supply without authoritative release truth.
- Rejected: treating HL7 Slot's optional multi-allocation capability as permission to oversell default GP appointment supply.
- Rejected: exposing GP Connect-style staff/system operations directly as patient-facing truth instead of keeping the local patient posture in `WaitlistContinuationTruthProjection`.

No external optimization library was chosen. The micro-batched assignment stays in repo-local deterministic code so replay, audit, and tie-break behavior remain explicit.
