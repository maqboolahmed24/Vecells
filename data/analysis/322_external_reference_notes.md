# 322 External Reference Notes

Date reviewed: 23 April 2026

## Accepted support

1. NHS England Digital, Message Exchange for Social Care and Health (MESH)
   - URL: https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh
   - Used for: confirming the current secure store-and-forward model, recipient download acknowledgement, sender delivery tracking, and the current five-day non-delivery report posture.
   - Notes: supports keeping transport acceptance, recipient download, and non-delivery evidence as separate facts.

2. NHS England Digital, Message Exchange for Social Care and Health (MESH) API
   - URL: https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api
   - Last edited on page: 12 November 2025
   - Used for: current official API naming and the fact that MESH remains the supported API channel.

3. NHS England Digital, Integration patterns book, interaction methods
   - URL: https://digital.nhs.uk/developer/architecture/integration-patterns-book/interaction-methods
   - Used for: confirming MESH is still the preferred asynchronous messaging option when human response latency is expected.

4. NHS England, Digital clinical safety assurance
   - URL: https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/
   - Version on page: 1.2, 03 March 2025
   - Used for: preserving hazard-log and evidence posture around wrong-practice visibility, failed notification, and mitigation evidence.

5. NHS England Digital, Step by step guidance for DCB 0129 and DCB 0160 applicability
   - URL: https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance
   - Used for: confirming that publicly funded, near-real-time direct-care products remain in scope for DCB0129 and DCB0160 controls.

6. NHS England, Guidance on patient digital notification of diagnostic imaging reports
   - URL: https://www.england.nhs.uk/long-read/guidance-on-patient-digital-notification-of-diagnostic-imaging-reports/
   - Used for: the narrow acknowledgement principle that referrers are expected to acknowledge receipt and act on critical information, which supported retaining explicit acknowledgement evidence rather than inferring it from transport.

## Rejected or constrained use

- I did not import MESH workflow-group or mailbox configuration rules into the domain model because the local blueprint freezes message routing through `dispatchWorkflowId` and `dedupeKey`, and the repository task is about continuity truth rather than operational mailbox administration.
- I did not import imaging-specific timing rules into hub continuity; they were used only as secondary support for explicit acknowledgement posture, not as booking-domain timing law.
- Where the external sources used general language like "track delivery status", the local blueprint remained authoritative for the stronger monotone requirement that transport acceptance, delivery evidence, delivery risk, and acknowledgement stay separate.
