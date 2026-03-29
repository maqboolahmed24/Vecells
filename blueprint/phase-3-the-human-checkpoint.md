# Phase 3 - The Human Checkpoint

**Working scope**  
Clinical workspace V1 and human triage engine.

## 3A. Triage contract and workspace state model

This sub-phase creates the hard runtime model for staff review.

### Backend work

Add a dedicated triage-workflow kernel to the domain model. The existing `Request` remains the centre of truth, but Phase 3 needs new operational objects around it.

Create these objects:

**TriageTask**  
`taskId`, `requestId`, `queueKey`, `assignedTo`, `status`, `priorityBand`, `dueAt`, `slaTargetAt`, `lockState`, `lockExpiresAt`, `reviewVersion`, `latestEvidenceSnapshotRef`, `duplicateClusterRef`, `approvalState`, `endpointState`, `createdAt`, `updatedAt`

**ReviewSession**  
`reviewSessionId`, `taskId`, `openedBy`, `openedAt`, `lastActivityAt`, `sessionState`, `workspaceSnapshotVersion`

**ReviewBundle**  
A read model, not a write model. It aggregates request summary, structured answers, phone transcript summary, attachments, safety events, contact preferences, identity confidence, and prior patient responses into one staff-ready projection.

**MoreInfoCycle**  
`cycleId`, `taskId`, `questionSetVersion`, `channel`, `sentAt`, `dueAt`, `state`, `responseSnapshotRef`, `reminderCount`

**EndpointDecision**  
`decisionId`, `taskId`, `chosenEndpoint`, `decisionVersion`, `reasoningText`, `requiredApprovalMode`, `downstreamPayloadRef`

**ApprovalCheckpoint**  
`checkpointId`, `taskId`, `actionType`, `state`, `requestedBy`, `requestedAt`, `approvedBy`, `approvedAt`, `rejectionReason`

**DuplicateCluster**  
`clusterId`, `patientRef`, `candidateRequestRefs`, `clusterState`, `mergeDecisionRef`

**TriageReopenRecord**  
`reopenRecordId`, `taskId`, `sourceDomain`, `reasonCode`, `evidenceRefs`, `priorityOverride`, `reopenedByMode`, `reopenedAt`

Lock the main task state machine now. Use an executable model rather than placeholder states:

`triage_ready -> queued`  
`queued -> claimed`  
`claimed -> queued | in_review`  
`in_review -> queued | awaiting_patient_info | endpoint_selected | escalated`  
`awaiting_patient_info -> review_resumed`  
`review_resumed -> queued | claimed`  
`endpoint_selected -> resolved_without_appointment | handoff_pending | escalated`  
`escalated -> resolved_without_appointment | handoff_pending | reopened`  
`resolved_without_appointment -> closed`  
`handoff_pending -> closed`  
`closed -> reopened`  
`reopened -> queued`

State semantics:

- `review_resumed` is a durable return-from-patient state written when a valid more-info response has been linked and re-safety has cleared routine handling
- `resolved_without_appointment` is written after a direct non-booking outcome has been durably composed but before the final close event
- `handoff_pending` is written after a booking or pharmacy handoff object has been created but before downstream ownership is acknowledged
- `reopened` is written when a previously closed or handed-off case returns from hub, pharmacy, supervisor action, or materially new evidence

Also lock the `Request` synchronisation rules now:

- when a task first leaves `triage_ready` and enters `queued`, acquire the triage-side `RequestLifecycleLease`; `LifecycleCoordinator` derives `Request.workflowState = triage_active` from that milestone
- while a task is in `queued`, `claimed`, `in_review`, `awaiting_patient_info`, `review_resumed`, `escalated`, or `reopened`, keep the triage-side lease active so the request remains `triage_active` under coordinator control
- `endpoint_selected` is a task-level state; it does not create a separate canonical `Request` substate
- when downstream booking, hub, or pharmacy ownership is acknowledged, emit the handoff milestone and let `LifecycleCoordinator` derive `Request.workflowState = handoff_active`
- when a definitive direct, booked, or pharmacy-resolved outcome is recorded, emit the outcome milestone and let `LifecycleCoordinator` derive `Request.workflowState = outcome_recorded`
- when no open triage, booking, hub, pharmacy, approval, or exception work remains on the request lineage, ask `LifecycleCoordinator` to evaluate closure and persist `RequestClosureRecord`; only then may `Request.workflowState = closed`

