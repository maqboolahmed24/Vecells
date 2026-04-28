-- Phase 2 telephony SMS continuation grants (prompt 192)
-- TelephonyContinuationGrantService records eligibility, non-redeemable context,
-- masked dispatch manifests, exact-once redemption outcomes, recovery
-- continuation envelopes, and secure-link session projections. Canonical
-- AccessGrant rows remain owned by AccessGrantService tables from migration 096.

CREATE TABLE IF NOT EXISTS phase2_telephony_continuation_eligibilities (
  telephony_continuation_eligibility_ref TEXT PRIMARY KEY,
  decision_idempotency_key TEXT NOT NULL UNIQUE,
  schema_version TEXT NOT NULL CHECK (schema_version = '192.phase2.telephony-continuation.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-telephony-continuation-grants-192.v1'),
  call_session_ref TEXT NOT NULL,
  evidence_readiness_assessment_ref TEXT NOT NULL,
  identity_confidence_ref TEXT,
  destination_confidence_ref TEXT,
  verification_decision_ref TEXT,
  grant_family_recommendation TEXT NOT NULL CHECK (
    grant_family_recommendation IN (
      'continuation_seeded_verified',
      'continuation_challenge',
      'manual_only'
    )
  ),
  lineage_scope TEXT NOT NULL CHECK (
    lineage_scope IN ('same_submission_envelope', 'same_request_lineage', 'none')
  ),
  eligibility_state TEXT NOT NULL CHECK (
    eligibility_state IN ('not_eligible', 'eligible_seeded', 'eligible_challenge', 'manual_only')
  ),
  route_family_ref TEXT,
  action_scope TEXT,
  request_seed_ref TEXT,
  downgrade_reason_codes JSONB NOT NULL,
  reason_codes JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by = 'TelephonyContinuationGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_continuation_contexts (
  continuation_context_ref TEXT PRIMARY KEY,
  issuance_idempotency_key TEXT NOT NULL UNIQUE,
  schema_version TEXT NOT NULL CHECK (schema_version = '192.phase2.telephony-continuation.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-telephony-continuation-grants-192.v1'),
  call_session_ref TEXT NOT NULL,
  context_state TEXT NOT NULL CHECK (
    context_state IN (
      'pending',
      'grant_issued',
      'no_grant_manual_only',
      'consumed',
      'superseded',
      'expired'
    )
  ),
  target_channel TEXT NOT NULL CHECK (target_channel IN ('sms', 'support_callback', 'none')),
  phone_number_hash TEXT,
  requested_grant_family TEXT NOT NULL CHECK (
    requested_grant_family IN (
      'continuation_seeded_verified',
      'continuation_challenge',
      'manual_only'
    )
  ),
  capability_ceiling TEXT NOT NULL CHECK (
    capability_ceiling IN (
      'minimal_detail_entry',
      'challenge_before_disclosure',
      'manual_only_no_disclosure'
    )
  ),
  current_readiness_verdict JSONB NOT NULL,
  evidence_readiness_assessment_ref TEXT NOT NULL,
  continuation_eligibility_ref TEXT NOT NULL,
  lineage_scope TEXT NOT NULL,
  request_seed_ref TEXT,
  route_family_ref TEXT,
  action_scope TEXT NOT NULL,
  authority_settled_binding_fence JSONB NOT NULL,
  manifest_version_ref TEXT,
  release_approval_freeze_ref TEXT,
  minimum_bridge_capabilities_ref TEXT,
  channel_release_freeze_state TEXT NOT NULL,
  grant_fence_state TEXT NOT NULL,
  access_grant_ref TEXT,
  scope_envelope_ref TEXT,
  supersedes_context_ref TEXT,
  reason_codes JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  recorded_by TEXT NOT NULL CHECK (recorded_by = 'TelephonyContinuationGrantService')
);

CREATE INDEX IF NOT EXISTS phase2_tel_cont_context_current_idx
  ON phase2_telephony_continuation_contexts (call_session_ref, issued_at DESC);

