# 239 Urgent Escalation And Contact Attempt Runbook

Task: `par_239`

## Query

- `GET /v1/workspace/tasks/{taskId}/approval-escalation`

## Approval commands

- `POST /internal/v1/workspace/tasks/{taskId}:evaluate-approval-requirement`
- `POST /v1/workspace/tasks/{taskId}/approval/{checkpointId}:request`
- `POST /v1/workspace/tasks/{taskId}/approval/{checkpointId}:approve`
- `POST /v1/workspace/tasks/{taskId}/approval/{checkpointId}:reject`
- `POST /internal/v1/workspace/tasks/{taskId}/approval/{checkpointId}:invalidate`

## Urgent escalation commands

- `POST /v1/workspace/tasks/{taskId}:start-urgent-escalation`
- `POST /internal/v1/workspace/tasks/{taskId}/urgent-escalation/{escalationId}/contact-attempts`
- `POST /v1/workspace/tasks/{taskId}/urgent-escalation/{escalationId}:record-outcome`

## Expected operator flow

1. select or reuse the current `DecisionEpoch`
2. run approval evaluation when the outcome rail needs the human checkpoint
3. request approval and wait for `pending -> approved` or `rejected`
4. for urgent work, start escalation
5. append each urgent contact attempt with a stable replay key
6. settle one urgent outcome against the same current epoch

## Recovery notes

- if approval is superseded, evaluate again against the replacement epoch
- if urgent escalation is cancelled on epoch drift, reopen the task from the replacement epoch instead of replaying stale contact work
- if the urgent path returns the case, use the generated `TriageReopenRecord` lineage rather than free-text notes
