# 413 Algorithm Alignment Notes

Local source-of-truth order followed:

1. `blueprint/phase-8-the-assistive-layer.md` section `8F`
2. `blueprint/phase-3-the-human-checkpoint.md`
3. `blueprint/staff-workspace-interface-architecture.md`
4. validated outputs from tasks `404`, `411`, and `412`

Implemented alignments:

- `AssistiveFeedbackChain` is the single chain for one visible artifact revision,
  selected anchor, review version, decision epoch, policy bundle, lineage fence,
  and capability.
- `AssistiveArtifactActionRecord.actionGestureKey` is the idempotency boundary
  for retries and optimistic acknowledgement.
- Override reason capture is progressive but deterministic. Material edits,
  rejection, abstention, policy exception, trust recovery, low confidence, high
  expected harm, low trust, stale freshness, or degraded continuity require
  reason codes.
- `HumanApprovalGateAssessment` computes artifact-level approval burden instead
  of treating rollout posture as approval. Dual review is required for
  consequence-bearing high-risk, high-harm, low-trust, policy-exception, or
  hard-stop cases.
- Distinct approvers are enforced. The same actor cannot satisfy the second
  review, and the model-output generator is ignored as an approver.
- `FinalHumanArtifact` cannot bind until authoritative downstream settlement is
  `settled` and the approval gate is `ready_to_settle`.
- Chain supersession is append-only. Regenerate and artifact-hash drift preserve
  prior chain history and optionally create a replacement chain.
- Task `413` publishes exact refs for task `414` but does not compute
  trainability flags.

Boundary decisions:

- Approval and override thresholds are accepted as explicit policy bundle inputs
  on commands. The package does not introduce hidden local thresholds.
- Routine telemetry requires event, transition-settlement, and disclosure-fence
  refs. Raw clinician edits or evidence spans are not stored in audit records.
- Dismissal and abstention acknowledgement append action records and exclude the
  chain; they do not create trainable labels.