Add the first Phase 3 event catalogue:

- `triage.task.created`
- `triage.task.claimed`
- `triage.task.released`
- `triage.review.started`
- `triage.review.snapshot.refreshed`
- `triage.more_info.requested`
- `triage.more_info.response.linked`
- `triage.task.resumed`
- `triage.endpoint.selected`
- `triage.task.resolved_without_appointment`
- `triage.task.handoff_pending`
- `triage.approval.required`
- `triage.approval.recorded`
- `triage.escalated`
- `triage.duplicate.clustered`
- `triage.duplicate.merged`
- `triage.handoff.created`
- `triage.task.reopened`
- `triage.task.closed`

Do not let frontend pages invent their own state meanings. Every badge, tab, and action must come from this state model.

A practical first set of command endpoints is:

- `GET /v1/workspace/queues/{queueKey}`
- `GET /v1/workspace/tasks/{taskId}`
- `POST /v1/workspace/tasks/{taskId}:claim`
- `POST /v1/workspace/tasks/{taskId}:release`
- `POST /v1/workspace/tasks/{taskId}:start-review`
- `POST /v1/workspace/tasks/{taskId}:resume-review`
- `POST /v1/workspace/tasks/{taskId}:request-more-info`
- `POST /v1/workspace/tasks/{taskId}:select-endpoint`
- `POST /v1/workspace/tasks/{taskId}:approve`
- `POST /v1/workspace/tasks/{taskId}:escalate`
- `POST /v1/workspace/tasks/{taskId}:reopen`
- `POST /v1/workspace/tasks/{taskId}:close`

### Frontend work

Turn the staff shell into a real Clinical Workspace using the full interaction contract in `staff-workspace-interface-architecture.md`.

The initial route family should be:

