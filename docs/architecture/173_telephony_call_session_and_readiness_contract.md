# Telephony Call Session And Readiness Contract

Sequence: `seq_173_phase2_freeze_telephony_call_session_and_evidence_readiness_contracts`
Contract version: `173.phase2.telephony.v1`

## Purpose

Phase 2 telephony is one canonical ingress path, not a call-centre side channel. A phone interaction may contribute menu, identity, audio, transcript, structured capture, urgent-live, continuation, and request-seed evidence, but it may not create a phone-only request model or bypass the Phase 0 intake convergence rules.

This pack freezes the authoritative telephony objects:

- `CallSession` in [173_call_session.schema.json](/Users/test/Code/V/data/contracts/173_call_session.schema.json)
- `TelephonyProviderEvent` in [173_telephony_provider_event.schema.json](/Users/test/Code/V/data/contracts/173_telephony_provider_event.schema.json)
- `TelephonyTranscriptReadinessRecord` in [173_transcript_readiness_record.schema.json](/Users/test/Code/V/data/contracts/173_transcript_readiness_record.schema.json)
- `TelephonyEvidenceReadinessAssessment` in [173_evidence_readiness_assessment.schema.json](/Users/test/Code/V/data/contracts/173_evidence_readiness_assessment.schema.json)
- `TelephonyContinuationEligibility` in [173_continuation_eligibility.schema.json](/Users/test/Code/V/data/contracts/173_continuation_eligibility.schema.json)
- `TelephonyManualReviewDisposition` in [173_manual_review_disposition.schema.json](/Users/test/Code/V/data/contracts/173_manual_review_disposition.schema.json)
- `TelephonyContinuationContext` in [173_telephony_continuation_context.schema.json](/Users/test/Code/V/data/contracts/173_telephony_continuation_context.schema.json)

## Frozen State Machine

The legal `CallSession.callState` vocabulary is fixed:

`initiated`, `menu_selected`, `identity_in_progress`, `identity_resolved`, `identity_partial`, `recording_expected`, `recording_available`, `evidence_preparing`, `evidence_pending`, `urgent_live_only`, `continuation_eligible`, `evidence_ready`, `continuation_sent`, `request_seeded`, `submitted`, `closed`, `identity_failed`, `abandoned`, `provider_error`, `manual_followup_required`, `manual_audio_review_required`, `recording_missing`, `transcript_degraded`.

The executable transition matrix is [173_call_state_transition_matrix.csv](/Users/test/Code/V/data/analysis/173_call_state_transition_matrix.csv). Later tasks must not add route-local or provider-local states. If a live provider needs a new edge condition, it must normalize into this matrix or supersede this contract with a versioned migration.

Key invariants:

- `evidence_pending` is the durable holding state for raw or partial phone evidence with no settled usability verdict.
- `urgent_live_only` opens conservative urgent handling but blocks routine promotion.
- `continuation_eligible` permits bounded SMS continuation but still blocks routine submission until a later readiness assessment reaches `safety_usable` and `ready_to_promote`.
- `evidence_ready` means the latest `TelephonyEvidenceReadinessAssessment(usabilityState = safety_usable, promotionReadiness = ready_to_promote)` has settled.
- `submitted` is legal only after the request has been seeded into canonical intake and the transition writes `SubmissionPromotionRecord:canonical_intake`.

## Separation Of Readiness Authorities

Telephony readiness has four distinct layers:

| Layer | Authority | What It Means | What It Cannot Mean |
| --- | --- | --- | --- |
| Recording availability | `CallSession.recordingAvailabilityState` and recording artifact refs | Provider or worker has a recording lifecycle fact | Evidence is safe, transcribed, or promotable |
| Transcript readiness | `TelephonyTranscriptReadinessRecord` | One immutable verdict over transcript state, coverage, quality, and sufficiency | Routine submission or seeded continuation |
| Evidence readiness | `TelephonyEvidenceReadinessAssessment` | The sole authority for `awaiting_*`, `urgent_live_only`, `safety_usable`, `manual_review_only`, or `unusable_terminal` | Identity binding or grant issuance by itself |
| Continuation eligibility | `TelephonyContinuationEligibility` | A bounded recommendation for `continuation_seeded_verified`, `continuation_challenge`, or `manual_only` | AccessGrant issuance without `AccessGrantService` |

The truth table in [173_readiness_truth_table.csv](/Users/test/Code/V/data/analysis/173_readiness_truth_table.csv) is the canonical decision source. A later worker may compute facts, but it must settle a new immutable `TelephonyEvidenceReadinessAssessment` before changing routine-promotion or continuation posture.

