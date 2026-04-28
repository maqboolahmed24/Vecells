BEGIN;

ALTER TABLE reservation_fence_records
  ADD COLUMN disputed_at TEXT NULL;

CREATE TABLE IF NOT EXISTS phase4_booking_reservation_scopes (
  booking_reservation_scope_id TEXT PRIMARY KEY,
  scope_family TEXT NOT NULL CHECK (scope_family IN ('offer_session', 'waitlist_offer')),
  scope_object_ref TEXT NOT NULL,
  booking_case_id TEXT NULL,
  source_domain TEXT NOT NULL,
  holder_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  selected_normalized_slot_ref TEXT NOT NULL,
  selected_canonical_slot_identity_ref TEXT NOT NULL,
  source_slot_set_snapshot_ref TEXT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  capability_resolution_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  authoritative_read_and_confirmation_policy_ref TEXT NOT NULL,
  reservation_semantics TEXT NOT NULL CHECK (
    reservation_semantics IN ('exclusive_hold', 'truthful_nonexclusive', 'degraded_manual_pending')
  ),
  selection_token TEXT NULL,
  selection_proof_hash TEXT NULL,
  governing_object_version_ref TEXT NULL,
  scope_tuple_hash TEXT NOT NULL,
  projection_freshness_envelope_ref TEXT NOT NULL,
  canonical_reservation_key TEXT NOT NULL,
  capacity_identity_ref TEXT NOT NULL,
  current_reservation_ref TEXT NOT NULL REFERENCES capacity_reservations (reservation_id),
  current_reservation_truth_projection_ref TEXT NOT NULL REFERENCES reservation_truth_projections (reservation_truth_projection_id),
  current_fence_ref TEXT NOT NULL REFERENCES reservation_fence_records (reservation_fence_record_id),
  current_reservation_version_ref TEXT NOT NULL,
  current_reservation_state TEXT NOT NULL,
  current_commit_mode TEXT NOT NULL,
  current_truth_basis_hash TEXT NOT NULL,
  current_truth_state TEXT NOT NULL,
  current_display_exclusivity_state TEXT NOT NULL,
  scope_state TEXT NOT NULL CHECK (scope_state IN ('active', 'released', 'expired', 'disputed')),
  expires_at TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_booking_reservation_scope_key
  ON phase4_booking_reservation_scopes(scope_family, scope_object_ref);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_reservation_scope_reservation_key
  ON phase4_booking_reservation_scopes(canonical_reservation_key, scope_state, updated_at);

CREATE TABLE IF NOT EXISTS phase4_booking_reservation_transition_journal (
  booking_reservation_journal_entry_id TEXT PRIMARY KEY,
  booking_reservation_scope_ref TEXT NOT NULL REFERENCES phase4_booking_reservation_scopes (booking_reservation_scope_id),
  scope_family TEXT NOT NULL CHECK (scope_family IN ('offer_session', 'waitlist_offer')),
  scope_object_ref TEXT NOT NULL,
  action TEXT NOT NULL CHECK (
    action IN (
      'soft_select',
      'acquire_hold',
      'refresh_hold',
      'mark_pending_confirmation',
      'mark_confirmed',
      'release',
      'expire',
      'dispute',
      'expire_sweep'
    )
  ),
  previous_reservation_state TEXT NOT NULL,
  next_reservation_state TEXT NOT NULL,
  previous_truth_state TEXT NOT NULL,
  next_truth_state TEXT NOT NULL,
  reservation_ref TEXT NOT NULL REFERENCES capacity_reservations (reservation_id),
  reservation_truth_projection_ref TEXT NOT NULL REFERENCES reservation_truth_projections (reservation_truth_projection_id),
  reservation_fence_ref TEXT NOT NULL REFERENCES reservation_fence_records (reservation_fence_record_id),
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  payload_artifact_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_reservation_journal_scope
  ON phase4_booking_reservation_transition_journal(booking_reservation_scope_ref, version);

CREATE TABLE IF NOT EXISTS phase4_booking_reservation_replays (
  replay_key TEXT PRIMARY KEY,
  scope_ref TEXT NULL REFERENCES phase4_booking_reservation_scopes (booking_reservation_scope_id),
  journal_entry_ref TEXT NULL REFERENCES phase4_booking_reservation_transition_journal (booking_reservation_journal_entry_id),
  reservation_ref TEXT NULL REFERENCES capacity_reservations (reservation_id),
  projection_ref TEXT NULL REFERENCES reservation_truth_projections (reservation_truth_projection_id),
  fence_ref TEXT NULL REFERENCES reservation_fence_records (reservation_fence_record_id),
  conflict_blocked INTEGER NOT NULL DEFAULT 0,
  blocking_fence_ref TEXT NULL REFERENCES reservation_fence_records (reservation_fence_record_id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
