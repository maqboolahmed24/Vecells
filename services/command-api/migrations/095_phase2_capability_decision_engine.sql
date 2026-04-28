-- Phase 2 par_180: CapabilityDecisionEngine route-capability and scope-envelope authority.
-- The tables are append-only audit surfaces for deterministic decisions; CapabilityDecision is a ceiling only.

CREATE TABLE IF NOT EXISTS route_capability_profile_registry (
  route_profile_ref TEXT PRIMARY KEY,
  profile_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  route_family TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  sensitivity_class TEXT NOT NULL,
  requires_authenticated_subject BOOLEAN NOT NULL,
  requires_high_assurance_binding BOOLEAN NOT NULL,
  requires_writable_authority BOOLEAN NOT NULL,
  supports_recovery BOOLEAN NOT NULL,
  supports_step_up BOOLEAN NOT NULL,
  profile_payload_json TEXT NOT NULL,
  profile_hash TEXT NOT NULL,
  lifecycle TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'CapabilityDecisionEngine'),
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS route_capability_profile_registry_tuple_idx
  ON route_capability_profile_registry (route_family, action_scope, profile_version);

CREATE TABLE IF NOT EXISTS capability_decision_records (
  capability_decision_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  engine_authority TEXT NOT NULL CHECK (engine_authority = 'CapabilityDecisionEngine'),
  route_profile_ref TEXT NOT NULL,
  route_profile_version TEXT,
  identity_context_ref TEXT NOT NULL,
  subject_ref TEXT,
  patient_link_ref TEXT,
  identity_binding_ref TEXT,
  decision_state TEXT NOT NULL CHECK (
    decision_state IN ('allow', 'step_up_required', 'recover_only', 'deny')
  ),
  writable_authority_state TEXT NOT NULL CHECK (
    writable_authority_state IN ('writable', 'read_only', 'blocked')
  ),
  max_grant_ceiling TEXT NOT NULL,
  capability_ceiling TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  decision_inputs_json TEXT NOT NULL,
  identity_binding_mutation TEXT NOT NULL CHECK (identity_binding_mutation = 'none'),
  capability_is_ceiling_only BOOLEAN NOT NULL CHECK (capability_is_ceiling_only = TRUE),
  subject_binding_version_ref TEXT,
  session_epoch_ref TEXT,
  lineage_fence_ref TEXT,
  derived_trust_band TEXT NOT NULL,
  trust_floor TEXT NOT NULL,
  freshness_score REAL NOT NULL,
  risk_upper_bound REAL NOT NULL,
  route_tuple_hash TEXT NOT NULL,
  edge_correlation_id TEXT,
  step_up_path_ref TEXT,
  recovery_path_ref TEXT,
  evaluated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS capability_decision_records_route_tuple_idx
  ON capability_decision_records (route_profile_ref, route_tuple_hash, evaluated_at);

CREATE INDEX IF NOT EXISTS capability_decision_records_fence_idx
  ON capability_decision_records (
    subject_binding_version_ref,
    session_epoch_ref,
    lineage_fence_ref
  );

CREATE TABLE IF NOT EXISTS scope_envelope_authorization_records (
  scope_envelope_authorization_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  scope_envelope_ref TEXT NOT NULL,
  authorization_state TEXT NOT NULL CHECK (
    authorization_state IN ('authorized', 'recover_only', 'deny')
  ),
  route_tuple_hash TEXT NOT NULL,
  drift_fields_json TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  authorized_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scope_envelope_authorization_records_scope_idx
  ON scope_envelope_authorization_records (scope_envelope_ref, route_tuple_hash, authorized_at);

CREATE TABLE IF NOT EXISTS capability_policy_audit (
  audit_record_ref TEXT PRIMARY KEY,
  policy_version TEXT NOT NULL,
  route_profile_ref TEXT,
  capability_decision_id TEXT,
  scope_envelope_authorization_id TEXT,
  reason_codes_json TEXT NOT NULL,
  route_tuple_hash TEXT,
  edge_correlation_id TEXT,
  recorded_by_authority TEXT NOT NULL CHECK (recorded_by_authority = 'CapabilityDecisionEngine'),
  recorded_at TEXT NOT NULL
);
