BEGIN;

CREATE TABLE IF NOT EXISTS phase4_booking_transactions (
  booking_transaction_id TEXT PRIMARY KEY,
  booking_case_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  snapshot_id TEXT NOT NULL REFERENCES phase4_slot_set_snapshots (slot_set_snapshot_id),
  offer_session_ref TEXT NOT NULL REFERENCES phase4_offer_sessions (offer_session_id),
  source_decision_epoch_ref TEXT NOT NULL,
  source_decision_supersession_ref TEXT NULL,
  selected_slot_ref TEXT NOT NULL,
  canonical_reservation_key TEXT NOT NULL,
  selected_candidate_hash TEXT NOT NULL,
  selection_proof_hash TEXT NOT NULL,
  policy_bundle_hash TEXT NOT NULL,
  capability_resolution_ref TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  adapter_contract_profile_ref TEXT NOT NULL,
  authoritative_read_and_confirmation_policy_ref TEXT NOT NULL,
  authoritative_read_mode TEXT NOT NULL CHECK (
    authoritative_read_mode IN ('durable_provider_reference', 'read_after_write', 'gate_required')
  ),
  allowed_authoritative_proof_classes_json TEXT NOT NULL,
  supports_async_commit_confirmation INTEGER NOT NULL DEFAULT 0,
  supports_dispute_recovery INTEGER NOT NULL DEFAULT 0,
  manage_exposure_before_proof TEXT NOT NULL CHECK (
    manage_exposure_before_proof IN ('hidden', 'summary_only')
  ),
  patient_visibility_before_proof TEXT NOT NULL CHECK (
    patient_visibility_before_proof IN ('provisional_receipt', 'summary_only')
  ),
  capability_tuple_hash TEXT NOT NULL,
  reservation_truth_projection_ref TEXT NULL REFERENCES reservation_truth_projections (reservation_truth_projection_id),
  confirmation_truth_projection_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  preflight_version TEXT NOT NULL,
  reservation_version INTEGER NOT NULL,
  reservation_version_ref TEXT NOT NULL,
  supplier_observed_at TEXT NULL,
  revalidation_proof_hash TEXT NOT NULL,
  request_lifecycle_lease_ref TEXT NOT NULL,
  request_ownership_epoch_ref INTEGER NOT NULL,
  review_action_lease_ref TEXT NULL,
  fencing_token TEXT NOT NULL,
  dispatch_effect_key_ref TEXT NOT NULL,
  dispatch_attempt_ref TEXT NULL REFERENCES adapter_dispatch_attempts (adapter_dispatch_attempt_id),
  latest_receipt_checkpoint_ref TEXT NULL REFERENCES adapter_receipt_checkpoints (receipt_checkpoint_id),
  external_confirmation_gate_ref TEXT NULL REFERENCES external_confirmation_gates (external_confirmation_gate_id),
  appointment_record_ref TEXT NULL,
  booking_exception_ref TEXT NULL,
  commit_attempt INTEGER NOT NULL DEFAULT 1,
  revalidation_state TEXT NOT NULL CHECK (
    revalidation_state IN ('pending', 'passed', 'failed', 'superseded')
  ),
  hold_state TEXT NOT NULL CHECK (
    hold_state IN ('none', 'soft_selected', 'held', 'pending_confirmation', 'confirmed', 'released', 'expired', 'disputed')
  ),
  commit_state TEXT NOT NULL CHECK (
    commit_state IN (
      'created',
      'preflight_failed',
      'ready_to_dispatch',
      'dispatch_pending',
      'accepted_for_processing',
      'confirmation_pending',
      'reconciliation_required',
      'confirmed',
      'failed',
      'expired',
      'superseded'
    )
  ),
  confirmation_state TEXT NOT NULL CHECK (
    confirmation_state IN ('booking_in_progress', 'confirmation_pending', 'reconciliation_required', 'confirmed', 'failed', 'expired', 'superseded')
  ),
  local_ack_state TEXT NOT NULL CHECK (local_ack_state IN ('none', 'shown', 'superseded')),
  processing_acceptance_state TEXT NOT NULL CHECK (
    processing_acceptance_state IN (
      'not_started',
      'accepted_for_processing',
      'awaiting_external_confirmation',
      'externally_accepted',
      'externally_rejected',
      'timed_out'
    )
  ),
  external_observation_state TEXT NOT NULL CHECK (
    external_observation_state IN ('unobserved', 'provider_reference_seen', 'read_after_write_seen', 'disputed', 'failed', 'expired')
  ),
  authoritative_outcome_state TEXT NOT NULL CHECK (
    authoritative_outcome_state IN ('pending', 'confirmation_pending', 'reconciliation_required', 'booked', 'failed', 'expired', 'superseded')
  ),
  settlement_revision INTEGER NOT NULL DEFAULT 1,
  provider_reference TEXT NULL,
  authoritative_proof_class TEXT NOT NULL CHECK (
    authoritative_proof_class IN ('none', 'durable_provider_reference', 'same_commit_read_after_write', 'reconciled_confirmation')
  ),
  blocker_reason_codes_json TEXT NOT NULL,
  guarded_recheck_reason_codes_json TEXT NOT NULL,
  reconciliation_reason_codes_json TEXT NOT NULL,
  compensation_reason_codes_json TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  payload_artifact_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NULL,
  transition_envelope_ref TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_booking_transactions_idempotency
  ON phase4_booking_transactions (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_transactions_case_current
  ON phase4_booking_transactions (booking_case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_transactions_dispatch
  ON phase4_booking_transactions (dispatch_effect_key_ref, authoritative_outcome_state, updated_at);

CREATE TABLE IF NOT EXISTS phase4_booking_confirmation_truth_projections (
  booking_confirmation_truth_projection_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL,
  booking_transaction_ref TEXT NOT NULL REFERENCES phase4_booking_transactions (booking_transaction_id),
  selected_slot_ref TEXT NOT NULL,
  appointment_record_ref TEXT NULL,
  external_confirmation_gate_ref TEXT NULL REFERENCES external_confirmation_gates (external_confirmation_gate_id),
  latest_receipt_checkpoint_ref TEXT NULL REFERENCES adapter_receipt_checkpoints (receipt_checkpoint_id),
  provider_reference TEXT NULL,
  authoritative_proof_class TEXT NOT NULL CHECK (
    authoritative_proof_class IN ('none', 'durable_provider_reference', 'same_commit_read_after_write', 'reconciled_confirmation')
  ),
  confirmation_truth_state TEXT NOT NULL CHECK (
    confirmation_truth_state IN ('booking_in_progress', 'confirmation_pending', 'reconciliation_required', 'confirmed', 'failed', 'expired', 'superseded')
  ),
  patient_visibility_state TEXT NOT NULL CHECK (
    patient_visibility_state IN ('selected_slot_pending', 'provisional_receipt', 'booked_summary', 'recovery_required')
  ),
  manage_exposure_state TEXT NOT NULL CHECK (manage_exposure_state IN ('hidden', 'summary_only', 'writable')),
  artifact_exposure_state TEXT NOT NULL CHECK (artifact_exposure_state IN ('hidden', 'summary_only', 'handoff_ready')),
  reminder_exposure_state TEXT NOT NULL CHECK (reminder_exposure_state IN ('blocked', 'pending_schedule', 'scheduled')),
  command_settlement_record_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  truth_basis_hash TEXT NOT NULL,
  projection_freshness_envelope_ref TEXT NOT NULL,
  settlement_revision INTEGER NOT NULL,
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_confirmation_truth_case
  ON phase4_booking_confirmation_truth_projections (booking_case_ref, generated_at DESC);

CREATE TABLE IF NOT EXISTS phase4_appointment_records (
  appointment_record_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL,
  booking_transaction_ref TEXT NOT NULL REFERENCES phase4_booking_transactions (booking_transaction_id),
  selected_slot_ref TEXT NOT NULL,
  canonical_reservation_key TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_reference TEXT NULL,
  authoritative_proof_class TEXT NOT NULL CHECK (
    authoritative_proof_class IN ('durable_provider_reference', 'same_commit_read_after_write', 'reconciled_confirmation')
  ),
  appointment_status TEXT NOT NULL CHECK (appointment_status IN ('booked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_phase4_appointment_records_case
  ON phase4_appointment_records (booking_case_ref, created_at DESC);

CREATE TABLE IF NOT EXISTS phase4_booking_exceptions (
  booking_exception_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL,
  booking_transaction_ref TEXT NOT NULL REFERENCES phase4_booking_transactions (booking_transaction_id),
  exception_class TEXT NOT NULL CHECK (
    exception_class IN (
      'preflight_failure',
      'authoritative_failure',
      'dispatch_ambiguity',
      'receipt_divergence',
      'local_compensation_required',
      'supplier_reconciliation_required'
    )
  ),
  exception_state TEXT NOT NULL CHECK (exception_state IN ('open', 'resolved', 'superseded')),
  reason_code TEXT NOT NULL,
  provider_correlation_ref TEXT NULL,
  linked_receipt_checkpoint_ref TEXT NULL REFERENCES adapter_receipt_checkpoints (receipt_checkpoint_id),
  details_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_exceptions_case
  ON phase4_booking_exceptions (booking_case_ref, exception_state, created_at DESC);

CREATE TABLE IF NOT EXISTS phase4_booking_transaction_journal (
  booking_transaction_journal_entry_id TEXT PRIMARY KEY,
  booking_transaction_ref TEXT NOT NULL REFERENCES phase4_booking_transactions (booking_transaction_id),
  booking_case_ref TEXT NOT NULL,
  previous_authoritative_outcome_state TEXT NOT NULL,
  next_authoritative_outcome_state TEXT NOT NULL,
  previous_confirmation_truth_state TEXT NOT NULL,
  next_confirmation_truth_state TEXT NOT NULL,
  previous_commit_state TEXT NOT NULL,
  next_commit_state TEXT NOT NULL,
  action_scope TEXT NOT NULL CHECK (
    action_scope IN ('begin_commit', 'authoritative_observation', 'reconcile_ambiguous', 'release_or_supersede_failed')
  ),
  reason_codes_json TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  payload_artifact_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_transaction_journal_scope
  ON phase4_booking_transaction_journal (booking_transaction_ref, version);

COMMIT;
