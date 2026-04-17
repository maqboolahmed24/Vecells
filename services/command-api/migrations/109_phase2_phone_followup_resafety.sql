-- Phase 2 task 194: phone follow-up duplicate attachment and re-safety.
-- The tables are append-only seams for late phone/SMS/support evidence.
-- Payload columns contain canonical refs, redacted provenance, and hashes only.

CREATE TABLE IF NOT EXISTS phase2_phone_followup_frozen_evidence_batches (
  followup_batch_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  command_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  followup_channel TEXT NOT NULL,
  evidence_kind TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  semantic_hash TEXT NOT NULL,
  duplicate_digest_ref TEXT NOT NULL,
  frozen_evidence_refs_json TEXT NOT NULL,
  grouped_evidence_refs_json TEXT NOT NULL,
  provenance_refs_json TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  frozen_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_phone_followup_duplicate_digests (
  duplicate_digest_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  request_id TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  exact_digest TEXT NOT NULL,
  semantic_digest TEXT NOT NULL,
  replay_key TEXT NOT NULL,
  component_digests_json TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  digest_basis_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_phone_followup_duplicate_evaluations (
  duplicate_evaluation_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  request_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  incoming_batch_ref TEXT NOT NULL REFERENCES phase2_phone_followup_frozen_evidence_batches(followup_batch_ref),
  duplicate_digest_ref TEXT NOT NULL REFERENCES phase2_phone_followup_duplicate_digests(duplicate_digest_ref),
  relation_class TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  target_request_ref TEXT,
  target_episode_ref TEXT,
  target_request_lineage_ref TEXT,
  continuity_witness_json TEXT NOT NULL,
  score_only_attach_rejected INTEGER NOT NULL,
  review_required INTEGER NOT NULL,
  reason_codes_json TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  decided_by_ref TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_phone_followup_projection_holds (
  projection_hold_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  request_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  evidence_assimilation_ref TEXT NOT NULL,
  material_delta_assessment_ref TEXT NOT NULL,
  classification_decision_ref TEXT NOT NULL,
  safety_preemption_ref TEXT,
  hold_state TEXT NOT NULL,
  patient_visible_calm_status_allowed INTEGER NOT NULL,
  patient_visible_state TEXT NOT NULL,
  staff_actionability TEXT NOT NULL,
  stale_routine_projection_suppressed INTEGER NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_phone_followup_assimilation_outcomes (
  followup_outcome_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  replay_classification TEXT NOT NULL,
  replayed INTEGER NOT NULL,
  followup_batch_ref TEXT NOT NULL REFERENCES phase2_phone_followup_frozen_evidence_batches(followup_batch_ref),
  duplicate_digest_ref TEXT NOT NULL REFERENCES phase2_phone_followup_duplicate_digests(duplicate_digest_ref),
  duplicate_evaluation_ref TEXT NOT NULL REFERENCES phase2_phone_followup_duplicate_evaluations(duplicate_evaluation_ref),
  evidence_assimilation_ref TEXT NOT NULL,
  material_delta_assessment_ref TEXT NOT NULL,
  classification_decision_ref TEXT NOT NULL,
  safety_preemption_ref TEXT,
  projection_hold_ref TEXT NOT NULL REFERENCES phase2_phone_followup_projection_holds(projection_hold_ref),
  reason_codes_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase2_phone_followup_idempotency
  ON phase2_phone_followup_assimilation_outcomes(idempotency_key)
  WHERE replay_classification != 'collision_review';

CREATE INDEX IF NOT EXISTS idx_phase2_phone_followup_replay_key
  ON phase2_phone_followup_duplicate_digests(replay_key);

CREATE INDEX IF NOT EXISTS idx_phase2_phone_followup_request_hold
  ON phase2_phone_followup_projection_holds(request_id, hold_state, created_at);
