# 331 Hub No-Slot, Reopen, And Recovery Spec

## Intent

`par_331` turns hub recovery into a same-shell operational layer instead of a generic error bucket.

The shell must keep:

- no-slot rationale visible
- callback-transfer-pending visibly unresolved
- urgent return-to-practice visually distinct from ordinary coordination
- reopen changes diff-first and anchor-preserving
- `/hub/exceptions` usable as a real typed recovery workspace

## Visual mode

- `visualMode = Hub_Recovery_And_Reopen`
- serious and calm, not alarm-fatigue red
- provenance and diff explanation before secondary actions

## Route ownership

- `/hub/case/hub-case-052` renders the callback-blocked no-slot path
- `/hub/case/hub-case-031` renders the urgent bounce-back and return receipt path
- `/hub/case/hub-case-041` renders the reopen diff path
- `/hub/exceptions` renders the exception queue and sticky detail drawer

All of the above remain inside the existing hub shell family from `326`.

## Production components

- `HubNoSlotResolutionPanel`
- `HubCallbackTransferPendingState`
- `HubReturnToPracticeReceipt`
- `HubUrgentBounceBackBanner`
- `HubRecoveryDiffStrip`
- `HubExceptionQueueView`
- `HubExceptionDetailDrawer`
- `HubReopenProvenanceStub`
- `HubSupervisorEscalationPanel`

## Core scenarios

### 052 callback blocked

- no safe trusted slot remains in the required window
- prior slot context remains visible as read-only provenance
- callback stays separate from ranked rows
- calm completion wording is forbidden until durable callback linkage exists

### 031 urgent bounce-back

- lead-time law failed for urgent care
- return-to-practice linkage is already durable
- repeated low-novelty recirculation raises supervisor review
- ordinary retry stays subordinate to the supervisor path

### 041 reopen diff

- supplier drift widened recovery
- new trusted backup capacity is visible for reopen planning only
- current drifted truth remains visible until reopen law clears

### Exceptions workspace

- rows are typed, severity-ranked, keyboard selectable
- selection persists on refresh through the shell history snapshot
- the detail drawer keeps blocker facts, evidence, and bounded next safe actions together

## Interaction laws

1. No-slot recovery must not replace prior context with a blank or generic error page.
2. Callback pending must remain visibly unresolved until durable callback linkage exists.
3. Return-to-practice must show receipt and lineage linkage, not just a status chip.
4. Reopen is diff-first: what changed, why it matters, what remains current.
5. Repeat bounce with low novelty must escalate visibly to supervisor review.
6. `/hub/exceptions` must preserve selected case and selected exception continuity on refresh.

## Responsive behavior

- desktop case recovery uses the existing three-column shell with bounded recovery panels in the centre lane
- desktop exceptions route uses `360px` list plus `minmax(640px, 1fr)` detail
- tablet collapses the recovery action grid and exception workspace to one column
- narrow layouts keep the same selected exception and case anchor while stacking list and detail

## DOM markers

- `data-hub-recovery`
- `data-fallback-type`
- `data-callback-transfer`
- `data-return-to-practice`
- `data-hub-exception-row`
- `data-reopen-diff`
- `data-supervisor-escalation`

## Accessibility notes

- recovery state changes that do not take focus stay discoverable through status chips and persistent visible copy
- the exceptions list uses focusable row buttons with `aria-current`
- the detail drawer remains part of the same page flow and keeps a stable labelled region
- narrow layouts must reflow without two-dimensional scrolling
