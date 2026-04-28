# 268 Algorithm Alignment Notes

## Region-to-contract map

| Region | Landmark | Focus entry | Focus return | Keyboard model | Announcement mode | Freshness source |
| --- | --- | --- | --- | --- | --- | --- |
| `WorkspaceShellRouteFamily` | `main` | route entry target | same route entry | `tab_ring` | route summary digest | `FreshnessAccessibilityContract` |
| `WorkspaceNavRail` | named `navigation` | tab entry | shell root | `tab_ring` | silent unless route changed | shell tuple |
| `QueueScanManager` | named `region` | `#workspace-workboard` | selected row | `listbox` | buffered queue digest | queue trust tuple |
| `QueuePreviewPocket` | named `complementary` | `#workspace-context-region` on queue routes | selected row | read-only browse | silent | queue trust tuple |
| `ActiveTaskShell` | task shell | current task route | current task anchor | `tab_ring` | task route summary | task trust tuple |
| `TaskCanvas` | named `region` | `#workspace-task-canvas` | current reading target | `tab_ring` | freshness and delta summary | task trust tuple |
| `DecisionDock` | named `complementary` | `#workspace-decision-dock` | task canvas | `tab_ring` | dominant action or blocker digest | task trust tuple |
| `PromotedSupportRegion` | named `complementary` | `#workspace-context-region` | prior quiet region | `tab_ring` | promoted-stage summary | same governing tuple |
| `peer_route` | named `region` | `#workspace-peer-route` | row launcher or current route launcher | `tab_ring` | peer route summary | peer-route tuple |

## Gaps closed in 268

1. **focus-loss-on-stage-change gap**  
   Stage entry targets are now explicit and shell-level pane switching keeps focus inside lawful region order instead of falling to the document root.

2. **live-update announcement spam gap**  
   The shell now publishes one announcement hub with batching and dedupe keyed to route, anchor, and buffered queue state.

3. **dense-row semantic drift gap**  
   Queue workboard keeps `listbox` semantics and `aria-activedescendant` while still allowing compact row styling.

4. **zoom-and-reflow trap gap**  
   The shell keeps selected anchor, dominant action, and recovery summary visible in `mission_stack` instead of blanking the task plane.

5. **reduced-motion meaning-loss gap**  
   Reduced motion now preserves focus ring, structural persistence, and state summaries while dropping travel-heavy transitions.

6. **pointer-target inequality gap**  
   Frequent or high-risk controls now keep minimum target height through shared button sizing instead of route-local shrinkage.

## Route-family semantic coverage

- `rf_staff_workspace`: queue, task, more-info, decision, and search stay under one semantic coverage tuple with workboard, task canvas, decision dock, and context order.
- `rf_staff_workspace_child`: approvals, escalations, changed, callbacks, messages, and consequences reuse the same shell and nav rail, but they expose one focusable peer-route surface instead of a hidden workboard.

## Keyboard model

- queue scan: arrow keys for row movement, `Space` for preview pin, `Enter` for task open
- pane switching: `Alt+Shift+ArrowLeft`, `Alt+Shift+ArrowRight`, and direct `Alt+Shift+1..4`
- skip links remain first in tab order and disclose the same pane sequence

## Freshness and recovery posture

- `live` => calm summary and bounded routine announcements
- `stale_review` => advisory freshness summary, no focus theft
- `read_only` and `recovery_only` => preserved context with recovery-first semantics
- `blocked` => assertive blocker summary and no implied actionability

## Design alignment

- layout follows the blueprint’s quiet mission-control posture
- density is raised by tightening gutters and chrome, not by shrinking text below canonical reading roles
- semantic accents stay narrow and do not wash whole panels in warning color
