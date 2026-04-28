# 417 Algorithm Alignment Notes

## Local Sources

- `blueprint/phase-8-the-assistive-layer.md#8h-im1-rfc-dtac-dcb-safety-medical-device-boundary-and-change-control`
- `blueprint/phase-8-the-assistive-layer.md#8i-pilot-rollout-controlled-slices-and-formal-exit-gate`
- `blueprint/phase-0-the-foundation-protocol.md`
- `blueprint/platform-runtime-and-release-blueprint.md`
- `blueprint/platform-admin-and-config-blueprint.md`
- validated outputs from `405`, `410`, `414`, `415`, and `416`

## Implementation Mapping

- `ChangeImpactAssessmentService` implements the seven change classes and derives regulatory triggers from visible-surface, workflow-decision, intended-use, artifact-delivery, telemetry-disclosure, rollout, and medical-purpose boundary deltas.
- `AssuranceBaselineSnapshotService` pins guidance and evidence baselines per candidate, including IM1, DTAC, DCB, DPIA, SCAL, medical-device assessment, evaluation dataset, replay harness, supplier assurance, disclosure baseline, and safety-case delta refs.
- `ReleaseApprovalGraphService` enforces no-self-approval plus independent safety review and adds required roles for DCB, DPIA, IM1, DTAC, MHRA, and rollback triggers.
- `RollbackReadinessBundleService` requires rollback target, data compatibility, policy compatibility, runtime-publication parity, kill-switch plan, operator runbook, release recovery disposition, and verification evidence.
- `AssuranceFreezeStateService` freezes on stale baselines, supplier drift, suspended subprocessors, incomplete approval graphs, or incomplete rollback readiness.
- `AssistiveReleaseActionService` binds approve, promote, freeze, unfreeze, and rollback actions to the exact candidate hash, baseline hash, runtime publication bundle, telemetry disclosure baseline, rollback hash, rollout slice, rollout verdict, and recovery disposition.
- `AssistiveRegulatoryEvidenceExporter` keeps RFC bundles, approval summaries, rollback packs, and runbooks inside governed artifact presentation and outbound navigation refs.

## Conservative Behavior

IM1 packaging is represented as due-diligence and RFC evidence, not as AI model technical assurance. Local model, algorithm, safety, drift, replay, and rollback evidence remains explicit and promotion-blocking.

`copy_template_only` is intentionally narrow. Any workflow, rollout, intended-use, patient-facing wording, or medical-purpose boundary delta blocks that classification and forces the material change path.

## PHI Boundary

Assurance artifacts persist refs, hashes, state tokens, blocker codes, and governed artifact refs. They do not store draft note text, prompt fragments, transcripts, or patient context.
