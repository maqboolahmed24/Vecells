# 313 Phase 5 commit and practice visibility API contract

Task: `seq_313_phase5_freeze_cross_org_booking_commit_and_practice_visibility_contracts`

## Purpose

This document freezes the command and query surfaces that later implementation tracks must preserve while implementing the 313 contract pack.

## API surfaces

| Method | Path | Primary contract | Guardrail |
| --- | --- | --- | --- |
| POST | /v1/hub/cases/{hubCoordinationCaseId}/offer-sessions | AlternativeOfferSession | Publish one live offer set without collapsing callback into the ranked rows. |
| POST | /v1/hub/cases/{hubCoordinationCaseId}/offer-selection | AlternativeOfferEntry \| AlternativeOfferFallbackCard | Accept only the current truthTupleHash; stale selections are auditable only. |
| POST | /v1/hub/cases/{hubCoordinationCaseId}/commit-attempts | HubCommitAttempt | Bind commit mode, reservation fence, provider binding, and truthTupleHash before side effects. |
| POST | /v1/hub/commit-attempts/{commitAttemptId}/evidence | HubBookingEvidenceBundle | Persist manual, native, or imported proof without minting calm booked truth prematurely. |
| GET | /v1/hub/cases/{hubCoordinationCaseId}/truth-projection | HubOfferToConfirmationTruthProjection | Expose one current monotone projection that joins offer, commit, continuity, and blockers. |
| POST | /v1/practice-continuity/messages/{practiceContinuityMessageId}:dispatch-receipt | PracticeContinuityMessage | Update transport, delivery, and risk lanes separately. |
| POST | /v1/practice-continuity/messages/{practiceContinuityMessageId}:acknowledge | PracticeAcknowledgementRecord | Clear debt only when ackGeneration and truthTupleHash both match live truth. |
| GET | /v1/hub/appointments/{hubAppointmentId}/manage-capabilities | NetworkManageCapabilities | Compile a leased manage posture from current supplier, visibility, policy, and tuple truth. |

## Event vocabulary

| Event | Aggregate | Outcome |
| --- | --- | --- |
| hub.offer.session_opened | AlternativeOfferSession | One live offer set plus one separate fallback card become visible. |
| hub.offer.entry_selected | AlternativeOfferEntry | One ranked offer row becomes the selected anchor for commit. |
| hub.offer.fallback_selected | AlternativeOfferFallbackCard | Callback or return fallback becomes the live branch without consuming rank ordinal. |
| hub.commit.attempt_started | HubCommitAttempt | Commit begins under current reservation fence and provider binding. |
| hub.commit.confirmation_pending | HubBookingEvidenceBundle | Weak or partial proof widens pending posture only. |
| hub.commit.authoritatively_confirmed | HubAppointmentRecord | Durable appointment truth exists and the hub case becomes booked_pending_practice_ack. |
| hub.practice.message_queued | PracticeContinuityMessage | One current-generation continuity obligation exists. |
| hub.practice.transport_accepted | PracticeContinuityMessage | Cross-organisation transport accepted the message. |
| hub.practice.delivery_evidence_recorded | PracticeContinuityMessage | Delivery evidence or non-delivery risk becomes durable. |
| hub.practice.acknowledged_current_generation | PracticeAcknowledgementRecord | Current-generation acknowledgement evidence is durable. |
| hub.practice.acknowledgement_superseded | PracticeVisibilityDeltaRecord | Older acknowledgement becomes auditable only after a new generation or new tuple. |
| hub.manage.capabilities_degraded | NetworkManageCapabilities | Manage posture becomes stale, blocked, or expired. |
| hub.truth.projection_advanced | HubOfferToConfirmationTruthProjection | One current projection resolves offer, confirmation, practice, and closure facets. |

## Current machine-readable contracts

- [data/contracts/313_alternative_offer_session.schema.json](/Users/test/Code/V/data/contracts/313_alternative_offer_session.schema.json)
- [data/contracts/313_alternative_offer_entry.schema.json](/Users/test/Code/V/data/contracts/313_alternative_offer_entry.schema.json)
- [data/contracts/313_alternative_offer_fallback_card.schema.json](/Users/test/Code/V/data/contracts/313_alternative_offer_fallback_card.schema.json)
- [data/contracts/313_hub_commit_attempt.schema.json](/Users/test/Code/V/data/contracts/313_hub_commit_attempt.schema.json)
- [data/contracts/313_hub_booking_evidence_bundle.schema.json](/Users/test/Code/V/data/contracts/313_hub_booking_evidence_bundle.schema.json)
- [data/contracts/313_hub_appointment_record.schema.json](/Users/test/Code/V/data/contracts/313_hub_appointment_record.schema.json)
- [data/contracts/313_hub_offer_to_confirmation_truth_projection.schema.json](/Users/test/Code/V/data/contracts/313_hub_offer_to_confirmation_truth_projection.schema.json)
- [data/contracts/313_practice_continuity_message.schema.json](/Users/test/Code/V/data/contracts/313_practice_continuity_message.schema.json)
- [data/contracts/313_practice_acknowledgement_record.schema.json](/Users/test/Code/V/data/contracts/313_practice_acknowledgement_record.schema.json)
- [data/contracts/313_practice_visibility_projection.schema.json](/Users/test/Code/V/data/contracts/313_practice_visibility_projection.schema.json)
- [data/contracts/313_network_manage_capabilities.schema.json](/Users/test/Code/V/data/contracts/313_network_manage_capabilities.schema.json)
- [data/contracts/313_practice_visibility_delta_record.schema.json](/Users/test/Code/V/data/contracts/313_practice_visibility_delta_record.schema.json)

## State vocabulary that downstream tracks may not redefine

- Offer session states: `live | selected | callback_selected | expired | superseded | closed`
- Commit attempt states: `draft | executing | awaiting_confirmation | reconciliation_required | disputed | confirmed | failed | superseded`
- Confirmation truth states: `offer_only | commit_pending | confirmation_pending | confirmed_pending_practice_ack | confirmed | disputed | blocked_by_drift`
- Practice visibility states: `not_informed | transport_pending | delivered_pending_ack | ack_pending | acknowledged | stale_generation | blocked`
- Manage capability states: `live | stale | blocked | expired`

## Hard rules

1. `HubCommitAttempt` is the only commit-side object allowed to talk to a native booking adapter or ingest imported confirmation toward booked truth.
2. `HubOfferToConfirmationTruthProjection` is the only current projection allowed to calm patient confirmation, practice visibility, or close posture.
3. `PracticeContinuityMessage` keeps transport, delivery, risk, and acknowledgement lanes separate.
4. `PracticeAcknowledgementRecord` must match the live `ackGeneration`, live `truthTupleHash`, and live visibility policy evaluation before it can clear debt.
5. `NetworkManageCapabilities` is leased and may degrade to `blocked`, `stale`, or `expired` with `read_only` posture.

## Later implementation ownership

- `par_321` implements commit orchestration, evidence bundles, appointment records, and confirmation-gate updates.
- `par_322` implements continuity dispatch, delivery evidence, and acknowledgement routing while preserving this vocabulary.
- `par_324` implements reminder, manage, and practice-visibility refresh flows against these contracts.
- `par_325` implements reconciliation, supplier-mirror drift, and background integrity against these contracts.
