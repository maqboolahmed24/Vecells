# 283 External Reference Notes

Accessed on 2026-04-18.

## Official sources reviewed

1. NHS Digital IM1 Pairing integration: https://digital.nhs.uk/services/gp-it-futures-systems/im1-pairing-integration
2. NHS Digital IM1 interface mechanisms guidance: https://digital.nhs.uk/services/gp-it-futures-systems/im1-pairing-integration/interface-mechanisms-guidance
3. NHS Digital GP Connect service overview: https://digital.nhs.uk/services/gp-connect
4. HL7 FHIR R4 Appointment: https://hl7.org/fhir/R4/appointment.html
5. HL7 FHIR R4 Slot: https://hl7.org/fhir/R4/slot.html
6. NHS Standards DCB0129: https://standards.nhs.uk/published-standards/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems
7. NHS Standards DCB0160: https://standards.nhs.uk/published-standards/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems

## What was borrowed

- From IM1 guidance:
  - capability must distinguish patient API, transaction API, and local component pathways explicitly
  - linkage and local-consumer readiness are first-class preconditions, not generic availability copy
- From GP Connect guidance:
  - existing appointment-management capability is a governed integration seam, not a UI heuristic derived from appointment presence
  - manage exposure and external confirmation posture need an explicit policy seam
- From FHIR Appointment and Slot:
  - slot presence and appointment presence do not themselves prove self-service or durable booked truth
  - confirmation posture and manage exposure should stay separate from raw resource visibility
- From DCB0129 and DCB0160:
  - degraded mode, stale tuple handling, and blocked mutations need explicit fail-closed reasoning and traceable evidence

## What was explicitly rejected

- Rejected: using supplier label or route family to infer the adapter path
- Rejected: treating FHIR Appointment or Slot presence as live manage capability
- Rejected: treating accepted-for-processing as booked or calm truth
- Rejected: allowing stale capability cache to remain writable after tuple drift

## Local blueprint override

The local Phase 4 blueprint remains authoritative whenever it is stricter than generic interoperability guidance.
