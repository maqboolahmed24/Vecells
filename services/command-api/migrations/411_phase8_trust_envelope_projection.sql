CREATE TABLE IF NOT EXISTS assistive_surface_binding (
  assistive_surface_binding_id text PRIMARY KEY,
  capability_code text NOT NULL,
  artifact_ref text NOT NULL,
  entity_continuity_key text NOT NULL,
  route_family text NOT NULL,
  allowed_shell text NOT NULL,
  audience_tier text NOT NULL,
  visibility_policy_ref text NOT NULL,
  rollout_verdict_ref text NOT NULL,
  rollout_rung text NOT NULL,
  render_posture text NOT NULL,
  consistency_projection_ref text NOT NULL,
  staff_workspace_consistency_projection_ref text NOT NULL,
  workspace_slice_trust_projection_ref text NOT NULL,
  workspace_trust_envelope_ref text NOT NULL,
  assistive_capability_trust_envelope_ref text NOT NULL,
  surface_route_contract_ref text NOT NULL,
  surface_publication_ref text NOT NULL,
  runtime_publication_bundle_ref text NOT NULL,
  release_recovery_disposition_ref text NOT NULL,
  selected_anchor_requirement text NOT NULL,
  decision_dock_mode text NOT NULL,
  placeholder_contract_ref text NOT NULL,
  publication_state text NOT NULL,
  runtime_publication_state text NOT NULL,
  binding_state text NOT NULL,
  binding_hash text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT assistive_surface_binding_same_shell_refs_required CHECK (
    consistency_projection_ref <> ''
    AND staff_workspace_consistency_projection_ref <> ''
    AND workspace_slice_trust_projection_ref <> ''
    AND workspace_trust_envelope_ref <> ''
    AND selected_anchor_requirement <> ''
  ),
  CONSTRAINT assistive_surface_binding_staff_only CHECK (
    audience_tier = 'staff'
    AND allowed_shell = 'staff_workspace'
    AND route_family LIKE '%staff%'
  ),
  CONSTRAINT assistive_surface_binding_publication_state_valid CHECK (
    publication_state IN ('published', 'stale', 'withdrawn', 'blocked')
    AND runtime_publication_state IN ('current', 'stale', 'withdrawn', 'blocked')
  )
);

CREATE TABLE IF NOT EXISTS assistive_presentation_contract (
  assistive_presentation_contract_id text PRIMARY KEY,
  capability_code text NOT NULL,
  presentation_mode text NOT NULL,
  min_width_px integer NOT NULL,
  max_width_px integer NOT NULL,
  provenance_disclosure_mode text NOT NULL,
  confidence_disclosure_mode text NOT NULL,
  expansion_rule text NOT NULL,
  reduced_motion_mode text NOT NULL,
  dominance_guard text NOT NULL,
  primary_action_limit integer NOT NULL,
  raw_score_visible boolean NOT NULL DEFAULT false,
  contract_version_ref text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT assistive_presentation_contract_companion_only CHECK (
    dominance_guard = 'companion_only'
    AND primary_action_limit <= 1
    AND raw_score_visible = false
  ),
  CONSTRAINT assistive_presentation_contract_dimensions_order CHECK (min_width_px > 0 AND max_width_px >= min_width_px)
);