- `/workspace`
- `/workspace/queue/:queueKey`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`
- `/workspace/approvals`
- `/workspace/escalations`
- `/workspace/changed`

Do not build the full operations console here. Keep this phase focused on the clinician review workflow, but give staff one coherent shell that supports queue scan, rapid claim, active review, interruption handling, and next-task progression without hard resets.

All adjacent task views in this workspace must use the canonical real-time interaction rules from Phase 0 plus the workspace-specific rules in `staff-workspace-interface-architecture.md`: one `PersistentShell`, a preserved `TaskLaunchContext`, a pinned active item, one shared status strip, one `DecisionDock`, one promoted support region at most in routine review, and `QueueChangeBatch` for disruptive queue changes. Opening a task, switching tabs, composing more-info, approving, escalating, or moving to the next task must be soft navigation inside the same shell.

The route skeleton should already support:

- queue browsing and preview-pocket scanning
- task deep-linking with preserved queue context
- read-only open by multiple users
- active review by one owner
- rapid-entry composition for notes, more-info, and endpoint reasoning
- approval inbox
- escalated view
- changed-since-seen resume flow

### Tests that must pass before moving on

- state-transition tests for all allowed and forbidden task paths
- optimistic-lock tests on `reviewVersion`
- shell-continuity tests across queue -> task -> more-info -> decision -> next-task transitions
- event-schema compatibility tests
- migration tests proving Phase 1 and 2 requests can spawn triage tasks without data loss
- read-model rebuild tests for `ReviewBundle`

### Exit state

The platform now has a real triage-workflow contract instead of an informal idea of queue plus details.

---

## 3B. Deterministic queue engine, assignment, and fairness controls

This sub-phase makes the queue behave like a system, not a list.

### Backend work

Build a queue-ranking engine that is deterministic, explainable, and versioned. It should take the same inputs every time and return the same order every time for a given queue snapshot.

Do not implement the queue as one unconstrained weighted sum. That is mathematically fragile: a large age term can swamp a clinically urgent case. Use lexicographic precedence for safety-critical separations, then a normalized within-tier score, then a deterministic fair merge.

For task `i`, define:

- `age_i = workingMinutesBetween(arrivalAnchor_i, now)`
- `d_sla_i = workingMinutesBetween(now, slaTargetAt_i)`, positive before target, `0` at target, and negative when overdue
- `slaPressure_i = 1 / (1 + exp((d_sla_i - theta_sla_warn) / tau_sla))`
- `priority_i` as the ordinal clinical priority band from intake and triage rules
- `residual_i in [0,1]` from persisted residual-safety rule severity and latest re-safety outcome
- `escalated_i in {0,1}`
- `returned_i in {0,1}` when the task has come back from patient more-info and is unread by staff
- `vulnerability_i in [0,1]` when configured
- `coverageFit_i in [0,1]` for queue-level capability fit derived from the lane or competency envelope rather than reviewer-specific availability
- `duplicateReview_i in {0,1}` when open duplicate-cluster ambiguity blocks safe closure or merge
- `ageLift_i = min(1, log(1 + age_i / tau_age) / log(1 + A_cap / tau_age))`

Then compute the canonical within-tier urgency score:

`u_i = w_sla * slaPressure_i + w_age * ageLift_i + w_residual * residual_i + w_return * returned_i + w_vulnerability * vulnerability_i + w_coverage * coverageFit_i`

with all `w_* >= 0`, all continuous factors normalized to `[0,1]`, and weight versions persisted in `QueueRankPlan` or equivalent configuration.

This formulation keeps every factor on a comparable scale, makes SLA pressure monotone on both sides of the target instead of collapsing all overdue work to the same value, and avoids a reviewer-specific skill score silently rewriting the shared queue order.

Sort by the stable key:

1. `escalated_i` descending
2. `1[d_sla_i <= theta_breach]` descending
3. `priority_i` descending
4. residual-safety severity band descending
5. `duplicateReview_i` descending
6. `u_i` descending
7. `createdAt` ascending
8. `taskId` ascending

Do not bury the rank explanation. Store the exact normalized factors, weights, `d_sla_i`, `duplicateReview_i`, and sort tier used for each queue entry so supervisors can understand why one item is ahead of another.

Do not let reviewer-specific skill change the canonical queue order. If the workspace needs a reviewer suggestion for reviewer `r`, compute it only after queue ranking over the top `M` queue-eligible tasks:

`assignScore(i,r) = lambda_skill * skill_{i,r} + lambda_cont * continuity_{i,r} + lambda_load * (1 - wip_r / cap_r) - lambda_ctx * contextSwitchCost_{i,r}`

Use `assignScore(i,r)` only for suggestion chips, supervisor recommendations, or auto-claim proposals; it must not rewrite the shared queue ordering.

Implement a fairness floor early. The architecture explicitly calls out fairness floors and queue controls, so routine items should not starve forever underneath escalating urgent work. Use deterministic deficit round robin across non-critical priority bands:

- `credit_b <- credit_b + q_b_eff` on each merge cycle
- `q_b_eff = max(q_b, q_floor_b)` whenever the head item of band `b` has `age_i >= A_b`, otherwise `q_b_eff = q_b`
- emit the head item of the eligible band with largest `credit_b`, breaking ties by fixed band order
- after emitting from band `b`, set `credit_b <- credit_b - 1`

Critical or breached classes bypass the fairness merge.

Build these projections:

- `triage_queue_projection`
- `my_tasks_projection`
- `awaiting_patient_projection`
- `escalation_queue_projection`
- `approval_inbox_projection`

Assignment should use a soft-lock plus heartbeat model:

1. user claims task
2. task becomes editable by that user
3. others can still view read-only
4. lock heartbeats while active
5. lock expires if abandoned
6. supervisor override can reassign with audit trail

Add duplicate detection here too, but keep merge conservative. Exact resubmits from the same user and same payload can auto-link. Similar-but-not-identical requests should produce a `DuplicateCluster` suggestion with human confirmation required.

### Frontend work

The queue screen is one of the highest-value screens in the product, so make it excellent.

The default queue surface should implement the `QueueWorkbenchProjection` from `staff-workspace-interface-architecture.md`:

- slim left rail for queue tabs, saved views, and queue-health digest
- main workboard for the virtualized queue list
- lightweight preview pocket for focus or hover scan, not a second full detail page

It should feel fast and precise. No oversized cards. No noisy charts. No wasted whitespace that forces more scrolling. The visual language should be dense, crisp, and quiet enough for prolonged triage work.

Build:

- unassigned queue
- my tasks
- escalations
- awaiting patient
- changed-since-seen
- quick filters by request type, priority, age, channel, and assignee
- stable sort controls and rank-explanation snippets
- saved views per role
- keyboard shortcuts for claim, open, preview, and next task

Queue rows should expose only the scan-critical fields: patient or request label, short reason summary, SLA or age, returned or unread state, assignee or lock state, and next action. Full context belongs in the preview pocket or task shell, not the list row.

### Tests that must pass before moving on

- queue-order determinism across repeated recomputation
- starvation simulations proving fairness floors work
- concurrent-claim race tests
- lock-expiry tests
- supervisor-takeover tests
- duplicate-cluster suggestion tests
- UI performance tests on large queue lists
- keyboard-only queue navigation tests

### Exit state

The system can now put work in front of the right human, in the right order, without chaos or hidden queue behaviour.

---

## 3C. Review bundle assembler, deterministic summaries, and suggestion seam

This sub-phase makes the request reviewable at speed.

### Backend work

Build a `ReviewBundleAssembler` that creates a staff-ready projection from all the upstream evidence already gathered in Phases 1 and 2.

The bundle should include:

- canonical request summary
- structured answers by request type
- original patient narrative
- safety-screen result and matched rule IDs
- telephony metadata where relevant
- transcript stub if present
- attachment list and previews
- identity and match-confidence summary
- contact preference summary
- timeline of prior messages and responses
- duplicate-cluster status
- latest SLA state

Then add a deterministic summary generator on top of that bundle. This is where you prepare for the AI suggestions concept from the blueprint without letting Phase 8 leak into Phase 3. The clean way to do that is a `SuggestionEnvelope` contract that supports both rule-based and future model-based suggestions, but only the rule-based path is authoritative in this phase. The review screen is framed as triage summary plus suggestions followed by a human choice of endpoint, so that separation should exist from day one.

A good `SuggestionEnvelope` shape is:

- `sourceType = rules | shadow_model`
- `suggestionVersion`
- `priorityBand`
- `complexityBand`
- `candidateEndpoints`
- `recommendedQuestionSetIds`
- `rationaleBullets`
- `confidenceDescriptor`
- `visibilityState`

In Phase 3, surface only `sourceType = rules` to staff. If you want a shadow-model seam, log it silently for future comparison, but do not let it affect workflow yet.

### Frontend work

This is the heart of the Clinical Workspace and it should feel world-class.

Do not default the active task to a permanent three-column dashboard. Use the adaptive workspace contract from `staff-workspace-interface-architecture.md`:

- `two_plane` by default: workboard on the left, task plane on the right
- promote to `three_plane` only for blocker-heavy evidence review, duplicate compare, urgent escalation, or explicit user pin

The task plane should open with:

- `CasePulse`
- one shared status strip
- clinician-ready summary
- structured facts
- delta-first patient-return view when present
- patient narrative and prior replies
- attachments and audio
- compact lineage strip
- sticky `DecisionDock` with rapid-entry controls

The right-side promoted region should hold consequences and context, not routine reading content. Put `EvidencePrism`, `StateBraid`, approval preview, duplicate compare, and urgent contact stage behind one promoted support region budget so the workspace does not become a wall of parallel panels.

Build a what-changed diff view. If the patient replies after a more-info cycle, the reviewer should immediately see delta information rather than re-reading the whole case from scratch.

### Tests that must pass before moving on

- projection correctness tests for `ReviewBundle`
- summary determinism tests
- stale-bundle invalidation tests after patient update
- large-attachment rendering tests
- transcript-present and transcript-absent rendering tests
- visual regression tests for the workspace layout
- accessibility tests for dense staff screens and panel focus order

### Exit state

A staff member can now understand a case quickly enough to make the queue workable in real life.

---

## 3D. More-info loop, patient response threading, and re-safety

This sub-phase creates the loop between staff and patient.

### Backend work

Build `MoreInfoCycle` as a first-class workflow object, not as a loose outbound message. When staff need more detail, they should create a structured request for information that carries its own due date, response channel, reminders, and linkage back to the triage task.

This section is a workflow-specific application of the canonical Phase 0 algorithm. `SafetyOrchestrator` owns classification and preemption for materially new evidence, and `LifecycleCoordinator` remains the only authority for request closure or governed reopen across downstream domains.

Use this algorithm:

1. clinician selects question set or composes freeform request
2. system creates `MoreInfoCycle`
3. secure patient link or callback request is issued through the governed access model, and the request keeps its active triage lease
4. triage task moves to `awaiting_patient_info`, and the triage-side lease keeps the canonical `Request` in `workflowState = triage_active` under coordinator control
5. patient response enters through the existing portal path and becomes a new immutable `EvidenceSnapshot`
6. classify the new evidence; unless it is on the explicit technical allow-list, default it to `potentially_clinical`
7. create `SafetyPreemptionRecord` and rerun the canonical safety engine on the recomputed composite evidence before routine flow continues
8. while `SafetyPreemptionRecord.status = pending`, do not close the request, auto-resume the queue, complete downstream handoff as final, or present stale reassurance
9. if re-safety now indicates urgent diversion or duty escalation, create the urgent path immediately, set the task to `escalated`, and do **not** return the task to the routine queue
10. if re-safety is clear, mark the preemption cleared, set the task to `review_resumed`, persist `response_returnedAt`, and emit `triage.task.resumed`
11. the queue engine then performs the legal transition `review_resumed -> queued`, applies a `response_returned` boost, and refreshes the ranking explanation
12. when a reviewer claims it again, the task follows `queued -> claimed -> in_review`
13. reviewer sees a delta-first resume view

This re-safety step matters. Once a patient replies with new symptoms or timing details, you cannot assume the original intake safety result is still enough. Treat the updated evidence snapshot as potentially safety-relevant and re-run the same safety logic before returning it to routine review.

Create `PatientEvidenceSnapshot` with:

- `snapshotId`
- `requestId`
- `evidenceSource`
- `questionSetVersion`
- `responsePayload`
- `attachmentRefs`
- `capturedAt`
- `linkedMoreInfoCycleId`
- `reSafetyOutcomeRef`

### Frontend work

The clinician-facing more-info composer should be fast and thoughtful.

Build:

- template-based question sets
- editable freeform follow-up
- channel choice where allowed
- due-date selector
- reminder preview
- thread view of all patient responses
- diff viewer between prior and new evidence
- re-safety signal inside `InterruptionDigest`
- urgent escalation stage when re-safety changes the path immediately

Open the composer as an `InlineSideStage` or bounded `DecisionDock` extension inside the same task shell. Staff must be able to inspect the current evidence while composing without opening a second detached page or losing the active task context.

The patient response flow can reuse the existing patient portal patterns from Phases 1 and 2, but it should open in a lightweight respond-to-request mode with minimal chrome and a strong single-task focus.

### Tests that must pass before moving on

- secure response-link expiry and replay tests
- wrong-request response prevention
- question-set versioning tests
- response-to-snapshot linkage tests
- re-safety execution tests on updated evidence
- re-safety-to-urgent-escalation tests
- late-response-after-task-closure tests
- reminder deduplication tests
- end-to-end task to more-info to patient reply to requeue or escalation flow tests

### Exit state

Staff can now safely pause a task, ask the patient a focused question, and resume with new evidence inside the same case without letting newly urgent information drift back into the normal queue.

## 3E. Endpoint decision engine and resolution model

This sub-phase is where review becomes action.

### Backend work

Create a strongly typed `EndpointDecision` model and lock the endpoint taxonomy now. A good Phase 3 set is:

- `admin_resolution`
- `self_care_and_safety_net`
- `clinician_message`
- `clinician_callback`
- `appointment_required`
- `pharmacy_first_candidate`
- `duty_clinician_escalation`

This maps directly to the patient-outcome and staff-flow diagrams: admin completion, self-care or info, clinician message or callback, Pharmacy First, booking handoff, or urgent escalation.

To keep endpoint behaviour complete rather than label-only, define callback and clinician-message lifecycle contracts in `callback-and-clinician-messaging-loop.md` and define governed self-care and admin-resolution contracts in `self-care-content-and-admin-resolution-blueprint.md`.

For each endpoint, require a structured payload. For example:

**Admin resolution**  
resolution subtype, outcome note, notification template

**Self-care and safety net**  
advice template, safety-net wording, re-contact threshold

**Clinician message**  
message body, response expectation, closure rule

**Clinician callback**  
callback urgency, time window, contact route, fallback

**Appointment required**  
modality, timeframe, clinician type, continuity preference, access needs

**Pharmacy First candidate**  
suspected pathway, exclusion-check status, patient-choice-pending flag

**Duty clinician escalation**  
escalation reason, urgency, immediate action note, contact-attempt requirement

Create an endpoint-rule service that proposes candidate endpoints and validates required fields, but never auto-closes the case without human confirmation.

### Frontend work

Build the endpoint action rail in the right-side drawer.

The interaction model should be:

1. choose endpoint
2. see required fields for that endpoint only
3. enter rationale
4. preview patient-facing outcome
5. submit for closure, escalation, or handoff

Do not build a giant one-form-for-every-endpoint screen. It will become a mess. Use contextual drawers or modals that only reveal the fields relevant to the chosen endpoint.

The UI should make the decision tree feel crisp, not bureaucratic. Clean grouping, short labels, clear default actions, strong confirmation states.

### Tests that must pass before moving on

- endpoint validation tests for all endpoint types
- required-field matrix tests
- stale-review invalidation tests if evidence changed mid-decision
- resolution-notification template tests
- decision-payload serialization tests
- end-to-end flows for admin, self-care, clinician message, and callback

### Exit state

A reviewer can now convert understanding into a structured clinical or operational decision.

---

## 3F. Human approval checkpoint and urgent escalation path

This is the defining safety mechanism of the phase.

### Backend work

Build a configurable approval matrix that decides which actions require explicit human approval before final commit.

Typical approval-required actions in this phase include:

- clinically definitive advice that closes the case
- coded or signed outcomes
- tenant-configured high-risk closure paths
- escalations or overrides marked as sensitive by policy

Create `ApprovalCheckpoint` with its own state machine:

`not_required -> required -> pending -> approved | rejected -> superseded`

Any material change to the decision should invalidate prior approval. That means if the note changes, the endpoint changes, the patient replies again, or the case is merged into another case, the checkpoint should move to `superseded` and require fresh approval.

Add urgent escalation mechanics for high-risk cases. The staff flow explicitly shows high-risk escalation to duty clinician urgent contact with safety outcome recording, so this path has to be first-class, not a note scribbled into the timeline.

A clean escalation algorithm is:

1. reviewer triggers escalation or system flags residual high risk
2. system creates `DutyEscalationRecord` and urgent task
3. original triage task enters `escalated`, and the triage-side lease keeps the canonical `Request` in `workflowState = triage_active` under coordinator control
4. contact-attempt log opens
5. urgent contact outcome is recorded
6. if the urgent outcome is direct advice or direct completion, persist the required endpoint data, transition `escalated -> resolved_without_appointment`, and emit the direct-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`
7. if the urgent outcome requires booking, hub, or pharmacy ownership, create the downstream intent, transition `escalated -> handoff_pending`, and emit the handoff milestone so `LifecycleCoordinator` may derive `Request.workflowState = handoff_active` once downstream ownership is acknowledged
8. if the urgent path returns the case for further practice review, create `TriageReopenRecord` and transition `escalated -> reopened -> queued` with raised priority
9. only `resolved_without_appointment` and `handoff_pending` may later close the triage task

