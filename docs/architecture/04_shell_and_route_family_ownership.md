# Shell And Route Family Ownership

## Shell Ownership Matrix

| Shell type | Primary route families | Bounded secondary surfaces | Cross-shell pivots |
| --- | --- | --- | --- |
| patient | Intake / self-service form (derived)<br>Intake / telephony capture (derived)<br>Secure-link recovery and claim resume (derived)<br>Home<br>Requests<br>Appointments<br>Health record<br>Messages<br>Patient embedded channel parity | Secure-link recovery<br>Embedded channel parity |  |
| staff | /workspace, /workspace/queue/:queueKey, /workspace/task/:taskId<br>/workspace/task/:taskId/more-info, /workspace/task/:taskId/decision, /workspace/approvals, /workspace/escalations, /workspace/changed, /workspace/search | Assistive companion sidecar<br>Approvals and escalations as same-shell peers or side stages | Downstream child domains contribute data and actions but do not take shell ownership from the workspace. |
| hub | /hub/queue<br>/hub/case/:hubCoordinationCaseId, /hub/alternatives/:offerSessionId, /hub/exceptions, /hub/audit/:hubCoordinationCaseId | Alternatives, exceptions, and audit remain same-shell child work | Booking, callback, and practice-ack domains contribute truth without taking shell ownership. |
| pharmacy | /workspace/pharmacy, /workspace/pharmacy/:pharmacyCaseId, /validate, /inventory, /resolve, /handoff, /assurance | Compare, inventory, handoff, and assurance child routes | The /workspace prefix does not change shell ownership. |
| support | /ops/support, /ops/support/inbox/:viewKey, /ops/support/tickets/:supportTicketId, /conversation, /history, /knowledge, /actions/:actionKey, /handoff/:supportOwnershipTransferId<br>/ops/support/replay/:supportReplaySessionId and /ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId | Replay and observe child routes<br>Support-assisted capture inside the ticket shell | Support replay, identity, and access repair remain support-shell work rather than operations or governance drill-down. |
| operations | /ops/overview, /ops/queues, /ops/capacity, /ops/dependencies, /ops/audit, /ops/assurance, /ops/incidents, /ops/resilience<br>/ops/:opsLens/investigations/:opsRouteIntentId, /interventions/:opsRouteIntentId, /compare/:opsRouteIntentId, /health/:opsRouteIntentId | Investigation, compare, health, and intervention drill-down | Governance handoff is explicit and reversible through OpsGovernanceHandoff and OpsReturnToken.<br>/ops/audit, /ops/assurance, /ops/incidents, and /ops/resilience remain operations-owned even when governance opens read-only pivots. |
| governance | /ops/governance/*, /ops/access/*, /ops/config/*, /ops/comms/*, /ops/release/* | Read-only evidence pivots into operations audit, assurance, incidents, and resilience | Read-only pivots may not take ownership of an in-progress governance route family. |
| assistive | Assistive evaluation, replay, monitoring, and release-control surfaces (derived) | Live care and support use remains a bounded companion inside the owning shell | Standalone assistive shell remains conditional until later work publishes concrete routes. |

## Route Family Claims

| Route family | Shell | Ownership mode | Route contract | Posture |
| --- | --- | --- | --- | --- |
| Intake / self-service form (derived) | patient | shell_root | derived | baseline |
| Intake / telephony capture (derived) | patient | same_shell_peer | derived | baseline |
| Secure-link recovery and claim resume (derived) | patient | same_shell_child | derived | baseline |
| Home | patient | shell_root | yes | baseline |
| Requests | patient | same_shell_peer | yes | baseline |
| Appointments | patient | same_shell_peer | yes | baseline |
| Health record | patient | same_shell_peer | yes | baseline |
| Messages | patient | same_shell_peer | yes | baseline |
| Patient embedded channel parity | patient | same_shell_peer | yes | deferred |
| /workspace, /workspace/queue/:queueKey, /workspace/task/:taskId | staff | shell_root | yes | baseline |
| /workspace/task/:taskId/more-info, /workspace/task/:taskId/decision, /workspace/approvals, /workspace/escalations, /workspace/changed, /workspace/search | staff | same_shell_child | yes | baseline |
| /hub/queue | hub | shell_root | yes | baseline |
| /hub/case/:hubCoordinationCaseId, /hub/alternatives/:offerSessionId, /hub/exceptions, /hub/audit/:hubCoordinationCaseId | hub | same_shell_child | yes | baseline |
| /workspace/pharmacy, /workspace/pharmacy/:pharmacyCaseId, /validate, /inventory, /resolve, /handoff, /assurance | pharmacy | shell_root | yes | baseline |
| /ops/support, /ops/support/inbox/:viewKey, /ops/support/tickets/:supportTicketId, /conversation, /history, /knowledge, /actions/:actionKey, /handoff/:supportOwnershipTransferId | support | shell_root | yes | baseline |
| /ops/support/replay/:supportReplaySessionId and /ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId | support | same_shell_child | yes | baseline |
| /ops/overview, /ops/queues, /ops/capacity, /ops/dependencies, /ops/audit, /ops/assurance, /ops/incidents, /ops/resilience | operations | shell_root | yes | baseline |
| /ops/:opsLens/investigations/:opsRouteIntentId, /interventions/:opsRouteIntentId, /compare/:opsRouteIntentId, /health/:opsRouteIntentId | operations | same_shell_child | yes | baseline |
| /ops/governance/*, /ops/access/*, /ops/config/*, /ops/comms/*, /ops/release/* | governance | shell_root | yes | baseline |
| Assistive evaluation, replay, monitoring, and release-control surfaces (derived) | assistive | shell_root | derived | conditional |

## Canonical Reconciliation Inputs

- UI_SHELL_FAMILY_OWNERSHIP: Shell residency is governed by `ShellFamilyOwnershipContract` and `RouteFamilyOwnershipClaim`, not route prefixes, feature names, or layout resemblance.
- UI_CHANNEL_PROFILE_CONSTRAINTS: Embedded, constrained-browser, and browser handoff change channel posture and affordances, but not the owning shell family; NHS App remains a deferred channel-expansion phase rather than a present hard gate.
- OWNERSHIP_VISIBILITY_POLICY: Visibility, masking, and section posture must resolve through `VisibilityProjectionPolicy` and related contracts before projection materialization or calm trust cues render.
- ASSURANCE_CONTINUITY_EVIDENCE: Treat patient-home actionability, thread settlement, booking manage, support replay, assistive session, workspace completion, and pharmacy-console settlement as evidence-producing continuity controls with shared ops and governance consumption.
