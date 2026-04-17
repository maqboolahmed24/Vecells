-- Phase 2 task 193: one-pipeline telephony convergence.
-- These append-only tables persist the governed capture, ingress,
-- duplicate, promotion, and receipt/status seams used by the command-api
-- service implementation. Payload columns hold redacted canonical JSON,
-- never raw provider payloads or signed continuation URLs.

CREATE TABLE IF NOT EXISTS phase2_telephony_frozen_capture_bundles (
  capture_bundle_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  command_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  ingress_channel TEXT NOT NULL,
  surface_channel_profile TEXT NOT NULL,
  capture_authority_class TEXT NOT NULL,
  request_type TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  semantic_hash TEXT NOT NULL,
  replay_key TEXT NOT NULL,
  field_source_manifest_json TEXT NOT NULL,
  narrative_source TEXT NOT NULL,
  attachment_refs_json TEXT NOT NULL,
  audio_refs_json TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  frozen_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_telephony_evidence_snapshots (
  evidence_snapshot_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  capture_bundle_ref TEXT NOT NULL REFERENCES phase2_telephony_frozen_capture_bundles(capture_bundle_ref),
  source_lineage_ref TEXT NOT NULL,
  ingress_channel TEXT NOT NULL,
  governing_input_refs_json TEXT NOT NULL,
  evidence_readiness_state TEXT NOT NULL,
  normalized_input_hash TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  semantic_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_submission_ingress_records (
  ingress_record_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  submission_envelope_ref TEXT NOT NULL,
  request_lineage_ref TEXT,
  intake_convergence_contract_ref TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  ingress_channel TEXT NOT NULL,
  surface_channel_profile TEXT NOT NULL,
  capture_authority_class TEXT NOT NULL,
  promotion_intent_class TEXT NOT NULL,
  channel_capability_ceiling_json TEXT NOT NULL,
  contact_authority_class TEXT NOT NULL,
  identity_evidence_refs_json TEXT NOT NULL,
  contact_route_evidence_refs_json TEXT NOT NULL,
  evidence_readiness_state TEXT NOT NULL,
  evidence_readiness_ref TEXT,
  normalized_submission_ref TEXT NOT NULL,
  transport_correlation_id TEXT NOT NULL,
  channel_payload_ref TEXT NOT NULL,
  channel_payload_hash TEXT NOT NULL,
  receipt_consistency_key TEXT NOT NULL,
  status_consistency_key TEXT NOT NULL,
  supersedes_ingress_record_ref TEXT,
  created_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_telephony_duplicate_pair_evidences (
  pair_evidence_id TEXT PRIMARY KEY,
  incoming_lineage_ref TEXT NOT NULL,
  incoming_snapshot_ref TEXT NOT NULL,
  candidate_request_ref TEXT,
  candidate_episode_ref TEXT,
  replay_signal_refs_json TEXT NOT NULL,
  continuity_signal_refs_json TEXT NOT NULL,
  conflict_signal_refs_json TEXT NOT NULL,
  relation_model_version_ref TEXT NOT NULL,
  channel_calibration_ref TEXT NOT NULL,
  threshold_policy_ref TEXT NOT NULL,
  feature_vector_hash TEXT NOT NULL,
  pi_retry REAL NOT NULL,
  pi_same_request_attach REAL NOT NULL,
  pi_same_episode REAL NOT NULL,
  pi_related_episode REAL NOT NULL,
  pi_new_episode REAL NOT NULL,
  class_margin REAL NOT NULL,
  candidate_margin REAL NOT NULL,
  uncertainty_score REAL NOT NULL,
  hard_blocker_refs_json TEXT NOT NULL,
  evidence_state TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_telephony_duplicate_resolution_decisions (
  duplicate_resolution_decision_id TEXT PRIMARY KEY,
  incoming_lineage_ref TEXT NOT NULL,
  incoming_snapshot_ref TEXT NOT NULL,
  target_request_ref TEXT,
  target_episode_ref TEXT,
  winning_pair_evidence_ref TEXT,
  competing_pair_evidence_refs_json TEXT NOT NULL,
  relation_class TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  continuity_witness_class TEXT NOT NULL,
  continuity_witness_ref TEXT,
  review_mode TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  decision_state TEXT NOT NULL,
  decided_by_ref TEXT NOT NULL,
  decided_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_receipt_status_consistency_projections (
  projection_ref TEXT PRIMARY KEY,
  receipt_consistency_key TEXT NOT NULL,
  status_consistency_key TEXT NOT NULL,
  receipt_issued INTEGER NOT NULL,
  submitted_event_emitted INTEGER NOT NULL,
  intake_normalized_event_emitted INTEGER NOT NULL,
  promise_state TEXT NOT NULL,
  eta_bucket TEXT NOT NULL,
  recovery_posture TEXT NOT NULL,
  visible_provenance_label TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase2_telephony_convergence_outcomes (
  convergence_outcome_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  replay_classification TEXT NOT NULL,
  capture_bundle_ref TEXT NOT NULL REFERENCES phase2_telephony_frozen_capture_bundles(capture_bundle_ref),
  evidence_snapshot_ref TEXT NOT NULL REFERENCES phase2_telephony_evidence_snapshots(evidence_snapshot_ref),
  ingress_record_id TEXT NOT NULL REFERENCES phase2_submission_ingress_records(ingress_record_id),
  normalized_submission_ref TEXT NOT NULL,
  duplicate_resolution_decision_id TEXT NOT NULL REFERENCES phase2_telephony_duplicate_resolution_decisions(duplicate_resolution_decision_id),
  promotion_readiness TEXT NOT NULL,
  promotion_record_ref TEXT,
  receipt_consistency_key TEXT NOT NULL,
  status_consistency_key TEXT NOT NULL,
  receipt_status_projection_ref TEXT NOT NULL REFERENCES phase2_receipt_status_consistency_projections(projection_ref),
  reason_codes_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase2_telephony_convergence_idempotency
  ON phase2_telephony_convergence_outcomes(idempotency_key)
  WHERE replay_classification != 'collision_review';

CREATE INDEX IF NOT EXISTS idx_phase2_telephony_ingress_envelope
  ON phase2_submission_ingress_records(submission_envelope_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_phase2_telephony_receipt_consistency
  ON phase2_receipt_status_consistency_projections(receipt_consistency_key, status_consistency_key);
