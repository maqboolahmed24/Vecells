BEGIN;

CREATE TABLE IF NOT EXISTS phase6_transport_assurance_profile (
  transport_assurance_profile_id TEXT PRIMARY KEY,
  transport_mode TEXT NOT NULL,
  assurance_class TEXT NOT NULL,
  ack_required BOOLEAN NOT NULL,
  proof_deadline_policy TEXT NOT NULL,
  dispatch_confidence_threshold DOUBLE PRECISION NOT NULL,
  contradiction_threshold DOUBLE PRECISION NOT NULL,
  proof_risk_model_ref TEXT NOT NULL,
  proof_risk_calibration_version TEXT NOT NULL,
  proof_risk_threshold_set_ref TEXT NOT NULL,
  revision_policy_ref TEXT NOT NULL,
  patient_assurance_policy TEXT NOT NULL,
  exception_policy TEXT NOT NULL,
  theta_dispatch_track DOUBLE PRECISION NOT NULL,
  theta_dispatch_fail DOUBLE PRECISION NOT NULL,
  lambda_dispatch_contra DOUBLE PRECISION NOT NULL,
  manual_review_required BOOLEAN NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_transport_assurance_profile_mode
  ON phase6_transport_assurance_profile (transport_mode);

CREATE TABLE IF NOT EXISTS phase6_dispatch_adapter_binding (
  dispatch_adapter_binding_id TEXT PRIMARY KEY,
  transport_mode TEXT NOT NULL,
  adapter_version_ref TEXT NOT NULL,
  transform_contract_ref TEXT NOT NULL,
  provider_capability_snapshot_id TEXT NOT NULL,
  requires_manual_operator BOOLEAN NOT NULL,
  manual_review_policy_ref TEXT NOT NULL,
  binding_hash TEXT NOT NULL,
  bound_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_dispatch_adapter_binding_current
  ON phase6_dispatch_adapter_binding (provider_capability_snapshot_id, transport_mode, binding_hash);

CREATE TABLE IF NOT EXISTS phase6_referral_artifact_manifest (
  artifact_manifest_id TEXT PRIMARY KEY,
  dispatch_plan_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  compiled_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_referral_artifact_manifest_plan
  ON phase6_referral_artifact_manifest (dispatch_plan_id, compiled_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatch_payload (
  dispatch_payload_id TEXT PRIMARY KEY,
  dispatch_plan_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  transport_mode TEXT NOT NULL,
  representation_set_ref TEXT,
  manifest_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  compiled_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_payload_plan
  ON phase6_pharmacy_dispatch_payload (dispatch_plan_id);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatch_plan (
  dispatch_plan_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_capability_snapshot_id TEXT NOT NULL,
  transport_mode TEXT NOT NULL,
  transport_assurance_profile_id TEXT NOT NULL,
  dispatch_adapter_binding_id TEXT NOT NULL,
  transform_contract_ref TEXT NOT NULL,
  artifact_manifest_id TEXT NOT NULL,
  dispatch_payload_id TEXT NOT NULL,
  dispatch_payload_hash TEXT NOT NULL,
  dispatch_plan_hash TEXT NOT NULL,
  manual_review_policy_ref TEXT NOT NULL,
  plan_state TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  canonical_object_descriptor_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  planned_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_plan_case
  ON phase6_pharmacy_dispatch_plan (pharmacy_case_id, planned_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_plan_hash
  ON phase6_pharmacy_dispatch_plan (dispatch_plan_hash);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatch_attempt (
  dispatch_attempt_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  dispatch_plan_id TEXT NOT NULL,
  transport_mode TEXT NOT NULL,
  transport_assurance_profile_id TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  canonical_object_descriptor_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_lifecycle_lease_ref TEXT NOT NULL,
  request_ownership_epoch_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  idempotency_record_ref TEXT NOT NULL,
  adapter_dispatch_attempt_ref TEXT NOT NULL,
  latest_receipt_checkpoint_ref TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_capability_snapshot_id TEXT NOT NULL,
  dispatch_adapter_binding_id TEXT NOT NULL,
  dispatch_plan_hash TEXT NOT NULL,
  package_hash TEXT NOT NULL,
  outbound_reference_set_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  transport_acceptance_state TEXT NOT NULL,
  provider_acceptance_state TEXT NOT NULL,
  proof_deadline_at TIMESTAMPTZ NOT NULL,
  proof_state TEXT NOT NULL,
  dispatch_confidence DOUBLE PRECISION NOT NULL,
  contradiction_score DOUBLE PRECISION NOT NULL,
  proof_envelope_ref TEXT,
  external_confirmation_gate_ref TEXT,
  authoritative_proof_ref TEXT NOT NULL,
  superseded_by_attempt_ref TEXT,
  attempted_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  retry_generation INTEGER NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_attempt_case
  ON phase6_pharmacy_dispatch_attempt (pharmacy_case_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_attempt_plan_hash
  ON phase6_pharmacy_dispatch_attempt (dispatch_plan_hash, route_intent_tuple_hash);

CREATE TABLE IF NOT EXISTS phase6_dispatch_evidence_observation (
  evidence_observation_id TEXT PRIMARY KEY,
  dispatch_attempt_id TEXT NOT NULL,
  lane TEXT NOT NULL,
  source_class TEXT NOT NULL,
  source_family TEXT NOT NULL,
  polarity TEXT NOT NULL,
  log_likelihood_weight DOUBLE PRECISION NOT NULL,
  contradictory BOOLEAN NOT NULL,
  receipt_checkpoint_ref TEXT,
  proof_ref TEXT,
  source_correlation_ref TEXT,
  payload_digest TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_dispatch_evidence_observation_attempt
  ON phase6_dispatch_evidence_observation (dispatch_attempt_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase6_dispatch_proof_envelope (
  dispatch_proof_envelope_id TEXT PRIMARY KEY,
  dispatch_attempt_id TEXT NOT NULL,
  transport_assurance_profile_id TEXT NOT NULL,
  proof_deadline_at TIMESTAMPTZ NOT NULL,
  authoritative_proof_source_ref TEXT,
  proof_confidence DOUBLE PRECISION NOT NULL,
  dispatch_confidence DOUBLE PRECISION NOT NULL,
  contradiction_score DOUBLE PRECISION NOT NULL,
  proof_state TEXT NOT NULL,
  risk_state TEXT NOT NULL,
  state_confidence_band TEXT NOT NULL,
  calibration_version TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_dispatch_proof_envelope_attempt
  ON phase6_dispatch_proof_envelope (dispatch_attempt_id, monotone_revision DESC);

CREATE TABLE IF NOT EXISTS phase6_manual_dispatch_assistance_record (
  manual_dispatch_assistance_record_id TEXT PRIMARY KEY,
  dispatch_attempt_id TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  operator_action_ref TEXT NOT NULL,
  second_reviewer_ref TEXT,
  attestation_state TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_manual_dispatch_assistance_attempt
  ON phase6_manual_dispatch_assistance_record (dispatch_attempt_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatch_settlement (
  settlement_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  dispatch_attempt_id TEXT NOT NULL,
  dispatch_plan_id TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  canonical_object_descriptor_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  proof_envelope_ref TEXT NOT NULL,
  transport_assurance_profile_id TEXT NOT NULL,
  dispatch_adapter_binding_id TEXT NOT NULL,
  consent_checkpoint_id TEXT NOT NULL,
  result TEXT NOT NULL,
  proof_risk_state TEXT NOT NULL,
  state_confidence_band TEXT NOT NULL,
  calibration_version TEXT NOT NULL,
  receipt_text_ref TEXT NOT NULL,
  experience_continuity_evidence_ref TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  recovery_route_ref TEXT,
  monotone_revision INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_settlement_case
  ON phase6_pharmacy_dispatch_settlement (pharmacy_case_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatch_truth_projection (
  pharmacy_dispatch_truth_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  dispatch_attempt_id TEXT NOT NULL,
  dispatch_plan_id TEXT NOT NULL,
  selected_provider_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_hash TEXT NOT NULL,
  transport_mode TEXT NOT NULL,
  transport_assurance_profile_id TEXT NOT NULL,
  dispatch_adapter_binding_id TEXT NOT NULL,
  dispatch_plan_hash TEXT NOT NULL,
  transport_acceptance_state TEXT NOT NULL,
  provider_acceptance_state TEXT NOT NULL,
  authoritative_proof_state TEXT NOT NULL,
  proof_risk_state TEXT NOT NULL,
  dispatch_confidence DOUBLE PRECISION NOT NULL,
  contradiction_score DOUBLE PRECISION NOT NULL,
  proof_deadline_at TIMESTAMPTZ NOT NULL,
  outbound_reference_set_hash TEXT NOT NULL,
  proof_envelope_ref TEXT NOT NULL,
  dispatch_settlement_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  audience_message_ref TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_truth_projection_case
  ON phase6_pharmacy_dispatch_truth_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_continuity_evidence_projection (
  pharmacy_continuity_evidence_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  dispatch_attempt_id TEXT NOT NULL,
  settlement_result TEXT NOT NULL,
  pending_posture TEXT NOT NULL,
  audience_message_ref TEXT NOT NULL,
  next_review_at TIMESTAMPTZ,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_continuity_evidence_projection_case
  ON phase6_pharmacy_continuity_evidence_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatch_audit_event (
  pharmacy_dispatch_audit_event_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  dispatch_attempt_id TEXT,
  event_name TEXT NOT NULL,
  actor_ref TEXT,
  payload_digest TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_audit_event_case
  ON phase6_pharmacy_dispatch_audit_event (pharmacy_case_id, recorded_at DESC);

COMMIT;
