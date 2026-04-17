BEGIN;

CREATE TABLE IF NOT EXISTS phase1_confirmation_communication_envelopes (
  communication_envelope_id TEXT PRIMARY KEY,
  queue_scope_ref TEXT NOT NULL,
  dispatch_contract_ref TEXT NOT NULL,
  enqueue_idempotency_key TEXT NOT NULL UNIQUE,
  request_ref TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  triage_task_ref TEXT NOT NULL,
  receipt_envelope_ref TEXT NOT NULL,
  outcome_artifact_ref TEXT NOT NULL,
  contact_preferences_ref TEXT,
  route_snapshot_seed_ref TEXT,
  current_contact_route_snapshot_ref TEXT,
  current_reachability_assessment_ref TEXT,
  reachability_dependency_ref TEXT,
  preferred_channel TEXT NOT NULL,
  masked_destination TEXT NOT NULL,
  template_variant_ref TEXT NOT NULL,
  local_ack_state TEXT NOT NULL,
  dispatch_eligibility_state TEXT NOT NULL,
  queue_state TEXT NOT NULL,
  transport_ack_state TEXT NOT NULL,
  delivery_evidence_state TEXT NOT NULL,
  authoritative_outcome_state TEXT NOT NULL,
  route_authority_state TEXT NOT NULL,
  reachability_assessment_state TEXT NOT NULL,
  delivery_risk_state TEXT NOT NULL,
  latest_transport_settlement_ref TEXT,
  latest_delivery_evidence_ref TEXT,
  last_provider_correlation_ref TEXT,
  dispatch_attempt_count INTEGER NOT NULL,
  next_attempt_not_before_at TEXT,
  terminal_at TEXT,
  reason_codes_json TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase1_confirmation_transport_settlements (
  transport_settlement_id TEXT PRIMARY KEY,
  communication_envelope_ref TEXT NOT NULL,
  queue_scope_ref TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  worker_run_ref TEXT NOT NULL,
  transport_settlement_key TEXT NOT NULL UNIQUE,
  provider_mode TEXT NOT NULL,
  provider_correlation_ref TEXT,
  processing_acceptance_state TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase1_confirmation_delivery_evidence (
  delivery_evidence_id TEXT PRIMARY KEY,
  communication_envelope_ref TEXT NOT NULL,
  queue_scope_ref TEXT NOT NULL,
  delivery_evidence_key TEXT NOT NULL UNIQUE,
  evidence_source TEXT NOT NULL,
  provider_correlation_ref TEXT,
  delivery_evidence_state TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  supersedes_delivery_evidence_ref TEXT
);

CREATE TABLE IF NOT EXISTS phase1_confirmation_receipt_bridges (
  receipt_bridge_id TEXT PRIMARY KEY,
  communication_envelope_ref TEXT NOT NULL UNIQUE,
  request_ref TEXT NOT NULL,
  receipt_envelope_ref TEXT NOT NULL,
  local_ack_state TEXT NOT NULL,
  transport_ack_state TEXT NOT NULL,
  delivery_evidence_state TEXT NOT NULL,
  authoritative_outcome_state TEXT NOT NULL,
  patient_posture_state TEXT NOT NULL,
  dispatch_eligibility_state TEXT NOT NULL,
  route_authority_state TEXT NOT NULL,
  reachability_assessment_state TEXT NOT NULL,
  delivery_risk_state TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

COMMIT;
