# 15 Release And Supply Chain Tooling Baseline

        The release baseline is an immutable stage-settlement ledger with mandatory provenance, SBOM, signing, runtime publication, parity publication, and watch-tuple publication. This closes the hidden CI-only state gap directly.

        ## Pipeline Stage Chain

        | Stage | Families | Produced objects | State rule |
| --- | --- | --- | --- |
| dependency_resolve | FAM_SECURITY_POLICY_GATE; FAM_RELEASE_TUPLE_ORCHESTRATION | StandardsDependencyWatchlist; PipelineStageSettlement | no dependency resolution result is authoritative until stage settlement is recorded |
| static_gate | FAM_SECURITY_POLICY_GATE; FAM_RELEASE_TUPLE_ORCHESTRATION | VerificationScenario; ReleaseContractVerificationMatrix; PipelineStageSettlement | all Gate 0 evidence binds to the same verification scenario and contract matrix |
| sbom_sign | FAM_PROVENANCE_SIGNING_SBOM; FAM_RELEASE_TUPLE_ORCHESTRATION | BuildProvenanceRecord; ReleaseCandidate; PipelineStageSettlement | signing, provenance, and SBOM are mandatory and candidate-bound |
| runtime_publish | FAM_RELEASE_TUPLE_ORCHESTRATION; FAM_ALERTING_EVIDENCE_BOARDS | RuntimePublicationBundle; ReleasePublicationParityRecord; PipelineStageSettlement | runtime publication becomes live only when parity remains exact and provenance is publishable |
| preview_validate | FAM_SYNTHETIC_CANARY_PROOF; FAM_SIGNAL_PIPELINE | WritableRouteContractCoverageRecord; EmbeddedSurfaceContractCoverageRecord; PipelineStageSettlement | preview validation proves route and embedded coverage, not just endpoint reachability |
| integration_validate | FAM_SYNTHETIC_CANARY_PROOF; FAM_SIGNAL_PIPELINE | ContinuityContractCoverageRecord; PipelineStageSettlement | browser, callback, and recovery tests stay bound to the candidate tuple |
| preprod_validate | FAM_SECURITY_POLICY_GATE; FAM_RESILIENCE_RECOVERY_EVIDENCE | OperationalReadinessSnapshot; RunbookBindingRecord; RecoveryControlPosture; PipelineStageSettlement | security, readiness, and rehearsal freshness are evaluated before canary |
| canary_promote | FAM_RELEASE_TUPLE_ORCHESTRATION; FAM_SYNTHETIC_CANARY_PROOF | ReleaseWatchTuple; WaveGuardrailSnapshot; PipelineStageSettlement | canary start publishes the exact watch tuple and guardrail snapshot for the promoted slice |
| wave_control | FAM_RELEASE_TUPLE_ORCHESTRATION; FAM_ALERTING_EVIDENCE_BOARDS; FAM_RESILIENCE_RECOVERY_EVIDENCE | WaveVerificationRecord; ReleaseWatchEvidenceCockpit; PipelineStageSettlement | widen, pause, rollback, kill-switch, and rollforward must settle against the current tuple and cockpit hash |
| history_append | FAM_RELEASE_TUPLE_ORCHESTRATION; FAM_INCIDENT_CAPA_WORKFLOW | PipelineStageSettlement; immutable release history append | post-deploy history append preserves operator attribution, evidence links, and exception lineage |

        ## Required Object Bindings

        | Object | Produced by | Consumed by | Rule |
| --- | --- | --- | --- |
| BuildProvenanceRecord | FAM_PROVENANCE_SIGNING_SBOM | FAM_RELEASE_TUPLE_ORCHESTRATION; FAM_ALERTING_EVIDENCE_BOARDS | runtime consumption must be publishable before any live authority is advertised |
| RuntimePublicationBundle | FAM_RELEASE_TUPLE_ORCHESTRATION | FAM_SIGNAL_PIPELINE; FAM_ALERTING_EVIDENCE_BOARDS; FAM_RESILIENCE_RECOVERY_EVIDENCE | all route, design, and recovery consumers read the same published bundle |
| ReleasePublicationParityRecord | FAM_RELEASE_TUPLE_ORCHESTRATION | FAM_ALERTING_EVIDENCE_BOARDS; FAM_RESILIENCE_RECOVERY_EVIDENCE; FAM_SYNTHETIC_CANARY_PROOF | parity drift degrades boards, recovery posture, and wave proof immediately |
| VerificationScenario | FAM_RELEASE_TUPLE_ORCHESTRATION | FAM_SECURITY_POLICY_GATE; FAM_SYNTHETIC_CANARY_PROOF; FAM_PROVENANCE_SIGNING_SBOM | every gate restarts if the pinned scenario drifts |
| ReleaseContractVerificationMatrix | FAM_RELEASE_TUPLE_ORCHESTRATION | FAM_SECURITY_POLICY_GATE; FAM_SYNTHETIC_CANARY_PROOF; FAM_ALERTING_EVIDENCE_BOARDS | route, continuity, embedded, design, and recovery proof remain one tuple |
| ReleaseWatchTuple | FAM_RELEASE_TUPLE_ORCHESTRATION | FAM_ALERTING_EVIDENCE_BOARDS; FAM_SYNTHETIC_CANARY_PROOF; FAM_RESILIENCE_RECOVERY_EVIDENCE | governance and operations must consume the same active watch tuple |
| OperationalReadinessSnapshot | FAM_RESILIENCE_RECOVERY_EVIDENCE | FAM_ALERTING_EVIDENCE_BOARDS; FAM_RELEASE_TUPLE_ORCHESTRATION | stale readiness or stale rehearsal evidence blocks canary, widen, resume, and recovery activation |
| EssentialFunctionHealthEnvelope | FAM_ALERTING_EVIDENCE_BOARDS | FAM_RESILIENCE_RECOVERY_EVIDENCE; FAM_SYNTHETIC_CANARY_PROOF | essential-function health is the only operator-facing join of trust, fallback, release, and resilience posture |

        ## Supply Chain Law

        - `BuildProvenanceRecord`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `VerificationScenario`, `ReleaseContractVerificationMatrix`, and `ReleaseWatchTuple` are all mandatory machine-readable release objects.
        - Stage settlement, not job completion, is the authoritative delivery state.
        - Emergency movement requires one bounded `PipelineEmergencyException` with expiry, compensating controls, and declared recovery scope.
        - Design-contract publication remains inside the promoted runtime tuple and cannot drift into snapshot-only evidence.
