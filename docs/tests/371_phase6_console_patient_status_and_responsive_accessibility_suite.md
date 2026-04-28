# 371 Phase 6 Console, Patient Status, Responsive, And Accessibility Suite

Task: `seq_371_phase6_Playwright_or_other_appropriate_tooling_testing_run_pharmacy_console_patient_status_and_responsive_accessibility_suites`

This proof pack is the final user-visible Phase 6 browser battery. It exercises the existing pharmacy console, patient pharmacy status surfaces, mission-stack responsive behavior, keyboard flows, aria snapshots, reduced-motion equivalence, and PHI-safe visual baselines.

## Grounding

- Local truth remains `blueprint/phase-6-the-pharmacy-loop.md`, especially the patient-flow, bounce-back, operations UI, and `6I` exit rules.
- Console layout and same-shell behavior follow `blueprint/pharmacy-console-frontend-architecture.md`.
- Accessibility expectations follow `blueprint/accessibility-and-content-system-contract.md`.
- Upstream validated task outputs consumed here: `356` through `365`, `368`, `369`, and `370`.
- External references are support-only and recorded in `data/analysis/371_external_reference_notes.md`.

## Scenario Families

| Family                                            | Proof Surface                                                    | Representative Cases                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Console and workbench                             | `tests/playwright/371_console_responsive_and_same_shell.spec.ts` | queue-to-workbench continuity, inventory compare, stale handoff, unmatched assurance, provider outage, loop-risk recovery, sticky docks |
| Patient status and return states                  | `tests/playwright/371_patient_status_and_return_states.spec.ts`  | chooser summary, referral confirmation, pending instructions, completed calm outcome, review next steps, contact repair, urgent return  |
| Accessibility and keyboard                        | `tests/playwright/371_accessibility_keyboard_and_aria.spec.ts`   | landmarks, headings, announcement hubs, role status and alert messaging, target size, keyboard chooser and drawer flows, aria snapshots |
| Reflow, reduced motion, visual, and browser smoke | `tests/playwright/371_reflow_reduced_motion_and_visual.spec.ts`  | 320px reflow, reduced motion bridges, six visual baselines, Chromium plus Firefox smoke                                                 |

## Proof Commands

Run these commands from `/Users/test/Code/V`:

```bash
pnpm exec tsx tests/playwright/371_console_responsive_and_same_shell.spec.ts --run
pnpm exec tsx tests/playwright/371_patient_status_and_return_states.spec.ts --run
pnpm exec tsx tests/playwright/371_accessibility_keyboard_and_aria.spec.ts --run
pnpm exec tsx tests/playwright/371_reflow_reduced_motion_and_visual.spec.ts --run
pnpm validate:371-phase6-final-browser-suite
```

## Release Interpretation

This suite may only pass when the browser-visible UI preserves one same-shell pharmacy family across desktop, tablet, and phone widths. Patient pending, review, contact repair, and urgent return states must stay explicit and must not become appointment or calm-completion copy. Visual baselines supplement, but do not replace, keyboard, aria, reflow, and reduced-motion proof.
