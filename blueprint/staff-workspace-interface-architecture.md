# Staff workspace interface architecture

## Purpose

Define the end-to-end front-end architecture for the Clinical Workspace shell used by clinicians and designated operational reviewers. This blueprint specializes `platform-frontend-blueprint.md`, `phase-3-the-human-checkpoint.md`, and `staff-operations-and-support-blueprint.md` for the highest-frequency staff journey: scanning demand, opening the right task, reaching a safe decision quickly, and moving directly to the next item without shell resets.

The governing laws are:

- same request lineage, same shell
- queue scan in one glance, task understanding in one canvas
- one dominant action, one promoted support region, one urgent interruption path
- alert digests over banner stacks
- keyboard-first for repetitive work, pointer-safe for high-risk review

## Design language: Quiet Clinical Mission Control

The workspace visual system should feel like a quiet operational instrument rather than a generic admin dashboard.

- **Surfaces:** fog, bone, graphite, and slate bases with very limited semantic accents
- **Typography:** compact headers, neutral body, tabular numerics for time, SLA, and IDs
- **Density:** dense rows and summary blocks, generous spacing only around decisions and blockers
- **Shape:** crisp grid, restrained rounding, high-clarity separators rather than floating cards
- **Motion:** short directional transitions for claim, handoff, diff reveal, and reopen; no decorative motion
- **Noise policy:** status belongs in the shared strip first, queue rows second, banners last

## Primary objectives

- reduce queue-to-first-action latency
- minimize pointer travel between queue, evidence, and action composition
- make patient-returned evidence immediately legible through delta-first rendering
- preserve object permanence through claim, review, escalation, approval, handoff, and reopen
- separate urgent actionable alerts from routine status so staff do not habituate to warning chrome

## Route family

The staff shell should own this route family:

