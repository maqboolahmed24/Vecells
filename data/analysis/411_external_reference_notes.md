# 411 External Reference Notes

Sources reviewed on 2026-04-27:

- NHS England, "Guidance on the use of AI-enabled ambient scribing products in health and care settings": https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/
- NHS England Digital, "Digital assurance for APIs and services", last edited 2026-02-16: https://digital.nhs.uk/developer/assurance/digital-assurance-for-apis-and-services
- NHS England Digital, "Assurance process for APIs and services", last edited 2026-02-23: https://digital.nhs.uk/developer/guides-and-documentation/onboarding-process
- Playwright, "Snapshot testing", ARIA snapshots: https://playwright.dev/docs/aria-snapshots

## Borrowed Into 411

- Human review and manual control remain explicit. The NHS England ambient-scribing guidance asks products to support review of outputs, audit, safe configuration, and bounded use. 411 therefore projects actionability separately from visibility and can keep provenance visible while blocking accept, insert, export, browser handoff, and completion.
- Safe bounded use requires local guardrails. 411 binds surface, route family, audience tier, selected anchor, publication, runtime bundle, policy bundle, and workspace trust refs instead of letting an assistive artifact appear anywhere a model returned text.
- NHS API assurance guidance expects approval before go-live and assesses safety, security, data protection, regulations, technical standards, clinical safety, and information governance. 411 therefore treats publication posture, runtime publication, and current trust inputs as gates.
- The onboarding process guidance includes clinical-risk management, medical-device status, technical and security tests, and production access controls. 411 therefore keeps trust-envelope posture conservative and auditable rather than hiding failures in client state.
- Playwright ARIA snapshots provide a YAML accessibility-tree representation and `toMatchAriaSnapshot` assertions for later browser-visible consumers. 411 borrows only the need for stable semantic states that later tests can prove from rendered envelope fields.

## Rejected Or Kept Out Of Scope

- No assumption that assurance approval or ambient-scribing guidance makes an assistive artifact automatically renderable.
- No patient-visible Phase 8 assistive rail in this task; visible surfaces are staff-only.
- No browser-side recomputation of actionability, confidence posture, or completion adjacency.
- No raw probability chip as the primary confidence display.
- No autonomous endpoint decision, workflow mutation, task closure, booking, pharmacy, or escalation action.
- No live monitoring, fairness pipeline, rollout administration UI, or final release-freeze invalidation engine in 411.
