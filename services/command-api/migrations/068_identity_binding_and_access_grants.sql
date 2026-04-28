-- par_068: append-only identity binding and grant-scoped access authorities
-- Governing sources:
-- - blueprint/phase-0-the-foundation-protocol.md#1.4 IdentityBinding
-- - blueprint/phase-0-the-foundation-protocol.md#1.6 AccessGrant
-- - blueprint/phase-0-the-foundation-protocol.md#2.2A IdentityBindingAuthority
-- - blueprint/phase-0-the-foundation-protocol.md#2.3 AccessGrantService

BEGIN;

CREATE TABLE IF NOT EXISTS identity_bindings (
  binding_id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  patient_ref TEXT NULL,
  runner_up_patient_ref TEXT NULL,
  candidate_patient_refs_json TEXT NOT NULL,
  candidate_set_ref TEXT NOT NULL,
  binding_state TEXT NOT NULL,
  ownership_state TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  assurance_level TEXT NOT NULL,
  verified_contact_route_ref TEXT NULL,
  match_evidence_ref TEXT NOT NULL,
  link_probability REAL NOT NULL,
  link_probability_lower_bound REAL NOT NULL,
  runner_up_probability_upper_bound REAL NOT NULL,
  subject_proof_probability_lower_bound REAL NOT NULL,
  gap_logit REAL NOT NULL,
  calibration_version_ref TEXT NOT NULL,
  confidence_model_state TEXT NOT NULL,
  binding_version INTEGER NOT NULL,
  binding_authority_ref TEXT NOT NULL,
  step_up_method TEXT NULL,
  supersedes_binding_ref TEXT NULL REFERENCES identity_bindings(binding_id),
  superseded_by_ref TEXT NULL REFERENCES identity_bindings(binding_id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT identity_binding_version_positive CHECK (binding_version >= 1),
  CONSTRAINT identity_binding_probabilities CHECK (
    link_probability BETWEEN 0 AND 1 AND
    link_probability_lower_bound BETWEEN 0 AND 1 AND
    runner_up_probability_upper_bound BETWEEN 0 AND 1 AND
    subject_proof_probability_lower_bound BETWEEN 0 AND 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS identity_bindings_request_version_idx
  ON identity_bindings (request_id, binding_version);

CREATE INDEX IF NOT EXISTS identity_bindings_episode_idx
  ON identity_bindings (episode_id, created_at);

CREATE TABLE IF NOT EXISTS patient_links (
  patient_link_id TEXT PRIMARY KEY,
  subject_ref TEXT NOT NULL,
  patient_ref TEXT NULL,
  identity_binding_ref TEXT NOT NULL REFERENCES identity_bindings(binding_id),
  link_state TEXT NOT NULL,
  link_probability REAL NOT NULL,
  link_probability_lower_bound REAL NOT NULL,
  runner_up_probability_upper_bound REAL NOT NULL,
  subject_proof_probability_lower_bound REAL NOT NULL,
  gap_logit REAL NOT NULL,
  calibration_version_ref TEXT NOT NULL,
  confidence_model_state TEXT NOT NULL,
  binding_version_ref TEXT NOT NULL,
  provenance_ref TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS patient_links_subject_idx
  ON patient_links (subject_ref, evaluated_at);

CREATE TABLE IF NOT EXISTS access_grant_scope_envelopes (
  scope_envelope_id TEXT PRIMARY KEY,
  grant_family TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  lineage_scope TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  governing_version_ref TEXT NOT NULL,
  phi_exposure_class TEXT NOT NULL,
  issued_route_intent_binding_ref TEXT NULL,
  required_identity_binding_ref TEXT NULL REFERENCES identity_bindings(binding_id),
  required_release_approval_freeze_ref TEXT NULL,
  required_channel_release_freeze_ref TEXT NULL,
  required_audience_surface_runtime_binding_ref TEXT NULL,
  minimum_bridge_capabilities_ref TEXT NULL,
  required_assurance_slice_trust_refs_json TEXT NOT NULL,
  recovery_route_ref TEXT NOT NULL,
  scope_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS access_grant_scope_envelopes_scope_hash_idx
  ON access_grant_scope_envelopes (scope_hash);

CREATE TABLE IF NOT EXISTS access_grants (
  grant_id TEXT PRIMARY KEY,
  grant_family TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  lineage_scope TEXT NOT NULL,
  grant_scope_envelope_ref TEXT NOT NULL REFERENCES access_grant_scope_envelopes(scope_envelope_id),
  route_family_ref TEXT NOT NULL,
  subject_ref TEXT NULL,
  bound_patient_ref TEXT NULL,
  issued_identity_binding_ref TEXT NULL REFERENCES identity_bindings(binding_id),
  bound_contact_route_ref TEXT NULL,
  subject_binding_mode TEXT NOT NULL,
  phi_exposure_class TEXT NOT NULL,
  replay_policy TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  token_key_version_ref TEXT NOT NULL,
  validator_version_ref TEXT NOT NULL,
  validator_family TEXT NOT NULL,
  issued_route_intent_binding_ref TEXT NULL,
  issued_session_epoch_ref TEXT NULL,
  issued_subject_binding_version_ref TEXT NULL,
  issued_lineage_fence_epoch INTEGER NOT NULL,
  required_release_approval_freeze_ref TEXT NULL,
  required_channel_release_freeze_ref TEXT NULL,
  required_audience_surface_runtime_binding_ref TEXT NULL,
  grant_state TEXT NOT NULL,
  max_redemptions INTEGER NOT NULL,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  current_redemption_ref TEXT NULL,
  latest_supersession_ref TEXT NULL,
  expires_at TEXT NOT NULL,
  redeemed_at TEXT NULL,
  revoked_at TEXT NULL,
  revocation_reason TEXT NULL,
  supersedes_grant_ref TEXT NULL REFERENCES access_grants(grant_id),
  superseded_by_grant_ref TEXT NULL REFERENCES access_grants(grant_id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT access_grants_redemption_bounds CHECK (
    max_redemptions >= 1 AND
    redemption_count >= 0 AND
    redemption_count <= max_redemptions
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS access_grants_token_hash_idx
  ON access_grants (token_hash);

CREATE INDEX IF NOT EXISTS access_grants_scope_idx
  ON access_grants (grant_scope_envelope_ref, grant_state, expires_at);

CREATE TABLE IF NOT EXISTS access_grant_redemption_records (
  redemption_id TEXT PRIMARY KEY,
  grant_ref TEXT NOT NULL REFERENCES access_grants(grant_id),
  grant_scope_envelope_ref TEXT NOT NULL REFERENCES access_grant_scope_envelopes(scope_envelope_id),
  request_context_hash TEXT NOT NULL,
  authorization_fence_hash TEXT NOT NULL,
  decision TEXT NOT NULL,
  decision_reason_codes_json TEXT NOT NULL,
  grant_state_after_decision TEXT NOT NULL,
  resulting_session_ref TEXT NULL,
  resulting_route_intent_binding_ref TEXT NULL,
  replacement_grant_ref TEXT NULL REFERENCES access_grants(grant_id),
  supersession_record_ref TEXT NULL,
  recovery_route_ref TEXT NULL,
  recorded_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS access_grant_redemption_records_grant_context_idx
  ON access_grant_redemption_records (grant_ref, request_context_hash);

CREATE TABLE IF NOT EXISTS access_grant_supersession_records (
  supersession_id TEXT PRIMARY KEY,
  cause_class TEXT NOT NULL,
  superseded_grant_refs_json TEXT NOT NULL,
  replacement_grant_ref TEXT NULL REFERENCES access_grants(grant_id),
  governing_object_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  session_epoch_ref TEXT NULL,
  subject_binding_version_ref TEXT NULL,
  reason_codes_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS access_grant_supersession_records_governing_idx
  ON access_grant_supersession_records (governing_object_ref, recorded_at);

COMMIT;
