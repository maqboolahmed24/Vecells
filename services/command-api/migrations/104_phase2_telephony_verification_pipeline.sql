CREATE TABLE IF NOT EXISTS phase2_telephony_identifier_capture_attempts (
  capture_attempt_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  route_sensitivity TEXT NOT NULL,
  field_family TEXT NOT NULL CHECK (
    field_family IN (
      'nhs_number',
      'date_of_birth',
      'surname',
      'postcode',
      'caller_id_hint',
      'verified_callback',
      'handset_step_up_proof',
      'ivr_consistency',
      'operator_correction'
    )
  ),
  capture_order_index INTEGER NOT NULL CHECK (capture_order_index BETWEEN 1 AND 9),
  capture_source TEXT NOT NULL,
  validation_result TEXT NOT NULL,
  normalized_value_hash TEXT,
  vault_evidence_ref TEXT,
  vault_ref TEXT,
  masked_fragment TEXT NOT NULL,
  evidence_envelope_ref TEXT,
  related_candidate_set_ref TEXT,
  idempotency_key TEXT NOT NULL,
  reason_codes TEXT[] NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-telephony-verification-189.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyVerificationPipeline',
  CHECK (created_by_authority = 'TelephonyVerificationPipeline'),
  UNIQUE (call_session_ref, idempotency_key)
);

CREATE TABLE IF NOT EXISTS phase2_telephony_candidate_sets (
  candidate_set_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  route_sensitivity TEXT NOT NULL,
  candidate_refs TEXT[] NOT NULL,
  candidate_count INTEGER NOT NULL,
  resolver_policy_ref TEXT NOT NULL CHECK (
    resolver_policy_ref = 'patient-linker-compatible-hash-resolution-189.v1'
  ),
  frozen_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-telephony-verification-189.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyVerificationPipeline',
  CHECK (created_by_authority = 'TelephonyVerificationPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_identity_confidence_assessments (
  identity_confidence_assessment_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  candidate_set_ref TEXT NOT NULL,
  route_sensitivity TEXT NOT NULL,
  calibration_version_ref TEXT NOT NULL CHECK (
    calibration_version_ref = 'Cal_id_189_synthetic_adjudicated_v1'
  ),
  threshold_profile_ref TEXT NOT NULL,
  alpha_id NUMERIC NOT NULL,
  candidate_scores JSONB NOT NULL,
  best_candidate_ref TEXT,
  runner_up_candidate_ref TEXT,
  best_p_id NUMERIC NOT NULL,
  best_lcb_id_alpha NUMERIC NOT NULL,
  best_ucb_id_alpha NUMERIC NOT NULL,
  runner_up_p_id NUMERIC NOT NULL,
  runner_up_ucb_id_alpha NUMERIC NOT NULL,
  gap_id NUMERIC NOT NULL,
  caller_id_only_blocked BOOLEAN NOT NULL,
  reason_codes TEXT[] NOT NULL,
  assessed_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-telephony-verification-189.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyVerificationPipeline',
  CHECK (created_by_authority = 'TelephonyVerificationPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_destination_confidence_assessments (
  destination_confidence_assessment_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  route_sensitivity TEXT NOT NULL,
  candidate_patient_ref TEXT,
  calibration_version_ref TEXT NOT NULL CHECK (
    calibration_version_ref = 'Cal_dest_189_synthetic_adjudicated_v1'
  ),
  seed_calibration_version_ref TEXT NOT NULL CHECK (
    seed_calibration_version_ref = 'no_joint_seed_model_189_v1'
  ),
  threshold_profile_ref TEXT NOT NULL,
  alpha_dest NUMERIC NOT NULL,
  destination_feature_vector JSONB NOT NULL,
  z_dest NUMERIC NOT NULL,
  p_dest NUMERIC NOT NULL,
  lcb_dest_alpha NUMERIC NOT NULL,
  p_seed NUMERIC,
  lcb_seed_alpha NUMERIC,
  p_seed_lower NUMERIC NOT NULL,
  seed_lower_bound_method TEXT NOT NULL CHECK (
    seed_lower_bound_method IN ('joint_seed_calibrator', 'dependence_safe_frechet_lower_bound')
  ),
  reason_codes TEXT[] NOT NULL,
  assessed_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-telephony-verification-189.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyVerificationPipeline',
  CHECK (created_by_authority = 'TelephonyVerificationPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_candidate_evidence_packages (
  evidence_package_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  route_sensitivity TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  candidate_patient_ref TEXT NOT NULL,
  identity_confidence_assessment_ref TEXT NOT NULL,
  destination_confidence_assessment_ref TEXT NOT NULL,
  capture_attempt_refs TEXT[] NOT NULL,
  vault_evidence_refs TEXT[] NOT NULL,
  threshold_profile_ref TEXT NOT NULL,
  calibration_version_refs TEXT[] NOT NULL,
  binding_authority_name TEXT NOT NULL CHECK (binding_authority_name = 'IdentityBindingAuthority'),
  binding_mutation_authority TEXT NOT NULL CHECK (
    binding_mutation_authority = 'IdentityBindingAuthority'
  ),
  local_binding_mutation TEXT NOT NULL CHECK (local_binding_mutation = 'forbidden'),
  reason_codes TEXT[] NOT NULL,
  packaged_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-telephony-verification-189.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyVerificationPipeline',
  CHECK (created_by_authority = 'TelephonyVerificationPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_verification_authority_submissions (
  authority_submission_ref TEXT PRIMARY KEY,
  evidence_package_ref TEXT NOT NULL,
  accepted BOOLEAN NOT NULL,
  settlement_ref TEXT,
  binding_version_ref TEXT,
  reason_codes TEXT[] NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-telephony-verification-189.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyVerificationPipeline',
  CHECK (created_by_authority = 'TelephonyVerificationPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_verification_decisions (
  telephony_verification_decision_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  route_sensitivity TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (
    outcome IN (
      'telephony_verified_seeded',
      'telephony_verified_challenge',
      'manual_followup_required',
      'identity_failed',
      'insufficient_calibration',
      'destination_untrusted',
      'ambiguous_candidate_set'
    )
  ),
  threshold_profile_ref TEXT NOT NULL,
  calibration_version_refs TEXT[] NOT NULL,
  identity_confidence_assessment_ref TEXT,
  destination_confidence_assessment_ref TEXT,
  candidate_set_ref TEXT,
  best_candidate_ref TEXT,
  runner_up_candidate_ref TEXT,
  lower_bounds_used JSONB NOT NULL,
  threshold_values JSONB NOT NULL,
  reason_codes TEXT[] NOT NULL,
  next_allowed_continuation_posture TEXT NOT NULL,
  submitted_evidence_package_ref TEXT,
  authority_submission_ref TEXT,
  local_binding_mutation TEXT NOT NULL CHECK (local_binding_mutation = 'forbidden'),
  decided_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-telephony-verification-189.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyVerificationPipeline',
  CHECK (created_by_authority = 'TelephonyVerificationPipeline')
);

CREATE INDEX IF NOT EXISTS idx_phase2_tel_verify_capture_order
  ON phase2_telephony_identifier_capture_attempts(call_session_ref, capture_order_index);

CREATE INDEX IF NOT EXISTS idx_phase2_tel_verify_decision_latest
  ON phase2_telephony_verification_decisions(call_session_ref, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase2_tel_verify_authority_submission
  ON phase2_telephony_verification_authority_submissions(evidence_package_ref, submitted_at);
