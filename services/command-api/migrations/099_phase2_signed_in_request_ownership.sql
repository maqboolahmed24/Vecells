-- Phase 2 par_184: signed-in request ownership and authority-derived patient-ref lineage.

CREATE TABLE IF NOT EXISTS phase2_request_lineage_ownership (
  request_lineage_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  draft_public_id TEXT NOT NULL UNIQUE,
  request_ref TEXT UNIQUE,
  submission_envelope_ref TEXT NOT NULL,
  continuity_shell_ref TEXT NOT NULL,
  continuity_anchor_ref TEXT NOT NULL,
  request_shell_ref TEXT NOT NULL,
  episode_ref TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('draft', 'submitted', 'promoted', 'episode_opened')),
  current_subject_ref TEXT,
  current_owner_subject_ref TEXT,
  subject_binding_version_ref TEXT,
  session_ref TEXT,
  session_epoch_ref TEXT,
  route_intent_binding_ref TEXT NOT NULL,
  lineage_fence_ref TEXT NOT NULL,
  ownership_posture TEXT NOT NULL CHECK (
    ownership_posture IN (
      'anonymous_public',
      'claim_pending',
      'read_only_authenticated',
      'owned_authenticated',
      'recovery_only'
    )
  ),
  writable_authority_state TEXT NOT NULL CHECK (
    writable_authority_state IN ('none', 'auth_read_only', 'claim_pending', 'writable')
  ),
  patient_ref_derivation_state TEXT NOT NULL CHECK (
    patient_ref_derivation_state IN ('not_derived', 'derived_in_authority_transaction')
  ),
  request_patient_ref TEXT,
  episode_patient_ref TEXT,
  authority_settlement_ref TEXT,
  reason_codes_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'SignedInRequestOwnershipService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_signed_in_request_starts (
  signed_in_request_start_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_lineage_ref TEXT NOT NULL REFERENCES phase2_request_lineage_ownership(request_lineage_ref),
  draft_public_id TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  session_ref TEXT NOT NULL,
  session_epoch_ref TEXT NOT NULL,
  subject_binding_version_ref TEXT NOT NULL,
  start_mode TEXT NOT NULL CHECK (start_mode IN ('already_claimed', 'claim_pending', 'read_only')),
  route_continuity_target TEXT NOT NULL CHECK (route_continuity_target = 'same_draft_shell'),
  reason_codes_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'SignedInRequestOwnershipService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_authenticated_ownership_attachments (
  attachment_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_lineage_ref TEXT NOT NULL REFERENCES phase2_request_lineage_ownership(request_lineage_ref),
  draft_public_id TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  decision_state TEXT NOT NULL CHECK (
    decision_state IN (
      'attached',
      'claimed',
      'uplifted',
      'recover_only',
      'claim_pending',
      'step_up_required',
      'denied'
    )
  ),
  preserved_submission_envelope_ref TEXT NOT NULL,
  preserved_continuity_shell_ref TEXT NOT NULL,
  preserved_continuity_anchor_ref TEXT NOT NULL,
  authority_settlement_ref TEXT,
  access_grant_supersession_refs_json TEXT NOT NULL,
  rotated_session_epoch_ref TEXT,
  route_continuity_target TEXT NOT NULL CHECK (
    route_continuity_target IN (
      'same_draft_shell',
      'same_request_shell',
      'recovery_shell',
      'claim_pending_shell'
    )
  ),
  reason_codes_json TEXT NOT NULL,
  attached_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'SignedInRequestOwnershipService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_authority_patient_ref_derivation_settlements (
  derivation_settlement_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_lineage_ref TEXT NOT NULL REFERENCES phase2_request_lineage_ownership(request_lineage_ref),
  request_ref TEXT,
  episode_ref TEXT,
  subject_ref TEXT NOT NULL,
  authority_settlement_ref TEXT NOT NULL,
  previous_subject_binding_version_ref TEXT,
  next_subject_binding_version_ref TEXT NOT NULL,
  previous_request_patient_ref TEXT,
  next_request_patient_ref TEXT,
  previous_episode_patient_ref TEXT,
  next_episode_patient_ref TEXT,
  transaction_boundary TEXT NOT NULL CHECK (
    transaction_boundary = 'identity_binding_authority_request_episode_patient_refs'
  ),
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'SignedInRequestOwnershipService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_authenticated_uplift_mappings (
  uplift_mapping_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_lineage_ref TEXT REFERENCES phase2_request_lineage_ownership(request_lineage_ref),
  draft_public_id TEXT,
  request_ref TEXT NOT NULL UNIQUE,
  request_shell_ref TEXT NOT NULL,
  episode_ref TEXT,
  subject_ref TEXT NOT NULL,
  decision_state TEXT NOT NULL CHECK (
    decision_state IN (
      'attached',
      'claimed',
      'uplifted',
      'recover_only',
      'claim_pending',
      'step_up_required',
      'denied'
    )
  ),
  route_continuity_target TEXT NOT NULL CHECK (
    route_continuity_target IN (
      'same_draft_shell',
      'same_request_shell',
      'recovery_shell',
      'claim_pending_shell'
    )
  ),
  duplicate_promotion_replay INTEGER NOT NULL CHECK (duplicate_promotion_replay IN (0, 1)),
  cloned_request_created INTEGER NOT NULL CHECK (cloned_request_created = 0),
  authority_settlement_ref TEXT,
  reason_codes_json TEXT NOT NULL,
  mapped_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'SignedInRequestOwnershipService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_ownership_drift_fences (
  drift_fence_ref TEXT PRIMARY KEY,
  request_lineage_ref TEXT REFERENCES phase2_request_lineage_ownership(request_lineage_ref),
  draft_public_id TEXT,
  request_ref TEXT,
  subject_ref TEXT NOT NULL,
  drift_type TEXT NOT NULL CHECK (
    drift_type IN (
      'stale_session',
      'stale_binding',
      'subject_switch',
      'route_intent_tuple_drift',
      'lineage_fence_drift'
    )
  ),
  expected_ref TEXT,
  observed_ref TEXT,
  decision_state TEXT NOT NULL CHECK (
    decision_state IN ('recover_only', 'claim_pending', 'step_up_required', 'denied')
  ),
  route_continuity_target TEXT NOT NULL CHECK (
    route_continuity_target IN ('recovery_shell', 'claim_pending_shell')
  ),
  reason_codes_json TEXT NOT NULL,
  fenced_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'SignedInRequestOwnershipService'
  )
);

CREATE TABLE IF NOT EXISTS phase2_request_ownership_events (
  event_ref TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  request_lineage_ref TEXT REFERENCES phase2_request_lineage_ownership(request_lineage_ref),
  occurred_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (
    created_by_authority = 'SignedInRequestOwnershipService'
  )
);

CREATE INDEX IF NOT EXISTS idx_phase2_request_ownership_request_ref
  ON phase2_request_lineage_ownership(request_ref);

CREATE INDEX IF NOT EXISTS idx_phase2_request_ownership_draft_public_id
  ON phase2_request_lineage_ownership(draft_public_id);

CREATE INDEX IF NOT EXISTS idx_phase2_request_ownership_binding_version
  ON phase2_request_lineage_ownership(subject_binding_version_ref);

CREATE INDEX IF NOT EXISTS idx_phase2_request_ownership_lineage_fence
  ON phase2_request_lineage_ownership(lineage_fence_ref);

CREATE INDEX IF NOT EXISTS idx_phase2_uplift_request_ref
  ON phase2_authenticated_uplift_mappings(request_ref);
