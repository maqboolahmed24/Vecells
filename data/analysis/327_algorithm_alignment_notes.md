# 327 Algorithm Alignment Notes

`par_327` consumes the validated Phase 5 queue and candidate outputs from `317`, `318`, `319`, `320`, and `326`.

## Region to projection mapping

| UI region | Projection source | Notes |
| --- | --- | --- |
| `HubQueueSavedViewToolbar` | `HubQueueWorkbenchProjection.savedViewRefs[]` | Saved-view changes are legal; browser-local rerank is not. |
| `HubRiskBandStrip` | `HubQueueWorkbenchProjection.riskSummaryRef` | Summarises risk counts for scan speed, not as a second ranking engine. |
| queue rows | `HubQueueWorkbenchProjection.visibleRowRefs[]` | Rows render authoritative order and publish `data-hub-queue-row`. |
| buffered delta notice | `HubQueueWorkbenchProjection.queueChangeBatchRef` | `QueueChangeBatch` buffered and applied states preserve the selected row and selected option. |
| best-fit strip | `HubCaseConsoleProjection.selectedOptionCardRef` | Mirrors the currently selected authoritative option rather than restating raw score. |
| breach-horizon meter | queue rank proof plus timer cues | Shows scan-speed urgency only; does not mint product-truth pseudo-precision. |
| escalation banner lane | `HubEscalationBannerProjection` | Only banner-capable region in the console. |
| option-card groups | `HubOptionCardProjection[]` | Groups by `windowClass` and keeps callback outside ranked cards. |
| `HubDecisionDockHost` | `HubConsoleConsistencyProjection.decisionDockFocusLeaseRef` plus `HubPostureProjection.dominantActionRef` | One dominant action at a time with consequence preview pinned. |

## Local implementation choices

- Queue order is seeded from the authoritative saved-view order and can change only by the explicit buffered/apply path.
- Selected option state is stored in shell state so the `DecisionDock` and best-fit strip stay in parity.
- Recovery-only cases publish callback or supplier-drift truth through banner or callback cards, not decorative queue chrome.
- `326` route-family continuity remains authoritative. `327` mounts richer workbench content into the same shell root.
