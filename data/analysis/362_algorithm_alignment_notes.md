# 362 Algorithm Alignment Notes

`par_362` binds the pharmacy assurance route to the 353 recovery truth family instead of inventing a parallel UI-owned state machine.

## Direct bindings

- `PharmacyReopenedCaseBanner`
  - `PharmacyBounceBackTruthProjection.reopenedCaseStatus`
  - `PharmacyPracticeVisibilityProjection.urgentReturnState`
- `PharmacyBounceBackQueue`
  - `PharmacyBounceBackRecord.materialChange`
  - `PharmacyBounceBackTruthProjection.reopenSignal`
  - `PharmacyBounceBackTruthProjection.autoRedispatchBlocked`
  - `PharmacyBounceBackTruthProjection.autoCloseBlocked`
- `PharmacyUrgentReturnMode`
  - `UrgentReturnDirectRouteProfile.routeClass`
  - `UrgentReturnDirectRouteProfile.directRouteRef`
  - `UrgentReturnDirectRouteProfile.fallbackRouteRef`
  - `UrgentReturnDirectRouteProfile.monitoredSafetyNetRequired`
- `OpenOriginalRequestAction`
  - `PharmacyBounceBackTruthProjection.reacquisitionMode`
  - `PharmacyBounceBackTruthProjection.returnedTaskRef`
- `PharmacyReturnMessagePreview`
  - `PharmacyReturnNotificationTrigger.notificationState`
  - `PharmacyReturnNotificationTrigger.channelHint`
  - `PharmacyReturnNotificationTrigger.selectedAnchorRef`
  - `PharmacyReturnNotificationTrigger.activeReturnContractRef`
- `PharmacyLoopRiskEscalationCard`
  - `PharmacyBounceBackLoopSupervisorPosture.loopRisk`
  - `PharmacyBounceBackLoopSupervisorPosture.reopenPriorityBand`
  - `PharmacyBounceBackLoopSupervisorPosture.supervisorReviewState`
  - `PharmacyBounceBackLoopSupervisorPosture.autoRedispatchBlocked`
  - `PharmacyBounceBackLoopSupervisorPosture.autoCloseBlocked`

## Composed preview seam

There is not yet one backend-owned recovery projection that groups reopen diffs and original-request framing. 362 therefore composes:

- `PharmacyReopenDiffStrip`
- `OpenOriginalRequestAction`
- the narrative grouping inside `PharmacyBounceBackQueue`

That seam is recorded in `PHASE6_BATCH_356_363_INTERFACE_GAP_BOUNCE_BACK_AND_REOPEN.json`.

## Recovery route law

- route family stays `rf_pharmacy_console`
- promoted support region becomes `bounce_back_recovery`
- recovery root attributes never infer calmness from local component state
- urgent, routine, and escalated recovery all remain under one shell-level recovery posture
