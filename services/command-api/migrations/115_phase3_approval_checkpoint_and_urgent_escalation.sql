BEGIN;

CREATE TABLE IF NOT EXISTS phase3_governed_approval_assessments (
  assessment_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  endpoint_class TEXT NOT NULL,
  approval_policy_matrix_ref TEXT NOT NULL,
  tenant_policy_ref TEXT NOT NULL,
  pathway_ref TEXT NOT NULL,
  risk_burden_class TEXT NOT NULL,
  assistive_provenance_state TEXT NOT NULL,
  sensitive_override_state TEXT NOT NULL,
  matched_policy_rule_refs_json TEXT NOT NULL,
  required_approval_mode TEXT NOT NULL,
  checkpoint_state TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  tuple_hash TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_governed_approval_assessments_task_evaluated
  ON phase3_governed_approval_assessments (task_id, evaluated_at);

CREATE TABLE IF NOT EXISTS phase3_approval_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  state TEXT NOT NULL,
  approval_requirement_assessment_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  requested_by TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  invalidation_reason_class TEXT,
  supersedes_checkpoint_ref TEXT,
  superseded_by_checkpoint_ref TEXT,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  lease_ttl_seconds INTEGER NOT NULL,
  last_heartbeat_at TEXT NOT NULL,
  fencing_token TEXT NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  stale_owner_recovery_ref TEXT,
  version INTEGER NOT NULL,
  CHECK (lease_ttl_seconds >= 1),
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_approval_checkpoints_task_requested
  ON phase3_approval_checkpoints (task_id, requested_at);

CREATE INDEX IF NOT EXISTS idx_phase3_approval_checkpoints_task_state
  ON phase3_approval_checkpoints (task_id, state);

CREATE TABLE IF NOT EXISTS phase3_duty_escalation_records (
  duty_escalation_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  endpoint_decision_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  trigger_mode TEXT NOT NULL,
  trigger_reason_code TEXT NOT NULL,
  severity_band TEXT NOT NULL,
  urgent_task_ref TEXT NOT NULL,
  current_urgent_contact_attempt_ref TEXT,
  current_urgent_escalation_outcome_ref TEXT,
  escalation_state TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_duty_escalation_records_task_opened
  ON phase3_duty_escalation_records (task_id, opened_at);

CREATE INDEX IF NOT EXISTS idx_phase3_duty_escalation_records_task_state
  ON phase3_duty_escalation_records (task_id, escalation_state);

CREATE TABLE IF NOT EXISTS phase3_urgent_contact_attempts (
  urgent_contact_attempt_id TEXT PRIMARY KEY,
  duty_escalation_record_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  attempt_ordinal INTEGER NOT NULL,
  attempt_replay_key TEXT NOT NULL,
  contact_route_class TEXT NOT NULL,
  attempt_state TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  completed_at TEXT,
  outcome_note TEXT,
  version INTEGER NOT NULL,
  CHECK (attempt_ordinal >= 1),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_urgent_contact_attempts_replay
  ON phase3_urgent_contact_attempts (duty_escalation_record_ref, attempt_replay_key);

CREATE INDEX IF NOT EXISTS idx_phase3_urgent_contact_attempts_escalation_attempted
  ON phase3_urgent_contact_attempts (duty_escalation_record_ref, attempted_at);

CREATE TABLE IF NOT EXISTS phase3_urgent_escalation_outcomes (
  urgent_escalation_outcome_id TEXT PRIMARY KEY,
  duty_escalation_record_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  outcome_class TEXT NOT NULL,
  endpoint_decision_settlement_ref TEXT,
  booking_intent_ref TEXT,
  pharmacy_intent_ref TEXT,
  triage_reopen_record_ref TEXT,
  presentation_artifact_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_urgent_escalation_outcomes_escalation_recorded
  ON phase3_urgent_escalation_outcomes (duty_escalation_record_ref, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_triage_reopen_records (
  reopen_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  superseded_decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT NOT NULL,
  priority_override TEXT NOT NULL,
  reopened_by_mode TEXT NOT NULL,
  reopened_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_triage_reopen_records_task_reopened
  ON phase3_triage_reopen_records (task_id, reopened_at);

COMMIT;
