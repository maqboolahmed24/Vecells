BEGIN;

CREATE TABLE IF NOT EXISTS phase3_more_info_cycles (
  cycle_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  state TEXT NOT NULL,
  prompt_set_ref TEXT NOT NULL,
  channel_ref TEXT NOT NULL,
  response_route_family_ref TEXT NOT NULL,
  due_at TEXT NOT NULL,
  late_review_starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  active_checkpoint_ref TEXT NOT NULL,
  reminder_schedule_ref TEXT NOT NULL,
  response_grant_ref TEXT,
  response_grant_expires_at TEXT,
  supersedes_cycle_ref TEXT,
  superseded_by_cycle_ref TEXT,
  latest_response_classification TEXT,
  response_received_at TEXT,
  callback_fallback_seed_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_cycles_task_created
  ON phase3_more_info_cycles (task_id, created_at);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_cycles_lineage_created
  ON phase3_more_info_cycles (request_lineage_ref, created_at);

CREATE TABLE IF NOT EXISTS phase3_more_info_reply_window_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  checkpoint_revision INTEGER NOT NULL,
  reply_window_state TEXT NOT NULL,
  opens_at TEXT NOT NULL,
  due_at TEXT NOT NULL,
  late_review_starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  next_reminder_due_at TEXT,
  grant_narrowing_expires_at TEXT,
  repair_required_reason_ref TEXT,
  settled_at TEXT,
  superseded_at TEXT,
  current_lineage_fence_epoch INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (checkpoint_revision >= 1),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_more_info_one_live_checkpoint_per_lineage
  ON phase3_more_info_reply_window_checkpoints (request_lineage_ref)
  WHERE reply_window_state IN ('open', 'reminder_due', 'late_review', 'blocked_repair');

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_checkpoints_cycle_revision
  ON phase3_more_info_reply_window_checkpoints (cycle_id, checkpoint_revision);

CREATE TABLE IF NOT EXISTS phase3_more_info_reminder_schedules (
  schedule_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  checkpoint_ref TEXT NOT NULL,
  schedule_state TEXT NOT NULL,
  cadence_policy_ref TEXT NOT NULL,
  reminder_offsets_minutes_json TEXT NOT NULL,
  max_reminder_count INTEGER NOT NULL,
  dispatched_reminder_count INTEGER NOT NULL,
  quiet_hours_policy_ref TEXT,
  quiet_hours_window_json TEXT,
  last_reminder_sent_at TEXT,
  next_quiet_hours_release_at TEXT,
  suppressed_reason_ref TEXT,
  callback_fallback_state TEXT NOT NULL,
  callback_fallback_seed_ref TEXT,
  completed_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (max_reminder_count >= 0),
  CHECK (dispatched_reminder_count >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_reminder_schedules_cycle_state
  ON phase3_more_info_reminder_schedules (cycle_id, schedule_state);

CREATE TABLE IF NOT EXISTS phase3_more_info_outbox_entries (
  outbox_entry_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  checkpoint_ref TEXT NOT NULL,
  schedule_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  effect_type TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  reminder_ordinal INTEGER,
  dispatch_state TEXT NOT NULL,
  reason_ref TEXT,
  due_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  dispatched_at TEXT,
  cancelled_at TEXT,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_more_info_outbox_effect_key
  ON phase3_more_info_outbox_entries (effect_key);

CREATE INDEX IF NOT EXISTS idx_phase3_more_info_outbox_dispatch_due
  ON phase3_more_info_outbox_entries (dispatch_state, due_at);

COMMIT;
