BEGIN;

CREATE TABLE IF NOT EXISTS phase1_contact_preference_captures (
  contact_preference_capture_id TEXT PRIMARY KEY,
  contact_preferences_ref TEXT NOT NULL,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  capture_version INTEGER NOT NULL,
  preferred_channel TEXT NOT NULL,
  contact_window TEXT NOT NULL,
  voicemail_allowed BOOLEAN NOT NULL,
  follow_up_permission BOOLEAN NULL,
  sms_destination_raw TEXT NULL,
  sms_destination_normalized TEXT NULL,
  sms_destination_masked TEXT NULL,
  phone_destination_raw TEXT NULL,
  phone_destination_normalized TEXT NULL,
  phone_destination_masked TEXT NULL,
  email_destination_raw TEXT NULL,
  email_destination_normalized TEXT NULL,
  email_destination_masked TEXT NULL,
  quiet_hours_start_local_time TEXT NULL,
  quiet_hours_end_local_time TEXT NULL,
  quiet_hours_timezone TEXT NULL,
  language_preference TEXT NULL,
  translation_required BOOLEAN NOT NULL,
  accessibility_needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_authority_class TEXT NOT NULL,
  source_evidence_ref TEXT NOT NULL,
  semantic_materiality_class TEXT NOT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload_hash TEXT NOT NULL,
  supersedes_contact_preference_capture_ref TEXT NULL,
  client_command_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_contact_preference_captures_draft_idempotency
  ON phase1_contact_preference_captures (draft_public_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_contact_preference_captures_draft_payload_hash
  ON phase1_contact_preference_captures (draft_public_id, payload_hash);

CREATE INDEX IF NOT EXISTS idx_phase1_contact_preference_captures_draft_version
  ON phase1_contact_preference_captures (draft_public_id, capture_version DESC);

CREATE TABLE IF NOT EXISTS phase1_contact_preference_masked_views (
  masked_view_id TEXT PRIMARY KEY,
  contact_preference_capture_ref TEXT NOT NULL UNIQUE,
  contact_preferences_ref TEXT NOT NULL,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  preferred_channel TEXT NOT NULL,
  preferred_destination_masked TEXT NULL,
  destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_permission_state TEXT NOT NULL,
  contact_window TEXT NOT NULL,
  voicemail_allowed BOOLEAN NOT NULL,
  quiet_hours_summary TEXT NULL,
  language_preference TEXT NULL,
  translation_required BOOLEAN NOT NULL,
  accessibility_needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_authority_class TEXT NOT NULL,
  completeness_state TEXT NOT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase1_contact_preference_masked_views_draft
  ON phase1_contact_preference_masked_views (draft_public_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase1_contact_route_snapshot_seeds (
  route_snapshot_seed_id TEXT PRIMARY KEY,
  contact_preference_capture_ref TEXT NOT NULL UNIQUE,
  contact_preferences_ref TEXT NOT NULL,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  preferred_channel TEXT NOT NULL,
  route_kind TEXT NOT NULL,
  route_ref TEXT NOT NULL,
  route_version_ref TEXT NOT NULL,
  normalized_address_ref TEXT NOT NULL,
  masked_destination TEXT NOT NULL,
  verification_state TEXT NOT NULL,
  demographic_freshness_state TEXT NOT NULL,
  preference_freshness_state TEXT NOT NULL,
  source_authority_class TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase1_contact_route_snapshot_seeds_draft
  ON phase1_contact_route_snapshot_seeds (draft_public_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase1_contact_preference_submit_freezes (
  contact_preference_submit_freeze_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL UNIQUE,
  draft_public_id TEXT NOT NULL,
  contact_preference_capture_ref TEXT NOT NULL,
  contact_preferences_ref TEXT NOT NULL,
  masked_view_ref TEXT NOT NULL,
  route_snapshot_seed_ref TEXT NULL,
  frozen_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase1_contact_preference_submit_freezes_draft
  ON phase1_contact_preference_submit_freezes (draft_public_id, frozen_at DESC);

COMMIT;
