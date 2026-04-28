BEGIN;

-- Phase 5 scope and visibility authority depends on the hub case kernel from
-- 143_phase5_hub_case_kernel.sql for ownership-fence reads during mutation preflight.

CREATE TABLE IF NOT EXISTS phase5_staff_identity_contexts (
  staff_identity_context_id TEXT PRIMARY KEY,
  staff_user_id TEXT NOT NULL UNIQUE,
  auth_provider TEXT NOT NULL CHECK (auth_provider = 'cis2'),
  home_organisation TEXT NOT NULL,
  affiliated_organisation_refs_json TEXT NOT NULL,
  tenant_grant_refs_json TEXT NOT NULL,
  active_organisation TEXT NOT NULL,
  rbac_claims_json TEXT NOT NULL,
  national_rbac_ref TEXT,
  local_role_refs_json TEXT NOT NULL,
  session_assurance TEXT NOT NULL CHECK (session_assurance IN ('aal2', 'aal3')),
  identity_state TEXT NOT NULL CHECK (
    identity_state IN ('authenticated', 'reauth_required', 'revoked')
  ),
  authenticated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_staff_identity_contexts_state
  ON phase5_staff_identity_contexts (identity_state, active_organisation);

CREATE TABLE IF NOT EXISTS phase5_acting_contexts (
  acting_context_id TEXT PRIMARY KEY,
  staff_identity_context_ref TEXT NOT NULL REFERENCES phase5_staff_identity_contexts (staff_identity_context_id),
  staff_user_id TEXT NOT NULL,
  home_practice_ods TEXT NOT NULL,
  active_organisation_ref TEXT NOT NULL,
  active_pcn_id TEXT,
  active_hub_site_id TEXT,
  tenant_scope_mode TEXT NOT NULL CHECK (
    tenant_scope_mode IN ('single_tenant', 'organisation_group', 'multi_tenant', 'platform')
  ),
  tenant_scope_refs_json TEXT NOT NULL,
  purpose_of_use TEXT NOT NULL CHECK (
    purpose_of_use IN (
      'direct_care_network_coordination',
      'direct_care_site_delivery',
      'practice_continuity',
      'supervisor_recovery',
      'break_glass_patient_safety'
    )
  ),
  acting_role_ref TEXT NOT NULL,
  audience_tier_ref TEXT NOT NULL CHECK (
    audience_tier_ref IN (
      'origin_practice_visibility',
      'hub_desk_visibility',
      'servicing_site_visibility'
    )
  ),
  visibility_coverage_ref TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  elevation_state TEXT NOT NULL CHECK (
    elevation_state IN ('none', 'requested', 'active', 'expiring', 'revoked')
  ),
  break_glass_state TEXT NOT NULL CHECK (
    break_glass_state IN ('none', 'requested', 'active', 'revoked')
  ),
  context_state TEXT NOT NULL CHECK (
    context_state IN ('current', 'stale', 'blocked', 'superseded')
  ),
  scope_tuple_hash TEXT NOT NULL,
  switch_generation INTEGER NOT NULL CHECK (switch_generation >= 0),
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_acting_contexts_user_state
  ON phase5_acting_contexts (staff_user_id, context_state, active_organisation_ref);

CREATE INDEX IF NOT EXISTS idx_phase5_acting_contexts_scope_hash
  ON phase5_acting_contexts (scope_tuple_hash);

CREATE TABLE IF NOT EXISTS phase5_acting_scope_tuples (
  acting_scope_tuple_id TEXT PRIMARY KEY,
  acting_context_ref TEXT NOT NULL REFERENCES phase5_acting_contexts (acting_context_id),
  staff_identity_context_ref TEXT NOT NULL REFERENCES phase5_staff_identity_contexts (staff_identity_context_id),
  staff_user_id TEXT NOT NULL,
  tuple_hash TEXT NOT NULL,
  active_organisation_ref TEXT NOT NULL,
  active_pcn_id TEXT,
  active_hub_site_id TEXT,
  tenant_scope_mode TEXT NOT NULL CHECK (
    tenant_scope_mode IN ('single_tenant', 'organisation_group', 'multi_tenant', 'platform')
  ),
  tenant_scope_refs_json TEXT NOT NULL,
  purpose_of_use TEXT NOT NULL CHECK (
    purpose_of_use IN (
      'direct_care_network_coordination',
      'direct_care_site_delivery',
      'practice_continuity',
      'supervisor_recovery',
      'break_glass_patient_safety'
    )
  ),
  acting_role_ref TEXT NOT NULL,
  audience_tier_ref TEXT NOT NULL CHECK (
    audience_tier_ref IN (
      'origin_practice_visibility',
      'hub_desk_visibility',
      'servicing_site_visibility'
    )
  ),
  visibility_coverage_ref TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  environment_ref TEXT NOT NULL,
  policy_plane_ref TEXT NOT NULL,
  switch_generation INTEGER NOT NULL CHECK (switch_generation >= 0),
  elevation_state TEXT NOT NULL CHECK (
    elevation_state IN ('none', 'requested', 'active', 'expiring', 'revoked')
  ),
  elevation_expires_at TEXT,
  break_glass_state TEXT NOT NULL CHECK (
    break_glass_state IN ('none', 'requested', 'active', 'revoked')
  ),
  break_glass_reason_code TEXT,
  break_glass_justification TEXT,
  break_glass_expires_at TEXT,
  tuple_state TEXT NOT NULL CHECK (
    tuple_state IN ('current', 'stale', 'blocked', 'superseded')
  ),
  issued_at TEXT NOT NULL,
  superseded_at TEXT,
  expires_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_acting_scope_tuples_context
  ON phase5_acting_scope_tuples (acting_context_ref, tuple_state, issued_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase5_acting_scope_tuples_hash_context
  ON phase5_acting_scope_tuples (acting_context_ref, tuple_hash, version);

CREATE TABLE IF NOT EXISTS phase5_cross_org_visibility_envelopes (
  cross_organisation_visibility_envelope_id TEXT PRIMARY KEY,
  acting_context_ref TEXT NOT NULL REFERENCES phase5_acting_contexts (acting_context_id),
  acting_scope_tuple_ref TEXT NOT NULL,
  source_organisation_ref TEXT NOT NULL,
  target_organisation_ref TEXT NOT NULL,
  audience_tier_ref TEXT NOT NULL CHECK (
    audience_tier_ref IN (
      'origin_practice_visibility',
      'hub_desk_visibility',
      'servicing_site_visibility'
    )
  ),
  purpose_of_use_ref TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  required_coverage_row_refs_json TEXT NOT NULL,
  visible_field_refs_json TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  envelope_state TEXT NOT NULL CHECK (
    envelope_state IN ('current', 'stale', 'blocked', 'superseded')
  ),
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_cross_org_visibility_envelopes_context
  ON phase5_cross_org_visibility_envelopes (
    acting_context_ref,
    audience_tier_ref,
    source_organisation_ref,
    target_organisation_ref,
    envelope_state
  );

CREATE TABLE IF NOT EXISTS phase5_scope_authority_audit_records (
  authority_evidence_record_id TEXT PRIMARY KEY,
  staff_identity_context_ref TEXT NOT NULL REFERENCES phase5_staff_identity_contexts (staff_identity_context_id),
  acting_context_ref TEXT NOT NULL REFERENCES phase5_acting_contexts (acting_context_id),
  acting_scope_tuple_ref TEXT NOT NULL,
  cross_organisation_visibility_envelope_ref TEXT,
  actor_identity TEXT NOT NULL,
  active_organisation_ref TEXT NOT NULL,
  purpose_of_use TEXT NOT NULL,
  acting_role_ref TEXT NOT NULL,
  break_glass_active INTEGER NOT NULL CHECK (break_glass_active IN (0, 1)),
  hub_case_id TEXT,
  command_scope TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allowed', 'denied', 'stale')),
  reason_code TEXT NOT NULL,
  failure_class TEXT NOT NULL CHECK (
    failure_class IN ('none', 'scope_drift', 'visibility_drift', 'lease_drift', 'ownership_drift')
  ),
  scope_drifted INTEGER NOT NULL CHECK (scope_drifted IN (0, 1)),
  visibility_drifted INTEGER NOT NULL CHECK (visibility_drifted IN (0, 1)),
  lease_drifted INTEGER NOT NULL CHECK (lease_drifted IN (0, 1)),
  ownership_drifted INTEGER NOT NULL CHECK (ownership_drifted IN (0, 1)),
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_scope_authority_audit_case
  ON phase5_scope_authority_audit_records (hub_case_id, decision, recorded_at);

CREATE INDEX IF NOT EXISTS idx_phase5_scope_authority_audit_context
  ON phase5_scope_authority_audit_records (acting_context_ref, version);

CREATE TABLE IF NOT EXISTS phase5_break_glass_audit_records (
  break_glass_audit_record_id TEXT PRIMARY KEY,
  acting_context_ref TEXT NOT NULL REFERENCES phase5_acting_contexts (acting_context_id),
  acting_scope_tuple_ref TEXT NOT NULL,
  staff_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('requested', 'activated', 'used', 'revoked')),
  reason_code TEXT NOT NULL,
  justification TEXT,
  route_family_ref TEXT,
  expires_at TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_break_glass_audit_context
  ON phase5_break_glass_audit_records (acting_context_ref, version);

COMMIT;
