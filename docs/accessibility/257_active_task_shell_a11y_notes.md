# 257 Active Task Shell Accessibility Notes

## Scope

These notes cover the active task shell introduced by `257`.

## Keyboard

- the task route keeps one stable tab sequence: shell header, queue, `CasePulseBand`, `TaskStatusStrip`, canvas, `DecisionDock`
- `DecisionDock` buttons remain standard buttons and are reachable without pointer-only interaction
- child-route entry stays keyboard reachable from the dock
- the sticky dock must not trap focus when the page scrolls

## Reduced motion

- motion-reduced mode removes hover and position animation emphasis
- the dock still remains sticky, but transitions collapse to near-zero duration
- mission-stack layouts may not depend on motion to reveal the dock or promoted support region

## Headings and region structure

- `CasePulseBand`, `TaskStatusStrip`, `TaskCanvas`, and `DecisionDock` all stay visible in the same route
- stack headings stay descriptive and ordered
- `ReferenceStack` uses a native disclosure pattern

## Status writing

- shell-level save and freshness state stays in one shared task status strip
- blocked or read-only posture is explained in the dock instead of implied by disabled-looking chrome alone
- support promotion stays localized and does not become multiple stacked alerts

## Contrast and focus

- focus-visible remains explicit on dock actions, shortlist chips, search inputs, and queue rows
- dense stack rows rely on text plus tone, not color alone
- superseded context uses text markers as well as subtle visual treatment
