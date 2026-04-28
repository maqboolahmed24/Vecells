# 405 Phase 8 Release Candidate And Change Control Contract

## Contract Authority

Task `405` freezes the release, safety-case, and regulatory change-control law for Phase 8 assistive capability changes. It consumes the `403` open gate, launch packet `LP403_405`, and the `404` evaluation, shadow, and feedback contracts.

This contract family governs:

- immutable assistive release candidate identity
- model, prompt, policy, schema, calibration, and runtime release pins
- regulatory trigger decisions for IM1 RFC, SCAL, DTAC, DCB0129, DCB0160, DPIA, and MHRA or medical-device reassessment
- no-self-approval and independent signoff topology
- assurance baseline and supplier-assurance freshness
- rollback readiness and kill-switch proof
- assurance freeze, lift, rollback, and authoritative settlement

## Immutable Candidate Identity

`AssistiveReleaseCandidate` is the only object a release approval may approve.

Approval must bind to:

- `candidateHash`
- `AssuranceBaselineSnapshot`
- `compiledPolicyBundleRef`
- `modelVersionRef`
- `promptPackageRef`
- `outputSchemaBundleRef`
- calibration, threshold, uncertainty, and conformal artifacts
- `runtimePublicationBundleRef`
- route contract refs
- recovery disposition set
- evaluation corpus ref
- rollback bundle ref

Loose labels such as "current model", "latest prompt", or "approved configuration" are not valid approval targets.

## Change Control Flow

1. `ModelChangeRequest` records the requested change, capability, intended-use impact, safety impact, and proposed version refs.
2. `ChangeImpactAssessment` deterministically evaluates the medical-purpose boundary, workflow effect, surface effect, data-processing effect, and assurance deltas.
3. `AssistiveReleaseCandidate` is materialized and frozen with a candidate hash before approval work starts.
4. `AssuranceBaselineSnapshot`, `SafetyCaseDelta`, `MedicalDeviceAssessmentRef`, and `SubprocessorAssuranceRef` records are pinned.
5. `RFCBundle` is required when IM1 use case, AI behavior, or significant functional scope evolves.
6. `ReleaseApprovalGraph` proves independent safety, product, deployment, information-governance, and security review where required.
7. `RollbackReadinessBundle` proves rollback target, compatibility, kill-switch plan, runbook, and verification evidence.
8. Any approve, promote, freeze, unfreeze, or rollback action must settle through `AssistiveReleaseActionRecord` and `AssistiveReleaseActionSettlement`.

## Medical Purpose Boundary

The release law preserves three practical boundaries:

- `transcription_documentation_assistance`: speech or text capture and documentation support, with human review and no endpoint mutation.
- `higher_function_summarisation_structured_inference`: generative or structured inference used to produce summaries, note drafts, coded extraction, or workflow-supporting documentation.
- `endpoint_suggestion_clinically_consequential_decision_support`: suggestions that may influence triage, endpoint, escalation, booking, pharmacy, diagnosis, treatment, or other clinically consequential decisions.

Crossing upward across that boundary requires a visible `ChangeImpactAssessment` delta and stricter approval and regulatory routing.

## Approval Topology

`ReleaseApprovalGraph` enforces no-self-approval.

Minimum law:

- the requester or maker cannot also satisfy independent safety review for the same candidate hash
- deployment approval is independent from implementation ownership
- clinical-safety signoff is required for any DCB0129 delta, DCB0160 dependency note, endpoint suggestion, high-risk routing, or safety-case delta
- information-governance signoff is required for any DPIA delta, telemetry disclosure change, patient-data processing change, or subprocessor change
- security signoff is required for inference host, model provider, runtime publication, keying, network, or supplier drift
- product or clinical owner signoff is required for intended-use or patient/staff-facing wording changes

## Supplier Freshness

`SubprocessorAssuranceRef` is not informational. Promotion is blocked when supplier assurance is stale, suspended, drifted, withdrawn, or not bound to the exact supplied model or service refs used by the candidate.

## Rollback Readiness

`RollbackReadinessBundle` must prove:

- rollback target identity
- data compatibility
- policy compatibility
- runtime publication compatibility
- schema compatibility
- kill-switch plan
- operator runbook
- verification evidence

Rollback may not be represented by a claim that an older model still exists.

## Assurance Freeze

`AssuranceFreezeState` can stop approval, promotion, visible rollout, or active rollout even when a candidate is syntactically valid.

Freeze triggers include:

- stale assurance baseline
- stale or suspended supplier assurance
- incomplete rollback bundle
- invalid approval graph
- publication, runtime, disclosure, or recovery drift
- safety-case blocker
- IM1 RFC, SCAL, DTAC, DCB, DPIA, or MHRA blocker
- incident, threshold breach, or trust degradation

Freeze lift requires explicit criteria and an authoritative settlement record.

## Required Invariants

- `INV405_001`: A candidate hash may not be edited in place after approval work starts.
- `INV405_002`: Approval attaches to the candidate hash and pinned assurance baseline, not loose version labels.
- `INV405_003`: A promotion action is blocked if assurance baseline freshness or supplier assurance is stale, drifted, suspended, or withdrawn.
- `INV405_004`: A change that materially evolves AI use, use case, or function must route through the RFC decision path.
- `INV405_005`: Deployment may not proceed without a ready rollback bundle.
- `INV405_006`: Approval state cannot imply deployment safety if runtime publication, route publication, disclosure baseline, or recovery posture drifted.
- `INV405_007`: Maker, requester, and independent reviewer roles may not be satisfied by the same actor for one candidate hash.
- `INV405_008`: UI acknowledgement or command dispatch is not authoritative release completion without action settlement.

## Downstream Consumers

| Consumer | What it consumes |
| --- | --- |
| `410` | Candidate hash, release state, kill-switch, compiled policy, and invocation eligibility gates. |
| `411` | Release state, recovery disposition, publication truth, freeze state, and trust envelope inputs. |
| `415` | Baseline freshness, supplier drift, safety deltas, and monitoring thresholds. |
| `416` | Assurance freeze state, release disposition, policy freshness, and invalidation rules. |
| `417` | RFC, SCAL, DTAC, DCB, DPIA, medical-device, and safety-case evidence grammar. |
| Phase 8 rollout | Approval graph, rollback bundle, rollout slice compatibility, and promotion/freeze settlement law. |
