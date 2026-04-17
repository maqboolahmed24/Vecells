# 244 Clinician Message Dispatch Receipt And Reply Controls

## Send fencing

Every message mutation is fenced by current:

- `ownershipEpoch`
- `fencingToken`
- `currentLineageFenceEpoch`
- thread version
- `ReviewActionLease` where the review session is active

Stale writers fail closed into same-shell recovery. They do not create stale send chains, stale close decisions, or stale callback escalation.

## Webhook verification

Provider receipts are accepted only under `phase3-message-hmac-sha256-simulator.v1`. The command-api requires:

- `x-vecells-message-timestamp`
- `x-vecells-message-signature`

Missing or invalid signatures fail with `MESSAGE_WEBHOOK_SIGNATURE_REJECTED`.

Receipt verification updates only the dispatch transport state. It does not grant delivered, reviewed, or closed posture by itself.

## Delivery authority split

`MessageDeliveryEvidenceBundle` is the sole durable delivery authority. Provider acceptance does not mean delivered truth. Security-sensitive rules are:

- provider acceptance may widen pending copy only
- delivered posture needs stored evidence
- contradictory late signals must settle as dispute, not silent overwrite
- repair posture must remain explicit until a governed resend path replaces it

## Reply routing and preemption

Patient replies attach to the current `ClinicianMessageThread` first. They carry classification and `needsAssimilation` so later `237` logic can decide:

- material delta
- safety preemption
- governed reopen

This keeps reply review provenance on the same lineage and prevents support-side or projection-side components from inventing reply truth.

## Closure and escalation guards

`ThreadResolutionGate` is the only authority for closure, repair routing, reopen, and callback escalation. The gate blocks close when:

- `ThreadExpectationEnvelope.patientVisibleState = delivery_repair_required`
- `ClinicianMessageThread.reSafetyRequired = true`

Transport optimism, support acknowledgement, or reply arrival alone may not close the thread.
