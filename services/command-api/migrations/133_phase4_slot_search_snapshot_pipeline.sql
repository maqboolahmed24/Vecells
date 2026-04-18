BEGIN;

CREATE TABLE IF NOT EXISTS phase4_slot_search_sessions (
  slot_search_session_id TEXT PRIMARY KEY,
  booking_case_id TEXT NOT NULL REFERENCES phase4_booking_cases (booking_case_id),
  case_version_ref TEXT NOT NULL,
  search_policy_ref TEXT NOT NULL REFERENCES phase4_search_policies (policy_id),
  policy_bundle_hash TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL REFERENCES phase4_booking_provider_adapter_bindings (booking_provider_adapter_binding_id),
  provider_adapter_binding_hash TEXT NOT NULL,
  capability_resolution_ref TEXT NOT NULL REFERENCES phase4_booking_capability_resolutions (booking_capability_resolution_id),
  capability_tuple_hash TEXT NOT NULL,
  selection_audience TEXT NOT NULL CHECK (selection_audience IN ('patient', 'staff')),
  requested_action_scope TEXT NOT NULL CHECK (requested_action_scope = 'search_slots'),
  route_intent_binding_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  provider_search_slice_refs_json TEXT NOT NULL,
  slot_set_snapshot_ref TEXT NOT NULL,
  coverage_state TEXT NOT NULL CHECK (
    coverage_state IN ('complete', 'partial_coverage', 'timeout', 'degraded', 'failed')
  ),
  query_envelope_json TEXT NOT NULL,
  temporal_normalization_envelope_ref TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_slot_search_sessions_booking_scope
  ON phase4_slot_search_sessions (booking_case_id, selection_audience, created_at);

CREATE TABLE IF NOT EXISTS phase4_provider_search_slices (
  provider_search_slice_id TEXT PRIMARY KEY,
  slot_search_session_ref TEXT NOT NULL REFERENCES phase4_slot_search_sessions (slot_search_session_id),
  supplier_ref TEXT NOT NULL,
  query_fingerprint TEXT NOT NULL,
  supplier_window_ref TEXT,
  provider_adapter_binding_ref TEXT NOT NULL REFERENCES phase4_booking_provider_adapter_bindings (booking_provider_adapter_binding_id),
  search_window_start_at TEXT NOT NULL,
  search_window_end_at TEXT NOT NULL,
  fetch_started_at TEXT NOT NULL,
  fetch_completed_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  coverage_state TEXT NOT NULL CHECK (
    coverage_state IN ('complete', 'partial_coverage', 'timeout', 'degraded', 'failed')
  ),
  partial_reason_code TEXT,
  source_version_ref TEXT,
  degradation_reason_refs_json TEXT NOT NULL,
  returned_raw_count INTEGER NOT NULL CHECK (returned_raw_count >= 0),
  normalized_count INTEGER NOT NULL CHECK (normalized_count >= 0),
  deduplicated_count INTEGER NOT NULL CHECK (deduplicated_count >= 0),
  filtered_count INTEGER NOT NULL CHECK (filtered_count >= 0),
  surfaced_count INTEGER NOT NULL CHECK (surfaced_count >= 0),
  raw_payload_ref TEXT NOT NULL,
  raw_payload_checksum TEXT NOT NULL,
  reject_reason_counters_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_provider_search_slices_session
  ON phase4_provider_search_slices (slot_search_session_ref, supplier_ref, coverage_state);

CREATE TABLE IF NOT EXISTS phase4_temporal_normalization_envelopes (
  temporal_normalization_envelope_id TEXT PRIMARY KEY,
  slot_search_session_ref TEXT NOT NULL REFERENCES phase4_slot_search_sessions (slot_search_session_id),
  source_time_zone TEXT NOT NULL,
  display_time_zone TEXT NOT NULL,
  clock_skew_milliseconds INTEGER NOT NULL,
  ambiguous_local_time_policy TEXT NOT NULL,
  normalization_version_ref TEXT NOT NULL,
  dst_boundary_refs_json TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase4_slot_set_snapshots (
  slot_set_snapshot_id TEXT PRIMARY KEY,
  search_session_id TEXT NOT NULL REFERENCES phase4_slot_search_sessions (slot_search_session_id),
  search_policy_ref TEXT NOT NULL REFERENCES phase4_search_policies (policy_id),
  case_version_ref TEXT NOT NULL,
  policy_bundle_hash TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL REFERENCES phase4_booking_provider_adapter_bindings (booking_provider_adapter_binding_id),
  provider_adapter_binding_hash TEXT NOT NULL,
  capability_resolution_ref TEXT NOT NULL REFERENCES phase4_booking_capability_resolutions (booking_capability_resolution_id),
  capability_tuple_hash TEXT NOT NULL,
  slot_count INTEGER NOT NULL CHECK (slot_count >= 0),
  candidate_count INTEGER NOT NULL CHECK (candidate_count >= 0),
  snapshot_checksum TEXT NOT NULL,
  candidate_index_ref TEXT NOT NULL,
  filter_plan_version TEXT NOT NULL,
  rank_plan_version TEXT NOT NULL,
  coverage_state TEXT NOT NULL CHECK (
    coverage_state IN ('complete', 'partial_coverage', 'timeout', 'degraded', 'failed')
  ),
  recovery_state_ref TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_slot_set_snapshots_search_session
  ON phase4_slot_set_snapshots (search_session_id, fetched_at);

CREATE TABLE IF NOT EXISTS phase4_canonical_slot_identities (
  canonical_slot_identity_id TEXT PRIMARY KEY,
  slot_set_snapshot_ref TEXT NOT NULL REFERENCES phase4_slot_set_snapshots (slot_set_snapshot_id),
  supplier_ref TEXT NOT NULL,
  supplier_slot_ref TEXT,
  capacity_unit_ref TEXT NOT NULL,
  schedule_ref TEXT NOT NULL,
  location_ref TEXT NOT NULL,
  practitioner_ref TEXT NOT NULL,
  service_ref TEXT NOT NULL,
  slot_start_at_epoch INTEGER NOT NULL,
  slot_end_at_epoch INTEGER NOT NULL,
  modality TEXT NOT NULL,
  bookability_mode TEXT NOT NULL CHECK (
    bookability_mode IN ('patient_self_service', 'staff_assist_only', 'dual', 'view_only')
  ),
  schedule_owner_ref TEXT NOT NULL,
  inventory_lineage_ref TEXT NOT NULL,
  canonical_tie_break_key TEXT NOT NULL,
  identity_strength TEXT NOT NULL,
  source_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_canonical_slot_identities_snapshot
  ON phase4_canonical_slot_identities (slot_set_snapshot_ref, canonical_tie_break_key);

CREATE TABLE IF NOT EXISTS phase4_normalized_slots (
  normalized_slot_id TEXT PRIMARY KEY,
  slot_set_snapshot_ref TEXT NOT NULL REFERENCES phase4_slot_set_snapshots (slot_set_snapshot_id),
  slot_search_session_ref TEXT NOT NULL REFERENCES phase4_slot_search_sessions (slot_search_session_id),
  slot_public_id TEXT NOT NULL,
  supplier_ref TEXT NOT NULL,
  supplier_slot_id TEXT NOT NULL,
  canonical_slot_identity_ref TEXT NOT NULL REFERENCES phase4_canonical_slot_identities (canonical_slot_identity_id),
  capacity_unit_ref TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  schedule_owner_ref TEXT NOT NULL,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  clinician_type TEXT NOT NULL,
  modality TEXT NOT NULL,
  service_ref TEXT NOT NULL,
  practitioner_ref TEXT NOT NULL,
  location_ref TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  start_at_epoch INTEGER NOT NULL,
  end_at_epoch INTEGER NOT NULL,
  local_day_key TEXT NOT NULL,
  display_time_zone TEXT NOT NULL,
  source_time_zone TEXT NOT NULL,
  temporal_normalization_envelope_ref TEXT NOT NULL REFERENCES phase4_temporal_normalization_envelopes (temporal_normalization_envelope_id),
  temporal_validity_state TEXT NOT NULL CHECK (
    temporal_validity_state IN (
      'valid',
      'ambiguous_local_time',
      'invalid_timestamp',
      'timezone_missing',
      'timezone_unresolvable'
    )
  ),
  dst_boundary_state TEXT NOT NULL CHECK (
    dst_boundary_state IN ('steady', 'adjacent_boundary', 'crosses_boundary', 'unknown')
  ),
  clock_skew_milliseconds INTEGER NOT NULL,
  bookable_until TEXT,
  continuity_score REAL NOT NULL,
  restrictions_json TEXT NOT NULL,
  accessibility_tags_json TEXT NOT NULL,
  bookability_mode TEXT NOT NULL CHECK (
    bookability_mode IN ('patient_self_service', 'staff_assist_only', 'dual', 'view_only')
  ),
  hard_filter_mask_json TEXT NOT NULL,
  rank_features_json TEXT NOT NULL,
  score_explanation_ref TEXT,
  canonical_tie_break_key TEXT NOT NULL,
  source_version TEXT,
  raw_payload_ref TEXT NOT NULL,
  raw_payload_checksum TEXT NOT NULL,
  source_slice_ref TEXT NOT NULL REFERENCES phase4_provider_search_slices (provider_search_slice_id)
);

CREATE INDEX IF NOT EXISTS idx_phase4_normalized_slots_snapshot
  ON phase4_normalized_slots (slot_set_snapshot_ref, local_day_key, start_at_epoch);

CREATE TABLE IF NOT EXISTS phase4_snapshot_candidate_indices (
  snapshot_candidate_index_id TEXT PRIMARY KEY,
  slot_set_snapshot_ref TEXT NOT NULL REFERENCES phase4_slot_set_snapshots (slot_set_snapshot_id),
  selection_audience TEXT NOT NULL CHECK (selection_audience IN ('patient', 'staff')),
  rank_plan_version TEXT NOT NULL,
  capacity_rank_proof_ref TEXT,
  ordered_slot_refs_json TEXT NOT NULL,
  day_buckets_json TEXT NOT NULL,
  aggregate_counters_json TEXT NOT NULL,
  page_size INTEGER NOT NULL CHECK (page_size > 0)
);

CREATE TABLE IF NOT EXISTS phase4_slot_snapshot_recovery_states (
  slot_snapshot_recovery_state_id TEXT PRIMARY KEY,
  slot_set_snapshot_ref TEXT NOT NULL REFERENCES phase4_slot_set_snapshots (slot_set_snapshot_id),
  view_state TEXT NOT NULL CHECK (
    view_state IN (
      'renderable',
      'partial_coverage',
      'stale_refresh_required',
      'no_supply_confirmed',
      'support_fallback'
    )
  ),
  coverage_state TEXT NOT NULL CHECK (
    coverage_state IN ('complete', 'partial_coverage', 'timeout', 'degraded', 'failed')
  ),
  anchor_day_key TEXT,
  reason_codes_json TEXT NOT NULL,
  support_help_visible INTEGER NOT NULL CHECK (support_help_visible IN (0, 1)),
  same_shell_action_ref TEXT,
  generated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_slot_snapshot_recovery_states_snapshot
  ON phase4_slot_snapshot_recovery_states (slot_set_snapshot_ref, generated_at);

COMMIT;
