# 315 Network Booking Request And Hub Case API

This document describes the production-shaped command surface implemented by the 315 hub kernel. These are kernel commands, not public patient routes.

## Request creation commands

| Command | Purpose | Required core inputs |
| --- | --- | --- |
| `createNetworkBookingRequestFromPhase4Fallback` | Freeze a Phase 4 local-booking fallback into durable Phase 5 handoff state. | `requestLineageRef`, `originLineageCaseLinkRef`, `originBookingCaseId`, `originPracticeOds`, constraints, `reasonForHubRouting`, `requestedAt` |
| `createNetworkBookingRequestFromGovernedRouting` | Freeze a governed direct-to-hub routing decision into the same durable contract. | Same as above |
| `createHubCoordinationCaseFromNetworkRequest` | Open the hub branch and child lineage link from the durable request. | `networkBookingRequestId`, `servingPcnId`, route-action refs |

## Case mutation commands

| Command | Intended transition or effect | Required guard |
| --- | --- | --- |
| `validateIntake` | `hub_requested -> intake_validated` | live source booking branch |
| `queueHubCase` | `intake_validated -> queued` | live source booking branch |
| `claimHubCase` | queue-to-claim or same-state reclaim | current `ownershipEpoch`; current fence if the case is already owned |
| `releaseHubCase` | owner release, optionally `claimed -> queued` | current `ownershipEpoch` and current fence |
| `transferHubOwnership` | owner transfer without inventing a new workflow state | current `ownershipEpoch` and current fence |
| `markStaleOwnerRecoveryPending` | explicit stale-owner recovery on the current case | current `ownershipEpoch` and current fence |
| `beginCandidateSearch` | `claimed -> candidate_searching` | live ownership fence plus policy tuple refs |
| `publishCandidatesReady` | `candidate_searching -> candidates_ready` | candidate snapshot and decision plan refs |
| `enterCoordinatorSelecting` | `candidates_ready -> coordinator_selecting` or governed selection return | live ownership fence |
| `enterAlternativesOffered` | into governed open choice | offer session and optimisation refs |
| `enterPatientChoicePending` | `alternatives_offered -> patient_choice_pending` | live ownership fence |
| `enterCandidateRevalidating` | `coordinator_selecting -> candidate_revalidating` | selected candidate ref |
| `enterNativeBookingPending` | `candidate_revalidating -> native_booking_pending` | booking evidence / commit attempt ref |
| `markConfirmationPending` | `native_booking_pending -> confirmation_pending` | live ownership fence |
| `markBookedPendingPracticeAcknowledgement` | into explicit post-confirmation acknowledgement debt | appointment ref, confirmation truth ref, ack generation |
| `markBooked` | `booked_pending_practice_ack -> booked` | live ownership fence |
| `markCallbackTransferPending` | governed callback branch entry | fallback ref |
| `markCallbackOffered` | `callback_transfer_pending -> callback_offered` | callback expectation ref |
| `markEscalatedBack` | governed return-to-practice branch entry | fallback ref |
| `closeHubCase` | `booked|callback_offered|escalated_back -> closed` | current `ownershipEpoch`, released ownership, empty blockers, `closeDecisionRef` |

## Read surface

`queryHubCaseBundle(hubCoordinationCaseId)` returns:

- `NetworkBookingRequest`
- `HubCoordinationCase`
- the hub child `LineageCaseLink`
- append-only `HubCaseTransitionJournalEntry[]`
- append-only `HubEventJournalEntry[]`

## Persistence references

The kernel publishes:

- `phase5HubCasePersistenceTables`
- `phase5HubCaseMigrationPlanRefs`
- `phase5HubCaseRoutes`

These artifacts are intended for command-api integration and validator checks; they are not a promise that patient-facing HTTP routes are already exposed.
