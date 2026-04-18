-- 127_phase3_admin_resolution_case_policy_kernel.sql
-- Phase 3 bounded admin-resolution case, subtype-policy, and completion-artifact persistence contract.

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_subtype_profiles (
  admin_resolution_subtype_ref TEXT PRIMARY KEY,
  queue_policy_ref TEXT NOT NULL,
  waiting_reason_policy_ref TEXT NOT NULL,
  completion_artifact_policy_ref TEXT NOT NULL,
  patient_expectation_template_ref TEXT NOT NULL,
  external_dependency_policy_ref TEXT NOT NULL,
  reopen_policy_ref TEXT NOT NULL,
  allowed_reclassification_targets_json TEXT NOT NULL,
  reclassification_window_hours INTEGER,
  source_domain_required INTEGER NOT NULL,
  source_decision_required INTEGER NOT NULL,
  waiting_policies_json TEXT NOT NULL,
  completion_policies_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_cases (
  admin_resolution_case_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  source_triage_task_ref TEXT NOT NULL,
  source_admin_resolution_starter_ref TEXT,
  source_domain_ref TEXT,
  source_decision_ref TEXT,
  source_lineage_ref TEXT,
  admin_resolution_subtype_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  admin_mutation_authority_state TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  policy_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  case_version_ref TEXT NOT NULL,
  current_owner_ref TEXT NOT NULL,
  case_state TEXT NOT NULL,
  waiting_state TEXT NOT NULL,
  waiting_reason_code_ref TEXT,
  waiting_dependency_shape TEXT,
  waiting_owner_ref TEXT,
  waiting_owner_role_ref TEXT,
  waiting_sla_clock_source_ref TEXT,
  waiting_expiry_or_repair_rule_ref TEXT,
  current_action_record_ref TEXT,
  completion_artifact_ref TEXT,
  dependency_set_ref TEXT,
  reopen_state TEXT NOT NULL,
  experience_projection_ref TEXT,
  release_watch_ref TEXT,
  watch_window_ref TEXT,
  reclassification_due_at TEXT,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_completion_artifacts (
  admin_resolution_completion_artifact_id TEXT PRIMARY KEY,
  admin_resolution_case_ref TEXT NOT NULL,
  completion_type TEXT NOT NULL,
  completion_evidence_refs_json TEXT NOT NULL,
  patient_expectation_template_ref TEXT NOT NULL,
  patient_visible_summary_ref TEXT NOT NULL,
  artifact_presentation_contract_ref TEXT NOT NULL,
  artifact_byte_grant_refs_json TEXT NOT NULL,
  outbound_navigation_grant_refs_json TEXT NOT NULL,
  release_state TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  communication_dispatch_refs_json TEXT NOT NULL,
  delivery_outcome_refs_json TEXT NOT NULL,
  reopen_policy_ref TEXT NOT NULL,
  artifact_state TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_cases_task_opened
  ON phase3_admin_resolution_cases (source_triage_task_ref, opened_at);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_cases_epoch_boundary
  ON phase3_admin_resolution_cases (decision_epoch_ref, boundary_tuple_hash);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_cases_subtype_state
  ON phase3_admin_resolution_cases (admin_resolution_subtype_ref, case_state);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_cases_waiting_owner
  ON phase3_admin_resolution_cases (waiting_state, current_owner_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_completion_artifacts_case_recorded
  ON phase3_admin_resolution_completion_artifacts (admin_resolution_case_ref, recorded_at);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_completion_artifacts_type_state
  ON phase3_admin_resolution_completion_artifacts (completion_type, artifact_state);
