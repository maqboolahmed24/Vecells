BEGIN;

CREATE TABLE IF NOT EXISTS phase3_conversation_tuple_compatibility (
  cluster_ref TEXT PRIMARY KEY,
  tuple_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  subthread_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  thread_tuple_hash TEXT NOT NULL,
  tuple_availability_state TEXT NOT NULL,
  continuity_validation_state TEXT NOT NULL,
  preview_mode TEXT NOT NULL,
  reachability_epoch INTEGER NOT NULL,
  monotone_revision INTEGER NOT NULL,
  computed_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (reachability_epoch >= 0),
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_conversation_tuple_compatibility_task
  ON phase3_conversation_tuple_compatibility (task_id, computed_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_conversation_tuple_compatibility_hash
  ON phase3_conversation_tuple_compatibility (thread_id, thread_tuple_hash, monotone_revision);

CREATE TABLE IF NOT EXISTS phase3_conversation_preview_digests (
  cluster_ref TEXT PRIMARY KEY,
  digest_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  latest_settlement_ref TEXT NOT NULL,
  latest_receipt_envelope_ref TEXT NOT NULL,
  reply_needed_state TEXT NOT NULL,
  awaiting_review_state TEXT NOT NULL,
  authoritative_outcome_state TEXT NOT NULL,
  repair_required_state TEXT NOT NULL,
  state_confidence_band TEXT NOT NULL,
  dominant_next_action_ref TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_conversation_preview_digests_thread
  ON phase3_conversation_preview_digests (thread_id, computed_at);

CREATE TABLE IF NOT EXISTS phase3_patient_composer_leases (
  lease_id TEXT PRIMARY KEY,
  cluster_ref TEXT NOT NULL,
  composer_scope TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  draft_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  lease_state TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_patient_composer_leases_cluster_expiry
  ON phase3_patient_composer_leases (cluster_ref, expires_at);

CREATE TABLE IF NOT EXISTS phase3_patient_urgent_diversion_states (
  cluster_ref TEXT PRIMARY KEY,
  diversion_state_id TEXT NOT NULL,
  current_safety_decision_ref TEXT NOT NULL,
  current_urgent_diversion_settlement_ref TEXT NOT NULL,
  safety_decision_epoch INTEGER NOT NULL,
  surface_state TEXT NOT NULL,
  async_messaging_allowed_state TEXT NOT NULL,
  composer_freeze_state TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (safety_decision_epoch >= 0),
  CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS phase3_conversation_command_settlements (
  conversation_settlement_id TEXT PRIMARY KEY,
  cluster_ref TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  command_settlement_ref TEXT NOT NULL,
  action_record_ref TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  result TEXT NOT NULL,
  local_ack_state TEXT NOT NULL,
  transport_state TEXT NOT NULL,
  external_observation_state TEXT NOT NULL,
  authoritative_outcome_state TEXT NOT NULL,
  state_confidence_band TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_conversation_command_settlements_command_ref
  ON phase3_conversation_command_settlements (command_settlement_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_conversation_command_settlements_cluster_recorded
  ON phase3_conversation_command_settlements (cluster_ref, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_recovery_continuation_tokens (
  recovery_continuation_ref TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  cluster_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  contact_repair_journey_ref TEXT,
  same_shell_recovery_ref TEXT NOT NULL,
  recovery_route_ref TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_recovery_continuation_tokens_task_expiry
  ON phase3_recovery_continuation_tokens (task_id, expires_at);

COMMIT;
