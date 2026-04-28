# Telephony Event Normalization And Recording Contracts

Sequence: `seq_173_phase2_freeze_telephony_call_session_and_evidence_readiness_contracts`

## Boundary

Telephony provider APIs end at the normalization boundary. Every webhook or polling response must become a canonical `TelephonyProviderEvent` before domain logic can see it. Provider SDK objects, vendor-specific field names, raw phone numbers, and raw payload bodies are forbidden below this boundary.

The provider mapping table is [173_provider_event_mapping.csv](/Users/test/Code/V/data/analysis/173_provider_event_mapping.csv). It is the contract for:

- input family;
- ingress source;
- canonical event type;
- idempotency key basis;
- allowed downstream consumers;
- resulting `CallSession` state;
- reason-code family.

## Ingress Contract

The normalizer must accept webhook, polling, and simulator inputs through a provider adapter. The adapter may parse vendor-specific payloads only inside the boundary and must persist:

- `providerPayloadRef`: opaque ref to quarantined raw provider input;
- `payloadDigest`: `sha256` digest of raw bytes;
- `payloadStorageRule = normalization_boundary_only`;
- `payloadDisclosureBoundary = provider_payload_shape_stops_at_normalizer`;
- canonical event type and normalized ref-only payload.

No business service may branch on vendor-specific payload shape. Allowed domain consumers are listed per row in the mapping table.

## Canonical Event Types

The canonical event vocabulary is frozen in [173_telephony_provider_event.schema.json](/Users/test/Code/V/data/contracts/173_telephony_provider_event.schema.json). It covers call start, menu capture, identity capture, recording expected/available/missing, audio quarantine, transcript status, evidence-readiness settlement, urgent-live preemption, continuation settlement, request seeding, submission promotion, call closure, provider errors, manual review, and manual follow-up.

If a provider emits multiple vendor events for one semantic fact, the normalizer must collapse them with the declared `idempotencyKeyBasis`. If provider order is delayed or duplicated, transition application must use canonical event order and the idempotency key, not provider delivery timing alone.

## Recording Lifecycle

Recording lifecycle is distinct from evidence readiness:

1. `recording_expected`: provider has committed that a recording should exist.
2. `recording_available`: provider has exposed a recording pointer or equivalent availability signal.
3. `audio_quarantined`: fetch worker has copied the asset into governed object storage or quarantine and created a ref.
4. `TelephonyTranscriptReadinessRecord`: transcript job state, coverage, quality, and sufficiency are recorded.
5. `TelephonyEvidenceReadinessAssessment`: only this record can declare safety usability.

Recording fetch worker requirements:

- store raw audio only in governed object storage or quarantine;
- create a `DocumentReference` or equivalent object ref;
- append immutable refs rather than inline content;
- enqueue transcript or extraction work using refs only;
- create `TelephonyManualReviewDisposition(triggerClass = recording_missing)` when retrieval times out, expires, or is unusable;
- never allow `recording_available` or `audio_quarantined` to imply routine submission.

## Transcript And Derivation Events

Transcript jobs are secondary derivations. The original audio artifact remains authoritative. Transcript reruns, diarisation correction, manual transcription, or concept-extraction upgrades must append:

- one new immutable derivation package;
- one new `TelephonyTranscriptReadinessRecord`;
- one new `TelephonyEvidenceReadinessAssessment`.

They must not rewrite transcript or extracted fact refs referenced by a prior `EvidenceSnapshot` or submitted request.

## Idempotency And Replay

Every provider event row declares an idempotency key basis. Runtime implementation must persist one settlement record per `(callSessionRef, canonicalEventType, idempotencyKeyBasis)` and return the existing settlement for exact duplicates.

Collision handling is fail-closed:

- same provider event id with a different payload digest opens provider-error review;
- same semantic event with conflicting normalized refs opens manual review;
- out-of-order events are buffered or applied only if a legal transition exists in [173_call_state_transition_matrix.csv](/Users/test/Code/V/data/analysis/173_call_state_transition_matrix.csv);
- no event may create a request or issue a continuation grant without the required readiness and eligibility records.

`TelephonyEvidenceReadinessAssessment` remains the authority for canonical intake readiness, `TelephonyContinuationEligibility` remains the authority for seeded, challenge, or `manual_only` recommendation, and `TelephonyManualReviewDisposition` remains the manual-review authority. `manual_only` means no redeemable grant and must not be represented as a provider event or AccessGrant family.

## Recording Timeout Budgets

The first implementation may be simulator-backed, but timeout meaning is frozen:

- recording expectation stale after the provider-specific SLA becomes `recording_missing`;
- transcript job stale before clinically sufficient coverage becomes `transcript_degraded`;
- contradictory or low-quality extraction becomes `manual_audio_review_required`;
- all timeout outcomes must append a manual-review disposition or a new readiness assessment before any flow can recover.

These budgets are policy values, not hidden provider defaults. Later provider onboarding may change numeric SLA values only through policy-version updates that keep the same state and reason-code vocabulary.
