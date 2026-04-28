# Phase 8 Change-Control Evidence Pipeline

Task `par_417` adds the executable evidence graph for material assistive changes. It prevents approve, promote, freeze, unfreeze, and rollback actions from settling against loose model, prompt, supplier, or configuration refs.

## Owned Services

- `ChangeImpactAssessmentService` builds `ChangeImpactAssessment` from real deltas across visible surfaces, workflow decisions, artifact delivery, telemetry disclosure, rollout scope, intended use, and medical-purpose boundary.
- `RFCBundleAssembler` builds `RFCBundle` packages for IM1 RFC and SCAL evidence while keeping local AI technical assurance separate from IM1 pairing.
- `AssuranceBaselineSnapshotService` pins `AssuranceBaselineSnapshot`, `SubprocessorAssuranceRef`, `MedicalDeviceAssessmentRef`, and `SafetyCaseDelta`.
- `ReleaseApprovalGraphService` creates `ReleaseApprovalGraph` with no-self-approval, independent safety review, deployment approval, and trigger-derived approver roles.
- `RollbackReadinessBundleService` assembles `RollbackReadinessBundle` from rollback target, compatibility checks, kill-switch plan, runbook, runtime-publication parity, and verification evidence.
- `AssuranceFreezeStateService` opens or maintains `AssuranceFreezeState` when baselines, suppliers, approvals, rollback proof, SCAL assumptions, or disclosure evidence drift.
- `AssistiveReleaseActionService` records and settles `AssistiveReleaseActionRecord` and `AssistiveReleaseActionSettlement`.
- `AssistiveRegulatoryEvidenceExporter` exports RFC bundles, approval summaries, rollback packs, and runbooks through governed artifact-presentation and outbound-navigation refs.

## Change Classes

Supported classes are `copy_template_only`, `prompt_or_threshold`, `model_version`, `subprocessor_or_inference_host`, `capability_expansion`, `intended_use`, and `regulatory_posture`.

Template-only changes remain low impact only when the candidate hash is stable and the assessment proves no medical-purpose, workflow-decision, rollout-ladder, slice-membership, or patient-facing wording delta.

Prompt, threshold, model, supplier, capability, intended-use, and regulatory-posture changes route to evaluation, replay, DCB, DTAC, DPIA, SCAL, IM1 RFC, MHRA, or medical-device reassessment flags as required by the local blueprint.

## Baseline And Approval

`AssuranceBaselineSnapshot` binds the exact candidate hash to IM1 guidance, DTAC version, DCB standard version, DPIA, SCAL version, medical-device assessment, evaluation dataset, replay harness, supplier assurance refs, disclosure baseline, and safety-case delta.

`ReleaseApprovalGraph` enforces independent safety review and no self-approval. It expands required roles from active triggers: clinical safety, information governance, regulatory ownership, deployment approval, product ownership, and rollback ownership.

## Rollback And Freeze

`RollbackReadinessBundle` must prove rollback target, data compatibility, policy compatibility, runtime-publication parity, kill-switch plan, operator runbook, release recovery disposition, and verification evidence. Missing rollback proof blocks promotion.

`AssuranceFreezeState` freezes promotion when supplier assurance drifts, baselines expire, approval graphs are incomplete, rollback bundles are incomplete, or disclosure/safety proof is missing.

## Release Actions

Every release action binds the exact `releaseCandidateHash`, `baselineSnapshotHash`, `runtimePublicationBundleRef`, `uiTelemetryDisclosureBaselineRef`, `rollbackBundleHash`, `rolloutSliceContractRef`, `rolloutVerdictRef`, and `releaseRecoveryDispositionRef`.

Promotion can settle only when the baseline is current, the approval graph is satisfied, rollback readiness is complete, and no assurance freeze is active.

## Evidence Export

Evidence export is not a raw file dump. `AssistiveRegulatoryEvidenceExport` requires `artifactPresentationPolicyRef`, `outboundNavigationGrantRef`, `presentationArtifactRef`, and `repositoryArtifactRef` so later release-admin and assurance surfaces can render and navigate governed artifacts safely.
