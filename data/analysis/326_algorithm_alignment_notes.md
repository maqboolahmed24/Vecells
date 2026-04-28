# 326 Algorithm Alignment Notes

## Region-to-projection map

| Shell region | Governing projection or contract | 326 use |
| --- | --- | --- |
| `HubSavedViewRail` | `HubConsoleConsistencyProjection`, `RouteFamilyOwnershipClaim`, `SelectedAnchorPolicy` | Restores saved-view and route continuity without reconstructing chrome locally |
| `HubStatusAuthorityStrip` | `HubPostureProjection`, `PracticeVisibilityProjection`, `HubContinuityEvidenceProjection` | Owns shell freshness, ownership, visibility, and recovery cues in one authoritative strip |
| `HubStartOfDayResumeCard` | `HubQueueWorkbenchProjection`, `HubCaseConsoleProjection` | Exposes one dominant resume path instead of a dashboard wall |
| `HubQueueEntryStrip` | `HubQueueWorkbenchProjection`, `QueueChangeBatch` | Keeps the queue row and case anchor pinned even before the richer 327 workbench lands |
| `HubInterruptionDigestPanel` | `HubCoordinationException`, `HubSupplierMirrorState`, `PracticeVisibilityProjection` | Binds stale-owner risk, acknowledgement debt, callback blockage, and supplier drift into one bounded digest |
| `HubCaseStageHost` | `HubCaseConsoleProjection` and later `AlternativeOfferSession`, `HubManageSettlement`, `HubContinuityEvidenceProjection` | Reserves the later route-host surfaces inside one stable shell family |
| `HubShellContinuityBinder` | `NavigationStateLedger`, continuity evidence, selected-anchor policy | Persists saved-view, queue-anchor, and case-anchor restoration across refresh and history |

## Dominant-action law

- On `/hub/queue`, only `HubStartOfDayResumeCard` may be visually dominant.
- On child routes, `HubCaseStageHost` becomes the dominant route host, while the status strip remains shell-authoritative and the digest stays subordinate.
- Interruption items may escalate visually only inside the digest or route host; they do not create a second shell-wide strip or dashboard banner in 326.

## Degradation law

- `shell_read_only`
  Observe-only or audit posture preserves shell continuity and summary context but disables writable posture.
- `shell_recovery_only`
  Recovery-required posture preserves context and queue anchor while restricting dominant action to governed recovery.

## Continuity law

- History state is written for saved-view and queue-row changes even when the pathname stays constant.
- Child-route return always resolves to the active case route, not to a generic queue or detached proof surface.
- Local storage is only a fallback; `window.history.state.hubDesk` is the first restore source.
