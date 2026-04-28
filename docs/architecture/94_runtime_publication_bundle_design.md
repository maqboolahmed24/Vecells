# 94 Runtime Publication Bundle Design

        `par_094` turns runtime publication into an authoritative machine-readable tuple instead of a deploy checklist.

        ## Runtime law

        - `RuntimePublicationBundle` is the canonical release-scoped runtime tuple for topology, gateway surfaces, frontend manifests, design bundles, projection digests, live channels, cache policy, recovery posture, continuity evidence, and build provenance.
        - `ReleasePublicationParityRecord` is the machine-readable parity witness for route, surface, and artifact exactness.
        - Preview and non-production still fail closed. The same bundle and parity system blocks stale, conflicting, quarantined, blocked, or withdrawn tuples there as well.

        ## Current catalog

        - Release candidates: `5`
        - Runtime publication bundles: `5`
        - Release parity records: `5`
        - Surface authority rows: `45`
        - Published bundles: `1`
        - Stale bundles: `2`
        - Conflict bundles: `1`
        - Withdrawn bundles: `1`

        ## Refusal posture

        - Publication blocks on missing provenance, quarantined provenance, blocked consumption, revoked tuples, or tuple drift.
        - Route exposure is `constrained` even when parity is exact if browser posture, accessibility coverage, or design lint ceilings remain.
        - The console and CLI publish refusal reasons per release and per audience surface so drift is not trapped in dashboard-only views.

        ## Follow-on dependencies

        - `FOLLOW_ON_DEPENDENCY_094_WAVE_OBSERVATION_POLICY`: par_094 publishes machine-readable bundle and parity refusal states now, but later wave dwell and widening policy still owns tenant-by-tenant release observation.
- `FOLLOW_ON_DEPENDENCY_094_CANARY_WIDENING_GUARDS`: The bundle console exposes publishable versus frozen posture, but it does not widen traffic or waive release-trust evidence on its own.
- `FOLLOW_ON_DEPENDENCY_094_PRODUCTION_ARTIFACT_REGISTRY`: Local, preview, and non-production use the same tuple law now. A later production registry may strengthen storage and promotion controls without changing the authoritative bundle shape.
