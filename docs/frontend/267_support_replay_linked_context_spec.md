# 267 Support Replay Linked Context Spec

## Task

- taskId: `par_267_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_support_desk_replay_and_linked_context_views_for_triage_failures`
- visual mode: `Forensic_Support_Deck`

## Core outcome

This slice turns support replay, history, and knowledge into governed child routes inside the existing support shell. The shell now keeps replay, restore, linked history, and linked knowledge under one ticket-centric frame instead of splitting them into detached pages or log viewers.

The implementation makes these truths explicit:

- `SupportReplaySession` owns replay posture
- `SupportReplayEvidenceBoundary` explains what evidence is frozen and what remains outside replay
- `SupportReplayDeltaReview` buffers live drift during replay instead of silently mutating the visible truth
- `SupportReplayDraftHold` keeps drafts and repair forms outside the replay evidence boundary
- `SupportReplayRestoreSettlement` is the only authority that can restore live work
- linked history and knowledge remain anchor-preserving, mask-safe, and same-shell

## Production components

- `SupportTicketChildRouteShell`
- `SupportReplaySurface`
- `SupportReplayDeltaReviewPanel`
- `SupportLinkedContextView`
- `SupportHistoryView`
- `SupportKnowledgeView`
- `SupportReplayRestoreBridge`

## Authoritative contracts consumed

- `SupportTicketWorkspaceProjection`
- `SupportOmnichannelTimelineProjection`
- `SupportReadOnlyFallbackProjection`
- `SupportReplaySession`
- `SupportReplayEvidenceBoundary`
- `SupportReplayDeltaReview`
- `SupportReplayDraftHold`
- `SupportReplayRestoreSettlement`
- `SupportKnowledgeStackProjection`
- `SupportSubjectContextBinding`
- `SupportContextDisclosureRecord`
- `SupportContinuityEvidenceProjection`

## Route coverage

- `/ops/support/tickets/:supportTicketId`
- `/ops/support/tickets/:supportTicketId/conversation`
- `/ops/support/tickets/:supportTicketId/history`
- `/ops/support/tickets/:supportTicketId/knowledge`
- `/ops/support/tickets/:supportTicketId/actions/:actionKey`
- `/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId`
- `/ops/support/replay/:supportReplaySessionId`

## Interaction laws

1. Replay is a governed ticket child surface, not a detached forensic tool.
2. Replay entry preserves the selected anchor and current shell continuity key.
3. Live deltas during replay accumulate inside `SupportReplayDeltaReviewPanel`; they do not silently rewrite the frozen ticket.
4. `SupportReplayRestoreBridge` gates all restore paths. Deep links, reload, and browser return may not bypass it.
5. Linked history and knowledge remain same-shell and mask-safe even when the active child route changes.
6. If restore cannot safely return to live work, the ticket falls to same-shell read-only recovery instead of a generic error page.
7. Action controls stay inert while replay restore remains blocked, stale, or read-only.

## Visual posture

`Forensic_Support_Deck` uses:

- a persistent support shell with one dominant route family
- a quiet but dense forensic header with shell mode, selected anchor, replay checkpoint, and mask scope
- a central omnichannel timeline that still reads as a service tool instead of a developer trace
- a linked-context lane for history, knowledge, and subject summary
- a promoted replay plane that surfaces frozen evidence, buffered deltas, held drafts, and restore settlement
- same-shell read-only fallback when replay restore or disclosure law cannot safely continue

The visual density is deliberate, but the operator still sees one dominant action and one legal posture at a time.

## DOM contract

- `data-support-shell-mode`
- `data-replay-state`
- `data-mask-scope`
- `data-replay-checkpoint`
- `data-delta-review-state`
- `data-restore-state`

## Responsive posture

- desktop xl/2xl: three visible planes in replay, with linked context on the left, chronology in the center, and replay/restore on the right
- desktop lg: linked context and replay promote selectively so the chronology remains readable
- tablet: replay stays primary while linked context collapses into bounded panels
- mobile: replay becomes summary-first and still keeps explicit evidence boundary, delta review, and restore blockers above the fold

## Proof expectations

- entering replay from a live ticket upgrades the shell without losing the selected anchor
- replay shows frozen evidence boundary, queued delta review, and held draft posture in place
- replay restore only re-arms live work when `SupportReplayRestoreSettlement` is ready
- deep-link replay with stale or blocked restore stays same-ticket and read-only
- history and knowledge remain same-shell child routes with the current mask scope still visible
- reload and browser history preserve replay restore gating instead of reopening live controls early
