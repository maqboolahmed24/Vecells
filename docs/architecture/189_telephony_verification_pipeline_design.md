# Telephony Verification Pipeline Design

Task `189_par_phase2_track_telephony_build_caller_verification_and_captured_identifier_pipeline` introduces `TelephonyVerificationPipeline` as the single service for caller identifier capture, local candidate resolution, calibrated identity confidence, destination confidence, and non-binding submission to `IdentityBindingAuthority`.

The pipeline is deliberately split from `TelephonyCallSessionService`. `CallSession` explains phone progress; `TelephonyVerificationDecision` explains caller trust posture. A call cannot become seeded, promoted, or durably bound just because a session reached a recording or verification state.

## Capture Model

Identifier capture is append-only and ordered by `controlledTelephonyIdentifierCaptureOrder`:

1. `nhs_number`
2. `date_of_birth`
3. `surname`
4. `postcode`
5. `caller_id_hint`
6. `verified_callback`
7. `handset_step_up_proof`
8. `ivr_consistency`
9. `operator_correction`

Each `TelephonyIdentifierCaptureAttempt` stores only `normalizedValueHash`, `vaultEvidenceRef`, `vaultRef`, `maskedFragment`, `evidenceEnvelopeRef`, `captureOrderIndex`, source, validation result, route sensitivity, idempotency key, and reason codes. Raw NHS number, DOB, surname, postcode, caller-ID hint, callback result payloads, handset proof payloads, IVR consistency payloads, and operator corrections are written to `IdentityEvidenceVault`.

## Candidate Resolution

Candidate resolution uses patient-linker-compatible hashes rather than raw telephony values. `phase2_telephony_candidate_sets` freezes the resolved set before scoring with resolver policy `patient-linker-compatible-hash-resolution-189.v1`. This avoids creating a second patient matcher while still letting telephony verification compute its own Phase 2 confidence formulas.

## Identity Confidence

For each candidate `p`, the service computes:

`z_id(p) = gamma_0 + sum_k gamma_k * psi_k(p)`

`P_id(p) = Cal_id_189_synthetic_adjudicated_v1(z_id(p))`

It then records `LCB_id_alpha`, `UCB_id_alpha`, best candidate `p_star`, runner-up `p_2`, and:

`gap_id = log((P_id(p_star)+eps)/(1-P_id(p_star)+eps)) - log((P_id(p_2)+eps)/(1-P_id(p_2)+eps))`, with `eps = 1e-6`.

`psi_k` includes NHS-number agreement, date-of-birth agreement, surname similarity, postcode fragment match, verified callback success, IVR consistency, caller-ID hint, handset step-up proof, and operator correction support. Caller ID is capped at `0.25` and `TEL_VERIFY_189_CALLER_ID_ONLY_BLOCKED` prevents caller-ID-only verification.

## Destination Confidence

Destination safety is computed separately:

`z_dest = eta_0 + eta_1 * verified_number_on_patient + eta_2 * handset_step_up_success + eta_3 * fresh_channel_control_proof`

`P_dest = Cal_dest_189_synthetic_adjudicated_v1(z_dest)`

Because there is no jointly calibrated seed model in v1, seeded authorization uses:

`P_seed_lower = max(0, LCB_id_alpha(p_star) + LCB_dest_alpha - 1)`

The decision never uses `P_id * P_dest` as authorization basis.

## Decision Engine

`TelephonyVerificationDecision` is the authoritative local verification outcome:

- `telephony_verified_seeded` only when identity lower bounds, runner-up upper bound, `gap_id`, destination lower bound, and seeded lower bound pass the route profile.
- `telephony_verified_challenge` when identity is strong enough for challenge but destination safety is below seeded threshold.
- `manual_followup_required` for caller-ID-only, contradictions, insufficient evidence, or conservative fallbacks.
- `identity_failed` when no candidate can be resolved.
- `insufficient_calibration` when route calibration is missing or unvalidated.
- `destination_untrusted` when identity may be plausible but delivery safety is too weak.
- `ambiguous_candidate_set` when runner-up competition is too close.

Every decision carries the threshold profile ref, calibration version refs, best and runner-up refs, lower bounds used, reason codes, next allowed continuation posture, evidence package ref when submitted, and `localBindingMutation = forbidden`.

## Authority Submission

When seeded thresholds pass, `TelephonyCandidateEvidencePackage` is submitted to `IdentityBindingAuthority` through a port. The package includes capture refs, vault evidence refs, identity and destination assessment refs, candidate ref, threshold profile ref, and calibration refs.

The telephony pipeline does not append `IdentityBinding`, mutate `Request.patientRef`, mutate `Episode.patientRef`, or treat seeded eligibility as ownership. If authority submission is stale or unavailable, `TEL_VERIFY_189_AUTHORITY_UNAVAILABLE_NON_BINDING_FALLBACK` downgrades the decision to challenge posture and keeps local binding mutation forbidden.

## Gap Resolutions

The following gaps are closed as explicit artifacts:

- `GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CONFIDENCE_OBJECTS`
- `GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_THRESHOLD_SOURCE`
- `GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALIBRATION_ABSENCE`
- `GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALLER_ID_CAP`
- `GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_AUTHORITY_UNAVAILABLE`
