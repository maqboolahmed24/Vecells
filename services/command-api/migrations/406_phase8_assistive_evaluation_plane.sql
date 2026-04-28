-- Phase 8 task 406: assistive evaluation runtime plane.
-- These tables are intentionally separate from live workflow mutation tables.

CREATE TABLE IF NOT EXISTS assistive_evaluation_dataset_partition_manifest (
  dataset_partition_manifest_id TEXT PRIMARY KEY,
  partition_id TEXT NOT NULL CHECK (partition_id IN ('gold', 'shadow_live', 'feedback')),
  partition_version TEXT NOT NULL,
  case_replay_bundle_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  label_set_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  adjudication_set_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback_eligibility_flag_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  access_policy_ref TEXT NOT NULL,
  gold_set_version_ref TEXT,
  manifest_hash TEXT NOT NULL,
  publication_state TEXT NOT NULL CHECK (publication_state IN ('draft', 'candidate', 'published', 'superseded', 'revoked')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_eval_gold_version_required CHECK (partition_id <> 'gold' OR gold_set_version_ref IS NOT NULL),
  CONSTRAINT assistive_eval_published_gold_truth_required CHECK (
    publication_state <> 'published'
    OR partition_id <> 'gold'
    OR (
      jsonb_array_length(case_replay_bundle_refs) > 0
      AND jsonb_array_length(label_set_refs) > 0
      AND jsonb_array_length(adjudication_set_refs) > 0
    )
  )
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_case_replay_bundle (
  replay_bundle_id TEXT PRIMARY KEY,
  request_ref TEXT NOT NULL,
  task_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  task_lineage_ref TEXT NOT NULL,
  evidence_snapshot_refs JSONB NOT NULL,
  evidence_capture_bundle_refs JSONB NOT NULL,
  evidence_derivation_package_refs JSONB NOT NULL,
  expected_outputs_ref TEXT NOT NULL,
  feature_snapshot_refs JSONB NOT NULL,
  prompt_template_version_ref TEXT NOT NULL,
  model_registry_entry_ref TEXT NOT NULL,
  output_schema_version_ref TEXT NOT NULL,
  runtime_config_hash TEXT NOT NULL,
  dataset_partition TEXT NOT NULL CHECK (dataset_partition IN ('gold', 'shadow_live', 'feedback')),
  sensitivity_tag TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  telemetry_disclosure_fence_ref TEXT NOT NULL,
  feedback_eligibility_flag_ref TEXT,
  bundle_hash TEXT NOT NULL,
  bundle_state TEXT NOT NULL CHECK (bundle_state IN ('draft', 'frozen', 'published', 'superseded', 'quarantined', 'revoked')),
  manifest_ref TEXT REFERENCES assistive_evaluation_dataset_partition_manifest(dataset_partition_manifest_id),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_eval_replay_frozen_evidence_required CHECK (
    jsonb_array_length(evidence_snapshot_refs) > 0
    AND jsonb_array_length(evidence_capture_bundle_refs) > 0
    AND jsonb_array_length(evidence_derivation_package_refs) > 0
    AND jsonb_array_length(feature_snapshot_refs) > 0
  ),
  CONSTRAINT assistive_eval_feedback_flag_required CHECK (
    dataset_partition <> 'feedback' OR feedback_eligibility_flag_ref IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_ground_truth_label (
  label_id TEXT PRIMARY KEY,
  replay_bundle_id TEXT NOT NULL REFERENCES assistive_evaluation_case_replay_bundle(replay_bundle_id),
  label_type TEXT NOT NULL,
  label_value_ref TEXT NOT NULL,
  label_schema_version_ref TEXT NOT NULL,
  annotator_ref TEXT NOT NULL,
  annotator_role TEXT NOT NULL,
  label_provenance_ref TEXT NOT NULL,
  error_taxonomy_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  adjudication_state TEXT NOT NULL CHECK (
    adjudication_state IN ('not_required', 'pending', 'in_review', 'adjudicated', 'disputed', 'superseded', 'revoked')
  ),
  supersedes_label_ref TEXT,
  label_state TEXT NOT NULL CHECK (label_state IN ('draft', 'submitted', 'superseded', 'excluded', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_label_adjudication (
  adjudication_id TEXT PRIMARY KEY,
  replay_bundle_id TEXT NOT NULL REFERENCES assistive_evaluation_case_replay_bundle(replay_bundle_id),
  candidate_label_refs JSONB NOT NULL,
  adjudicator_ref TEXT NOT NULL,
  adjudicator_role TEXT NOT NULL,
  adjudication_reason_codes JSONB NOT NULL,
  final_label_ref TEXT NOT NULL REFERENCES assistive_evaluation_ground_truth_label(label_id),
  decision_rationale_ref TEXT NOT NULL,
  adjudication_state TEXT NOT NULL CHECK (
    adjudication_state IN ('not_required', 'pending', 'in_review', 'adjudicated', 'disputed', 'superseded', 'revoked')
  ),
  supersedes_adjudication_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_eval_adjudication_candidate_required CHECK (jsonb_array_length(candidate_label_refs) > 0)
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_error_taxonomy (
  error_id TEXT PRIMARY KEY,
  replay_bundle_id TEXT NOT NULL REFERENCES assistive_evaluation_case_replay_bundle(replay_bundle_id),
  capability_code TEXT NOT NULL,
  error_class TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_stage TEXT NOT NULL,
  review_outcome TEXT NOT NULL,
  evidence_span_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  harm_potential TEXT NOT NULL,
  routing_disposition TEXT NOT NULL CHECK (
    routing_disposition IN ('not_required', 'queued', 'requires_adjudication', 'settled_clean', 'settled_excluded', 'settled_revoked')
  ),
  error_state TEXT NOT NULL CHECK (error_state IN ('draft', 'confirmed', 'disputed', 'superseded', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_eval_high_errors_route_to_adjudication CHECK (
    severity NOT IN ('high', 'critical') OR routing_disposition <> 'not_required'
  )
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_replay_run (
  replay_run_id TEXT PRIMARY KEY,
  replay_bundle_ref TEXT NOT NULL REFERENCES assistive_evaluation_case_replay_bundle(replay_bundle_id),
  replay_harness_version_ref TEXT NOT NULL,
  replay_input_hash TEXT NOT NULL,
  run_state TEXT NOT NULL CHECK (run_state IN ('scheduled', 'completed', 'failed_closed', 'cancelled')),
  output_ref TEXT,
  output_hash TEXT,
  output_schema_version_ref TEXT,
  runtime_config_hash TEXT,
  comparison_summary_ref TEXT,
  failure_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_shadow_capture (
  shadow_capture_id TEXT PRIMARY KEY,
  replay_bundle_ref TEXT NOT NULL REFERENCES assistive_evaluation_case_replay_bundle(replay_bundle_id),
  request_ref TEXT NOT NULL,
  task_ref TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  dataset_partition TEXT NOT NULL DEFAULT 'shadow_live' CHECK (dataset_partition = 'shadow_live'),
  shadow_mode_evidence_requirement_ref TEXT NOT NULL,
  assistive_evaluation_surface_binding_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  telemetry_disclosure_fence_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  assistive_output_visible_to_end_users BOOLEAN NOT NULL DEFAULT FALSE,
  completeness_state TEXT NOT NULL CHECK (completeness_state IN ('complete', 'stale', 'missing', 'blocked')),
  capture_state TEXT NOT NULL CHECK (capture_state IN ('captured', 'quarantined', 'blocked')),
  captured_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_eval_shadow_invisible CHECK (assistive_output_visible_to_end_users = FALSE)
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_export_artifact (
  evaluation_export_artifact_id TEXT PRIMARY KEY,
  replay_bundle_ref TEXT NOT NULL REFERENCES assistive_evaluation_case_replay_bundle(replay_bundle_id),
  artifact_presentation_contract_ref TEXT NOT NULL,
  outbound_navigation_grant_policy_ref TEXT,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  redaction_transform_hash TEXT NOT NULL,
  artifact_state TEXT NOT NULL CHECK (
    artifact_state IN ('summary_only', 'inline_renderable', 'external_handoff_ready', 'recovery_only', 'blocked', 'revoked')
  ),
  export_format TEXT NOT NULL,
  contains_raw_phi BOOLEAN NOT NULL DEFAULT FALSE,
  blocking_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_eval_external_handoff_has_grant CHECK (
    artifact_state <> 'external_handoff_ready' OR outbound_navigation_grant_policy_ref IS NOT NULL
  ),
  CONSTRAINT assistive_eval_phi_exports_blocked CHECK (
    contains_raw_phi = FALSE OR artifact_state = 'blocked'
  )
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_surface_binding (
  assistive_evaluation_surface_binding_id TEXT PRIMARY KEY,
  route_family_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT,
  surface_publication_ref TEXT,
  runtime_publication_bundle_ref TEXT,
  required_trust_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  release_recovery_disposition_ref TEXT,
  telemetry_disclosure_fence_ref TEXT,
  binding_state TEXT NOT NULL CHECK (binding_state IN ('live', 'observe_only', 'recovery_only', 'blocked', 'withdrawn')),
  blocking_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  validated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_evaluation_audit_record (
  audit_record_id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  audit_correlation_id TEXT NOT NULL,
  purpose_of_use TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted', 'blocked', 'failed_closed')),
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assistive_eval_replay_bundle_partition
  ON assistive_evaluation_case_replay_bundle(dataset_partition, bundle_state);

CREATE INDEX IF NOT EXISTS idx_assistive_eval_label_bundle
  ON assistive_evaluation_ground_truth_label(replay_bundle_id, label_state, adjudication_state);

CREATE INDEX IF NOT EXISTS idx_assistive_eval_replay_run_bundle
  ON assistive_evaluation_replay_run(replay_bundle_ref, run_state);

CREATE INDEX IF NOT EXISTS idx_assistive_eval_shadow_capture_capability
  ON assistive_evaluation_shadow_capture(capability_code, completeness_state, capture_state);
