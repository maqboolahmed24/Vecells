BEGIN;

CREATE TABLE IF NOT EXISTS command_settlement_records (
  settlement_id TEXT PRIMARY KEY,
  action_record_ref TEXT NOT NULL,
  replay_decision_class TEXT NOT NULL,
  result TEXT NOT NULL,
  processing_acceptance_state TEXT NOT NULL,
  external_observation_state TEXT NOT NULL,
  authoritative_outcome_state TEXT NOT NULL,
  authoritative_proof_class TEXT NOT NULL,
  settlement_revision INTEGER NOT NULL,
  supersedes_settlement_ref TEXT NULL,
  external_effect_refs_json TEXT NOT NULL DEFAULT '[]',
  same_shell_recovery_ref TEXT NULL,
  projection_version_ref TEXT NULL,
  ui_transition_settlement_ref TEXT NULL,
  projection_visibility_ref TEXT NULL,
  audit_record_ref TEXT NULL,
  blocking_refs_json TEXT NOT NULL DEFAULT '[]',
  quiet_eligible_at TEXT NULL,
  stale_after_at TEXT NULL,
  last_safe_anchor_ref TEXT NULL,
  allowed_summary_tier TEXT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'CommandSettlementRecord',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (action_record_ref) REFERENCES command_action_records(action_record_id),
  FOREIGN KEY (supersedes_settlement_ref) REFERENCES command_settlement_records(settlement_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_command_settlement_action_revision
  ON command_settlement_records(action_record_ref, settlement_revision);

CREATE INDEX IF NOT EXISTS idx_command_settlement_action_record
  ON command_settlement_records(action_record_ref);

CREATE INDEX IF NOT EXISTS idx_command_settlement_recorded_at
  ON command_settlement_records(recorded_at);

COMMIT;
