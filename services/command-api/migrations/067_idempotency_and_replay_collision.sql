BEGIN;

CREATE TABLE IF NOT EXISTS idempotency_records (
  idempotency_record_id TEXT PRIMARY KEY,
  action_scope TEXT NOT NULL,
  governing_lineage_ref TEXT NOT NULL,
  source_command_id TEXT,
  source_command_id_family TEXT NOT NULL,
  transport_correlation_id TEXT,
  raw_payload_hash TEXT NOT NULL,
  semantic_payload_hash TEXT NOT NULL,
  replay_key TEXT NOT NULL,
  scope_fingerprint TEXT NOT NULL,
  effect_scope_key TEXT NOT NULL,
  causal_parent_ref TEXT,
  intent_generation INTEGER NOT NULL,
  expected_effect_set_hash TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  first_accepted_action_record_ref TEXT NOT NULL,
  accepted_settlement_ref TEXT NOT NULL,
  collision_review_ref TEXT,
  decision_basis_ref TEXT NOT NULL,
  replay_window_closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_records_replay_composite
  ON idempotency_records (action_scope, governing_lineage_ref, replay_key, scope_fingerprint);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_records_effect_scope_key
  ON idempotency_records (effect_scope_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_records_source_command
  ON idempotency_records (action_scope, governing_lineage_ref, source_command_id)
  WHERE source_command_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_records_transport_correlation
  ON idempotency_records (action_scope, governing_lineage_ref, transport_correlation_id)
  WHERE transport_correlation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS replay_collision_reviews (
  replay_collision_review_id TEXT PRIMARY KEY,
  idempotency_record_ref TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  governing_lineage_ref TEXT NOT NULL,
  existing_action_record_ref TEXT NOT NULL,
  existing_settlement_ref TEXT NOT NULL,
  incoming_source_command_id TEXT,
  incoming_transport_correlation_id TEXT,
  incoming_semantic_payload_hash TEXT NOT NULL,
  incoming_effect_set_hash TEXT NOT NULL,
  collision_class TEXT NOT NULL,
  review_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_replay_collision_reviews_natural_key
  ON replay_collision_reviews (
    idempotency_record_ref,
    action_scope,
    governing_lineage_ref,
    incoming_source_command_id,
    incoming_transport_correlation_id,
    incoming_semantic_payload_hash,
    incoming_effect_set_hash,
    collision_class
  );

CREATE TABLE IF NOT EXISTS adapter_dispatch_attempts (
  dispatch_attempt_id TEXT PRIMARY KEY,
  idempotency_record_ref TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  governing_lineage_ref TEXT NOT NULL,
  action_record_ref TEXT NOT NULL,
  adapter_contract_profile_ref TEXT NOT NULL,
  effect_scope TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  transport_payload_hash TEXT NOT NULL,
  semantic_payload_hash TEXT NOT NULL,
  provider_correlation_ref TEXT,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL,
  first_dispatched_at TEXT NOT NULL,
  last_observed_at TEXT NOT NULL,
  confirmed_settlement_ref TEXT,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_adapter_dispatch_attempts_effect_key
  ON adapter_dispatch_attempts (effect_key);

CREATE TABLE IF NOT EXISTS adapter_receipt_checkpoints (
  receipt_checkpoint_id TEXT PRIMARY KEY,
  adapter_contract_profile_ref TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  provider_correlation_ref TEXT,
  transport_message_id TEXT NOT NULL,
  ordering_key TEXT NOT NULL,
  raw_receipt_hash TEXT NOT NULL,
  semantic_receipt_hash TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  linked_dispatch_attempt_ref TEXT NOT NULL,
  linked_settlement_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_adapter_receipt_checkpoints_canonical_key
  ON adapter_receipt_checkpoints (
    adapter_contract_profile_ref,
    effect_key,
    provider_correlation_ref,
    ordering_key
  );

CREATE INDEX IF NOT EXISTS idx_adapter_receipt_checkpoints_provider_correlation
  ON adapter_receipt_checkpoints (adapter_contract_profile_ref, provider_correlation_ref)
  WHERE provider_correlation_ref IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_idempotency_collision_review_requires_review_ref
BEFORE INSERT ON idempotency_records
FOR EACH ROW
WHEN NEW.decision_class = 'collision_review' AND NEW.collision_review_ref IS NULL
BEGIN
  SELECT RAISE(ABORT, 'COLLISION_REVIEW_REQUIRES_REFERENCE');
END;

COMMIT;
