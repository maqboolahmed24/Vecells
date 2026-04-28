# 284 external reference notes

Reviewed on 2026-04-18 for `par_284`.

## Sources reviewed

1. HL7 FHIR R4 Slot: [https://hl7.org/fhir/R4/slot.html](https://hl7.org/fhir/R4/slot.html)
2. HL7 FHIR R4 Appointment: [https://hl7.org/fhir/R4/appointment.html](https://hl7.org/fhir/R4/appointment.html)
3. HL7 FHIR Schedule page with R4-compatible scheduling semantics: [https://hl7.org/fhir/schedule.html](https://hl7.org/fhir/schedule.html)
4. NHS England directly bookable appointments guidance: [https://www.england.nhs.uk/publication/directly-bookable-appointments-guidance-for-practices/](https://www.england.nhs.uk/publication/directly-bookable-appointments-guidance-for-practices/)
5. NHS England GP website and online appointment guidance: [https://www.england.nhs.uk/long-read/creating-a-highly-usable-and-accessible-gp-website-for-patients/](https://www.england.nhs.uk/long-read/creating-a-highly-usable-and-accessible-gp-website-for-patients/)
6. MDN `Intl.DateTimeFormat`: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
7. MDN `Date` parsing and ISO-8601 notes: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

## Borrowed into the implementation

- From FHIR `Slot`:
  - slot availability is distinct from appointment truth
  - a slot is a schedulable time unit and may be busy or overbooked independently of the final appointment lifecycle
  - multiple slots can exist under one schedule and slot recurrence is not intrinsic to the slot instance
- From FHIR `Appointment`:
  - appointment truth is a separate object from slot availability
  - appointment workflows can be more complex than simple slot selection and may require queue-like handling
- From `Schedule` semantics:
  - schedule acts as a container for bookable slot ranges and should not be treated as appointment truth
- From NHS England directly bookable guidance:
  - directly bookable appointment surfaces need explicit online booking requirements and cannot rely on ambiguous supplier state
- From NHS England patient guidance:
  - online appointment journeys should clearly expose patient task outcomes and not depend on opaque supplier wording
  - routine and urgent booking expectations are clearer when represented as explicit timeframes and channel choices
- From MDN date/time guidance:
  - use explicit IANA timezone handling through `Intl.DateTimeFormat`
  - require ISO-8601-compatible timestamp inputs where cross-runtime behavior matters
  - do not trust offset-free local date-time strings because platform interpretation can be local-runtime dependent

## Explicitly rejected or not imported

- I did not import FHIR `Appointment` status or response workflow into `284`; that remains later commit or confirmation territory.
- I did not import NHS-facing copy rules into slot normalization or ranking logic; they are relevant to later frontend tracks, not backend snapshot truth.
- I did not infer timezone correctness from supplier-provided local timestamps without offsets. MDN confirms local interpretation can vary by runtime context, so `284` rejects those rows and routes to recovery instead.
- I did not let FHIR slot or schedule semantics redefine the local blueprint’s tuple law. The blueprint still controls snapshot selectability, stale handling, and the separation between `284` search truth and `285` offer truth.
