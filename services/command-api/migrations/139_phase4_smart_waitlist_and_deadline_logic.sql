PRAGMA foreign_keys = ON;

BEGIN;

CREATE TABLE IF NOT EXISTS phase4_waitlist_entries (
  waitlist_entry_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL REFERENCES phase4_booking_cases (booking_case_id),
  patient_ref TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  selection_audience TEXT NOT NULL CHECK (selection_audience IN ('patient', 'staff')),
  selected_anchor_ref TEXT NOT NULL,
  active_state TEXT NOT NULL CHECK (active_state IN ('active', 'paused', 'transferred', 'closed')),
  continuation_state TEXT NOT NULL CHECK (
    continuation_state IN (
      'waiting_local_supply',
      'offer_pending',
      'accepted_pending_confirmation',
      'fallback_pending',
      'callback_transferred',
      'hub_transferred',
      'booking_failed',
      'closed'
    )
  ),
  preference_envelope_json TEXT NOT NULL,
  eligibility_hash TEXT NOT NULL,
  indexed_eligibility_keys_json TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  priority_key TEXT NOT NULL,
  candidate_cursor TEXT NULL,
  active_offer_ref TEXT NULL,
  offer_history_refs_json TEXT NOT NULL,
  latest_deadline_evaluation_ref TEXT NOT NULL,
  active_fallback_obligation_ref TEXT NOT NULL,
  continuation_truth_projection_ref TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  safe_waitlist_until_at TEXT NOT NULL,
  expected_offer_service_minutes INTEGER NOT NULL CHECK (expected_offer_service_minutes > 0),
  response_window_minutes INTEGER NOT NULL CHECK (response_window_minutes > 0),
  last_evaluated_at TEXT NOT NULL,
  latest_allocation_batch_ref TEXT NULL,
  capability_resolution_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  authoritative_read_and_confirmation_policy_ref TEXT NOT NULL,
  reservation_semantics TEXT NOT NULL CHECK (
    reservation_semantics IN ('exclusive_hold', 'truthful_nonexclusive')
  ),
  rank_plan_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_waitlist_entries_case_current
  ON phase4_waitlist_entries (booking_case_ref, active_state, joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_entries_state_deadline
  ON phase4_waitlist_entries (active_state, continuation_state, safe_waitlist_until_at, deadline_at);

CREATE TABLE IF NOT EXISTS phase4_waitlist_entry_eligibility_keys (
  waitlist_entry_eligibility_key_id TEXT PRIMARY KEY,
  waitlist_entry_ref TEXT NOT NULL REFERENCES phase4_waitlist_entries (waitlist_entry_id),
  key_dimension TEXT NOT NULL CHECK (
    key_dimension IN ('modality', 'site', 'local_day', 'continuity')
  ),
  key_value TEXT NOT NULL,
  key_ordinal INTEGER NOT NULL CHECK (key_ordinal >= 1),
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_waitlist_entry_eligibility_unique
  ON phase4_waitlist_entry_eligibility_keys (waitlist_entry_ref, key_dimension, key_value);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_entry_eligibility_lookup
  ON phase4_waitlist_entry_eligibility_keys (key_dimension, key_value, waitlist_entry_ref);

CREATE TABLE IF NOT EXISTS phase4_waitlist_deadline_evaluations (
  waitlist_deadline_evaluation_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  waitlist_entry_ref TEXT NOT NULL REFERENCES phase4_waitlist_entries (waitlist_entry_id),
  booking_case_ref TEXT NOT NULL REFERENCES phase4_booking_cases (booking_case_id),
  rank_plan_version TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  expected_offer_service_minutes INTEGER NOT NULL CHECK (expected_offer_service_minutes > 0),
  safe_waitlist_until_at TEXT NOT NULL,
  working_minutes_remaining INTEGER NOT NULL,
  laxity_minutes INTEGER NOT NULL,
  deadline_class TEXT NOT NULL CHECK (deadline_class IN ('on_track', 'warn', 'critical', 'expired')),
  offerability_state TEXT NOT NULL CHECK (
    offerability_state IN ('waitlist_safe', 'at_risk', 'fallback_required', 'overdue')
  ),
  reason_code TEXT NOT NULL,
  deadline_warn_score REAL NOT NULL,
  deadline_late_score REAL NOT NULL,
  deadline_pressure REAL NOT NULL,
  wait_minutes REAL NOT NULL,
  age_lift REAL NOT NULL,
  fairness_debt REAL NOT NULL,
  cooldown REAL NOT NULL,
  evaluated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_deadline_evaluations_entry_time
  ON phase4_waitlist_deadline_evaluations (waitlist_entry_ref, evaluated_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_deadline_evaluations_offerability
  ON phase4_waitlist_deadline_evaluations (offerability_state, deadline_class, evaluated_at DESC);

CREATE TABLE IF NOT EXISTS phase4_waitlist_fallback_obligations (
  waitlist_fallback_obligation_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL REFERENCES phase4_booking_cases (booking_case_id),
  waitlist_entry_ref TEXT NOT NULL REFERENCES phase4_waitlist_entries (waitlist_entry_id),
  latest_deadline_evaluation_ref TEXT NOT NULL REFERENCES phase4_waitlist_deadline_evaluations (waitlist_deadline_evaluation_id),
  required_fallback_route TEXT NOT NULL CHECK (
    required_fallback_route IN ('stay_local_waitlist', 'callback', 'hub', 'booking_failed')
  ),
  trigger_class TEXT NOT NULL CHECK (
    trigger_class IN (
      'none',
      'no_safe_laxity',
      'no_eligible_supply',
      'offer_chain_exhausted',
      'stale_capacity_truth',
      'policy_cutoff'
    )
  ),
  transfer_state TEXT NOT NULL CHECK (
    transfer_state IN ('monitoring', 'armed', 'transfer_pending', 'transferred', 'satisfied', 'cancelled')
  ),
  callback_case_ref TEXT NULL,
  callback_expectation_envelope_ref TEXT NULL,
  hub_coordination_case_ref TEXT NULL,
  booking_failure_reason_code TEXT NULL,
  created_at TEXT NOT NULL,
  transferred_at TEXT NULL,
  cleared_at TEXT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_fallback_obligations_entry
  ON phase4_waitlist_fallback_obligations (waitlist_entry_ref, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_fallback_obligations_route_state
  ON phase4_waitlist_fallback_obligations (required_fallback_route, transfer_state, updated_at DESC);

CREATE TABLE IF NOT EXISTS phase4_waitlist_continuation_truth_projections (
  waitlist_continuation_truth_projection_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL REFERENCES phase4_booking_cases (booking_case_id),
  waitlist_entry_ref TEXT NOT NULL REFERENCES phase4_waitlist_entries (waitlist_entry_id),
  active_waitlist_offer_ref TEXT NULL,
  latest_deadline_evaluation_ref TEXT NOT NULL REFERENCES phase4_waitlist_deadline_evaluations (waitlist_deadline_evaluation_id),
  fallback_obligation_ref TEXT NOT NULL REFERENCES phase4_waitlist_fallback_obligations (waitlist_fallback_obligation_id),
  reservation_truth_projection_ref TEXT NULL REFERENCES reservation_truth_projections (reservation_truth_projection_id),
  selected_anchor_ref TEXT NOT NULL,
  patient_visible_state TEXT NOT NULL CHECK (
    patient_visible_state IN (
      'waiting_for_offer',
      'offer_available',
      'accepted_pending_booking',
      'callback_expected',
      'hub_review_pending',
      'expired',
      'closed'
    )
  ),
  window_risk_state TEXT NOT NULL CHECK (window_risk_state IN ('on_track', 'at_risk', 'fallback_due', 'overdue')),
  dominant_action_ref TEXT NOT NULL,
  fallback_action_ref TEXT NULL,
  next_evaluation_at TEXT NOT NULL,
  projection_freshness_envelope_ref TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_continuation_truth_case
  ON phase4_waitlist_continuation_truth_projections (booking_case_ref, generated_at DESC);

CREATE TABLE IF NOT EXISTS phase4_waitlist_allocation_batches (
  waitlist_allocation_batch_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  batching_horizon_seconds INTEGER NOT NULL CHECK (batching_horizon_seconds >= 0),
  released_capacity_unit_refs_json TEXT NOT NULL,
  released_slot_refs_json TEXT NOT NULL,
  assignment_tuple_hash TEXT NOT NULL,
  eligible_pair_count INTEGER NOT NULL CHECK (eligible_pair_count >= 0),
  assigned_pair_count INTEGER NOT NULL CHECK (assigned_pair_count >= 0),
  stable_pair_order_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_allocation_batches_created
  ON phase4_waitlist_allocation_batches (created_at DESC);

CREATE TABLE IF NOT EXISTS phase4_waitlist_offers (
  waitlist_offer_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  waitlist_entry_ref TEXT NOT NULL REFERENCES phase4_waitlist_entries (waitlist_entry_id),
  deadline_evaluation_ref TEXT NOT NULL REFERENCES phase4_waitlist_deadline_evaluations (waitlist_deadline_evaluation_id),
  fallback_obligation_ref TEXT NOT NULL REFERENCES phase4_waitlist_fallback_obligations (waitlist_fallback_obligation_id),
  continuation_fence_epoch INTEGER NOT NULL CHECK (continuation_fence_epoch >= 0),
  released_slot_ref TEXT NOT NULL,
  selected_normalized_slot_ref TEXT NOT NULL,
  selected_canonical_slot_identity_ref TEXT NOT NULL,
  source_slot_set_snapshot_ref TEXT NULL REFERENCES phase4_slot_set_snapshots (slot_set_snapshot_id),
  capacity_unit_ref TEXT NOT NULL,
  reservation_ref TEXT NOT NULL REFERENCES capacity_reservations (capacity_reservation_id),
  reservation_truth_projection_ref TEXT NOT NULL REFERENCES reservation_truth_projections (reservation_truth_projection_id),
  allocation_batch_ref TEXT NOT NULL REFERENCES phase4_waitlist_allocation_batches (waitlist_allocation_batch_id),
  truth_mode TEXT NOT NULL CHECK (truth_mode IN ('exclusive_hold', 'truthful_nonexclusive')),
  score_vector_json TEXT NOT NULL,
  offer_ordinal INTEGER NOT NULL CHECK (offer_ordinal >= 1),
  offer_state TEXT NOT NULL CHECK (
    offer_state IN ('sent', 'opened', 'accepted', 'expired', 'superseded', 'lost_race', 'commit_failed', 'closed')
  ),
  hold_state TEXT NOT NULL CHECK (
    hold_state IN ('none', 'soft_selected', 'held', 'pending_confirmation', 'confirmed', 'released', 'expired', 'disputed')
  ),
  offer_expiry_at TEXT NOT NULL,
  exclusive_until_at TEXT NULL,
  sent_at TEXT NOT NULL,
  opened_at TEXT NULL,
  responded_at TEXT NULL,
  selection_token TEXT NOT NULL,
  selection_proof_hash TEXT NOT NULL,
  superseded_by_ref TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_waitlist_offers_active_entry
  ON phase4_waitlist_offers (waitlist_entry_ref, offer_state, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_offers_capacity
  ON phase4_waitlist_offers (capacity_unit_ref, offer_state, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_offers_reservation
  ON phase4_waitlist_offers (reservation_ref, reservation_truth_projection_ref);

CREATE TABLE IF NOT EXISTS phase4_waitlist_transition_journal (
  waitlist_transition_journal_entry_id TEXT PRIMARY KEY,
  waitlist_entry_ref TEXT NOT NULL REFERENCES phase4_waitlist_entries (waitlist_entry_id),
  waitlist_offer_ref TEXT NULL REFERENCES phase4_waitlist_offers (waitlist_offer_id),
  action_scope TEXT NOT NULL CHECK (
    action_scope IN (
      'join',
      'refresh_deadline',
      'issue_offer',
      'accept_offer',
      'expire_offer',
      'supersede_offer',
      'pause',
      'close',
      'fallback_transfer',
      'commit_settlement'
    )
  ),
  previous_continuation_state TEXT NOT NULL CHECK (
    previous_continuation_state IN (
      'none',
      'waiting_local_supply',
      'offer_pending',
      'accepted_pending_confirmation',
      'fallback_pending',
      'callback_transferred',
      'hub_transferred',
      'booking_failed',
      'closed'
    )
  ),
  next_continuation_state TEXT NOT NULL CHECK (
    next_continuation_state IN (
      'waiting_local_supply',
      'offer_pending',
      'accepted_pending_confirmation',
      'fallback_pending',
      'callback_transferred',
      'hub_transferred',
      'booking_failed',
      'closed'
    )
  ),
  previous_visible_state TEXT NOT NULL CHECK (
    previous_visible_state IN (
      'none',
      'waiting_for_offer',
      'offer_available',
      'accepted_pending_booking',
      'callback_expected',
      'hub_review_pending',
      'expired',
      'closed'
    )
  ),
  next_visible_state TEXT NOT NULL CHECK (
    next_visible_state IN (
      'waiting_for_offer',
      'offer_available',
      'accepted_pending_booking',
      'callback_expected',
      'hub_review_pending',
      'expired',
      'closed'
    )
  ),
  reason_codes_json TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  payload_artifact_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase4_waitlist_transition_journal_entry_recorded
  ON phase4_waitlist_transition_journal (waitlist_entry_ref, recorded_at DESC);

COMMIT;
