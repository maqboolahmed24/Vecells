-- par_144: Draft session lease and autosave substrate

CREATE TABLE IF NOT EXISTS draft_session_leases (
  lease_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  access_grant_ref TEXT NOT NULL,
  grant_scope_envelope_ref TEXT NOT NULL,
  lease_mode TEXT NOT NULL,
  lease_state TEXT NOT NULL,
  owner_actor_binding_state TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  audience_surface_runtime_binding_ref TEXT NOT NULL,
  release_approval_freeze_ref TEXT NOT NULL,
  channel_release_freeze_state TEXT NOT NULL,
  manifest_version_ref TEXT NOT NULL,
  session_epoch_ref TEXT NULL,
  subject_binding_version_ref TEXT NULL,
  subject_ref TEXT NULL,
  lease_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  governing_envelope_version INTEGER NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  superseded_at TEXT NULL,
  superseded_by_lease_ref TEXT NULL,
  release_reason TEXT NULL,
  recovery_record_ref TEXT NULL,
  version INTEGER NOT NULL,
  CONSTRAINT draft_session_leases_unique_live_epoch UNIQUE (draft_public_id, lease_epoch)
);

CREATE TABLE IF NOT EXISTS draft_mutation_records (
  mutation_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  lease_ref TEXT NOT NULL,
  client_command_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  mutation_kind TEXT NOT NULL,
  draft_version_before INTEGER NOT NULL,
  draft_version_after INTEGER NOT NULL,
  payload_hash TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CONSTRAINT draft_mutation_records_unique_idempotency UNIQUE (envelope_ref, idempotency_key),
  CONSTRAINT draft_mutation_records_unique_client_command UNIQUE (envelope_ref, client_command_id)
);

CREATE TABLE IF NOT EXISTS draft_save_settlements (
  settlement_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  mutation_ref TEXT NOT NULL,
  lease_ref TEXT NOT NULL,
  ack_state TEXT NOT NULL,
  authoritative_draft_version INTEGER NOT NULL,
  continuity_projection_ref TEXT NULL,
  merge_plan_ref TEXT NULL,
  recovery_record_ref TEXT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS draft_merge_plans (
  merge_plan_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  merge_state TEXT NOT NULL,
  opened_by_lease_ref TEXT NOT NULL,
  opened_by_mutation_ref TEXT NULL,
  expected_draft_version INTEGER NOT NULL,
  actual_draft_version INTEGER NOT NULL,
  opened_at TEXT NOT NULL,
  resolved_at TEXT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS draft_recovery_records (
  recovery_record_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  lease_ref TEXT NULL,
  source_mutation_ref TEXT NULL,
  recovery_reason TEXT NOT NULL,
  recovery_state TEXT NOT NULL,
  same_shell_recovery_route_ref TEXT NOT NULL,
  request_public_id TEXT NULL,
  promoted_request_ref TEXT NULL,
  continuity_projection_ref TEXT NULL,
  recorded_at TEXT NOT NULL,
  resolved_at TEXT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS draft_continuity_evidence_projections (
  projection_id TEXT PRIMARY KEY,
  envelope_ref TEXT NOT NULL,
  draft_public_id TEXT NOT NULL,
  access_grant_ref TEXT NOT NULL,
  active_lease_ref TEXT NULL,
  continuity_state TEXT NOT NULL,
  quiet_status_state TEXT NOT NULL,
  same_shell_recovery_state TEXT NOT NULL,
  last_saved_at TEXT NOT NULL,
  authoritative_draft_version INTEGER NOT NULL,
  latest_mutation_ref TEXT NULL,
  latest_settlement_ref TEXT NULL,
  latest_merge_plan_ref TEXT NULL,
  latest_recovery_record_ref TEXT NULL,
  projection_hash TEXT NOT NULL,
  version INTEGER NOT NULL,
  CONSTRAINT draft_continuity_unique_public_id UNIQUE (draft_public_id),
  CONSTRAINT draft_continuity_unique_envelope UNIQUE (envelope_ref)
);
