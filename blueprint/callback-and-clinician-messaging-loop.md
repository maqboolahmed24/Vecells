# Callback and clinician messaging loop

## Purpose

Define complete lifecycle models for callback and clinician-message endpoints so they are first-class operational domains.

This document specializes the canonical section in `phase-0-the-foundation-protocol.md` under `## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm`. `AccessGrantService` owns any patient-access links issued from these flows, `SafetyOrchestrator` owns materially new evidence and preemption, and `LifecycleCoordinator` owns request closure and governed reopen.

These lifecycles also inherit the cross-phase guardrails:

- active callback and message work must hold a `RequestLifecycleLease`
- clinically material replies or callback outcomes must create a new immutable `EvidenceSnapshot`
- unless evidence is on the explicit technical allow-list, it defaults to `potentially_clinical`
- any `potentially_clinical` reply or callback outcome must create `SafetyPreemptionRecord` and rerun the canonical safety engine before routine flow continues
- no callback or message service may close the request directly; only `LifecycleCoordinator` may close the request

## Callback domain

### Core object

- `CallbackCase`

### Suggested state model

`created -> queued -> scheduled -> ready_for_attempt -> attempt_in_progress -> answered | no_answer | voicemail_left | contact_route_repair_pending -> awaiting_retry -> completed | cancelled | expired -> closed`

Reopen path:

`closed -> reopened -> queued`

### Required fields

- callback urgency
- contact route and fallback
- preferred window
- attempt counters
- latest attempt outcome
- retry policy reference
- reachability dependency ref
- patient-visible expectation state

### Operational rules

- explicit claim and release rules
- explicit retry rules and max attempts
- voicemail policy by pathway
- escalation rules for repeated failure
- patient communication on each major transition
- full attempt audit trail
- secure callback entry links may only use `callback_status_entry`, `callback_response`, or `contact_route_repair`
- delivery failure or contact-route invalidation while a callback dependency is active must move the case to `contact_route_repair_pending`, refresh the patient-visible expectation state, and suppress stale callback assurance until repaired, expired, or escalated
- no patient-facing callback assurance may imply final resolution while a `SafetyPreemptionRecord` is pending
- callback completion may close the `CallbackCase`, but request closure still requires `LifecycleCoordinator`

## Clinician message domain

### Core object

- `ClinicianMessageThread`

### Suggested state model

Primary path:

`drafted -> approved -> sent -> delivered -> patient_replied -> awaiting_clinician_review -> closed`

Reopen path:

`closed -> reopened -> awaiting_clinician_review`

Reachability-repair path:

`sent | delivered -> delivery_failed -> contact_route_repair_pending -> approved | sent`

### Required fields

- thread purpose and closure rule
- author and approver refs
- delivery state
- reply expectation window
- reachability dependency ref
- re-safety flag on patient reply

### Operational rules

- no unapproved send for approval-required content
- response handling with explicit closure semantics
- re-safety check on clinically material replies
- escalation path to callback or triage reopen
- patient and staff timeline consistency
- secure message entry links may only use `message_thread_entry`, `message_reply`, or `contact_route_repair`
- patient replies route to `ClinicianMessageThread` first; triage reopen happens only after evidence classification or policy requires it
- delivery failure on an active message dependency must create a visible repair state instead of leaving the thread looking silently available
- patient replies may not auto-resume routine flow while preemption is pending
- thread closure may close the `ClinicianMessageThread`, but request closure still requires `LifecycleCoordinator`

## Shared patient-facing rules

Patient views should always show:

- current callback expectation or message status
- what happens next
- safe contact preference update path
- clear failure or fallback messaging
- whether the patient needs to reply now, wait for review, or use a different channel

## Patient conversation surface contract

Callback and clinician messaging should feel like one calm correspondence system rather than separate utilities.

Patient conversation surfaces should:

- group thread summaries by care episode or governing request
- show unread, `reply needed`, `awaiting review`, and `closed` states before the full thread is opened
- keep only one active composer expanded at a time in `clarityMode = essential`
- keep callback expectations, clinician messages, acknowledgements, and repair prompts in one card grammar
- preserve send, delivery, and reply receipts inside the thread rather than relying on transient toast confirmation alone
- show urgent diversion guidance whenever the issue described is not appropriate for asynchronous messaging or callback

## Shared staff-facing rules

Staff views should include:

- callback worklist
- message worklist
- attempt controls
- reply review controls
- closure and reopen controls
- escalation controls

## Shared command routing and reachability repair

<!-- Architectural correction: callback and message interactions are first-class domain mutations. They do not fall back to generic triage unless new evidence or reachability risk makes that necessary. -->

Use this shared algorithm:

1. patient enters through the authenticated shell or the correct transaction-action grant
2. resolve the governing object: `CallbackCase` or `ClinicianMessageThread`
3. persist the inbound payload and update the domain object first
4. if the payload is a pure availability update, acknowledgement, or contact-route repair, keep ownership in that domain and refresh the patient-visible expectation state in place
5. if the payload is `potentially_clinical` or `contact_safety_relevant`, create `SafetyPreemptionRecord`, block stale completion messaging, and reacquire triage or urgent handling according to policy
6. if a live callback or message dependency suffers delivery failure, rotate superseded grants, issue only the minimal `contact_route_repair` entry, and show a repair state rather than pretending the original promise is still live
7. only after the domain object is closed and `LifecycleCoordinator` confirms no remaining lease or pending preemption may the parent request close
