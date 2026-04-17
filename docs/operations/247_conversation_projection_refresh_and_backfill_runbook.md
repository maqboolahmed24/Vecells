# 247 Conversation Projection Refresh And Backfill Runbook

`247` exposes two operational controls:

- `POST /internal/v1/workspace/tasks/{taskId}:refresh-patient-conversation`
- `POST /internal/v1/conversations/legacy-history:backfill`

## Refresh flow

Use `:refresh-patient-conversation` when callback, clinician-message, more-info, or communication-repair truth changes and the patient-thread tuple must be recomputed immediately.

The refresh handler:

1. reads the current `243`, `244`, `245`, and `236` state for the task
2. normalizes those rows into the authoritative conversation tuple
3. publishes the `246` compatibility tuple
4. rehydrates the resulting digest and settlement refs back onto the thread bundle

## Backfill flow

Use `:backfill` for legacy callback or clinician-message history that predates the current tuple.

Backfill rules:

- store immutable legacy row facts
- materialize them as placeholder or recovery rows
- do not emit calm reviewed or settled copy from backfill alone
- keep lineage drift explicit if legacy rows disagree with current request-lineage truth

## Failure posture

If the refresh path detects request-lineage drift or only legacy placeholder rows, the cluster remains visible but degrades:

- stale tuple => pending posture
- repair hold => recovery-only posture
- legacy-only backfill => placeholder posture
