# 416 External Reference Notes

Reviewed on 2026-04-27.

## Sources Reviewed

- NHS England Digital, IM1 Pairing integration: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration
- NHS England, AI-enabled ambient scribing guidance: https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS Transformation Directorate, DTAC guidance for buyers and suppliers: https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/
- NHS Transformation Directorate, DTAC assessed section: https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/assessment-criteria-assessed-section/
- NHS England Digital, clinical safety management: https://digital.nhs.uk/services/clinical-safety/operational-clinical-safety-process/clinical-safety-management
- NHS England Digital, DCB0129 and DCB0160 standards review: https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/review-of-digital-clinical-safety-standards-dcb0129-and-dcb0160

## Borrowed

- IM1 guidance says AI or significant functional enhancement should go through RFC with updated SCAL and associated documentation, while AI-specific technical assurance remains local. This supports failing closed on stale release, policy, or runtime tuples.
- NHS ambient-scribing guidance emphasizes local controls, staff training, review/approval of outputs, incident reporting, and lawful handling of records and outputs. This supports preserving shell context while blocking stale assistive actionability.
- Current DTAC guidance expects reassessment of elements that expire or change due to upgrades, and covers clinical safety, data protection, technical security, interoperability, and usability/accessibility. This supports explicit freshness verdicts instead of feature-flag-only disablement.
- NHS clinical safety management links safety incidents to risk assessment and release management. This supports incident-triggered freeze records and explicit recovery/reclearance.

## Rejected

- External sources do not define Vecells-specific freeze modes, actionability states, or same-shell recovery grammar. The local Phase 8 blueprint remains authoritative for those algorithms.
- IM1 pairing was not treated as AI model assurance; local trust, monitoring, and freeze evidence remain separate.
- Generic disabled/error states were rejected because the local blueprint requires specific governed dispositions.
