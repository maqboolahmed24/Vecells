BEGIN;

CREATE TABLE IF NOT EXISTS phase6_pharmacy_bounce_back_evidence_envelope (
  pharmacy_bounce_back_evidence_envelope_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_outcome_or_dispatch_ref TEXT,
  normalized_bounce_back_type TEXT NOT NULL,
  normalized_evidence_refs JSONB NOT NULL,
  trust_class TEXT NOT NULL,
  evidence_summary_ref TEXT NOT NULL,
  replay_digest TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  normalized_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_bounce_back_envelope_replay
  ON phase6_pharmacy_bounce_back_evidence_envelope (replay_digest);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_envelope_case
  ON phase6_pharmacy_bounce_back_evidence_envelope (pharmacy_case_id, normalized_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_bounce_back_record (
  bounce_back_record_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  bounce_back_evidence_envelope_ref TEXT NOT NULL,
  bounce_back_type TEXT NOT NULL,
  normalized_evidence_refs JSONB NOT NULL,
  urgency_carry_floor NUMERIC NOT NULL,
  material_change NUMERIC NOT NULL,
  loop_risk NUMERIC NOT NULL,
  reopen_signal NUMERIC NOT NULL,
  reopen_priority_band INTEGER NOT NULL,
  source_outcome_or_dispatch_ref TEXT,
  reachability_dependency_ref TEXT,
  patient_instruction_ref TEXT NOT NULL,
  practice_visibility_ref TEXT NOT NULL,
  supervisor_review_state TEXT NOT NULL,
  direct_urgent_route_ref TEXT,
  gp_action_required BOOLEAN NOT NULL,
  reopened_case_status TEXT NOT NULL,
  current_reachability_plan_ref TEXT,
  wrong_patient_freeze_state TEXT NOT NULL,
  auto_redispatch_blocked BOOLEAN NOT NULL,
  auto_close_blocked BOOLEAN NOT NULL,
  returned_task_ref TEXT,
  reopen_by_at TIMESTAMPTZ,
  patient_informed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_record_case
  ON phase6_pharmacy_bounce_back_record (pharmacy_case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_record_type_priority
  ON phase6_pharmacy_bounce_back_record (
    bounce_back_type,
    reopen_priority_band DESC,
    supervisor_review_state,
    updated_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_record_loop
  ON phase6_pharmacy_bounce_back_record (loop_risk DESC, material_change ASC, updated_at DESC);

CREATE TABLE IF NOT EXISTS phase6_urgent_return_direct_route_profile (
  urgent_return_direct_route_profile_id TEXT PRIMARY KEY,
  bounce_back_type TEXT NOT NULL,
  route_class TEXT NOT NULL,
  direct_route_ref TEXT NOT NULL,
  fallback_route_ref TEXT,
  update_record_forbidden BOOLEAN NOT NULL,
  monitored_safety_net_required BOOLEAN NOT NULL,
  contract_source_ref TEXT NOT NULL,
  route_evidence_requirement_ref TEXT NOT NULL,
  calm_copy_forbidden BOOLEAN NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_urgent_return_route_type
  ON phase6_urgent_return_direct_route_profile (bounce_back_type);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_practice_visibility_projection (
  pharmacy_practice_visibility_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  selected_provider_ref TEXT,
  dispatch_truth_projection_ref TEXT,
  patient_status_projection_ref TEXT NOT NULL,
  latest_outcome_truth_projection_ref TEXT,
  latest_outcome_evidence_ref TEXT,
  active_bounce_back_record_ref TEXT,
  reachability_plan_ref TEXT,
  latest_patient_instruction_state TEXT NOT NULL,
  gp_action_required_state TEXT NOT NULL,
  triage_reentry_state TEXT NOT NULL,
  urgent_return_state TEXT NOT NULL,
  reachability_repair_state TEXT NOT NULL,
  current_close_blocker_refs JSONB NOT NULL,
  current_confirmation_gate_refs JSONB NOT NULL,
  minimum_necessary_audience_view TEXT NOT NULL,
  wrong_patient_freeze_state TEXT NOT NULL,
  calm_copy_allowed BOOLEAN NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_practice_visibility_case
  ON phase6_pharmacy_practice_visibility_projection (pharmacy_case_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_bounce_back_supervisor_review (
  pharmacy_bounce_back_supervisor_review_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  bounce_back_record_ref TEXT NOT NULL,
  review_state TEXT NOT NULL,
  loop_risk NUMERIC NOT NULL,
  material_change NUMERIC NOT NULL,
  reopen_priority_band INTEGER NOT NULL,
  assigned_supervisor_ref TEXT,
  opened_at TIMESTAMPTZ NOT NULL,
  last_updated_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  resolution_notes_ref TEXT,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_supervisor_case
  ON phase6_pharmacy_bounce_back_supervisor_review (pharmacy_case_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_supervisor_state
  ON phase6_pharmacy_bounce_back_supervisor_review (review_state, loop_risk DESC, opened_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_return_notification_trigger (
  pharmacy_return_notification_trigger_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  bounce_back_record_ref TEXT NOT NULL,
  patient_status_projection_ref TEXT NOT NULL,
  notification_state TEXT NOT NULL,
  channel_hint TEXT NOT NULL,
  headline_copy_ref TEXT NOT NULL,
  body_copy_ref TEXT NOT NULL,
  warning_copy_ref TEXT,
  selected_anchor_ref TEXT NOT NULL,
  active_return_contract_ref TEXT,
  generated_at TIMESTAMPTZ NOT NULL,
  patient_informed_at TIMESTAMPTZ,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_return_notification_case
  ON phase6_pharmacy_return_notification_trigger (pharmacy_case_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_bounce_back_truth_projection (
  pharmacy_bounce_back_truth_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  bounce_back_record_ref TEXT NOT NULL,
  patient_status_projection_ref TEXT NOT NULL,
  practice_visibility_projection_ref TEXT NOT NULL,
  reachability_plan_ref TEXT,
  current_notification_trigger_ref TEXT,
  current_supervisor_review_ref TEXT,
  reopened_case_status TEXT NOT NULL,
  returned_task_ref TEXT,
  reacquisition_mode TEXT NOT NULL,
  triage_reentry_state TEXT NOT NULL,
  gp_action_required BOOLEAN NOT NULL,
  material_change NUMERIC NOT NULL,
  loop_risk NUMERIC NOT NULL,
  reopen_signal NUMERIC NOT NULL,
  reopen_priority_band INTEGER NOT NULL,
  patient_notification_state TEXT NOT NULL,
  rotated_patient_entry_grant_refs JSONB NOT NULL,
  auto_redispatch_blocked BOOLEAN NOT NULL,
  auto_close_blocked BOOLEAN NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_truth_case
  ON phase6_pharmacy_bounce_back_truth_projection (pharmacy_case_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_truth_queue
  ON phase6_pharmacy_bounce_back_truth_projection (
    reopened_case_status,
    reopen_priority_band DESC,
    auto_redispatch_blocked,
    computed_at DESC
  );

CREATE TABLE IF NOT EXISTS phase6_pharmacy_bounce_back_audit_event (
  pharmacy_bounce_back_audit_event_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  bounce_back_record_ref TEXT,
  supervisor_review_ref TEXT,
  event_name TEXT NOT NULL,
  event_digest TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_bounce_back_audit_case
  ON phase6_pharmacy_bounce_back_audit_event (pharmacy_case_id, recorded_at DESC);

COMMIT;
