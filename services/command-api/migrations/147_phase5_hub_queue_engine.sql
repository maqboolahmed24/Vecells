-- 147_phase5_hub_queue_engine.sql
-- Depends on:
--   143_phase5_hub_case_kernel.sql
--   145_phase5_enhanced_access_policy_engine.sql
--   146_phase5_network_capacity_snapshot_pipeline.sql

BEGIN;

CREATE TABLE IF NOT EXISTS phase5_hub_queue_rank_plans (
  queue_rank_plan_id TEXT PRIMARY KEY,
  queue_family_ref TEXT NOT NULL,
  eligibility_rule_set_ref TEXT NOT NULL,
  lexicographic_tier_policy_ref TEXT NOT NULL,
  within_tier_weight_set_ref TEXT NOT NULL,
  fairness_merge_policy_ref TEXT NOT NULL,
  overload_guard_policy_ref TEXT NOT NULL,
  assignment_suggestion_policy_ref TEXT NOT NULL,
  explanation_schema_ref TEXT NOT NULL,
  canonical_tie_break_policy_ref TEXT NOT NULL,
  plan_hash TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_fairness_cycles (
  fairness_cycle_state_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  rank_snapshot_ref TEXT NOT NULL,
  overload_state TEXT NOT NULL,
  fairness_suppressed BOOLEAN NOT NULL,
  rho_hub_critical NUMERIC(12, 6) NOT NULL,
  critical_case_refs JSONB NOT NULL,
  ledger_entries JSONB NOT NULL,
  credit_ledger JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_rank_snapshots (
  rank_snapshot_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  queue_rank_plan_ref TEXT NOT NULL,
  as_of_at TIMESTAMPTZ NOT NULL,
  source_fact_cut_ref TEXT NOT NULL,
  trust_input_refs JSONB NOT NULL,
  eligible_task_refs JSONB NOT NULL,
  excluded_task_refs JSONB NOT NULL,
  overload_state TEXT NOT NULL,
  fairness_cycle_state_ref TEXT,
  row_order_hash TEXT NOT NULL,
  convergence_state TEXT NOT NULL,
  iteration_count INTEGER NOT NULL,
  source_refs JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_risk_explanations (
  hub_queue_risk_explanation_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  hub_coordination_case_id TEXT NOT NULL,
  expected_service INTEGER NOT NULL,
  d_clinical INTEGER NOT NULL,
  d_sla INTEGER NOT NULL,
  laxity_clinical NUMERIC(12, 6) NOT NULL,
  laxity_sla NUMERIC(12, 6) NOT NULL,
  urgency_carry NUMERIC(12, 6) NOT NULL,
  workload_ahead_minutes NUMERIC(12, 6) NOT NULL,
  wait_to_start_minutes NUMERIC(12, 6) NOT NULL,
  coordination_delay_minutes NUMERIC(12, 6) NOT NULL,
  dependency_delay_minutes NUMERIC(12, 6) NOT NULL,
  p_clinical_breach NUMERIC(12, 6) NOT NULL,
  p_sla_breach NUMERIC(12, 6) NOT NULL,
  p_breach NUMERIC(12, 6) NOT NULL,
  risk_band INTEGER NOT NULL,
  best_fit NUMERIC(12, 6) NOT NULL,
  best_trusted_fit NUMERIC(12, 6) NOT NULL,
  trust_gap NUMERIC(12, 6) NOT NULL,
  degraded_only BOOLEAN NOT NULL,
  access_penalty NUMERIC(12, 6) NOT NULL,
  modality_gap NUMERIC(12, 6) NOT NULL,
  local_fail NUMERIC(12, 6) NOT NULL,
  awaiting_patient NUMERIC(12, 6) NOT NULL,
  bounce NUMERIC(12, 6) NOT NULL,
  secondary_score NUMERIC(12, 6) NOT NULL,
  iteration_index INTEGER NOT NULL,
  convergence_delta NUMERIC(12, 6) NOT NULL,
  source_refs JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_rank_entries (
  rank_entry_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  task_ref TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  eligibility_state TEXT NOT NULL,
  lexicographic_tier TEXT NOT NULL,
  urgency_score NUMERIC(12, 6) NOT NULL,
  residual_band INTEGER NOT NULL,
  contact_risk_band INTEGER NOT NULL,
  duplicate_review_flag BOOLEAN NOT NULL DEFAULT FALSE,
  urgency_carry NUMERIC(12, 6) NOT NULL,
  fairness_band_ref TEXT NOT NULL,
  fairness_credit_before NUMERIC(12, 6) NOT NULL,
  fairness_credit_after NUMERIC(12, 6) NOT NULL,
  canonical_tie_break_key TEXT NOT NULL,
  explanation_payload_ref TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_timers (
  hub_queue_timer_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  hub_coordination_case_id TEXT NOT NULL,
  timer_type TEXT NOT NULL,
  timer_state TEXT NOT NULL,
  severity TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  observed_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  governing_ref TEXT,
  safe_summary TEXT NOT NULL,
  source_refs JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_change_batches (
  batch_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  source_rank_snapshot_ref TEXT NOT NULL,
  target_rank_snapshot_ref TEXT NOT NULL,
  preserved_anchor_ref TEXT,
  preserved_anchor_tuple_hash TEXT,
  inserted_refs JSONB NOT NULL,
  updated_refs JSONB NOT NULL,
  priority_shift_refs JSONB NOT NULL,
  rank_plan_version TEXT NOT NULL,
  apply_policy TEXT NOT NULL,
  batch_impact_class TEXT NOT NULL,
  focus_protected_ref TEXT,
  invalidated_anchor_refs JSONB NOT NULL,
  replacement_anchor_refs JSONB NOT NULL,
  anchor_apply_state TEXT NOT NULL,
  summary_message TEXT NOT NULL,
  first_buffered_at TIMESTAMPTZ NOT NULL,
  flush_deadline_at TIMESTAMPTZ NOT NULL,
  batch_state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_workbench_projections (
  hub_queue_workbench_projection_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  rank_snapshot_ref TEXT NOT NULL,
  active_queue_change_batch_ref TEXT,
  visible_row_refs JSONB NOT NULL,
  rows JSONB NOT NULL,
  selected_queue_row_ref TEXT,
  selected_option_card_ref TEXT,
  selected_anchor_ref TEXT,
  selected_anchor_tuple_hash_ref TEXT,
  dominant_action_ref TEXT,
  blocker_stub_refs JSONB NOT NULL,
  continuity_state TEXT NOT NULL,
  source_refs JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_case_console_projections (
  hub_case_console_projection_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  hub_coordination_case_id TEXT NOT NULL,
  network_booking_request_id TEXT NOT NULL,
  queue_ordinal INTEGER,
  dominant_action TEXT NOT NULL,
  blocker_stub_refs JSONB NOT NULL,
  timer_refs JSONB NOT NULL,
  option_card_refs JSONB NOT NULL,
  escalation_banner_ref TEXT,
  selected_option_card_ref TEXT,
  selected_anchor_ref TEXT,
  selected_anchor_tuple_hash_ref TEXT,
  continuity_state TEXT NOT NULL,
  source_refs JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_option_card_projections (
  hub_option_card_projection_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  hub_coordination_case_id TEXT NOT NULL,
  candidate_ref TEXT NOT NULL,
  decision_plan_ref TEXT,
  network_candidate_snapshot_ref TEXT,
  policy_evaluation_ref TEXT,
  capacity_rank_proof_ref TEXT,
  capacity_rank_explanation_ref TEXT,
  reservation_ref TEXT,
  reservation_state TEXT NOT NULL,
  source_trust_state TEXT NOT NULL,
  offerability_state TEXT NOT NULL,
  approved_variance_visible BOOLEAN NOT NULL,
  truthful_hold_state TEXT NOT NULL,
  rank_reason_refs JSONB NOT NULL,
  patient_reason_cue_refs JSONB NOT NULL,
  blocked_by_policy_reason_refs JSONB NOT NULL,
  source_refs JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_posture_projections (
  hub_posture_projection_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  rank_snapshot_ref TEXT NOT NULL,
  posture_state TEXT NOT NULL,
  overload_state TEXT NOT NULL,
  case_count INTEGER NOT NULL,
  critical_case_count INTEGER NOT NULL,
  warning_case_count INTEGER NOT NULL,
  no_trusted_supply_count INTEGER NOT NULL,
  stale_owner_count INTEGER NOT NULL,
  practice_ack_overdue_count INTEGER NOT NULL,
  callback_blocked_count INTEGER NOT NULL,
  source_refs JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_escalation_banner_projections (
  hub_escalation_banner_projection_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  rank_snapshot_ref TEXT NOT NULL,
  hub_coordination_case_id TEXT,
  banner_type TEXT NOT NULL,
  dominant_action TEXT NOT NULL,
  safe_summary TEXT NOT NULL,
  blocker_refs JSONB NOT NULL,
  source_refs JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_console_consistency_projections (
  hub_console_consistency_projection_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  rank_snapshot_ref TEXT NOT NULL,
  workbench_projection_ref TEXT NOT NULL,
  case_console_projection_refs JSONB NOT NULL,
  option_card_projection_refs JSONB NOT NULL,
  posture_projection_ref TEXT NOT NULL,
  escalation_banner_refs JSONB NOT NULL,
  selected_anchor_ref TEXT,
  selected_anchor_tuple_hash_ref TEXT,
  active_queue_change_batch_ref TEXT,
  bundle_version_hash TEXT NOT NULL,
  freeze_controls BOOLEAN NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS phase5_hub_queue_replay_fixtures (
  hub_queue_replay_fixture_id TEXT PRIMARY KEY,
  rank_snapshot_ref TEXT NOT NULL,
  queue_ref TEXT NOT NULL,
  hub_coordination_case_ids JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  continuity JSONB,
  case_bindings JSONB NOT NULL,
  source_refs JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

COMMIT;
