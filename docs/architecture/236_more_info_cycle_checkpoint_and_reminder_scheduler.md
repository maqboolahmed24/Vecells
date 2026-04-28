# 236 More-Info Cycle, Checkpoint, and Reminder Scheduler

## Scope

`par_236` lands the canonical Phase 3 backend kernel for the more-info loop. The implementation centers on one executable object family:

- `MoreInfoCycle`
- `MoreInfoReplyWindowCheckpoint`
- `MoreInfoReminderSchedule`
- transactional outbox publication for initial delivery, reminder send, and callback fallback seeds

The production-shaped code is in:

- `packages/domains/triage_workspace/src/phase3-more-info-kernel.ts`
- `services/command-api/src/phase3-more-info-kernel.ts`
- `services/command-api/migrations/112_phase3_more_info_cycle_kernel.sql`

## Authoritative rules

1. Exactly one `MoreInfoReplyWindowCheckpoint` may be live for a request lineage at a time.
2. `MoreInfoCycle.dueAt` is denormalized display state over checkpoint truth and is never edited independently.
3. Reminder orchestration is derived from:
   - current `MoreInfoReminderSchedule`
   - current `MoreInfoReplyWindowCheckpoint`
   - current reachability posture
   - resolved quiet-hours policy
4. Grant expiry may narrow entry posture but may not redefine the reply window.
5. Superseding or cancelling a cycle revokes older grants, releases the more-info lease, and kills stale reminder paths.

## Command/API seam

The application publishes these command and query routes:

- `GET /v1/workspace/tasks/{taskId}/more-info`
- `POST /v1/workspace/tasks/{taskId}:request-more-info`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:supersede`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:cancel`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:recompute-checkpoint`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:mark-reminder-due`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:dispatch-reminder`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:suppress-reminder`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:expire`
- `POST /internal/v1/workspace/more-info:drain-worker`

These map to one application service, `Phase3MoreInfoKernelApplication`, and one schema tag, `236.phase3.more-info-kernel.v1`.

## State model

### MoreInfoCycle.state

- `draft`
- `awaiting_delivery`
- `awaiting_patient_reply`
- `awaiting_late_review`
- `response_received`
- `review_resumed`
- `expired`
- `superseded`
- `cancelled`

### MoreInfoReplyWindowCheckpoint.replyWindowState

- `open`
- `reminder_due`
- `late_review`
- `expired`
- `superseded`
- `settled`
- `blocked_repair`

### MoreInfoReminderSchedule.scheduleState

- `scheduled`
- `suppressed`
- `exhausted`
- `completed`
- `cancelled`

## Lease and triage posture integration

On successful request-more-info:

1. the triage task moves to `awaiting_patient_info` unless it is already there because a replacement cycle is being issued
2. the triage-side request lease remains active through the existing 231 kernel
3. the more-info cycle acquires its own `RequestLifecycleLease`
4. the cycle stores the current `ownershipEpoch`, `fencingToken`, and `currentLineageFenceEpoch`

On supersession, cancellation, or expiry:

1. the more-info lease is released through the lease/fence authority
2. the cycle fence epoch advances
3. reply grants are revoked
4. pending outbox entries are cancelled or finalized

## Reminder and callback-fallback orchestration

The worker processes:

1. pending initial delivery
2. reminder_due recompute
3. quiet-hours suppression with persisted `nextQuietHoursReleaseAt`
4. blocked reachability suppression
5. callback fallback seed creation when reachability is blocked and policy allows governed fallback
6. explicit expiry once the checkpoint moves to `expired`

The implementation keeps callback-fallback as a seam only. It emits `callback_fallback_seed` outbox effects and does not implement the callback case itself; that remains for `243`.

## Replay-safe guarantees

- `computeMoreInfoWorkerEffectKey` dedupes initial delivery, reminder send, and callback fallback effects by cycle, effect type, ordinal, and checkpoint revision.
- repeated worker drains do not emit duplicate reminder or callback-fallback outbox rows
- quiet-hours suppression reuses the same schedule row rather than creating orphaned reminder jobs
- older cycle outbox entries are cancelled when a cycle is superseded or cancelled

## Contract notes for 237+

`237` should ingest patient replies against this kernel, not compute reply-window truth itself. It must treat:

- `accepted_on_time`
- `accepted_late_review`
- `superseded_duplicate`
- `expired_rejected`
- `blocked_repair`

as classification outputs from 236-owned checkpoint truth.
