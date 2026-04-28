# 313 Phase 5 offer, commit, confirmation, and practice visibility contract

Task: `seq_313_phase5_freeze_cross_org_booking_commit_and_practice_visibility_contracts`  
Date: `2026-04-22`

## Outcome

This freeze pack establishes one authoritative Phase 5 contract family for:

- alternative offers and callback fallback
- fenced commit attempts and proof bundles
- monotone offer-to-confirmation truth
- outward practice continuity messaging
- generation-bound acknowledgement debt
- minimum-necessary origin-practice visibility
- leased network manage exposure

The local blueprint remains authoritative. Official references only shaped transport realism, NHS transactional copy discipline, and browser-proof technique.

## Source order

1. `blueprint/phase-cards.md#Card-6`
2. `blueprint/phase-5-the-network-horizon.md#5E. Alternative offer generation, open choice, callback fallback, and patient continuity`
3. `blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging`
4. `blueprint/phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility`
5. `blueprint/phase-4-the-booking-engine.md#booking-truth-confirmation-and-practice-visibility-carry-forward`
6. `blueprint/phase-4-the-booking-engine.md#manage-and-artifact-exposure-must-follow-current-truth`
7. `blueprint/phase-0-the-foundation-protocol.md#replay-idempotency-and-external-effect-discipline`
8. `blueprint/phase-0-the-foundation-protocol.md#adapter-receipts-checkpoints-and-external-settlement`
9. `docs/architecture/311_phase5_hub_case_and_acting_context_contract.md`
10. `docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md`
11. `docs/api/312_phase5_candidate_snapshot_and_rank_contract.md`

## Frozen object pack

| Object | Artifact | Key law |
| --- | --- | --- |
| AlternativeOfferSession | data/contracts/313_alternative_offer_session.schema.json | Preserves open choice, live offer-set hash, and same-shell continuity. |
| AlternativeOfferEntry | data/contracts/313_alternative_offer_entry.schema.json | Represents ranked offer rows only; callback never takes a rank ordinal. |
| AlternativeOfferFallbackCard | data/contracts/313_alternative_offer_fallback_card.schema.json | Remains a separate fallback card and preserves callback provenance. |
| HubCommitAttempt | data/contracts/313_hub_commit_attempt.schema.json | The only object allowed to talk to a native booking adapter or ingest imported confirmation. |
| HubBookingEvidenceBundle | data/contracts/313_hub_booking_evidence_bundle.schema.json | Carries confirmation confidence, hard-match result, and current tuple correlation. |
| HubAppointmentRecord | data/contracts/313_hub_appointment_record.schema.json | Durable appointment truth only after the confirmation gate passes on the live tuple. |
| HubOfferToConfirmationTruthProjection | data/contracts/313_hub_offer_to_confirmation_truth_projection.schema.json | Single monotone truth bridge from offer through practice-visible confirmation. |
| PracticeContinuityMessage | data/contracts/313_practice_continuity_message.schema.json | Separates transport acceptance, delivery evidence, risk, and acknowledgement evidence. |
| PracticeAcknowledgementRecord | data/contracts/313_practice_acknowledgement_record.schema.json | Generation-bound acknowledgement debt clearance only for the live tuple and live generation. |
| PracticeVisibilityProjection | data/contracts/313_practice_visibility_projection.schema.json | Minimum-necessary, envelope-bound, scope-bound origin-practice projection. |
| NetworkManageCapabilities | data/contracts/313_network_manage_capabilities.schema.json | Leased manage authority that degrades to stale, blocked, or expired instead of leaving stale CTAs live. |
| PracticeVisibilityDeltaRecord | data/contracts/313_practice_visibility_delta_record.schema.json | Monotone-safe delta that may not lower ackGeneration or supersede newer envelopes. |

## Commit modes

| Mode | What it means | What it may never imply |
| --- | --- | --- |
| native_api | A live supplier-side commit path executed under the current reservation fence and provider binding. | Booked truth before the confirmation gate clears. |
| manual_pending_confirmation | Structured manual proof exists, but it remains provisional until authoritative confirmation is correlated. | Calm booked reassurance or automatic practice acknowledgement. |
| imported_confirmation | Imported evidence exists and may support confirmation only after lawful correlation to the live tuple and live binding. | Quietly minting booked truth from unsolicited, wrong-case, or ambiguous evidence. |

