# Identifier Capture And Verification Decision Contract

This contract covers the internal Phase 2 telephony verification API. All endpoints are support-safe and return refs, hashes, masked fragments, lower bounds, and reason codes only.

## Append Identifier Capture

`POST /internal/telephony/call-sessions/{callSessionRef}/identifier-captures`

Contract family: `TelephonyIdentifierCaptureAttemptContract`

Idempotency is required. The request supplies `fieldFamily`, raw input for vault handoff, `captureSource`, `routeSensitivity`, actor, and provenance. The response is a `TelephonyIdentifierCaptureAttempt` with:

- `fieldFamily`
- `captureOrderIndex`
- `normalizedValueHash`
- `vaultEvidenceRef`
- `vaultRef`
- `maskedFragment`
- `captureSource`
- `validationResult`
- `reasonCodes`

Raw identifiers are not returned and are not persisted outside `IdentityEvidenceVault`.

## Evaluate Verification

`POST /internal/telephony/call-sessions/{callSessionRef}/verification`

Contract family: `TelephonyVerificationDecisionContract`

Idempotency is required. Evaluation resolves a frozen candidate set, computes `TelephonyIdentityConfidenceAssessment`, computes `TelephonyDestinationConfidenceAssessment`, and emits one `TelephonyVerificationDecision`.

The identity assessment carries `z_id`, `P_id`, `LCB_id_alpha`, `UCB_id_alpha`, `p_star`, `p_2`, and `gap_id` using `eps = 1e-6`. The destination assessment carries `z_dest`, `P_dest`, `LCB_dest_alpha`, optional joint seed model fields, and the v1 fallback `P_seed_lower`.

## Current Verification Projection

`GET /internal/telephony/call-sessions/{callSessionRef}/verification`

Contract family: `TelephonyVerificationProjectionContract`

The projection exposes the latest decision refs and posture:

- `outcome`
- `thresholdProfileRef`
- `calibrationVersionRefs`
- `bestCandidateRef`
- `runnerUpCandidateRef`
- `lowerBoundsUsed`
- `reasonCodes`
- `nextAllowedContinuationPosture`
- `submittedEvidencePackageRef`
- `authoritySubmissionRef`
- `localBindingMutation = forbidden`

## Outcomes

`telephony_verified_seeded` means the route profile allowed seeding and lower bounds passed. It also means a `TelephonyCandidateEvidencePackage` was submitted to `IdentityBindingAuthority`.

`telephony_verified_challenge` means identity can support challenge continuation but seeded delivery is not authorized, often because `LCB_dest_alpha` is below `tau_dest` or the authority seam is unavailable.

`manual_followup_required`, `identity_failed`, `insufficient_calibration`, `destination_untrusted`, and `ambiguous_candidate_set` are fail-closed outcomes with deterministic `TEL_VERIFY_189_*` reason codes.

## Versioned Contract Artifacts

- `189_identifier_capture_attempt.schema.json`
- `189_telephony_identity_confidence_assessment.schema.json`
- `189_telephony_destination_confidence_assessment.schema.json`
- `189_telephony_verification_decision.schema.json`
- `189_telephony_candidate_evidence_package.schema.json`
