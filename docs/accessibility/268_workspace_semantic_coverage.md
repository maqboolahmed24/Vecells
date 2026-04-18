# 268 Workspace Semantic Coverage

## Coverage rule

The workspace now publishes one `AccessibilitySemanticCoverageProfile` per route family and fails closed to recovery-first or summary-first posture if the coverage tuple degrades.

## Surface map

| Surface | Landmark / role | Focus entry | Focus return | Keyboard model | Announcement mode | Freshness posture |
| --- | --- | --- | --- | --- | --- | --- |
| `workspace_shell` | `main` | route entry target | current route entry | `tab_ring` | surface summary digest | `fresh`, `stale`, `degraded`, `blocked` |
| `workspace_navigation` | named `navigation` | tab entry | shell root | `tab_ring` | silent unless route changed | mirrors shell |
| `queue_workboard` | focusable `region` + `listbox` | `#workspace-workboard` | selected row or current anchor | `listbox` | routine batch digest | mirrors queue truth |
| `queue_preview` | named `complementary` | `#workspace-context-region` on queue routes | selected row | read-only browse | silent | mirrors queue truth |
| `active_task_shell` | task composition shell | route-local | current task anchor | `tab_ring` | surface summary | mirrors task truth |
| `task_canvas` | focusable `region` | `#workspace-task-canvas` | current reading target | `tab_ring` | freshness or recovery digest | mirrors task truth |
| `decision_dock` | named `complementary` | `#workspace-decision-dock` | task canvas | `tab_ring` | dominant action and blocker digest | mirrors task truth |
| `context_region` | named `complementary` | `#workspace-context-region` | prior quiet region | `tab_ring` | promoted-stage summary | mirrors promoted stage truth |
| `peer_route` | focusable `region` | `#workspace-peer-route` | route launcher or current row | `tab_ring` | route summary or recovery digest | mirrors peer-route truth |

## Route-family coverage

### `rf_staff_workspace`

- route kinds: `home`, `queue`, `task`, `more-info`, `decision`, `search`
- required breakpoints: `compact`, `narrow`, `medium`, `wide`
- fold coverage: `mission_stack_supported`
- reduced motion: `reduced_motion_outline_and_structure`
- buffered update coverage: `buffered_queue_digest`, `selected_anchor_preserved`

### `rf_staff_workspace_child`

- route kinds: `approvals`, `escalations`, `changed`, `callbacks`, `messages`, `consequences`, `support-handoff`
- required breakpoints: `compact`, `narrow`, `medium`, `wide`
- fold coverage: `mission_stack_supported`
- reduced motion: `reduced_motion_outline_and_structure`
- buffered update coverage: `steady_state`, plus route-specific recovery digests

## Focus order

Task-family focus order is fixed:

1. `workboard`
2. `task canvas`
3. `decision dock`
4. `context region`

Home, queue, and search keep the shorter same-shell order:

1. `workboard`
2. `peer route surface`

Peer workbench routes keep one entry target:

1. `peer route surface`

## Focus return rules

- route open returns to the route entry target
- browser return restores the last route entry target and selected anchor
- promoted stages and recovery states keep the current task, draft, and anchor visible rather than dumping focus to the document root
- pane switching never resets the browser scroll to the top

## Announcement coverage

- one live announcement hub governs queue churn, stale review, recovery-only posture, and blockers
- routine queue churn is summarized as one polite digest
- stale review is announced as changed actionability, not transport chatter
- blocked and recovery-only posture escalate to assertive because the operator must change course

## High-zoom and reduced-motion coverage

- the shell stays usable at 200% zoom and 400% reflow by stacking, not replacing, primary regions
- the dominant action, selected anchor, and recovery summary remain visible at narrow widths
- reduced motion removes travel and keeps state change meaning through outline, opacity, and structural persistence
