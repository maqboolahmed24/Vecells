CREATE TABLE IF NOT EXISTS phase2_telephony_provider_adapter_contracts (
  provider_adapter_contract_ref TEXT PRIMARY KEY,
  provider_ref TEXT NOT NULL UNIQUE,
  adapter_mode TEXT NOT NULL CHECK (adapter_mode = 'simulator_backed'),
  signature_header_name TEXT NOT NULL,
  timestamp_header_name TEXT NOT NULL,
  signature_algorithm TEXT NOT NULL CHECK (signature_algorithm = 'hmac-sha256'),
  acknowledgement_mode TEXT NOT NULL CHECK (acknowledgement_mode = 'empty_fast_ack'),
  raw_payload_boundary TEXT NOT NULL CHECK (
    raw_payload_boundary = 'provider_payload_shape_stops_at_normalizer'
  ),
  policy_version TEXT NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyEdgeService',
  CHECK (created_by_authority = 'TelephonyEdgeService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_raw_webhook_receipts (
  raw_receipt_ref TEXT PRIMARY KEY,
  provider_ref TEXT NOT NULL REFERENCES phase2_telephony_provider_adapter_contracts(provider_ref),
  received_at TIMESTAMPTZ NOT NULL,
  source_ip_ref TEXT,
  request_url TEXT NOT NULL,
  header_digest TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  raw_payload_quarantine_ref TEXT NOT NULL,
  retention_class TEXT NOT NULL CHECK (retention_class = 'edge_quarantine_short_retention'),
  validation_state TEXT NOT NULL CHECK (validation_state IN ('validated', 'signature_failed')),
  signature_key_version_ref TEXT NOT NULL,
  disclosure_boundary TEXT NOT NULL CHECK (
    disclosure_boundary = 'provider_payload_shape_stops_at_normalizer'
  ),
  reason_codes JSONB NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyEdgeService',
  CHECK (created_by_authority = 'TelephonyEdgeService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_normalized_events (
  canonical_event_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  provider_event_family TEXT NOT NULL,
  canonical_event_type TEXT NOT NULL,
  ingress_source TEXT NOT NULL CHECK (ingress_source IN ('webhook', 'polling', 'simulator')),
  provider_ref TEXT NOT NULL,
  provider_call_ref TEXT NOT NULL,
  provider_event_ref TEXT NOT NULL,
  provider_payload_ref TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  payload_storage_rule TEXT NOT NULL CHECK (payload_storage_rule = 'normalization_boundary_only'),
  payload_disclosure_boundary TEXT NOT NULL CHECK (
    payload_disclosure_boundary = 'provider_payload_shape_stops_at_normalizer'
  ),
  idempotency_key_basis TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  call_session_ref TEXT NOT NULL,
  sequence INTEGER,
  edge_correlation_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  normalized_at TIMESTAMPTZ NOT NULL,
  normalizer_version_ref TEXT NOT NULL,
  normalized_payload JSONB NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyEdgeService',
  CHECK (created_by_authority = 'TelephonyEdgeService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_ingestion_idempotency_records (
  idempotency_record_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  call_session_ref TEXT NOT NULL,
  canonical_event_type TEXT NOT NULL,
  canonical_event_ref TEXT NOT NULL REFERENCES phase2_telephony_normalized_events(canonical_event_id),
  payload_digest TEXT NOT NULL,
  first_raw_receipt_ref TEXT NOT NULL REFERENCES phase2_telephony_raw_webhook_receipts(raw_receipt_ref),
  replay_disposition TEXT NOT NULL CHECK (
    replay_disposition IN ('accepted', 'duplicate_replayed', 'idempotency_collision_rejected')
  ),
  first_accepted_at TIMESTAMPTZ NOT NULL,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  reason_codes JSONB NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyEdgeService',
  CHECK (created_by_authority = 'TelephonyEdgeService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_disorder_buffer_entries (
  disorder_buffer_entry_ref TEXT PRIMARY KEY,
  canonical_event_ref TEXT NOT NULL REFERENCES phase2_telephony_normalized_events(canonical_event_id),
  call_session_ref TEXT NOT NULL,
  canonical_event_type TEXT NOT NULL,
  buffer_state TEXT NOT NULL CHECK (
    buffer_state IN ('waiting_for_call_started', 'replayed', 'superseded')
  ),
  buffered_reason_code TEXT NOT NULL,
  buffered_at TIMESTAMPTZ NOT NULL,
  replayed_at TIMESTAMPTZ,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyWebhookWorker',
  CHECK (created_by_authority = 'TelephonyWebhookWorker')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_call_session_bootstrap_records (
  call_session_ref TEXT PRIMARY KEY,
  provider_call_ref TEXT NOT NULL,
  call_state TEXT NOT NULL,
  menu_selection TEXT,
  masked_caller_ref TEXT,
  masked_caller_fragment TEXT,
  recording_refs JSONB NOT NULL,
  urgent_live_assessment_ref TEXT NOT NULL,
  first_event_ref TEXT NOT NULL REFERENCES phase2_telephony_normalized_events(canonical_event_id),
  last_event_ref TEXT NOT NULL REFERENCES phase2_telephony_normalized_events(canonical_event_id),
  state_revision INTEGER NOT NULL,
  reason_codes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyWebhookWorker',
  CHECK (created_by_authority = 'TelephonyWebhookWorker')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_webhook_worker_outbox (
  outbox_entry_ref TEXT PRIMARY KEY,
  canonical_event_ref TEXT NOT NULL REFERENCES phase2_telephony_normalized_events(canonical_event_id),
  call_session_ref TEXT NOT NULL,
  ordering_key TEXT NOT NULL,
  dispatch_state TEXT NOT NULL CHECK (dispatch_state IN ('pending', 'applied', 'buffered', 'failed')),
  created_at TIMESTAMPTZ NOT NULL,
  applied_at TIMESTAMPTZ,
  reason_codes JSONB NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyWebhookWorker',
  CHECK (created_by_authority = 'TelephonyWebhookWorker')
);

CREATE INDEX IF NOT EXISTS idx_phase2_telephony_receipt_digest
  ON phase2_telephony_raw_webhook_receipts(provider_ref, payload_digest, received_at);

CREATE INDEX IF NOT EXISTS idx_phase2_telephony_event_session_order
  ON phase2_telephony_normalized_events(call_session_ref, occurred_at, sequence);

CREATE INDEX IF NOT EXISTS idx_phase2_telephony_outbox_pending
  ON phase2_telephony_webhook_worker_outbox(dispatch_state, ordering_key, created_at);
