BEGIN;

CREATE TABLE IF NOT EXISTS phase3_duplicate_review_snapshots (
  duplicate_review_snapshot_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  duplicate_cluster_ref TEXT NOT NULL,
  candidate_request_refs_json TEXT NOT NULL,
  pair_evidence_refs_json TEXT NOT NULL,
  winning_pair_evidence_ref TEXT,
  competing_pair_evidence_refs_json TEXT NOT NULL,
  current_resolution_decision_ref TEXT NOT NULL,
  current_decision_class TEXT NOT NULL,
  current_decision_state TEXT NOT NULL,
  continuity_witness_summary_ref TEXT NOT NULL,
  continuity_witness_requirement_state TEXT NOT NULL,
  required_continuity_witness_classes_json TEXT NOT NULL,
  instability_state TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  candidate_members_json TEXT NOT NULL,
  queue_relevance_json TEXT NOT NULL,
  workspace_relevance_json TEXT NOT NULL,
  current_invalidation_burden_json TEXT NOT NULL,
  last_rendered_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_duplicate_review_snapshots_task_rendered
  ON phase3_duplicate_review_snapshots (task_id, last_rendered_at);

CREATE TABLE IF NOT EXISTS phase3_duplicate_consequence_invalidations (
  duplicate_consequence_invalidation_id TEXT PRIMARY KEY,
  duplicate_cluster_ref TEXT NOT NULL,
  causing_decision_ref TEXT NOT NULL,
  superseded_decision_ref TEXT,
  task_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  reason_class TEXT NOT NULL,
  decision_supersession_record_ref TEXT NOT NULL,
  recorded_by_ref TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_duplicate_consequence_invalidations_cluster_recorded
  ON phase3_duplicate_consequence_invalidations (duplicate_cluster_ref, recorded_at);

CREATE INDEX IF NOT EXISTS idx_phase3_duplicate_consequence_invalidations_decision_recorded
  ON phase3_duplicate_consequence_invalidations (causing_decision_ref, recorded_at);

COMMIT;
