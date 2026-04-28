BEGIN;

CREATE TABLE IF NOT EXISTS phase1_submission_snapshot_freezes (
  submission_snapshot_freeze_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL UNIQUE,
  draft_public_id TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  draft_version INTEGER NOT NULL,
  request_type TEXT NOT NULL,
  intake_experience_bundle_ref TEXT NOT NULL,
  validation_verdict_hash TEXT NOT NULL,
  active_question_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_structured_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  free_text_narrative TEXT NOT NULL,
  attachment_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_preferences_ref TEXT NULL,
  contact_preference_freeze_ref TEXT NULL,
  route_family_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  audience_surface_runtime_binding_ref TEXT NOT NULL,
  release_approval_freeze_ref TEXT NOT NULL,
  channel_release_freeze_state TEXT NOT NULL,
  manifest_version_ref TEXT NOT NULL,
  session_epoch_ref TEXT NULL,
  surface_channel_profile TEXT NOT NULL,
  ingress_channel TEXT NOT NULL,
  intake_convergence_contract_ref TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  semantic_hash TEXT NOT NULL,
  normalized_candidate_hash TEXT NOT NULL,
  evidence_capture_bundle_ref TEXT NOT NULL,
  frozen_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase1_submission_snapshot_freezes_draft
  ON phase1_submission_snapshot_freezes (draft_public_id, frozen_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase1_submission_snapshot_freezes_capture_bundle
  ON phase1_submission_snapshot_freezes (evidence_capture_bundle_ref);

CREATE TABLE IF NOT EXISTS phase1_submit_normalization_seeds (
  submit_normalization_seed_id TEXT PRIMARY KEY,
  submission_snapshot_freeze_ref TEXT NOT NULL UNIQUE,
  envelope_ref TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  evidence_capture_bundle_ref TEXT NOT NULL,
  request_type TEXT NOT NULL,
  intake_experience_bundle_ref TEXT NOT NULL,
  normalization_version_ref TEXT NOT NULL,
  normalized_hash TEXT NOT NULL,
  dedupe_fingerprint TEXT NOT NULL,
  future_contract_gap_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  normalized_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_submit_normalization_seeds_hash
  ON phase1_submit_normalization_seeds (normalized_hash);

CREATE INDEX IF NOT EXISTS idx_phase1_submit_normalization_seeds_envelope
  ON phase1_submit_normalization_seeds (envelope_ref, created_at DESC);

CREATE TABLE IF NOT EXISTS phase1_intake_submit_settlements (
  intake_submit_settlement_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  settlement_state TEXT NOT NULL,
  request_ref TEXT NULL,
  request_lineage_ref TEXT NULL,
  promotion_record_ref TEXT NULL,
  submission_snapshot_freeze_ref TEXT NULL,
  evidence_capture_bundle_ref TEXT NULL,
  evidence_snapshot_ref TEXT NULL,
  normalized_submission_ref TEXT NULL,
  collision_review_ref TEXT NULL,
  command_action_record_ref TEXT NULL,
  command_settlement_record_ref TEXT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  receipt_consistency_key TEXT NULL,
  status_consistency_key TEXT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  gap_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_intake_submit_settlements_envelope_latest
  ON phase1_intake_submit_settlements (envelope_ref);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_intake_submit_settlements_request
  ON phase1_intake_submit_settlements (request_ref)
  WHERE request_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_intake_submit_settlements_receipt_key
  ON phase1_intake_submit_settlements (receipt_consistency_key)
  WHERE receipt_consistency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase1_intake_submit_settlements_status_key
  ON phase1_intake_submit_settlements (status_consistency_key)
  WHERE status_consistency_key IS NOT NULL;

COMMIT;
