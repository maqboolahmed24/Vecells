# 334 Accessibility Notes

## Family-wide grammar

- Patient confirmation, patient manage, hub commit, continuity preview, and recovery surfaces now share one cross-org artifact grammar instead of route-local variants.
- Artifact frames, banners, placeholders, legends, and return receipts all expose stable visible headings so accessible names do not drift with visual styling.

## Focus and return anchors

- `patient-confirmation-summary`, `network-manage-summary-card`, and `HubCommitSettlementReceipt` are focusable return anchors.
- `ReturnAnchorReceipt` moves focus back to the current summary or receipt anchor instead of ejecting the user to the route top.
- Recovery surfaces keep placeholder and legend content in the dominant flow so users do not need a hidden secondary region to understand bounded detail.

## Status semantics

- Existing polite live regions remain the authority for same-shell settlement announcements.
- Artifact action feedback is phrased as bounded status updates, not toast-only confirmations.
- Timeline annotation panels expose compact state language before users enter dense evidence rows.

## Reflow and zoom

- Artifact surfaces reflow to one column at mobile widths and must remain readable at the 320px proxy without horizontal scrolling.
- Placeholder blocks and action bars keep the same frame width as normal artifact content so reduced-detail states do not look structurally broken.
- Focused controls must remain visible above sticky trays and folded rails.

## Motion and restraint

- `prefers-reduced-motion: reduce` collapses artifact action and return transitions.
- The artifact family avoids decorative motion and keeps state change legible through copy and structure first.

## Verification focus

- focus return to the active summary or receipt anchor
- status-region restraint
- 320px reflow without horizontal clipping
- reduced-motion parity on artifact actions and return controls
- continuity between drawers, placeholders, legends, and evidence timelines
