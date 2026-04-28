# 417 External Reference Notes

Reviewed on 2026-04-27.

## Sources Reviewed

- NHS England Digital, IM1 Pairing integration: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration
- NHS Transformation Directorate, Digital Technology Assessment Criteria guidance: https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/
- NHS Transformation Directorate, DTAC assessed section: https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/assessment-criteria-assessed-section/
- NHS England Digital, Clinical safety developer guidance: https://digital.nhs.uk/developer/guides-and-documentation/introduction-to-healthcare-technology/clinical-safety
- NHS England Digital, Applicability of DCB0129 and DCB0160: https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160
- NHS England Digital, Review of digital clinical safety standards DCB0129 and DCB0160: https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/review-of-digital-clinical-safety-standards-dcb0129-and-dcb0160
- NHS England Digital, GP Connect clinical assurance process details: https://digital.nhs.uk/developer/api-catalogue/gp-connect-access-record-structured-fhir/clinical-assurance-process-details
- NHS England, Guidance on AI-enabled ambient scribing: https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- MHRA, Medical devices: software and artificial intelligence: https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device
- MHRA, Crafting an intended purpose in the context of SaMD: https://www.gov.uk/government/publications/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd
- MHRA, Predetermined change control plans for machine learning-enabled medical devices: https://www.gov.uk/government/publications/predetermined-change-control-plans-for-machine-learning-enabled-medical-devices-guiding-principles
- GOV.UK, Impact of AI on the regulation of medical products: https://www.gov.uk/government/publications/impact-of-ai-on-the-regulation-of-medical-products/impact-of-ai-on-the-regulation-of-medical-products

## Borrowed

- IM1 Pairing now explicitly states that AI products go through whole-product documentation review during pairing, including DCB0129, DPIA, medical-device registration where applicable, and possible subprocessor safety material, while AI-specific technical assurance remains outside IM1 and local to deploying organisations.
- Current DTAC guidance says DTAC covers clinical safety, data protection, technical security, interoperability, and usability/accessibility, applies alongside other approvals, and the previous DTAC form should not be used from 6 April 2026.
- NHS clinical-safety guidance keeps DCB0129 and DCB0160 as legal clinical-risk management standards and distinguishes manufacturer and deployment responsibilities.
- GP Connect clinical-assurance guidance illustrates staged review with hazard logs, clinical safety case reports, SCAL preparation, controls, training, and final deployment readiness review.
- NHS ambient-scribing guidance reinforces that pilots do not bypass compliance, local monitoring is needed, integration affects clinical risk, and outputs that generate codes, records, or suggested actions can affect medical-device posture.
- MHRA guidance supports explicit intended-purpose boundaries, lifecycle reassessment, evidence-backed intended-use changes, and traceable change-control planning for AI/ML medical-device changes.

## Rejected

- IM1 pairing was not treated as proof of AI model, algorithm, or deployment risk assurance.
- DTAC was not treated as a replacement for DCB, MDR, DPIA, SCAL, RFC, or local technical assurance.
- External sources do not define Vecells release-action settlement states, freeze grammar, rollout slice law, or artifact-presentation policy. The local blueprint remains authoritative for those algorithms.
