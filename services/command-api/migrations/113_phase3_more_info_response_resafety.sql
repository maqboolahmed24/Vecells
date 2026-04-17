BEGIN;

CREATE TABLE IF NOT EXISTS phase3_more_info_response_dispositions (
  disposition_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  checkpoint_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  response_grant_ref TEXT,
  checkpoint_revision INTEGER NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  replay_key TEXT NOT NULL,
  source_payload_hash TEXT NOT NULL,
  replay_disposition TEXT NOT NULL,
  disposition_class TEXT NOT NULL,
  accepted INTEGER NOT NULL,
  late_review INTEGER NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  blocked_recovery_route_ref TEXT,
  resulting_response_assimilation_ref TEXT,
  resulting_evidence_assimilation_ref TEXT,
  received_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (checkpoint_revision >= 1),
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (accepted IN (0, 1)),
  CHECK (late_review IN (0, 1)),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_more_info_response_dispositions_idempotency
  ON phase3_more_info_response_dispositions (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_more_info_response_dispositions_replay
  ON phase3_more_info_response_dispositions (replay_key);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_response_dispositions_cycle_recorded
  ON phase3_more_info_response_dispositions (cycle_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_response_dispositions_request_recorded
  ON phase3_more_info_response_dispositions (request_id, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_response_assimilation_records (
  response_assimilation_record_id TEXT PRIMARY KEY,
  disposition_ref TEXT NOT NULL,
  task_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  evidence_capture_bundle_ref TEXT NOT NULL,
  evidence_snapshot_ref TEXT,
  evidence_assimilation_ref TEXT NOT NULL,
  material_delta_assessment_ref TEXT NOT NULL,
  classification_decision_ref TEXT NOT NULL,
  safety_preemption_ref TEXT,
  safety_decision_ref TEXT,
  urgent_diversion_settlement_ref TEXT,
  delta_feature_refs_json TEXT NOT NULL,
  impacted_rule_refs_json TEXT NOT NULL,
  conflict_vector_ref TEXT,
  requested_safety_state TEXT,
  safety_decision_outcome TEXT,
  resulting_safety_decision_epoch INTEGER NOT NULL,
  routing_outcome TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (resulting_safety_decision_epoch >= 0),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_response_assimilation_disposition_ref
  ON phase3_response_assimilation_records (disposition_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_response_assimilation_request_recorded
  ON phase3_response_assimilation_records (request_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_phase3_response_assimilation_cycle_recorded
  ON phase3_response_assimilation_records (cycle_id, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_more_info_supervisor_review_requirements (
  supervisor_review_requirement_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  triggering_response_assimilation_ref TEXT NOT NULL,
  window_start_at TEXT NOT NULL,
  window_ends_at TEXT NOT NULL,
  reopen_count_within_window INTEGER NOT NULL,
  suppress_automatic_routine_queue INTEGER NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (reopen_count_within_window >= 1),
  CHECK (suppress_automatic_routine_queue IN (0, 1)),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_supervisor_review_task_created
  ON phase3_more_info_supervisor_review_requirements (task_id, created_at);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_supervisor_review_request_created
  ON phase3_more_info_supervisor_review_requirements (request_id, created_at);

COMMIT;
