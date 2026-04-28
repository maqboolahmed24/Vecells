# 409 External Reference Notes

Sources reviewed on 2026-04-27:

- NHS England, "Guidance on the use of AI-enabled ambient scribing products in health and care settings": https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS England Digital, "Assurance process for APIs and services", last edited 2026-02-23: https://digital.nhs.uk/developer/assurance/process-for-apis-and-services
- MHRA, "Software and artificial intelligence (AI) as a medical device", updated 2025-02-03: https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device/software-and-artificial-intelligence-ai-as-a-medical-device
- MHRA, "Crafting an intended purpose in the context of software as a medical device (SaMD)", published 2023-03-22: https://www.gov.uk/government/publications/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd

## Borrowed Into 409

- Human oversight and review remain mandatory. NHS England ambient-scribing guidance treats generated outputs and workflow support as requiring human review, transparency, monitoring, and governance. 409 therefore emits review-only `SuggestionEnvelope` objects and never commits endpoints.
- Clinical-decision support boundaries matter. NHS England notes that outputs informing medical decisions, triage, stratification, or recommendations can affect medical device status. 409 therefore keeps endpoint suggestions typed, bounded, auditable, and incapable of creating `EndpointDecision` records.
- Local assurance needs evidence. NHS England Digital assurance requires regulations, security, clinical safety, technical standards, information governance, purpose confirmation, clinical risk management, and test evidence before go-live. 409 therefore ships a deterministic validator, migration constraints, calibration pins, audit records, and explicit abstention reason codes.
- Intended purpose must be specific. MHRA intended-purpose guidance emphasizes specifying users, environment, pathway influence, indications, contraindications, and evidence boundaries. 409 therefore binds suggestions to capability code, route, review version, release cohort, policy bundle, lineage fence, and fixed hypothesis space.
- Software and AI medical device guidance emphasizes safety, technical and clinical evidence, post-market surveillance, transparency, and vigilance. 409 therefore records calibrated full-space support, expected harm, conformal prediction sets, uncertainty posture, and settlement outcomes for monitoring and replay.

## Rejected Or Kept Out Of Scope

- No autonomous diagnosis, endpoint decisioning, triage commitment, treatment recommendation, or workflow mutation.
- No raw chatbot behavior or free-text rationale as routine telemetry.
- No hidden confidence derived from a masked subset after rule filtering.
- No local threshold defaults when calibration, uncertainty selector, conformal window, release cohort, or watch tuple are missing or stale.
- No one-click insert without a live draft lease and authoritative action settlement.
- No external presentation handoff without an outbound navigation grant.
