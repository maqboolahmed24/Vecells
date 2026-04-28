# 322 Practice Continuity Message And Acknowledgement Chain

`par_322` turns origin-practice continuity into one governed delivery chain instead of a side effect hanging off the commit path.

## Core runtime

- `PracticeContinuityMessage` is the single outward contract for a live practice-notification obligation.
- The runtime keeps four evidence lanes separate:
  - `transportAckState`
  - `deliveryEvidenceState`
  - `deliveryRiskState`
  - `ackState`
- `PracticeAcknowledgementRecord` is generation-bound and tuple-bound. This is the generation-bound acknowledgement rule: only the live `ackGeneration`, live `truthTupleHash`, and live policy tuple may clear current debt.
- `PracticeVisibilityDeltaRecord` is appended on enqueue, delivery movement, acknowledgement, and reopen so later practice projections consume typed delta truth instead of reverse-engineering transport logs.

## Delivery chain

1. A booked or `booked_pending_practice_ack` hub case mints one minimum-necessary payload document.
2. The payload is deduped into one current `PracticeContinuityMessage`.
3. Dispatch attempts append onto the same message chain through adapters such as `mesh`, `direct_api`, `manual_secure_mail`, or `internal_transfer`.
4. Receipt checkpoints update transport, delivery, and risk posture without falsely implying acknowledgement.
5. Only explicit current-generation acknowledgement evidence or an audited policy exception promotes the chain to `acknowledged` or `exception_granted`.

## Projection effects

- Enqueue moves practice posture to `continuity_pending`.
- Delivery evidence promotes the truth projection to `ack_pending`.
- Failed delivery, timeout, dispute, or stale reopening widens posture to `recovery_required`.
- Successful acknowledgement moves `HubOfferToConfirmationTruthProjection` to:
  - `confirmationTruthState = confirmed`
  - `practiceVisibilityState = acknowledged`
- The hub case can move from `booked_pending_practice_ack` to `booked` only after that current-generation evidence exists.

## Reopen law

`par_322` also closes the reopen gap in the hub-case kernel:

- `booked -> booked_pending_practice_ack`
- `booked_pending_practice_ack -> booked_pending_practice_ack`

Those edges are used when a later material change reopens acknowledgement debt or refreshes the current generation without inventing a second case or flattening the booked truth.
