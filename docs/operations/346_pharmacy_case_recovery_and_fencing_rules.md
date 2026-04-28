# 346 Pharmacy Case Recovery And Fencing Rules

## Mutation authority

Every mutating command must present:

- the current `RequestLifecycleLease`
- the current `ownershipEpoch`
- the current `LineageFence`
- an admitted `ScopedMutationGate`

If any one of those is stale, the kernel rejects the command and records recovery posture before returning control to callers.

## Stale-owner recovery

- The kernel creates or refreshes a `StaleOwnershipRecoveryRecord` on stale lease, stale epoch, or stale fence input.
- Recovery remains visible on the case through `staleOwnerRecoveryRef`.
- Calm progression is blocked while the recovery row is still `pending`.
- `reserveMutationAuthority()` resolves that row by binding the new lease, new epoch, and new fence tuple.

## Identity repair freeze

- If `activeIdentityRepairCaseRef` is present and `identityRepairReleaseSettlementRef` is absent, calm pharmacy mutations fail closed.
- Close attempts also fail while identity repair remains active.

## Closure safety

The close path fails closed when any of the following remain open:

- `currentConfirmationGateRefs`
- `currentClosureBlockerRefs`
- `activeReachabilityDependencyRefs`
- unreleased identity-repair branch posture

Rejected close attempts append a rejected transition journal entry so operators can inspect the exact failure code instead of inferring why closure failed.
