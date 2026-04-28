# 243 Callback Attempt Window And Retry Runbook

This runbook covers the executable callback routes introduced in task 243.

## Primary command path

1. `POST /v1/workspace/tasks/{taskId}:create-callback-case`
2. `POST /v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:schedule`
3. `POST /internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:arm-ready`
4. `POST /internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:initiate-attempt`
5. `POST /internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-provider-receipt`
6. `POST /internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-outcome-evidence`
7. `POST /internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:settle-resolution-gate`

Supporting mutation routes:

- `:reschedule`
- `:cancel`
- `:reopen`

## Operator rules

- do not treat telephony-provider progress as settled callback truth
- do not widen or complete the callback promise outside `CallbackExpectationEnvelope`
- reschedule only after rotating `CallbackIntentLease` when the route or service window drifts materially
- if provider evidence or route validity drifts during an active promise, move the callback into `contact_route_repair_pending`

## Retry and escalation

`CallbackResolutionGate` owns retry and escalation timing. The operator runbook is:

1. inspect the latest `CallbackAttemptRecord`
2. inspect the latest `CallbackOutcomeEvidenceBundle`
3. inspect the latest `CallbackExpectationEnvelope`
4. settle `retry`, `escalate`, `complete`, `cancel`, or `expire`

Do not repair retry timing by editing stale queue metadata. Regenerate the envelope revision and let the callback domain publish the next patient-visible state.

## Webhook incident handling

If the provider callback fails verification:

- keep the callback case unchanged
- record the incident in operational logs
- replay only after a valid signed callback is received

If duplicate receipts arrive:

- exact replay and semantic replay should reuse the live receipt checkpoint
- only scope drift or contradictory receipt chains should escalate into replay-collision review

## Current operational gaps

- the telephony transport is still simulator-backed
- the stricter tenant voicemail policy registry is still local-resolver-backed with safer defaults
