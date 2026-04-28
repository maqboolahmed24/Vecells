# 251 Admin Resolution Subtype And Completion Runbook

This runbook covers the executable `251` backend surface.

## Normal operator flow

1. fetch subtype policy through `workspace_admin_resolution_subtype_policy_current`
2. open case through `workspace_task_open_admin_resolution_case`
3. reclassify subtype if the ingress bucket is `routed_admin_task`
4. enter waiting state only with the policy-backed owner, dependency shape, SLA source, and expiry or repair rule
5. cancel wait when the dependency clears
6. record completion artifact with typed evidence

## Allowed waiting states

- `awaiting_internal_action`
- `awaiting_external_dependency`
- `awaiting_practice_action`
- `patient_document_return`
- `identity_verification`

Each waiting entry must match the selected subtype profile. Free-text waiting reasons are not admissible.

## Routed ingress handling

`routed_admin_task` is only an ingress bucket. It must reclassify to a canonical subtype or freeze when the governed window elapses. The current implementation uses a four-hour window and surfaces the expiry as continuity freeze, not as silent queue aging.

## Completion artifact handling

Completion requires one `AdminResolutionCompletionArtifact`. The artifact records:

- completion type
- evidence refs
- patient expectation template ref
- artifact presentation contract ref
- visibility or release posture
- delivery outcomes where relevant

The completion artifact does not settle the overall case. Final `AdminResolutionSettlement`, dependency evaluation, and reopen-trigger handling remain owned by `252` and `254`.

## Accepted temporary seams

- patient expectation template bodies remain stable refs only until `253`
- final dependency evaluation, reopen-trigger calculation, and settlement remain downstream tasks
