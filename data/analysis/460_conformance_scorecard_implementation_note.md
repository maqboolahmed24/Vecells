# Phase 9 Conformance Scorecard Implementation Note

Task 460 adds `/ops/conformance` as the service-owner proof surface for CrossPhaseConformanceScorecard and PhaseConformanceRow state.

The projection is a bounded read-only adapter over task 449 canonical conformance rows and scorecards. The route rejects summary-only optimism, keeps Phase 7 deferred-channel rows explicit, disables BAU signoff whenever row, runtime, governance, operations, recovery, or permission proof is not exact, and carries same-shell handoff return tokens without raw artifact URLs.