- `/workspace`
- `/workspace/queue/:queueKey`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`
- `/workspace/approvals`
- `/workspace/escalations`
- `/workspace/changed`
- `/workspace/search`

Route rules:

- `/workspace` resolves to the best role-specific start surface from `WorkspaceHomeProjection`
- opening a task from any worklist must preserve queue context and active filters in `TaskLaunchContext`
- `/workspace/task/:taskId/more-info` and `/workspace/task/:taskId/decision` are soft child states of the same `PersistentShell`, not separate page types
- `/workspace/approvals` and `/workspace/escalations` may open as list routes, but if the user already has a task open they should resolve into the current shell as `InlineSideStage` or `ContextConstellation`
- `entityContinuityKey` for triage work is `staff + requestId + practice_lineage`

## Workspace-specific specializations

These primitives specialize the shared platform shell rather than replace it:

- `Workboard`: the staff queue-and-navigation composition layered inside `PersistentShell`
- `PreviewPocket`: a low-latency queue preview for hover or keyboard scan
- `InterruptionDigest`: the single summarized broker for blocking, urgent, and watch signals
- `QuickCaptureTray`: the rapid-entry extension of `DecisionDock`
- `LineageStrip`: compact linked-work context for callback, message, booking-intent, pharmacy-intent, and reopen state

## Workspace projections and client state

Create these staff-specific read models:

**WorkspaceHomeProjection**  
`staffRef`, `roleProfile`, `recommendedQueueRef`, `nextRecommendedTaskRef`, `urgentInterruptionCount`, `approvalCount`, `patientReplyReturnCount`, `teamRiskDigest`, `dependencyDigest`, `changedSinceSeenDigest`, `savedViewRefs`, `recentTaskRefs`, `generatedAt`

**QueueWorkbenchProjection**  
`queueKey`, `savedViewRef`, `appliedFilters`, `sortMode`, `rankPlanVersion`, `rowCount`, `virtualWindowRef`, `rows[]`, `queueHealthDigest`, `queueChangeBatchRef`, `generatedAt`

**TaskWorkspaceProjection**  
`taskId`, `requestId`, `reviewVersion`, `workspaceSnapshotVersion`, `launchContextRef`, `casePulse`, `interruptionDigest`, `summaryBlock`, `structuredFacts`, `patientNarrative`, `attachmentDigest`, `communicationDigest`, `stateBraidDigest`, `evidenceDiffDigest`, `linkedWorkDigest`, `decisionOptions`, `actionAvailability`, `generatedAt`

**InterruptionDigestProjection**  
`taskId`, `blockingItems[]`, `urgentActionables[]`, `watchItems[]`, `silentSignals[]`, `recommendedPromotedRegion`, `lastEvaluatedAt`

**RapidEntryDraft**  
`draftId`, `taskId`, `draftType = notes | question_set | endpoint_reasoning | admin_resolution`, `fieldState`, `lastLocalChangeAt`, `autosaveState`, `recoverableUntil`

**TaskLaunchContext**  
`sourceQueueKey`, `sourceSavedViewRef`, `sourceRowIndex`, `returnAnchorRef`, `nextTaskCandidateRefs`, `previewSnapshotRef`

Rules:

- queue list data and task canvas data must be split so opening a task does not re-fetch the entire queue payload
- `TaskWorkspaceProjection` must be segmented into summary-first, evidence, timeline, and attachment chunks so the first usable paint happens before heavier media loads
- `InterruptionDigestProjection` owns alert budgeting inside the task shell; no local panel may invent competing urgent chrome
- `RapidEntryDraft` must survive stale projection refresh, reconnect, and reversible route changes within the same task shell

## Layout topology

### Desktop default: adaptive two-plane workbench

Default staff layout is `two_plane`:

1. **Workboard plane** on the left
   - queue switcher
   - saved views
   - queue health mini-digest
   - virtualized task list
   - compact next-up and changed-since-seen stubs
2. **Task plane** on the right
   - `CasePulse`
   - shared status strip
   - task canvas
   - sticky `DecisionDock`
   - peek or pinned `ContextConstellation`

The workboard stays visible while a task is open, but it compresses to a narrower navigator once review begins. The task plane becomes dominant without hiding where the task came from.

### Three-plane escalation or compare mode

Promote to `three_plane` only when one of these is true:

- blocker-heavy review needs persistent `EvidencePrism`
- urgent escalation stage is active
- duplicate or compare workflow is open
- supervisor or approval review requires side-by-side consequence context
- user explicitly pins context

In `three_plane`, the third plane is a dedicated `ContextConstellation` posture. It may host `EvidencePrism`, `StateBraid`, approval preview, duplicate comparison, or escalation contact stage, but only one of those at full prominence at a time.

### Narrow layouts

On narrow desktop or tablet, collapse the workboard to a resizable drawer and move `DecisionDock` to a bottom sticky action bar. Mobile staff use `mission_stack` with:

- top summary strip
- list or task body
- bottom action tray
- swipeable context tabs instead of side rails

## Screen anatomy

### 1. Start-of-day `WorkspaceHome`

Default modules, in order:

1. `TodayWorkbenchHero`
   - recommended queue
   - next task
   - personal carry-over work
2. `InterruptionDigest`
   - urgent approvals
   - patient returns
   - escalations
3. `TeamRiskDigest`
   - queue SLA pressure
   - dependency degradation
   - backlog warnings
4. `RecentResumptionStrip`
   - last worked items
   - resume in one action

Rules:

- only the recommended queue is expanded by default
- interruption counts are summary-level until selected
- team risk stays compact unless thresholds cross into blocking territory
- no charts on first load; use ranked lists and compact numeric digests

### 2. Queue workboard

Queue row anatomy must fit expert scanning:

- left edge: priority band, unread or returned marker, channel badge
- primary line: patient or request label with short reason summary
- secondary line: due time, elapsed age, queue explanation snippet
- right cluster: assignee or lock state, changed-since-seen state, next action chip

Interaction rules:

- single click or Enter opens preview; double click or Shift+Enter opens full task
- Claim, Start review, and Next recommended task must be available from keyboard without leaving the list
- hover or focus preview opens in a lightweight preview pocket, not a full context panel
- reordering caused by live changes is buffered through `QueueChangeBatch`
- the active row stays pinned even if the queue rank changes

### 3. Active task shell

The task plane is organized as:

1. **CasePulse band**
   - patient identity confidence
   - request type
   - queue or priority
   - ownership
   - SLA posture
   - last trustworthy update
2. **Shared status strip**
   - save, sync, and freshness
   - queued live updates
   - waiting on external
   - review-required state
3. **Task canvas**
   - clinician-ready summary
   - structured facts
   - delta-first patient returns when present
   - narrative
   - attachments
   - compact lineage strip
4. **Sticky DecisionDock**
   - next best action
   - endpoint shortlist
   - more-info
   - escalate
   - release, close, and handoff actions as allowed

`StateBraid`, `EvidencePrism`, and `ContextConstellation` begin as collapsed summary stubs. `InterruptionDigestProjection` decides which one may promote.

### 4. Rapid-entry layer

Rapid entry is mandatory because staff frequently know the next action before they have finished reading every detail.

Add a `QuickCaptureTray` to `DecisionDock` with:

- structured endpoint shortcuts
- templated question sets
- one-key reason chips
- inline note field
- reusable admin resolution macros
- due-date quick picks for callbacks or more-info

Rules:

- use one tab cycle from summary to action composer
- favor chip-plus-text combo inputs over deep modal forms
- autosave locally within 250 ms and acknowledge through the shared status strip
- irreversible actions require `ConsequencePreview`, but reversible draft composition must remain inline
- new question set or reason text must not clear when evidence refreshes unless a true conflict is detected

## Alert-fatigue mitigation contract

Create a strict four-tier interruption model:

1. **blocking**
   - stale truth blocking safe action
   - urgent escalation active
   - approval required before commit
   - permission or policy denial
2. **urgent actionable**
   - patient returned with material new evidence
   - SLA breach requiring review soon
   - downstream handoff failed and needs recovery
3. **watch**
   - queue health deterioration
   - non-blocking dependency degradation
   - unread messages or callbacks due later
4. **silent**
   - routine saved-state, passive freshness, non-material feed updates

Rendering rules:

- only blocking items may become a shell-level banner or promoted urgent stage
- urgent actionable items render first in `InterruptionDigest` and may promote one support region
- watch items stay in compact digest cards or row badges
- silent items remain in the shared status strip or local inline cues
- no more than one full-width banner and one promoted support region may be visible simultaneously
- duplicate statuses across strip, digest, banner, and row cue must be collapsed before render
- auto-promotion must obey cooldown and composition locks from `AttentionBudget`

## Streamlined user flow contracts

### Queue to review

1. user lands on recommended queue
2. queue focus starts on the first actionable row
3. preview loads on focus
4. Claim or Start review can happen from row or preview pocket
5. task opens inside the same shell with queue context preserved
6. focus moves to the first unread or highest-consequence section in the task canvas

### Review to more-info

1. user triggers `DecisionDock -> Request more info`
2. `InlineSideStage` opens with suggested question sets and draft region
3. selected evidence anchors remain visible in the task canvas
4. send action returns to the same task shell with `awaiting_patient_info` posture
5. task stays in lineage and can be released or resumed without navigation reset

### Patient return to resumed review

1. `InterruptionDigest` shows returned evidence count
2. reopening the task lands on a delta-first resume summary
3. changed sections are highlighted in place
4. old context remains reachable through collapsed comparison, not a second full page
5. first dominant action becomes `Resume review`

### Review to decision or escalation

1. endpoint shortlist appears in `DecisionDock`
2. selecting an endpoint opens `ConsequencePreview` inline
3. if approval is required, approval context opens as `InlineSideStage`
4. if urgent escalation is triggered, the shell collapses to one urgent-contact stage and demotes secondary widgets
5. once the decision is committed, the task shell shows the exact downstream next owner and patient-facing consequence

### Completion to next task

1. direct resolution or handoff confirmation appears in place
2. closure summary remains visible long enough for causal confirmation
3. `Next best task` CTA uses `TaskLaunchContext.nextTaskCandidateRefs`
4. choosing the next task swaps the canvas while preserving the same shell and workboard state

## Context-aware information hierarchy

Promote context in this order:

1. data needed to avoid a wrong decision now
2. data explaining why the current task resurfaced
3. data needed to coordinate the next owner
4. audit or long-form history only on request

This means:

- returned patient evidence outranks historical timeline
- approval consequences outrank generic guidance
- handoff failure reasons outrank raw outbound logs
- duplicate comparison outranks broad patient context when merge safety is in question

## Cross-domain task integration

The workspace must present callback, messaging, booking-intent, pharmacy-intent, and reopen work as part of the same request lineage:

- linked work appears in a compact `LineageStrip`
- downstream failures generate interruption digest items, not surprise navigations
- cross-domain tasks are openable as side stages when they share the same continuity key
- staff never lose the parent request context when examining callback or handoff state

## Performance and responsiveness

The staff workspace is a high-frequency professional surface. It must ship with:

- windowed virtualization for all queue lists above 50 rows
- prefetch of preview data on focus or hover with cancellation on fast scan
- background prefetch of the next two recommended tasks while a current task is open
- chunked attachment loading with explicit placeholder states
- optimistic local acknowledgement for claim, note draft, filter save, and release
- stale-while-revalidate cache for queue projections
- region-level skeletons only; never blank the whole shell when one panel refreshes
- hotkey command palette with zero-layout-shift open or close behavior

## Accessibility and ergonomics

- every row, chip, and action must be keyboard reachable and screen-reader named
- dense data regions need stable column headers and tabular numerics
- focus order must follow workboard -> task canvas -> decision dock -> context
- all promoted regions require a clear dismiss or pin control
- motion must respect reduced-motion settings without losing causality
- pointer targets for high-risk actions must be larger than surrounding dense controls

## Metrics and validation

Track these operational outcomes:

- median time from queue focus to claim
- median time from claim to first meaningful action
- median time from patient return to resumed review
- actions per completed direct-resolution task
- approval completion time
- banner impressions per resolved task
- promoted-support-region count per task
- queue abandonment after live reorder
- keyboard-only completion rate for common triage tasks

A staff workspace redesign is successful only if it reduces task completion time and alert exposure without lowering decision quality or audit completeness.
