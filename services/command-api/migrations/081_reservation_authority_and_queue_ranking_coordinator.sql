BEGIN;

CREATE TABLE IF NOT EXISTS reservation_fence_records (
  reservation_fence_record_id TEXT PRIMARY KEY,
  canonical_reservation_key TEXT NOT NULL,
  capacity_identity_ref TEXT NOT NULL,
  holder_ref TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_object_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  projection_freshness_envelope_ref TEXT NOT NULL,
  fence_token TEXT NOT NULL,
  reservation_state TEXT NOT NULL,
  commit_mode TEXT NOT NULL,
  state TEXT NOT NULL,
  truth_basis_hash TEXT NULL,
  source_reservation_ref TEXT NULL,
  source_projection_ref TEXT NULL,
  activated_at TEXT NOT NULL,
  expires_at TEXT NULL,
  released_at TEXT NULL,
  expired_at TEXT NULL,
  blocking_fence_ref TEXT NULL,
  reason_refs_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'ReservationFenceRecord',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_reservation_ref) REFERENCES capacity_reservations(reservation_id),
  FOREIGN KEY (source_projection_ref) REFERENCES reservation_truth_projections(reservation_truth_projection_id),
  FOREIGN KEY (blocking_fence_ref) REFERENCES reservation_fence_records(reservation_fence_record_id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_fence_records_key_state
  ON reservation_fence_records(canonical_reservation_key, state, activated_at);

CREATE TABLE IF NOT EXISTS queue_snapshot_commit_records (
  queue_snapshot_commit_record_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  queue_ref TEXT NOT NULL,
  queue_family_ref TEXT NOT NULL,
  queue_rank_plan_ref TEXT NOT NULL,
  source_fact_cut_ref TEXT NOT NULL,
  row_order_hash TEXT NOT NULL,
  overload_state TEXT NOT NULL,
  fairness_merge_state TEXT NOT NULL,
  fairness_merge_classes_json TEXT NOT NULL DEFAULT '[]',
  eligible_task_refs_json TEXT NOT NULL DEFAULT '[]',
  held_task_refs_json TEXT NOT NULL DEFAULT '[]',
  assignment_suggestion_ref TEXT NULL,
  committed_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'QueueSnapshotCommitRecord',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rank_snapshot_ref) REFERENCES queue_rank_snapshots(rank_snapshot_id),
  FOREIGN KEY (assignment_suggestion_ref) REFERENCES queue_assignment_suggestion_snapshots(suggestion_snapshot_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_snapshot_commit_rank_snapshot
  ON queue_snapshot_commit_records(rank_snapshot_ref);

CREATE TABLE IF NOT EXISTS queue_pressure_escalation_records (
  queue_pressure_escalation_record_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  queue_ref TEXT NOT NULL,
  overload_state TEXT NOT NULL,
  pressure_ratio REAL NOT NULL,
  critical_arrival_rate_per_hour REAL NOT NULL,
  empirical_service_rate_per_hour REAL NOT NULL,
  active_reviewer_count INTEGER NOT NULL,
  reason_refs_json TEXT NOT NULL DEFAULT '[]',
  escalated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'QueuePressureEscalationRecord',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rank_snapshot_ref) REFERENCES queue_rank_snapshots(rank_snapshot_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_pressure_escalation_rank_snapshot
  ON queue_pressure_escalation_records(rank_snapshot_ref);

CREATE TABLE IF NOT EXISTS next_task_advisory_snapshots (
  next_task_advisory_snapshot_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  reviewer_scope_ref TEXT NOT NULL,
  advisory_state TEXT NOT NULL,
  source_suggestion_snapshot_ref TEXT NULL,
  next_task_refs_json TEXT NOT NULL DEFAULT '[]',
  governed_auto_claim_refs_json TEXT NOT NULL DEFAULT '[]',
  blocked_reason_refs_json TEXT NOT NULL DEFAULT '[]',
  stale_owner_recovery_refs_json TEXT NOT NULL DEFAULT '[]',
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'NextTaskAdvisorySnapshot',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rank_snapshot_ref) REFERENCES queue_rank_snapshots(rank_snapshot_id),
  FOREIGN KEY (source_suggestion_snapshot_ref) REFERENCES queue_assignment_suggestion_snapshots(suggestion_snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_next_task_advisory_rank_snapshot
  ON next_task_advisory_snapshots(rank_snapshot_ref, generated_at);

COMMIT;
