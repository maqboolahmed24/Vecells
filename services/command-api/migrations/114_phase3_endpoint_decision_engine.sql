BEGIN;

CREATE TABLE IF NOT EXISTS phase3_decision_epochs (
  epoch_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  review_session_ref TEXT NOT NULL,
  review_version_ref INTEGER NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  selected_anchor_tuple_hash_ref TEXT NOT NULL,
  governing_snapshot_ref TEXT NOT NULL,
  evidence_snapshot_ref TEXT NOT NULL,
  compiled_policy_bundle_ref TEXT NOT NULL,
  safety_decision_epoch_ref TEXT NOT NULL,
  duplicate_lineage_ref TEXT,
  lineage_fence_epoch INTEGER NOT NULL,
  ownership_epoch_ref INTEGER NOT NULL,
  audience_surface_runtime_binding_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_publication_parity_ref TEXT NOT NULL,
  workspace_slice_trust_projection_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  decision_tuple_hash TEXT NOT NULL,
  epoch_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  superseded_at TEXT,
  superseded_by_epoch_ref TEXT,
  version INTEGER NOT NULL,
  CHECK (review_version_ref >= 0),
  CHECK (lineage_fence_epoch >= 0),
  CHECK (ownership_epoch_ref >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_decision_epochs_task_created
  ON phase3_decision_epochs (task_id, created_at);

CREATE INDEX IF NOT EXISTS idx_phase3_decision_epochs_task_state
  ON phase3_decision_epochs (task_id, epoch_state);

CREATE TABLE IF NOT EXISTS phase3_endpoint_decisions (
  decision_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  chosen_endpoint TEXT NOT NULL,
  decision_version INTEGER NOT NULL,
  payload_hash TEXT NOT NULL,
  reasoning_text TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  required_approval_mode TEXT NOT NULL,
  preview_artifact_ref TEXT,
  preview_digest_ref TEXT,
  approval_assessment_ref TEXT NOT NULL,
  boundary_tuple_ref TEXT,
  decision_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  superseded_at TEXT,
  superseded_by_decision_ref TEXT,
  version INTEGER NOT NULL,
  CHECK (decision_version >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_endpoint_decisions_task_created
  ON phase3_endpoint_decisions (task_id, created_at);

CREATE INDEX IF NOT EXISTS idx_phase3_endpoint_decisions_task_state
  ON phase3_endpoint_decisions (task_id, decision_state);

CREATE TABLE IF NOT EXISTS phase3_endpoint_decision_bindings (
  binding_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  boundary_decision_state TEXT NOT NULL,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  selected_anchor_tuple_hash_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  workspace_slice_trust_projection_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  approval_assessment_ref TEXT NOT NULL,
  boundary_tuple_ref TEXT,
  binding_state TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_endpoint_decision_bindings_task_evaluated
  ON phase3_endpoint_decision_bindings (task_id, evaluated_at);

CREATE TABLE IF NOT EXISTS phase3_endpoint_decision_action_records (
  endpoint_decision_action_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  action_type TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_endpoint_decision_action_records_task_recorded
  ON phase3_endpoint_decision_action_records (task_id, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_endpoint_decision_settlements (
  endpoint_decision_settlement_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  endpoint_decision_action_record_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  preview_artifact_ref TEXT,
  result TEXT NOT NULL,
  recovery_route_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_endpoint_decision_settlements_task_recorded
  ON phase3_endpoint_decision_settlements (task_id, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_endpoint_outcome_preview_artifacts (
  preview_artifact_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  artifact_state TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  summary_digest TEXT NOT NULL,
  preview_digest TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary_lines_json TEXT NOT NULL,
  patient_facing_summary TEXT NOT NULL,
  provenance_refs_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_endpoint_outcome_preview_artifacts_task_generated
  ON phase3_endpoint_outcome_preview_artifacts (task_id, generated_at);

CREATE TABLE IF NOT EXISTS phase3_decision_supersession_records (
  decision_supersession_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  prior_decision_epoch_ref TEXT NOT NULL,
  replacement_decision_epoch_ref TEXT NOT NULL,
  prior_decision_ref TEXT,
  replacement_decision_ref TEXT,
  reason_class TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  prior_tuple_hash TEXT NOT NULL,
  replacement_tuple_hash TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_decision_supersession_records_task_recorded
  ON phase3_decision_supersession_records (task_id, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_approval_requirement_assessments (
  assessment_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  endpoint_code TEXT NOT NULL,
  required_approval_mode TEXT NOT NULL,
  policy_matrix_ref TEXT NOT NULL,
  tuple_hash TEXT NOT NULL,
  assessed_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_approval_requirement_assessments_task_assessed
  ON phase3_approval_requirement_assessments (task_id, assessed_at);

CREATE TABLE IF NOT EXISTS phase3_endpoint_boundary_tuples (
  boundary_tuple_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  endpoint_code TEXT NOT NULL,
  boundary_decision_state TEXT NOT NULL,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  tuple_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_endpoint_boundary_tuples_task_created
  ON phase3_endpoint_boundary_tuples (task_id, created_at);

COMMIT;
