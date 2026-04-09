# Audience Surface Inventory

## Summary

- Persona-surface rows: 22
- Route families represented: 20
- Shell families represented: 8

## Surface Matrix

| Persona | Surface | Audience tier | Shell | Channel profile | Ingress channel | Route family | Posture | Allowed mutations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Patient - Anonymous intake starter | Patient intake entry | patient_public | patient | browser | Browser web | Intake / self-service form (derived) | baseline | Create or update SubmissionEnvelope fields and submit for promotion. |
| Patient - Phone or IVR caller | Telephony / IVR intake capture | patient_public | patient | constrained_browser | Telephony / IVR | Intake / telephony capture (derived) | baseline | Append telephony ingress records and trigger secure-link continuation when needed. |
| Patient - Grant-scoped patient resuming a specific lineage | Secure-link recovery and claim resume | patient_grant_scoped | patient | constrained_browser | SMS continuation / secure-link continuation | Secure-link recovery and claim resume (derived) | baseline | Redeem secure link, claim or re-auth, and continue a route-bound action. |
| Patient - Authenticated portal user | Patient home and spotlight | patient_authenticated | patient | browser | Browser web | Home | baseline | No direct mutation; launch the next safe child action from the current shell. |
| Patient - Authenticated portal user | Request list and detail | patient_authenticated | patient | browser | Browser web | Requests | baseline | Route-bound follow-up such as more-info reply, recovery, or child-work entry. |
| Patient - Authenticated portal user | Appointments and manage | patient_authenticated | patient | browser | Browser web | Appointments | baseline | Manage appointment, accept waitlist or hub alternative, or continue booking-safe actions under route intent. |
| Patient - Authenticated portal user | Patient health record and documents | patient_authenticated | patient | browser | Browser web | Health record | baseline | No direct clinical mutation; only governed artifact and handoff actions where allowed. |
| Patient - Authenticated portal user | Messages and callback thread | patient_authenticated | patient | browser | Browser web | Messages | baseline | Reply, acknowledge, or act on callback and communication work under route intent and settlement truth. |
| Patient - Embedded NHS App patient user | Embedded patient shell reuse | patient_embedded_authenticated | patient | embedded | Embedded webview / NHS App-style embedded channel | Patient embedded channel parity | deferred | The same route-bound patient actions as browser mode, but only when embedded validation remains current. |
| Staff - Clinician or designated reviewer in Clinical Workspace | Clinical Workspace queue and task canvas | origin_practice_clinical | staff | browser | Browser web | /workspace, /workspace/queue/:queueKey, /workspace/task/:taskId | baseline | Claim, review, and route work under the current review lease and trust envelope. |
| Staff - Clinician or designated reviewer in Clinical Workspace | Clinical Workspace child review states | origin_practice_clinical | staff | browser | Browser web | /workspace/task/:taskId/more-info, /workspace/task/:taskId/decision, /workspace/approvals, /workspace/escalations, /workspace/changed, /workspace/search | baseline | Compose, confirm, or escalate under protected composition and settlement gates. |
| Staff - Practice operational staff | Practice operations workspace | origin_practice_operations | staff | browser | Browser web | /workspace, /workspace/queue/:queueKey, /workspace/task/:taskId | baseline | Claim, review, send more-info, and complete bounded operational actions under the current lease. |
| Staff - Hub coordinator | Hub queue | hub_desk | hub | browser | Browser web | /hub/queue | baseline | Claim, release, or transfer hub cases under lease and acting-context rules. |
| Staff - Hub coordinator | Hub case, alternatives, exception, and audit work | hub_desk | hub | browser | Browser web | /hub/case/:hubCoordinationCaseId, /hub/alternatives/:offerSessionId, /hub/exceptions, /hub/audit/:hubCoordinationCaseId | baseline | Offer alternatives, commit native booking, initiate callback fallback, or return to practice. |
| Staff - Pharmacy servicing or assurance user | Pharmacy Console case workbench | servicing_site | pharmacy | browser | Browser web | /workspace/pharmacy, /workspace/pharmacy/:pharmacyCaseId, /validate, /inventory, /resolve, /handoff, /assurance | baseline | Validate, inventory-check, resolve, hand off, and assurance-review within the active case. |
| Staff - Support desk agent | Support ticket workspace | support | support | browser | Browser web | /ops/support, /ops/support/inbox/:viewKey, /ops/support/tickets/:supportTicketId, /conversation, /history, /knowledge, /actions/:actionKey, /handoff/:supportOwnershipTransferId | baseline | Controlled resend, reissue, attachment recovery, identity correction, and handoff work under the current support action lease. |
| Staff - Support desk agent | Support replay and observe | support | support | browser | Browser web | /ops/support/replay/:supportReplaySessionId and /ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId | baseline | Observe-only review and replay release decisions; no live repair mutation until restore revalidates. |
| Staff - Support desk agent | Support-assisted capture and recovery | support | support | browser | Support-assisted capture | /ops/support, /ops/support/inbox/:viewKey, /ops/support/tickets/:supportTicketId, /conversation, /history, /knowledge, /actions/:actionKey, /handoff/:supportOwnershipTransferId | baseline | Append support-assisted ingress, reissue minimal access, or repair contact-route state under the active support ticket and disclosure ceiling. |
| Staff - Operations lead or control-room operator | Operations board | operations_control | operations | browser | Browser web | /ops/overview, /ops/queues, /ops/capacity, /ops/dependencies, /ops/audit, /ops/assurance, /ops/incidents, /ops/resilience | baseline | No governance mutation here; only bounded operational actions within the current action fence. |
| Staff - Operations lead or control-room operator | Operations investigation and intervention drill-down | operations_control | operations | browser | Browser web | /ops/:opsLens/investigations/:opsRouteIntentId, /interventions/:opsRouteIntentId, /compare/:opsRouteIntentId, /health/:opsRouteIntentId | baseline | Issue interventions only while the current fence is live, or hand off to governance with an exact return token. |
| Staff - Governance, admin, config, comms, or access lead | Governance and Admin shell | governance_review | governance | browser | Browser web | /ops/governance/*, /ops/access/*, /ops/config/*, /ops/comms/*, /ops/release/* | baseline | Approve, promote, rollback, govern access, update config, and manage communications under the current review package. |
| Staff - Assistive feature consumer | Assistive companion sidecar inside the owning task | assistive_adjunct | staff | browser | Browser web | /workspace/task/:taskId/more-info, /workspace/task/:taskId/decision, /workspace/approvals, /workspace/escalations, /workspace/changed, /workspace/search | bounded_secondary | Visible summary, bounded insert, observe-only review, or feedback capture under the current assistive grant. |

## Control Rules

- Every row names one primary shell owner and one route family so shell residency cannot be inferred from URL prefix alone.
- Every interactive row declares a channel profile and ingress channel separately so embedded, telephony, secure-link, and support-assisted capture stay orthogonal to shell ownership.
- Every mutating row cites governing objects and control-plane rules so visible actionability remains subordinate to route intent, settlement truth, continuity evidence, and visibility policy.
