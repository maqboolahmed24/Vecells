# 315 Hub Lineage Fence And Close Blocker Rules

The 315 kernel adds the missing enforcement layer between the 311 freeze pack and later Phase 5 network tracks.

## Lineage rules

1. `NetworkBookingRequest` is the only durable Phase 4-to-5 handoff contract in this track.
2. The hub branch always records `parentLineageCaseLinkRef = originLineageCaseLinkRef`.
3. The hub child link uses `caseFamily = hub`; the booking branch remains the parent owner.
4. Source booking drift is a write-time failure, not a UI warning.

## Ownership fence rules

1. Claims require the current `ownershipEpoch` even when the case is unclaimed.
2. Release, transfer, stale-owner recovery, and close require the current `ownershipEpoch`.
3. When a live fence exists, the presented `ownershipFenceToken` must match exactly.
4. Ownership changes advance `ownershipEpoch` to invalidate stale writers.

## Stale-owner recovery rules

1. Lease expiry is surfaced as `ownerState = stale_owner_recovery`.
2. `activeOwnershipTransitionRef` must identify the stale-owner recovery work item.
3. The case keeps an explicit blocker (`ownership_transition_open`) until recovery is resolved.
4. Recovery does not mutate the operational workflow state into a fake replacement state.

## Close-blocker rules

`status = closed` is legal only when:

1. `openCaseBlockerRefs` is empty
2. ownership is already released
3. no active ownership transition remains
4. no unresolved identity repair remains
5. `closeDecisionRef` is present

This prevents three specific failure modes called out by the prompt:

- closing a hub case while the handoff is still browser-only
- assuming ownership expiry will be fixed later by UI
- closing before typed blocker debt exists
