BEGIN;

CREATE TABLE IF NOT EXISTS phase6_outcome_evidence_envelope (
  outcome_evidence_envelope_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_message_key TEXT NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  semantic_payload_hash TEXT NOT NULL,
  replay_key TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  trust_class TEXT NOT NULL,
  correlation_refs JSONB NOT NULL,
  dedupe_state TEXT NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_outcome_evidence_envelope_source_message
  ON phase6_outcome_evidence_envelope (source_type, source_message_key, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_outcome_evidence_envelope_replay
  ON phase6_outcome_evidence_envelope (replay_key, semantic_payload_hash, received_at DESC);

CREATE TABLE IF NOT EXISTS phase6_outcome_source_provenance (
  outcome_source_provenance_id TEXT PRIMARY KEY,
  outcome_evidence_envelope_ref TEXT NOT NULL,
  sender_identity_ref TEXT,
  inbound_transport_family TEXT,
  inbound_channel_ref TEXT,
  trusted_correlation_fragments JSONB NOT NULL,
  gp_workflow_identifiers JSONB NOT NULL,
  parser_assumption_refs JSONB NOT NULL,
  degraded_field_refs JSONB NOT NULL,
  field_origin_refs JSONB NOT NULL,
  raw_payload_ref TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_outcome_source_provenance_envelope
  ON phase6_outcome_source_provenance (outcome_evidence_envelope_ref, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase6_normalized_pharmacy_outcome_evidence (
  normalized_pharmacy_outcome_evidence_id TEXT PRIMARY KEY,
  outcome_evidence_envelope_ref TEXT NOT NULL,
  classification_state TEXT NOT NULL,
  outcome_at TIMESTAMPTZ NOT NULL,
  patient_ref_id TEXT,
  provider_ref_id TEXT,
  provider_ods_code TEXT,
  service_type TEXT,
  trusted_correlation_refs JSONB NOT NULL,
  source_floor NUMERIC NOT NULL,
  transport_hint_refs JSONB NOT NULL,
  route_intent_tuple_hash TEXT,
  raw_payload_ref TEXT,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_normalized_outcome_by_envelope
  ON phase6_normalized_pharmacy_outcome_evidence (outcome_evidence_envelope_ref);

CREATE INDEX IF NOT EXISTS idx_phase6_normalized_outcome_patient_service
  ON phase6_normalized_pharmacy_outcome_evidence (patient_ref_id, service_type, outcome_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_outcome_match_scorecard (
  pharmacy_outcome_match_scorecard_id TEXT PRIMARY KEY,
  ingest_attempt_ref TEXT NOT NULL,
  candidate_case_ref TEXT,
  runner_up_case_ref TEXT,
  policy_version_ref TEXT NOT NULL,
  threshold_family_refs JSONB NOT NULL,
  match_score NUMERIC NOT NULL,
  runner_up_match_score NUMERIC NOT NULL,
  posterior_match_confidence NUMERIC NOT NULL,
  contradiction_score NUMERIC NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_outcome_match_scorecard_attempt
  ON phase6_pharmacy_outcome_match_scorecard (ingest_attempt_ref, calculated_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_outcome_ingest_attempt (
  ingest_attempt_id TEXT PRIMARY KEY,
  outcome_evidence_envelope_ref TEXT NOT NULL,
  pharmacy_case_id TEXT,
  best_candidate_case_ref TEXT,
  runner_up_case_ref TEXT,
  match_state TEXT NOT NULL,
  match_score NUMERIC NOT NULL,
  runner_up_match_score NUMERIC NOT NULL,
  posterior_match_confidence NUMERIC NOT NULL,
  contradiction_score NUMERIC NOT NULL,
  classification_state TEXT NOT NULL,
  replay_state TEXT NOT NULL,
  manual_review_state TEXT NOT NULL,
  outcome_reconciliation_gate_ref TEXT,
  auto_apply_eligible BOOLEAN NOT NULL,
  close_eligibility_state TEXT NOT NULL,
  settlement_state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_outcome_ingest_attempt_case
  ON phase6_pharmacy_outcome_ingest_attempt (pharmacy_case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_outcome_ingest_attempt_envelope
  ON phase6_pharmacy_outcome_ingest_attempt (outcome_evidence_envelope_ref, created_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_outcome_reconciliation_gate (
  outcome_reconciliation_gate_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  ingest_attempt_ref TEXT NOT NULL,
  outcome_evidence_envelope_ref TEXT NOT NULL,
  candidate_case_ref TEXT NOT NULL,
  runner_up_case_ref TEXT,
  match_score NUMERIC NOT NULL,
  runner_up_match_score NUMERIC NOT NULL,
  posterior_match_confidence NUMERIC NOT NULL,
  contradiction_score NUMERIC NOT NULL,
  classification_state TEXT NOT NULL,
  gate_state TEXT NOT NULL,
  manual_review_state TEXT NOT NULL,
  blocking_closure_state TEXT NOT NULL,
  patient_visibility_state TEXT NOT NULL,
  current_owner_ref TEXT NOT NULL,
  resolution_notes_ref TEXT,
  opened_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_outcome_reconciliation_gate_case
  ON phase6_pharmacy_outcome_reconciliation_gate (pharmacy_case_id, opened_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_outcome_settlement (
  settlement_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  ingest_attempt_id TEXT NOT NULL,
  consent_checkpoint_ref TEXT,
  outcome_reconciliation_gate_ref TEXT,
  result TEXT NOT NULL,
  match_confidence_band TEXT NOT NULL,
  close_eligibility_state TEXT NOT NULL,
  receipt_text_ref TEXT NOT NULL,
  experience_continuity_evidence_ref TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  recovery_route_ref TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_outcome_settlement_case
  ON phase6_pharmacy_outcome_settlement (pharmacy_case_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_outcome_audit_event (
  pharmacy_outcome_audit_event_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT,
  ingest_attempt_id TEXT,
  outcome_reconciliation_gate_id TEXT,
  settlement_id TEXT,
  event_name TEXT NOT NULL,
  actor_ref TEXT,
  payload_digest TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_outcome_audit_event_case
  ON phase6_pharmacy_outcome_audit_event (pharmacy_case_id, recorded_at DESC);

COMMIT;
