# 267 Algorithm Alignment Notes

## Governing models

- `SupportTicketWorkspaceProjection` remains the route-family spine.
- `SupportReplaySession` controls replay entry and replay posture.
- `SupportReplayEvidenceBoundary` closes the invisible-replay-boundary gap by making included and excluded evidence visible.
- `SupportReplayDeltaReview` closes the live-delta-silently-mutates-ticket gap by buffering later changes.
- `SupportReplayDraftHold` prevents live drafts and recovery forms from leaking into replay proof.
- `SupportReplayRestoreSettlement` closes the deep-link-bypasses-restore gap and the live-controls-reopen-too-early gap.
- `SupportKnowledgeStackProjection` and `SupportSubjectContextBinding` keep linked context same-shell and mask-safe.

## UI responsibility mapping

### Replay entry

- preserve current ticket lineage and selected anchor
- upgrade the shell into `Forensic_Support_Deck`
- keep the main chronology visible instead of swapping to a detached diff page

### Freeze

- render checkpoint, mask scope, and evidence boundary as first-class summary
- keep current mutable drafts outside replay and summarize them through `SupportReplayDraftHold`

### Delta review

- buffer later provider, callback, and disclosure changes in `SupportReplayDeltaReviewPanel`
- show severity and restore impact so the operator can see why replay is still gated

### Restore

- restore only when the settlement confirms continuity key, anchor, mask scope, route intent, scope member, and held-draft disposition
- if restore blocks or degrades, keep the operator in the same ticket shell with read-only recovery

## Mandatory gap closures

- invisible-replay-boundary gap: closed by the replay plane and evidence-boundary summary
- deep-link-bypasses-restore gap: closed by persisted replay gate and in-shell restore bridge
- detached-history-gap: closed by `SupportHistoryView` and `SupportKnowledgeView` living under `SupportTicketChildRouteShell`
- ticket-copy-drift gap: closed by anchor-preserving child routes and replay gate continuity markers
- live-controls-reopen-too-early gap: closed by replay-gated action dock and restore blockers
