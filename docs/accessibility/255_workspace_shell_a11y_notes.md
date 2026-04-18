# 255 Workspace Shell Accessibility Notes

## Landmarks

- one primary `main` region for the shell
- explicit `nav` landmark inside `WorkspaceNavRail`
- sticky secondary panes remain `aside`, not nested `main`
- route wrapper `data-testid` markers stay stable across refresh and history navigation

## Keyboard

- nav rail items are buttons with visible focus
- queue workboard remains `role="listbox"`
- queue rows remain `role="option"` with `aria-selected`
- `ArrowUp`, `ArrowDown`, and `Enter` keep queue scanning keyboard-first

## Focus protection

- child routes keep the same shell and preserve anchor posture
- reduced-motion mode does not change route order or visible state order
- focus styling uses explicit outlines instead of relying on browser defaults

## Content

- no chart-only summaries on home
- plain-spoken labels for route posture, continuity, dominant action, and restore state
- search uses labeled input and does not depend on placeholder-only meaning

## Remaining seam

The queue, task, rapid-entry, and attachment/thread regions still use the bounded seed implementations. `256` to `259` will deepen those regions, but they must keep the same semantics and restore behavior already published here.
