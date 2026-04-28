# Phase 8 Evaluation Plane Runtime Spec

Task: `par_406_phase8_track_backend_build_evaluation_corpus_label_store_replay_harness_and_shadow_dataset`

## Runtime Boundary

The assistive evaluation plane is implemented in `packages/domains/assistive_evaluation`. It is a domain package with in-memory service contracts and a matching command API migration for durable storage under `assistive_evaluation_*` tables.

The plane may read frozen workflow refs, evidence snapshots, feature snapshots, prompt refs, model refs, schema refs, and runtime publication refs. It may not mutate live task state. Replay execution fails closed if a caller supplies a live workflow mutation ref.

## Owned Services

- `EvaluationDatasetPartitionService` creates, updates, and publishes dataset partition manifests.
- `CaseReplayBundleService` creates frozen replay bundles and computes bundle hashes from pinned refs.
- `GroundTruthLabelService` records draft, submitted, superseded, and revoked labels.
- `ReplayAdjudicationService` creates final adjudication records separate from raw labels.
- `ErrorTaxonomyService` records typed findings and requires adjudication routing for high or critical confirmed errors.
- `ReplayHarnessOrchestrator` schedules and executes deterministic replay runs.
- `ShadowDatasetCaptureService` captures governed `shadow_live` cases without user-visible assistive output.
- `EvaluationExportArtifactService` generates summary-first export artifacts and blocks raw PHI exports.
- `AssistiveEvaluationSurfaceBindingResolver` resolves internal workbench bindings to `live`, `observe_only`, `recovery_only`, or `blocked`.

All mutating APIs require `EvaluationActorContext` and emit `EvaluationAuditRecord` entries with actor, route intent, purpose of use, audit correlation, outcome, and reason codes.

## Partition Rules

`gold` is for protected release-gate regression evidence. Writers are limited to `evaluation_data_steward` and `clinical_safety_lead`. Published gold manifests require bundle refs, label refs, and adjudication refs, then become immutable.

`shadow_live` is written only by `shadow_dataset_capture_job`. Capture requires publication, runtime, disclosure, recovery, evaluation-surface, and shadow-requirement refs. Shadow capture rejects any case where assistive output is visible to end users.

`feedback` is written only by `feedback_chain_settlement_job`. Feedback bundles must bind a `feedbackEligibilityFlagRef` from the task 404 feedback law.

## Replay Determinism

`CaseReplayBundleService` requires these pinned refs:

- request and task lineage refs
- evidence snapshot refs
- evidence capture bundle refs
- evidence derivation package refs
- expected output ref
- feature snapshot refs
- prompt template version ref
- model registry entry ref
- output schema version ref
- runtime config hash
- surface route, surface publication, runtime publication, and telemetry disclosure refs

The bundle hash is computed from those pinned refs. `ReplayHarnessOrchestrator` then computes `replayInputHash` from the bundle hash, replay harness version, prompt, model, schema, feature, evidence, and runtime refs. Execution computes an `outputHash` from the replay input hash and output ref. Output schema drift, runtime hash drift, mutable refs, missing pinned inputs, or live mutation attempts fail closed and are persisted as a failed closed replay outcome.

## Label, Adjudication, And Errors

Raw `GroundTruthLabel` records are never treated as final truth by themselves. They may support final truth only after they are submitted and either marked `not_required` or linked to an adjudicated `LabelAdjudicationRecord`.

`ReplayAdjudicationService` requires submitted candidate labels on the same replay bundle, records adjudicator role and reason codes, and updates the final label adjudication state to `adjudicated`. Supersession preserves historical labels and adjudication records.

`ErrorTaxonomyService` accepts typed error findings. Confirmed `high` or `critical` severity findings require adjudication routing, matching the 404 contract requirement that high-risk and incident-linked cases route to review.

## Shadow Capture

`ShadowDatasetCaptureService` is the only service that writes real workflow cases into `shadow_live`. It inherits publication and runtime refs from the workflow posture and creates a replay bundle in the evaluation plane. Blocked publication or recovery posture stops capture; stale or missing completeness creates quarantined capture records rather than visible rollout evidence.

## Governed Export

`EvaluationExportArtifactService` defaults to `summary_only`. It blocks:

- raw PHI export
- `csv_phi`
- `raw_replay_dump`
- direct storage URL handoff
- external handoff without an outbound navigation grant

Exports must bind an `ArtifactPresentationContract`, surface route contract, surface publication, runtime publication, placeholder contract, and redaction transform hash.

## Surface Binding Defaults

Evaluation and replay workbench surfaces bind through `AssistiveEvaluationSurfaceBindingResolver`. If later trust or rollout surfaces are missing, the resolver defaults to `observe_only`. Missing telemetry disclosure fence, withdrawn publication, blocked runtime, rollback-only recovery, or quarantined trust blocks the binding.

## Persistence

The migration `services/command-api/migrations/406_phase8_assistive_evaluation_plane.sql` defines persisted objects for manifests, bundles, labels, adjudications, error taxonomy, replay runs, shadow capture, export artifacts, surface bindings, and audit records. SQL checks enforce partition IDs, required feedback flags, high-error adjudication routing, shadow invisibility, and PHI export blocking.