CREATE INDEX IF NOT EXISTS phase2_tel_cont_context_grant_idx
  ON phase2_telephony_continuation_contexts (access_grant_ref)
  WHERE access_grant_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS phase2_telephony_continuation_message_manifests (
  message_manifest_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '192.phase2.telephony-continuation.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-telephony-continuation-message-mask-192.v1'),
  continuation_context_ref TEXT NOT NULL,
  grant_family TEXT NOT NULL CHECK (
    grant_family IN ('continuation_seeded_verified', 'continuation_challenge')
  ),
  template_ref TEXT NOT NULL,
  body_copy_code TEXT NOT NULL,
  body_preview TEXT NOT NULL,
  contains_phi BOOLEAN NOT NULL CHECK (contains_phi = FALSE),
  includes_signed_url BOOLEAN NOT NULL CHECK (includes_signed_url = FALSE),
  link_placeholder_ref TEXT NOT NULL,
  reason_codes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by = 'TelephonyContinuationGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_continuation_dispatch_intents (
  dispatch_intent_ref TEXT PRIMARY KEY,
  dispatch_idempotency_key TEXT NOT NULL UNIQUE,
  schema_version TEXT NOT NULL CHECK (schema_version = '192.phase2.telephony-continuation.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-telephony-continuation-grants-192.v1'),
  call_session_ref TEXT NOT NULL,
  continuation_context_ref TEXT NOT NULL,
  access_grant_ref TEXT,
  message_manifest_ref TEXT,
  grant_family TEXT NOT NULL,
  dispatch_outcome TEXT NOT NULL CHECK (
    dispatch_outcome IN ('queued', 'no_redeemable_grant', 'manual_followup')
  ),
  target_channel TEXT NOT NULL CHECK (target_channel IN ('sms', 'support_callback', 'none')),
  destination_hash TEXT,
  masked_destination TEXT,
  no_phi_body BOOLEAN NOT NULL CHECK (no_phi_body = TRUE),
  signed_url_materialized_in_manifest BOOLEAN NOT NULL CHECK (
    signed_url_materialized_in_manifest = FALSE
  ),
  provider_delivery_ref TEXT,
  reason_codes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by = 'TelephonyContinuationGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_recovery_continuation_envelopes (
  recovery_continuation_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '192.phase2.telephony-continuation.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-telephony-continuation-recovery-192.v1'),
  continuation_context_ref TEXT NOT NULL,
  call_session_ref TEXT NOT NULL,
  lineage_scope TEXT NOT NULL,
  route_family_ref TEXT,
  route_intent_ref TEXT,
  resume_object_ref TEXT,
  request_seed_ref TEXT,
  return_contract_ref TEXT NOT NULL,
  patient_shell_consistency_ref TEXT NOT NULL,
  shell_continuity_key TEXT NOT NULL,
  selected_mobile_step TEXT NOT NULL,
  patient_action_recovery_envelope_ref TEXT,
  same_shell_required BOOLEAN NOT NULL CHECK (same_shell_required = TRUE),
  recovery_reason_code TEXT NOT NULL,
  recovery_tuple_hash TEXT NOT NULL,
  reason_codes JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by = 'TelephonyContinuationGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_secure_link_session_projections (
  projection_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '192.phase2.telephony-continuation.v1'),
  continuation_context_ref TEXT NOT NULL,
  access_grant_ref TEXT NOT NULL,
  grant_redemption_ref TEXT NOT NULL UNIQUE,
  secure_link_session_ref TEXT NOT NULL UNIQUE,
  session_epoch_ref TEXT NOT NULL,
  csrf_secret_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT,
  disclosure_posture TEXT NOT NULL CHECK (
    disclosure_posture IN ('seeded_verified', 'challenge_minimal', 'recovery_only')
  ),
  patient_data_disclosure_allowed BOOLEAN NOT NULL,
  url_grant_reusable BOOLEAN NOT NULL CHECK (url_grant_reusable = FALSE),
  reason_codes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by = 'TelephonyContinuationGrantService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_continuation_redemption_outcomes (
  continuation_redemption_outcome_ref TEXT PRIMARY KEY,
  redemption_idempotency_key TEXT NOT NULL UNIQUE,
  schema_version TEXT NOT NULL CHECK (schema_version = '192.phase2.telephony-continuation.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-telephony-continuation-grants-192.v1'),
  call_session_ref TEXT NOT NULL,
  continuation_context_ref TEXT,
  access_grant_ref TEXT,
  grant_redemption_ref TEXT UNIQUE,
  redemption_state TEXT NOT NULL CHECK (
    redemption_state IN (
      'session_established',
      'replay_returned',
      'step_up_interrupted',
      'stale_link_recovery',
      'superseded_recovery',
      'denied'
    )
  ),
  replayed BOOLEAN NOT NULL,
  secure_link_session_ref TEXT,
  secure_link_session_projection_ref TEXT,
  recovery_continuation_ref TEXT,
  route_intent_binding_ref TEXT,
  csrf_secret_ref TEXT,
  grant_token_reuse_blocked BOOLEAN NOT NULL CHECK (grant_token_reuse_blocked = TRUE),
  reason_codes JSONB NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by = 'TelephonyContinuationGrantService')
);