### Frontend work

This needs two specific UI surfaces, both aligned to the quiet-shell rules.

First, an approval `ConsequencePreview` sheet or bounded modal that is serious and friction-appropriate: clear summary of what is being approved, why it requires approval, who is approving, and what changed since the last review. Do not force a modal when an inline side stage can preserve more context safely.

Second, an urgent escalation stage that is impossible to miss without becoming a permanent banner stack. The shared status strip should switch to urgent, `DecisionDock` should collapse to the urgent next actions, one promoted urgent-contact stage should open inside the same review shell, and all non-urgent alerts should collapse into the interruption digest from `staff-workspace-interface-architecture.md`. The urgent stage should show:

- urgency reason
- who escalated
- time since escalation
- contact attempts
- current urgent status

While this urgent stage is open, queue widgets, assistive rails, and secondary evidence regions should demote to stubs unless the reviewer explicitly pins them. If break-glass access is needed, the Phase 0 controls should appear here as a visible, audited path rather than a hidden admin action.

### Tests that must pass before moving on

- approval-bypass prevention tests
- stale-approval invalidation tests
- multi-role approval-config tests
- escalation-SLA tests
- contact-attempt audit tests
- override and reason-code tests
- end-to-end urgent-escalation tests

### Exit state

Vecells now has a true human checkpoint: staff can act quickly, but the system still enforces explicit approval where required.

