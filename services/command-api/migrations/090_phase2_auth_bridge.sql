BEGIN;

CREATE TABLE IF NOT EXISTS auth_scope_bundles (
  scope_bundle_id TEXT PRIMARY KEY,
  requested_scopes_json TEXT NOT NULL,
  assurance_requirement TEXT NOT NULL,
  raw_claim_storage_rule TEXT NOT NULL CHECK (raw_claim_storage_rule = 'vault_reference_only'),
  offline_access_policy TEXT NOT NULL CHECK (offline_access_policy = 'offline_access_forbidden'),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_auth_return_intents (
  return_intent_id TEXT PRIMARY KEY,
  route_intent_binding_ref TEXT NOT NULL,
  lineage_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  subject_ref TEXT,
  binding_version_ref TEXT,
  session_epoch_ref TEXT,
  channel_manifest_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  allowed_next_surface TEXT NOT NULL,
  redirect_mode TEXT NOT NULL CHECK (redirect_mode = 'route_intent_binding_only'),
  stale_disposition TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_transactions (
  transaction_id TEXT PRIMARY KEY,
  provider_mode TEXT NOT NULL,
  flow TEXT NOT NULL CHECK (flow = 'server_authorization_code_pkce'),
  lifecycle TEXT NOT NULL,
  consumption_state TEXT NOT NULL,
  auth_scope_bundle_ref TEXT NOT NULL REFERENCES auth_scope_bundles(scope_bundle_id),
  post_auth_return_intent_ref TEXT NOT NULL REFERENCES post_auth_return_intents(return_intent_id),
  state_digest TEXT NOT NULL UNIQUE,
  nonce_digest TEXT NOT NULL,
  code_verifier_digest TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  provider_issuer TEXT NOT NULL,
  transaction_fence_epoch INTEGER NOT NULL,
  version INTEGER NOT NULL,
  callback_outcome TEXT NOT NULL,
  first_consumed_at TEXT,
  token_evidence_ref TEXT,
  settlement_ref TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_callback_settlements (
  settlement_id TEXT PRIMARY KEY,
  transaction_ref TEXT NOT NULL UNIQUE REFERENCES auth_transactions(transaction_id),
  outcome TEXT NOT NULL,
  lifecycle_after TEXT NOT NULL,
  consumption_state_after TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  evidence_vault_ref TEXT,
  binding_intent_ref TEXT,
  capability_intent_ref TEXT,
  session_governor_decision_ref TEXT,
  post_auth_return_intent_ref TEXT NOT NULL REFERENCES post_auth_return_intents(return_intent_id),
  replay_of_settlement_ref TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_provider_token_exchanges (
  exchange_id TEXT PRIMARY KEY,
  transaction_ref TEXT NOT NULL REFERENCES auth_transactions(transaction_id),
  provider_mode TEXT NOT NULL,
  outcome TEXT NOT NULL,
  provider_issuer TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_transactions_state_digest
  ON auth_transactions(state_digest);

CREATE INDEX IF NOT EXISTS idx_auth_transactions_callback_fence
  ON auth_transactions(transaction_id, version, consumption_state);

COMMIT;
