-- Phase 8 task 410: invocation eligibility, capability composition, kill-switch, and run settlement control plane.
-- This schema stores explicit control truth for assistive runs. It does not authorize endpoint decisions,
-- workflow writeback, or client-side widening of capability posture.

CREATE TABLE IF NOT EXISTS assistive_intended_use_profile (
  profile_id TEXT PRIMARY KEY,
  clinical_purpose TEXT NOT NULL,
  non_clinical_purpose TEXT NOT NULL,
  medical_purpose_state TEXT NOT NULL CHECK (
    medical_purpose_state IN (
      'not_medical_device',
      'transcription_documentation_assistance',
      'higher_function_summarisation_structured_inference',
      'endpoint_suggestion_clinically_consequential_decision_support',
      'regulatory_posture_change'
    )
  ),
  permitted_user_roles JSONB NOT NULL,
  permitted_subject_scopes JSONB NOT NULL,
  forbidden_actions JSONB NOT NULL,
  forbidden_downstream_consumers JSONB NOT NULL,
  evidence_requirement JSONB NOT NULL,
  human_review_requirement TEXT NOT NULL CHECK (
    human_review_requirement IN ('none', 'single_review', 'dual_review', 'clinical_safety_review')
  ),
  profile_state TEXT NOT NULL CHECK (profile_state IN ('active', 'blocked', 'superseded', 'retired')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_control_profile_roles_required CHECK (jsonb_array_length(permitted_user_roles) > 0),
  CONSTRAINT assistive_control_profile_subject_scopes_required CHECK (jsonb_array_length(permitted_subject_scopes) > 0)
);

CREATE TABLE IF NOT EXISTS assistive_composition_policy (
  composition_policy_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  allowed_upstream_capability_codes JSONB NOT NULL,
  allowed_derived_artifact_types JSONB NOT NULL,
  blocked_downstream_object_types JSONB NOT NULL,
  max_chain_depth INTEGER NOT NULL,
  loop_detection_mode TEXT NOT NULL CHECK (loop_detection_mode IN ('block', 'quarantine')),
  policy_state TEXT NOT NULL CHECK (policy_state IN ('active', 'blocked', 'superseded', 'retired')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_control_max_chain_depth_nonnegative CHECK (max_chain_depth >= 0),
  CONSTRAINT assistive_control_blocked_downstream_required CHECK (jsonb_array_length(blocked_downstream_object_types) > 0)
);

CREATE TABLE IF NOT EXISTS assistive_capability_manifest (
  manifest_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL UNIQUE,
  capability_family TEXT NOT NULL CHECK (
    capability_family IN (
      'transcription',
      'documentation_draft',
      'structured_fact_extraction',
      'question_set_suggestion',
      'endpoint_suggestion',
      'message_draft',
      'pharmacy_or_booking_handoff_draft'
    )
  ),
  intended_use_profile_ref TEXT NOT NULL REFERENCES assistive_intended_use_profile(profile_id),
  allowed_contexts JSONB NOT NULL,
  allowed_inputs JSONB NOT NULL,
  allowed_outputs JSONB NOT NULL,
  composition_policy_ref TEXT NOT NULL REFERENCES assistive_composition_policy(composition_policy_id),
  visibility_policy_ref TEXT NOT NULL,
  surface_binding_policy_ref TEXT NOT NULL,
  route_contract_policy_ref TEXT NOT NULL,
  publication_policy_ref TEXT NOT NULL,
  rollout_ladder_policy_ref TEXT NOT NULL,
  recovery_disposition_policy_ref TEXT NOT NULL,
  telemetry_disclosure_policy_ref TEXT NOT NULL,
  required_trust_slice_refs JSONB NOT NULL,
  shadow_mode_default BOOLEAN NOT NULL,
  visible_mode_default BOOLEAN NOT NULL,
  approval_requirement TEXT NOT NULL CHECK (approval_requirement IN ('none', 'single_review', 'dual_review', 'clinical_safety_review')),
  medical_device_assessment_ref TEXT NOT NULL,
  release_cohort_ref TEXT NOT NULL,
  kill_switch_policy_ref TEXT NOT NULL,
  manifest_state TEXT NOT NULL CHECK (manifest_state IN ('active', 'shadow_only', 'blocked', 'retired')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_control_manifest_contexts_required CHECK (jsonb_array_length(allowed_contexts) > 0),
  CONSTRAINT assistive_control_manifest_inputs_required CHECK (jsonb_array_length(allowed_inputs) > 0),
  CONSTRAINT assistive_control_manifest_outputs_required CHECK (jsonb_array_length(allowed_outputs) > 0)
);

CREATE TABLE IF NOT EXISTS assistive_release_state (
  release_state_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (
    mode IN ('shadow_only', 'visible_summary', 'visible_insert', 'visible_commit', 'observe_only', 'blocked', 'withdrawn')
  ),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  compiled_policy_bundle_ref TEXT NOT NULL,
  rollout_verdict_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  release_state_version_ref TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('current', 'stale', 'superseded', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_control_release_window_order CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT assistive_control_release_policy_bundle_required CHECK (compiled_policy_bundle_ref <> '')
);

CREATE TABLE IF NOT EXISTS assistive_kill_switch_state (
  kill_switch_state_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  environment_ring TEXT NOT NULL,
  kill_state TEXT NOT NULL CHECK (kill_state IN ('inactive', 'shadow_only', 'blocked', 'withdrawn')),
  reason_code TEXT NOT NULL,
  activated_by TEXT NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL,
  fallback_mode TEXT NOT NULL CHECK (fallback_mode IN ('shadow_only', 'observe_only', 'blocked', 'recovery_only')),
  state_version_ref TEXT NOT NULL,
  CONSTRAINT assistive_control_kill_state_reason_required CHECK (reason_code <> '')
);

CREATE TABLE IF NOT EXISTS assistive_invocation_grant (
  assistive_invocation_grant_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  route_family TEXT NOT NULL,
  subject_scope TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  acting_context_ref TEXT NOT NULL,
  evidence_class_refs JSONB NOT NULL,
  visibility_ceiling TEXT NOT NULL CHECK (visibility_ceiling IN ('shadow_only', 'visible_summary', 'visible_insert', 'visible_commit')),
  compiled_policy_bundle_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  lineage_fence_epoch TEXT NOT NULL,
  entity_continuity_key TEXT NOT NULL,
  surface_binding_ref TEXT NOT NULL,
  rollout_verdict_ref TEXT NOT NULL,
  rollout_rung TEXT NOT NULL CHECK (rollout_rung IN ('shadow_only', 'visible_summary', 'visible_insert', 'visible_commit', 'frozen', 'withdrawn')),
  render_posture TEXT NOT NULL CHECK (render_posture IN ('shadow_only', 'visible', 'observe_only', 'blocked')),
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  telemetry_disclosure_fence_ref TEXT NOT NULL,
  ticket_or_task_ref TEXT NOT NULL,
  grant_fence_token TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  grant_state TEXT NOT NULL CHECK (grant_state IN ('live', 'shadow_only', 'observe_only', 'blocked', 'expired', 'revoked')),
  CONSTRAINT assistive_control_grant_expiry_order CHECK (expires_at > issued_at),
  CONSTRAINT assistive_control_grant_evidence_required CHECK (jsonb_array_length(evidence_class_refs) > 0),
  CONSTRAINT assistive_control_grant_fence_token_hashed CHECK (grant_fence_token LIKE 'grant-fence-token:%')
);

CREATE TABLE IF NOT EXISTS assistive_run_settlement (
  assistive_run_settlement_id TEXT PRIMARY KEY,
  assistive_run_ref TEXT NOT NULL,
  assistive_invocation_grant_ref TEXT NOT NULL REFERENCES assistive_invocation_grant(assistive_invocation_grant_id),
  settlement_state TEXT NOT NULL CHECK (
    settlement_state IN ('renderable', 'shadow_only', 'observe_only', 'abstained', 'quarantined', 'blocked_by_policy')
  ),
  quarantine_reason_code TEXT,
  renderable_artifact_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_artifact_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  schema_validation_state TEXT NOT NULL CHECK (schema_validation_state IN ('valid', 'invalid', 'missing', 'not_applicable')),
  policy_bundle_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  ui_transition_settlement_record_ref TEXT NOT NULL,
  assistive_capability_trust_envelope_ref TEXT,
  release_recovery_disposition_ref TEXT NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_control_quarantine_reason_required CHECK (
    settlement_state NOT IN ('quarantined', 'blocked_by_policy') OR quarantine_reason_code IS NOT NULL
  ),
  CONSTRAINT assistive_control_renderable_requires_valid_schema CHECK (
    settlement_state <> 'renderable' OR schema_validation_state = 'valid'
  )
);

CREATE TABLE IF NOT EXISTS assistive_control_audit_record (
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

CREATE INDEX IF NOT EXISTS idx_assistive_control_manifest_capability
  ON assistive_capability_manifest(capability_code, manifest_state);

CREATE INDEX IF NOT EXISTS idx_assistive_control_release_lookup
  ON assistive_release_state(capability_code, tenant_id, cohort_id, state, effective_from);

CREATE INDEX IF NOT EXISTS idx_assistive_control_kill_lookup
  ON assistive_kill_switch_state(capability_code, tenant_id, environment_ring, activated_at);

CREATE INDEX IF NOT EXISTS idx_assistive_control_grant_scope
  ON assistive_invocation_grant(capability_code, route_family, subject_scope, grant_state, expires_at);

CREATE INDEX IF NOT EXISTS idx_assistive_control_settlement_grant
  ON assistive_run_settlement(assistive_invocation_grant_ref, settlement_state);
