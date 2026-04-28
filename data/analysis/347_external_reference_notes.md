# 347 External Reference Notes

Reviewed on 2026-04-23. The local blueprint and the frozen `342` contracts remained the source of truth. External sources were used only to confirm current terminology, service-lane naming, governance posture, and testing/audit patterns.

## Borrowed

| Source | Borrowed into 347 | Decision |
| --- | --- | --- |
| [NHS England: Launch of NHS Pharmacy First advanced service](https://www.england.nhs.uk/long-read/launch-of-nhs-pharmacy-first-advanced-service/) | Confirmed the three service elements and the seven first-production clinical pathways with their age ranges. | Borrowed the current pathway set and service-lane naming. |
| [NHS England: Community pharmacy advanced service specification - NHS Pharmacy First Service](https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/) | Confirmed current pathway/PGD grouping and that the active Pharmacy First service literature still groups implementation around the same seven pathway families. | Borrowed terminology and pathway family boundaries only; no drug-selection logic was encoded here. |
| [NHS England Digital: Applicability of DCB 0129 and DCB 0160](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160) | Reinforced that safety-relevant digital changes require explicit governance and good-practice change control. | Borrowed the governance posture behind immutable promotion, hazard refs, and replay/audit retention. |
| [HL7 FHIR R4 Provenance](https://hl7.org/fhir/R4/provenance.html) | Used as supporting rationale for immutable version evidence, predecessor/supersession chains, and retaining the exact evidence snapshot that produced a result. | Borrowed provenance vocabulary only; the repo’s own contract shape stayed authoritative. |
| [HL7 FHIR R4 AuditEvent](https://hl7.org/fhir/R4/auditevent.html) | Used as support for keeping durable evaluation/explanation history and auditable promotion/replay flows. | Borrowed audit posture only; no direct AuditEvent mapping was imposed. |
| [StrykerJS NodeJS guide](https://stryker-mutator.io/docs/stryker-js/guides/nodejs/) | Used to justify mutation-oriented tests that target dangerous rule-pack changes instead of only happy-path assertions. | Borrowed testing posture; no full mutation-test infrastructure rollout was added in this task. |
| [StrykerJS TypeScript checker](https://stryker-mutator.io/docs/stryker-js/typescript-checker/) | Used to confirm the repo can later harden mutation tooling with type-aware mutants if needed. | Borrowed as a later-quality note, not a current dependency. |
| [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests?lang=curl) | Used as a supporting pattern for replay/idempotency-key semantics on evaluation commands. | Borrowed the safe-retry pattern only. |

## Rejected Or Not Directly Encoded

| Source | Rejected detail | Why it was rejected here |
| --- | --- | --- |
| NHS Pharmacy First PGD PDFs linked from the service-spec page | Medication- and formulation-specific supply logic. | `347` owns eligibility and routing, not medicine selection or dispense protocol execution. |
| NHS England launch/update operational detail | Channel-specific delivery, supplier rollout, and local workflow arrangements. | Those are downstream operational concerns for later provider-choice, dispatch, and rollout tracks. |
| FHIR Provenance/AuditEvent full resource models | One-to-one schema mapping into the repo. | `342` already froze the object family; adding a direct FHIR schema would have created an unowned parallel contract. |
| Full Stryker rollout | New mutation CI stack, config, and reporting pipeline. | The prompt required mutation-oriented tests now, not platform-level mutation-test adoption across the repo. |

## Notes

- The NHS sources confirmed that the current public service still centres the same seven pathway families and the broader Pharmacy First lane distinction.
- The safety sources supported immutable pack promotion, auditability, and explicit regression barriers.
- The engineering sources supported deterministic replay and mutation-oriented proof style but did not override the local blueprint.
