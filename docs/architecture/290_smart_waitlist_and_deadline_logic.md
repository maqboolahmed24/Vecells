# 290 Smart Waitlist and Deadline Logic

`WaitlistEntry` is the canonical local Smart Waitlist object. It binds one governed `BookingCase` to a durable preference envelope, immutable `joinedAt`, indexed eligibility keys, explicit deadline truth, live fallback debt, and one current active-offer pointer.

`WaitlistContinuationTruthProjection` is the only patient/staff surface read model for local waitlist posture. Later UI work should read this projection and the linked `WaitlistFallbackObligation` rather than recomputing deadline math or inferring posture from message logs.

`phase4_waitlist_entry_eligibility_keys` materializes modality, site, local day, and continuity lookup keys. The in-memory matcher mirrors the same four axes so replayable local tests and durable SQL shape agree on how candidate narrowing works before scoring.

`WaitlistDeadlineEvaluation` makes the Phase 4 timing model explicit: deadline class, offerability, laxity, deadline pressure, wait minutes, age lift, fairness debt, and cooldown are persisted instead of hidden inside transient rank code. `WaitlistFallbackObligation` stays armed until authoritative booking truth or durable callback/hub transfer settles it.

`WaitlistAllocationBatch` stores batching horizon, stable pair order, and assignment tuple hash for replay. `WaitlistOffer` always carries `ReservationAuthority` refs and the score vector that justified issuance, so one released capacity unit can be audited back to the exact local waitlist decision that consumed it.

Accepted waitlist offers call the same reservation and commit pipeline; the current bridge uses deterministic synthetic `offerSessionRef`/`snapshotId` values until 287 exposes a first-class waitlist-origin tuple. That bridge is tracked in `data/analysis/PHASE4_BATCH_284_291_INTERFACE_GAP_WAITLIST_COMMIT_LINEAGE.json` and is intentionally narrow so the rest of the commit law stays unchanged.
