BEGIN;

-- HubCoordinationCase relies on the existing foundation lineage and command-settlement
-- migrations for LineageCaseLink, RequestLifecycleLease, CommandActionRecord, and
-- CommandSettlementRecord. This migration adds the Phase 5 bounded-context tables only.

CREATE TABLE IF NOT EXISTS phase5_network_booking_requests (
  network_booking_request_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  origin_lineage_case_link_ref TEXT NOT NULL,
  origin_booking_case_id TEXT NOT NULL,
  origin_request_id TEXT NOT NULL,
  origin_practice_ods TEXT NOT NULL,
  patient_ref TEXT NOT NULL,
  priority_band TEXT NOT NULL CHECK (
    priority_band IN ('routine', 'priority', 'urgent', 'same_day', 'safety_escalation')
  ),
  clinical_timeframe_json TEXT NOT NULL,
  modality_preference_json TEXT NOT NULL,
  clinician_type TEXT NOT NULL,
  continuity_preference_json TEXT NOT NULL,
  access_needs_json TEXT NOT NULL,
  travel_constraints_json TEXT NOT NULL,
  reason_for_hub_routing TEXT NOT NULL CHECK (
    reason_for_hub_routing IN (
      'policy_required',
      'no_local_capacity',
      'waitlist_breach_risk',
      'patient_requested_network',
      'supervisor_return',
      'callback_reentry'
    )
  ),
  requested_at TEXT NOT NULL,
  creation_mode TEXT NOT NULL CHECK (
    creation_mode IN ('phase4_fallback', 'governed_routing')
  ),
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase5_network_booking_requests_origin_branch
  ON phase5_network_booking_requests (
    request_lineage_ref,
    origin_booking_case_id,
    origin_lineage_case_link_ref
  );

CREATE TABLE IF NOT EXISTS phase5_hub_coordination_cases (
  hub_coordination_case_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL UNIQUE,
  parent_lineage_case_link_ref TEXT NOT NULL,
  network_booking_request_id TEXT NOT NULL UNIQUE REFERENCES phase5_network_booking_requests (network_booking_request_id),
  serving_pcn_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'hub_requested',
      'intake_validated',
      'queued',
      'claimed',
      'candidate_searching',
      'candidates_ready',
      'coordinator_selecting',
      'candidate_revalidating',
      'native_booking_pending',
      'confirmation_pending',
      'booked_pending_practice_ack',
      'booked',
      'closed',
      'alternatives_offered',
      'patient_choice_pending',
      'callback_transfer_pending',
      'callback_offered',
      'escalated_back'
    )
  ),
  owner_state TEXT NOT NULL CHECK (
    owner_state IN (
      'unclaimed',
      'claimed_active',
      'release_pending',
      'transfer_pending',
      'supervisor_override',
      'stale_owner_recovery'
    )
  ),
  claimed_by TEXT,
  acting_org_json TEXT,
  ownership_lease_ref TEXT,
  active_ownership_transition_ref TEXT,
  ownership_fence_token TEXT,
  ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 0),
  compiled_policy_bundle_ref TEXT,
  enhanced_access_policy_ref TEXT,
  policy_evaluation_ref TEXT,
  policy_tuple_hash TEXT,
  candidate_snapshot_ref TEXT,
  cross_site_decision_plan_ref TEXT,
  active_alternative_offer_session_ref TEXT,
  active_offer_optimisation_plan_ref TEXT,
  latest_offer_regeneration_settlement_ref TEXT,
  selected_candidate_ref TEXT,
  booking_evidence_ref TEXT,
  network_appointment_ref TEXT,
  offer_to_confirmation_truth_ref TEXT,
  active_fallback_ref TEXT,
  callback_expectation_ref TEXT,
  active_identity_repair_case_ref TEXT,
  identity_repair_branch_disposition_ref TEXT,
  identity_repair_release_settlement_ref TEXT,
  external_confirmation_state TEXT NOT NULL CHECK (
    external_confirmation_state IN (
      'not_started',
      'pending',
      'confirmed',
      'disputed',
      'expired',
      'recovery_required'
    )
  ),
  practice_ack_generation INTEGER NOT NULL CHECK (practice_ack_generation >= 0),
  practice_ack_due_at TEXT,
  open_case_blocker_refs_json TEXT NOT NULL,
  last_progress_at TEXT,
  sla_target_at TEXT,
  queue_entered_at TEXT,
  last_material_return_at TEXT,
  expected_coordination_minutes INTEGER NOT NULL CHECK (expected_coordination_minutes >= 0),
  urgency_carry REAL NOT NULL CHECK (urgency_carry >= 0 AND urgency_carry <= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_coordination_cases_queue
  ON phase5_hub_coordination_cases (status, owner_state, queue_entered_at);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_coordination_cases_lineage
  ON phase5_hub_coordination_cases (request_lineage_ref, parent_lineage_case_link_ref);

CREATE TABLE IF NOT EXISTS phase5_hub_case_transition_journal (
  hub_case_transition_journal_entry_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  network_booking_request_id TEXT NOT NULL REFERENCES phase5_network_booking_requests (network_booking_request_id),
  lineage_case_link_ref TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  next_status TEXT NOT NULL,
  previous_owner_state TEXT NOT NULL,
  next_owner_state TEXT NOT NULL,
  transition_outcome TEXT NOT NULL CHECK (transition_outcome IN ('applied', 'rejected')),
  failure_code TEXT,
  actor_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  expected_ownership_epoch INTEGER,
  expected_ownership_fence_token TEXT,
  current_lineage_fence_epoch INTEGER,
  transition_predicate_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  dependent_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase5_hub_case_transition_action
  ON phase5_hub_case_transition_journal (hub_coordination_case_id, command_action_record_ref);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase5_hub_case_transition_version
  ON phase5_hub_case_transition_journal (hub_coordination_case_id, version);

CREATE TABLE IF NOT EXISTS phase5_hub_event_journal (
  hub_event_journal_entry_id TEXT PRIMARY KEY,
  aggregate_kind TEXT NOT NULL CHECK (aggregate_kind IN ('network_request', 'hub_case')),
  aggregate_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase5_hub_event_journal_version
  ON phase5_hub_event_journal (aggregate_id, version);

COMMIT;
