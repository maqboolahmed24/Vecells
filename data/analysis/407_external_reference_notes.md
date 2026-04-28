# 407 External Reference Notes

Current date reviewed: 2026-04-27.

The local blueprint and task 404-406 contracts remain the source of truth. Official references were used only to sharpen permission, capture, retention, safety, and assurance posture.

## Official References Reviewed

- NHS England, guidance on AI-enabled ambient scribing products in health and care settings: `https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/`
- NHS Transformation Directorate, IG guidance for using AI-enabled ambient scribing products: `https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/`
- NHS England, digital clinical safety assurance: `https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/`
- NHS England Digital, introduction to healthcare technology clinical safety: `https://digital.nhs.uk/developer/guides-and-documentation/introduction-to-healthcare-technology/clinical-safety`
- NHS England Digital, clinical risk management standards: `https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards`

## Borrowed Into 407

- Ambient-scribing guidance asks organisations to clarify audio capture mode, multi-party capture, transcript speaker tagging, whether users can review and correct transcripts, retention periods, storage, sharing, legal basis, and whether consent is needed. 407 therefore records capture mode, permission evidence, diarisation mode, presentation posture, and retention envelope refs on first-class objects.
- NHS IG guidance says people should be informed when ambient scribes are used, can dissent, and objections should be respected. 407 blocks `objected`, `withdrawn`, `blocked`, and `policy_pending` permission states.
- Ambient-scribing guidance notes variability with accents, regional dialects, English as a second language, and speech disorders or impairments. 407 records `languageMode`, `audioQualityState`, `diarisationUncertaintyState`, confidence summaries, and quarantines low-quality or failed diarisation outputs.
- Ambient-scribing guidance says recordings and transcripts may be deleted once an accurate summary is signed off unless needed for safety and accuracy monitoring. 407 implements explicit retention envelopes and deletion scheduling instead of treating audio and transcript artifacts as permanent by default.
- NHS digital clinical safety assurance guidance describes DCB0129/DCB0160 as clinical risk management and emphasizes documented hazard/risk evidence. 407 emits audit records and stable event payload hashes and routes uncertain or failed artifacts to quarantine/recovery.
- NHS developer clinical safety guidance says builders must identify potential hazards and mitigations. 407 treats raw blob URLs, direct downloads, raw transcript text in commands, automatic ambient capture, redaction failure, and permission drift as explicit blocked or recovery states.

## Rejected Or Kept Out Of Scope

- The official guidance is not treated as permission for broad live ambient capture. The first release keeps live ambient disabled unless manual-start plus tenant policy, local governance, and explicit permission are present.
- Patient-facing transparency copy and UI viewer polish were not implemented here. Task 407 owns backend transcript artifacts, not frontend patient or staff copy.
- Supplier claims about transcription quality were not accepted as sufficient. 407 persists local quality state, confidence summary, and quarantine behavior for local evaluation and later safety review.
- Raw browser downloads and detached blob previews were rejected even when a transcript exists. Presentation must use `TranscriptPresentationArtifact` and the artifact-presentation policy path.
