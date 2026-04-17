# 111 Focus Management And Announcement Law

The `par_111` harness makes focus movement and live narration inspectable instead of implicit.

## Focus law

The shared focus engine only allows five outcomes:

| Disposition | Meaning |
| --- | --- |
| `preserve` | Same-shell change keeps focus on the current target. |
| `restore_previous` | Restore returns to the last meaningful in-shell target. |
| `move_selected_anchor` | Invalidation or recovery retreats to the selected-anchor summary. |
| `move_summary` | Surface-root invalidation moves to the verified summary. |
| `move_recovery_stub` | Recovery-only shells move to the bounded stub. |

Those outcomes are applied across seven triggers per route family:

1. `same_shell_refresh`
2. `buffered_update`
3. `mission_stack_fold`
4. `mission_stack_unfold`
5. `restore`
6. `invalidation`
7. `recovery_return`

The non-negotiable behavior is:

- same-shell refresh never steals focus
- buffered updates do not move focus because sort order or new rows arrived
- invalidation or recovery may move focus only when the published contract says they may
- restore prefers the prior meaningful target, then the selected anchor, then the summary

## Announcement law

Announcement truth is published on authority, not copy alone.

Authority classes:

- `local_ack`
- `pending`
- `stale`
- `recovery`
- `authoritative_settlement`

Suppression rule:

- `chrome_restore` narration is suppressed so same-shell return does not replay shell chrome noise

Deduplication rule:

- dedupe uses the `causalTuple`
- identical text with a different causal tuple is still a distinct announcement
- identical causal tuple with repeated text is marked `deduplicated`

Supersession rule:

- a later higher-authority announcement on the same scope supersedes the lower-authority one
- authoritative settlement supersedes pending or recovery copy for the same scope

## Published gap handling

The harness carries the bounded copy gap `GAP_RESOLUTION_ANNOUNCEMENT_COPY_RECOVERY_SEMANTICS_V1`. Recovery wording stays calm and explicit, but the important invariant is that recovery is never conflated with pending or final settlement.
