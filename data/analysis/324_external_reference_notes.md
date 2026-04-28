# 324 External Reference Notes

Reviewed on 2026-04-23. These sources were used as secondary support only. The local Phase 5 and Phase 0 blueprints remained authoritative wherever the repo defined stronger rules.

## Borrowed

### Current Network Contract DES / Enhanced Access obligations

- [Primary care networks Network Contract DES from April 2026](https://www.england.nhs.uk/long-read/primary-care-networks-network-contract-directed-enhanced-service-from-april-2026/)
- [Network Contract DES hub page](https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/)
- [Network Contract DES contract specification 2025/26 and PCN requirements 2026/27](https://www.england.nhs.uk/publication/network-contract-des-contract-specification-2025-26-pcn-requirements-and-entitlements-26-27/)

Borrowed:

- patient self-serve and online-booking expectations as policy pressure, not as the internal truth model
- the need for standard-hours-safe manage posture and current-booking visibility

Rejected:

- deriving internal reminder or manage state directly from contract prose without the local truth tuple, lease, and visibility-envelope model

### NHS App web integration

- [NHS App web integration](https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration)

Borrowed:

- embed-safe route continuity and the need for browser-safe patient-manage and reminder entry points

Rejected:

- treating the NHS App container as a source of booking truth or manage authority

### HL7 FHIR R4 Appointment

- [HL7 FHIR R4 Appointment](https://hl7.org/fhir/R4/appointment.html)

Borrowed:

- authoritative booking semantics and the distinction between pending, booked, cancelled, and fulfilled appointment truth

Rejected:

- collapsing origin-practice acknowledgement into one FHIR appointment status field

### HL7 FHIR R4 Slot

- [HL7 FHIR R4 Slot](https://hl7.org/fhir/R4/slot.html)

Borrowed:

- the boundary that slot availability and booked appointment truth are separate concerns

Rejected:

- reusing slot availability as a post-book reminder or manage source of truth once the hub appointment exists

### Message Exchange for Social Care and Health (MESH)

- [MESH overview](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh)

Borrowed:

- cross-organisation messaging as a useful fallback reference for continuity and delivery evidence expectations

Rejected:

- forcing the reminder model to be MESH-specific instead of keeping reminder and continuity truth in one canonical local chain

### Digital clinical safety assurance

- [Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)

Borrowed:

- fail-closed posture for wrong-patient, stale-manage, stale-visibility, and reminder misdelivery risk

### DCB0129 / DCB0160 applicability guidance

- [DCB0129 / DCB0160 applicability guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)

Borrowed:

- direct-care safety framing for reminder failure, wrong-practice visibility, and cancellation-propagation hazards

## Resulting repo choices

- `NetworkReminderPlan` is not a bare send schedule. It carries route trust, reachability, artifact, and recovery state.
- `NetworkManageCapabilities` is a revocable lease, not a static capability cache.
- `PracticeVisibilityProjection` stays minimum-necessary and generation-bound instead of collapsing patient confirmation and practice acknowledgement.
- Reminder failure reopens acknowledgement debt and timeline truth instead of staying as side-channel notification metadata.
