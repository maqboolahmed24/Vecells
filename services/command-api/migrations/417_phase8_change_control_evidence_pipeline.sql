-- Phase 8 task 417: change-control and regulatory assurance evidence pipeline.
-- Store structured refs, hashes, approval topology, blocker codes, and governed artifact refs only.

CREATE TABLE IF NOT EXISTS model_change_request (
  change_request_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  change_class TEXT NOT NULL CHECK (
    change_class IN (
      'copy_template_only',
      'prompt_or_threshold',
      'model_version',
      'subprocessor_or_inference_host',
      'capability_expansion',
      'intended_use',
      'regulatory_posture'
    )
  ),
  current_version_ref TEXT NOT NULL,
  proposed_version_ref TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  request_hash TEXT NOT NULL,
  CONSTRAINT model_change_request_candidate_hash_required CHECK (
    release_candidate_ref <> '' AND request_hash <> ''
  )
);

CREATE TABLE IF NOT EXISTS change_impact_assessment (
  impact_assessment_id TEXT PRIMARY KEY,
  change_request_id TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  change_class TEXT NOT NULL,
  surface_delta_refs JSONB NOT NULL,
  surface_publication_delta_refs JSONB NOT NULL,
  rollout_ladder_delta BOOLEAN NOT NULL,
  rollout_slice_delta_refs JSONB NOT NULL,
  workflow_decision_delta BOOLEAN NOT NULL,
  artifact_delivery_delta BOOLEAN NOT NULL,
  ui_telemetry_disclosure_delta BOOLEAN NOT NULL,
  intended_use_delta BOOLEAN NOT NULL,
  patient_facing_wording_delta BOOLEAN NOT NULL,
  medical_purpose_boundary_state TEXT NOT NULL,
  im1_rfc_required BOOLEAN NOT NULL,
  scal_update_required BOOLEAN NOT NULL,
  dtac_delta_required BOOLEAN NOT NULL,
  dcb0129_delta_required BOOLEAN NOT NULL,
  dcb0160_dependency_note_required BOOLEAN NOT NULL,
  dpia_delta_required BOOLEAN NOT NULL,
  mhra_assessment_required BOOLEAN NOT NULL,
  medical_device_reassessment_required BOOLEAN NOT NULL,
  evaluation_rerun_required BOOLEAN NOT NULL,
  replay_proof_required BOOLEAN NOT NULL,
  rollback_proof_required BOOLEAN NOT NULL,
  local_technical_assurance_required BOOLEAN NOT NULL,
  assessment_state TEXT NOT NULL CHECK (assessment_state IN ('complete', 'blocked', 'superseded')),
  blocking_reason_codes JSONB NOT NULL,
  assessed_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT change_impact_from_real_deltas CHECK (
    release_candidate_hash <> '' AND change_request_id <> ''
  ),
  CONSTRAINT exact_regulatory_trigger_routing CHECK (
    NOT (
      change_class IN ('capability_expansion', 'intended_use', 'regulatory_posture')
      AND (NOT im1_rfc_required OR NOT scal_update_required OR NOT dtac_delta_required)
    )
  ),
  CONSTRAINT medical_device_boundary_reassessment_required CHECK (
    medical_purpose_boundary_state NOT IN (
      'endpoint_suggestion_clinically_consequential_decision_support',
      'regulatory_posture_change'
    )
    OR (mhra_assessment_required AND medical_device_reassessment_required)
  )
);

