-- Phase 2 wrong-patient identity repair signal, freeze, branch, and release chain.
-- The request/episode workflow is not used as repair state; authoritative posture lives here.

CREATE TABLE IF NOT EXISTS phase2_identity_repair_signals (
  repair_signal_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  signal_digest TEXT NOT NULL UNIQUE,
  episode_id TEXT NOT NULL,
  affected_request_ref TEXT NOT NULL,
  observed_identity_binding_ref TEXT NOT NULL,
  frozen_identity_binding_ref TEXT NOT NULL,
  observed_session_ref TEXT,
  observed_access_grant_ref TEXT,
  observed_route_intent_binding_ref TEXT,
  signal_class TEXT NOT NULL,
  signal_disposition TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  opened_repair_case_ref TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_identity_repair_cases (
  repair_case_id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  affected_request_refs_json TEXT NOT NULL,
  opened_signal_refs_json TEXT NOT NULL,
  frozen_identity_binding_ref TEXT NOT NULL,
  frozen_subject_ref TEXT,
  frozen_patient_ref TEXT,
  suspected_wrong_binding_ref TEXT,
  repair_basis TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  case_state TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  supervisor_approval_ref TEXT,
  independent_review_ref TEXT,
  freeze_record_ref TEXT,
  projection_rebuild_ref TEXT,
  downstream_disposition_refs_json TEXT NOT NULL,
  compensation_refs_json TEXT NOT NULL,
  release_settlement_ref TEXT,
  binding_authority_settlement_ref TEXT,
  resulting_identity_binding_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_repair_active_case_by_frozen_binding
  ON phase2_identity_repair_cases (frozen_identity_binding_ref)
  WHERE case_state <> 'closed';

CREATE TABLE IF NOT EXISTS phase2_identity_repair_freeze_records (
  freeze_record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  identity_repair_case_ref TEXT NOT NULL UNIQUE,
  frozen_identity_binding_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  lineage_fence_ref TEXT NOT NULL,
  issued_for TEXT NOT NULL CHECK (issued_for = 'identity_repair'),
  session_termination_settlement_refs_json TEXT NOT NULL,
  access_grant_supersession_refs_json TEXT NOT NULL,
  superseded_route_intent_binding_refs_json TEXT NOT NULL,
  communications_hold_ref TEXT NOT NULL,
  communications_hold_state TEXT NOT NULL,
  projection_hold_state TEXT NOT NULL,
  patient_identity_hold_projection_ref TEXT NOT NULL,
  patient_action_recovery_projection_ref TEXT NOT NULL,
  affected_audience_refs_json TEXT NOT NULL,
  branch_disposition_refs_json TEXT NOT NULL,
  freeze_state TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  activated_at TEXT NOT NULL,
  released_at TEXT,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_identity_repair_branch_dispositions (
  branch_disposition_id TEXT PRIMARY KEY,
  identity_repair_case_ref TEXT NOT NULL,
  freeze_record_ref TEXT NOT NULL,
  branch_type TEXT NOT NULL,
  branch_ref TEXT NOT NULL,
  branch_state TEXT NOT NULL,
  required_disposition TEXT NOT NULL,
  external_side_effect_ref TEXT,
  route_intent_binding_ref TEXT,
  patient_visible_ref TEXT,
  compensation_ref TEXT,
  reviewed_by TEXT,
  reason_codes_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator'),
  UNIQUE (identity_repair_case_ref, branch_type, branch_ref)
);

CREATE TABLE IF NOT EXISTS phase2_identity_repair_review_approvals (
  review_approval_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  identity_repair_case_ref TEXT NOT NULL UNIQUE,
  freeze_record_ref TEXT NOT NULL,
  supervisor_approval_ref TEXT NOT NULL,
  independent_review_ref TEXT NOT NULL,
  reviewed_correction_plan_ref TEXT NOT NULL,
  approved_by_supervisor TEXT NOT NULL,
  approved_by_independent_reviewer TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_identity_repair_authority_corrections (
  authority_correction_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  identity_repair_case_ref TEXT NOT NULL UNIQUE,
  freeze_record_ref TEXT NOT NULL,
  correction_mode TEXT NOT NULL CHECK (correction_mode IN ('correction_applied', 'revoked')),
  expected_frozen_identity_binding_ref TEXT NOT NULL,
  binding_authority_settlement_ref TEXT,
  resulting_identity_binding_ref TEXT,
  decision TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_identity_repair_release_settlements (
  release_settlement_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  identity_repair_case_ref TEXT NOT NULL UNIQUE,
  freeze_record_ref TEXT NOT NULL,
  release_mode TEXT NOT NULL,
  supervisor_approval_ref TEXT NOT NULL,
  independent_review_ref TEXT NOT NULL,
  binding_authority_settlement_ref TEXT NOT NULL,
  resulting_identity_binding_ref TEXT,
  branch_disposition_refs_json TEXT NOT NULL,
  communications_release_ref TEXT NOT NULL,
  projection_rebuild_ref TEXT NOT NULL,
  fresh_session_allowed INTEGER NOT NULL,
  fresh_access_grant_allowed INTEGER NOT NULL,
  fresh_route_intent_allowed INTEGER NOT NULL,
  settled_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_identity_repair_hold_projections (
  projection_ref TEXT PRIMARY KEY,
  identity_repair_case_ref TEXT NOT NULL,
  frozen_identity_binding_ref TEXT NOT NULL,
  freeze_record_ref TEXT,
  lineage_fence_ref TEXT,
  projection_kind TEXT NOT NULL,
  projection_mode TEXT NOT NULL,
  safe_summary TEXT NOT NULL,
  hidden_phi_detail INTEGER NOT NULL,
  read_only INTEGER NOT NULL,
  recovery_only INTEGER NOT NULL,
  allowed_actions_json TEXT NOT NULL,
  blocked_actions_json TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_identity_repair_events (
  event_ref TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  identity_repair_case_ref TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')
);
