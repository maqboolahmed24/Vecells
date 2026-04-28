# 236 More-Info Worker Runbook

## Purpose

The more-info worker drains:

- pending initial deliveries
- reminder-due dispatch
- quiet-hours suppression
- blocked-reachability suppression
- callback-fallback seeds
- expired cycle cleanup

Implementation seam: `Phase3MoreInfoKernelApplication.drainReminderWorker`.

## Inputs

- `evaluatedAt`
- optional `reachabilityByCycleId`

The worker must use authoritative server time for `evaluatedAt`. It must not trust browser clocks or provider timestamps as checkpoint truth.

## Normal run order

1. dispatch due `initial_delivery` outbox rows for cycles still in `awaiting_delivery`
2. load live cycles
3. recompute checkpoint posture from current server time plus reachability
4. if the checkpoint is `expired`, release the more-info lease and expire the cycle
5. if the checkpoint is `blocked_repair`, suppress reminders or emit one callback-fallback seed
6. if the checkpoint is `reminder_due` and quiet hours apply, suppress with `nextQuietHoursReleaseAt`
7. if the checkpoint is `reminder_due` and quiet hours do not apply, dispatch one reminder

## Failure handling

### Duplicate worker invocation

- safe by design
- outbox effect keys are replay-safe
- repeated drains do not emit duplicate reminder or callback-fallback rows

### Stale lease or fence

- fail closed
- re-read cycle state
- do not mutate or publish from stale ownership

### Reachability blocked

- do not continue reminder send
- keep suppression reason explicit
- when policy allows, emit one `callback_fallback_seed`

### Grant revocation race

- revoke is best effort during replay-safe cleanup
- the cycle and checkpoint remain the truth boundary even if the same revoke path is replayed

## Operational checks

- `phase3_more_info_outbox_entries` should have at most one row per `effect_key`
- `phase3_more_info_reply_window_checkpoints` should have at most one live row per lineage
- `phase3_more_info_reminder_schedules.next_quiet_hours_release_at` should be populated for suppressed quiet-hours rows
- released or expired cycles should not retain pending outbox rows

## Current limitation

Outbound reminder delivery is simulator-backed for now. The kernel and outbox contract are production-shaped, but the external communications adapter remains a later integration concern.
