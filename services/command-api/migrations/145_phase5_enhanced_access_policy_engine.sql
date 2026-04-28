BEGIN;

-- Phase 5 Enhanced Access policy engine depends on the hub case kernel from
-- 143_phase5_hub_case_kernel.sql for durable hub-case references on evaluation rows.
-- It also depends on 144_phase5_staff_identity_acting_context_visibility.sql because
-- later policy-driven visibility and manage flows must bind the same fail-closed scope law.

CREATE TABLE IF NOT EXISTS phase5_hub_routing_policy_packs (
  routing_policy_pack_id TEXT PRIMARY KEY,
  pcn_ref TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('draft', 'active', 'superseded')),
  effective_at TEXT NOT NULL,
  effective_until TEXT,
  policy_tuple_hash TEXT NOT NULL,
  route_reason_code TEXT,
  routing_disposition TEXT NOT NULL CHECK (
    routing_disposition IN ('route_to_network', 'retain_local', 'bounce_back_urgent', 'blocked')
  ),
  eligible_site_refs_json TEXT NOT NULL,
  service_family_refs_json TEXT NOT NULL,
  source_namespace_refs_json TEXT NOT NULL,
  commissioner_approval_ref TEXT,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_routing_policy_active
  ON phase5_hub_routing_policy_packs (pcn_ref, policy_state, effective_at);

CREATE TABLE IF NOT EXISTS phase5_hub_variance_window_policies (
  variance_window_policy_id TEXT PRIMARY KEY,
  pcn_ref TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('draft', 'active', 'superseded')),
  effective_at TEXT NOT NULL,
  effective_until TEXT,
  policy_tuple_hash TEXT NOT NULL,
  required_window_rule TEXT NOT NULL,
  approved_variance_before_minutes INTEGER NOT NULL CHECK (approved_variance_before_minutes >= 0),
  approved_variance_after_minutes INTEGER NOT NULL CHECK (approved_variance_after_minutes >= 0),
  outside_window_visible_by_policy INTEGER NOT NULL CHECK (outside_window_visible_by_policy IN (0, 1)),
  variance_disposition TEXT NOT NULL CHECK (
    variance_disposition IN (
      'inside_required_window',
      'inside_approved_variance_window',
      'outside_window_visible_by_policy',
      'outside_window_blocked'
    )
  ),
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_variance_policy_active
  ON phase5_hub_variance_window_policies (pcn_ref, policy_state, effective_at);

CREATE TABLE IF NOT EXISTS phase5_hub_service_obligation_policies (
  service_obligation_policy_id TEXT PRIMARY KEY,
  pcn_ref TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('draft', 'active', 'superseded')),
  effective_at TEXT NOT NULL,
  effective_until TEXT,
  policy_tuple_hash TEXT NOT NULL,
  weekly_minutes_per_1000_adjusted_population INTEGER NOT NULL CHECK (
    weekly_minutes_per_1000_adjusted_population >= 0
  ),
  bank_holiday_make_up_window_hours INTEGER NOT NULL CHECK (bank_holiday_make_up_window_hours >= 0),
  comparable_offer_rule TEXT NOT NULL,
  ledger_mode TEXT NOT NULL CHECK (
    ledger_mode IN ('minutes_ledger_required', 'minutes_ledger_optional')
  ),
  service_obligation_disposition TEXT NOT NULL CHECK (
    service_obligation_disposition IN (
      'within_obligation',
      'make_up_required',
      'obligation_risk',
      'commissioner_exception_active'
    )
  ),
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_service_obligation_policy_active
  ON phase5_hub_service_obligation_policies (pcn_ref, policy_state, effective_at);

CREATE TABLE IF NOT EXISTS phase5_hub_practice_visibility_policies (
  practice_visibility_policy_id TEXT PRIMARY KEY,
  pcn_ref TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('draft', 'active', 'superseded')),
  effective_at TEXT NOT NULL,
  effective_until TEXT,
  policy_tuple_hash TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  origin_practice_visible_field_refs_json TEXT NOT NULL,
  hidden_field_refs_json TEXT NOT NULL,
  visibility_delta_rule TEXT NOT NULL,
  ack_generation_mode TEXT NOT NULL CHECK (
    ack_generation_mode IN ('generation_bound', 'generation_bound_with_exception')
  ),
  practice_visibility_disposition TEXT NOT NULL CHECK (
    practice_visibility_disposition IN (
      'standard_origin_visibility',
      'visibility_restricted',
      'ack_debt_open',
      'delta_required'
    )
  ),
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_practice_visibility_policy_active
  ON phase5_hub_practice_visibility_policies (pcn_ref, policy_state, effective_at);

