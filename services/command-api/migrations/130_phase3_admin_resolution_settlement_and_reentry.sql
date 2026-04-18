-- 130_phase3_admin_resolution_settlement_and_reentry.sql
-- Phase 3 bounded admin-resolution settlement, experience projection, and cross-domain re-entry.

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_action_records (
  admin_resolution_action_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  admin_resolution_case_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  action_type TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  review_action_lease_ref TEXT NOT NULL,
  review_action_ownership_epoch_ref TEXT NOT NULL,
  review_action_fencing_token TEXT NOT NULL,
  workspace_consistency_projection_ref TEXT NOT NULL,
  workspace_trust_projection_ref TEXT NOT NULL,
  command_action_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  release_approval_freeze_ref TEXT NOT NULL,
  channel_release_freeze_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_by_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  settled_at TEXT,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_settlements (
  admin_resolution_settlement_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  admin_resolution_case_ref TEXT NOT NULL,
  admin_resolution_action_record_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  command_settlement_ref TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  task_completion_settlement_envelope_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  dependency_set_ref TEXT NOT NULL,
  release_watch_ref TEXT NOT NULL,
  reopen_state TEXT NOT NULL,
  result TEXT NOT NULL,
  trust_state TEXT NOT NULL,
  completion_artifact_ref TEXT,
  patient_expectation_template_ref TEXT,
  recovery_disposition_ref TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  recovery_route_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  settlement_revision INTEGER NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_experience_projections (
  admin_resolution_experience_projection_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  admin_resolution_case_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  current_settlement_ref TEXT NOT NULL,
  completion_artifact_ref TEXT,
  dependency_set_ref TEXT NOT NULL,
  release_watch_ref TEXT NOT NULL,
  patient_shell_consistency_projection_ref TEXT NOT NULL,
  patient_embedded_session_projection_ref TEXT NOT NULL,
  staff_workspace_consistency_projection_ref TEXT NOT NULL,
  workspace_slice_trust_projection_ref TEXT NOT NULL,
  consistency_projection_ref TEXT NOT NULL,
  visibility_policy_ref TEXT NOT NULL,
  bundle_version TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  admin_mutation_authority_state TEXT NOT NULL,
  boundary_reopen_state TEXT NOT NULL,
  release_state TEXT NOT NULL,
  trust_state TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  route_freeze_disposition_ref TEXT NOT NULL,
  dominant_next_action_ref TEXT NOT NULL,
  projection_state TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_cross_domain_reentries (
  admin_resolution_cross_domain_reentry_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  admin_resolution_case_ref TEXT NOT NULL,
  originating_settlement_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  dependency_set_ref TEXT NOT NULL,
  destination TEXT NOT NULL,
  resolver_mode TEXT NOT NULL,
  reason_class TEXT NOT NULL,
  causal_reason_code_refs_json TEXT NOT NULL,
  preserve_superseded_provenance INTEGER NOT NULL,
  created_governed_artifact_ref TEXT,
  reused_governed_artifact_ref TEXT,
  continuity_hint_ref TEXT NOT NULL,
  recovery_route_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_admin_resolution_action_records_case_idempotency
  ON phase3_admin_resolution_action_records (admin_resolution_case_ref, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_action_records_case_recorded
  ON phase3_admin_resolution_action_records (admin_resolution_case_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_settlements_case_result_recorded
  ON phase3_admin_resolution_settlements (
    admin_resolution_case_ref,
    result,
    recorded_at
  );

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_settlements_boundary_epoch_dependency
  ON phase3_admin_resolution_settlements (
    boundary_decision_ref,
    boundary_tuple_hash,
    decision_epoch_ref,
    dependency_set_ref
  );

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_settlements_completion_result_trust
  ON phase3_admin_resolution_settlements (
    completion_artifact_ref,
    result,
    trust_state
  );

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_experience_projections_case_computed
  ON phase3_admin_resolution_experience_projections (admin_resolution_case_ref, computed_at);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_cross_domain_reentries_case_created
  ON phase3_admin_resolution_cross_domain_reentries (admin_resolution_case_ref, created_at);
