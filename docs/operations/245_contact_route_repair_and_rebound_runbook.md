# 245 Contact Route Repair And Rebound Runbook

## Primary routes

- `GET /v1/workspace/tasks/{taskId}/communication-repair`
- `POST /internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-reachability`
- `POST /internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-reachability`
- `POST /v1/workspace/tasks/{taskId}/communication-repair/{bindingId}:attach-candidate-route`
- `POST /v1/workspace/tasks/{taskId}/communication-repair/{bindingId}:issue-verification`
- `POST /v1/workspace/tasks/{taskId}/communication-repair/{bindingId}/verification/{checkpointId}:settle`
- `POST /v1/workspace/tasks/{taskId}/message-thread/{threadId}:authorize-repair-action`
- `POST /v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:authorize-reschedule`

## Operator sequence

1. Record failure or drift evidence.
2. Query the current communication repair bundle.
3. Attach a candidate route snapshot.
4. Issue one verification checkpoint.
5. Settle verification.
6. Retry controlled resend, channel change, attachment recovery, or callback reschedule only after the repair chain is clear.

## Expected outcomes

- bounce or invalid route opens same-shell repair immediately
- repeated no-answer can escalate from retry posture into repair posture
- verification failure keeps the repair journey open
- verification success closes the repair journey, writes rebound history, and revokes the temporary repair-entry grant
