# 413 Phase 8 Feedback Chain And Final Human Artifact Spec

Task `par_413` owns the authoritative human-review ledger for every visible
assistive artifact revision.

## Owned Runtime Package

`@vecells/domain-assistive-feedback-chain` exposes:

- `AssistiveFeedbackChainService`
- `AssistiveArtifactActionLedger`
- `ActionGestureIdempotencyGuard`
- `OverrideRecordService`
- `HumanApprovalGateEngine`
- `DistinctApproverPolicyGuard`
- `FinalHumanArtifactBinder`
- `AssistiveFeedbackChainSupersessionService`

The package stores one `AssistiveFeedbackChain` for one visible artifact
revision, selected anchor, review version, decision epoch, policy bundle,
lineage fence, and capability code. Live chains are indexed by a deterministic
tuple hash so the same artifact revision cannot fork into two active review
truths.

## Gesture Capture

`AssistiveArtifactActionRecord.actionGestureKey` is the idempotency boundary for
one visible human gesture. Retries return the same action record. Reusing a
gesture key against another chain fails closed with
`action_gesture_cannot_fork_chains`.

Supported gestures are:

- `accept_unchanged`
- `accept_after_edit`
- `reject_to_alternative`
- `abstained_by_human`
- `insert_draft`
- `regenerate`
- `dismiss_suggestion`
- `acknowledge_abstain`
- `stale_recovery`

Every action record carries the UI event envelope, UI transition settlement
record, and UI telemetry disclosure fence refs. The ledger persists refs and
hashes only; raw draft text, free-text override notes, and PHI-bearing evidence
spans stay out of routine telemetry.

## Override Records

`OverrideRecordService` captures materially reviewed artifacts on the same
chain and action record. Cosmetic style changes may remain optional. Material
content edits, rejected alternatives, policy exceptions, trust recovery,
low-confidence acceptances, high expected harm, low trust score, stale
freshness, or degraded continuity require deterministic reason codes before the
record can be accepted.

The reason policy must arrive as an explicit policy bundle ref and thresholds.
The package does not hide local hard-coded approval or reason thresholds.

## Approval Gate

`HumanApprovalGateEngine` computes:

- risk tier
- expected harm at gate
- trust score at gate
- session freshness penalty
- continuity validation state
- required approver count
- current distinct approver count
- blocking reasons

Dual review is required for externally consequential or irreversible commits
when high risk, high expected harm, low trust, policy exception override, or
hard-stop override applies. `DistinctApproverPolicyGuard` counts unique human
approvers, ignores the model-output generator, and prevents repeated approval by
the same actor from satisfying the second review.

The gate reaches `ready_to_settle` only when all fences are valid, freshness
penalty is zero, continuity is trusted, trust score is at or above the commit
threshold, completion adjacency is allowed, and the required number of distinct
human approvers is present.

## Final Human Artifact

`FinalHumanArtifactBinder` binds a final artifact only after an authoritative
downstream workflow settlement has reached `settled`. Assistive preview,
acceptance, insertion, or local acknowledgement never becomes final settlement.

The final artifact links:

- the current feedback chain
- the approval gate assessment
- approver and approval-event refs
- source assistive artifact refs
- the artifact presentation contract
- the authoritative workflow settlement ref
- the task completion settlement envelope ref

After binding, the chain moves to `settled_clean`. Task `414` consumes these
refs to materialize trainability flags; task `413` deliberately does not compute trainability.

## Supersession

`AssistiveFeedbackChainSupersessionService` supersedes chains instead of
mutating prior truth. Regenerate or artifact-hash drift can create a replacement
chain that points back to the superseded one. Dismiss and abstention
acknowledgement may append action records and exclude the chain, but they do not
mint trainable labels or rewrite old actions.

## Persistence

The migration
`services/command-api/migrations/413_phase8_feedback_chain_and_final_human_artifact.sql`
creates tables for feedback chains, action records, overrides, approval gate
assessments, final human artifacts, and audit records. It includes constraints
for one live chain per tuple, gesture idempotency, required reason codes,
distinct-approver counts, final settlement requirements, and PHI-safe telemetry
refs.
