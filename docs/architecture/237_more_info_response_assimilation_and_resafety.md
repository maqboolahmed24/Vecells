# 237 More-Info Response Assimilation And Resafety

Task `237` establishes the only legal Phase 3 patient-reply ingestion path after `236` has created a live `MoreInfoCycle` and `MoreInfoReplyWindowCheckpoint`.

## Scope

This implementation owns:

- `MoreInfoResponseDisposition`
- accepted reply receipt versus blocked receipt resolution
- immutable reply-backed evidence capture
- canonical `EvidenceAssimilationRecord`
- `MaterialDeltaAssessment`
- canonical classification and re-safety rerun
- urgent return, routine review resume, and supervisor churn-guard settlement

It does not replace `236` timer truth, and it does not bypass later `238` to `243` consequence domains.

## Route surfaces

- `POST /v1/workspace/tasks/{taskId}/more-info/{cycleId}:receive-reply`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:evaluate-reply`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:assimilate-reply`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:classify-reply`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:run-resafety`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:settle-urgent-return`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:settle-review-resumed-return`
- `POST /internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:mark-supervisor-review-required`

## Durable objects

### `MoreInfoResponseDisposition`

Every inbound reply resolves to exactly one disposition before any heavy downstream work:

- `accepted_in_window`
- `accepted_late_review`
- `blocked_repair`
- `superseded_duplicate`
- `expired_rejected`

The disposition persists `reasonCodeRefs`, replay metadata, the checkpoint revision, the live lineage fence tuple seen at receipt time, and the recovery route when the reply is blocked.

### `ResponseAssimilationRecord`

Accepted replies append one task-scoped linkage record binding:

- disposition
- immutable capture bundle
- resulting snapshot ref
- `EvidenceAssimilationRecord`
- `MaterialDeltaAssessment`
- `EvidenceClassificationDecision`
- `SafetyPreemptionRecord`
- `SafetyDecisionRecord`
- urgent diversion settlement when present

### `MoreInfoSupervisorReviewRequirement`

When reopen oscillation crosses `N_reopen_max = 3` inside `W_reopen = 24h` without a stable clear or clinician-resolution reset, automatic queue return is suppressed and a supervisor review requirement is appended.

## Execution order

1. Resolve the exact current `MoreInfoCycle`, `MoreInfoReplyWindowCheckpoint`, and request state.
2. Resolve replay by `idempotencyKey` first, then by semantic `replayKey`.
3. Create `MoreInfoResponseDisposition` for blocked, duplicate, or expired outcomes and stop there.
4. For accepted replies only, call the `236` patient-response kernel and re-read current-cycle truth before commit.
5. Freeze one new `EvidenceCaptureBundle` plus normalized, derived-facts, and summary-parity artifacts.
6. Run the canonical assimilation pipeline to produce `EvidenceAssimilationRecord`, `MaterialDeltaAssessment`, classification, preemption, and updated `SafetyDecisionRecord`.
7. Release the more-info lease, advance the task lineage fence to the new shared epoch, and then settle one of:
   - `urgent_return`
   - `review_resumed_only`
   - `review_resumed_then_queued`
   - `supervisor_review_required`
   - `manual_review_blocked`
8. Persist `ResponseAssimilationRecord` and optional supervisor review requirement.

## Canonical return handling

Urgent reruns set `TriageTask.status = escalated` immediately.

Residual or clear reruns settle `TriageTask.status = review_resumed`, and queue re-entry is allowed only through the legal `review_resumed -> queued` transition.

Blocked repair, superseded duplicate, and expired rejection never mint a new snapshot and never reopen routine queue flow.

## Synthetic transition seam

`awaiting_patient_info` can outlive the original task review lease. The patient reply path therefore does not attempt to reuse an expired review lease for `review_resumed`, `queued`, or `escalated`.

Instead, `237`:

- releases the active more-info lease
- synchronizes the task’s `currentLineageFenceEpoch` to the released more-info epoch
- settles the task transition with a synthetic triage command witness

This follows the temporary synthetic-command seam already documented in `231` for unowned or lease-expired return paths while keeping the authoritative task tuple and transition journal intact.
