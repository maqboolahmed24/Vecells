# 318 External Reference Notes

Reviewed on `2026-04-23` in `Europe/London`.

The local blueprint and the frozen `312` and `317` contract packs remained authoritative. External material was used only to keep the ingestion, trust, and ledger posture aligned with current official semantics.

## Borrowed

- [HL7 FHIR R4 Slot](https://hl7.org/fhir/R4/slot.html)
  Borrowed the distinction that a slot is availability, not confirmation. The pipeline therefore normalizes supply into provisional `NetworkSlotCandidate` rows instead of overstating supplier rows as appointments.
- [HL7 FHIR R4 Appointment](https://hl7.org/fhir/R4/appointment.html)
  Borrowed the rule that booking certainty is expressed at the appointment layer, not the raw availability layer. Rejected any design that would let `NetworkSlotCandidate` imply a booked state.
- [Primary Care Networks Network Contract DES from April 2026](https://www.england.nhs.uk/long-read/primary-care-networks-network-contract-directed-enhanced-service-from-april-2026/)
  Borrowed only the fact that the current live DES publication as of `2026-04-23` is the 2026/27 pack. Rejected baking service-year literals into adapter code; year-sensitive obligations stay in the compiled policy packs.
- [Network contract DES guidance for 2025/26 in England, Part A, clinical and support services, section 8](https://www.england.nhs.uk/publication/network-contract-directed-enhanced-service-guidance-for-2025-26-in-england-part-a-clinical-and-support-services-section-8/)
  Borrowed the obligation shape: governed Enhanced Access windows, comparable coverage, and make-up duties. The accessible publication shell did not change the repo rule that numeric service obligations belong in the 317 policy family, not in hardcoded adapter logic.
- [Network contract DES network standard hours FAQ](https://www.england.nhs.uk/publication/network-contract-des-network-standard-hours-faq/)
  Borrowed the operational framing that standard hours and replacement coverage are a governed network obligation. Rejected any attempt to let a manual board bypass the same minutes or make-up accounting.
- [Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
  Borrowed the fail-closed safety posture for stale or wrongly trusted booking data and the need for explicit evidence and audit.
- [DCB0129 / DCB0160 step-by-step guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)
  Borrowed the hazard-oriented framing for wrong-time and wrong-site booking risk. This directly informed `CAPACITY_STALE`, `CAPACITY_QUARANTINED`, replay fixtures, and the refusal to surface weak feeds as ordinary truth.

## Rejected Or Contained

- Rejected treating current DES publication text as a runtime constant. The repo already freezes those obligations through versioned policy packs.
- Rejected treating a `Slot` as equivalent to a booked appointment.
- Rejected treating degraded or quarantined feeds as patient-offerable because a human operator can see them.
- Rejected hiding trust posture inside mock helpers; the runtime keeps trust and freshness on the persisted candidate and admission rows.

## Implementation Consequences

- `requiredWindowFit` stayed ordinal as `2`, `1`, `0`.
- minutes and make-up obligations are emitted as ledgers, not inferred later from UI counts.
- stale, degraded, quarantined, hidden, policy-invalid, and duplicate supply all emit typed exceptions.
