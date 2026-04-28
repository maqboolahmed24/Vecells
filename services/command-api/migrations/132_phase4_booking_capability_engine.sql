BEGIN;

CREATE TABLE IF NOT EXISTS phase4_provider_capability_matrix_rows (
  provider_capability_matrix_ref TEXT PRIMARY KEY,
  matrix_version_ref TEXT NOT NULL,
  row_owner_ref TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  practice_ref TEXT NOT NULL,
  organisation_ref TEXT NOT NULL,
  supplier_ref TEXT NOT NULL,
  supplier_label TEXT,
  integration_mode TEXT NOT NULL CHECK (
    integration_mode IN (
      'im1_patient_api',
      'im1_transaction_api',
      'gp_connect_existing',
      'local_gateway_component',
      'manual_assist_only'
    )
  ),
  deployment_type TEXT NOT NULL,
  assurance_state_ref TEXT NOT NULL,
  supported_action_scopes_json TEXT NOT NULL,
  capabilities_json TEXT NOT NULL,
  manage_capability_state TEXT NOT NULL CHECK (
    manage_capability_state IN ('full', 'partial', 'summary_only', 'none')
  ),
  reservation_mode TEXT NOT NULL CHECK (
    reservation_mode IN ('exclusive_hold', 'truthful_nonexclusive', 'degraded_manual_pending')
  ),
  authoritative_read_mode TEXT NOT NULL CHECK (
    authoritative_read_mode IN ('durable_provider_reference', 'read_after_write', 'gate_required')
  ),
  primary_dependency_degradation_profile_ref TEXT NOT NULL,
  authoritative_read_and_confirmation_policy_ref TEXT NOT NULL,
  search_normalization_contract_ref TEXT NOT NULL,
  revalidation_contract_ref TEXT NOT NULL,
  manage_support_contract_ref TEXT NOT NULL,
  contract_state TEXT NOT NULL CHECK (
    contract_state IN ('draft', 'active', 'superseded', 'withdrawn')
  ),
  published_at TEXT NOT NULL,
  row_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_provider_capability_matrix_selection
  ON phase4_provider_capability_matrix_rows (
    tenant_id,
    practice_ref,
    organisation_ref,
    supplier_ref,
    integration_mode,
    deployment_type,
    contract_state
  );

CREATE TABLE IF NOT EXISTS phase4_adapter_contract_profiles (
  adapter_contract_profile_id TEXT PRIMARY KEY,
  version_ref TEXT NOT NULL,
  label TEXT NOT NULL,
  integration_modes_json TEXT NOT NULL,
  carrier_protocol TEXT NOT NULL,
  may_own_operation_families_json TEXT NOT NULL,
  forbidden_core_semantics_json TEXT NOT NULL,
  confirmation_model TEXT NOT NULL,
  local_component_mode TEXT NOT NULL CHECK (local_component_mode IN ('none', 'required')),
  supplier_pack_posture TEXT NOT NULL,
  source_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase4_dependency_degradation_profiles (
  dependency_degradation_profile_id TEXT PRIMARY KEY,
  version_ref TEXT NOT NULL,
  label TEXT NOT NULL,
  dominant_capability_state TEXT NOT NULL CHECK (
    dominant_capability_state IN (
      'live_self_service',
      'live_staff_assist',
      'assisted_only',
      'linkage_required',
      'local_component_required',
      'degraded_manual',
      'recovery_only',
      'blocked'
    )
  ),
  fallback_action_refs_json TEXT NOT NULL,
  blocked_action_reason_codes_json TEXT NOT NULL,
  same_shell_posture TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase4_authoritative_read_confirmation_policies (
  authoritative_read_and_confirmation_policy_id TEXT PRIMARY KEY,
  version_ref TEXT NOT NULL,
  label TEXT NOT NULL,
  authoritative_read_mode TEXT NOT NULL CHECK (
    authoritative_read_mode IN ('durable_provider_reference', 'read_after_write', 'gate_required')
  ),
  confirmation_gate_mode TEXT NOT NULL,
  supports_async_commit_confirmation INTEGER NOT NULL CHECK (
    supports_async_commit_confirmation IN (0, 1)
  ),
  supports_dispute_recovery INTEGER NOT NULL CHECK (supports_dispute_recovery IN (0, 1)),
  accepted_processing_states_json TEXT NOT NULL,
  durable_proof_classes_json TEXT NOT NULL,
  pending_truth_states_json TEXT NOT NULL,
  disputed_truth_states_json TEXT NOT NULL,
  gate_required_states_json TEXT NOT NULL,
  manage_exposure_before_proof TEXT NOT NULL CHECK (
    manage_exposure_before_proof IN ('hidden', 'summary_only')
  ),
  patient_visibility_before_proof TEXT NOT NULL CHECK (
    patient_visibility_before_proof IN ('provisional_receipt', 'summary_only')
  ),
  source_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase4_booking_provider_adapter_bindings (
  booking_provider_adapter_binding_id TEXT PRIMARY KEY,
  provider_capability_matrix_ref TEXT NOT NULL REFERENCES phase4_provider_capability_matrix_rows (provider_capability_matrix_ref),
  matrix_version_ref TEXT NOT NULL,
  supplier_ref TEXT NOT NULL,
  integration_mode TEXT NOT NULL CHECK (
    integration_mode IN (
      'im1_patient_api',
      'im1_transaction_api',
      'gp_connect_existing',
      'local_gateway_component',
      'manual_assist_only'
    )
  ),
  deployment_type TEXT NOT NULL,
  action_scope_set_json TEXT NOT NULL,
  selection_audience_set_json TEXT NOT NULL,
  adapter_contract_profile_ref TEXT NOT NULL REFERENCES phase4_adapter_contract_profiles (adapter_contract_profile_id),
  dependency_degradation_profile_ref TEXT NOT NULL REFERENCES phase4_dependency_degradation_profiles (dependency_degradation_profile_id),
  search_normalization_contract_ref TEXT NOT NULL,
  temporal_normalization_contract_ref TEXT NOT NULL,
  revalidation_contract_ref TEXT NOT NULL,
  reservation_semantics TEXT NOT NULL CHECK (
    reservation_semantics IN ('exclusive_hold', 'truthful_nonexclusive', 'degraded_manual_pending')
  ),
  commit_contract_ref TEXT NOT NULL,
  authoritative_read_contract_ref TEXT NOT NULL,
  manage_support_contract_ref TEXT NOT NULL,
  authoritative_read_and_confirmation_policy_ref TEXT NOT NULL REFERENCES phase4_authoritative_read_confirmation_policies (authoritative_read_and_confirmation_policy_id),
  binding_hash TEXT NOT NULL,
  binding_state TEXT NOT NULL CHECK (
    binding_state IN ('live', 'recovery_only', 'blocked', 'superseded')
  ),
  binding_compilation_owner_rule TEXT NOT NULL,
  published_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_provider_adapter_bindings_selection
  ON phase4_booking_provider_adapter_bindings (
    provider_capability_matrix_ref,
    matrix_version_ref,
    integration_mode,
    deployment_type,
    binding_state
  );

CREATE TABLE IF NOT EXISTS phase4_booking_capability_resolutions (
  booking_capability_resolution_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_id TEXT,
  appointment_id TEXT,
  tenant_id TEXT NOT NULL,
  practice_ref TEXT NOT NULL,
  organisation_ref TEXT NOT NULL,
  supplier_ref TEXT NOT NULL,
  integration_mode TEXT NOT NULL CHECK (
    integration_mode IN (
      'im1_patient_api',
      'im1_transaction_api',
      'gp_connect_existing',
      'local_gateway_component',
      'manual_assist_only'
    )
  ),
  deployment_type TEXT NOT NULL,
  selection_audience TEXT NOT NULL CHECK (selection_audience IN ('patient', 'staff')),
  requested_action_scope TEXT NOT NULL,
  provider_capability_matrix_ref TEXT NOT NULL REFERENCES phase4_provider_capability_matrix_rows (provider_capability_matrix_ref),
  capability_matrix_version_ref TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL REFERENCES phase4_booking_provider_adapter_bindings (booking_provider_adapter_binding_id),
  provider_adapter_binding_hash TEXT NOT NULL,
  adapter_contract_profile_ref TEXT NOT NULL REFERENCES phase4_adapter_contract_profiles (adapter_contract_profile_id),
  dependency_degradation_profile_ref TEXT NOT NULL REFERENCES phase4_dependency_degradation_profiles (dependency_degradation_profile_id),
  authoritative_read_and_confirmation_policy_ref TEXT NOT NULL REFERENCES phase4_authoritative_read_confirmation_policies (authoritative_read_and_confirmation_policy_id),
  gp_linkage_checkpoint_ref TEXT,
  local_consumer_checkpoint_ref TEXT,
  prerequisite_state_json TEXT NOT NULL,
  route_tuple_json TEXT NOT NULL,
  governing_object_descriptor_ref TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  parent_anchor_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  capability_state TEXT NOT NULL CHECK (
    capability_state IN (
      'live_self_service',
      'live_staff_assist',
      'assisted_only',
      'linkage_required',
      'local_component_required',
      'degraded_manual',
      'recovery_only',
      'blocked'
    )
  ),
  allowed_action_scopes_json TEXT NOT NULL,
  blocked_action_reason_codes_json TEXT NOT NULL,
  fallback_action_refs_json TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase4_booking_capability_resolutions_tuple_hash
  ON phase4_booking_capability_resolutions (capability_tuple_hash);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_capability_resolutions_scope
  ON phase4_booking_capability_resolutions (
    booking_case_id,
    appointment_id,
    governing_object_descriptor_ref,
    governing_object_ref,
    selection_audience,
    requested_action_scope
  );

CREATE TABLE IF NOT EXISTS phase4_booking_capability_projections (
  booking_capability_projection_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  booking_case_id TEXT,
  appointment_id TEXT,
  booking_capability_resolution_ref TEXT NOT NULL REFERENCES phase4_booking_capability_resolutions (booking_capability_resolution_id),
  selection_audience TEXT NOT NULL CHECK (selection_audience IN ('patient', 'staff')),
  requested_action_scope TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL REFERENCES phase4_booking_provider_adapter_bindings (booking_provider_adapter_binding_id),
  capability_tuple_hash TEXT NOT NULL,
  surface_state TEXT NOT NULL CHECK (
    surface_state IN (
      'self_service_live',
      'staff_assist_live',
      'assisted_only',
      'linkage_required',
      'local_component_required',
      'degraded_manual',
      'recovery_required',
      'blocked'
    )
  ),
  dominant_capability_cue_code TEXT NOT NULL,
  control_state TEXT NOT NULL CHECK (control_state IN ('writable', 'read_only', 'blocked')),
  self_service_action_refs_json TEXT NOT NULL,
  assisted_action_refs_json TEXT NOT NULL,
  manage_action_refs_json TEXT NOT NULL,
  fallback_action_refs_json TEXT NOT NULL,
  blocked_action_reason_codes_json TEXT NOT NULL,
  exposed_action_scopes_json TEXT NOT NULL,
  parity_group_id TEXT NOT NULL,
  underlying_capability_state TEXT NOT NULL CHECK (
    underlying_capability_state IN (
      'live_self_service',
      'live_staff_assist',
      'assisted_only',
      'linkage_required',
      'local_component_required',
      'degraded_manual',
      'recovery_only',
      'blocked'
    )
  ),
  rendered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_booking_capability_projections_resolution
  ON phase4_booking_capability_projections (booking_capability_resolution_ref);

COMMIT;
