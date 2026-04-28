BEGIN;

CREATE TABLE IF NOT EXISTS phase4_booking_reconciliation_records (
  booking_reconciliation_record_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL,
  booking_transaction_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  offer_session_ref TEXT NOT NULL,
  selected_slot_ref TEXT NOT NULL,
  reservation_truth_projection_ref TEXT,
  confirmation_truth_projection_ref TEXT,
  appointment_record_ref TEXT,
  external_confirmation_gate_ref TEXT,
  latest_receipt_checkpoint_ref TEXT,
  current_attempt_ref TEXT,
  current_attempt_ordinal INTEGER NOT NULL,
  authoritative_read_and_confirmation_policy_ref TEXT NOT NULL,
  authoritative_read_mode TEXT NOT NULL,
  reconcile_state TEXT NOT NULL,
  manual_attention_required BOOLEAN NOT NULL DEFAULT FALSE,
  manual_dispute_state TEXT NOT NULL,
  queue_entry_ref TEXT,
  gate_state TEXT,
  gate_confidence DOUBLE PRECISION,
  competing_gate_margin DOUBLE PRECISION,
  confirmation_deadline_at TIMESTAMPTZ NOT NULL,
  first_observed_at TIMESTAMPTZ NOT NULL,
  last_observed_at TIMESTAMPTZ NOT NULL,
  last_settled_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  final_outcome_state TEXT NOT NULL,
  latest_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  monotone_revision INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase4_booking_reconciliation_transaction_idx
  ON phase4_booking_reconciliation_records (booking_transaction_ref);

CREATE UNIQUE INDEX IF NOT EXISTS phase4_booking_reconciliation_case_current_idx
  ON phase4_booking_reconciliation_records (booking_case_ref, booking_transaction_ref);

CREATE INDEX IF NOT EXISTS phase4_booking_reconciliation_due_idx
  ON phase4_booking_reconciliation_records (reconcile_state, next_attempt_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS phase4_booking_reconciliation_attempts (
  booking_reconciliation_attempt_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_reconciliation_record_ref TEXT NOT NULL,
  booking_case_ref TEXT NOT NULL,
  booking_transaction_ref TEXT NOT NULL,
  attempt_key TEXT NOT NULL,
  attempt_ordinal INTEGER NOT NULL,
  trigger TEXT NOT NULL,
  worker_run_ref TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  observation_kind TEXT,
  authoritative_proof_class TEXT NOT NULL,
  provider_reference TEXT,
  receipt_checkpoint_ref TEXT,
  gate_ref TEXT,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_atoms_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  competing_gate_confidences_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  manual_override_requested BOOLEAN NOT NULL DEFAULT FALSE,
  next_attempt_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS phase4_booking_reconciliation_attempt_key_idx
  ON phase4_booking_reconciliation_attempts (attempt_key);

CREATE INDEX IF NOT EXISTS phase4_booking_reconciliation_attempt_record_idx
  ON phase4_booking_reconciliation_attempts (
    booking_reconciliation_record_ref,
    attempt_ordinal DESC
  );

CREATE INDEX IF NOT EXISTS phase4_booking_reconciliation_attempt_receipt_idx
  ON phase4_booking_reconciliation_attempts (
    booking_transaction_ref,
    receipt_checkpoint_ref,
    completed_at DESC
  );

COMMIT;
