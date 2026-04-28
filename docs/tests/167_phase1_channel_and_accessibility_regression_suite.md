# 167 Phase 1 Channel And Accessibility Regression Suite

This proof pack is the browser-and-a11y gate for the Phase 1 patient experience. It binds the real simulator-backed patient shell to a machine-readable route matrix, WCAG/live-announcement matrix, ARIA snapshot manifest, and the `Phase1_Regression_Atlas` browser evidence surface.

## Scope

- All Phase 1 request types are covered: `Symptoms`, `Meds`, `Admin`, and `Results`.
- The proof includes signed-out start, urgent diversion, routine receipt, minimal tracking, bounded refresh/resume, stale promoted draft recovery, and post-uplift read-only return.
- The viewport matrix is mobile `390x844`, tablet `834x1194`, and desktop `1440x900`.
- The browser proof uses real Playwright navigation, real DOM roles, real keyboard focus, real live regions, real sticky tray geometry, axe-core scans, and Playwright ARIA snapshots.

## Mandatory Gap Closures

| Gap                                                                              | Closure                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 works functionally but still breaks for keyboard or assistive-tech users | `data/test/167_accessibility_assertion_matrix.csv` defines landmarks, keyboard, labels, target-size, focus, and live-region assertions. The Playwright spec exercises those on the patient app and atlas. |
| Animations can hide or reorder meaning                                           | Reduced-motion checks compare route key, selected anchor, and status owner against no-preference rendering.                                                                                               |
| Design boards can keep meaning in visuals only                                   | Every atlas diagram has an adjacent parity table, and the validator fails when the expected table markers disappear.                                                                                      |
| Responsive shell can obscure focused controls                                    | The Playwright suite measures focused element and sticky action tray rectangles on mobile.                                                                                                                |
| Accessibility scans alone are enough                                             | Axe-core runs as a broad scan, but the gate also asserts user-visible headings, roles, labels, focus behavior, live-region dedupe, and ARIA snapshots.                                                    |

## Evidence Chain

1. `data/test/167_channel_route_matrix.csv` owns route family, posture, viewport, status owner, selected anchor, and dominant action expectations.
2. `data/test/167_accessibility_assertion_matrix.csv` owns WCAG 2.2 references, live-region ownership, reduced-motion equivalence, target-size, and sticky-overlap expectations.
3. `data/test/167_aria_snapshot_manifest.yaml` owns stable ARIA snapshot coverage references.
4. `docs/tests/167_phase1_regression_atlas.html` renders a quiet product-native atlas from the same machine-readable rows.
5. `tests/playwright/167_phase1_channel_and_accessibility.spec.js` runs the atlas proof and the real patient app proof.

## Result

The suite proves the Phase 1 browser experience end to end: same-shell continuity holds, selected anchors survive state changes, patient-safe status ownership stays singular, live announcements do not duplicate provisional and authoritative truths, and sticky controls do not hide focused targets.
