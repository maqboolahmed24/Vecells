# 288 External Reference Notes

Accessed on 2026-04-18.

## Official references reviewed

- [HL7 FHIR R4 Appointment](https://hl7.org/fhir/R4/appointment.html)
- [NHS Digital IM1 interface mechanisms guidance](https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance)
- [NHS Digital GP Connect interaction IDs](https://digital.nhs.uk/services/gp-connect/develop-gp-connect-services/integrate-with-spine/interaction-ids)
- [NHS Digital patient portal guidance](https://digital.nhs.uk/services/patient-care-aggregator/building-a-patient-portal)
- [NHS 111 guidance](https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/)

## Borrowed

- Borrowed: FHIR Appointment semantics keep appointment status and cancellation semantics disciplined; local intent and administrative workflow are not the same as authoritative cancelled truth.
- Borrowed: NHS Digital patient portal guidance explicitly distinguishes live appointment state from pending cancellation and pending reschedule request posture. That supports `supplier_pending` and no-release-before-authoritative-cancel.
- Borrowed: IM1 and GP Connect documentation reinforce that amend and cancel capability is adapter-specific and must stay behind the binding and capability layer rather than assumed for every supplier row.
- Borrowed: NHS 111 guidance reinforces routing symptom worsening or deterioration away from purely administrative appointment flows and into governed clinical safety handling.

## Rejected

- Rejected: treating a local cancel click or supplier acknowledgement as enough to release supply or close the case.
- Rejected: implementing reschedule as a detached cancel-plus-new-search flow that loses source lineage.
- Rejected: accepting symptom worsening or clinically meaningful free text as an administrative detail update.
- Rejected: widening artifact or handoff access merely because a local manage command returned `applied`.

## Local blueprint precedence

The local Phase 4 blueprint remains the source of truth where these external references are broader than the repository’s governed contract.
