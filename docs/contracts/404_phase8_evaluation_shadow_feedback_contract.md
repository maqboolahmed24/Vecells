# 404 Phase 8 Evaluation, Shadow, And Feedback Contract

## Contract Authority

Task `404` freezes the evaluation and feedback law for Phase 8. It consumes the `403` open gate and launch packet `LP403_404`; it does not implement the replay harness or visible workspace UI.

This contract family governs:

- protected evaluation dataset partitions
- deterministic replay bundles
- ground-truth labels and adjudication truth
- error taxonomy records
- model, prompt, and feature snapshot pins
- internal evaluation surface binding
- governed evaluation export posture
- settlement-backed feedback eligibility

## Dataset Partitions

### `gold`

The `gold` partition is the protected release-gate and regression dataset.

Repository law:

- A gold bundle is immutable after publication.
- Gold material may be read by release-gate and regression evaluation jobs only.
- Gold material must not be used as a casual tuning bucket, prompt playground, or threshold-mining source.
- Any correction to gold truth creates a new version and supersedes the old partition manifest.

### `shadow_live`

The `shadow_live` partition is captured from real workflow lineage while assistive output remains invisible to users.

Repository law:

- Shadow evidence must bind real request or task lineage, publication tuple, runtime tuple, and telemetry disclosure fence.
- Shadow evidence can support quality, safety, and rollout-readiness calculations.
- Shadow evidence cannot produce user-visible assistive state.
- If publication, disclosure, route, or runtime posture drifts, shadow completeness becomes `blocked` or `stale`.

### `feedback`

The `feedback` partition is built only from clinician-reviewed visible-use artifacts after visible rollout exists.

Repository law:

- Feedback membership requires one `FeedbackEligibilityFlag`.
- Feedback may contain only final human artifact lineage that has settled through authoritative workflow truth.
- The flag may be `eligible` only after settlement, label-quality, exclusion, incident, and supersession checks pass.
- Revocation supersedes prior eligibility; it must not mutate the old flag in place.

## Deterministic Replay Bundle

`CaseReplayBundle` must bind:

- request or task lineage
- evidence snapshot refs
- expected output ref
- feature snapshot refs
- prompt template version ref
- model registry entry ref
- output schema version ref
- dataset partition
- sensitivity or disclosure tag
- publication and runtime refs for the evaluation surface

The replay harness in task `406` may read frozen workflow evidence. It may not rebuild inputs from mutable current task state, and it may not mutate live workflow state.

## Label And Adjudication Truth

`GroundTruthLabel` is not final truth by itself. A label can be draft, submitted, superseded, excluded, or revoked. Adjudicated truth is carried by `LabelAdjudicationRecord`.

Minimum law:

- Every label needs an annotator role and label provenance.
- High-risk, conflicting, incident-linked, policy-exception, or dual-review cases route to adjudication.
- Adjudication emits a separate final adjudication record.
- Supersession and revocation preserve history.

## Shadow Completeness

Shadow evidence completeness has exactly four states:

- `complete`
- `stale`
- `missing`
- `blocked`

Completeness is derived from dataset partition, freshness window, required metric families, sample floor, publication tuple, runtime tuple, disclosure fence, and active recovery posture.

## Feedback Eligibility

`FeedbackEligibilityFlag` is a hard training gate, not an analytics boolean.

Allowed states:

- `pending_settlement`
- `requires_adjudication`
- `eligible`
- `excluded`
- `revoked`

Eligibility requires:

- settled final human artifact
- authoritative downstream workflow settlement
- acceptable label-quality state
- complete or not-applicable counterfactual completeness
- no later incident link
- no final-human-artifact supersession
- no exclusion reason

## Export Posture

`EvaluationExportArtifact` must be summary-first and policy-bound.

Forbidden defaults:

- raw replay dumps
- PHI-bearing CSV exports
- detached direct artifact URLs
- export without `ArtifactPresentationContract`
- export without `OutboundNavigationGrant`
- export on stale or withdrawn publication state

## Required Invariants

- `INV404_001`: A published gold-set bundle is immutable.
- `INV404_002`: A replay bundle may not point to mutable current task state in place of frozen evidence snapshots.
- `INV404_003`: A raw label is not adjudicated truth.
- `INV404_004`: A feedback eligibility flag cannot become `eligible` without authoritative human settlement.
- `INV404_005`: Revocation supersedes prior eligibility instead of mutating history in place.
- `INV404_006`: Evaluation exports may not bypass artifact-presentation, outbound-navigation, disclosure, or runtime publication law.
- `INV404_007`: Shadow evidence must remain invisible to end users.

## Downstream Consumers

| Consumer | What it consumes |
| --- | --- |
| `406` | Dataset partitions, replay bundles, labels, adjudication, shadow completeness, and export contracts. |
| `408` | Evidence-backed context and label-quality states for draft generation. |
| `409` | Error taxonomy, replay inputs, and abstention or suggestion-quality feedback boundaries. |
| `413` | Feedback eligibility, exclusion, revocation, and final-human-artifact requirements. |
| `414` | Prompt, model, replay, and trainability flag boundaries. |
| `415` | Shadow evidence completeness and required metric families. |
