BEGIN;

CREATE TABLE IF NOT EXISTS phase4_booking_intents (
  intent_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  source_triage_task_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  priority_band TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  modality TEXT NOT NULL,
  clinician_type TEXT NOT NULL,
  continuity_preference TEXT NOT NULL,
  access_needs TEXT NOT NULL,
  patient_preference_summary TEXT NOT NULL,
  created_from_decision_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  lease_ttl_seconds INTEGER NOT NULL CHECK (lease_ttl_seconds > 0),
  ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch > 0),
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL CHECK (current_lineage_fence_epoch > 0),
  intent_state TEXT NOT NULL CHECK (
    intent_state IN ('proposed', 'acknowledged', 'superseded', 'recovery_only')
  ),
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  lifecycle_closure_authority TEXT NOT NULL CHECK (
    lifecycle_closure_authority = 'LifecycleCoordinator'
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_booking_intents_lineage_case_link
  ON phase4_booking_intents (lineage_case_link_ref);

CREATE TABLE IF NOT EXISTS phase4_search_policies (
  policy_id TEXT PRIMARY KEY,
  timeframe_earliest TEXT NOT NULL,
  timeframe_latest TEXT NOT NULL,
  modality TEXT NOT NULL,
  clinician_type TEXT NOT NULL,
  continuity_preference TEXT NOT NULL,
  site_preference_json TEXT NOT NULL,
  accessibility_needs_json TEXT NOT NULL,
  max_travel_time INTEGER NOT NULL CHECK (max_travel_time > 0),
  bookability_policy TEXT NOT NULL,
  selection_audience TEXT NOT NULL CHECK (
    selection_audience IN ('patient_self_service', 'staff_assist')
  ),
  patient_channel_mode TEXT NOT NULL CHECK (
    patient_channel_mode IN ('signed_in_shell', 'embedded_nhs_app', 'staff_proxy')
  ),
  policy_bundle_hash TEXT NOT NULL,
  same_band_reorder_slack_minutes_by_window_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase4_booking_cases (
  booking_case_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL UNIQUE,
  origin_triage_task_ref TEXT NOT NULL,
  booking_intent_id TEXT NOT NULL UNIQUE REFERENCES phase4_booking_intents (intent_id),
  source_decision_epoch_ref TEXT NOT NULL,
  source_decision_supersession_ref TEXT,
  patient_ref TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider_context_json TEXT NOT NULL,
  active_capability_resolution_ref TEXT,
  active_capability_projection_ref TEXT,
  active_provider_adapter_binding_ref TEXT,
  status TEXT NOT NULL CHECK (
    status IN (
      'handoff_received',
      'capability_checked',
      'searching_local',
      'offers_ready',
      'selecting',
      'revalidating',
      'commit_pending',
      'booked',
      'confirmation_pending',
      'supplier_reconciliation_pending',
      'waitlisted',
      'fallback_to_hub',
      'callback_fallback',
      'booking_failed',
      'managed',
      'closed'
    )
  ),
  search_policy_ref TEXT REFERENCES phase4_search_policies (policy_id),
  current_offer_session_ref TEXT,
  selected_slot_ref TEXT,
  appointment_ref TEXT,
  latest_confirmation_truth_projection_ref TEXT,
  waitlist_entry_ref TEXT,
  active_waitlist_fallback_obligation_ref TEXT,
  latest_waitlist_continuation_truth_projection_ref TEXT,
  exception_ref TEXT,
  active_identity_repair_case_ref TEXT,
  identity_repair_branch_disposition_ref TEXT,
  identity_repair_release_settlement_ref TEXT,
  request_lifecycle_lease_ref TEXT NOT NULL,
  ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch > 0),
  stale_owner_recovery_ref TEXT,
  patient_shell_consistency_projection_ref TEXT,
  patient_embedded_session_projection_ref TEXT,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  route_freeze_disposition_ref TEXT,
  release_recovery_disposition_ref TEXT,
  closure_authority TEXT NOT NULL CHECK (closure_authority = 'LifecycleCoordinator'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_cases_request_lineage
  ON phase4_booking_cases (request_lineage_ref, status);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_cases_request_lease
  ON phase4_booking_cases (request_lifecycle_lease_ref, ownership_epoch);

CREATE TABLE IF NOT EXISTS phase4_booking_case_transition_journal (
  booking_case_transition_journal_entry_id TEXT PRIMARY KEY,
  booking_case_id TEXT NOT NULL REFERENCES phase4_booking_cases (booking_case_id),
  booking_intent_id TEXT NOT NULL REFERENCES phase4_booking_intents (intent_id),
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  next_status TEXT NOT NULL,
  transition_outcome TEXT NOT NULL CHECK (transition_outcome IN ('applied', 'rejected')),
  failure_code TEXT,
  actor_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  source_decision_epoch_ref TEXT NOT NULL,
  request_lifecycle_lease_ref TEXT NOT NULL,
  ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch > 0),
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL CHECK (current_lineage_fence_epoch > 0),
  transition_predicate_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  dependent_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_booking_case_transition_journal_version
  ON phase4_booking_case_transition_journal (booking_case_id, version);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_booking_case_transition_journal_action
  ON phase4_booking_case_transition_journal (booking_case_id, command_action_record_ref);

COMMIT;
