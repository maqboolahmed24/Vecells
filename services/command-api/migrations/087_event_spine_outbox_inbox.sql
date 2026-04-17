CREATE SCHEMA IF NOT EXISTS vecells_runtime;

CREATE TABLE IF NOT EXISTS vecells_runtime.event_outbox_entries (
  outbox_entry_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  producer_service_ref TEXT NOT NULL,
  command_settlement_ref TEXT NULL,
  ordering_key TEXT NOT NULL,
  ordering_sequence BIGINT NOT NULL,
  effect_key TEXT NOT NULL UNIQUE,
  dispatch_state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  broker_message_id TEXT NULL,
  claimed_by TEXT NULL,
  claimed_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  quarantined_at TIMESTAMPTZ NULL,
  quarantine_reason TEXT NULL,
  event_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  schema_version_ref TEXT NOT NULL,
  source_bounded_context_ref TEXT NOT NULL,
  governing_bounded_context_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  emitted_at TIMESTAMPTZ NOT NULL,
  payload_digest TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  UNIQUE (queue_ref, ordering_key, ordering_sequence)
);

CREATE TABLE IF NOT EXISTS vecells_runtime.event_outbox_dispatch_attempts (
  dispatch_attempt_id TEXT PRIMARY KEY,
  outbox_entry_ref TEXT NOT NULL
    REFERENCES vecells_runtime.event_outbox_entries (outbox_entry_id)
    ON DELETE CASCADE,
  queue_ref TEXT NOT NULL,
  claimed_by TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  broker_message_id TEXT NULL,
  claimed_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NULL,
  outcome_state TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  UNIQUE (outbox_entry_ref, attempt_number)
);

CREATE TABLE IF NOT EXISTS vecells_runtime.event_outbox_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  queue_ref TEXT NOT NULL,
  ordering_key TEXT NOT NULL,
  last_published_sequence BIGINT NOT NULL,
  last_published_event_id TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (queue_ref, ordering_key)
);

CREATE TABLE IF NOT EXISTS vecells_runtime.event_inbox_receipts (
  inbox_receipt_id TEXT PRIMARY KEY,
  consumer_group_ref TEXT NOT NULL,
  queue_ref TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  ordering_key TEXT NOT NULL,
  sequence BIGINT NOT NULL,
  receipt_state TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  callback_correlation_key TEXT NULL,
  gap_expected_sequence BIGINT NULL,
  quarantine_reason TEXT NULL,
  effect_key TEXT NOT NULL,
  event_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  schema_version_ref TEXT NOT NULL,
  source_bounded_context_ref TEXT NOT NULL,
  governing_bounded_context_ref TEXT NOT NULL,
  edge_correlation_id TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  emitted_at TIMESTAMPTZ NOT NULL,
  payload_digest TEXT NOT NULL,
  payload_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS vecells_runtime.event_inbox_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  consumer_group_ref TEXT NOT NULL,
  ordering_key TEXT NOT NULL,
  next_expected_sequence BIGINT NOT NULL,
  last_accepted_event_id TEXT NULL,
  last_accepted_at TIMESTAMPTZ NULL,
  callback_correlation_key TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (consumer_group_ref, ordering_key)
);

CREATE TABLE IF NOT EXISTS vecells_runtime.event_replay_reviews (
  replay_review_id TEXT PRIMARY KEY,
  consumer_group_ref TEXT NOT NULL,
  queue_ref TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  expected_sequence BIGINT NOT NULL,
  actual_sequence BIGINT NOT NULL,
  callback_correlation_key TEXT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL
);
