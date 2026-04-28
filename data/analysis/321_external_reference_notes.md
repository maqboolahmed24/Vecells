# 321 External Reference Notes

Task: `par_321`

These sources were reviewed as secondary support only. The local blueprint remained authoritative.

## Official references used

| Source | URL | Borrowed into 321 | Explicitly not borrowed |
| --- | --- | --- | --- |
| HL7 FHIR R4 Appointment | [hl7.org/fhir/R4/appointment.html](https://hl7.org/fhir/R4/appointment.html) | Preserved the difference between a proposed or pending booking path and a finally booked appointment, and kept multi-step confirmation explicit instead of treating a request as settled truth | Did not let FHIR Appointment statuses replace the local confirmation-gate, practice-ack, or continuity obligations |
| HL7 FHIR R4 Slot | [hl7.org/fhir/R4/slot.html](https://hl7.org/fhir/R4/slot.html) | Treated slot identity as bookable availability rather than guaranteed appointment certainty, including overbook and status-change realism | Did not let Slot semantics override the local reservation fence, direct-commit frontier law, or split-brain handling |
| NHS England Digital clinical safety assurance | [england.nhs.uk/long-read/digital-clinical-safety-assurance/](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/) | Reinforced explicit control of duplicate-booking, wrong-time, and wrong-site risks through auditable clinical risk management | Did not replace the local case state machine, confirmation-gate thresholds, or supplier-drift hook model |
| DCB0129 / DCB0160 applicability guidance | [digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance) | Supported treating near-real-time direct-care booking flows as in-scope for strong clinical risk controls and explicit deployment/manufacturer responsibilities | Did not alter the local ownership-fence, idempotency, or practice-acknowledgement contracts |
| Booking and Referral Standard (BaRS) | [digital.nhs.uk/services/booking-and-referral-standard](https://digital.nhs.uk/services/booking-and-referral-standard) | Supported keeping cross-provider booking and referral exchange explicit, auditable, and interoperability-shaped rather than implicit in local UI state | Did not let BaRS transport semantics collapse the local authoritative commit, confirmation, or drift-monitoring models |

## Implementation decisions informed by those sources

1. Supplier success is not treated as final appointment truth until the local confirmation gate clears.
2. Slot availability remains distinct from appointment certainty and may still require explicit confirmation, reconciliation, or drift handling.
3. Duplicate-booking and split-brain paths are persisted as explicit recovery records instead of silent retries.
4. Cross-provider exchange realism is preserved through explicit imported-confirmation correlation and supplier mirror monitoring.

## Rejected shortcuts

1. Rejected promoting a transport acknowledgement directly to booked truth.
2. Rejected minting booked truth from one weak manual evidence family.
3. Rejected treating imported supplier evidence as authoritative when source version or booking-reference correlation is weak.
4. Rejected deferring supplier drift to a later practice-manage track.
