# 261 Algorithm Alignment Notes

Task: `par_261_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_changed_since_seen_and_review_resumed_recovery_flow`

## Blueprint mapping

- `EvidenceDeltaPacket` remains the only visible changed-review contract across changed lane, resume shell, inline markers, and recommit gate.
- `TaskCanvasFrame.openingMode = resumed_review` now publishes a dedicated delta-first stage instead of relying on a badge inside the generic task page.
- Same-shell continuity remains governed by the existing workspace ledger from `255` and peer-route history repair from `260`.
- `review_resumed -> queued` is represented as a recommit or acknowledgement posture, not silent return to the prior endpoint.
- `stale_recoverable` and `recovery_only` preserve the last safe changed summary instead of dropping the reviewer into a fresh route.

## Delta-class interaction mapping

| deltaClass | landing posture | commit posture | quiet return |
| --- | --- | --- | --- |
| decisive | `recommit_required` | frozen until explicit recheck | `on_resolve` |
| consequential | `recommit_required` | frozen until explicit recheck | `on_resolve` |
| contextual | `diff_first` | annotated, not frozen | `on_ack` |
| clerical | `diff_first` | annotated, not frozen | `on_ack` |

## Resume-scenario mapping

| scenario | shell behavior | dominant message |
| --- | --- | --- |
| patient return with new evidence | open changed lane or task on delta-first stage | explain what returned and which reasoning is superseded |
| contradiction or duplicate drift | keep changed summary and invalidated actions visible | prevent silent reuse of old endpoint |
| reassigned reopen | keep prior outcome quiet but reachable | acknowledge owner and wording drift |
| urgent recovery redirect | changed lane can still summarize delta, but task shell re-enters `handoff_review` | routine resume is no longer safe |
| stale or blocked tuple | preserve last safe changed summary in place | recovery, not re-navigation |

## Mandatory closures implemented

1. Legacy badge gap: replaced by route and shell surfaces bound to one delta packet id.
2. Diff detour gap: no detached diff page; compare remains in-shell.
3. Vanished rationale gap: superseded context persists as collapsed comparison.
4. Silent recommit gap: decisive and consequential deltas now publish explicit recommit gating.
5. Patient-return surprise gap: first resume surface explains returned evidence and consequence drift.
