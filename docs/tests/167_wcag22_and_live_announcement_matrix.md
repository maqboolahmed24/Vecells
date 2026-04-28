# 167 WCAG 2.2 And Live Announcement Matrix

The machine-readable assertion source is `data/test/167_accessibility_assertion_matrix.csv`.

## Required Assertion Families

| Family           | Purpose                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `landmarks`      | Preserve header, main, and complementary structure across Phase 1 routes.                                                     |
| `keyboard_flow`  | Prove keyboard-only movement through request choice, details, upload, contact, review, urgent/receipt, and tracking surfaces. |
| `forms`          | Preserve labels, masked contact summaries, and redundant-entry discipline.                                                    |
| `live_region`    | Announce save, recovery, receipt, urgent, and tracking state once at the correct settlement level.                            |
| `focus_safety`   | Prevent sticky footer and action tray overlap with focused controls.                                                          |
| `motion`         | Prove reduced-motion semantic equivalence.                                                                                    |
| `diagram_parity` | Keep atlas diagrams backed by tables/lists.                                                                                   |
| `target_safety`  | Keep interactive controls at a safe target size for the flow.                                                                 |

## Live-Region Discipline

The suite treats duplicate live announcements as a correctness failure. Save status, recovery status, receipt truth, urgent guidance, and tracking state may each have an owner, but the same truth cannot be repeated through stacked banners, duplicate toasts, or simultaneous live text.

## Axe And ARIA

Axe-core is used for broad automated checks. Playwright ARIA snapshots are used only for stable structural expectations; user-visible behavior remains the primary proof.
