# 401 Phase 7 Accessibility, Responsive, and Release Readiness Suite

## Purpose

Task 401 is the final technical hardening proof before the Phase 7 exit gate. It proves that the NHS App channel remains accessible, responsive, privacy-safe, and release-governed under embedded webview constraints, route freezes, limited-release guardrails, monthly pack generation, and rollback rehearsal.

## Source Of Truth

- `blueprint/phase-7-inside-the-nhs-app.md` sections 7G, 7H, and 7I
- `blueprint/accessibility-and-content-system-contract.md`
- `blueprint/platform-runtime-and-release-blueprint.md`
- `blueprint/platform-admin-and-config-blueprint.md`
- Validated task outputs from 394 through 400

External references were used only to shape proof technique and are recorded in `data/analysis/401_external_reference_notes.md`.

## Executable Proofs

| Proof                                     | File                                                                   | Primary risk covered                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Backend release readiness contract        | `tests/integration/401_release_readiness_contract.spec.ts`             | Cohort gating, guardrail freeze triggers, redaction, monthly packs, change notices, rollback release                     |
| Scheduled pack and rollback job           | `tests/scheduled/401_monthly_pack_and_rollback_job.spec.ts`            | Recurring monthly pack safety and rollback rehearsal evidence                                                            |
| Accessibility, keyboard, and ARIA         | `tests/playwright/401_accessibility_keyboard_and_aria.spec.ts`         | Full embedded route matrix landmarks, headings, keyboard traversal, focus visibility, ARIA snapshots                     |
| Responsive, safe area, and reduced motion | `tests/playwright/401_responsive_safe_area_and_reduced_motion.spec.ts` | Phone, compact reflow, tablet, desktop, host resize, sticky action visibility, reduced motion                            |
| Route freeze and guardrails               | `tests/playwright/401_route_freeze_and_guardrail_behaviour.spec.ts`    | Browser-visible freeze inspector plus model-level telemetry, threshold, assurance, compatibility, and continuity freezes |
| Release control surfaces and visual       | `tests/playwright/401_release_control_surfaces_and_visual.spec.ts`     | Ops cockpit keyboard/drawer behavior, visual evidence, responsive release-control surface                                |

## Scenario Coverage

The suite covers:

- one main landmark and stable route-family semantic boundary for every embedded route family
- keyboard-only traversal and focused-element non-obscuration under sticky action bars
- calm, degraded, and frozen ARIA snapshots
- 200 percent and 400 percent reflow equivalents through constrained CSS viewport classes
- reduced-motion equivalence and animation suppression in captured evidence
- safe-area and host-resize instrumentation on embedded patient journeys
- `VisualizationFallbackContract` parity remains in scope for chart, timeline, and summary surfaces where a route exposes visual meaning
- ops-console route-freeze rendering for redirect-to-safe-route posture
- reversible limited-release cohorts and kill switch activation without redeploy
- telemetry-missing, threshold-breach, assurance-slice, compatibility, and continuity freeze triggers
- monthly performance pack generation from validated event contracts
- raw JWT, bearer token, grant identifier, patient identifier, NHS number, and PHI-bearing query string rejection in exported proof artifacts
- change-notice lead-time capture and rollback release after a sustained green window

## Pass Criteria

The suite is green only when:

- every CSV case in `data/test/401_*.csv` is `passed`
- `data/test/401_suite_results.json` reports all proof IDs as `passed`
- `data/test/401_defect_log_and_remediation.json` has no open defects
- the validator `pnpm validate:401-phase7-final-readiness-suite` passes
- all browser specs run with Playwright tracing enabled and produce deterministic evidence under `output/playwright`

## Current Verdict

`passed`
