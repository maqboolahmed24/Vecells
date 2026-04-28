# 315 Hub Case Kernel And State Machine

Contract version: `315.phase5.hub-case-kernel.v1`

This task implements the executable Phase 5 hub kernel behind the `311` freeze pack. The kernel is deliberately narrow: it owns durable handoff, child-lineage preservation, ownership fencing, stale-owner recovery, close-blocker law, and append-only transition audit. It does not attempt to absorb acting-context resolution, policy ranking, offer generation, commit transport, or fallback delivery logic that belong to later Phase 5 tracks.

## Implemented aggregates

| Aggregate | Purpose | Key law now enforced |
| --- | --- | --- |
| `NetworkBookingRequest` | Durable booking-to-hub handoff created from Phase 4 fallback or governed routing. | The kernel preserves `requestLineageRef`, origin booking refs, origin practice identity, modality/timeframe/access constraints, and `reasonForHubRouting` exactly once at handoff time. |
| `HubCoordinationCase` | Operational state machine root for the hub branch. | The case owns state transitions, ownership lease/fence enforcement, and the live `OpenCaseBlockers(h)` projection. |
| `LineageCaseLink(caseFamily = hub)` | Child branch under the booking lineage. | The booking branch remains the parent; hub entry never overwrites `BookingCase.lineageCaseLinkRef`. |
| `HubCaseTransitionJournalEntry` | Append-only audit for every accepted or rejected case mutation. | Mutable row state is never the only truth of a transition attempt. |
| `HubEventJournalEntry` | Append-only emitted-event ledger for request and case activity. | Material state changes publish auditable event names without relying on downstream projections to infer history. |

## State machine posture

The kernel implements the `311` status vocabulary exactly:

- Intake and queue: `hub_requested`, `intake_validated`, `queued`
- Coordination: `claimed`, `candidate_searching`, `candidates_ready`, `coordinator_selecting`
- Choice and fallback branches: `alternatives_offered`, `patient_choice_pending`, `callback_transfer_pending`, `callback_offered`, `escalated_back`
- Commit and truth: `candidate_revalidating`, `native_booking_pending`, `confirmation_pending`, `booked_pending_practice_ack`, `booked`
- Completion: `closed`

Owner-only actions such as release, transfer, and stale-owner recovery do not invent replacement workflow states. They mutate ownership posture inside the current hub case and write explicit predicate IDs into the transition journal.

## Ownership fence and stale-owner recovery

The kernel now enforces:

1. `claim`, `release`, `transfer`, stale-owner recovery, and `close` require the current `ownershipEpoch`.
2. When a live fence exists, the presented `ownershipFenceToken` must also match.
3. Successful claim, release, transfer, and stale-owner recovery advance `ownershipEpoch`.
4. Lease expiry is modeled as explicit `ownerState = stale_owner_recovery` plus `ownership_transition_open`; the case does not silently disappear from the queue.

## Close-blocker law

`OpenCaseBlockers(h)` is persisted on the case and recomputed from:

- live ownership posture
- live ownership transition
- unresolved identity-repair posture
- carried blocker refs from offer/confirmation/fallback seams

The kernel rejects `status = closed` unless all of the following are true:

1. `openCaseBlockerRefs` is empty
2. ownership is fully released
3. `closeDecisionRef` is present
4. the hub lineage child link is closed in the same mutation

## Phase 4 carry-forward boundary

The booking-to-hub hop is now durable backend state rather than browser continuity:

1. `NetworkBookingRequest` captures the immutable Phase 4-to-5 handoff tuple.
2. `HubCoordinationCase` points back to the parent booking lineage link.
3. The child `LineageCaseLink(caseFamily = hub)` is created immediately with the parent booking link recorded.
4. Rejected stale-branch and stale-fence attempts are journaled, so replay and recovery can reason over a persisted history.

## Persistence footprint

The migration `services/command-api/migrations/143_phase5_hub_case_kernel.sql` adds:

- `phase5_network_booking_requests`
- `phase5_hub_coordination_cases`
- `phase5_hub_case_transition_journal`
- `phase5_hub_event_journal`

Foundation tables for `LineageCaseLink`, `RequestLifecycleLease`, `CommandActionRecord`, and `CommandSettlementRecord` remain the upstream dependencies.
