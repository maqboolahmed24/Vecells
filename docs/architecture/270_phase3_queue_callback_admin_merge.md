# 270 Phase 3 Queue Callback Admin Merge

## Scope

`seq_270` closes the authority gap between queue rank, callback repair, self-care or bounded-admin consequence state, completion calmness, and next-task launch posture.

The merge surface is implemented in `/Users/test/Code/V/services/command-api/src/phase3-queue-callback-admin-merge.ts` as `Phase3QueueCallbackAdminMergeApplication`.

## Merge Bundle

The canonical digest shape is `Phase3QueueCallbackAdminDigest`.

It normalizes:

- `QueueMergeExecutionFamily`: `callback | self_care | admin_resolution | triage_only`
- `QueueMergePosture`: `ready | repair_required | waiting_dependency | completed | reopened | stale_recoverable | blocked`
- `QueueMergeCompletionAuthorityState`: `authoritative | pending_settlement | blocked | stale_recoverable`
- `QueueMergeNextTaskGateState`: `ready | gated | blocked | stale_recoverable`

## Dominance Rules

1. Callback route repair dominates all other queue-visible actions.
2. Bounded admin waiting, blocked, or reopened state outranks a generic queue row explanation.
3. Self-care renderable state may stay visible, but it does not imply calm completion.
4. Completion calmness and next-task launch remain downstream of the active callback or consequence posture.

## Service Surfaces

- `GET /v1/workspace/queues/{queueKey}/phase3-execution-merge`
- `GET /v1/workspace/tasks/{taskId}/phase3-execution-merge`

These surfaces compose existing applications rather than introducing another persistence fork:

- queue ranking
- callback domain
- self-care boundary
- advice render
- admin-resolution policy
- admin-resolution settlement
- self-care outcome analytics
- task completion continuity

## Workspace Wiring

The clinical workspace consumes the same 270 law through `/Users/test/Code/V/apps/clinical-workspace/src/workspace-queue-callback-admin-merge.data.ts`.

The queue workboard now:

- shows merged callback or consequence badges in the row cluster
- uses the 270 dominant summary in the preview pocket
- opens `Open callback repair`, `Open self-care stage`, and `Open bounded admin stage` from the queue preview without losing same-shell continuity

The task plane now uses the same merged authority to drive:

- `CompletionContinuityStage`
- `NextTaskPostureCard`

That removes the previous local-only calmness heuristic.

## Accepted Gap

The frontend merge helper is still seed-backed. The live command-api merge surfaces exist and are validated, but the workspace shell does not yet fetch them directly from a runtime query client.
