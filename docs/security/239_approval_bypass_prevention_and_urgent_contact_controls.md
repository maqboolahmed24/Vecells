# 239 Approval Bypass Prevention And Urgent Contact Controls

Task: `par_239`

## Main controls

1. approval is epoch-bound
2. self-approval is blocked
3. presented approver roles must satisfy the matched policy rule
4. stale approval is superseded, not reused
5. stale urgent escalation is cancelled on epoch drift

## Approval bypass prevention

The implementation does not permit direct consequence to treat `required`, `pending`, `rejected`, or `superseded` as equivalent to approval. That closes the stale tab and optimistic submit problem at the governed checkpoint rather than at UI chrome.

## Lease and fence posture

`ApprovalCheckpoint` keeps its own lifecycle lease, ownership epoch, fencing token, and lineage fence epoch. Mutation requires a live task lease plus a live checkpoint lease where the checkpoint itself is being mutated.

## Separation-of-duties

The runtime blocks self-approval outright. It also requires one of the presented approver roles to match the governing approval rule. Because the repository still lacks an authoritative approver graph, the missing graph is published as an explicit gap artifact and the code fails closed when the required role is absent.

## Urgent contact controls

`UrgentContactAttempt` is replay-safe by `attemptReplayKey`. Duplicate clicks and retries collapse onto one attempt row instead of minting parallel urgent history.

Telephony or secure-message transport remains simulator-backed here. Provider receipts are treated as evidence inputs, not business truth, and the authoritative urgent business result remains `UrgentEscalationOutcome`.

## Epoch drift

If the live `DecisionEpoch` changes while escalation is open, further urgent contact mutation is blocked. The stale escalation is cancelled and linked to the latest `DecisionSupersessionRecord` so the operator can see why the path stopped being writable.
