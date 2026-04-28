# 315 External Reference Notes

Reviewed on 2026-04-23 for `par_315_phase5_track_backend_build_network_coordination_case_state_machine_and_lineage_links`.

The local blueprint and the frozen 311 contract remained authoritative. The official sources below were used only to keep the kernel honest about booking certainty and clinical-safety obligations.

## HL7 FHIR

- Borrowed: [Appointment - FHIR v4.0.1](https://hl7.org/fhir/R4/appointment.html)
  - The Appointment workflow explicitly treats availability checks as optional and says that seeing an available time does not guarantee a successful booking.
  - The request workflow also starts from `Appointment.status = proposed`, which reinforced the local rule that hub commit and confirmation must remain separate from booked truth.
- Borrowed: [Slot - FHIR v4.0.1](https://hl7.org/fhir/R4/slot.html)
  - Slot is defined as schedulable free/busy time, not appointment truth.
  - The Slot guidance also allows overbooking and reserved-use slots, which reinforced the local decision not to let candidate or slot state over-claim booking certainty.
- Rejected as primary authority:
  - FHIR status vocabularies were not allowed to replace the local monotone `HubCoordinationCase.status`, `externalConfirmationState`, or practice-acknowledgement debt model.

## NHS Digital Clinical Safety

- Borrowed: [Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
  - NHS England describes digital clinical safety assurance as clinical risk management for health IT and points directly to DCB0129 and DCB0160.
  - That reinforced the 315 choice to make stale-owner recovery, close blockers, and auditable transition history explicit kernel concerns rather than deferrable UI concerns.
- Borrowed: [Applicability of DCB0129 and DCB0160: Step by step guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)
  - The applicability guidance emphasizes intended use, deployment context, and publicly funded care in England.
  - That supported keeping the kernel production-shaped and migration-backed now, even though later Phase 5 tracks still fill in policy, offer, commit, and reconciliation depth.
- Rejected as primary authority:
  - NHS clinical-safety guidance did not override the local blueprint’s case vocabulary or its same-shell lineage law. It was used to validate the posture, not redefine the model.