## Monotone projection contract

| Facet | Current values carried in the projection | Why it stays separate |
| --- | --- | --- |
| Offer posture | no_live_offer, live_offer, selected, fallback_selected, superseded | Prevents open choice, selected choice, fallback choice, and superseded provenance from collapsing. |
| Confirmation truth | offer_only, commit_pending, confirmation_pending, confirmed_pending_practice_ack, confirmed, disputed, blocked_by_drift | Prevents manual or imported proof from quietly looking confirmed. |
| Patient confirmation | not_shown, pending_copy, calm_confirmed, blocked | Lets patient reassurance calm only after authoritative confirmation. |
| Practice visibility | not_informed, transport_pending, delivered_pending_ack, ack_pending, acknowledged, stale_generation, blocked | Keeps practice informed and practice acknowledged distinct. |
| Closure | not_closable, closable, closed | Prevents close while acknowledgement, fallback, or manage drift blockers remain open. |

## Truth-tuple law

The following artifacts are required to carry the same live `truthTupleHash`:

- `AlternativeOfferSession`
- `HubCommitAttempt`
- `HubBookingEvidenceBundle`
- `HubAppointmentRecord`
- `PracticeContinuityMessage`
- `PracticeAcknowledgementRecord`
- `PracticeVisibilityProjection`
- `NetworkManageCapabilities`

If a later tuple supersedes that hash, older objects remain auditable only. They may not settle booked calmness, clear acknowledgement debt, or keep stale manage CTAs live.

## Practice continuity and acknowledgement law

| Lane | Carrier object | Meaning |
| --- | --- | --- |
| Transport acceptance | PracticeContinuityMessage.transportState | Cross-organisation transport accepted or rejected the send attempt. |
| Delivery evidence | PracticeContinuityMessage.deliveryState | A message became available, downloaded, expired, or failed independently of acknowledgement. |
| Delivery risk | PracticeContinuityMessage.deliveryRiskState | Operational risk lane for non-delivery, timeout, or failure. |
| Acknowledgement evidence | PracticeAcknowledgementRecord | Current-generation acknowledgement or audited exception under the live tuple. |

## Minimum-necessary visibility

Visible fields for the origin practice are frozen to:

- appointmentMacroStatus
- appointmentDateTime
- siteDisplayName
- practiceContinuityState
- ackGenerationState
- manageCapabilityState

Hidden hub-only fields remain hidden:

- providerAdapterBindingHash
- competingAttemptMargin
- rawEvidencePayloadRef
- internalStaffNotes
- patientExplanationVectors
- supplierMirrorDriftAudit

The projection is bound to one visibility envelope version, one acting scope tuple, one minimum-necessary contract, one policy tuple, and one live acknowledgement generation.

## Manage exposure is leased

`NetworkManageCapabilities` is compiled from:

- current supplier truth version
- current policy tuple
- current visibility envelope version
- current appointment version
- current session fence
- current subject fence
- current truth tuple

The lease may degrade to `stale`, `blocked`, or `expired` and may force `read_only` posture. This is required to prevent stale buttons from surviving drift, reconciliation, or acknowledgement debt.

## Typed later-owned seams

| Seam | Owner | Why it remains separate now |
| --- | --- | --- |
| PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY | par_322 | Freeze the later-owned dispatch, receipt, and delivery checkpoints that must keep PracticeContinuityMessage transport, delivery, and acknowledgement lanes separate. |
| PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_REMINDERS_AND_MANAGE_REFRESH | par_324 | Freeze the later-owned reminder and manage surfaces that can reopen acknowledgement debt or degrade manage posture after booking truth is already durable. |
| PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR | par_325 | Freeze the later-owned worker inputs that may dispute, reopen, or degrade confirmed posture without minting a calmer state from stale evidence. |

## Official support references

See [313_external_reference_notes.json](/Users/test/Code/V/data/analysis/313_external_reference_notes.json) for the current official references that were borrowed, constrained, or rejected while building this pack.
