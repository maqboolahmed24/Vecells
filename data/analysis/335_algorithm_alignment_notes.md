# 335 Algorithm Alignment Notes

## Local source-of-truth

Task `335` follows the local blueprint first:

- `blueprint/phase-5-the-network-horizon.md`
- `blueprint/phase-0-the-foundation-protocol.md`
- validated outputs from `322`, `324`, `325`, `329`, and `334`

The MESH control plane exists to support those already-frozen objects. It does not create a new truth model.

## Route-purpose mapping

| Route purpose | Workflow | Primary objects | What transport may prove | What transport may not prove |
| --- | --- | --- | --- | --- |
| `practice_visibility_notice` | `WG_HUB_PRACTICE_VISIBILITY / VEC_HUB_BOOKING_NOTICE` | `PracticeContinuityMessage`, `PracticeVisibilityProjection`, `HubContinuityEvidenceProjection` | message accepted, queued, delivered | practice acknowledgement, booked calmness, request closure |
| `practice_business_ack` | `WG_HUB_PRACTICE_VISIBILITY / VEC_HUB_BOOKING_ACK` | `PracticeAcknowledgementRecord`, live `ackGeneration`, `PracticeContinuityMessage` | mailbox pickup and responder delivery path | a current business acknowledgement unless the generation and tuple match |
| `practice_visibility_refresh_after_reminder` | `WG_HUB_PRACTICE_VISIBILITY / VEC_HUB_BOOKING_NOTICE` | `NetworkReminderPlan`, `PracticeVisibilityProjection`, `HubManageSettlement` | route reachability and duplicate-safe reminder refresh dispatch | refreshed practice continuity acknowledgement |
| `hub_manual_recovery_follow_up` | `WG_HUB_MANUAL_RECOVERY / VEC_HUB_RECOVERY_ACTION` | `HubFallbackRecord`, `HubReturnToPracticeRecord`, `HubCoordinationException` | recovery dispatch and replay-safe resend proof | recovery settlement or closure |
| `servicing_site_relay_notice` | `WG_HUB_PRACTICE_VISIBILITY / VEC_HUB_BOOKING_NOTICE` | `CrossOrganisationVisibilityEnvelope`, `PracticeVisibilityProjection`, `HubAppointmentRecord` | observe-only relay binding | practice acknowledgement or patient-visible completion |

## Generation-bound acknowledgement law

`335` must preserve the `322` rule:

- delivery evidence can move a message from continuity-pending to ack-pending
- only a current-generation `PracticeAcknowledgementRecord` can clear live acknowledgement debt
- route verification is not allowed to flatten transport acceptance into business acknowledgement

That is why the verifier emits:

- `transport_only_not_acknowledged`
- `business_ack_generation_bound`
- `transport_only_not_recovery_settled`

## Reminder and manage carry-forward

`324` introduced `NetworkReminderPlan`, `HubManageSettlement`, and refreshed `PracticeVisibilityProjection`.

For `335`, that means:

- reminder-related practice visibility traffic stays on the same explicit continuity rail
- route purpose must still distinguish reminder refresh from booking confirmation
- the manifest must show that the workflow is shared while the business object family is different

## Replay and duplicate alignment

The local protocol requires replay-safe, idempotent external effects.

For MESH route proof this becomes:

- same route purpose + same workflow + same environment + same current generation => replay, not a new route fact
- stale ordering must stay stale
- duplicate receipt cannot overwrite or calm later truth

The verifier therefore requires the route-decision family:

- `accepted_new`
- `semantic_replay`
- `stale_ignored`
- route-purpose-specific guardrail classes

## Environment law

`path_to_live_integration` is not treated as a mailbox-backed route.

It is represented only as:

- pre-mailbox API rehearsal
- not route verification
- not deployment proof

`path_to_live_deployment` is the first NHS-managed environment that can hold the real mailbox rows, but those rows remain manual-bridge controlled until lawful onboarding access is available.
