# 287 External Reference Notes

Accessed on 2026-04-18.

## Sources reviewed

- [HL7 FHIR R4 Appointment](https://hl7.org/fhir/R4/appointment.html)
- [Interface Mechanism 1 API standards](https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards)
- [General API guidance](https://digital.nhs.uk/services/gp-connect/develop-gp-connect-services/development/general-api-guidance)
- [Clinical Risk Management: its Application in the Deployment and Use of Health IT Systems](https://standards.nhs.uk/published-standards/clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems)

## Borrowed

- Borrowed: FHIR Appointment semantics reinforce that appointment-resource presence is not the same as authoritative booking truth; the repository still needs its own confirmation-truth and reconciliation model.
- Borrowed: IM1 and GP Connect guidance reinforce a supplier-specific adapter boundary, explicit standards conformance, and the need to separate generic booking orchestration from transport- or supplier-specific parsing.
- Borrowed: DCB0160 reinforces aborting calm routine booking when fresher safety truth or operational risk supersedes it.

## Rejected

- Rejected: treating transport acceptance, provider async acknowledgement, or callback arrival as booked truth.
- Rejected: creating booking-local last-write-wins callback handling outside the existing replay and receipt-checkpoint chain.
- Rejected: creating an appointment record before the current binding policy accepts the proof class.

## Notes

The local blueprint remains authoritative. These references were used only to support proof-class separation, adapter-boundary discipline, and safety-preempted recovery posture.
