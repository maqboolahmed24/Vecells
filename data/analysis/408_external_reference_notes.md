# 408 External Reference Notes

Sources reviewed on 2026-04-27:

- NHS England, "Guidance on the use of AI-enabled ambient scribing products in health and care settings", Version 2, last updated 2026-04-24: https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS Transformation Directorate, "Using AI-enabled ambient scribing products in health and care settings": https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS England Digital, "Assurance process for APIs and services", last edited 2026-02-23: https://digital.nhs.uk/developer/assurance/process-for-apis-and-services
- NHS England Digital, "Clinical risk management standards", last edited 2024-10-11: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards

## Borrowed Into 408

- Human review remains mandatory. NHS England says users should review and approve product outputs before further action, and the IG guidance states users are responsible for checking every ambient-scribe output before it affects a record. 408 therefore emits `draft_pending_review` artifacts and has no direct final-record writeback path.
- Human review and output audit are product requirements. NHS England highlights ongoing audits of clinical documentation, incident review, performance monitoring, and independent local monitoring. 408 therefore records section-level support, missing-info flags, contradiction results, calibration pins, and audit records.
- Structured templating is safer than open-ended generation. NHS England identifies summary, letter, and template-based output functions, while also warning that free-text prompting can exceed intended purpose. 408 limits output to approved draft families and approved template sections.
- Local assurance needs evidence. NHS England Digital API assurance includes clinical safety, information governance, technical standards, functional/non-functional tests, risk mitigations, and supporting evidence. 408 includes deterministic validator checks, migration constraints, and auditable support posture.
- Clinical risk management standards remain in scope. DCB0129 and DCB0160 are mandatory standards for manufacturer and deployment/use risk management. 408 therefore fails closed on invalid calibration windows, unsupported evidence, contradiction flags, and unsafe presentation.

## Rejected Or Kept Out Of Scope

- No autonomous decisioning or care-plan recommendations. The composer only drafts notes and messages for review.
- No bypass of local assurance or pilot guardrails. The runtime requires explicit calibration bundles and approved templates rather than embedded defaults.
- No raw transcript, raw draft text, raw external URL, or direct browser/writeback target in default artifact APIs.
- No visible confidence when calibration is missing, expired, invalid, or pinned to a different release cohort or watch tuple.
