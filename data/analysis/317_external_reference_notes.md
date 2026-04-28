# 317 External Reference Notes

Reviewed on 23 April 2026. The local blueprint remained authoritative. Current official material was used only to confirm terminology, current-year DES framing, interoperability expectations, and clinical-safety posture.

## Borrowed

- [Network Contract DES: Contract specification 2025/26 – PCN requirements and entitlements](https://www.england.nhs.uk/publication/network-contract-des-contract-specification-2025-26-pcn-requirements-and-entitlements/)
  Page first published 27 March 2025 and updated 31 July 2025. Used for present-year DES framing, Enhanced Access wording, and the requirement that PCNs support interoperability across participating organisations, including view, book, and cancel appointment flows plus record access or update when those capabilities are consistently available.
- [Securing excellence in primary care (GP) digital services: The primary care (GP) digital services operating model](https://www.england.nhs.uk/long-read/securing-excellence-in-primary-care-gp-digital-services-the-primary-care-gp-digital-services-operating-model/)
  Used as supporting NHS England digital material for interoperability and patient-online capability language. It reinforced that digital services must support safe and effective cross-practice workflows, but it did not override the local tuple or ranking laws.
- [Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
  Updated 4 March 2025. Used to confirm that policy-driven booking and visibility decisions belong inside formal clinical risk management and that DCB0129 and DCB0160 remain the applicable safety standards.
- [Step by step guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)
  Used to support the manufacture and deployment applicability posture and the recommendation that compliance is specified in contracting mechanisms.
- [Standards for NHS App integration](https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration)
  Used only as a secondary confirmation that NHS digital integrations still expect DCB0129 and DCB0160 compliance when patient-facing booking or visibility flows are exposed through NHS channels.

## Rejected Or Not Adopted

- DES payment, reimbursement, and workforce rules were not pulled into the executable tuple because they do not decide routing, approved variance, trust admission, acknowledgement debt, or replay semantics.
- NHS App presentation requirements were not imported into the evaluator because 317 owns backend tuple compilation and replay, not channel-specific UI grammar.
- No external source was allowed to weaken the local blueprint rule that service-obligation and practice-visibility outputs may not silently rerank candidates.
