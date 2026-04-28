# 149 Normalized Submission Design

`par_149` turns the provisional Phase 1 submit-normalization seed into one deterministic `NormalizedSubmission` contract. The authoritative path now derives request shape only from the immutable submit cut, the pinned `QDC_140_PHASE1_V1` question definitions, and the pinned intake bundle reference captured at submit time.

## Authoritative inputs

- `SubmissionSnapshotFreeze`
- `EvidenceSnapshot`
- `Phase1IntakeExperienceBundle`
- `140_question_definitions.json`

The normalizer does not read live draft state after freeze, does not infer field meaning from UI copy, and does not use opaque AI summarization.

## Canonical flow

1. `SubmissionSnapshotFreeze` captures the active structured answers, free-text narrative, attachment refs, identity context, capability ceiling, and contact-authority posture.
2. The canonical-normalization derivation package is registered against the frozen capture bundle.
3. `EvidenceSnapshot` is created.
4. `NormalizedSubmission` is built from the frozen submit cut plus the governing `EvidenceSnapshot` ref.
5. The append-only submit-normalization storage record persists the full normalized snapshot, `normalizationVersionRef`, `normalizedHash`, and `dedupeFingerprint`.

## Request-shape rules

- Hidden superseded answers are excluded before normalization.
- `normalizationTarget` controls the request-shape write path.
- `summaryRenderer` controls deterministic fragment rendering.
- `safetyRelevance` survives into fragment metadata.
- Free text is preserved as authored narrative and tokenized deterministically for dedupe only; the normalizer does not invent or paraphrase facts.

## Replay and duplicate posture

- The same immutable snapshot plus bundle plus `PHASE1_NORMALIZED_SUBMISSION_V1` yields the same normalized output and hash.
- Dedupe fingerprints derive from canonical request-shape fields and the narrative token fingerprint, not UI order or whitespace formatting.
- Replay classification may still use the submit semantic fingerprint, but downstream duplicate, safety, and receipt work should consume the canonical normalized contract stored in the submit-normalization record.

## Gap closures

- `GAP_RESOLVED_NORMALIZED_CONTRACT_PHASE1_V1`
- `GAP_RESOLVED_FREE_TEXT_RULES_PHASE1_V1`
- `GAP_RESOLVED_DEDUPE_FINGERPRINT_PHASE1_V1`
