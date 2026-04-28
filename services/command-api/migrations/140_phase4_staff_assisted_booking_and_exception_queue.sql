BEGIN;

CREATE TABLE IF NOT EXISTS phase4_assisted_booking_sessions (
  assisted_booking_session_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_id TEXT NOT NULL,
  task_ref TEXT NOT NULL,
  workspace_ref TEXT NOT NULL,
  staff_user_ref TEXT NOT NULL,
  mode TEXT NOT NULL,
  session_state TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL,
  current_snapshot_ref TEXT,
  current_offer_session_ref TEXT,
  current_reservation_scope_ref TEXT,
  selected_slot_ref TEXT,
  compare_anchor_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  capability_resolution_ref TEXT NOT NULL,
  capability_projection_ref TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  adapter_contract_profile_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  staff_workspace_consistency_projection_ref TEXT NOT NULL,
  workspace_slice_trust_projection_ref TEXT NOT NULL,
  review_action_lease_ref TEXT NOT NULL,
  focus_protection_lease_ref TEXT,
  work_protection_lease_ref TEXT,
  protected_composition_state_ref TEXT,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  task_completion_settlement_envelope_ref TEXT NOT NULL,
  request_lifecycle_lease_ref TEXT NOT NULL,
  request_ownership_epoch_ref INTEGER NOT NULL,
  current_confirmation_truth_projection_ref TEXT,
  current_waitlist_entry_ref TEXT,
  current_fallback_obligation_ref TEXT,
  stale_owner_recovery_ref TEXT,
  blocked_reason_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase4_assisted_booking_sessions_case_idx
  ON phase4_assisted_booking_sessions (booking_case_id);

CREATE INDEX IF NOT EXISTS phase4_assisted_booking_sessions_task_idx
  ON phase4_assisted_booking_sessions (task_ref, last_activity_at DESC);

CREATE TABLE IF NOT EXISTS phase4_booking_exception_queue_entries (
  booking_exception_queue_entry_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL,
  task_ref TEXT NOT NULL,
  assisted_booking_session_ref TEXT,
  queue_key TEXT NOT NULL,
  exception_family TEXT NOT NULL,
  severity TEXT NOT NULL,
  entry_state TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  current_snapshot_ref TEXT,
  provider_adapter_binding_ref TEXT,
  provider_adapter_binding_hash TEXT,
  capability_resolution_ref TEXT,
  capability_tuple_hash TEXT,
  staff_workspace_consistency_projection_ref TEXT,
  workspace_slice_trust_projection_ref TEXT,
  review_action_lease_ref TEXT,
  surface_route_contract_ref TEXT,
  surface_publication_ref TEXT,
  runtime_publication_bundle_ref TEXT,
  task_completion_settlement_envelope_ref TEXT,
  request_lifecycle_lease_ref TEXT,
  request_ownership_epoch_ref INTEGER,
  stale_owner_recovery_ref TEXT,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  operator_visible_diagnostic_ref TEXT,
  same_shell_recovery_route_ref TEXT,
  claimed_by_ref TEXT,
  claimed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  observed_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS phase4_booking_exception_queue_case_state_idx
  ON phase4_booking_exception_queue_entries (booking_case_ref, entry_state, observed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS phase4_booking_exception_queue_case_family_open_idx
  ON phase4_booking_exception_queue_entries (booking_case_ref, exception_family, entry_state)
  WHERE entry_state IN ('open', 'claimed');

CREATE INDEX IF NOT EXISTS phase4_booking_exception_queue_task_state_idx
  ON phase4_booking_exception_queue_entries (task_ref, entry_state, severity, updated_at DESC);

COMMIT;
