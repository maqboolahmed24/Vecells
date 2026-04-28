BEGIN;

CREATE TABLE IF NOT EXISTS phase3_task_completion_settlement_envelopes (
  task_completion_settlement_envelope_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  source_queue_rank_snapshot_ref TEXT NOT NULL,
  workspace_trust_envelope_ref TEXT NOT NULL,
  local_ack_state TEXT NOT NULL,
  authoritative_settlement_state TEXT NOT NULL,
  next_owner_ref TEXT,
  closure_summary_ref TEXT NOT NULL,
  blocking_reason_refs_json TEXT NOT NULL,
  next_task_launch_state TEXT NOT NULL,
  next_task_launch_lease_ref TEXT,
  experience_continuity_evidence_ref TEXT NOT NULL,
  release_condition_ref TEXT NOT NULL,
  operator_handoff_frame_ref TEXT,
  settled_at TEXT NOT NULL,
  settlement_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (settlement_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_task_completion_envelopes_task_revision
  ON phase3_task_completion_settlement_envelopes (task_id, settlement_revision);

CREATE TABLE IF NOT EXISTS phase3_operator_handoff_frames (
  operator_handoff_frame_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  handoff_type TEXT NOT NULL,
  next_owner_ref TEXT NOT NULL,
  readiness_summary_ref TEXT NOT NULL,
  pending_dependency_refs_json TEXT NOT NULL,
  confirmed_artifact_ref TEXT,
  settlement_state TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  handoff_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (handoff_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_operator_handoff_frames_task_revision
  ON phase3_operator_handoff_frames (task_id, handoff_revision);

CREATE TABLE IF NOT EXISTS phase3_staff_workspace_consistency_projections (
  workspace_consistency_projection_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  entity_continuity_key TEXT NOT NULL,
  bundle_version INTEGER NOT NULL,
  audience_tier TEXT NOT NULL,
  governing_object_refs_json TEXT NOT NULL,
  entity_version_refs_json TEXT NOT NULL,
  queue_change_batch_ref TEXT,
  review_version_ref INTEGER NOT NULL,
  workspace_snapshot_version INTEGER NOT NULL,
  computed_at TEXT NOT NULL,
  stale_at TEXT NOT NULL,
  causal_consistency_state TEXT NOT NULL,
  projection_trust_state TEXT NOT NULL,
  blocking_reason_refs_json TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  persistence_schema_version INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_workspace_consistency_task_computed
  ON phase3_staff_workspace_consistency_projections (task_id, computed_at);

CREATE TABLE IF NOT EXISTS phase3_workspace_slice_trust_projections (
  workspace_slice_trust_projection_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  queue_slice_trust_state TEXT NOT NULL,
  task_slice_trust_state TEXT NOT NULL,
  attachment_slice_trust_state TEXT NOT NULL,
  assistive_slice_trust_state TEXT NOT NULL,
  dependency_slice_trust_state TEXT NOT NULL,
  assurance_slice_trust_refs_json TEXT NOT NULL,
  render_mode TEXT NOT NULL,
  blocking_dependency_refs_json TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  persistence_schema_version INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_workspace_slice_trust_task_evaluated
  ON phase3_workspace_slice_trust_projections (task_id, evaluated_at);

CREATE TABLE IF NOT EXISTS phase3_protected_composition_states (
  protected_composition_state_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  focus_protection_lease_ref TEXT NOT NULL,
  composition_mode TEXT NOT NULL,
  draft_artifact_refs_json TEXT NOT NULL,
  primary_selected_anchor_ref TEXT NOT NULL,
  compare_anchor_refs_json TEXT NOT NULL,
  assistive_insertion_point_ref TEXT,
  primary_reading_target_ref TEXT NOT NULL,
  quiet_return_target_ref TEXT NOT NULL,
  allowed_live_patch_mode TEXT NOT NULL,
  state_validity TEXT NOT NULL,
  release_gate_ref TEXT NOT NULL,
  started_at TEXT NOT NULL,
  released_at TEXT,
  invalidating_drift_state TEXT NOT NULL,
  blocking_reason_refs_json TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  persistence_schema_version INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_protected_composition_task_started
  ON phase3_protected_composition_states (task_id, started_at);

CREATE TABLE IF NOT EXISTS phase3_workspace_continuity_evidence_projections (
  workspace_continuity_evidence_projection_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  control_code TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  route_continuity_evidence_contract_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  selected_anchor_tuple_hash_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  source_queue_rank_snapshot_ref TEXT NOT NULL,
  latest_task_completion_settlement_ref TEXT NOT NULL,
  latest_prefetch_window_ref TEXT,
  latest_next_task_launch_lease_ref TEXT,
  experience_continuity_evidence_ref TEXT NOT NULL,
  continuity_tuple_hash TEXT NOT NULL,
  validation_state TEXT NOT NULL,
  next_task_launch_state TEXT NOT NULL,
  blocking_refs_json TEXT NOT NULL,
  anchor_continuity_state TEXT NOT NULL,
  anchor_repair_target_ref TEXT,
  captured_at TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  persistence_schema_version INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_workspace_continuity_task_captured
  ON phase3_workspace_continuity_evidence_projections (task_id, captured_at);

CREATE TABLE IF NOT EXISTS phase3_workspace_trust_envelopes (
  workspace_trust_envelope_id TEXT PRIMARY KEY,
  workspace_family TEXT NOT NULL,
  workspace_ref TEXT NOT NULL,
  task_or_case_ref TEXT NOT NULL,
  queue_key TEXT NOT NULL,
  workspace_consistency_projection_ref TEXT NOT NULL,
  workspace_slice_trust_projection_ref TEXT NOT NULL,
  primary_action_lease_ref TEXT,
  request_lifecycle_lease_ref TEXT,
  focus_protection_lease_ref TEXT,
  protected_composition_state_ref TEXT,
  task_completion_settlement_envelope_ref TEXT NOT NULL,
  surface_runtime_binding_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  selected_anchor_tuple_hash_ref TEXT NOT NULL,
  source_queue_rank_snapshot_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  consistency_tuple_hash TEXT NOT NULL,
  trust_tuple_hash TEXT NOT NULL,
  envelope_state TEXT NOT NULL,
  mutation_authority_state TEXT NOT NULL,
  interruption_pacing_state TEXT NOT NULL,
  completion_calm_state TEXT NOT NULL,
  blocking_reason_refs_json TEXT NOT NULL,
  required_recovery_action TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  persistence_schema_version INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_workspace_trust_task_computed
  ON phase3_workspace_trust_envelopes (task_or_case_ref, computed_at);

COMMIT;
