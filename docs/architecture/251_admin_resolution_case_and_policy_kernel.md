# 251 Admin Resolution Case And Policy Kernel

`251` publishes the executable bounded admin-resolution policy layer for Phase 3. It introduces three durable objects:

- `AdminResolutionCase`
- `AdminResolutionSubtypeProfile`
- `AdminResolutionCompletionArtifact`

The kernel exists to make bounded admin follow-up a typed domain instead of a generic queue bucket. `AdminResolutionCase` opens only from a legal bounded-admin tuple and carries the current `DecisionEpoch`, `lineageFenceEpoch`, and `boundaryTupleHash` forward as the governing consequence fence.

## Opening law

`AdminResolutionCase` may open only while the current boundary still proves:

- `decisionState = admin_resolution`
- `clinicalMeaningState = bounded_admin_only`
- `operationalFollowUpScope = bounded_admin_resolution`
- `adminMutationAuthorityState = bounded_admin_only`
- `reopenState = stable`
- current unsuperseded `DecisionEpoch`

The command-api wrapper consumes the current `249` boundary tuple and the current `240` `AdminResolutionStarter`. It normalizes known legacy subtype labels into the canonical registry so migration can happen without silently preserving prose routing.

## Registry-backed subtype policy

`AdminResolutionSubtypeProfile` is a first-class registry row. It declares queue, waiting-reason, completion-artifact, patient-expectation, external-dependency, and reopen policy refs. The initial canonical subtype set is:

- `document_or_letter_workflow`
- `form_workflow`
- `result_follow_up_workflow`
- `medication_admin_query`
- `registration_or_demographic_update`
- `routed_admin_task`

`routed_admin_task` is a bounded ingress bucket. It must reclassify within the governed window. In the current kernel that window is four hours, after which continuity evaluation freezes the case.

## Waiting and completion law

Generic waiting is forbidden. Every waiting transition binds one declared dependency shape, owner, SLA clock source, and expiry or repair rule from the selected subtype policy.

`AdminResolutionCompletionArtifact` is typed proof, not a button click. It binds completion evidence, patient expectation refs, artifact-presentation contracts, release or visibility posture, and delivery outcomes where relevant. `AdminResolutionCompletionArtifact` is typed proof but it is not final `AdminResolutionSettlement`; `254` still owns final settlement and cross-domain re-entry.

## Freeze behavior

If the current tuple stops proving bounded admin-only work, the case no longer has authority to continue. Boundary drift, decision supersession, reopen drift, or elapsed routed-ingress reclassification windows all force the effective case posture to `frozen`.

That freeze is query-visible and mutation-blocking. `251` therefore publishes stable policy refs for `252`, `253`, and `254` without pretending those later tasks are already complete.
