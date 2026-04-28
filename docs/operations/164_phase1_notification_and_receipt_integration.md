# Phase 1 Notification And Receipt Integration

The integrated seam treats patient receipt truth and notification truth as related but distinct. A receipt may be locally acknowledged and safe to show before downstream transport or delivery evidence exists. This prevents the patient shell from overstating communication completion.

## Truth Ladder

| Ladder step | Authoritative record | Patient meaning | Must not imply |
| --- | --- | --- | --- |
| Local acknowledgement | `Phase1ConfirmationCommunicationEnvelope.localAckState=queued` | The practice system accepted the receipt for confirmation dispatch. | Message delivered. |
| Transport settlement | `Phase1ConfirmationTransportSettlement.outcome=accepted` | The simulator or provider accepted the message for processing. | Patient received or read it. |
| Delivery evidence | `Phase1ConfirmationDeliveryEvidence.deliveryEvidenceState=delivered` | Provider evidence says delivery occurred. | Clinical review completion. |
| Receipt bridge | `Phase1ConfirmationReceiptBridge.patientPostureState` | The patient-facing communication posture for the receipt. | A stronger state than the underlying evidence supports. |

## Worker Integration

The gateway constructs one notification worker using the command API confirmation repositories. This means the queued envelope, transport settlement, delivery evidence, and receipt bridge are all part of the same lineage chain.

The simulator route truth can be refreshed during the integrated worker advance. That models the later live-provider handoff without changing state meanings: the refresh can permit transport dispatch, but it cannot collapse queued, accepted, and delivered into one optimistic state.

## Operational Guardrails

- Keep `queued`, `delivery_pending`, `delivered`, and `recovery_required` as separate patient postures.
- Do not downgrade a valid receipt just because delivery evidence is pending.
- Do not promote `accepted` transport settlement to `delivered`.
- Preserve `PatientReceiptConsistencyEnvelope` as the shared receipt and minimal tracking family.
- Use request public id only as a BFF route key; the authoritative request ref remains in backend records.

## Recovery

If transport is rejected or timed out, the receipt remains visible with recovery posture. If delivery evidence arrives later, the same projection can update notification posture without changing the original request, receipt, or ETA meaning.