CREATE TABLE IF NOT EXISTS assistive_provenance_envelope (
  assistive_provenance_envelope_id text PRIMARY KEY,
  artifact_ref text NOT NULL,
  capability_code text NOT NULL,
  input_evidence_snapshot_ref text NOT NULL,
  input_evidence_snapshot_hash text NOT NULL,
  capture_bundle_ref text NOT NULL,
  derivation_package_refs jsonb NOT NULL,
  summary_parity_ref text NOT NULL,
  evidence_map_set_ref text NOT NULL,
  model_version_ref text NOT NULL,
  prompt_version_ref text NOT NULL,
  output_schema_version_ref text NOT NULL,
  calibration_bundle_ref text NOT NULL,
  policy_bundle_ref text NOT NULL,
  surface_publication_ref text NOT NULL,
  runtime_publication_bundle_ref text NOT NULL,
  freshness_state text NOT NULL,
  trust_state text NOT NULL,
  continuity_state text NOT NULL,
  masking_policy_ref text NOT NULL,
  disclosure_level text NOT NULL,
  provenance_hash text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT assistive_provenance_snapshot_hash_required CHECK (
    input_evidence_snapshot_hash <> ''
    AND model_version_ref <> ''
    AND prompt_version_ref <> ''
    AND output_schema_version_ref <> ''
    AND policy_bundle_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_confidence_digest (
  assistive_confidence_digest_id text PRIMARY KEY,
  artifact_ref text NOT NULL,
  capability_code text NOT NULL,
  display_band text NOT NULL,
  reason_codes jsonb NOT NULL,
  support_probability_ref text NOT NULL,
  evidence_coverage numeric NOT NULL,
  epistemic_uncertainty text NOT NULL,
  expected_harm_band text NOT NULL,
  calibration_version_ref text NOT NULL,
  display_mode text NOT NULL,
  confidence_posture_state text NOT NULL,
  visible_confidence_allowed boolean NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT assistive_confidence_digest_score_bounds CHECK (evidence_coverage >= 0 AND evidence_coverage <= 1),
  CONSTRAINT assistive_confidence_digest_no_raw_score CHECK (support_probability_ref <> '' AND display_band <> 'raw_score')
);

CREATE TABLE IF NOT EXISTS assistive_freeze_frame (
  assistive_freeze_frame_id text PRIMARY KEY,
  artifact_ref text NOT NULL,
  capability_code text NOT NULL,
  freeze_reason_code text NOT NULL,
  freeze_disposition text NOT NULL,
  retained_visible_text_ref text,
  retained_evidence_anchor_refs jsonb NOT NULL,
  retained_provenance_envelope_ref text,
  suppress_write_affordances boolean NOT NULL DEFAULT true,
  suppressed_affordances jsonb NOT NULL,
  recovery_action text NOT NULL,
  same_shell_route_family text NOT NULL,
  same_shell_selected_anchor_ref text NOT NULL,
  entity_continuity_key text NOT NULL,
  release_recovery_disposition_ref text NOT NULL,
  freeze_hash text NOT NULL,
  frozen_at timestamptz NOT NULL,
  CONSTRAINT assistive_freeze_frame_suppresses_write_affordances CHECK (
    suppress_write_affordances = true
    AND suppressed_affordances ? 'accept'
    AND suppressed_affordances ? 'insert'
    AND suppressed_affordances ? 'completion'
  ),
  CONSTRAINT assistive_freeze_frame_same_shell_required CHECK (
    same_shell_route_family <> ''
    AND same_shell_selected_anchor_ref <> ''
    AND entity_continuity_key <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_capability_trust_envelope (
  assistive_capability_trust_envelope_id text PRIMARY KEY,
  artifact_ref text NOT NULL,
  capability_code text NOT NULL,
  surface_binding_ref text NOT NULL,
  invocation_grant_ref text NOT NULL,
  run_settlement_ref text NOT NULL,
  visibility_policy_ref text NOT NULL,
  assistive_capability_watch_tuple_ref text,
  trust_projection_ref text,
  rollout_verdict_ref text,
  provenance_envelope_refs jsonb NOT NULL,
  confidence_digest_refs jsonb NOT NULL,
  freeze_frame_ref text,
  kill_switch_state_ref text NOT NULL,
  release_freeze_record_ref text,
  release_recovery_disposition_ref text NOT NULL,
  consistency_projection_ref text NOT NULL,
  staff_workspace_consistency_projection_ref text NOT NULL,
  workspace_slice_trust_projection_ref text NOT NULL,
  workspace_trust_envelope_ref text NOT NULL,
  selected_anchor_ref text NOT NULL,
  observed_selected_anchor_ref text,
  entity_continuity_key text NOT NULL,
  observed_entity_continuity_key text,
  route_family text NOT NULL,
  observed_route_family text,
  policy_bundle_ref text NOT NULL,
  trust_state text NOT NULL,
  surface_posture_state text NOT NULL,
  actionability_state text NOT NULL,
  confidence_posture_state text NOT NULL,
  completion_adjacency_state text NOT NULL,
  blocking_reason_refs jsonb NOT NULL,
  same_shell_recovery_required boolean NOT NULL,
  browser_client_actionability_recompute_forbidden boolean NOT NULL DEFAULT true,
  envelope_hash text NOT NULL,
  computed_at timestamptz NOT NULL,
  CONSTRAINT assistive_trust_envelope_posture_separation CHECK (
    surface_posture_state IN ('interactive', 'observe_only', 'provenance_only', 'placeholder_only', 'hidden')
    AND actionability_state IN ('enabled', 'regenerate_only', 'observe_only', 'blocked_by_policy', 'blocked')
    AND confidence_posture_state IN ('conservative_band', 'suppressed', 'hidden')
    AND completion_adjacency_state IN ('allowed', 'observe_only', 'blocked')
  ),
  CONSTRAINT assistive_trust_envelope_blocked_actions_when_not_interactive CHECK (
    surface_posture_state = 'interactive'
    OR actionability_state <> 'enabled'
  ),
  CONSTRAINT assistive_trust_envelope_client_recompute_forbidden CHECK (browser_client_actionability_recompute_forbidden = true)
);

CREATE TABLE IF NOT EXISTS assistive_trust_envelope_audit_record (
  audit_record_id text PRIMARY KEY,
  service_name text NOT NULL,
  action text NOT NULL,
  actor_ref text NOT NULL,
  actor_role text NOT NULL,
  route_intent_binding_ref text NOT NULL,
  audit_correlation_id text NOT NULL,
  purpose_of_use text NOT NULL,
  subject_ref text NOT NULL,
  outcome text NOT NULL,
  reason_codes jsonb NOT NULL,
  recorded_at timestamptz NOT NULL
);