## Normalized Event Model And Rebuild

Provider webhooks and polling responses are not domain truth. They are inputs to a normalizer that appends canonical `TelephonyProviderEvent` records. Business logic consumes only canonical event type, call-session ref, idempotency key basis, timestamps, normalized refs, and reason codes.

`CallSession.rebuildRule.source` is fixed to `canonical_telephony_events_plus_immutable_readiness_records`. Rebuild must:

1. order canonical telephony events by monotonic provider sequence when present, then by recorded time and idempotency key;
2. ignore duplicate semantic events that resolve to the same idempotency key and canonical payload digest;
3. apply transition rows from `173_call_state_transition_matrix.csv`;
4. overlay the latest settled immutable transcript-readiness, evidence-readiness, continuation-eligibility, and manual-review records;
5. fail closed to `provider_error`, `manual_followup_required`, or `manual_audio_review_required` when ordering, payload digest, or state transition parity is not provable.

Raw provider payloads remain addressable only through `providerPayloadRef` and `payloadDigest`. Rebuild never replays raw provider JSON below the normalization boundary.

## Continuation And Grant Boundary

`TelephonyContinuationEligibility` may recommend:

- `continuation_seeded_verified`
- `continuation_challenge`
- `manual_only`

`manual_only` is a routing disposition and creates no redeemable grant. Seeded and challenge links are still canonical `AccessGrant` rows issued by `AccessGrantService` with one immutable `AccessGrantScopeEnvelope`, exact-once redemption, and supersession handling. Telephony may recommend the family, but it does not mint or redeem grant truth locally.

Seeded continuation requires all of the following:

- latest readiness verdict supports continuation or routine-ready posture;
- identity confidence ref exists and is high enough for the route;
- destination confidence ref proves the handset route is safe for that patient;
- lineage scope is `same_submission_envelope` or `same_request_lineage`;
- any authority-settled identity-binding fence cited by `TelephonyContinuationContext` is current at issuance and redemption.

Challenge continuation may be used when identity evidence is enough to continue but destination safety or disclosure posture is not enough for seeded access. It must reveal no existing patient data before challenge settlement.

## Same Pipeline Convergence

Phone capture enters the Phase 0 canonical intake path only through `SubmissionEnvelope`, `SubmissionIngressRecord`, `EvidenceCaptureBundle`, `EvidenceSnapshot`, `IntakeConvergenceContract`, and `SubmissionPromotionRecord`. The telephony path may add channel posture and evidence refs, but it may not define a separate phone draft, phone request payload, phone receipt grammar, or phone safety shortcut.

Routine promotion is legal only when:

- `CallSession.callState` is `request_seeded` or `evidence_ready` and the transition matrix allows progression;
- latest `TelephonyEvidenceReadinessAssessment.usabilityState = safety_usable`;
- latest `TelephonyEvidenceReadinessAssessment.promotionReadiness = ready_to_promote`;
- canonical intake convergence validates the same request lineage and route family.

## Gap Closures

This task closes:

- `GAP_RESOLVED_PHASE2_TELEPHONY_PROVIDER_NORMALIZATION_V1`
- `GAP_RESOLVED_PHASE2_TELEPHONY_RECORDING_NOT_READY_V1`
- `GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_READINESS_BOUND_V1`
- `GAP_RESOLVED_PHASE2_TELEPHONY_MANUAL_REVIEW_CONTRACT_V1`
- `GAP_RESOLVED_PHASE2_TELEPHONY_MOBILE_CONTINUATION_GRAMMAR_V1`
- `GAP_RESOLVED_PHASE2_TELEPHONY_IDEMPOTENT_REBUILD_V1`

The machine-readable closure registry is [173_telephony_gap_log.json](/Users/test/Code/V/data/analysis/173_telephony_gap_log.json).

## Downstream Ownership

Later tasks must consume, not redefine, this pack:

- `187` owns provider edge and webhook ingestion against `TelephonyProviderEvent`.
- `188` owns runtime enforcement of `CallSession` transitions.
- `189` owns caller verification confidence records that feed continuation refs.
- `190` owns recording fetch and quarantine refs.
- `191` owns transcript and evidence-readiness derivation.
- `192` owns AccessGrant issuance from continuation eligibility.
- `193` owns canonical intake convergence.
- `194` owns duplicate follow-up and re-safety handling after phone evidence changes.
