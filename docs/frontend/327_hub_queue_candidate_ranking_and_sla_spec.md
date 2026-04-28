# 327 Hub Queue Candidate Ranking And SLA Spec

## Purpose

`par_327` turns the hub shell into a real coordination workbench. It must let coordinators:

- trust the authoritative queue order without local browser resort
- understand why a case sits where it does from risk, trust, freshness, and blocker truth
- compare ranked candidate cards without opaque scores or fake exclusivity
- keep the selected row, selected option, and right-rail consequence preview pinned while live queue deltas buffer through `QueueChangeBatch`

The route keeps the existing `326` shell root, status strip, continuity binder, and saved-view navigation. The new workbench mounts inside that shell.

## Visual Mode

- visual mode: `Hub_Queue_Risk_Workbench`
- shell root visual mode remains `Hub_Desk_Mission_Control`
- queue workbench publishes `data-queue-visual-mode="Hub_Queue_Risk_Workbench"`

## Layout

### Queue and case routes

- left workbench: `336px`
- centre candidate pane: `minmax(640px, 1fr)`
- right rail: `384px`
- region gap: `16px`
- inner region rhythm: `16px` to `24px`

The shell route rail is preserved as top navigation for `queue` and `case` so the workbench gets the full width required by the queue, candidate, and decision surfaces.

### Narrow layouts

- below `1280px`, the right rail drops beneath the workbench and candidate panes
- below `960px`, the route stays `mission_stack`
- fold and unfold preserve the same selected queue row, selected option, and dominant action

## Regions

### Left workbench

- `HubQueueSavedViewToolbar`
- `HubRiskBandStrip`
- buffered `QueueChangeBatch` notice
- authoritative queue row list rendered through `HubQueueRow`

### Centre pane

- `HubBestFitNowStrip`
- `HubBreachHorizonMeter`
- `HubEscalationBannerLane`
- grouped `HubOptionCardStack`
- callback fallback card below ranked groups when legal
- `HubCaseStageHost` remains present on the `case` route for `326` continuity

### Right rail

- `HubDecisionDockHost`
- `HubInterruptionDigestPanel`

## Queue law

- browser filtering is allowed
- browser reranking is forbidden
- the queue may change order only through the declared buffered/apply flow
- the selected case remains pinned while the batch is buffered and after it is applied
- if the selected row no longer exists, the shell must render explicit invalidation or replacement instead of silently switching the active case

## Option-card law

- cards group by `windowClass`
- every card exposes:
  - title line with time, site, and modality
  - secondary line with travel, wait, and manage posture
  - trust chip
  - freshness chip
  - reservation-truth chip
  - offerability chip
  - plain-language rank reasons
- cards never render opaque scores
- `truthful_nonexclusive` and `no_hold` must not look like a hold
- callback fallback never inherits slot ordinal numbering or slot DOM markers

## Risk and SLA law

- one slim breach-horizon bar shows risk pressure without fake precision
- risk bands publish both color and text
- critical escalation banners stay rare and banner-only truth belongs to `HubEscalationBannerProjection`
- acknowledgement debt, confirmation pending, freshness, and ordinary queue watch states stay in the shared status strip or row/candidate surfaces, not in extra banners

## DOM markers

- `data-hub-queue-row`
- `data-risk-band`
- `data-selected-case`
- `data-option-card`
- `data-reservation-truth`
- `data-callback-fallback`
- `data-breach-visualization`

## Proof requirements

- queue order stays authoritative under buffered and applied deltas
- best-fit strip and `DecisionDock` stay in parity with the selected option
- callback fallback remains separate from ranked slot cards
- keyboard order flows queue row -> option card -> `DecisionDock`
- reduced motion preserves the same order and emphasis without motion-heavy transitions
