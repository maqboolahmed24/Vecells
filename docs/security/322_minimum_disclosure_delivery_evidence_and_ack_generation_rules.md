# 322 Minimum Disclosure Delivery Evidence And Ack Generation Rules

## Minimum disclosure

- Practice payload assembly happens before dispatch, not after transport.
- The payload is bound to the current `CrossOrganisationVisibilityEnvelope`, the current minimum-necessary contract, and the current practice-visibility policy.
- Dedupe is computed across case, appointment, `ackGeneration`, `truthTupleHash`, envelope version, channel, and payload checksum so retries update one chain instead of forking live truth.

## Evidence lanes

- Transport acceptance is progress only.
- Delivery evidence is separate from transport acceptance.
- Delivery risk is separate from both and can widen recovery posture without mutating the authoritative booking fact.
- Explicit acknowledgement evidence is the only normal way to clear current debt.

## Generation-bound clearance

Current practice debt clears only when all of the following still match:

- live `ackGeneration`
- live `truthTupleHash`
- live visibility envelope version
- live policy tuple

Stale transport receipts, stale tuples, stale envelope versions, or old acknowledgement generations remain auditable only.

## Reopen and supersession

- Reopen supersedes the prior current message and prior acknowledgement record.
- Reopen can move a hub case from `booked` back to `booked_pending_practice_ack`.
- Reopen can refresh `booked_pending_practice_ack` in place for the same case when the current generation changes again before acknowledgement lands.

## Exception path

- `policy_exception` is allowed only when the live practice-visibility policy still matches the message chain.
- Policy exceptions record explicit evidence and move the projection to `exception_granted`; they do not silently masquerade as ordinary acknowledgement.
