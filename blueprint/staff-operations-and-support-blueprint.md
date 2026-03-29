# Staff operations and support blueprint

## Purpose

Define one staff start-of-day model, one within-workspace execution model, and one ticket-centric support workspace model across workspace, hub, pharmacy, and operations consoles.

The dedicated Clinical Workspace interaction contract lives in `staff-workspace-interface-architecture.md`. This document remains the cross-domain source of truth for staff entry posture, interruption priorities, and support governance across shells.
The dedicated Pharmacy Console mission-frame contract lives in `pharmacy-console-frontend-architecture.md` and governs stock-aware validation, fulfilment checkpoints, and pharmacy assurance inside the pharmacy shell.
The dedicated Operations Console interaction contract lives in `operations-console-frontend-blueprint.md` and governs control-room board composition, intervention workbench behavior, live-update pacing, and continuity-preserving drill-down across the `/ops/*` route family.

All staff and support projections in this document must be materialized under the canonical `VisibilityProjectionPolicy` from `phase-0-the-foundation-protocol.md`. `origin_practice`, `hub_desk`, `servicing_site`, and `support` are distinct audience tiers, and break-glass access must remain reason-coded, time-bound, audited, and minimal-scope.

All active staff and support surfaces must follow the canonical real-time interaction rules from Phase 0: stable `PersistentShell`, pinned active item, one shared status strip implemented through `FreshnessChip` plus `AmbientStateRibbon`, buffered disruptive deltas, `QueueChangeBatch` for live queue changes, and pause-live controls where investigation or replay is in progress.

## Staff start-of-day model

Each staff role should land on a start-of-day view backed by these projections:

- `WorkspaceHomeProjection`
- `StaffInboxProjection`
- `PersonalWorklistProjection`
- `TeamQueueSummaryProjection`
- `InterruptionDigestProjection`
- `ApprovalInboxProjection`
- `CallbackWorklistProjection`
- `EscalationInboxProjection`
- `ChangedSinceSeenProjection`
- `CrossDomainTaskSummaryProjection`
- `DependencyDigestProjection`
- `PharmacyConsoleSummaryProjection`

## Staff landing requirements

Start-of-day should show:

- one primary queue or task list chosen by role and recent work
- one next recommended task or resume path
- approvals requiring action
- urgent escalations
- patient reply returns or callbacks when time-sensitive
- pharmacy validation due, stock-risk, and bounce-back work when role-scoped
- active outage or dependency banners only when blocking; otherwise a compact dependency digest
- compact secondary summaries for team queue warnings, changed-since-seen items, downstream handoff backlog, and recent completions

The landing surface should behave like a quiet workbench rather than a dashboard wall. Only the recommended queue should start expanded. Interruptions should collect into one digest rather than multiple banner stacks or widget clusters. While a staff member is working an item, that item must remain visually pinned even if background ranking changes. New work may appear, but disruptive list reordering must be buffered until idle or explicitly applied.

## Operations console model

The operations console is a live control-room surface for macro service health, bottleneck management, and dynamic resource allocation rather than case-by-case review.

Suggested operations projections:

- `OpsOverviewProjection`
- `OpsQueuePressureProjection`
- `OpsResourceAllocationProjection`
- `OpsDependencyHealthProjection`
- `OpsEquityImpactProjection`
- `OpsInterventionProjection`

## Operations route contract

Suggested route family:

- `/ops/overview`
- `/ops/queues`
- `/ops/capacity`
- `/ops/dependencies`
- `/ops/audit`
- `/ops/assurance`
- `/ops/incidents`
- `/ops/resilience`

