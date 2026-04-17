# 238 Endpoint Decision Preview And Supersession Runbook

## Command Surfaces

Operational command surfaces:

- `GET /v1/workspace/tasks/{taskId}/endpoint-decision`
- `POST /v1/workspace/tasks/{taskId}:select-endpoint`
- `POST /internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:update-payload`
- `POST /internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:preview`
- `POST /internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:regenerate-preview`
- `POST /v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:submit`
- `POST /internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:invalidate`

## Normal Flow

1. reviewer selects endpoint
2. kernel mints or reuses the live `DecisionEpoch`
3. payload is updated
4. deterministic preview is generated
5. approval burden is evaluated
6. submit either:
   - commits and moves the task to `endpoint_selected`
   - returns `blocked_approval_gate`
   - returns `blocked_policy`
   - returns `stale_recoverable`

If the task lease has expired but the workspace tuple is otherwise current, the runtime reacquires the lifecycle lease first and then resumes the endpoint command on the refreshed tuple.

## Supersession Response

Use `:invalidate` when:

- selected anchor drift is detected
- publication tuple drift is detected
- trust posture downgrades
- evidence or safety tuple changes make the preview stale
- manual replacement is required

Expected result:

- append one `DecisionSupersessionRecord`
- old preview becomes `recovery_only`
- new live epoch is minted
- new draft decision is available for recommit

## Operational Checks

Review these objects together:

- latest `DecisionEpoch`
- latest `EndpointDecision`
- current `EndpointDecisionBinding`
- latest `ApprovalRequirementAssessment`
- latest `EndpointOutcomePreviewArtifact`
- latest `DecisionSupersessionRecord`

If `bindingState` is not `live`, treat the path as non-committable even if a preview exists.

## Known Deferred Seam

Direct downstream consequence seeds remain owned by `240`.
`238` intentionally stops at preview, binding, submit-safe commitment, and authoritative task transition.
