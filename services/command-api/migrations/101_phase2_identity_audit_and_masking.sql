CREATE TABLE IF NOT EXISTS phase2_identity_canonical_event_contracts (
  canonical_event_contract_ref TEXT PRIMARY KEY,
  event_name TEXT NOT NULL UNIQUE,
  namespace_ref TEXT NOT NULL,
  owning_bounded_context_ref TEXT NOT NULL,
  governing_object_type TEXT NOT NULL,
  event_purpose TEXT NOT NULL,
  required_identifier_refs JSONB NOT NULL,
  required_causality_refs JSONB NOT NULL,
  required_privacy_refs JSONB NOT NULL,
  schema_version_ref TEXT NOT NULL,
  compatibility_mode TEXT NOT NULL CHECK (compatibility_mode = 'additive_only'),
  replay_semantics TEXT NOT NULL CHECK (
    replay_semantics IN ('append_only', 'idempotent_replace', 'superseding', 'observational')
  ),
  default_disclosure_class TEXT NOT NULL,
  contract_state TEXT NOT NULL CHECK (contract_state = 'active'),
  policy_version TEXT NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'IdentityAuditAndMaskingService',
  CHECK (created_by_authority = 'IdentityAuditAndMaskingService')
);

CREATE TABLE IF NOT EXISTS phase2_identity_canonical_event_envelopes (
  event_id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL REFERENCES phase2_identity_canonical_event_contracts(event_name),
  canonical_event_contract_ref TEXT NOT NULL REFERENCES phase2_identity_canonical_event_contracts(canonical_event_contract_ref),
  namespace_ref TEXT NOT NULL,
  schema_version_ref TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  producer_ref TEXT NOT NULL,
  producer_scope_ref TEXT NOT NULL,
  source_bounded_context_ref TEXT NOT NULL,
  governing_bounded_context_ref TEXT NOT NULL,
  governing_aggregate_ref TEXT NOT NULL,
  governing_lineage_ref TEXT NOT NULL,
  route_intent_ref TEXT,
  command_action_record_ref TEXT,
  command_settlement_ref TEXT,
  edge_correlation_id TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  effect_key_ref TEXT NOT NULL UNIQUE,
  continuity_frame_ref TEXT,
  subject_ref TEXT,
  pii_class TEXT NOT NULL,
  disclosure_class TEXT NOT NULL,
  payload_artifact_ref TEXT,
  payload_hash TEXT NOT NULL,
  redacted_payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  emitted_at TIMESTAMPTZ NOT NULL,
  actor_type TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  route_profile_ref TEXT,
  session_ref TEXT,
  decision_ref TEXT,
  grant_ref TEXT,
  repair_case_ref TEXT,
  evidence_refs JSONB NOT NULL,
  reason_codes JSONB NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'IdentityAuditAndMaskingService',
  CHECK (created_by_authority = 'IdentityAuditAndMaskingService')
);

CREATE TABLE IF NOT EXISTS phase2_identity_event_outbox_entries (
  outbox_entry_id TEXT PRIMARY KEY,
  event_envelope_ref TEXT NOT NULL REFERENCES phase2_identity_canonical_event_envelopes(event_id),
  queue_ref TEXT NOT NULL CHECK (queue_ref = 'q_event_assurance_audit'),
  ordering_key TEXT NOT NULL,
  effect_key_ref TEXT NOT NULL,
  dispatch_state TEXT NOT NULL CHECK (dispatch_state IN ('pending', 'published', 'quarantined')),
  created_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'IdentityAuditAndMaskingService',
  CHECK (created_by_authority = 'IdentityAuditAndMaskingService')
);

CREATE TABLE IF NOT EXISTS phase2_identity_audit_records (
  identity_audit_record_id TEXT PRIMARY KEY,
  audit_sequence BIGINT NOT NULL UNIQUE,
  event_envelope_ref TEXT NOT NULL REFERENCES phase2_identity_canonical_event_envelopes(event_id),
  event_name TEXT NOT NULL,
  governing_lineage_ref TEXT NOT NULL,
  route_intent_ref TEXT,
  session_ref TEXT,
  decision_ref TEXT,
  grant_ref TEXT,
  repair_case_ref TEXT,
  reason_codes JSONB NOT NULL,
  replay_disposition TEXT NOT NULL CHECK (replay_disposition IN ('accepted', 'duplicate_replayed')),
  previous_hash TEXT,
  record_hash TEXT NOT NULL UNIQUE,
  immutable BOOLEAN NOT NULL CHECK (immutable = TRUE),
  recorded_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'IdentityAuditAndMaskingService',
  CHECK (created_by_authority = 'IdentityAuditAndMaskingService')
);

CREATE TABLE IF NOT EXISTS phase2_identity_audit_duplicate_receipts (
  duplicate_receipt_id TEXT PRIMARY KEY,
  existing_event_envelope_ref TEXT NOT NULL REFERENCES phase2_identity_canonical_event_envelopes(event_id),
  attempted_event_name TEXT NOT NULL,
  effect_key_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  duplicate_payload_hash TEXT NOT NULL,
  replay_disposition TEXT NOT NULL CHECK (replay_disposition = 'duplicate_replayed'),
  received_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'IdentityAuditAndMaskingService',
  CHECK (created_by_authority = 'IdentityAuditAndMaskingService')
);

CREATE TABLE IF NOT EXISTS phase2_identity_masking_policy_rules (
  masking_policy_rule_ref TEXT PRIMARY KEY,
  data_class TEXT NOT NULL,
  field_matchers JSONB NOT NULL,
  default_audience TEXT NOT NULL,
  replacement_mode TEXT NOT NULL,
  operational_log_allowed BOOLEAN NOT NULL CHECK (operational_log_allowed = FALSE),
  policy_version TEXT NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'IdentityAuditAndMaskingService',
  CHECK (created_by_authority = 'IdentityAuditAndMaskingService')
);

CREATE TABLE IF NOT EXISTS phase2_identity_observability_scrub_records (
  scrub_record_id TEXT PRIMARY KEY,
  surface TEXT NOT NULL CHECK (surface IN ('log', 'trace', 'metric')),
  source_ref TEXT NOT NULL,
  redacted_field_paths JSONB NOT NULL,
  masking_rule_refs JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  reason_codes JSONB NOT NULL,
  scrubbed_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'IdentityAuditAndMaskingService',
  CHECK (created_by_authority = 'IdentityAuditAndMaskingService')
);

CREATE INDEX IF NOT EXISTS idx_phase2_identity_event_lineage
  ON phase2_identity_canonical_event_envelopes(governing_lineage_ref, occurred_at);

CREATE INDEX IF NOT EXISTS idx_phase2_identity_audit_lineage
  ON phase2_identity_audit_records(governing_lineage_ref, audit_sequence);

CREATE INDEX IF NOT EXISTS idx_phase2_identity_duplicate_effect
  ON phase2_identity_audit_duplicate_receipts(effect_key_ref, received_at);
