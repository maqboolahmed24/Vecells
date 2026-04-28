# Phase 9 Load, Soak, Breach, And Queue Heatmap Test Plan

Task `par_465` uses a deterministic TypeScript harness plus Playwright browser checks to exercise Phase 9 pressure paths without requiring unavailable production-scale traffic infrastructure.

## Scope

- Patient and staff pressure paths: intake, safety gate, triage review, booking waitlists, hub coordination, pharmacy bounce-back, communications retries, and assistive downgrade.
- Projection truth: lag, stale, degraded, and quarantined posture.
- Breach truth: support conditions, elevated/critical thresholds, exit hysteresis, and redacted alert destinations from task `461`.
- Queue heatmap truth: exact visual/table parity across pathway, site, cohort, age band, breach-risk band, and route family.
- Operations UI truth: fail-closed posture during stale, degraded, blocked, and projection-quarantined states.

## Local Commands

```bash
pnpm exec tsx ./tests/performance/465_phase9_load_soak_scenarios.ts --write
pnpm exec vitest run tests/integration/465_breach_risk_engine_contract.test.ts tests/integration/465_queue_heatmap_projection_contract.test.ts
pnpm exec tsx tests/playwright/465_ops_queue_heatmap_under_load.spec.ts --run
pnpm exec tsx tests/playwright/465_breach_detection_ui_states.spec.ts --run
pnpm run validate:465-phase9-load-soak-breach-queue-heatmap
```

The package script `test:phase9:load-soak-breach-queue-heatmap` runs the same suite end to end.

## Evidence

- `tests/performance/465_breach_detection_expected_outcomes.json`
- `tests/performance/465_queue_heatmap_expected_outcomes.json`
- `data/evidence/465_load_soak_breach_queue_heatmap_results.json`
- `.artifacts/load-soak-breach-heatmap-465/` for screenshots, ARIA snapshots, and traces

## Pass Criteria

- All required scenario ids are present and deterministic.
- Elevated and critical breach states appear only with support conditions and threshold crossings.
- Critical and elevated exits require the configured consecutive evaluations.
- Alert payloads contain synthetic summaries only and no URLs, secrets, PHI, or raw webhook material.
- Heatmap visual values equal fallback table values for every cell.
- Replay ordering and heatmap hash remain stable.
- The operations console never shows executable live controls for stale, degraded, blocked, or quarantined slices.
- No Sev-1 or Sev-2 load-path defects remain.
