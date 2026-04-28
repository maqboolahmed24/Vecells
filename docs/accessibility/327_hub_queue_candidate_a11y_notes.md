# 327 Hub Queue Candidate A11y Notes

## Landmark and structure

- keep the `326` `banner`, `nav`, and single `main`
- render the queue as a real ordered list of actionable rows
- keep callback fallback as its own article, not as a fake ranked row

## Keyboard order

- tab order on the active workbench stays queue row -> option card -> `DecisionDock`
- active queue-row selection is still visible when a buffered queue delta exists
- the `DecisionDock` remains reachable without crossing hidden drawers or hover-only controls

## Non-color status cues

- risk bands show label text as well as color
- trust, freshness, and reservation truth are published as text chips
- the breach-horizon bar includes a spoken label and percentage text
- callback fallback uses explicit title and summary language rather than color alone

## Reduced motion

- reduced-motion mode keeps the same visual order and emphasis
- transition durations collapse to `0.01ms`
- buffered/apply queue-delta semantics remain visible as static emphasis without animation dependence

## Focus and obscured content

- shell scroll padding stays in place from `326`
- focused queue rows, selected option cards, and the dominant `DecisionDock` action remain fully visible on both desktop and mission-stack layouts

## ARIA snapshots to keep

- normal queue state
- supplier-drift critical state
- callback-visible recovery state
