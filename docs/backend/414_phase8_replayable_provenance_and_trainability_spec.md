# 414 Phase 8 Replayable Provenance And Trainability Spec

Task `par_414` owns immutable replay provenance and settlement-backed
trainability for assistive outputs.

## Owned Runtime Package

`@vecells/domain-assistive-provenance` exposes:

- `AssistivePromptPackageRegistry`
- `AssistivePromptSnapshotStore`
- `AssistiveInferenceLogService`
- `AssistiveProvenanceEnvelopeWriter`
- `AssistiveReplayManifestAssembler`
- `FeedbackEligibilityMaterializer`
- `TrainabilityRevocationService`
- `AssistiveProvenanceExportGuard`

The package stores refs and hashes, not prompt fragments, transcript fragments,
or clinician free text in routine logs.

## Prompt Packages And Snapshots

Prompt packages and snapshots are governed artifacts. A snapshot must bind:

- capability code
- prompt package ref
- release candidate ref or watch tuple hash
- masking class
- disclosure class
- variable schema ref and hash
- canonical hash
- optional protected prompt artifact refs for deterministic replay

Snapshots are immutable. Reusing a snapshot id with a different canonical hash
fails closed with `prompt_snapshot_immutable`.

## Inference Logs

`AssistiveInferenceLogService` persists replayable inference logs from refs and
hashes. Each log points to model version, prompt snapshot, evidence snapshot
refs and hash, capture bundle, derivation packages, policy bundle, output schema
bundle, calibration bundle, runtime image, publication tuple, output artifact
refs, run settlement, and optional feedback chain.

Missing replay-critical refs fail closed with `missing_provenance_fail_closed`.

## Provenance Envelopes

`AssistiveProvenanceEnvelopeWriter` writes one authoritative provenance envelope
per assistive artifact revision. The envelope bridges later UI, assurance,
export, monitoring, and trainability work back to immutable model, prompt,
evidence, schema, calibration, policy, runtime, settlement, and feedback-chain
refs.

## Replay Manifests

`AssistiveReplayManifestAssembler` pins the exact replay posture:

- model version
- prompt snapshot
- input evidence snapshot hash and derivation refs
- output schema bundle
- calibration bundle
- policy bundle
- runtime image
- runtime publication bundle
- release candidate or watch tuple lineage
- replay harness version
- protected replay artifact refs

## Feedback Eligibility

`FeedbackEligibilityFlag` is materialized, not inferred. It derives from the
current feedback chain, final human artifact, authoritative workflow settlement,
incident linkage, adjudication state, exclusion reasons, label quality, and
counterfactual completeness.

The materializer defaults to `pending_settlement`, `requires_adjudication`, or
`excluded` unless the chain is cleanly settled, the final human artifact exists,
the authoritative workflow settlement exists, there are no incident or
policy-exception blockers, label quality is `routine_clean` or `adjudicated`,
and counterfactual evidence is complete or not applicable.

## Revocation

`TrainabilityRevocationService` appends a `TrainabilityRevocationRecord` and a
replacement revoked `FeedbackEligibilityFlag`. The previous flag remains
available for replay; current chain truth points to the replacement flag. This
keeps trainability append-only when incidents, final-artifact supersession,
exclusion decisions, adjudication outcomes, or provenance invalidation arrive
later.

## Export Guard

`AssistiveProvenanceExportGuard` blocks raw prompt or evidence export by
default. Full replay export requires an assembled replay manifest and is limited
to assurance or safety audiences. External handoff requires an outbound
navigation grant and artifact presentation contract.

## Persistence

The migration
`services/command-api/migrations/414_phase8_replayable_provenance_and_trainability.sql`
creates tables for prompt packages, prompt snapshots, inference logs,
provenance envelopes, replay manifests, feedback eligibility flags,
trainability revocation records, provenance export decisions, and audit records.
It includes constraints for immutable prompt lineage, refs-and-hashes-only
inference logs, one provenance envelope per artifact revision, settlement-backed
training eligibility, append-only revocation, and guarded export.
