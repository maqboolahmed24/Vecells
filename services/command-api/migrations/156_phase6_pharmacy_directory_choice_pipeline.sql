BEGIN;

CREATE TABLE IF NOT EXISTS phase6_pharmacy_directory_snapshot (
  directory_snapshot_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  pathway_or_lane TEXT NOT NULL,
  timing_guardrail_ref TEXT NOT NULL,
  directory_tuple_hash TEXT NOT NULL,
  candidate_universe_hash TEXT NOT NULL,
  snapshot_state TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_directory_snapshot_case
  ON phase6_pharmacy_directory_snapshot (pharmacy_case_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_directory_snapshot_tuple
  ON phase6_pharmacy_directory_snapshot (directory_tuple_hash);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_directory_source_snapshot (
  directory_source_snapshot_id TEXT PRIMARY KEY,
  directory_snapshot_id TEXT NOT NULL,
  adapter_mode TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_status TEXT NOT NULL,
  source_trust_class TEXT NOT NULL,
  source_freshness_posture TEXT NOT NULL,
  source_failure_classification TEXT NOT NULL,
  request_tuple_hash TEXT NOT NULL,
  raw_response_hash TEXT NOT NULL,
  normalized_source_timestamp TIMESTAMPTZ NOT NULL,
  staleness_minutes INTEGER NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_directory_source_snapshot_directory
  ON phase6_pharmacy_directory_source_snapshot (directory_snapshot_id, adapter_mode);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_provider_capability_snapshot (
  provider_capability_snapshot_id TEXT PRIMARY KEY,
  directory_snapshot_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  capability_state TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_provider_capability_snapshot_directory
  ON phase6_pharmacy_provider_capability_snapshot (directory_snapshot_id, provider_id);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_provider (
  provider_id TEXT PRIMARY KEY,
  provider_capability_snapshot_id TEXT NOT NULL,
  ods_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  dispatch_capability_state TEXT NOT NULL,
  choice_visibility_state TEXT NOT NULL,
  recommendation_score DOUBLE PRECISION NOT NULL,
  timing_band INTEGER NOT NULL,
  service_fit_class INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_provider_ods
  ON phase6_pharmacy_provider (ods_code);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_choice_proof (
  pharmacy_choice_proof_id TEXT PRIMARY KEY,
  directory_snapshot_id TEXT NOT NULL,
  visible_choice_set_hash TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_choice_explanation (
  pharmacy_choice_explanation_id TEXT PRIMARY KEY,
  pharmacy_choice_proof_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  disclosure_tuple_hash TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_choice_explanation_proof
  ON phase6_pharmacy_choice_explanation (pharmacy_choice_proof_id, provider_id);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_choice_disclosure_policy (
  pharmacy_choice_disclosure_policy_id TEXT PRIMARY KEY,
  pharmacy_choice_proof_id TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_choice_session (
  pharmacy_choice_session_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  directory_snapshot_id TEXT NOT NULL,
  pharmacy_choice_proof_id TEXT NOT NULL,
  pharmacy_choice_disclosure_policy_id TEXT NOT NULL,
  selected_provider_id TEXT,
  selected_explanation_id TEXT,
  selected_capability_snapshot_id TEXT,
  override_acknowledgement_id TEXT,
  visible_choice_set_hash TEXT NOT NULL,
  selection_binding_hash TEXT,
  directory_tuple_hash TEXT NOT NULL,
  freshness_posture TEXT NOT NULL,
  session_state TEXT NOT NULL,
  revision INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_choice_session_case
  ON phase6_pharmacy_choice_session (pharmacy_case_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_choice_truth_projection (
  pharmacy_choice_truth_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  pharmacy_choice_session_id TEXT NOT NULL,
  directory_snapshot_id TEXT NOT NULL,
  selected_provider_id TEXT,
  selection_binding_hash TEXT,
  visible_choice_set_hash TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_choice_truth_projection_case
  ON phase6_pharmacy_choice_truth_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_choice_override_acknowledgement (
  pharmacy_choice_override_acknowledgement_id TEXT PRIMARY KEY,
  pharmacy_choice_session_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  override_requirement_state TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_consent_record (
  pharmacy_consent_record_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  pharmacy_choice_session_id TEXT NOT NULL,
  pharmacy_choice_proof_id TEXT NOT NULL,
  selected_explanation_id TEXT NOT NULL,
  selection_binding_hash TEXT NOT NULL,
  referral_scope TEXT NOT NULL,
  channel TEXT NOT NULL,
  consent_script_version_ref TEXT NOT NULL,
  package_fingerprint TEXT,
  state TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL,
  superseded_at TIMESTAMPTZ,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_consent_record_case
  ON phase6_pharmacy_consent_record (pharmacy_case_id, granted_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_consent_checkpoint (
  pharmacy_consent_checkpoint_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  pharmacy_choice_proof_id TEXT NOT NULL,
  selected_explanation_id TEXT NOT NULL,
  consent_record_id TEXT,
  latest_revocation_id TEXT,
  selection_binding_hash TEXT NOT NULL,
  package_fingerprint TEXT,
  checkpoint_state TEXT NOT NULL,
  continuity_state TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_consent_checkpoint_case
  ON phase6_pharmacy_consent_checkpoint (pharmacy_case_id, evaluated_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_consent_revocation_record (
  pharmacy_consent_revocation_record_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  pharmacy_consent_record_id TEXT NOT NULL,
  reason_class TEXT NOT NULL,
  revocation_state TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_consent_revocation_record_case
  ON phase6_pharmacy_consent_revocation_record (pharmacy_case_id, recorded_at DESC);

COMMIT;
