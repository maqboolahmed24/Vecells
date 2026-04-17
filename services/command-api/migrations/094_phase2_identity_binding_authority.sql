BEGIN;

CREATE TABLE IF NOT EXISTS identity_binding_authority_versions (
  binding_version_ref TEXT PRIMARY KEY,
  identity_binding_id TEXT NOT NULL,
  schema_version TEXT NOT NULL CHECK (schema_version = '170.phase2.trust.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-binding-authority-v1'),
  subject_ref TEXT NOT NULL,
  patient_ref TEXT,
  binding_state TEXT NOT NULL,
  ownership_state TEXT NOT NULL,
  assurance_level TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  binding_version INTEGER NOT NULL,
  supersedes_binding_version_ref TEXT,
  patient_link_decision_ref TEXT,
  route_intent_binding_ref TEXT,
  confidence_json TEXT NOT NULL,
  provenance_refs_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityBindingAuthority'),
  UNIQUE(subject_ref, binding_version)
);

CREATE TABLE IF NOT EXISTS identity_binding_current_pointers (
  subject_ref TEXT PRIMARY KEY,
  current_binding_version_ref TEXT REFERENCES identity_binding_authority_versions(binding_version_ref),
  current_patient_ref TEXT,
  pointer_epoch INTEGER NOT NULL,
  binding_state TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_binding_command_settlements (
  command_settlement_id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  subject_ref TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  decision TEXT NOT NULL,
  binding_version_ref TEXT REFERENCES identity_binding_authority_versions(binding_version_ref),
  previous_binding_version_ref TEXT,
  current_pointer_epoch_before INTEGER NOT NULL,
  current_pointer_epoch_after INTEGER NOT NULL,
  derived_patient_ref_settlement_refs_json TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_binding_lineage_patient_refs (
  derived_settlement_ref TEXT PRIMARY KEY,
  lineage_kind TEXT NOT NULL,
  lineage_ref TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  previous_patient_ref TEXT,
  next_patient_ref TEXT,
  previous_binding_version_ref TEXT,
  next_binding_version_ref TEXT NOT NULL REFERENCES identity_binding_authority_versions(binding_version_ref),
  updated_by_authority TEXT NOT NULL CHECK (updated_by_authority = 'IdentityBindingAuthority'),
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL,
  UNIQUE(lineage_kind, lineage_ref)
);

CREATE TABLE IF NOT EXISTS identity_binding_freeze_holds (
  freeze_hold_ref TEXT PRIMARY KEY,
  subject_ref TEXT NOT NULL,
  state TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  released_at TEXT
);

CREATE TABLE IF NOT EXISTS identity_binding_authority_audit (
  audit_record_ref TEXT PRIMARY KEY,
  subject_ref TEXT NOT NULL,
  command_settlement_ref TEXT NOT NULL REFERENCES identity_binding_command_settlements(command_settlement_id),
  actor_ref TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_identity_binding_versions_subject
  ON identity_binding_authority_versions(subject_ref, binding_version);

CREATE INDEX IF NOT EXISTS idx_identity_binding_current_pointer_epoch
  ON identity_binding_current_pointers(subject_ref, pointer_epoch);

CREATE INDEX IF NOT EXISTS idx_identity_binding_settlements_subject
  ON identity_binding_command_settlements(subject_ref, settled_at);

CREATE INDEX IF NOT EXISTS idx_identity_binding_lineage_refs
  ON identity_binding_lineage_patient_refs(lineage_kind, lineage_ref, next_binding_version_ref);

CREATE INDEX IF NOT EXISTS idx_identity_binding_freeze_active
  ON identity_binding_freeze_holds(subject_ref, state);

COMMIT;