CREATE TABLE IF NOT EXISTS phase5_hub_capacity_ingestion_policies (
  capacity_ingestion_policy_id TEXT PRIMARY KEY,
  pcn_ref TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('draft', 'active', 'superseded')),
  effective_at TEXT NOT NULL,
  effective_until TEXT,
  policy_tuple_hash TEXT NOT NULL,
  freshness_threshold_minutes INTEGER NOT NULL CHECK (freshness_threshold_minutes >= 0),
  stale_threshold_minutes INTEGER NOT NULL CHECK (stale_threshold_minutes >= 0),
  quarantine_triggers_json TEXT NOT NULL,
  degraded_triggers_json TEXT NOT NULL,
  duplicate_capacity_collision_policy TEXT NOT NULL,
  degraded_visibility_modes_json TEXT NOT NULL,
  patient_offerable_trust_states_json TEXT NOT NULL,
  direct_commit_trust_states_json TEXT NOT NULL,
  capacity_admission_disposition TEXT NOT NULL CHECK (
    capacity_admission_disposition IN (
      'trusted_admitted',
      'degraded_callback_only',
      'degraded_diagnostic_only',
      'quarantined_excluded',
      'stale_capacity',
      'missing_capacity'
    )
  ),
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_capacity_ingestion_policy_active
  ON phase5_hub_capacity_ingestion_policies (pcn_ref, policy_state, effective_at);

CREATE TABLE IF NOT EXISTS phase5_enhanced_access_policies (
  policy_id TEXT PRIMARY KEY,
  policy_version TEXT NOT NULL,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('draft', 'active', 'superseded')),
  compiled_policy_bundle_ref TEXT NOT NULL,
  policy_tuple_hash TEXT NOT NULL UNIQUE,
  effective_at TEXT NOT NULL,
  effective_until TEXT,
  pcn_ref TEXT NOT NULL,
  weekly_minutes_per_1000_adjusted_population INTEGER NOT NULL CHECK (
    weekly_minutes_per_1000_adjusted_population >= 0
  ),
  network_standard_hours_json TEXT NOT NULL,
  same_day_online_booking_rule TEXT NOT NULL,
  comparable_offer_rule TEXT NOT NULL,
  routing_policy_pack_ref TEXT NOT NULL REFERENCES phase5_hub_routing_policy_packs (routing_policy_pack_id),
  variance_window_policy_ref TEXT NOT NULL REFERENCES phase5_hub_variance_window_policies (variance_window_policy_id),
  service_obligation_policy_ref TEXT NOT NULL REFERENCES phase5_hub_service_obligation_policies (service_obligation_policy_id),
  practice_visibility_policy_ref TEXT NOT NULL REFERENCES phase5_hub_practice_visibility_policies (practice_visibility_policy_id),
  capacity_ingestion_policy_ref TEXT NOT NULL REFERENCES phase5_hub_capacity_ingestion_policies (capacity_ingestion_policy_id),
  rank_plan_version_ref TEXT NOT NULL,
  uncertainty_model_version_ref TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_enhanced_access_policy_active
  ON phase5_enhanced_access_policies (pcn_ref, policy_state, effective_at);