CREATE TABLE IF NOT EXISTS rfc_bundle (
  rfc_bundle_id TEXT PRIMARY KEY,
  im1_product_ref TEXT NOT NULL,
  change_request_id TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  scal_delta_ref TEXT NOT NULL,
  safety_case_delta_ref TEXT NOT NULL,
  documentation_refs JSONB NOT NULL,
  evidence_baseline_ref TEXT NOT NULL,
  approval_graph_ref TEXT NOT NULL,
  impact_assessment_ref TEXT NOT NULL,
  im1_rfc_required BOOLEAN NOT NULL,
  local_technical_assurance_ref TEXT NOT NULL,
  submission_state TEXT NOT NULL CHECK (submission_state IN ('not_required', 'draft', 'ready', 'blocked')),
  blocking_reason_codes JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  assembled_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT im1_not_ai_specific_technical_assurance CHECK (
    local_technical_assurance_ref <> '' AND evidence_baseline_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS subprocessor_assurance_ref (
  subprocessor_ref_id TEXT PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  supplied_model_or_service_refs JSONB NOT NULL,
  safety_evidence_ref TEXT NOT NULL,
  dpia_ref TEXT NOT NULL,
  contractual_control_ref TEXT NOT NULL,
  assurance_version TEXT NOT NULL,
  assurance_fresh_until TIMESTAMPTZ NOT NULL,
  drift_state TEXT NOT NULL CHECK (
    drift_state IN ('current', 'stale', 'drifted', 'suspended', 'withdrawn')
  ),
  suspension_state TEXT NOT NULL CHECK (suspension_state IN ('active', 'suspended', 'withdrawn')),
  CONSTRAINT supplier_assurance_current_or_freeze CHECK (
    drift_state = 'current' AND suspension_state = 'active'
    OR drift_state IN ('stale', 'drifted', 'suspended', 'withdrawn')
    OR suspension_state IN ('suspended', 'withdrawn')
  )
);

CREATE TABLE IF NOT EXISTS medical_device_assessment_ref (
  assessment_ref_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  intended_use_profile_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  assessment_outcome TEXT NOT NULL CHECK (
    assessment_outcome IN (
      'not_medical_device',
      'medical_device_not_registered',
      'registered',
      'reassessment_required',
      'blocked'
    )
  ),
  registration_state TEXT NOT NULL CHECK (
    registration_state IN ('not_applicable', 'registered', 'pending', 'expired', 'blocked')
  ),
  evidence_refs JSONB NOT NULL,
  review_due_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT medical_device_assessment_refs_only CHECK (
    intended_use_profile_ref NOT LIKE '%draft-text:%' AND boundary_decision_ref NOT LIKE '%transcript:%'
  )
);

CREATE TABLE IF NOT EXISTS safety_case_delta (
  delta_id TEXT PRIMARY KEY,
  release_candidate_ref TEXT NOT NULL,
  hazard_changes JSONB NOT NULL,
  controls_added JSONB NOT NULL,
  hazard_trace_ref TEXT NOT NULL,
  control_verification_refs JSONB NOT NULL,
  residual_risk_ref TEXT NOT NULL,
  test_evidence_ref TEXT NOT NULL,
  signoff_state TEXT NOT NULL CHECK (
    signoff_state IN ('not_required', 'draft', 'in_review', 'signed', 'blocked', 'revoked')
  ),
  CONSTRAINT safety_case_delta_trace_required CHECK (
    signoff_state <> 'signed'
    OR (hazard_trace_ref <> '' AND residual_risk_ref <> '' AND test_evidence_ref <> '')
  )
);

CREATE TABLE IF NOT EXISTS assurance_baseline_snapshot (
  baseline_snapshot_id TEXT PRIMARY KEY,
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  im1_guidance_version_ref TEXT NOT NULL,
  dtac_version_ref TEXT NOT NULL,
  dcb_standard_version_ref TEXT NOT NULL,
  dpia_ref TEXT NOT NULL,
  scal_version_ref TEXT NOT NULL,
  medical_device_assessment_ref TEXT NOT NULL,
  evaluation_dataset_ref TEXT NOT NULL,
  replay_harness_version_ref TEXT NOT NULL,
  supplier_assurance_refs JSONB NOT NULL,
  disclosure_baseline_ref TEXT NOT NULL,
  safety_case_delta_ref TEXT NOT NULL,
  fresh_until TIMESTAMPTZ NOT NULL,
  baseline_state TEXT NOT NULL CHECK (baseline_state IN ('candidate', 'current', 'stale', 'superseded', 'withdrawn')),
  superseded_at TIMESTAMPTZ,
  baseline_hash TEXT NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  pinned_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT baseline_snapshot_pins_guidance_versions CHECK (
    im1_guidance_version_ref <> ''
    AND dtac_version_ref <> ''
    AND dcb_standard_version_ref <> ''
    AND scal_version_ref <> ''
    AND baseline_hash <> ''
  ),
  CONSTRAINT stale_baseline_blocks_promotion CHECK (
    baseline_state = 'current' OR baseline_state IN ('candidate', 'stale', 'superseded', 'withdrawn')
  )
);

CREATE TABLE IF NOT EXISTS release_approval_graph (
  approval_graph_id TEXT PRIMARY KEY,
  change_request_id TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  impact_assessment_ref TEXT NOT NULL,
  required_approver_roles JSONB NOT NULL,
  signoff_refs JSONB NOT NULL,
  no_self_approval_state TEXT NOT NULL CHECK (no_self_approval_state IN ('satisfied', 'blocked')),
  independent_safety_reviewer_ref TEXT,
  deployment_approver_ref TEXT,
  current_approval_state TEXT NOT NULL CHECK (current_approval_state IN ('pending', 'satisfied', 'blocked')),
  missing_approver_roles JSONB NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  completed_at TIMESTAMPTZ,
  evaluated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT no_self_approval_and_independent_safety_review CHECK (
    current_approval_state <> 'satisfied'
    OR (no_self_approval_state = 'satisfied' AND independent_safety_reviewer_ref IS NOT NULL)
  ),
  CONSTRAINT approval_graph_covers_all_active_triggers CHECK (
    jsonb_array_length(required_approver_roles) > 0
  )
);

CREATE TABLE IF NOT EXISTS rollback_readiness_bundle (
  rollback_bundle_id TEXT PRIMARY KEY,
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  rollback_target_ref TEXT NOT NULL,
  data_compatibility_state TEXT NOT NULL CHECK (data_compatibility_state IN ('compatible', 'incompatible', 'unknown')),
  policy_compatibility_state TEXT NOT NULL CHECK (policy_compatibility_state IN ('compatible', 'incompatible', 'unknown')),
  runtime_publication_parity_state TEXT NOT NULL CHECK (
    runtime_publication_parity_state IN ('exact', 'stale', 'conflict', 'missing')
  ),
  kill_switch_plan_ref TEXT NOT NULL,
  operator_runbook_ref TEXT NOT NULL,
  verification_evidence_refs JSONB NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  bundle_state TEXT NOT NULL CHECK (bundle_state IN ('ready', 'incomplete', 'blocked')),
  blocking_reason_codes JSONB NOT NULL,
  bundle_hash TEXT NOT NULL,
  assembled_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT rollback_readiness_required_for_promotion CHECK (
    bundle_state <> 'ready'
    OR (
      data_compatibility_state = 'compatible'
      AND policy_compatibility_state = 'compatible'
      AND runtime_publication_parity_state = 'exact'
      AND kill_switch_plan_ref <> ''
      AND operator_runbook_ref <> ''
      AND jsonb_array_length(verification_evidence_refs) > 0
    )
  )
);

CREATE TABLE IF NOT EXISTS assurance_freeze_state (
  assurance_freeze_state_id TEXT PRIMARY KEY,
  scope_ref TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  baseline_snapshot_ref TEXT,
  rollback_bundle_ref TEXT,
  approval_graph_ref TEXT,
  freeze_reason_code TEXT NOT NULL,
  trigger_ref TEXT NOT NULL,
  activated_by TEXT NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL,
  lift_criteria JSONB NOT NULL,
  freeze_state TEXT NOT NULL CHECK (freeze_state IN ('clear', 'monitoring', 'frozen', 'released')),
  blocking_reason_codes JSONB NOT NULL,
  CONSTRAINT supplier_drift_opens_assurance_freeze CHECK (
    freeze_state <> 'frozen' OR jsonb_array_length(blocking_reason_codes) > 0
  )
);

CREATE TABLE IF NOT EXISTS assistive_release_action_record (
  assistive_release_action_record_id TEXT PRIMARY KEY,
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  baseline_snapshot_ref TEXT NOT NULL,
  baseline_snapshot_hash TEXT NOT NULL,
  rollback_bundle_ref TEXT NOT NULL,
  rollback_bundle_hash TEXT NOT NULL,
  approval_graph_ref TEXT NOT NULL,
  rollout_slice_contract_ref TEXT NOT NULL,
  rollout_verdict_ref TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'promote', 'freeze', 'unfreeze', 'rollback')),
  route_intent_binding_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  ui_telemetry_disclosure_baseline_ref TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  action_tuple_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  CONSTRAINT release_actions_bind_exact_candidate_hashes CHECK (
    release_candidate_hash <> ''
    AND baseline_snapshot_hash <> ''
    AND rollback_bundle_hash <> ''
    AND runtime_publication_bundle_ref <> ''
    AND ui_telemetry_disclosure_baseline_ref <> ''
    AND action_tuple_hash <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_release_action_settlement (
  assistive_release_action_settlement_id TEXT PRIMARY KEY,
  assistive_release_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  ui_transition_settlement_record_ref TEXT NOT NULL,
  ui_telemetry_disclosure_fence_ref TEXT NOT NULL,
  presentation_artifact_ref TEXT NOT NULL,
  result TEXT NOT NULL CHECK (
    result IN (
      'approved',
      'promoted',
      'frozen',
      'unfrozen',
      'rollback_started',
      'stale_recoverable',
      'denied_scope',
      'blocked_policy',
      'failed'
    )
  ),
  recovery_action_ref TEXT NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_regulatory_evidence_export (
  evidence_export_id TEXT PRIMARY KEY,
  export_kind TEXT NOT NULL CHECK (export_kind IN ('rfc_bundle', 'approval_summary', 'rollback_pack', 'runbook')),
  release_candidate_ref TEXT NOT NULL,
  release_candidate_hash TEXT NOT NULL,
  rfc_bundle_ref TEXT,
  approval_graph_ref TEXT,
  rollback_bundle_ref TEXT,
  baseline_snapshot_ref TEXT NOT NULL,
  artifact_presentation_policy_ref TEXT NOT NULL,
  outbound_navigation_grant_ref TEXT NOT NULL,
  presentation_artifact_ref TEXT NOT NULL,
  repository_artifact_ref TEXT NOT NULL,
  export_state TEXT NOT NULL CHECK (export_state IN ('ready', 'blocked')),
  blocking_reason_codes JSONB NOT NULL,
  exported_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT governed_evidence_exports_only CHECK (
    artifact_presentation_policy_ref <> ''
    AND outbound_navigation_grant_ref <> ''
    AND presentation_artifact_ref <> ''
    AND repository_artifact_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_assurance_audit_record (
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
  reason_codes JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_assurance_phi_safe_refs_only CHECK (
    subject_ref NOT LIKE '%draft-text:%'
    AND subject_ref NOT LIKE '%transcript:%'
    AND subject_ref NOT LIKE '%prompt-fragment:%'
  )
);
