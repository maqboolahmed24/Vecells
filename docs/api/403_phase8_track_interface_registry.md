# 403 Phase 8 Track Interface Registry

Gate verdict: `open_phase8_now`.

## Registry Contract

The canonical registry is `data/contracts/403_phase8_track_readiness_registry.json`.

Every `tracks[]` row must include:

- `trackId`
- `readinessState`
- `ownerLane`
- `blockingRefs[]`
- `upstreamContractRefs[]`
- `launchPacketRef`
- `futurePhaseDependencyRefs[]`

`readinessState` is one of `ready`, `blocked`, or `deferred`.

## Launch Packets

Ready tracks `404` through `409` have launch packets:

| Track | Packet |
| --- | --- |
| `par_404` | `data/launchpacks/403_track_launch_packet_404.json` |
| `par_405` | `data/launchpacks/403_track_launch_packet_405.json` |
| `par_406` | `data/launchpacks/403_track_launch_packet_406.json` |
| `par_407` | `data/launchpacks/403_track_launch_packet_407.json` |
| `par_408` | `data/launchpacks/403_track_launch_packet_408.json` |
| `par_409` | `data/launchpacks/403_track_launch_packet_409.json` |

Launch packets must define the owner lane, source gate, upstream refs, owned interfaces, expected deliverables, guardrails, non-goals, acceptance evidence, and future reserve refs.

## API Boundary By Track

### `par_404`

Owns the contract vocabulary for `CaseReplayBundle`, `GroundTruthLabel`, `ErrorTaxonomyRecord`, `PromptTemplateVersion`, `ModelRegistryEntry`, `FeatureSnapshot`, `AssistiveEvaluationSurfaceBinding`, `EvaluationExportArtifact`, and `FeedbackEligibilityFlag`.

### `par_405`

Owns release and regulatory control vocabulary for `ModelChangeRequest`, `RFCBundle`, `MedicalDeviceAssessmentRef`, `SafetyCaseDelta`, `SubprocessorAssuranceRef`, `AssistiveReleaseCandidate`, `ChangeImpactAssessment`, `ReleaseApprovalGraph`, `AssuranceBaselineSnapshot`, `RollbackReadinessBundle`, `AssuranceFreezeState`, and release action settlement.

### `par_406`

Owns the executable evaluation-plane service boundary. It may read frozen workflow evidence and write evaluation records, but it may not mutate live workflow state.

### `par_407`

Owns transcript, redaction, retention, and presentation artifacts. It must bind permission state, capture mode, artifact lineage, and retention policy before downstream draft generation.

### `par_408`

Owns documentation context snapshots, sectioned draft artifacts, evidence maps, contradiction checks, abstention behavior, and calibration-bundle resolution.

### `par_409`

Owns review-only suggestion envelopes, rule guards, risk signals, question recommendations, endpoint hypotheses, conformal prediction sets, abstention records, and suggestion action records.

## Blocked Later Interfaces

`410` may not mint invocation grants until the 404-409 object families exist. `411` may not publish trust envelopes until `410` exists. UI tracks `418` through `421` may not show visible assistive controls until the backend envelope, lease, final-human feedback, and provenance interfaces are authoritative.

## Error And Gap Semantics

Blocking refs beginning with `GAP403_` are hard blockers. Refs beginning with `WAIT403_` are deliberate deferrals that do not block the first 404-409 wave but do block later visible rollout, monitoring, or Phase 9 evidence.
