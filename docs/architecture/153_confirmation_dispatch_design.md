# 153 Confirmation Dispatch Design

## Scope

`par_153` closes the Phase 1 gap where routine submit could produce a receipt and ETA without a durable confirmation communication chain behind it. The implementation now resolves:

- `GAP_RESOLVED_PHASE1_CONFIRMATION_COMMUNICATION_CHAIN_V1`
- `GAP_RESOLVED_PHASE1_CONFIRMATION_RECEIPT_BRIDGE_V1`
- `GAP_RESOLVED_PHASE1_CONFIRMATION_OBSERVABILITY_V1`

The chain is future-compatible with the broader `CommunicationEnvelope` family, but Phase 1 keeps one bounded confirmation-focused contract set:

- `Phase1ConfirmationCommunicationEnvelope`
- `Phase1ConfirmationTransportSettlement`
- `Phase1ConfirmationDeliveryEvidence`
- `Phase1ConfirmationReceiptBridge`

## Authoritative Flow

1. `services/command-api/src/intake-submit.ts` finishes authoritative routine handoff first.
2. The routine path creates `PatientReceiptConsistencyEnvelope` and `Phase1TriageTask`.
3. `services/command-api/src/confirmation-dispatch.ts` queues one confirmation command with the deterministic idempotency key `confirm_dispatch::<requestRef>::<receiptEnvelopeRef>`.
4. `packages/domains/communications/src/phase1-confirmation-dispatch.ts` persists the queue envelope and the receipt bridge together.
5. `services/notification-worker/src/confirmation-dispatch.ts` settles provider transport acceptance separately from later webhook evidence.
6. Webhook reconciliation records delivery evidence and refreshes route truth before updating the authoritative receipt posture.

## Truth Model

The receipt bridge keeps these states distinct and monotone:

- local acknowledgement
- transport accepted / rejected / timed out
- delivery evidence pending / delivered / failed / disputed / expired
- authoritative outcome awaiting delivery truth / delivery confirmed / recovery_required

`transport accepted` is weak evidence only. A calm patient-facing posture is allowed only after authoritative delivery evidence records `delivered`.

## Route Truth Law

Confirmation dispatch is conservative by design:

- stale, blocked, or disputed route truth produces `dispatchEligibilityState = blocked_route_truth`
- blocked route truth immediately widens the receipt bridge to `authoritativeOutcomeState = recovery_required`
- reachability dependencies now use the explicit blocked action scopes `status_view` and `contact_route_repair`
- replayed submit or replayed queue work returns the same envelope instead of duplicating confirmation traffic

This keeps the Phase 1 receipt honest even when contact preference exists but safe reachability proof does not.

## Retry And Failure

Transport settlement and delivery evidence are different append-only records.

- provider timeout retries use bounded backoff `60s -> 300s -> 900s`
- provider rejection is terminal for the current envelope
- bounced, disputed, suppressed, and expired callbacks are terminal delivery-evidence outcomes
- recovery posture is explicit instead of being inferred from generic outage handling

## Event Spine

The bounded confirmation chain consumes the already-issued upstream receipt event and then appends its own canonical evidence:

- upstream dependency: `communication.receipt.enveloped`
- queue event: `communication.queued`
- transport settlement: `communication.command.settled`
- delivery evidence: `communication.delivery.evidence.recorded`
- callback evidence: `communication.callback.outcome.recorded`

## Receipt Bridge

`Phase1ConfirmationReceiptBridge` exists so later patient and status surfaces can read one honest posture without confusing:

- internal submit acknowledgement
- provider SDK acceptance
- callback evidence
- recovery-required route truth

That bridge is the Phase 1 source for truthful queued, pending, delivered, and recovery-required confirmation posture.
