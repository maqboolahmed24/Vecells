# 15 Verification Ladder And Quality Gate Strategy

        Vecells keeps the runtime blueprint's Gate 0-5 ladder intact. Every gate binds to one exact `VerificationScenario` and one exact `ReleaseContractVerificationMatrix`; any tuple drift restarts the ladder.

        ## Gate Matrix

        | Gate | Ring | Exact scenario | Exact matrix | Objects | Continuity rule | Blocking condition |
| --- | --- | --- | --- | --- | --- | --- |
| Gate 0 - static and unit | local; ci-preview | exact_required | exact_required | VerificationScenario; ReleaseContractVerificationMatrix; StandardsDependencyWatchlist; DesignContractPublicationBundle; DesignContractLintVerdict | affected continuity controls must already be pinned into the candidate tuple | any tuple drift, missing design contract bundle, missing watchlist evidence, or unsigned artifact blocks the ladder |
| Gate 1 - contract and component | ci-preview; integration | exact_required | exact_required | RuntimePublicationBundle; ReleasePublicationParityRecord; WritableRouteContractCoverageRecord; EmbeddedSurfaceContractCoverageRecord; ContinuityContractCoverageRecord | all affected continuity families require exact coverage, including newer families from findings 104-111 | route, continuity, or embedded coverage may not be stale or inferred from adjacent contracts |
| Gate 2 - integration and end-to-end | integration | exact_required | exact_required | VerificationScenario; ReleaseContractVerificationMatrix; RouteIntentBinding; CommandSettlementRecord; ReleaseRecoveryDisposition | same-shell recovery and route-intent law must be proven end to end | generic browser success is insufficient if recovery disposition or settlement proof drifts |
| Gate 3 - performance and security | preprod | exact_required | exact_required | StandardsDependencyWatchlist; BuildProvenanceRecord; PipelineStageSettlement | disclosure-safe telemetry and route continuity remain in force during security tests | unreviewed security findings, missing provenance, or unsafe telemetry schemas block promotion |
| Gate 4 - resilience and recovery | preprod | exact_required | exact_required | OperationalReadinessSnapshot; RunbookBindingRecord; SyntheticRecoveryCoverageRecord; RecoveryControlPosture; MigrationVerificationRecord | constrained and frozen journeys must be proven on the same tuple as ordinary-live posture | stale rehearsal evidence or tuple drift downgrades readiness and blocks canary |
| Gate 5 - live wave proof | production | exact_required | exact_required | ReleaseWatchTuple; ReleaseWatchEvidenceCockpit; WaveGuardrailSnapshot; WaveVerificationRecord; OperationalReadinessSnapshot; ReleasePublicationParityRecord | watch, governance, operations, and recovery surfaces all read the same continuity and release proof | parity drift, watch tuple drift, stale readiness, unresolved continuity proof, or missing provenance blocks widen or resume |

        ## Gate Law

        - Gate 0 proves compile, watchlist, design-contract, and provenance inputs for the exact candidate tuple.
        - Gate 1 proves route, embedded, continuity, design, and runtime-publication parity for the same tuple.
        - Gate 2 proves browser, callback, replay, and recovery posture on the exact tuple.
        - Gate 3 proves performance, scanner coverage, secret handling, session hardening, and dependency hygiene.
        - Gate 4 proves restore, failover, chaos, and rehearsal freshness on the same tuple the release will widen.
        - Gate 5 proves the live watch tuple, cockpit, guardrail, parity, provenance, readiness, and rollback posture for the active production wave.