---

## 3G. Direct resolution, downstream handoff seeds, and reopen mechanics

This sub-phase closes the operational loop for Phase 3 without stealing later phases.

### Backend work

Phase 3 should fully support direct non-appointment resolution now:

- admin complete plus notify
- self-care plus safety-net advice
- clinician message plus notify
- callback task creation

For appointment-required and pharmacy-appropriate outcomes, stop at clean handoff objects.

Do not leave callback and clinician-message endpoints as implicit subpaths of generic triage closure. Create first-class lifecycle objects and state transitions as defined in `callback-and-clinician-messaging-loop.md`, then link those lifecycle states into patient and staff projections.

All active callback, clinician-message, approval, booking-intent, pharmacy-intent, and triage workflows must hold their own `RequestLifecycleLease`. No domain-local action may close the request by itself; `LifecycleCoordinator` remains the sole authority for `Request.workflowState = closed`.

Any materially new evidence entering these flows, including callback outcomes and clinician-message replies, must route through `SafetyOrchestrator` under the canonical Phase 0 section before routine work may resume.

Create:

**BookingIntent**  
`intentId`, `requestId`, `priorityBand`, `timeframe`, `modality`, `clinicianType`, `continuityPreference`, `accessNeeds`, `patientPreferenceSummary`, `createdFromDecisionId`

