# 424 Same-Shell Assistive Stage Accessibility Notes

The stage is intentionally not a modal. It never makes the task canvas inert and never hides `DecisionDock`.

Checks covered by implementation and Playwright:

- Summary stub is a labelled region with one native promote button.
- Promoted, pinned, downgraded, and folded variants are labelled complementary regions.
- Promote/collapse uses `aria-expanded` and `aria-controls`.
- Pin uses `aria-pressed`; trust-downgraded posture disables the control.
- Folded state uses `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"`.
- `AssistiveAttentionBudgetCoordinator` announces posture changes politely as a status region.
- Keyboard flow reaches task canvas, DecisionDock, and assistive stage controls without focus traps.
- Escape collapses promoted stage state to the summary stub and returns focus to the collapse control.
- Reduced motion removes promotion, collapse, and pin transitions.

The design follows WAI-ARIA APG complementary landmark, disclosure, tabs, and modal-dialog guidance. Dialog guidance is used as a negative constraint: the stage is a support region, not an inerting overlay.
