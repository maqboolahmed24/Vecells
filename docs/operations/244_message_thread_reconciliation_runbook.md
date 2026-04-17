# 244 Message Thread Reconciliation Runbook

## Command surface

Primary routes:

- `GET /v1/workspace/tasks/{taskId}/message-thread`
- `POST /v1/workspace/tasks/{taskId}:create-message-thread`
- `POST /v1/workspace/tasks/{taskId}/message-thread/{threadId}:save-draft`
- `POST /v1/workspace/tasks/{taskId}/message-thread/{threadId}:approve-draft`
- `POST /v1/workspace/tasks/{taskId}/message-thread/{threadId}:send`
- `POST /internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-provider-receipt`
- `POST /internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-delivery-evidence`
- `POST /v1/workspace/tasks/{taskId}/message-thread/{threadId}:ingest-reply`
- `POST /internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:settle-resolution-gate`
- `POST /internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:reopen`

## Normal operator flow

1. Create the thread from the live `ClinicianMessageSeed`.
2. Save or refine draft text.
3. Approve the thread when approval is required.
4. Send once through the immutable `MessageDispatchEnvelope`.
5. Reconcile signed provider receipts.
6. Write one `MessageDeliveryEvidenceBundle`.
7. Accept patient reply through `ClinicianMessageThread`.
8. Settle `ThreadResolutionGate` to `review_pending`, `repair_route`, `escalate_to_callback`, `close`, or `reopen`.

## Failure handling

### Duplicate send

Check the current bundle. If the same dispatch fence and thread version already produced a `MessageDispatchEnvelope`, reuse it. Do not mint a second live send chain.

### Unsigned or replayed receipt

Reject unsigned receipts immediately. Exact replay and semantic replay must collapse onto the same `AdapterReceiptCheckpoint` chain rather than creating a second delivery truth record.

### Contradictory evidence

If delivered evidence is already stored and later failure evidence appears, treat the thread as disputed workflow. Do not overwrite delivered truth.

### Delivery repair

Route repair must remain visible through `ThreadExpectationEnvelope.patientVisibleState = delivery_repair_required` until later reachability work in `245` provides the governed resend path.

### Reply review

After reply intake, the thread moves into review posture and may emit `reply_assimilation` outbox work. Do not close the thread until reply review and any resafety preemption are settled.
