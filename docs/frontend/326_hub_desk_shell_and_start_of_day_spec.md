# 326 Hub Desk Shell And Start Of Day Spec

## Purpose

`par_326` turns `apps/hub-desk` from a route seed into the first real Phase 5 hub shell. The shell owns:

- one stable route family across `/hub/queue`, `/hub/case/:hubCoordinationCaseId`, `/hub/alternatives/:offerSessionId`, `/hub/exceptions`, and `/hub/audit/:hubCoordinationCaseId`
- one start-of-day entry that presents exactly one dominant resume path at a time
- one authoritative shell-level status strip for freshness, visibility, ownership, and recovery posture
- one continuity binder that preserves saved view, selected queue row, and active case anchor across refresh and browser history

## Layout

### Queue entry

- left rail: `HubSavedViewRail`
- primary stage: `HubStartOfDayResumeCard`, `HubQueueEntryStrip`, subdued `HubCaseStageHost`
- secondary rail: `HubInterruptionDigestPanel`
- shell posture: `two_plane` on wide desktop, `mission_stack` on narrow viewports

### Case and child routes

- left rail: `HubQueueEntryStrip`
- centre host: `HubCaseStageHost`
- right column: `HubInterruptionDigestPanel` plus `HubRightRailHost`
- shell posture: `three_panel` on wide desktop, `mission_stack` on narrow viewports

## Component ownership

- `HubDeskShellFrame`
  Owns shell chrome, route-family markers, masthead, layout switching, and same-shell continuity.
- `HubStartOfDayView`
  Owns the queue route composition and ensures only one dominant action region is visually primary.
- `HubSavedViewRail`
  Owns route entry, saved-view selection, and acting-context explanation.
- `HubStartOfDayResumeCard`
  Owns the singular start-of-day dominant action.
- `HubInterruptionDigestPanel`
  Owns the bounded digest for stale-owner risk, acknowledgement debt, callback blockage, and supplier drift.
- `HubQueueEntryStrip`
  Owns the pinned queue-row anchor and queue-entry summaries.
- `HubStatusAuthorityStrip`
  Owns shell-level freshness, ownership, visibility, and recovery semantics.
- `HubCaseStageHost`
  Owns placeholder route hosts for `case`, `alternatives`, `exceptions`, and `audit`.
- `HubShellContinuityBinder`
  Owns persisted shell ledger markers for saved-view, queue-anchor, and case-anchor restoration.
- `HubOwnershipContextChip`
  Owns claimed, observe-only, transfer-pending, and takeover-required shell cues.

## Continuity rules

- Saved-view changes write one new browser-history state entry even when the route path is unchanged.
- Queue-row selection writes one new browser-history state entry so browser back restores the anchor rather than only the path.
- Refresh restores from `window.history.state.hubDesk` first and local storage second.
- Child-route return always resolves back to the active case shell path, not a detached review page.

## State rules

- `shell_live`
  Writable posture is allowed only when the current saved view, current case ownership, and route mode all support live mutation.
- `shell_read_only`
  Used for observe-only or audit posture; shell continuity stays intact but dominant actions demote to review-only posture.
- `shell_recovery_only`
  Used when callback blockage, stale-owner recovery, or supplier drift is the governing posture; the shell may widen recovery but not imply calmness.

## DOM markers

Published on the shell root:

- `data-shell="hub"`
- `data-hub-route-family`
- `data-current-path`
- `data-view-mode`
- `data-layout-mode`
- `data-selected-case-id`
- `data-selected-anchor`
- `data-saved-view-id`
- `data-shell-status`
- `data-artifact-mode`
- `data-dominant-action`

Published within the shell:

- `data-hub-start-of-day`
- `data-dominant-region`
- `data-selected-anchor`
- `data-dom-marker="focus-restore"`

## Deferred detail owned by later tasks

- `327` fills the centre queue workbench and candidate stack inside the reserved `HubCaseStageHost`.
- `328` fills the alternatives child route.
- `329` fills cross-org confirmation, proof, and practice-visibility detail.
- `330` fills reminder and manage surfaces.
- `331` fills exception-queue and no-slot recovery detail.
