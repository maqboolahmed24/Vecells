# 361 Outcome Assurance Accessibility Notes

- Keep the pharmacy shell landmarks unchanged: one `banner`, one `main`, one route-local child state inside the shell.
- `PharmacyOutcomeAssurancePanel` uses one polite status header so match and close-block posture can update without stealing focus.
- `OutcomeManualReviewBanner` uses:
  - `role="alert"` for ambiguous or unmatched review where immediate attention is required
  - `role="status"` for in-progress manual review debt where the case remains active but not emergency-urgent
- `OutcomeEvidenceDrawer` follows the disclosure pattern with a button, `aria-expanded`, and `aria-controls`.
- The drawer remains in DOM order after the rail heading so keyboard users reach it without a hidden jump.
- `OutcomeDecisionDock` stays in the shell decision column rather than a detached modal, so focus order remains continuous across queue, board, support region, and action locus.
- Reduced-motion parity is required for the drawer toggle and dock action affordances.
- The 390px reduced-motion proof must avoid horizontal overflow and keep the drawer toggle, banner, and dock buttons reachable.
