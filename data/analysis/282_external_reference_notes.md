# 282 External Reference Notes

Accessed on 2026-04-18.

## Official sources reviewed

1. HL7 FHIR R4 Appointment: https://hl7.org/fhir/R4/appointment.html
2. HL7 FHIR R4 Slot: https://hl7.org/fhir/R4/slot.html
3. NHS Standards DCB0129: https://standards.nhs.uk/published-standards/clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems
4. NHS Standards DCB0160: https://standards.nhs.uk/published-standards/clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems

## What was borrowed

- From FHIR Appointment and Slot:
  - appointment-resource truth and slot-resource truth are orthogonal to local workflow state
  - availability checks improve confidence but do not by themselves prove final booked truth
  - pending, booked, and cancelled appointment semantics should not be collapsed into one generic case-status shortcut
- From DCB0129:
  - the manufacturer-side kernel should keep explicit hazards, transition controls, and traceable failure modes
  - stale-writer and wrong-patient branches should fail closed instead of degrading silently
- From DCB0160:
  - deployment and use controls need explicit operational fences, not informal UI-only assumptions
  - recovery posture should preserve auditability and explain why mutation is blocked

## What was explicitly rejected

- Rejected: mapping FHIR Appointment status directly onto `BookingCase.status`
- Rejected: treating accepted-for-processing or queued commit as booked truth
- Rejected: inferring capability, waitlist, or callback fallback from supplier name or route family
- Rejected: letting booking-branch closure imply canonical request closure

## Local blueprint override

The local Phase 4 blueprint remains authoritative when its booking-state law is stricter than generic interoperability guidance.
