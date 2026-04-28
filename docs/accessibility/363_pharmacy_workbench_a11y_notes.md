# 363 Pharmacy Workbench Accessibility Notes

## Landmarks

- the pharmacy shell keeps one `banner` and one `main`
- the queue spine remains an `aside`
- the promoted support region remains a sibling section inside the same shell rather than a detached modal workflow

## Queue semantics

- `PharmacyOperationsQueueTable` is a real table with a caption
- each row keeps one button target for opening the case workbench
- waiting state, due posture, blockers, and risk cues remain in the same row so assistive users do not have to chase side panels for the operational summary

## Keyboard travel

- queue row buttons stay in the tab order
- route toggles remain ordinary buttons rather than custom tab widgets
- medication line selection stays button-based and keeps one expanded card at a time
- the sticky `DecisionDock` remains keyboard reachable after queue, checkpoint, and support-region travel

## Alerts and status

- blocked watch windows use alert semantics through `PharmacyWatchWindowBanner`
- non-blocking watch states use polite status semantics
- inventory and handoff surfaces do not silently convert blocked or provisional posture into reassuring copy

## Narrow-screen and reflow

- the mission-stack fold must keep queue, workbench, and promoted support region in one column without horizontal overflow
- the support region must not overlap the sticky decision dock
- tabular numerics remain visible at 320px and under zoomed conditions

## Reduced motion

- row morph, support-region promotion, and line expansion may animate
- reduced-motion mode must preserve the same information hierarchy with no motion-only explanation
