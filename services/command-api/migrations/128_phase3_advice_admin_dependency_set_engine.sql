-- 128_phase3_advice_admin_dependency_set_engine.sql
-- Phase 3 self-care and bounded-admin dependency-set and reopen-evaluation persistence contract.

CREATE TABLE IF NOT EXISTS phase3_advice_admin_dependency_sets (
  advice_admin_dependency_set_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  lineage_fence_epoch INTEGER NOT NULL,
  admin_resolution_subtype_ref TEXT,
  advice_render_settlement_ref TEXT,
  admin_resolution_case_ref TEXT,
  reachability_dependency_ref TEXT,
  contact_repair_journey_ref TEXT,
  reachability_epoch INTEGER,
  delivery_dispute_ref TEXT,
  consent_checkpoint_ref TEXT,
  identity_repair_case_ref TEXT,
  identity_blocking_version_ref TEXT,
  external_dependency_ref TEXT,
  external_dependency_version_ref TEXT,
  active_blocker_refs_json TEXT NOT NULL,
  dominant_blocker_ref TEXT,
  dominant_recovery_route_ref TEXT,
  reason_code_refs_json TEXT NOT NULL,
  reopen_trigger_refs_json TEXT NOT NULL,
  clinical_reentry_trigger_refs_json TEXT NOT NULL,
  dependency_state TEXT NOT NULL,
  reopen_state TEXT NOT NULL,
  evaluation_digest TEXT NOT NULL,
  evaluation_trigger_ref TEXT,
  evaluated_by_ref TEXT NOT NULL,
  supersedes_advice_admin_dependency_set_ref TEXT,
  evaluated_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_admin_dependency_sets_task_evaluated
  ON phase3_advice_admin_dependency_sets (task_id, evaluated_at);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_admin_dependency_sets_request_boundary
  ON phase3_advice_admin_dependency_sets (request_ref, boundary_decision_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_admin_dependency_sets_tuple_epoch
  ON phase3_advice_admin_dependency_sets (boundary_tuple_hash, decision_epoch_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_admin_dependency_sets_dependency_reopen
  ON phase3_advice_admin_dependency_sets (dependency_state, reopen_state);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_admin_dependency_sets_blocker_route
  ON phase3_advice_admin_dependency_sets (dominant_blocker_ref, dominant_recovery_route_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_admin_dependency_sets_digest
  ON phase3_advice_admin_dependency_sets (evaluation_digest, evaluated_at);
