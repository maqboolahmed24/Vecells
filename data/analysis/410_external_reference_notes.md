# 410 External Reference Notes

Sources reviewed on 2026-04-27:

- NHS England, "Guidance on the use of AI-enabled ambient scribing products in health and care settings": https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS England Digital, "IM1 Pairing integration", AI deployment guidance and Request for Change references, last edited 2026-04-23: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration
- MHRA, "Software and artificial intelligence (AI) as a medical device", updated 2025-02-03: https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device/software-and-artificial-intelligence-ai-as-a-medical-device
- MHRA, "Crafting an intended purpose in the context of software as a medical device (SaMD)", published 2023-03-22: https://www.gov.uk/government/publications/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd
- MHRA, "Impact of AI on the regulation of medical products", published 2024-04-30: https://www.gov.uk/government/publications/impact-of-ai-on-the-regulation-of-medical-products/impact-of-ai-on-the-regulation-of-medical-products

## Borrowed Into 410

- Intended-use discipline must be explicit. NHS England ambient guidance warns that flexible LLM outputs can drift beyond intended purpose and asks suppliers to define guardrails. 410 therefore stores `AssistiveCapabilityManifest` and `IntendedUseProfile` as runtime objects rather than environment flags.
- Human review and manual control boundaries matter. NHS England asks whether users can review downstream outputs, whether call-to-action prompts exist, and whether users retain manual control before information is written elsewhere. 410 therefore mints grants and settlements but never creates endpoint decisions or writes workflow state.
- IM1 AI deployment guidance says AI products are reviewed during pairing for whole-product documentation, including DCB0129, DPIA, medical-device registration where applicable, and subprocessor safety evidence, but AI-specific technical assurance remains local responsibility. 410 therefore requires local release state, kill-switch state, and schema or policy settlement before output can be renderable.
- IM1 change-control guidance requires a formal RFC with updated SCAL and documentation when an assured product materially evolves through AI or significant functional enhancement. 410 therefore treats release state and compiled policy bundle refs as invocation gates, not optional metadata.
- MHRA intended-purpose guidance says intended purpose is a boundary condition for evidence, risk management, validation, user expectations, and change management. 410 therefore binds every grant to capability code, route, subject scope, evidence class, release cohort, policy bundle, review fence, and expiry.
- MHRA software and AI medical-device guidance emphasizes safety, technical and clinical evidence, post-market surveillance, transparency, adaptivity, vigilance, and lifecycle governance. 410 therefore separates current kill-switch state, release posture, composition policy, and settlement records for replay and monitoring.

## Rejected Or Kept Out Of Scope

- No assumption that IM1 pairing supplies AI model assurance; the control plane requires local runtime gates.
- No broad "AI enabled" feature flag that widens capability behavior across routes.
- No hidden client-side route toggle that can promote shadow-only runs to visible output.
- No autonomous clinical decision, task closure, booking, pharmacy, or escalation mutation.
- No raw grant token or PHI-bearing run context in routine telemetry or audit.
- No pilot or proof-of-concept shortcut that bypasses compliance or local assurance gates.
