# 323 External Reference Notes

Date reviewed: 2026-04-23

Local blueprint sources remained authoritative. The official sources below were used only to sharpen transport, safety, and interoperability posture for the fallback backend.

## Borrowed

### 1. Digital clinical safety assurance

Source: [NHS England, Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)

Borrowed:

- treat wrong fallback, stale callback promise, and delayed urgent return as explicit clinical-risk-management concerns
- keep `HubCoordinationException` and supervisor escalation durable rather than implicit log-only failures
- preserve clear evidence and state transitions so a CSO or deployment team can trace hazard mitigation

Applied in repo:

- fail-closed callback linkage
- fail-closed return-to-practice linkage
- persisted exception and escalation objects

### 2. DCB 0129 / DCB 0160 applicability guidance

Source: [NHS England Digital, Step by step guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)

Borrowed:

- publicly funded, direct-care, real-time or near-real-time products in England are in scope for formal clinical risk management
- deployment organisations should carry the same safety discipline even when scope questions exist

Applied in repo:

- validator and evidence pack are treated as part of the authoritative delivery surface, not optional documentation
- backend rules fail closed instead of allowing operator override when lead-time law or linkage truth is missing

### 3. Message Exchange for Social Care and Health (MESH)

Sources:

- [NHS England Digital, Message Exchange for Social Care and Health (MESH)](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh)
- [NHS England Digital, API and integration catalogue: MESH API](https://digital.nhs.uk/developer/api-catalogue/Taxonomies/rest/Taxonomies/messaging-standards)

Borrowed:

- downstream practice-facing linkage must tolerate durable message-oriented exchange rather than assuming one synchronous round trip
- nationally recognised transport and digital onboarding posture support keeping return-to-practice linkage as a durable handoff, not a transient callback to another table

Applied in repo:

- `Phase5PracticeReopenBridge` remains a typed durable bridge
- callback and return linkage require downstream references, not only command acknowledgement

### 4. Interaction methods

Source: [NHS England Digital, Interaction methods](https://digital.nhs.uk/developer/architecture/integration-patterns-book/interaction-methods)

Borrowed:

- synchronous is the default only for short, bounded transactions
- long-running or human-dependent flows should use a promise-of-work or asynchronous posture rather than pretending the business outcome is immediate

Applied in repo:

- `callback_transfer_pending` and `return_pending_link` remain blocked states until durable downstream truth exists
- hub closure is blocked until downstream linkage is complete

## Reviewed But Not Adopted As Direct Backend Rules

### NHS App and patient-content guidance

Reason rejected:

- useful for wording and surface design, but not authoritative for backend fallback state, callback legality, or reopen lineage

### General transfer-of-care document specifications

Reason rejected:

- relevant to wider correspondence and discharge payloads, but broader than the narrow 323 responsibility of governed callback and return fallback control

## Net effect on 323

The official sources reinforced three repo choices:

1. no-slot fallback must be explicit, durable, and reviewable
2. patient-facing callback truth requires current governed callback linkage
3. practice reopen must be modelled as a durable downstream handoff, not a synchronous assumption or direct parent-state mutation
