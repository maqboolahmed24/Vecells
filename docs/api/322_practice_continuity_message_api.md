# 322 Practice Continuity Message API

The public backend surface for `par_322` is exported from:

- `packages/domains/hub_coordination/src/phase5-practice-continuity-engine.ts`

## Service factory

- `createPhase5PracticeContinuityService(...)`

## Primary commands

- `enqueuePracticeContinuityMessage`
  - Creates or replays the live `PracticeContinuityMessage` for the current `ackGeneration`
  - Assembles minimum-necessary payload before any dispatch
- `dispatchPracticeContinuityMessage`
  - Runs the configured adapter and appends a dispatch attempt onto the governed chain
- `recordReceiptCheckpoint`
  - Persists transport acceptance, rejection, timeout, delivery evidence, expiry, failure, dispute, and acknowledgement checkpoints
- `capturePracticeAcknowledgement`
  - Accepts current-generation acknowledgement or policy exception evidence and clears the live debt only when the tuple, envelope, and policy are still current
- `reopenPracticeAcknowledgementDebt`
  - Reopens or refreshes the live generation after a material change and emits a typed delta
- `queryCurrentPracticeContinuityState`
  - Reads the current message, acknowledgement, latest dispatch, latest receipt, latest evidence, and latest delta for a hub case

## Adapter contract

Each adapter implements:

- `channel`
- `dispatch({ message, payload, attemptedAt })`

The runtime ships default adapters for:

- `mesh`
- `direct_api`
- `manual_secure_mail`
- `internal_transfer`

Custom adapters can be injected at service creation time to simulate timeout, dispute, or alternate channel behavior without changing the domain logic.
