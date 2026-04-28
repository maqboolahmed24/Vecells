# 116 Staff Queue And Task Continuity Contracts

## WorkspaceNavigationLedger

The staff shell keeps one browser-resident ledger with:

- current path
- selected queue
- selected task
- preview task
- selected anchor
- search query
- buffered update count
- queued batch state
- runtime scenario
- last quiet region label

That ledger is persisted locally so the staff shell can survive refreshes and route morphs without losing the quiet-return target.

## Selected Anchor Policy

The selected-anchor contract is stricter in the staff shell than in a generic admin console:

- queue scans anchor to the active row
- task open preserves the originating row anchor until the reviewer explicitly changes focus
- child routes preserve the current reading region instead of minting a new shell
- re-ranks may reorder background rows, but not the active row’s slot
- blocked or recovery-only postures preserve the same anchor rather than dropping to a blank state

This is the minimum contract required to avoid continuity drift lies.

## Dominant Action Hierarchy

Dominant action is route-aware and posture-aware:

1. current child-route action
2. explicit approval/escalation action
3. current task next-safe action
4. queue resume action

The dock never promotes a dominant action that runtime posture does not allow. Under read-only or recovery-only posture, the dominant action copy changes, but the same dock and task shell remain visible.

## Focus Protection

Protected composition is local to the task shell:

- `more-info` and `decision` routes increment buffered updates
- live changes buffer during protected composition rather than stealing focus
- invalidation freezes the draft in place
- restore returns to the prior quiet region and reading target

This keeps the reviewer in one shell while still being honest that live truth changed underneath the current composition lease.

## Queue To Task Continuity

Route adjacency follows the same-shell contract:

- queue to task: same shell, same route family
- task to child route: same shell, child family morph
- approvals, escalations, changed, search: peer child routes inside the same shell
- support handoff: bounded stub only, no shell ownership transfer

The clinical workspace therefore proves three things at once:

- queue-first scanning does not require shell resets
- child workflows do not require detached pages
- recovery posture does not erase current task context
