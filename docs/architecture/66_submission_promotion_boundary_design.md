
        # 66 Submission Promotion Boundary Design

        `par_066` turns submit promotion into one explicit, immutable, replay-safe backend boundary. The authoritative bridge is `SubmissionPromotionRecord`; every later continuity lookup resolves from the persisted record rather than from mutable draft state, controller cache, or session callback side effects.

        ## Boundary Summary

        - Promotion boundary rows: 6
        - Committed promotion rows: 5
        - Blocked anomaly rows: 1
        - Replay scenarios: 5
        - Lookup indices: envelope, source lineage, request lineage, receipt consistency, status consistency

        ## Exact-Once Homes

        - `packages/domains/identity_access/src/submission-lineage-backbone.ts`
        - `packages/event-contracts/src/submission-lineage-events.ts`
        - `services/command-api/src/submission-backbone.ts`
        - `services/command-api/src/submission-promotion-simulator.ts`
        - `services/command-api/migrations/066_submission_promotion_exactly_once.sql`

        ## Storage and Replay Law

        - `withPromotionBoundary(...)` serializes promotion writes so duplicate submit and cross-tab races re-enter a single compare-and-set window.
        - `saveSubmissionPromotionRecord(...)` now enforces secondary uniqueness by `submissionEnvelopeRef`, `sourceLineageRef`, `requestLineageRef`, `receiptConsistencyKey`, and `statusConsistencyKey`.
        - `applyDraftMutabilitySupersession(...)` closes every seeded live draft grant and draft lease in the same promotion window before handoff to the request shell.
        - `resolveAuthoritativeRequestShell(...)` returns continuity truth from immutable promotion keys instead of reopening the draft lane.

        ## Event and Gap Notes

        - Promotion emits `intake.promotion.started`, `intake.promotion.committed`, `intake.promotion.settled`, `intake.promotion.replay_returned`, and `intake.promotion.superseded_grants_applied`.
        - The event helper seam is live in the shared package now; the registry-side publication gap remains explicit as `PARALLEL_INTERFACE_GAP_066_PROMOTION_EVENT_REGISTRY_ROWS`.

        ## Implementation Files

        - `packages/event-contracts/src/submission-lineage-events.ts`
- `packages/event-contracts/tests/submission-lineage-events.test.ts`
- `packages/domains/identity_access/src/submission-lineage-backbone.ts`
- `packages/domains/identity_access/tests/submission-lineage-backbone.test.ts`
- `services/command-api/src/submission-backbone.ts`
- `services/command-api/src/submission-promotion-simulator.ts`
- `services/command-api/tests/submission-backbone.integration.test.js`
- `services/command-api/migrations/066_submission_promotion_exactly_once.sql`
- `tools/analysis/build_submission_promotion_mapping.py`
- `tools/analysis/validate_submission_promotion_mapping.py`
- `tests/playwright/submission-promotion-atlas.spec.js`
