-- 153_phase5_hub_background_integrity_workers.sql
-- Depends on:
--   149_phase5_hub_commit_engine.sql
--   150_phase5_practice_continuity_chain.sql
--   151_phase5_hub_fallback_workflows.sql
--   152_phase5_network_reminders_manage_visibility.sql

BEGIN;

CREATE TABLE IF NOT EXISTS phase5_hub_reconciliation_work_leases (
  hub_reconciliation_work_lease_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL,
  commit_attempt_id TEXT NOT NULL,
  reconciliation_record_ref TEXT NOT NULL,
  worker_ref TEXT NOT NULL,
  worker_run_ref TEXT NOT NULL,
  lease_state TEXT NOT NULL,
  lease_fence_token TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ NULL,
  outcome_state TEXT NOT NULL,
  outcome_reason_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  resulting_commit_attempt_ref TEXT NULL,
  resulting_appointment_ref TEXT NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase5_hub_reconciliation_work_leases_attempt_idx
  ON phase5_hub_reconciliation_work_leases (commit_attempt_id);

CREATE INDEX IF NOT EXISTS phase5_hub_reconciliation_work_leases_case_idx
  ON phase5_hub_reconciliation_work_leases (hub_coordination_case_id, claimed_at DESC);

CREATE TABLE IF NOT EXISTS phase5_hub_imported_confirmation_correlations (
  hub_imported_confirmation_correlation_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  imported_evidence_ref TEXT NOT NULL,
  supplier_correlation_key TEXT NULL,
  supplier_booking_reference TEXT NOT NULL,
  matched_commit_attempt_ref TEXT NULL,
  matched_appointment_ref TEXT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  truth_tuple_hash TEXT NOT NULL,
  correlation_state TEXT NOT NULL,
  result_commit_attempt_ref TEXT NULL,
  result_appointment_ref TEXT NULL,
  reason_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase5_hub_imported_confirmation_correlations_dedupe_idx
  ON phase5_hub_imported_confirmation_correlations (dedupe_key);

CREATE INDEX IF NOT EXISTS phase5_hub_imported_confirmation_correlations_case_idx
  ON phase5_hub_imported_confirmation_correlations (hub_coordination_case_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase5_hub_supplier_observations (
  hub_supplier_observation_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL,
  hub_appointment_id TEXT NOT NULL,
  payload_id TEXT NOT NULL,
  supplier_version TEXT NOT NULL,
  observed_status TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  observation_disposition TEXT NOT NULL,
  confidence_band TEXT NOT NULL,
  previous_mirror_revision INTEGER NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase5_hub_supplier_observations_payload_idx
  ON phase5_hub_supplier_observations (payload_id);

CREATE INDEX IF NOT EXISTS phase5_hub_supplier_observations_appointment_idx
  ON phase5_hub_supplier_observations (hub_appointment_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase5_hub_supplier_mirror_checkpoints (
  hub_supplier_mirror_checkpoint_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL,
  hub_appointment_id TEXT NOT NULL,
  hub_supplier_mirror_state_id TEXT NOT NULL,
  supplier_observation_ref TEXT NOT NULL,
  drift_state TEXT NOT NULL,
  manage_freeze_state TEXT NOT NULL,
  truth_tuple_hash TEXT NOT NULL,
  continuity_refresh_required BOOLEAN NOT NULL,
  visibility_debt_reopened BOOLEAN NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS phase5_hub_supplier_mirror_checkpoints_appointment_idx
  ON phase5_hub_supplier_mirror_checkpoints (hub_appointment_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase5_hub_exception_work_items (
  hub_exception_work_item_id TEXT PRIMARY KEY,
  exception_ref TEXT NOT NULL,
  hub_coordination_case_id TEXT NOT NULL,
  exception_class TEXT NOT NULL,
  work_state TEXT NOT NULL,
  retry_count INTEGER NOT NULL,
  retry_after_at TIMESTAMPTZ NULL,
  next_escalation_at TIMESTAMPTZ NULL,
  worker_ref TEXT NULL,
  worker_run_ref TEXT NULL,
  lease_fence_token TEXT NULL,
  lease_state TEXT NOT NULL,
  lease_expires_at TIMESTAMPTZ NULL,
  last_audit_row_ref TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase5_hub_exception_work_items_exception_idx
  ON phase5_hub_exception_work_items (exception_ref);

CREATE INDEX IF NOT EXISTS phase5_hub_exception_work_items_case_idx
  ON phase5_hub_exception_work_items (hub_coordination_case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS phase5_hub_exception_audit_rows (
  hub_exception_audit_row_id TEXT PRIMARY KEY,
  exception_work_item_ref TEXT NOT NULL,
  exception_ref TEXT NOT NULL,
  hub_coordination_case_id TEXT NOT NULL,
  action_kind TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS phase5_hub_exception_audit_rows_work_item_idx
  ON phase5_hub_exception_audit_rows (exception_work_item_ref, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase5_hub_projection_backfill_cursors (
  hub_projection_backfill_cursor_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL,
  cursor_state TEXT NOT NULL,
  last_verdict TEXT NOT NULL,
  last_truth_tuple_hash TEXT NULL,
  last_projection_ref TEXT NULL,
  ambiguity_reason_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  worker_ref TEXT NOT NULL,
  worker_run_ref TEXT NOT NULL,
  lease_fence_token TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase5_hub_projection_backfill_cursors_case_idx
  ON phase5_hub_projection_backfill_cursors (hub_coordination_case_id);

COMMIT;
