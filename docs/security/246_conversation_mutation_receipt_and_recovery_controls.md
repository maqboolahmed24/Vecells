# 246 Conversation Mutation Receipt and Recovery Controls

## Security posture

The conversation surface now fails closed on drift instead of manufacturing calmness.

## Required controls

1. `ReviewActionLease` is mandatory for staff-originated callback or message settlements.
2. When drafting, compare review, or delivery-dispute review is active, staff mutations also require:
   - `WorkspaceFocusProtectionLease`
   - live `ProtectedCompositionState`
   - `invalidatingDriftState = none`
3. `ConversationCommandSettlement` keeps local acknowledgement, transport, external observation, and authoritative outcome separate.
4. Blocked or repair outcomes must issue a bounded `RecoveryContinuationToken`.

## Calmness degradation

The application rewrites optimistic inputs to recovery posture when any of the following hold:

- tuple availability is not `authoritative`
- continuity validation is `stale` or `blocked`
- preview mode is `step_up_required`
- preview mode is `suppressed_recovery_only`

That means send success does not imply settled conversational truth, and staff acknowledgement does not imply final callback or message completion.

## Recovery rules

`repair_required`, `stale_recoverable`, `blocked_policy`, and `review_pending` all issue same-cluster recovery continuation. The token stays bound to:

- the cluster ref
- the selected anchor
- the action scope
- the active repair journey when one exists

## Known bounded gaps

- The full 247 tuple materializer is still a separate track. `246` consumes the compatibility contract and fails closed when tuple production is incomplete.
- Live provider transport remains simulator-backed; the receipt grammar is production-shaped even where transport proof is simulated.
