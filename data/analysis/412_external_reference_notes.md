# 412 External Reference Notes

Sources reviewed on 2026-04-27:

- NHS England, "Guidance on the use of AI-enabled ambient scribing products in health and care settings", last updated 2026-04-24: https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS England Digital, "IM1 Pairing integration", AI deployment guidance and Request for Change references, last edited 2026-04-23: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration
- AI and Digital Regulations Service, "Using the Digital Technology Assessment Criteria (DTAC)": https://www.digitalregulations.innovation.nhs.uk/regulations-and-guidance-for-developers/all-developers-guidance/using-the-digital-technology-assessment-criteria-dtac/
- NHS Transformation Directorate, "Digital Technology Assessment Criteria (DTAC): guidance for buyers and suppliers": https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/

## Borrowed Into 412

- Checked, human-reviewed outputs are required before further actions. NHS England ambient-scribing guidance says users should review and approve product outputs before further actions. 412 therefore keeps insert posture lease-backed and blocks stale or drifted sessions before an assistive draft can land.
- Integration with EPR/workflow is a clinical-risk issue. The ambient guidance highlights incorrect notes, manual copy-paste risk, and the need for correct integration. 412 therefore uses explicit insertion-point and slot-hash truth rather than browser focus or copy-paste-like retargeting.
- IM1 AI deployment guidance says IM1 pairing does not provide AI-specific technical assurance and deploying organisations remain locally responsible. 412 therefore treats local session fences, trust envelope posture, and publication tuple validation as runtime gates.
- DTAC posture covers clinical safety, data protection, technical assurance or security, interoperability, and usability or accessibility. 412 borrows the need for auditable, testable, versioned lease records that later UI can prove without exposing PHI-bearing draft text.
- DTAC guidance says standards should be considered throughout the lifecycle and that evidence should be documented. 412 therefore records hashes, refs, slot states, and invalidation codes rather than loose UI telemetry.

## Rejected Or Kept Out Of Scope

- No assumption that IM1 pairing, AVT registry evidence, or a completed DTAC makes a live insert safe.
- No browser-side insert legality calculation.
- No raw draft text, prompt fragments, or patient-bearing context in routine lease telemetry.
- No feedback-chain, override, trainability, monitoring, freeze-disposition, or regulatory evidence pipeline in this task.
- No frontend rendering or Playwright proof in 412; those are owned by later browser-visible tasks.
