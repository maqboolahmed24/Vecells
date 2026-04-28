BEGIN;

CREATE TABLE IF NOT EXISTS phase6_pharmacy_outcome_truth_projection (
  pharmacy_outcome_truth_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  outcome_truth_state TEXT NOT NULL,
  resolution_class TEXT,
  patient_visibility_state TEXT NOT NULL,
  close_eligibility_state TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  audience_message_ref TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_outcome_truth_projection_case
  ON phase6_pharmacy_outcome_truth_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_reachability_plan (
  pharmacy_reachability_plan_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  patient_contact_route_ref TEXT NOT NULL,
  pharmacy_contact_dependency_ref TEXT NOT NULL,
  outcome_confirmation_dependency_ref TEXT NOT NULL,
  urgent_return_dependency_ref TEXT NOT NULL,
  current_reachability_assessment_ref TEXT NOT NULL,
  current_contact_route_snapshot_ref TEXT NOT NULL,
  contact_repair_journey_ref TEXT,
  dominant_broken_dependency TEXT NOT NULL,
  repair_state TEXT NOT NULL,
  route_authority_state TEXT NOT NULL,
  delivery_risk_state TEXT NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_reachability_plan_case
  ON phase6_pharmacy_reachability_plan (pharmacy_case_id, refreshed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_patient_status_projection (
  pharmacy_patient_status_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  selected_provider_ref TEXT,
  dispatch_truth_projection_ref TEXT,
  outcome_truth_projection_ref TEXT,
  bounce_back_record_ref TEXT,
  reachability_plan_ref TEXT,
  current_macro_state TEXT NOT NULL,
  next_safe_action_copy_ref TEXT NOT NULL,
  warning_copy_ref TEXT,
  review_copy_ref TEXT,
  continuity_evidence_ref TEXT NOT NULL,
  stale_or_blocked_posture TEXT NOT NULL,
  dominant_reachability_dependency_ref TEXT,
  last_meaningful_event_at TIMESTAMPTZ NOT NULL,
  calm_copy_allowed BOOLEAN NOT NULL,
  current_identity_repair_disposition_ref TEXT,
  audience_message_ref TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_patient_status_projection_case
  ON phase6_pharmacy_patient_status_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_patient_provider_summary (
  pharmacy_patient_provider_summary_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  provider_ref TEXT,
  detail_visibility_state TEXT NOT NULL,
  provider_display_name TEXT,
  selected_anchor_ref TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_patient_provider_summary_case
  ON phase6_pharmacy_patient_provider_summary (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_patient_referral_reference_summary (
  pharmacy_patient_referral_reference_summary_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  dispatch_truth_projection_ref TEXT,
  correlation_record_ref TEXT,
  display_mode TEXT NOT NULL,
  display_reference TEXT,
  outbound_reference_set_hash TEXT,
  selected_anchor_ref TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_patient_referral_reference_summary_case
  ON phase6_pharmacy_patient_referral_reference_summary (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_patient_reachability_repair_projection (
  pharmacy_patient_reachability_repair_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  dominant_broken_dependency TEXT NOT NULL,
  reachability_dependency_ref TEXT,
  current_contact_route_snapshot_ref TEXT,
  current_reachability_assessment_ref TEXT,
  contact_repair_journey_ref TEXT,
  referral_anchor_ref TEXT NOT NULL,
  resume_continuation_ref TEXT,
  selected_anchor_ref TEXT NOT NULL,
  governing_status_truth_revision TEXT NOT NULL,
  next_repair_action TEXT NOT NULL,
  repair_projection_state TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_patient_reachability_repair_projection_case
  ON phase6_pharmacy_patient_reachability_repair_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_patient_continuity_projection (
  pharmacy_patient_continuity_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  patient_shell_consistency_projection_ref TEXT NOT NULL,
  experience_continuity_projection_ref TEXT,
  selected_anchor_ref TEXT NOT NULL,
  active_route_family_ref TEXT NOT NULL,
  shell_consistency_state TEXT NOT NULL,
  continuity_validation_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  governing_status_truth_revision TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_patient_continuity_projection_case
  ON phase6_pharmacy_patient_continuity_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_patient_instruction_panel (
  pharmacy_patient_instruction_panel_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  patient_status_projection_ref TEXT NOT NULL,
  provider_summary_ref TEXT,
  repair_projection_ref TEXT,
  referral_reference_summary_ref TEXT,
  content_grammar_version_ref TEXT NOT NULL,
  macro_state TEXT NOT NULL,
  headline_copy_ref TEXT NOT NULL,
  next_step_copy_ref TEXT NOT NULL,
  warning_copy_ref TEXT,
  review_copy_ref TEXT,
  calm_completion_copy_ref TEXT,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_patient_instruction_panel_case
  ON phase6_pharmacy_patient_instruction_panel (pharmacy_case_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_patient_status_audit_event (
  pharmacy_patient_status_audit_event_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  previous_macro_state TEXT NOT NULL,
  next_macro_state TEXT NOT NULL,
  previous_dominant_reachability_dependency_ref TEXT,
  next_dominant_reachability_dependency_ref TEXT,
  previous_stale_or_blocked_posture TEXT NOT NULL,
  next_stale_or_blocked_posture TEXT NOT NULL,
  governing_status_truth_revision TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_patient_status_audit_event_case
  ON phase6_pharmacy_patient_status_audit_event (pharmacy_case_id, recorded_at DESC);

COMMIT;
