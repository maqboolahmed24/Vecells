# 264 Algorithm Alignment Notes

## Source order

1. `blueprint/callback-and-clinician-messaging-loop.md`
2. `blueprint/staff-workspace-interface-architecture.md`
3. `blueprint/phase-0-the-foundation-protocol.md`
4. `blueprint/platform-frontend-blueprint.md`
5. validated frontend shells from `255` to `263`

## Lifecycle mapping

- `ClinicianMessageThread` drives the visible thread state. The worklist and chronology do not infer local delivery states.
- `MessageDispatchEnvelope` is the only current send record shown in the masthead and chronology.
- `MessageDeliveryEvidenceBundle` is the only authority that can lift the ladder to durable delivery.
- `ThreadExpectationEnvelope` is the only current patient-facing meaning surface.
- `ThreadResolutionGate` decides whether resend, reissue, channel change, attachment recovery, route repair, or callback fallback is legal.

## Mandatory closures

- Close the provider-accepted-equals-delivered gap: transport accepted remains visibly distinct from durable delivery.
- Close the detached-repair-page gap: dispute review and repair stay in the same shell as chronology and patient context.
- Close the stale-thread-write gap: tuple drift or contradictory same-fence evidence drops the thread into stale-recoverable or recovery-only posture.
- Close the silent-contradictory-receipt gap: contradictory receipt review becomes an explicit stage with pinned evidence refs.
- Close the hidden-attachment-recovery gap: attachment recovery is rendered inline as a current legal repair path when that is the failure mode.

## UI state map

- `transport_accepted` + `provider_accepted` + `awaiting_delivery_evidence` -> hold, do not reassure, keep resend blocked
- `evidence_delivered` + `durable_delivery` + `reply_window_open` -> calm chronology with no dominant repair path
- `disputed` + `contradictory_signal` + `repair_route` -> stale-recoverable thread, dispute stage visible, route repair or callback fallback dominant
- `repair_pending` + `failed` + `repair_route` -> attachment recovery is current and reissue stays blocked until the checkpoint is satisfied
- `stale_recoverable` -> preserve selected anchor, chronology context, and repair lane while freezing mutation
- `blocked` -> preserve last safe thread context but keep repair actions visibly non-writable
