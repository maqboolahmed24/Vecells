# 349 External Reference Notes

Checked on 23 April 2026.

## Accepted as secondary support

| Source | Why it was consulted | What was adopted |
| --- | --- | --- |
| [NHS Pharmacy First service specification](https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/) | Confirm current pharmacy referral posture and service boundaries. | Reinforced that referral routes and pathway participation are formal service facts and that GP Connect: Update Record is an explicit follow-on integration rather than the package-freeze authority. |
| [Booking and Referral Standard](https://digital.nhs.uk/services/booking-and-referral-standard) | Confirm current NHS wording for transferring booking and referral information between providers. | Used to justify a transport-neutral canonical referral package that exists before adapter send logic. |
| [MESH service overview](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh) | Confirm MESH remains a nationally recognised secure exchange mechanism. | Used only to support the decision that 349 must stay transport-neutral and defer actual transport binding to 350. |
| [MESH API catalogue entry](https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api) | Confirm API-based MESH usage remains current. | Used to keep the later transport track compatible with API-based transport without leaking those specifics into package freeze. |
| [GP Connect: Update Record](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record) | Confirm pharmacy outcome and consultation summary exchange remains a separate integration concern. | Reinforced that package freeze is not equivalent to downstream outcome or GP update settlement. |
| [Node.js `crypto.createHash` documentation](https://nodejs.org/api/crypto.html) | Confirm the current primary runtime reference for deterministic hashing. | Used to justify the package fingerprint and package hash implementation staying on stable SHA-256 hashing via `node:crypto`. |
| [FHIR R4 DocumentReference](https://hl7.org/fhir/R4/DocumentReference.html) | Confirm reference semantics for attached documents and summaries. | Used as secondary support for modeling supporting material as canonical document references rather than ad hoc blobs. |
| [FHIR R4 Provenance](https://hl7.org/fhir/R4/provenance.html) | Confirm provenance semantics around entities, agents, and targets. | Used as secondary support for explicit package provenance and replay audit requirements. |

## Explicitly not adopted as source-of-truth

- NHS transport specifics were **not** used to define canonical package membership. The local Phase 6 blueprint remains authoritative for what belongs in the immutable package.
- GP Connect transport and message details were **not** used to decide package omission or redaction. Those remain later transport/output concerns.
- FHIR guidance was **not** used to override the repo’s frozen object names or state machine. It only sharpened resource-shape intuition for `DocumentReference` and `Provenance`.
