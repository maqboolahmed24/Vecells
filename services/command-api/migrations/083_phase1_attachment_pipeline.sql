BEGIN;

CREATE TABLE IF NOT EXISTS phase1_attachment_records (
  attachment_public_id TEXT PRIMARY KEY,
  draft_public_id TEXT NOT NULL,
  request_public_id TEXT NULL,
  lifecycle_state TEXT NOT NULL,
  classification_outcome TEXT NULL,
  outcome_ref TEXT NOT NULL,
  declared_mime_type TEXT NOT NULL,
  detected_mime_type TEXT NULL,
  byte_size BIGINT NOT NULL,
  checksum_sha256 TEXT NULL,
  content_fingerprint TEXT NULL,
  quarantine_object_key TEXT NULL,
  durable_object_key TEXT NULL,
  preview_object_key TEXT NULL,
  document_reference_ref TEXT NULL,
  latest_scan_attempt_ref TEXT NULL,
  latest_derivative_ref TEXT NULL,
  replacement_for_attachment_public_id TEXT NULL,
  replaced_by_attachment_public_id TEXT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  simulator_scenario_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase1_attachment_records_draft
  ON phase1_attachment_records (draft_public_id, created_at);

CREATE INDEX IF NOT EXISTS idx_phase1_attachment_records_request
  ON phase1_attachment_records (request_public_id, created_at);

CREATE INDEX IF NOT EXISTS idx_phase1_attachment_records_fingerprint
  ON phase1_attachment_records (draft_public_id, content_fingerprint);

CREATE TABLE IF NOT EXISTS phase1_attachment_upload_sessions (
  upload_session_id TEXT PRIMARY KEY,
  attachment_public_id TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  duplicate_disposition TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  upload_token TEXT NULL,
  quarantine_object_key TEXT NULL,
  transport_state TEXT NOT NULL,
  replacement_for_attachment_public_id TEXT NULL,
  initiated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_attachment_upload_sessions_idempotency
  ON phase1_attachment_upload_sessions (idempotency_key);

CREATE TABLE IF NOT EXISTS phase1_attachment_scan_attempts (
  scan_attempt_ref TEXT PRIMARY KEY,
  attachment_public_id TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  scanner_ref TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  verdict TEXT NOT NULL,
  detected_mime_type TEXT NOT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase1_attachment_scan_attempts_attachment
  ON phase1_attachment_scan_attempts (attachment_public_id, settled_at);

CREATE TABLE IF NOT EXISTS phase1_attachment_derivative_settlements (
  derivative_ref TEXT PRIMARY KEY,
  attachment_public_id TEXT NOT NULL,
  settlement_state TEXT NOT NULL,
  derivative_object_key TEXT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase1_attachment_derivatives_attachment
  ON phase1_attachment_derivative_settlements (attachment_public_id, generated_at);

CREATE TABLE IF NOT EXISTS phase1_attachment_document_reference_links (
  link_ref TEXT PRIMARY KEY,
  attachment_public_id TEXT NOT NULL UNIQUE,
  draft_public_id TEXT NOT NULL,
  request_public_id TEXT NULL,
  document_reference_logical_id TEXT NOT NULL,
  document_reference_record_ref TEXT NOT NULL,
  representation_set_ref TEXT NOT NULL,
  durable_object_key TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase1_attachment_read_grants (
  grant_id TEXT PRIMARY KEY,
  attachment_public_id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  action TEXT NOT NULL,
  state TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  continuity_key TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  return_target_ref TEXT NOT NULL,
  scrubbed_destination TEXT NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

COMMIT;
