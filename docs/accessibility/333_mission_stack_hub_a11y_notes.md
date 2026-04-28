# 333 Mission Stack Hub Accessibility Notes

## Semantic intent

- `mission_stack` keeps one hub shell and one main landmark.
- `HubNarrowQueueWorkbench` exposes saved views through a real navigation landmark.
- `HubSupportDrawer` keeps support content in the same shell and stays explicitly open or closed.
- `HubDecisionDockBar` is the only dominant sticky action surface on narrow widths.

## Keyboard and focus

- keyboard order stays queue or selection context -> dominant case content -> support drawer trigger row -> sticky `DecisionDock`
- support trigger buttons stay full-width and focus-visible with no hover-only affordances
- the support drawer close control is always visible and focusable
- fold or unfold may move regions, but it may not silently replace the selected queue row, selected option, or selected exception

## Reflow and reduced motion

- 320px width is treated as the 400% reflow proxy for the hub shell
- the sticky dock reserve prevents focused controls from being obscured by the bottom bar
- drawer and dock transitions collapse with reduced motion
- touch targets remain at least 44px across buttons, queue rows, and support triggers

## Content rules

- trust, urgency, and freshness cues keep explicit text labels rather than relying on color
- denied and frozen access states remain visibly distinct from read-only posture
- exceptions detail moves to the support drawer without changing route family or losing the active exception reference
