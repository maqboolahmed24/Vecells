# 482 Algorithm Alignment Notes

Task 482 implements a fail-closed Wave 1 promotion bridge over the source promotion algorithm. The command cannot settle from dashboard labels or feature flags; it resolves typed evidence from tasks 473 through 481 into one `PromotionAuthorityTuple`, then binds that tuple to a `Wave1PromotionCommand`, `WaveActionRecord`, `WaveActionSettlement`, post-promotion parity proof, WORM audit refs, and operator communication evidence.

## Source Mapping

- Platform promotion contracts map to `PromotionAuthorityTuple`, `Wave1PromotionPreflight`, `Wave1PromotionCommand`, `PublicationParityAfterPromotion`, and `Wave1ActivationEvidence`.
- Wave control contracts map to `WaveActionRecord`, `WaveActionSettlement`, and `PromotionIdempotencyBinding`.
- Phase 0 command settlement and WORM rules map to injected clock, role authorization, purpose binding, idempotency key, route intent, settlement refs, and WORM audit refs.
- Phase 9 formal exit and live-wave proof map to the nine preflight lanes and operator communication evidence.

## Verdict

Wave 1 is promoted to active-under-observation only for the approved smallest-safe core web/staff/ops cohort. NHS App, pharmacy dispatch, and assistive visible modes remain outside Wave 1. Stability and widening are intentionally left to task 483.
