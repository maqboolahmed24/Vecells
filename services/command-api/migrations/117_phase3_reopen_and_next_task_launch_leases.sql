BEGIN;

CREATE INDEX IF NOT EXISTS idx_phase3_triage_reopen_records_task_source_reopened
  ON phase3_triage_reopen_records (task_id, source_domain, reopened_at);

CREATE TABLE IF NOT EXISTS phase3_next_task_launch_leases (
  next_task_launch_lease_id TEXT PRIMARY KEY,
  source_task_ref TEXT NOT NULL,
  launch_context_ref TEXT NOT NULL,
  prefetch_window_ref TEXT,
  next_task_candidate_ref TEXT NOT NULL,
  source_settlement_envelope_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  source_queue_key TEXT NOT NULL,
  source_rank_snapshot_ref TEXT NOT NULL,
  return_anchor_ref TEXT NOT NULL,
  launch_eligibility_state TEXT NOT NULL,
  blocking_reason_refs_json TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  lease_state TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_next_task_launch_leases_source_issued
  ON phase3_next_task_launch_leases (source_task_ref, issued_at);

CREATE INDEX IF NOT EXISTS idx_phase3_next_task_launch_leases_source_state
  ON phase3_next_task_launch_leases (source_task_ref, lease_state);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_next_task_launch_leases_live_candidate
  ON phase3_next_task_launch_leases (source_task_ref, next_task_candidate_ref, lease_state, expires_at);

COMMIT;
