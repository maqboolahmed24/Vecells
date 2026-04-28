BEGIN;

CREATE TABLE IF NOT EXISTS phase6_pharmacy_active_cases_projection (
  pharmacy_active_cases_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  selected_provider_ref TEXT,
  provider_key TEXT,
  selected_provider_display_name TEXT,
  patient_status_projection_ref TEXT,
  practice_visibility_projection_ref TEXT,
  dispatch_truth_projection_ref TEXT,
  outcome_truth_projection_ref TEXT,
  bounce_back_truth_projection_ref TEXT,
  case_status TEXT NOT NULL,
  dispatch_state TEXT NOT NULL,
  latest_patient_instruction_state TEXT,
  last_outcome_evidence_ref TEXT,
  last_outcome_evidence_summary_ref TEXT,
  gp_action_required_state TEXT,
  triage_reentry_state TEXT,
  urgent_return_state TEXT,
  reachability_repair_state TEXT,
  current_close_blocker_refs JSONB NOT NULL,
  current_confirmation_gate_refs JSONB NOT NULL,
  continuity_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  review_debt_state TEXT NOT NULL,
  active_exception_classes JSONB NOT NULL,
  evidence_refs JSONB NOT NULL,
  severity TEXT NOT NULL,
  queue_age_minutes INTEGER NOT NULL,
  case_age_minutes INTEGER NOT NULL,
  last_meaningful_event_at TIMESTAMPTZ NOT NULL,
  latest_case_updated_at TIMESTAMPTZ NOT NULL,
  sla_target_at TIMESTAMPTZ NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_active_case_case
  ON phase6_pharmacy_active_cases_projection (pharmacy_case_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_active_case_provider
  ON phase6_pharmacy_active_cases_projection (provider_key, severity, queue_age_minutes DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_active_case_exceptions
  ON phase6_pharmacy_active_cases_projection USING GIN (active_exception_classes);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_waiting_for_choice_projection (
  pharmacy_waiting_for_choice_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  choice_truth_projection_ref TEXT NOT NULL,
  directory_snapshot_ref TEXT NOT NULL,
  selected_provider_ref TEXT,
  provider_key TEXT,
  selected_provider_display_name TEXT,
  visible_choice_count INTEGER NOT NULL,
  recommended_frontier_count INTEGER NOT NULL,
  recommended_frontier_summary_ref TEXT NOT NULL,
  warned_choice_count INTEGER NOT NULL,
  warned_choice_summary_ref TEXT NOT NULL,
  stale_directory_posture TEXT NOT NULL,
  selected_provider_state TEXT NOT NULL,
  patient_override_required BOOLEAN NOT NULL,
  suppressed_unsafe_summary_ref TEXT,
  continuity_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  review_debt_state TEXT NOT NULL,
  active_exception_classes JSONB NOT NULL,
  evidence_refs JSONB NOT NULL,
  severity TEXT NOT NULL,
  queue_age_minutes INTEGER NOT NULL,
  case_age_minutes INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_waiting_choice_case
  ON phase6_pharmacy_waiting_for_choice_projection (pharmacy_case_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_waiting_choice_provider
  ON phase6_pharmacy_waiting_for_choice_projection (provider_key, severity, queue_age_minutes DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_waiting_choice_exceptions
  ON phase6_pharmacy_waiting_for_choice_projection USING GIN (active_exception_classes);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatched_waiting_outcome_projection (
  pharmacy_dispatched_waiting_outcome_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  dispatch_truth_projection_ref TEXT NOT NULL,
  dispatch_attempt_ref TEXT NOT NULL,
  outcome_truth_projection_ref TEXT,
  selected_provider_ref TEXT,
  provider_key TEXT,
  selected_provider_display_name TEXT,
  transport_mode TEXT NOT NULL,
  dispatch_state TEXT NOT NULL,
  authoritative_proof_state TEXT NOT NULL,
  proof_risk_state TEXT NOT NULL,
  proof_deadline_at TIMESTAMPTZ NOT NULL,
  outcome_truth_state TEXT NOT NULL,
  no_outcome_window_breached BOOLEAN NOT NULL,
  continuity_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  review_debt_state TEXT NOT NULL,
  active_exception_classes JSONB NOT NULL,
  evidence_refs JSONB NOT NULL,
  severity TEXT NOT NULL,
  queue_age_minutes INTEGER NOT NULL,
  case_age_minutes INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_waiting_outcome_case
  ON phase6_pharmacy_dispatched_waiting_outcome_projection (pharmacy_case_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_waiting_outcome_provider
  ON phase6_pharmacy_dispatched_waiting_outcome_projection (provider_key, severity, queue_age_minutes DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_waiting_outcome_exceptions
  ON phase6_pharmacy_dispatched_waiting_outcome_projection USING GIN (active_exception_classes);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_bounce_back_projection (
  pharmacy_bounce_back_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  bounce_back_truth_projection_ref TEXT NOT NULL,
  bounce_back_record_ref TEXT NOT NULL,
  selected_provider_ref TEXT,
  provider_key TEXT,
  selected_provider_display_name TEXT,
  bounce_back_type TEXT NOT NULL,
  reopened_case_status TEXT NOT NULL,
  gp_action_required BOOLEAN NOT NULL,
  triage_reentry_state TEXT NOT NULL,
  urgent_return_state TEXT,
  reachability_repair_state TEXT,
  supervisor_review_state TEXT NOT NULL,
  loop_risk NUMERIC NOT NULL,
  reopen_priority_band INTEGER NOT NULL,
  continuity_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  review_debt_state TEXT NOT NULL,
  active_exception_classes JSONB NOT NULL,
  evidence_refs JSONB NOT NULL,
  severity TEXT NOT NULL,
  queue_age_minutes INTEGER NOT NULL,
  case_age_minutes INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_bounce_back_case
  ON phase6_pharmacy_bounce_back_projection (pharmacy_case_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_bounce_back_priority
  ON phase6_pharmacy_bounce_back_projection (reopen_priority_band DESC, severity, queue_age_minutes DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_dispatch_exception_projection (
  pharmacy_dispatch_exception_projection_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  selected_provider_ref TEXT,
  provider_key TEXT,
  selected_provider_display_name TEXT,
  primary_exception_class TEXT NOT NULL,
  active_exception_classes JSONB NOT NULL,
  exception_evidence JSONB NOT NULL,
  continuity_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  review_debt_state TEXT NOT NULL,
  severity TEXT NOT NULL,
  evidence_refs JSONB NOT NULL,
  queue_age_minutes INTEGER NOT NULL,
  case_age_minutes INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_exception_case
  ON phase6_pharmacy_dispatch_exception_projection (pharmacy_case_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_exception_class
  ON phase6_pharmacy_dispatch_exception_projection (primary_exception_class, severity, queue_age_minutes DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_dispatch_exception_classes
  ON phase6_pharmacy_dispatch_exception_projection USING GIN (active_exception_classes);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_provider_health_projection (
  pharmacy_provider_health_projection_id TEXT PRIMARY KEY,
  provider_key TEXT NOT NULL,
  latest_provider_ref TEXT,
  provider_display_name TEXT NOT NULL,
  discovery_availability_state TEXT NOT NULL,
  dispatch_health_state TEXT NOT NULL,
  continuity_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  review_debt_state TEXT NOT NULL,
  active_exception_classes JSONB NOT NULL,
  evidence_refs JSONB NOT NULL,
  active_case_count INTEGER NOT NULL,
  waiting_for_choice_count INTEGER NOT NULL,
  dispatch_failure_count INTEGER NOT NULL,
  acknowledgement_debt_count INTEGER NOT NULL,
  stale_proof_count INTEGER NOT NULL,
  unmatched_outcome_count INTEGER NOT NULL,
  conflicting_outcome_count INTEGER NOT NULL,
  reachability_repair_case_count INTEGER NOT NULL,
  consent_revoked_after_dispatch_count INTEGER NOT NULL,
  transport_summaries JSONB NOT NULL,
  last_good_evidence_at TIMESTAMPTZ,
  latest_evidence_at TIMESTAMPTZ,
  queue_age_minutes INTEGER NOT NULL,
  severity TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_provider_health_provider
  ON phase6_pharmacy_provider_health_projection (provider_key);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_provider_health_priority
  ON phase6_pharmacy_provider_health_projection (severity, queue_age_minutes DESC, provider_key);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_provider_health_exceptions
  ON phase6_pharmacy_provider_health_projection USING GIN (active_exception_classes);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_operations_audit_event (
  pharmacy_operations_audit_event_id TEXT PRIMARY KEY,
  scope_kind TEXT NOT NULL,
  scope_ref TEXT NOT NULL,
  projection_family TEXT NOT NULL,
  event_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  primary_exception_class TEXT,
  evidence_refs JSONB NOT NULL,
  payload_digest TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_operations_audit_scope
  ON phase6_pharmacy_operations_audit_event (scope_kind, scope_ref, recorded_at DESC);

CREATE OR REPLACE VIEW phase6_pharmacy_queue_counts_summary AS
SELECT
  'pharmacy_active_cases_projection'::TEXT AS worklist_family,
  COUNT(*)::INTEGER AS total_count,
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END)::INTEGER AS critical_count,
  SUM(CASE WHEN severity = 'urgent' THEN 1 ELSE 0 END)::INTEGER AS urgent_count,
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END)::INTEGER AS warning_count,
  MAX(queue_age_minutes)::INTEGER AS oldest_queue_age_minutes,
  AVG(queue_age_minutes)::NUMERIC AS average_queue_age_minutes
FROM phase6_pharmacy_active_cases_projection
UNION ALL
SELECT
  'pharmacy_waiting_for_choice_projection',
  COUNT(*),
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'urgent' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END),
  MAX(queue_age_minutes),
  AVG(queue_age_minutes)
FROM phase6_pharmacy_waiting_for_choice_projection
UNION ALL
SELECT
  'pharmacy_dispatched_waiting_outcome_projection',
  COUNT(*),
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'urgent' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END),
  MAX(queue_age_minutes),
  AVG(queue_age_minutes)
FROM phase6_pharmacy_dispatched_waiting_outcome_projection
UNION ALL
SELECT
  'pharmacy_bounce_back_projection',
  COUNT(*),
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'urgent' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END),
  MAX(queue_age_minutes),
  AVG(queue_age_minutes)
FROM phase6_pharmacy_bounce_back_projection
UNION ALL
SELECT
  'pharmacy_dispatch_exception_projection',
  COUNT(*),
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'urgent' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END),
  MAX(queue_age_minutes),
  AVG(queue_age_minutes)
FROM phase6_pharmacy_dispatch_exception_projection
UNION ALL
SELECT
  'pharmacy_provider_health_projection',
  COUNT(*),
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'urgent' THEN 1 ELSE 0 END),
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END),
  MAX(queue_age_minutes),
  AVG(queue_age_minutes)
FROM phase6_pharmacy_provider_health_projection;

CREATE OR REPLACE VIEW phase6_pharmacy_provider_health_summary AS
SELECT
  provider_key,
  provider_display_name,
  discovery_availability_state,
  dispatch_health_state,
  severity,
  active_case_count,
  dispatch_failure_count,
  acknowledgement_debt_count,
  stale_proof_count,
  unmatched_outcome_count,
  conflicting_outcome_count,
  latest_evidence_at,
  last_good_evidence_at
FROM phase6_pharmacy_provider_health_projection;

CREATE OR REPLACE VIEW phase6_pharmacy_exception_rollup_summary AS
SELECT
  primary_exception_class,
  COUNT(*)::INTEGER AS active_case_count,
  MAX(queue_age_minutes)::INTEGER AS oldest_queue_age_minutes
FROM phase6_pharmacy_dispatch_exception_projection
GROUP BY primary_exception_class;

COMMIT;
