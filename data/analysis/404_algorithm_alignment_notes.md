# 404 Algorithm Alignment Notes

Reviewed on 2026-04-27.

## Local Source Alignment

| Source requirement | Frozen artifact |
| --- | --- |
| Phase 8 needs pre-visible evaluation, replay determinism, and shadow proof before rollout. | `data/contracts/404_assistive_evaluation_contracts.json` defines `CaseReplayBundle`, partition manifests, prompt/model/feature pins, shadow completeness, and export posture. |
| Phase 8 8B needs a corpus, label store, replay harness, and shadow dataset without implementing the harness. | The contract freezes `gold`, `shadow_live`, `feedback`, `GroundTruthLabel`, `LabelAdjudicationRecord`, `ErrorTaxonomyRecord`, and `ShadowEvidenceCompletenessRecord`; task `406` remains the implementation owner. |
| Phase 8 8F needs human-in-the-loop feedback and override capture without treating edited output as free training data. | `data/contracts/404_feedback_eligibility_contracts.json` makes `FeedbackEligibilityFlag` settlement-backed, adjudication-aware, revocable, and non-trainable unless `eligible`. |
| Phase 3 human checkpoint law separates machine draft from final human settlement. | Eligibility requires `finalHumanArtifactRef`, `authoritativeWorkflowSettlementRef`, acceptable label quality, and no supersession or incident link. |
| Phase 0 publication, lineage, disclosure, artifact, and recovery law must still govern internal evaluation. | Evaluation surface and shadow evidence objects require `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `telemetryDisclosureFenceRef`, and `releaseRecoveryDispositionRef`. |
| Release and monitoring tasks need an explicit completeness vocabulary. | `data/contracts/404_shadow_mode_evidence_requirements.json` freezes `complete`, `stale`, `missing`, and `blocked`, plus the derivation order and metric families. |
| Later tasks must not invent incompatible names for labels, prompt/model pins, or trainability. | The machine-readable contract family lists object names, required fields, states, dependency rules, invariants, and downstream consumers for `406`, `408`, `409`, `413`, `414`, and `415`. |

## Support Objects Added

The prompt requested conservative gap resolution if feedback routing or adjudication ownership was underspecified. The following support objects are deliberately small and referenced by the machine contracts:

- `DatasetPartitionManifest`: versioned membership and publication hash for `gold`, `shadow_live`, and `feedback`.
- `LabelAdjudicationRecord`: separate final truth record so a raw label never becomes final truth by implication.
- `ShadowEvidenceCompletenessRecord`: derived result consumed by rollout and monitoring.
- `FeedbackEligibilityEvaluation`: repeatable derivation record behind each `FeedbackEligibilityFlag`.
- `AdjudicationRoutingDecision`: deterministic policy object for high-risk, dual-review, incident, label-conflict, and policy-exception routing.
- `FeedbackRevocationRecord`: append-only revocation history that supersedes prior eligibility.
- `TrainabilityExclusionPolicy`: published reason-code table for exclusion, routing, and revocation.

## Boundary Confirmations

- Replay harness implementation remains owned by task `406`.
- Ambient audio and transcript normalization implementation remains owned by task `407`.
- Summary/note drafting implementation remains owned by task `408`.
- Risk extraction, question suggestions, and endpoint recommendations remain owned by task `409`.
- Visible workspace feedback capture implementation remains owned by task `413`.
- Prompt/model logging and trainability storage implementation remains owned by task `414`.
- Drift, fairness, and degraded trust monitoring implementation remains owned by task `415`.

## Gap Status

No blocking interface gap remains for task `404`. The small support objects above are recorded in `data/analysis/404_dependency_and_gap_register.json`, so the requested fallback file `PHASE8_BATCH_404_411_INTERFACE_GAP_EVAL_AND_FEEDBACK_CONTRACTS.json` is not required.
