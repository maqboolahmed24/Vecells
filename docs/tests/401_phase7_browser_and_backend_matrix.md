# 401 Browser And Backend Matrix

## Browser Matrix

| Suite                                     | Browser mode                                | Viewports                                     | Evidence                                                                                   |
| ----------------------------------------- | ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Accessibility, keyboard, and ARIA         | Chromium, NHS App-like mobile context       | 390x844                                       | `401-*-aria.yml`, `401-accessibility-keyboard-aria-trace.zip`                              |
| Responsive, safe area, and reduced motion | Chromium with reduced motion                | 320x720, 390x844, 640x900, 768x1024, 1280x900 | `401-responsive-safe-area-reduced-motion-trace.zip`                                        |
| Route freeze and guardrails               | Chromium ops-console route-freeze inspector | 1440x980                                      | `401-route-freeze-guardrail-summary.json`, trace                                           |
| Release control surfaces and visual       | Chromium ops-console readiness cockpit      | 1440x980, 390x900                             | `401-release-control-surface-desktop.png`, `401-release-control-surface-mobile.png`, trace |

## Backend And Scheduled Matrix

| Suite                                                       | Runtime surface                                                                                    | Evidence                                                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `tests/integration/401_release_readiness_contract.spec.ts`  | Release-control service, manifest validation, telemetry redaction, change notice, rollback release | Console pass/fail plus validator source checks                                                    |
| `tests/scheduled/401_monthly_pack_and_rollback_job.spec.ts` | Monthly pack and rollback scheduled-job harness                                                    | `output/scheduled/401_monthly_pack_and_rollback_job.json`                                         |
| `tools/test/validate_401_phase7_final_readiness_suite.ts`   | Repository-owned proof validator                                                                   | Validates files, scripts, CSVs, machine results, source hooks, and release-control model behavior |

## Device Classes

| Class                         | Width | Reason                                         |
| ----------------------------- | ----: | ---------------------------------------------- |
| 400 percent reflow equivalent |   320 | WCAG reflow pressure for narrow CSS width      |
| NHS App phone                 |   390 | iOS webview-like safe area and touch behavior  |
| 200 percent reflow equivalent |   640 | Large text and constrained layout              |
| Tablet                        |   768 | Split layout and resize resilience             |
| Desktop control surface       | 1280+ | Ops/release cockpit and route-freeze inspector |

## Guardrail Trigger Coverage

| Trigger                        | Proof                                                      |
| ------------------------------ | ---------------------------------------------------------- |
| `telemetry_missing`            | Backend contract and route-freeze Playwright JSON evidence |
| `threshold_breach`             | Backend contract and route-freeze Playwright JSON evidence |
| `assurance_slice_degraded`     | Backend contract and route-freeze Playwright JSON evidence |
| `compatibility_drift`          | Backend contract and route-freeze Playwright JSON evidence |
| `continuity_evidence_degraded` | Backend contract and route-freeze Playwright JSON evidence |