**PharmacyIntent**  
`intentId`, `requestId`, `suspectedPathway`, `eligibilityFacts`, `exclusionFlags`, `patientChoicePending`, `createdFromDecisionId`

**TriageReopenRecord**  
`reopenRecordId`, `taskId`, `sourceDomain`, `reasonCode`, `evidenceRefs`, `priorityOverride`, `reopenedByMode`, `reopenedAt`

Use this direct-resolution algorithm:

1. clinician selects a direct endpoint
2. system persists `EndpointDecision` and sets `TriageTask.status = endpoint_selected`
3. system composes the required outbound message, safety-net text, or callback artifact
4. system sets `TriageTask.status = resolved_without_appointment`
5. system emits the direct-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`
6. system updates patient-facing status projections
7. once all direct-resolution artifacts are durably queued or created, system sets `TriageTask.status = closed`
8. if no open triage, approval, callback, message, or downstream work remains on the request lineage, ask `LifecycleCoordinator` to evaluate closure and persist `RequestClosureRecord` before the request may close

Use this handoff algorithm:

1. clinician selects booking or pharmacy endpoint
2. system creates `BookingIntent` or `PharmacyIntent`
3. system sets `TriageTask.status = handoff_pending` and emits `triage.task.handoff_pending`
4. downstream booking or pharmacy service acknowledges ownership and stores the intent reference
5. system emits the handoff milestone so `LifecycleCoordinator` may derive `Request.workflowState = handoff_active`
6. only then does the triage task move to `closed`

Also build generic reopen mechanics now:

1. a bounce-back, supervisor action, or materially new evidence arrives with reason code and evidence refs
2. system creates `TriageReopenRecord`
3. system reacquires the triage-side `RequestLifecycleLease`, sets `TriageTask.status = reopened`, refreshes `latestEvidenceSnapshotRef`, raises priority, and lets `LifecycleCoordinator` keep `Request.workflowState = triage_active`
4. once queue routing is recalculated, system transitions `reopened -> queued`
5. reopened tasks must preserve lineage to the original task and closure record

Update patient-facing status projections on every direct resolution, handoff creation, and reopen.

### Frontend work

Add polished closure and handoff confirmation states inside the workspace:

- direct-resolution confirmation
- message preview
- callback created
- booking handoff created
- pharmacy handoff created
- reopened case banner
- next best task CTA

Give staff a concise closure summary rather than silently throwing them back into the queue. Good operators need clear completion feedback. Closure should remain inside the same shell long enough to confirm the consequence, then offer the next recommended task from the preserved `TaskLaunchContext`.

### Tests that must pass before moving on

- direct-resolution end-to-end tests
- handoff-object integrity tests
- no-orphan-intent tests
- patient-status projection update tests
- reopen-from-resolved tests
- reopen-from-handoff tests
- notification idempotency tests

### Exit state

The workspace can now fully resolve some cases and cleanly package the rest for the next subsystems.

---

## 3H. Hardening, clinical beta, and formal exit gate

This is where the phase becomes real.

### Backend work

Add deep observability for the triage workflow:

- queue depth by band
- median claim time
- median review time
- awaiting-patient dwell time
- escalation count and age
- endpoint mix
- approval-required rate
- approval dwell time
- duplicate-cluster rate
- merge-confirm rate
- reopen rate
- task-close failure rate

Create internal support tools for:

- task event timeline
- ranking explanation
- evidence snapshot comparison
- approval history
- escalation history
- merge decision history

Update the safety evidence as part of the sprint. This phase should add hazards such as wrong endpoint selection, missed urgent escalation, stale approval, wrong merge, failure to re-run safety after new patient evidence, and silent task collision. NHS England’s clinical safety pages explicitly support maintaining these artefacts with standard templates rather than inventing your own format from scratch. ([NHS England Digital][1])

### Frontend work

Run an internal clinical beta with real staff using a feature-flagged workspace.

Start with:

1. read-only queue preview
2. claim plus review
3. more-info loop
4. endpoint decisioning
5. approvals and escalation

That order matters. It lets the existing system keep working while the new workspace gets operationally stronger in controlled slices.

Before sign-off, the staff experience should already feel intentional and premium:

- dense but not cramped
- stable layout
- fast queue scan
- clear hierarchy
- excellent empty, loading, and error states
- full keyboard path for common actions
- no temporary admin-looking screens

### Tests that must all pass before Phase 4

- no Sev-1 or Sev-2 defects in core queue review paths
- deterministic queue order under repeated recomputation
- concurrent-review protection proven
- more-info loop proven end to end
- re-safety on new evidence proven
- approval-required actions cannot bypass checkpoint
- direct-resolution flows proven
- booking and pharmacy handoff seeds created correctly
- reopen mechanics proven
- audit trail complete for assignment, decisions, approvals, escalations, merges, and closures
- updated safety case and hazard log committed for this release

### Exit state

The platform is now a real staff workflow system, not just a patient intake front door.

[1]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards?utm_source=chatgpt.com "Clinical risk management standards"
