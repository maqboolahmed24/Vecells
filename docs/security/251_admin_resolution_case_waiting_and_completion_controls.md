# 251 Admin Resolution Case Waiting And Completion Controls

The security posture for `251` is simple: bounded admin work may continue only while the governing tuple still proves it is bounded admin work.

## Mandatory controls

1. Generic waiting and generic completion are forbidden.
2. The current boundary tuple is the sole authority for whether admin consequence is still legal.
3. `AdminResolutionSubtypeProfile` is registry-backed and machine-checkable.
4. `AdminResolutionCompletionArtifact` is the only accepted proof that bounded admin work reached a typed completion posture.

## Waiting-state controls

Every waiting posture must declare:

- dependency shape
- owner
- SLA clock source
- expiry or repair rule

If any of those values drift from the subtype policy, the transition is rejected. Waiting may not become a generic bucket for deferred cleanup or undocumented practice work.

## Completion controls

No typed artifact means no valid completion. `AdminResolutionCompletionArtifact` therefore requires explicit completion evidence and refuses the generic “done” shortcut. Completion types that declare delivery posture, such as result notice delivery, must also carry delivery outcomes where relevant.

Raw artifact URLs are forbidden. The artifact must carry a governed artifact-presentation contract ref instead of an uncontrolled external link.

## Drift and freeze controls

If `clinicalMeaningState` is no longer `bounded_admin_only`, if `operationalFollowUpScope` is no longer `bounded_admin_resolution`, if `adminMutationAuthorityState` is no longer `bounded_admin_only`, or if the `DecisionEpoch` is superseded, the case is frozen for later reopen or clinician re-entry handling.

`routed_admin_task` may not remain indefinite. When its governed reclassification window elapses, continuity evaluation freezes the case and later tasks must reopen or escalate instead of preserving stale admin consequence.

Patient expectation template bodies are intentionally not inlined here. `251` publishes stable template refs only, with the concrete body material left to `253`.
