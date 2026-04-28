# 320 External Reference Notes

Task: `par_320`

These sources were reviewed as secondary support only. The local blueprint remained authoritative.

## Official references used

| Source | URL | Borrowed into 320 | Explicitly not borrowed |
| --- | --- | --- | --- |
| NHS App web integration | [digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration](https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration) | Embed-safe route posture, responsive web expectation, same-shell caution around embedded surfaces and header/footer adjustments | Did not let NHS App embedding rules override the local shell, transition-envelope, or publication-fence contracts |
| HL7 FHIR R4 Slot | [hl7.org/fhir/R4/slot.html](https://hl7.org/fhir/R4/slot.html) | Treated offer rows as availability candidates rather than booked truth | Did not let FHIR Slot semantics redefine the local patient-choice solver, bucket diversity rules, or callback separation |
| HL7 FHIR R4 Appointment | [hl7.org/fhir/R4/appointment.html](https://hl7.org/fhir/R4/appointment.html) | Preserved the distinction between provisional patient choice and confirmed appointment truth | Did not allow Appointment semantics to collapse the Phase 5 confirmation gate into the offer route |
| Digital clinical safety assurance | [england.nhs.uk/long-read/digital-clinical-safety-assurance/](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/) | Supported fail-closed stale-link handling, wrong-patient prevention, and explicit recovery posture | Did not replace the local regeneration-settlement model or hazard ownership boundaries |
| DCB0129 / DCB0160 applicability guidance | [digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance) | Reinforced bounded recovery, auditable safety reasoning, and explicit residual-risk carry-forward | Did not alter the local state machine, callback fallback law, or truth-tuple contract |

## Implementation decisions informed by those sources

1. The offer route is treated as an embedded web surface from day one, so manifest and publication drift are explicit fence members.
2. A slot row is availability only; it does not imply booked truth or commit success.
3. Stale offer links fail closed to provenance or recovery, not best-effort mutation.
4. Wrong-patient and stale-tuple risks are handled server-side even if the UI still renders a stale page shell.

## Rejected shortcuts

1. Rejected using the current browser state as the source of truth for which entry was selected.
2. Rejected presenting callback as a ranked slot row.
3. Rejected silently swapping a new offer set into an existing live session without a regeneration settlement.