The detailed front-end contract for these routes is defined in `operations-console-frontend-blueprint.md`. Governance-heavy policy editing, access administration, communications governance, and release gating live in the Governance and Admin Shell under `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, and `/ops/release/*`; this document and the operations-console blueprint govern the control-room shell, board context, and drill-down behavior for the live operations routes.

## Operations landing requirements

The default operations landing view should show:

- north-star service metrics with explicit freshness
- one ranked bottleneck field
- current capacity mismatch and recommended reallocations
- essential-function and dependency health
- equity and channel variance cues
- one intervention workbench for the selected bottleneck

The console may be data-dense, but only one anomaly region and one intervention region may be visually dominant at once. Drill-in must preserve scope, horizon, filters, and selected bottleneck context.

## Clinical Workspace specialization

Within the staff shell, the Clinical Workspace must implement the route family, adaptive workboard/task-canvas layout, rapid-entry contract, and alert-fatigue rules from `staff-workspace-interface-architecture.md`.

Cross-domain entry rules:

- callback, message, booking-intent, pharmacy-intent, and reopen work must surface in one lineage-aware interruption digest
- a staff member should be able to move from queue scan to active task to next task without hard navigation or losing filters
- routine dependency and queue-health signals should remain compact until they block safe action
- only one urgent interruption path may dominate the active shell at a time

## Support desk model

Support should run as a ticket-centric workspace, not a loose collection of recovery tools or read-only audit pages.

All actionable support work should resolve through one governed `SupportTicket` that binds the triggering issue, the subject, the linked lineage objects, the active channel thread, and the allowed recovery actions.

Suggested support objects:

- `SupportTicket`
- `SupportDeskHomeProjection`
- `SupportInboxProjection`
- `SupportTicketWorkspaceProjection`
- `SupportSubject360Projection`
- `SupportOmnichannelTimelineProjection`
- `SupportKnowledgeStackProjection`
- `SupportActionWorkbenchProjection`
- `SupportResolutionSnapshot`
- `SupportActionRecord`
- `SecureLinkReissueRecord`
- `CommunicationReplayRecord`
- `AttachmentRecoveryTask`
- `IdentityCorrectionRequest`
- `SupportReplaySession`
- `SupportObserveSession`

**SupportTicket**  
`supportTicketId`, `originRef`, `originChannel`, `subjectRef`, `linkedLineageRefs[]`, `reasonCategory`, `severity`, `slaState`, `ticketState`, `currentOwnerRef`, `queueKey`, `latestSubjectEventRef`, `activeConversationRef`, `currentKnowledgePackRef`, `currentHistoryPackRef`, `allowedActionRefs[]`, `lastResolutionSummaryRef`

## Support start-of-day and queue contract

Support landing should show:

- one personal or team queue with SLA, severity, and changed-since-seen ordering
- recovery-needed work such as secure-link failure, delivery failure, attachment-access failure, or identity mismatch
- tickets awaiting subject reply or internal handoff
- escalations awaiting governance, clinical, or domain-owner action
- a slim dependency health strip for messaging, telephony, auth, and attachment services
- saved views for repeat operational modes such as `link repair`, `message recovery`, `identity correction`, and `observe only`

Queue cards should show:

- subject or requester summary
- linked request, booking, pharmacy, callback, or message refs where present
- latest inbound or outbound event
- current channel mix
- next recommended action
- time-to-breach
- repeat-contact signal when the same subject has contacted support recently

Queue state may be dense, but it should stay scan-first. Opening a ticket must preserve the current queue view, keyboard position, filter set, and pinned working set.

## Support workspace contract

The support shell should default to one high-throughput workspace, not disconnected tabs and tools.

Desktop composition should be:

- left workboard: search, saved views, queue, SLA buckets, and pinned ticket return
- center mission frame: ticket summary, omnichannel timeline, and the active response or recovery form
- right contextual rail: exactly one promoted support region chosen from knowledge, subject history, policy, or replay diff

Rules:

- default to `two_plane` composition with workboard plus mission frame
- allow `three_plane` only for replay, diff-heavy investigation, or explicit pin
- keep one dominant action at a time: reply, reissue, recover attachment, correct identity, escalate, or resolve
- preserve drafts per ticket and per channel when the agent scans other tickets
- buffer queue churn through `QueueChangeBatch`; the active ticket remains pinned
- keep the ticket header compact and operational, with owner, SLA state, governing lineage refs, and current macro state visible without scrolling
- never require a page swap to open the timeline, linked objects, or support actions for the same ticket continuity key

## Cohesive single-view ticket contract

The active ticket view should unify:

- a `CasePulse`-style ticket header with status, severity, owner, time-to-breach, and linked lineage
- one merged omnichannel timeline for email, SMS, secure message, callback, telephony summary, workflow events, and internal notes
- one active composer or recovery form
- a compact `SupportSubject360Projection` for identity, contact-route health, open objects, and recent outcomes
- a `SupportKnowledgeStackProjection` with articles, playbooks, macros, and policy notes
- a `SupportActionWorkbenchProjection` for reversible recovery actions
- a `SupportResolutionSnapshot` that captures outcome, handoff summary, and reusable resolution notes

The visual order should answer these questions in sequence:

1. who is this and what is broken
2. what happened last
3. what is the safest next action
4. what supporting knowledge or history matters now

Do not force the agent to jump across pages to see communication history, linked requests, or prior tickets for the same subject or request lineage.

## Omnichannel communication contract

Support communication should be merged into one timeline-first surface.

The timeline should combine:

- inbound and outbound email
- SMS and secure-message events
- callback attempts and outcomes
- telephony summaries or call-log events
- appointment, pharmacy, or workflow notifications
- internal notes, handoff notes, and escalation events

Rules:

- cluster events by causal exchange, not only by channel
- keep one active composer or action form expanded at a time
- preserve channel drafts when the agent switches from email to SMS or to callback follow-up
- show delivery, read, bounce, retry, and replay states inline on the relevant event
- surface suggested fallback channels only when policy and contact-route health allow them
- new inbound subject events may promote the conversation region, but they may not auto-expand knowledge, history, and replay at the same time

## Contextual knowledge and playbook contract

The support desk should surface knowledge in context rather than as a detached portal.

The contextual rail should rank and show:

- matched knowledge-base articles
- channel-specific macros and templates
- policy notes and permission caveats
- similar resolved incident patterns
- active outage or dependency notices relevant to the ticket

Ranking inputs should include:

- reason category and origin channel
- linked lineage state
- recent action failures or retries
- identity, access, or attachment state
- tenant configuration and support role scope

Rules:

- show only the top 1 to 3 recommendations as quiet cards by default
- explain why each recommendation is relevant
- show freshness, owner, and last-reviewed metadata
- open the full article, macro, or playbook inline or in a bounded side panel
- capture `knowledge_gap` when no suitable guidance exists or when the agent abandons the surfaced guidance

## Subject history and linked-context contract

The support desk should surface a compact `SupportSubject360Projection` rather than a sprawling dossier.

It should summarize:

- identity and verification state
- contact preferences and route health
- active requests, appointments, callbacks, pharmacy cases, and message threads
- the last few relevant support tickets and their outcomes
- repeated delivery, attachment, or access failures
- repeat-contact or recent-resolution signals where permitted

Rules:

- default to a summary stack, not a full profile page
- expand in place without leaving the ticket shell
- highlight anomalies and repeat patterns before raw chronology
- suppress unrelated historical detail until explicitly requested
- preserve the current ticket anchor when the agent opens subject history

## Support user flows

### 1. Rapid triage and first response

1. The agent lands on a saved queue or search result.
2. Opening a ticket keeps the queue pinned and loads the workspace in the same shell.
3. The system auto-focuses the latest unresolved subject event and the safest next action.
4. The agent replies, reissues, or begins a recovery action without leaving the workspace.
5. The outcome settles into the timeline and updates the ticket state locally before remote confirmation returns.

### 2. Communication failure recovery

1. A ticket opens on failed delivery, expired secure link, or attachment-access failure.
2. `SupportActionWorkbenchProjection` preselects the allowed recovery action.
3. `SupportKnowledgeStackProjection` surfaces the relevant playbook only if policy or channel nuance matters.
4. The agent executes controlled resend, reissue, or channel change in place.
5. The ticket stays open until confirmation, fallback, or explicit handoff is recorded.

### 3. Complex investigation and replay

1. The agent enters replay or diff mode from the active ticket.
2. The shell may upgrade to `three_plane`, with replay or diff becoming the only promoted support region.
3. Live updates pause automatically while replay is active.
4. The agent can inspect the timeline, compare versions, and escalate without losing draft state or queue position.

### 4. Handoff and resolution

1. The agent adds an internal summary or structured resolution code.
2. The handoff target or escalation path is selected from allowed lineage-aware destinations.
3. The ticket closes or moves to waiting-on-other-owner with visible next-step wording.
4. The resulting `SupportResolutionSnapshot` becomes reusable context for future repeat contacts.

## Support route contract

Suggested route family:

- `/ops/support`
- `/ops/support/inbox/:viewKey`
- `/ops/support/tickets/:supportTicketId`
- `/ops/support/tickets/:supportTicketId/conversation`
- `/ops/support/tickets/:supportTicketId/history`
- `/ops/support/tickets/:supportTicketId/knowledge`
- `/ops/support/tickets/:supportTicketId/actions/:actionKey`
- `/ops/support/replay/:supportReplaySessionId`

Core support capabilities:

- search by request, patient, appointment, pharmacy case, callback case, clinician message thread, or support ticket
- open one ticket-centric workspace with omnichannel timeline, subject 360, and linked lineage
- controlled resend, reissue, attachment recovery, and identity correction actions
- masked support replay and diff
- observe-only mode
- structured internal notes, handoff, escalation, and resolution capture
- contextual knowledge-base surfacing and knowledge-gap capture

Support routes must:

- reuse the same support shell while the `SupportTicket` continuity key is unchanged
- open conversation, history, knowledge, and action surfaces as child views, tabs, or drawers rather than detached pages
- restore the last quiet posture after replay, escalation review, or policy inspection ends
- deep-link to the exact ticket cluster or action intent without bypassing policy checks

## Governance requirements

Support actions must be:

- policy-checked
- reason-coded
- role-scoped
- auditable
- reversible where possible
- bound to a governing `SupportTicket` and visible lineage context
- rendered back into the ticket timeline and `SupportResolutionSnapshot`

## Cross-domain queue rules

Operational lists should be lineage-aware.

- callback and message work should appear with triage context
- hub and pharmacy exceptions should appear with request lineage
- repeat contacts should cluster around the active `SupportTicket` or latest `SupportResolutionSnapshot` when the same subject and lineage are involved
- support actions should never bypass clinical workflow ownership