CREATE TABLE IF NOT EXISTS phase5_enhanced_access_policy_active_bindings (
  pcn_ref TEXT PRIMARY KEY,
  policy_ref TEXT NOT NULL REFERENCES phase5_enhanced_access_policies (policy_id),
  policy_tuple_hash TEXT NOT NULL,
  bound_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS phase5_network_coordination_policy_evaluations (
  policy_evaluation_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  evaluation_scope TEXT NOT NULL CHECK (
    evaluation_scope IN (
      'candidate_snapshot',
      'offer_generation',
      'commit_attempt',
      'practice_visibility_generation',
      'manage_exposure'
    )
  ),
  compiled_policy_bundle_ref TEXT NOT NULL,
  policy_tuple_hash TEXT NOT NULL,
  routing_policy_pack_ref TEXT NOT NULL REFERENCES phase5_hub_routing_policy_packs (routing_policy_pack_id),
  variance_window_policy_ref TEXT NOT NULL REFERENCES phase5_hub_variance_window_policies (variance_window_policy_id),
  service_obligation_policy_ref TEXT NOT NULL REFERENCES phase5_hub_service_obligation_policies (service_obligation_policy_id),
  practice_visibility_policy_ref TEXT NOT NULL REFERENCES phase5_hub_practice_visibility_policies (practice_visibility_policy_id),
  capacity_ingestion_policy_ref TEXT NOT NULL REFERENCES phase5_hub_capacity_ingestion_policies (capacity_ingestion_policy_id),
  routing_disposition TEXT NOT NULL CHECK (
    routing_disposition IN ('route_to_network', 'retain_local', 'bounce_back_urgent', 'blocked')
  ),
  variance_disposition TEXT NOT NULL CHECK (
    variance_disposition IN (
      'inside_required_window',
      'inside_approved_variance_window',
      'outside_window_visible_by_policy',
      'outside_window_blocked'
    )
  ),
  service_obligation_disposition TEXT NOT NULL CHECK (
    service_obligation_disposition IN (
      'within_obligation',
      'make_up_required',
      'obligation_risk',
      'commissioner_exception_active'
    )
  ),
  practice_visibility_disposition TEXT NOT NULL CHECK (
    practice_visibility_disposition IN (
      'standard_origin_visibility',
      'visibility_restricted',
      'ack_debt_open',
      'delta_required'
    )
  ),
  capacity_admission_disposition TEXT NOT NULL CHECK (
    capacity_admission_disposition IN (
      'trusted_admitted',
      'degraded_callback_only',
      'degraded_diagnostic_only',
      'quarantined_excluded',
      'stale_capacity',
      'missing_capacity'
    )
  ),
  source_admission_summary_json TEXT NOT NULL,
  policy_exception_refs_json TEXT NOT NULL,
  replay_fixture_ref TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_policy_evaluations_case
  ON phase5_network_coordination_policy_evaluations (
    hub_coordination_case_id,
    evaluation_scope,
    evaluated_at
  );

CREATE TABLE IF NOT EXISTS phase5_policy_exception_records (
  policy_exception_record_id TEXT PRIMARY KEY,
  policy_evaluation_ref TEXT NOT NULL REFERENCES phase5_network_coordination_policy_evaluations (policy_evaluation_id),
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  evaluation_scope TEXT NOT NULL CHECK (
    evaluation_scope IN (
      'candidate_snapshot',
      'offer_generation',
      'commit_attempt',
      'practice_visibility_generation',
      'manage_exposure'
    )
  ),
  policy_tuple_hash TEXT NOT NULL,
  family TEXT NOT NULL CHECK (
    family IN (
      'routing',
      'variance',
      'service_obligation',
      'practice_visibility',
      'capacity_ingestion',
      'tuple_drift'
    )
  ),
  exception_code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'blocking')),
  safe_summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_policy_exception_records_eval
  ON phase5_policy_exception_records (policy_evaluation_ref, family, created_at);

CREATE TABLE IF NOT EXISTS phase5_policy_evaluation_replay_fixtures (
  policy_evaluation_replay_fixture_id TEXT PRIMARY KEY,
  policy_evaluation_ref TEXT NOT NULL UNIQUE REFERENCES phase5_network_coordination_policy_evaluations (policy_evaluation_id),
  policy_id TEXT NOT NULL REFERENCES phase5_enhanced_access_policies (policy_id),
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  pcn_ref TEXT NOT NULL,
  evaluation_scope TEXT NOT NULL CHECK (
    evaluation_scope IN (
      'candidate_snapshot',
      'offer_generation',
      'commit_attempt',
      'practice_visibility_generation',
      'manage_exposure'
    )
  ),
  presented_policy_tuple_hash TEXT,
  facts_json TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_policy_replay_case_scope
  ON phase5_policy_evaluation_replay_fixtures (hub_coordination_case_id, evaluation_scope, evaluated_at);

COMMIT;
