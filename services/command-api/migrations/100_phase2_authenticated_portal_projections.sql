-- Phase 2 par_185: authenticated portal projections and status access controls.

CREATE TABLE IF NOT EXISTS phase2_patient_audience_coverage_projections (
  patient_audience_coverage_projection_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  subject_scope_ref TEXT NOT NULL,
  audience_tier TEXT NOT NULL CHECK (
    audience_tier IN (
      'patient_public',
      'patient_authenticated',
      'secure_link_recovery',
      'embedded_authenticated'
    )
  ),
  purpose_of_use TEXT NOT NULL CHECK (
    purpose_of_use IN (
      'public_status',
      'authenticated_self_service',
      'secure_link_recovery',
      'embedded_authenticated'
    )
  ),
  projection_family_refs_json TEXT NOT NULL,
  route_family_refs_json TEXT NOT NULL,
  communication_preview_mode TEXT NOT NULL,
  timeline_visibility_mode TEXT NOT NULL,
  artifact_visibility_mode TEXT NOT NULL,
  mutation_authority TEXT NOT NULL CHECK (
    mutation_authority IN ('none', 'step_up_only', 'route_bound_mutation')
  ),
  minimum_necessary_contract_ref TEXT NOT NULL,
  required_visibility_policy_ref TEXT NOT NULL,
  required_coverage_row_refs_json TEXT NOT NULL,
  required_route_intent_refs_json TEXT NOT NULL,
  surface_state TEXT NOT NULL,
  recovery_reason TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_portal_entry_projections (
  patient_portal_entry_projection_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  patient_shell_consistency_ref TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  entry_state TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  trust_posture TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  route_tuple_hash TEXT NOT NULL,
  current_state_title TEXT NOT NULL,
  current_route_family_ref TEXT NOT NULL,
  safe_landing_route_ref TEXT NOT NULL,
  next_projection_refs_json TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  rendered_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_home_projections (
  patient_home_projection_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  patient_shell_consistency_ref TEXT NOT NULL,
  spotlight_decision_ref TEXT NOT NULL,
  quiet_home_decision_ref TEXT NOT NULL,
  required_release_trust_freeze_verdict_ref TEXT,
  secondary_card_ordering_hash TEXT NOT NULL,
  compact_card_refs_json TEXT NOT NULL,
  dominant_action_ref TEXT,
  surface_state TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_requests_index_projections (
  patient_requests_index_projection_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  patient_ref TEXT,
  default_bucket TEXT NOT NULL CHECK (default_bucket = 'needs_attention'),
  visible_buckets_json TEXT NOT NULL,
  active_filter_set_ref TEXT NOT NULL,
  selected_anchor_ref TEXT,
  selected_anchor_tuple_hash TEXT,
  dominant_action_ref TEXT,
  trust_cue_ref TEXT NOT NULL,
  request_summary_refs_json TEXT NOT NULL,
  request_lineage_refs_json TEXT NOT NULL,
  bucket_membership_digest_ref TEXT NOT NULL,
  lineage_ordering_digest_ref TEXT NOT NULL,
  surface_state TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_request_detail_projections (
  request_detail_projection_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  request_ref TEXT NOT NULL,
  request_version_ref TEXT NOT NULL,
  patient_shell_consistency_ref TEXT NOT NULL,
  summary_projection_ref TEXT NOT NULL,
  lineage_projection_ref TEXT NOT NULL,
  lineage_tuple_hash TEXT NOT NULL,
  downstream_ordering_digest_ref TEXT NOT NULL,
  evidence_snapshot_ref TEXT,
  evidence_summary_parity_ref TEXT,
  timeline_projection_ref TEXT,
  communications_projection_refs_json TEXT NOT NULL,
  downstream_projection_refs_json TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  selected_child_anchor_ref TEXT,
  selected_child_anchor_tuple_hash TEXT NOT NULL,
  request_return_bundle_ref TEXT NOT NULL,
  dominant_action_ref TEXT,
  placeholder_contract_ref TEXT NOT NULL,
  visible_field_refs_json TEXT NOT NULL,
  blocked_field_refs_json TEXT NOT NULL,
  surface_state TEXT NOT NULL,
  experience_continuity_evidence_ref TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  rendered_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_communication_visibility_projections (
  communication_visibility_projection_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  cluster_or_thread_ref TEXT NOT NULL,
  patient_shell_consistency_ref TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  release_state TEXT NOT NULL,
  step_up_requirement_ref TEXT,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  preview_visibility_contract_ref TEXT NOT NULL,
  visible_snippet_refs_json TEXT NOT NULL,
  preview_mode TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  hidden_content_reason_refs_json TEXT NOT NULL,
  redaction_policy_ref TEXT NOT NULL,
  safe_continuation_ref TEXT,
  latest_receipt_envelope_ref TEXT,
  latest_settlement_ref TEXT,
  experience_continuity_evidence_ref TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_action_recovery_projections (
  action_recovery_projection_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  governing_object_ref TEXT NOT NULL,
  origin_route_family_ref TEXT NOT NULL,
  patient_shell_consistency_ref TEXT NOT NULL,
  patient_degraded_mode_projection_ref TEXT NOT NULL,
  blocked_action_ref TEXT,
  patient_recovery_loop_ref TEXT NOT NULL,
  recovery_reason_code TEXT NOT NULL,
  entry_channel_ref TEXT NOT NULL,
  last_safe_summary_ref TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  request_return_bundle_ref TEXT,
  recovery_continuation_ref TEXT NOT NULL,
  action_recovery_envelope_ref TEXT NOT NULL,
  writable_eligibility_fence_ref TEXT NOT NULL,
  next_safe_action_ref TEXT NOT NULL,
  reentry_route_family_ref TEXT NOT NULL,
  surface_state TEXT NOT NULL,
  recovery_tuple_hash TEXT NOT NULL,
  experience_continuity_evidence_ref TEXT NOT NULL,
  rendered_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_identity_hold_projections (
  identity_hold_projection_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  identity_repair_case_ref TEXT NOT NULL,
  identity_repair_freeze_ref TEXT NOT NULL,
  identity_binding_ref TEXT,
  binding_version_ref TEXT,
  resulting_identity_binding_ref TEXT,
  identity_repair_release_settlement_ref TEXT,
  binding_fence_state TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  patient_shell_consistency_ref TEXT NOT NULL,
  patient_degraded_mode_projection_ref TEXT NOT NULL,
  hold_reason_ref TEXT NOT NULL,
  downstream_disposition_summary_ref TEXT NOT NULL,
  allowed_summary_tier TEXT NOT NULL,
  suppressed_action_refs_json TEXT NOT NULL,
  writable_eligibility_fence_ref TEXT NOT NULL,
  next_safe_action_ref TEXT NOT NULL,
  request_return_bundle_ref TEXT,
  resume_continuation_ref TEXT,
  surface_state TEXT NOT NULL,
  rendered_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_secure_link_session_projections (
  patient_secure_link_session_id TEXT PRIMARY KEY,
  coverage_projection_ref TEXT NOT NULL REFERENCES phase2_patient_audience_coverage_projections(patient_audience_coverage_projection_id),
  access_grant_ref TEXT NOT NULL,
  grant_family TEXT NOT NULL,
  grant_state TEXT NOT NULL,
  grant_scope_envelope_ref TEXT NOT NULL,
  access_grant_redemption_ref TEXT,
  grant_supersession_ref TEXT,
  route_intent_binding_ref TEXT,
  post_auth_return_intent_ref TEXT,
  session_establishment_decision_ref TEXT,
  subject_ref TEXT,
  identity_binding_ref TEXT,
  required_identity_binding_ref TEXT,
  subject_binding_version_ref TEXT,
  session_epoch_ref TEXT,
  lineage_fence_epoch TEXT,
  token_key_version_ref TEXT NOT NULL,
  fence_state TEXT NOT NULL,
  proof_state TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  resume_continuation_ref TEXT,
  patient_action_recovery_envelope_ref TEXT,
  last_safe_summary_ref TEXT,
  summary_safety_tier TEXT NOT NULL,
  recovery_route_family TEXT,
  expiry_at TEXT NOT NULL,
  session_state TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_patient_portal_projection_events (
  event_ref TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  coverage_projection_ref TEXT,
  occurred_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'AuthenticatedPortalProjectionService'
  )
);

CREATE INDEX IF NOT EXISTS idx_phase2_portal_coverage_subject
  ON phase2_patient_audience_coverage_projections(subject_scope_ref, audience_tier);

CREATE INDEX IF NOT EXISTS idx_phase2_portal_detail_request
  ON phase2_patient_request_detail_projections(request_ref);

CREATE INDEX IF NOT EXISTS idx_phase2_portal_recovery_governing_object
  ON phase2_patient_action_recovery_projections(governing_object_ref);

CREATE INDEX IF NOT EXISTS idx_phase2_portal_hold_repair_case
  ON phase2_patient_identity_hold_projections(identity_repair_case_ref);
