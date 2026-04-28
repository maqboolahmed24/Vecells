BEGIN;

ALTER TABLE phase4_appointment_records
  RENAME TO phase4_appointment_records_legacy_136;

CREATE TABLE IF NOT EXISTS phase4_appointment_manage_commands (
  appointment_manage_command_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  appointment_id TEXT NOT NULL,
  booking_case_id TEXT NOT NULL,
  action_scope TEXT NOT NULL CHECK (
    action_scope IN (
      'appointment_cancel',
      'appointment_reschedule',
      'appointment_reschedule_abandon',
      'appointment_detail_update',
      'reminder_change'
    )
  ),
  route_intent_binding_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  canonical_object_descriptor_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  route_contract_digest TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  capability_resolution_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  freshness_token TEXT NOT NULL,
  governing_fence_epoch INTEGER NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor_mode TEXT NOT NULL CHECK (actor_mode IN ('patient', 'staff', 'staff_proxy', 'system')),
  selected_anchor_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  semantic_payload_hash TEXT NOT NULL,
  latest_manage_settlement_ref TEXT NOT NULL,
  command_state TEXT NOT NULL CHECK (command_state IN ('submitted', 'settled', 'superseded')),
  submit_time TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_appointment_manage_commands_idempotency
  ON phase4_appointment_manage_commands (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_phase4_appointment_manage_commands_appointment
  ON phase4_appointment_manage_commands (appointment_id, submit_time DESC);

CREATE TABLE IF NOT EXISTS phase4_booking_manage_settlements (
  booking_manage_settlement_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  appointment_manage_command_ref TEXT NOT NULL REFERENCES phase4_appointment_manage_commands (appointment_manage_command_id),
  booking_case_id TEXT NOT NULL,
  appointment_id TEXT NOT NULL,
  action_scope TEXT NOT NULL CHECK (
    action_scope IN (
      'appointment_cancel',
      'appointment_reschedule',
      'appointment_reschedule_abandon',
      'appointment_detail_update',
      'reminder_change'
    )
  ),
  route_intent_binding_ref TEXT NOT NULL,
  canonical_object_descriptor_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  capability_resolution_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  result TEXT NOT NULL CHECK (
    result IN (
      'applied',
      'supplier_pending',
      'stale_recoverable',
      'unsupported_capability',
      'safety_preempted',
      'reconciliation_required'
    )
  ),
  receipt_text_ref TEXT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  transition_envelope_ref TEXT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NULL,
  route_freeze_disposition_ref TEXT NULL,
  recovery_route_ref TEXT NULL,
  presentation_artifact_ref TEXT NULL,
  contact_route_repair_journey_ref TEXT NULL,
  reason_codes_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_manage_settlements_appointment
  ON phase4_booking_manage_settlements (appointment_id, recorded_at DESC);

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
  confirmation_truth_projection_ref TEXT NOT NULL,
  manage_support_contract_ref TEXT NULL,
  manage_capabilities_json TEXT NOT NULL DEFAULT '[]',
  manage_capability_projection_ref TEXT NULL,
  reminder_plan_ref TEXT NULL,
  presentation_artifact_ref TEXT NOT NULL,
  appointment_status TEXT NOT NULL CHECK (
    appointment_status IN ('booked', 'cancellation_pending', 'cancelled', 'reschedule_in_progress', 'superseded')
  ),
  supersedes_appointment_ref TEXT NULL,
  superseded_by_appointment_ref TEXT NULL,
  latest_manage_settlement_ref TEXT NULL REFERENCES phase4_booking_manage_settlements (booking_manage_settlement_id),
  administrative_details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

INSERT INTO phase4_appointment_records (
  appointment_record_id,
  schema_version,
  booking_case_ref,
  booking_transaction_ref,
  selected_slot_ref,
  canonical_reservation_key,
  provider_adapter_binding_ref,
  provider_reference,
  authoritative_proof_class,
  confirmation_truth_projection_ref,
  manage_support_contract_ref,
  manage_capabilities_json,
  manage_capability_projection_ref,
  reminder_plan_ref,
  presentation_artifact_ref,
  appointment_status,
  supersedes_appointment_ref,
  superseded_by_appointment_ref,
  latest_manage_settlement_ref,
  administrative_details_json,
  created_at,
  updated_at,
  version
)
SELECT
  appointment_record_id,
  schema_version,
  booking_case_ref,
  booking_transaction_ref,
  selected_slot_ref,
  canonical_reservation_key,
  provider_adapter_binding_ref,
  provider_reference,
  authoritative_proof_class,
  booking_transaction_ref,
  NULL,
  '[]',
  NULL,
  NULL,
  'artifact://booking/appointment/' || appointment_record_id,
  appointment_status,
  NULL,
  NULL,
  NULL,
  '{}',
  created_at,
  updated_at,
  version
FROM phase4_appointment_records_legacy_136;

DROP TABLE phase4_appointment_records_legacy_136;

CREATE INDEX IF NOT EXISTS idx_phase4_appointment_records_case
  ON phase4_appointment_records (booking_case_ref, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_appointment_records_status
  ON phase4_appointment_records (booking_case_ref, appointment_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS phase4_booking_continuity_evidence_projections (
  booking_continuity_evidence_projection_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_id TEXT NOT NULL,
  appointment_id TEXT NOT NULL REFERENCES phase4_appointment_records (appointment_record_id),
  appointment_record_ref TEXT NOT NULL REFERENCES phase4_appointment_records (appointment_record_id),
  booking_confirmation_truth_projection_ref TEXT NOT NULL,
  appointment_lineage_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  capability_resolution_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  latest_manage_settlement_ref TEXT NOT NULL REFERENCES phase4_booking_manage_settlements (booking_manage_settlement_id),
  latest_manage_command_ref TEXT NOT NULL REFERENCES phase4_appointment_manage_commands (appointment_manage_command_id),
  experience_continuity_evidence_ref TEXT NOT NULL,
  continuity_state TEXT NOT NULL CHECK (
    continuity_state IN ('live', 'summary_only', 'stale_recovery', 'blocked_recovery')
  ),
  writable_state TEXT NOT NULL CHECK (
    writable_state IN ('writable', 'summary_only', 'recovery_only')
  ),
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_continuity_evidence_appointment
  ON phase4_booking_continuity_evidence_projections (appointment_id, generated_at DESC);

COMMIT;
