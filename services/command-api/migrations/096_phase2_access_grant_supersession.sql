-- Phase 2 canonical AccessGrantService persistence.
-- Every redeemable grant carries an immutable AccessGrantScopeEnvelope.
-- Every terminal redemption writes AccessGrantRedemptionRecord.
-- Every replacement, revocation, rotation, privilege change, or claim cleanup writes AccessGrantSupersessionRecord.

CREATE TABLE IF NOT EXISTS phase2_access_grant_scope_envelopes (
  scope_envelope_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  grant_family TEXT NOT NULL CHECK (
    grant_family IN (
      'draft_resume_minimal',
      'public_status_minimal',
      'claim_step_up',
      'continuation_seeded_verified',
      'continuation_challenge',
      'support_recovery_minimal',
      'transaction_action_minimal'
    )
  ),
  action_scope TEXT NOT NULL,
  route_family TEXT NOT NULL,
  governing_object_ref TEXT,
  governing_object_version_ref TEXT,
  session_epoch_ref TEXT,
  subject_binding_version_ref TEXT,
  lineage_fence_ref TEXT,
  route_intent_binding_ref TEXT,
  release_approval_freeze_ref TEXT,
  manifest_version_ref TEXT,
  channel_posture TEXT,
  embedded_posture TEXT,
  audience_scope TEXT,
  visibility_scope TEXT,
  lineage_kind TEXT NOT NULL,
  lineage_ref TEXT NOT NULL,
  phi_exposure_class TEXT NOT NULL,
  recovery_route_ref TEXT,
  expires_at TEXT NOT NULL,
  supersession_state TEXT NOT NULL CHECK (supersession_state = 'live'),
  redemption_state TEXT NOT NULL CHECK (redemption_state = 'unredeemed'),
  scope_hash TEXT NOT NULL,
  immutable_scope_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'AccessGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_access_grants (
  grant_ref TEXT PRIMARY KEY,
  issue_idempotency_key TEXT NOT NULL UNIQUE,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  grant_family TEXT NOT NULL,
  grant_state TEXT NOT NULL,
  replay_policy TEXT NOT NULL,
  grant_scope_envelope_ref TEXT NOT NULL REFERENCES phase2_access_grant_scope_envelopes(scope_envelope_ref),
  token_hash TEXT NOT NULL UNIQUE,
  subject_ref TEXT,
  issued_by TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  supersedes_grant_ref TEXT,
  superseded_by_grant_ref TEXT,
  current_redemption_ref TEXT,
  latest_supersession_ref TEXT,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'AccessGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_access_grant_redemptions (
  redemption_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  grant_ref TEXT REFERENCES phase2_access_grants(grant_ref),
  grant_scope_envelope_ref TEXT REFERENCES phase2_access_grant_scope_envelopes(scope_envelope_ref),
  token_hash TEXT NOT NULL,
  decision TEXT NOT NULL,
  terminal BOOLEAN NOT NULL CHECK (terminal = TRUE),
  route_tuple_hash TEXT,
  scope_authorization_ref TEXT,
  recovery_route_ref TEXT,
  same_lineage_recovery_available BOOLEAN NOT NULL,
  actor_ref TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'AccessGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_access_grant_supersessions (
  supersession_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  predecessor_grant_ref TEXT NOT NULL REFERENCES phase2_access_grants(grant_ref),
  successor_grant_ref TEXT REFERENCES phase2_access_grants(grant_ref),
  cause_class TEXT NOT NULL,
  supersession_state TEXT NOT NULL,
  route_intent_binding_ref TEXT,
  session_epoch_ref TEXT,
  subject_binding_version_ref TEXT,
  lineage_fence_ref TEXT,
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'AccessGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_claim_redemption_settlements (
  claim_settlement_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  public_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  grant_redemption_ref TEXT REFERENCES phase2_access_grant_redemptions(redemption_ref),
  binding_authority_settlement_ref TEXT,
  binding_version_ref TEXT,
  rotated_session_epoch_ref TEXT,
  command_action_ref TEXT,
  command_settlement_ref TEXT,
  recovery_route_ref TEXT,
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'AccessGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_secure_link_session_projections (
  projection_ref TEXT PRIMARY KEY,
  grant_ref TEXT NOT NULL REFERENCES phase2_access_grants(grant_ref),
  session_epoch_ref TEXT,
  subject_binding_version_ref TEXT,
  route_intent_binding_ref TEXT,
  same_shell_recovery_route_ref TEXT,
  projection_state TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase2_access_grants_token_hash
  ON phase2_access_grants(token_hash);

CREATE INDEX IF NOT EXISTS idx_phase2_access_grant_redemptions_token_hash
  ON phase2_access_grant_redemptions(token_hash);

CREATE INDEX IF NOT EXISTS idx_phase2_claim_redemption_public_id
  ON phase2_claim_redemption_settlements(public_id);
