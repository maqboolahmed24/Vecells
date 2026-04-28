# Phase 1 Integrated Intake E2E Matrix

This matrix defines the minimum proof set for the integrated Phase 1 journey. Browser checks focus on shell continuity and patient-visible morphs. Direct gateway checks cover full start-to-submit flows for all four request types and replay/notification invariants deterministically.

| Scenario | Tooling | Required proof |
| --- | --- | --- |
| Contract bundle load | Gateway fetch | Bundle returns `PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1`, `rf_intake_self_service`, and `patient.portal.requests`. |
| Start draft from shell | Playwright browser | Landing primary action binds an authoritative draft and root `data-phase1-integration="authoritative"`. |
| Symptoms urgent path | Playwright browser plus gateway | Same shell morphs from review to `urgent_outcome` when red-flag symptoms settle. |
| Meds routine receipt | Playwright browser plus gateway | Same shell morphs from review to `receipt_outcome`; receipt panel is shown with queued, not delivered, communication truth. |
| All request types | Gateway API in Playwright and Vitest | `Symptoms`, `Meds`, `Admin`, and `Results` start, submit, and return the same route family and continuity key. |
| Projection refresh | Gateway API | Projection lookup by request public id returns the same receipt consistency envelope. |
| Exact replay | Gateway API | Resubmitting with the same command/idempotency keys returns `replayed=true` and the same request public id. |
| Notification advance | Gateway API | Local acknowledgement, transport acceptance, and delivery evidence are separate ladder states. |
| Minimal tracking | Playwright browser | Receipt action opens `request_status` with current state, next step, compact timeline, and ETA blocks. |
| Responsive shell | Playwright browser | Mobile, tablet, and desktop widths keep the same root shell and avoid horizontal overflow. |
| Keyboard and reduced motion | Playwright browser | Tab focus reaches shell controls; reduced-motion mode keeps equivalent route and outcome semantics. |

## Failure Conditions

- Any request type bypasses `rf_intake_self_service`.
- Any route drops `patient.portal.requests`.
- Submit creates duplicate visible success, duplicate request ids, or duplicate notification envelopes for exact replay.
- Receipt and tracking disagree on request state, promise state, or ETA meaning.
- Queueing or provider acceptance is presented as delivery completion.
- Stale promoted draft entry reopens mutable draft editing.
