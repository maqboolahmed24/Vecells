# 406 Algorithm Alignment Notes

Task 406 implements the Phase 8B evaluation plane from `blueprint/phase-8-the-assistive-layer.md` and the frozen contracts from tasks 404 and 405.

## Local Source Alignment

- Phase 8B requires a dedicated evaluation plane separate from the live transactional system. The implementation creates `@vecells/domain-assistive-evaluation` and a separate `assistive_evaluation_*` migration namespace.
- Phase 8B requires `CaseReplayBundle`, `GroundTruthLabel`, `ErrorTaxonomyRecord`, `AssistiveEvaluationSurfaceBinding`, and `EvaluationExportArtifact`. The runtime adds those records plus `DatasetPartitionManifest`, `LabelAdjudicationRecord`, `ReplayRunRecord`, `ShadowDatasetCaptureRecord`, and `EvaluationAuditRecord`.
- Task 404 freezes `gold`, `shadow_live`, and `feedback` partitions. `EvaluationDatasetPartitionService` enforces writer roles and gold immutability in code, and `CaseReplayBundleService` enforces feedback eligibility flags.
- Task 404 says raw labels are not final truth. `GroundTruthLabelService.canSupportFinalTruth` returns true only after submission plus `not_required` or `adjudicated` state, and `ReplayAdjudicationService` owns final adjudication records.
- Task 404 says shadow evidence remains invisible to end users. `ShadowDatasetCaptureService` rejects `assistiveOutputVisibleToEndUsers = true` and the migration has a database check enforcing false.
- Phase 8B says replay must rebuild exact assistive context from request history, review bundle, evidence snapshot, feature snapshot, pinned model, and pinned prompt. `CaseReplayBundleService` requires frozen evidence, feature, prompt, model, schema, and runtime refs; `ReplayHarnessOrchestrator` derives deterministic hashes and fails closed on drift.
- Phase 8B says internal evaluation routes must bind published route, surface publication, and runtime publication. `AssistiveEvaluationSurfaceBindingResolver` requires those refs for `live` and defaults to `observe_only` when later trust surfaces are missing.
- Task 405 release contracts require evaluation corpus and replay proof to support release candidates. The 406 contract exposes deterministic replay hashes, summary export artifacts, and partition manifests for later release gates.

## Conservative Interface Choices

- No live workflow dependency was introduced. The evaluation plane accepts refs only and has no API for workflow task mutation.
- Missing later trust or rollout surfaces resolve to `observe_only`, not `live`, so 410 and 411 can later tighten trust-envelope behavior without widening current posture.
- The migration includes guard checks even though service code enforces the same rules, so batch jobs and future persistence adapters inherit the safety posture.
- Shadow completeness states `stale` and `missing` can be captured as quarantined records for diagnostic work, but `blocked` is rejected.

## Acceptance Evidence

- `tests/unit/406_evaluation_partition_and_label_logic.spec.ts` proves partition write controls, gold immutability, and label/adjudication separation.
- `tests/integration/406_replay_harness_determinism.spec.ts` proves deterministic hashes, fail-closed drift behavior, and no live mutation execution.
- `tests/integration/406_shadow_dataset_capture_and_export.spec.ts` proves invisible shadow capture, summary-first export, raw PHI blocking, and observe-only trust fallback.
