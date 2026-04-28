-- 151_phase5_hub_fallback_workflows.sql
-- Phase 5 no-slot fallback, callback transfer, urgent return, reopen linkage, loop escalation, and exception persistence.
-- Depends on:
--   143_phase5_hub_case_kernel.sql
--   148_phase5_alternative_offer_engine.sql
--   150_phase5_practice_continuity_chain.sql

CREATE TABLE IF NOT EXISTS phase5_hub_fallback_records (
  hub_fallback_record_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  fallback_type text NOT NULL,
  fallback_state text NOT NULL,
  fallback_reason_code text NOT NULL,
  source_offer_session_ref text,
  source_fallback_card_ref text,
  callback_fallback_ref text,
  return_to_practice_ref text,
  active_exception_ref text,
  offer_lead_minutes integer,
  callback_lead_minutes integer,
  remaining_clinical_window_minutes integer NOT NULL,
  urgency_carry_floor numeric NOT NULL,
  bounce_count integer NOT NULL DEFAULT 0,
  novelty_score numeric NOT NULL DEFAULT 1,
  waitlist_deadline_evaluation_ref text,
  waitlist_fallback_obligation_ref text,
  waitlist_continuation_truth_projection_ref text,
  waitlist_required_fallback_route text,
  waitlist_window_risk_state text,
  carry_forward_bound_at timestamptz,
  truth_projection_ref text,
  truth_tuple_hash text NOT NULL,
  state_confidence_band text NOT NULL,
  transferred_at timestamptz,
  completed_at timestamptz,
  recorded_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_callback_fallback_records (
  callback_fallback_record_id text PRIMARY KEY,
  hub_fallback_record_ref text NOT NULL,
  hub_coordination_case_id text NOT NULL,
  callback_state text NOT NULL,
  callback_lead_minutes integer NOT NULL,
  source_offer_session_ref text,
  source_fallback_card_ref text,
  callback_case_ref text,
  callback_expectation_envelope_ref text,
  linked_at timestamptz,
  offered_at timestamptz,
  completed_at timestamptz,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_hub_return_to_practice_records (
  hub_return_to_practice_record_id text PRIMARY KEY,
  hub_fallback_record_ref text NOT NULL,
  hub_coordination_case_id text NOT NULL,
  return_state text NOT NULL,
  return_reason_code text NOT NULL,
  target_practice_ods text NOT NULL,
  urgency_carry_floor numeric NOT NULL,
  p_breach numeric NOT NULL,
  trust_gap numeric NOT NULL,
  best_trusted_fit numeric NOT NULL,
  bounce_count integer NOT NULL DEFAULT 0,
  novelty_score numeric NOT NULL DEFAULT 1,
  reopened_workflow_ref text,
  reopened_lineage_case_link_ref text,
  reopened_lease_ref text,
  reopen_lifecycle_state text NOT NULL,
  linked_at timestamptz,
  completed_at timestamptz,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_hub_fallback_cycle_counters (
  hub_fallback_cycle_counter_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  bounce_count integer NOT NULL DEFAULT 0,
  previous_best_trusted_fit numeric NOT NULL,
  previous_priority_band text NOT NULL,
  latest_novelty_score numeric NOT NULL,
  last_returned_at timestamptz,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_hub_fallback_supervisor_escalations (
  hub_fallback_supervisor_escalation_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  hub_fallback_record_ref text NOT NULL,
  exception_ref text NOT NULL,
  escalation_state text NOT NULL,
  trigger_code text NOT NULL,
  bounce_count integer NOT NULL,
  novelty_score numeric NOT NULL,
  novelty_threshold numeric NOT NULL,
  bounce_threshold integer NOT NULL,
  recorded_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_hub_coordination_exceptions (
  exception_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  hub_fallback_record_ref text,
  active_child_ref text,
  exception_class text NOT NULL,
  exception_state text NOT NULL,
  retry_state text NOT NULL,
  escalation_state text NOT NULL,
  reason_code text NOT NULL,
  truth_projection_ref text,
  truth_tuple_hash text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  resolved_at timestamptz,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_fallback_records_case
  ON phase5_hub_fallback_records (hub_coordination_case_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_callback_fallback_records_case
  ON phase5_callback_fallback_records (hub_coordination_case_id, offered_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_return_to_practice_records_case
  ON phase5_hub_return_to_practice_records (hub_coordination_case_id, linked_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_fallback_cycle_counters_case
  ON phase5_hub_fallback_cycle_counters (hub_coordination_case_id);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_fallback_supervisor_escalations_case
  ON phase5_hub_fallback_supervisor_escalations (hub_coordination_case_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_coordination_exceptions_case
  ON phase5_hub_coordination_exceptions (hub_coordination_case_id, created_at DESC);
