BEGIN;

CREATE TABLE IF NOT EXISTS identity_evidence_key_versions (
  key_version_ref TEXT PRIMARY KEY,
  algorithm TEXT NOT NULL CHECK (algorithm = 'AES-256-GCM'),
  key_purpose TEXT NOT NULL CHECK (key_purpose = 'identity_evidence_kek'),
  state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retired_at TEXT
);

CREATE TABLE IF NOT EXISTS identity_evidence_envelopes (
  identity_evidence_envelope_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '170.phase2.trust.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-trust-v1'),
  vault_ref TEXT NOT NULL UNIQUE,
  evidence_namespace TEXT NOT NULL,
  evidence_kind TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  claim_digest TEXT NOT NULL,
  masked_display_json TEXT NOT NULL,
  key_version_ref TEXT NOT NULL REFERENCES identity_evidence_key_versions(key_version_ref),
  append_only_sequence INTEGER NOT NULL UNIQUE,
  previous_envelope_ref TEXT,
  disclosure_class TEXT NOT NULL,
  retention_class TEXT NOT NULL,
  destruction_eligible_at TEXT,
  provenance_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityEvidenceVault')
);

CREATE TABLE IF NOT EXISTS identity_evidence_ciphertexts (
  vault_ref TEXT PRIMARY KEY REFERENCES identity_evidence_envelopes(vault_ref),
  envelope_ref TEXT NOT NULL UNIQUE REFERENCES identity_evidence_envelopes(identity_evidence_envelope_id),
  algorithm TEXT NOT NULL CHECK (algorithm = 'AES-256-GCM'),
  key_version_ref TEXT NOT NULL,
  encrypted_data_key TEXT NOT NULL,
  data_key_iv TEXT NOT NULL,
  data_key_auth_tag TEXT NOT NULL,
  payload_iv TEXT NOT NULL,
  payload_auth_tag TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  aad_digest TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_evidence_lookup_tokens (
  lookup_token_id TEXT PRIMARY KEY,
  evidence_namespace TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  envelope_ref TEXT NOT NULL REFERENCES identity_evidence_envelopes(identity_evidence_envelope_id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_evidence_access_audit (
  access_audit_id TEXT PRIMARY KEY,
  envelope_ref TEXT,
  actor_ref TEXT NOT NULL,
  purpose TEXT NOT NULL,
  access_type TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_identity_evidence_lookup_tokens
  ON identity_evidence_lookup_tokens(evidence_namespace, token_hash);

CREATE INDEX IF NOT EXISTS idx_identity_evidence_envelopes_subject_namespace
  ON identity_evidence_envelopes(subject_ref, evidence_namespace, append_only_sequence);

CREATE INDEX IF NOT EXISTS idx_identity_evidence_access_audit_envelope
  ON identity_evidence_access_audit(envelope_ref, recorded_at);

COMMIT;
