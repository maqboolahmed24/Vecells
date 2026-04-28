# 415 External Reference Notes

Reviewed on 2026-04-27.

## Sources Reviewed

- NHS England, AI-enabled ambient scribing guidance: https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS Transformation Directorate, DTAC guidance for buyers and suppliers: https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/
- NHS Transformation Directorate, Artificial Intelligence IG guidance: https://transform.england.nhs.uk/information-governance/guidance/artificial-intelligence/
- NHS England Digital, IM1 Pairing integration AI deployment guidance: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration
- NHS England Digital, DCB0129 and DCB0160 standards review: https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/review-of-digital-clinical-safety-standards-dcb0129-and-dcb0160

## Borrowed

- From NHS England ambient scribing guidance: ongoing audits of clinical documentation, incident-report review, and system-performance monitoring are required adoption controls. This supports `ShadowComparisonRun`, `AssistiveIncidentLink`, and current trust projection rather than a static dashboard.
- From current DTAC guidance: assurance remains across clinical safety, data protection, technical security, interoperability, and usability/accessibility. This supports a trust projection that fails closed on publication, runtime, disclosure-fence, and evidence incompleteness.
- From NHS AI IG guidance: AI used in care must preserve human decision authority and use only necessary data for secondary purposes. This supports PHI-safe monitoring and settlement-backed evidence refs.
- From IM1 AI deployment guidance: IM1 pairing reviews whole-product documentation but does not provide AI-specific model or algorithm assurance. This supports local drift, fairness, and threshold monitoring as first-class backend truth.
- From DCB0129/DCB0160 review material: clinical risk management standards are being reviewed to keep pace with AI and changing workflows. This supports explicit incident linkage and conservative downgraded trust states.

## Rejected

- The external sources do not define the exact Vecells watch tuple, rollout rung, or trust-score formula. The local Phase 8 blueprint remains authoritative for those algorithms.
- Supplier-only performance claims are not sufficient for release widening. The implementation requires local offline, shadow, and visible evidence refs.
- Aggregate point estimates are not sufficient for fairness or release guards. The implementation uses interval-aware and minimum-sample behavior because the local blueprint is stricter.
