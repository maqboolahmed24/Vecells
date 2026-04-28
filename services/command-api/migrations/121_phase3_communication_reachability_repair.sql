BEGIN;

CREATE TABLE IF NOT EXISTS phase3_communication_repair_bindings (
  binding_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  communication_domain TEXT NOT NULL,
  communication_object_ref TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  contact_route_ref TEXT NOT NULL,
  reachability_dependency_ref TEXT NOT NULL,
  current_contact_route_snapshot_ref TEXT NOT NULL,
  current_reachability_assessment_ref TEXT NOT NULL,
  current_reachability_epoch INTEGER NOT NULL,
  active_repair_journey_ref TEXT,
  active_repair_entry_grant_ref TEXT,
  active_verification_checkpoint_ref TEXT,
  last_communication_observation_ref TEXT,
  last_authorization_ref TEXT,
  last_rebound_record_ref TEXT,
  binding_state TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  recovery_route_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (current_reachability_epoch >= 1),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_communication_repair_bindings_domain_object
  ON phase3_communication_repair_bindings (communication_domain, communication_object_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_communication_repair_bindings_task_updated
  ON phase3_communication_repair_bindings (task_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_phase3_communication_repair_bindings_dependency
  ON phase3_communication_repair_bindings (reachability_dependency_ref);

CREATE TABLE IF NOT EXISTS phase3_communication_repair_authorizations (
  authorization_id TEXT PRIMARY KEY,
  binding_ref TEXT NOT NULL,
  task_id TEXT NOT NULL,
  communication_domain TEXT NOT NULL,
  communication_object_ref TEXT NOT NULL,
  authorization_kind TEXT NOT NULL,
  repair_journey_ref TEXT,
  governing_gate_ref TEXT,
  governing_gate_decision TEXT,
  governing_evidence_ref TEXT,
  reachability_epoch INTEGER NOT NULL,
  repair_entry_grant_ref TEXT,
  authorization_state TEXT NOT NULL,
  same_shell_recovery_ref TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (reachability_epoch >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_communication_repair_authorizations_binding_created
  ON phase3_communication_repair_authorizations (binding_ref, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_communication_repair_authorizations_reuse
  ON phase3_communication_repair_authorizations (
    binding_ref,
    authorization_kind,
    reachability_epoch,
    COALESCE(governing_gate_ref, ''),
    authorization_state
  );

CREATE TABLE IF NOT EXISTS phase3_communication_rebound_records (
  rebound_record_id TEXT PRIMARY KEY,
  binding_ref TEXT NOT NULL,
  task_id TEXT NOT NULL,
  communication_domain TEXT NOT NULL,
  communication_object_ref TEXT NOT NULL,
  reachability_dependency_ref TEXT NOT NULL,
  repair_journey_ref TEXT NOT NULL,
  verification_checkpoint_ref TEXT NOT NULL,
  resulting_contact_route_snapshot_ref TEXT NOT NULL,
  resulting_reachability_assessment_ref TEXT NOT NULL,
  resulting_reachability_epoch INTEGER NOT NULL,
  rebound_state TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (resulting_reachability_epoch >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_communication_rebound_records_binding_recorded
  ON phase3_communication_rebound_records (binding_ref, recorded_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_communication_rebound_records_checkpoint
  ON phase3_communication_rebound_records (verification_checkpoint_ref);

COMMIT;
