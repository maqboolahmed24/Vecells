# 362 Bounce-Back And Reopen Recovery Spec

## Scope

`par_362` replaces the remaining pharmacy assurance placeholder for bounce-back and reopen recovery with a real same-shell recovery workbench.

It covers:

- urgent return routing and monitored safety-net posture
- routine reopen posture anchored to the original request
- loop-risk escalation and supervisor review prominence
- patient message preview bound to the active return contract
- reopen diffs that compare the last calm-safe posture with the current recovery state
- one authoritative recovery `DecisionDock`

## Authoritative UI surfaces

- `PharmacyBounceBackQueue`
- `PharmacyReopenedCaseBanner`
- `PharmacyUrgentReturnMode`
- `OpenOriginalRequestAction`
- `PharmacyReturnMessagePreview`
- `PharmacyReopenDiffStrip`
- `PharmacyLoopRiskEscalationCard`

## Truth sources

The recovery preview binds the shell route to:

- `PharmacyBounceBackRecord`
- `PharmacyBounceBackTruthProjection`
- `PharmacyReturnNotificationTrigger`
- `PharmacyPracticeVisibilityProjection`
- `UrgentReturnDirectRouteProfile`
- `PharmacyBounceBackLoopSupervisorPosture`

The browser may compose these facts for presentation. It may not infer calmness, reopen priority, or escalation from local click state.

## Same-shell law

- recovery still lives on `/workspace/pharmacy/:pharmacyCaseId/assurance`
- the active case anchor remains on the pharmacy shell root
- recovery does not create a detached reopen page or modal
- original-request return, urgent route posture, and loop-risk escalation all remain visible in the same shell
- patient-safe message preview remains frozen against the active return contract or its lawful suppression

## Surface law

- `PHC-2103` proves urgent return and direct professional routing
- `PHC-2204` proves routine reopen on the original request anchor
- `PHC-2215` proves loop-risk escalation, supervisor review, and message suppression
- the promoted support region becomes `bounce_back_recovery` when the recovery preview is active

## Interface-gap note

`PHASE6_BATCH_356_363_INTERFACE_GAP_BOUNCE_BACK_AND_REOPEN.json` records the bounded seam: reopen diffs and original-request recovery bundles are still browser-composed from 353 truth because there is not yet one backend-owned `ReopenRecoveryProjection` family.

## Proof expectations

Playwright must prove that:

1. recovery renders as a child state of the same pharmacy shell
2. urgent return mode stays explicit and never reads as ordinary reassurance
3. original-request return remains visible and keyboard reachable
4. loop-risk escalation and auto-blocks remain more prominent than routine shell chrome
5. patient message preview is either contract-bound or explicitly suppressed
6. all recovery variants preserve the same-shell case anchor and route family
