# 429 Phase 8 Invocation Regression Alignment Notes

This suite treats `blueprint/phase-8-the-assistive-layer.md` as the source algorithm. The regression harness is intentionally deterministic and synthetic-only: no live model calls, no live patient data, and no authoritative workflow writes.

## Algorithm Blocks Bound

- Invocation gates: role, route family, rollout slice, trust state, runtime publication, disclosure fence, and audience surface must all permit invocation.
- Kill switches: global model/vendor, tenant, route-family, cohort/slice, workspace-session stale freeze, artifact quarantine, and runtime-publication rollback all remove invocation and insertion authority.
- Draft insertion: the only permitted insertion state is visible, reversible, marked as suggested, source-inspectable, and tied to human `UIEventEnvelope`, `CommandActionRecord`, and `CommandSettlementRecord` proof.
- Surface visibility: patient-facing raw assistive content is denied unless transformed by a human-settled command; support replay is capped by partial disclosure; artifact preview/download is governed by `ArtifactPresentationContract`.
- No autonomous writes: patient-send, booking-commit, pharmacy-outcome, task-close, and authoritative save endpoints are prohibited in fixture state and browser network assertions.

## Evidence Produced

- Machine-readable fixture corpus: `data/fixtures/429_phase8_invocation_regression_fixtures.json`
- Threshold configuration: `data/config/429_phase8_invocation_thresholds.json`
- Exit-gate contract: `data/contracts/429_phase8_invocation_regression_contract.json`
- Generated report, summary, failed-fixture list, and threshold CSV under `data/analysis/`
- Browser evidence harness: `docs/frontend/429_phase8_invocation_regression_harness.html`
- Unit, integration, and Playwright specs covering API-level and browser-level behavior

## Gap Assessment

No interface gap artifact was created. Existing Phase 8 domain packages already expose the conceptual control-plane, trust, work-protection, and feedback-chain primitives needed to model invocation and insertion boundaries. Task 429 adds a dedicated regression evaluator and evidence harness instead of widening production invocation APIs.
