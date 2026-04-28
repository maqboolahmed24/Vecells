PRAGMA foreign_keys = ON;

ALTER TABLE phase4_appointment_records
  ADD COLUMN reminder_plan_ref TEXT NULL;

CREATE TABLE IF NOT EXISTS phase4_reminder_plans (
  reminder_plan_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL,
  appointment_record_ref TEXT NOT NULL REFERENCES phase4_appointment_records (appointment_record_id),
  confirmation_truth_ref TEXT NOT NULL REFERENCES phase4_booking_confirmation_truth_projections (booking_confirmation_truth_projection_id),
  request_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  source_task_ref TEXT NOT NULL,
  selected_slot_ref TEXT NOT NULL,
  appointment_start_at TEXT NOT NULL,
  appointment_end_at TEXT NOT NULL,
  appointment_time_zone TEXT NOT NULL,
  template_set_ref TEXT NOT NULL,
  template_version_ref TEXT NOT NULL,
  route_profile_ref TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  payload_ref TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  masked_destination TEXT NOT NULL,
  preference_profile_ref TEXT NOT NULL,
  contact_route_ref TEXT NOT NULL,
  contact_route_version_ref TEXT NOT NULL,
  current_contact_route_snapshot_ref TEXT NULL REFERENCES contact_route_snapshots (contact_route_snapshot_id),
  reachability_dependency_ref TEXT NULL REFERENCES reachability_dependencies (dependency_id),
  current_reachability_assessment_ref TEXT NULL REFERENCES reachability_assessment_records (reachability_assessment_id),
  reachability_epoch INTEGER NOT NULL CHECK (reachability_epoch >= 0),
  repair_journey_ref TEXT NULL REFERENCES contact_route_repair_journeys (repair_journey_id),
  communication_envelope_ref TEXT NULL REFERENCES phase1_confirmation_communication_envelopes (communication_envelope_id),
  schedule_refs_json TEXT NOT NULL,
  schedule_state TEXT NOT NULL CHECK (
    schedule_state IN ('draft', 'scheduled', 'queued', 'sent', 'delivery_blocked', 'disputed', 'cancelled', 'completed')
  ),
  transport_ack_state TEXT NOT NULL CHECK (
    transport_ack_state IN ('none', 'accepted', 'rejected', 'timed_out')
  ),
  delivery_evidence_state TEXT NOT NULL CHECK (
    delivery_evidence_state IN ('pending', 'delivered', 'disputed', 'failed', 'expired', 'suppressed')
  ),
  delivery_risk_state TEXT NOT NULL CHECK (
    delivery_risk_state IN ('on_track', 'at_risk', 'likely_failed', 'disputed')
  ),
  authoritative_outcome_state TEXT NOT NULL CHECK (
    authoritative_outcome_state IN ('scheduled', 'awaiting_delivery_truth', 'delivered', 'settled', 'recovery_required', 'suppressed')
  ),
  suppression_reason_refs_json TEXT NOT NULL,
  delivery_evidence_refs_json TEXT NOT NULL,
  last_delivery_attempt_at TEXT NULL,
  next_attempt_at TEXT NULL,
  causal_token TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL CHECK (monotone_revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_reminder_plans_appointment
  ON phase4_reminder_plans (appointment_record_ref);

CREATE INDEX IF NOT EXISTS idx_phase4_reminder_plans_case_updated
  ON phase4_reminder_plans (booking_case_ref, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase4_reminder_plans_state_next_attempt
  ON phase4_reminder_plans (schedule_state, next_attempt_at);

CREATE TABLE IF NOT EXISTS phase4_reminder_schedule_entries (
  reminder_schedule_entry_id TEXT PRIMARY KEY,
  reminder_plan_ref TEXT NOT NULL REFERENCES phase4_reminder_plans (reminder_plan_id),
  schedule_ref TEXT NOT NULL,
  schedule_ordinal INTEGER NOT NULL CHECK (schedule_ordinal >= 1),
  planned_send_at TEXT NOT NULL,
  queue_idempotency_key TEXT NOT NULL,
  receipt_envelope_ref TEXT NOT NULL,
  state TEXT NOT NULL CHECK (
    state IN ('draft', 'scheduled', 'queued', 'sent', 'delivery_blocked', 'disputed', 'cancelled', 'completed')
  ),
  communication_envelope_ref TEXT NULL REFERENCES phase1_confirmation_communication_envelopes (communication_envelope_id),
  latest_transport_settlement_ref TEXT NULL REFERENCES phase1_confirmation_transport_settlements (transport_settlement_id),
  latest_delivery_evidence_ref TEXT NULL REFERENCES phase1_confirmation_delivery_evidence (delivery_evidence_id),
  last_provider_correlation_ref TEXT NULL,
  transport_ack_state TEXT NOT NULL CHECK (
    transport_ack_state IN ('none', 'accepted', 'rejected', 'timed_out')
  ),
  delivery_evidence_state TEXT NOT NULL CHECK (
    delivery_evidence_state IN ('pending', 'delivered', 'disputed', 'failed', 'expired', 'suppressed')
  ),
  authoritative_outcome_state TEXT NOT NULL CHECK (
    authoritative_outcome_state IN ('scheduled', 'awaiting_delivery_truth', 'delivered', 'settled', 'recovery_required', 'suppressed')
  ),
  reason_codes_json TEXT NOT NULL,
  last_attempt_at TEXT NULL,
  next_attempt_at TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_reminder_schedule_entries_schedule_ref
  ON phase4_reminder_schedule_entries (schedule_ref);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_reminder_schedule_entries_queue_idempotency
  ON phase4_reminder_schedule_entries (queue_idempotency_key);

CREATE INDEX IF NOT EXISTS idx_phase4_reminder_schedule_entries_plan_time
  ON phase4_reminder_schedule_entries (reminder_plan_ref, planned_send_at, state);

CREATE TABLE IF NOT EXISTS phase4_reminder_transition_journal (
  reminder_transition_journal_entry_id TEXT PRIMARY KEY,
  reminder_plan_ref TEXT NOT NULL REFERENCES phase4_reminder_plans (reminder_plan_id),
  reminder_schedule_entry_ref TEXT NULL REFERENCES phase4_reminder_schedule_entries (reminder_schedule_entry_id),
  action_scope TEXT NOT NULL CHECK (
    action_scope IN ('refresh_plan', 'queue_due_schedule', 'transport_settlement', 'delivery_evidence', 'suppress', 'repair_required')
  ),
  previous_schedule_state TEXT NOT NULL CHECK (
    previous_schedule_state IN ('none', 'draft', 'scheduled', 'queued', 'sent', 'delivery_blocked', 'disputed', 'cancelled', 'completed')
  ),
  next_schedule_state TEXT NOT NULL CHECK (
    next_schedule_state IN ('draft', 'scheduled', 'queued', 'sent', 'delivery_blocked', 'disputed', 'cancelled', 'completed')
  ),
  previous_outcome_state TEXT NOT NULL CHECK (
    previous_outcome_state IN ('none', 'scheduled', 'awaiting_delivery_truth', 'delivered', 'settled', 'recovery_required', 'suppressed')
  ),
  next_outcome_state TEXT NOT NULL CHECK (
    next_outcome_state IN ('scheduled', 'awaiting_delivery_truth', 'delivered', 'settled', 'recovery_required', 'suppressed')
  ),
  reason_codes_json TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  payload_artifact_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_phase4_reminder_transition_journal_plan_recorded
  ON phase4_reminder_transition_journal (reminder_plan_ref, recorded_at DESC);
