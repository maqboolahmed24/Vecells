BEGIN;

CREATE TABLE IF NOT EXISTS local_sessions (
  session_ref TEXT PRIMARY KEY,
  session_epoch_ref TEXT NOT NULL UNIQUE,
  subject_ref TEXT NOT NULL,
  identity_binding_ref TEXT,
  binding_version_ref TEXT,
  patient_link_ref TEXT,
  capability_decision_ref TEXT,
  post_auth_return_intent_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  session_state TEXT NOT NULL,
  writable_authority_state TEXT NOT NULL,
  max_grant_ceiling TEXT NOT NULL,
  cookie_digest TEXT NOT NULL UNIQUE,
  csrf_secret_digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  idle_expires_at TEXT NOT NULL,
  absolute_expires_at TEXT NOT NULL,
  reauth_due_at TEXT NOT NULL,
  rotated_from_session_ref TEXT,
  terminated_by_settlement_ref TEXT,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session_establishment_decisions (
  session_establishment_decision_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '171.phase2.auth-session.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-auth-session-v1'),
  auth_transaction_ref TEXT NOT NULL,
  post_auth_return_intent_ref TEXT NOT NULL,
  subject_comparison_state TEXT NOT NULL,
  draft_claim_disposition TEXT NOT NULL,
  return_intent_disposition TEXT NOT NULL,
  decision TEXT NOT NULL,
  writable_authority_state TEXT NOT NULL,
  session_epoch_action TEXT NOT NULL,
  cookie_rotation_action TEXT NOT NULL,
  csrf_rotation_action TEXT NOT NULL,
  max_grant_ceiling TEXT NOT NULL,
  projection_posture TEXT NOT NULL,
  materialized_posture TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  decided_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_termination_settlements (
  session_termination_settlement_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '171.phase2.auth-session.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-auth-session-v1'),
  session_epoch_ref TEXT NOT NULL,
  session_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  termination_type TEXT NOT NULL,
  settlement_decision TEXT NOT NULL,
  cookie_action TEXT NOT NULL,
  csrf_action TEXT NOT NULL,
  grant_action TEXT NOT NULL,
  projection_posture TEXT NOT NULL,
  materialized_posture TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_projection_materializations (
  projection_id TEXT PRIMARY KEY,
  session_ref TEXT,
  session_epoch_ref TEXT,
  posture TEXT NOT NULL,
  writable_authority_state TEXT NOT NULL,
  route_intent_binding_ref TEXT,
  reason_codes_json TEXT NOT NULL,
  materialized_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_sessions_cookie_digest
  ON local_sessions(cookie_digest);

CREATE INDEX IF NOT EXISTS idx_local_sessions_epoch_version
  ON local_sessions(session_ref, session_epoch_ref, version);

CREATE INDEX IF NOT EXISTS idx_session_termination_idempotency
  ON session_termination_settlements(idempotency_key);

COMMIT;
