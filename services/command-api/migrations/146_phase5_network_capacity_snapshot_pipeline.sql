BEGIN;

-- Phase 5 network capacity snapshot pipeline depends on the hub case kernel from
-- 143_phase5_hub_case_kernel.sql for durable case ownership and request context.
-- It also depends on 145_phase5_enhanced_access_policy_engine.sql because every
-- candidate snapshot and decision plan is bound to one compiled policy evaluation.

CREATE TABLE IF NOT EXISTS phase5_network_capacity_adapter_runs (
  adapter_run_id TEXT PRIMARY KEY,
  snapshot_id TEXT,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  binding_ref TEXT NOT NULL,
  source_mode TEXT NOT NULL CHECK (
    source_mode IN (
      'native_api_feed',
      'partner_schedule_sync',
      'manual_capacity_board',
      'batched_capacity_import'
    )
  ),
  source_ref TEXT NOT NULL,
  source_identity TEXT NOT NULL,
  source_version TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  raw_row_count INTEGER NOT NULL CHECK (raw_row_count >= 0),
  source_trust_ref TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_capacity_adapter_runs_snapshot
  ON phase5_network_capacity_adapter_runs (snapshot_id, hub_coordination_case_id);

CREATE TABLE IF NOT EXISTS phase5_capacity_source_trust_admissions (
  source_trust_admission_id TEXT PRIMARY KEY,
  snapshot_id TEXT,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  adapter_run_ref TEXT NOT NULL REFERENCES phase5_network_capacity_adapter_runs (adapter_run_id),
  source_mode TEXT NOT NULL CHECK (
    source_mode IN (
      'native_api_feed',
      'partner_schedule_sync',
      'manual_capacity_board',
      'batched_capacity_import'
    )
  ),
  source_ref TEXT NOT NULL,
  source_identity TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_trust_ref TEXT NOT NULL,
  source_trust_state TEXT NOT NULL CHECK (
    source_trust_state IN ('trusted', 'degraded', 'quarantined')
  ),
  source_trust_tier INTEGER NOT NULL CHECK (source_trust_tier BETWEEN 0 AND 2),
  trust_lower_bound REAL NOT NULL CHECK (trust_lower_bound >= 0 AND trust_lower_bound <= 1),
  completeness_state TEXT NOT NULL CHECK (
    completeness_state IN ('complete', 'partial', 'blocked')
  ),
  hard_block INTEGER NOT NULL CHECK (hard_block IN (0, 1)),
  source_freshness_state TEXT NOT NULL CHECK (
    source_freshness_state IN ('fresh', 'aging', 'stale')
  ),
  staleness_minutes INTEGER NOT NULL CHECK (staleness_minutes >= 0),
  admission_disposition TEXT NOT NULL CHECK (
    admission_disposition IN (
      'trusted_admitted',
      'degraded_callback_only',
      'degraded_diagnostic_only',
      'quarantined_excluded',
      'stale_capacity',
      'missing_capacity'
    )
  ),
  patient_offerable_allowed INTEGER NOT NULL CHECK (patient_offerable_allowed IN (0, 1)),
  direct_commit_allowed INTEGER NOT NULL CHECK (direct_commit_allowed IN (0, 1)),
  hidden_from_patient_truth INTEGER NOT NULL CHECK (hidden_from_patient_truth IN (0, 1)),
  candidate_count INTEGER NOT NULL CHECK (candidate_count >= 0),
  evaluated_at TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_source_trust_admissions_snapshot
  ON phase5_capacity_source_trust_admissions (snapshot_id, hub_coordination_case_id);

CREATE TABLE IF NOT EXISTS phase5_network_candidate_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  policy_evaluation_ref TEXT NOT NULL REFERENCES phase5_network_coordination_policy_evaluations (policy_evaluation_id),
  compiled_policy_bundle_ref TEXT NOT NULL,
  policy_tuple_hash TEXT NOT NULL,
  rank_plan_version_ref TEXT NOT NULL,
  uncertainty_model_version_ref TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  candidate_refs_json TEXT NOT NULL,
  candidate_count INTEGER NOT NULL CHECK (candidate_count >= 0),
  trusted_candidate_count INTEGER NOT NULL CHECK (trusted_candidate_count >= 0),
  degraded_candidate_count INTEGER NOT NULL CHECK (degraded_candidate_count >= 0),
  quarantined_candidate_count INTEGER NOT NULL CHECK (quarantined_candidate_count >= 0),
  capacity_rank_proof_ref TEXT NOT NULL,
  capacity_rank_explanation_refs_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_network_candidate_snapshots_case
  ON phase5_network_candidate_snapshots (hub_coordination_case_id, fetched_at);

CREATE TABLE IF NOT EXISTS phase5_network_slot_candidates (
  snapshot_id TEXT NOT NULL REFERENCES phase5_network_candidate_snapshots (snapshot_id),
  candidate_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  site_label TEXT,
  source_ref TEXT NOT NULL,
  source_trust_ref TEXT NOT NULL,
  source_trust_state TEXT NOT NULL CHECK (
    source_trust_state IN ('trusted', 'degraded', 'quarantined')
  ),
  source_trust_tier INTEGER NOT NULL CHECK (source_trust_tier BETWEEN 0 AND 2),
  source_freshness_state TEXT NOT NULL CHECK (
    source_freshness_state IN ('fresh', 'aging', 'stale')
  ),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  timezone TEXT NOT NULL,
  modality TEXT NOT NULL,
  clinician_type TEXT NOT NULL,
  capacity_unit_ref TEXT NOT NULL,
  manage_capability_state TEXT NOT NULL CHECK (
    manage_capability_state IN ('network_manage_ready', 'read_only', 'blocked')
  ),
  accessibility_fit_score REAL NOT NULL CHECK (
    accessibility_fit_score >= 0 AND accessibility_fit_score <= 1
  ),
  travel_minutes INTEGER NOT NULL CHECK (travel_minutes >= 0),
  wait_minutes INTEGER NOT NULL CHECK (wait_minutes >= 0),
  staleness_minutes INTEGER NOT NULL CHECK (staleness_minutes >= 0),
  required_window_fit INTEGER NOT NULL CHECK (required_window_fit BETWEEN 0 AND 2),
  window_class INTEGER NOT NULL CHECK (window_class BETWEEN 0 AND 2),
  offerability_state TEXT NOT NULL CHECK (
    offerability_state IN (
      'direct_commit',
      'patient_offerable',
      'callback_only_reasoning',
      'diagnostic_only'
    )
  ),
  base_utility REAL NOT NULL,
  uncertainty_radius REAL NOT NULL CHECK (uncertainty_radius >= 0),
  robust_fit REAL NOT NULL,
  capacity_rank_explanation_ref TEXT NOT NULL,
  patient_reason_cue_refs_json TEXT NOT NULL,
  staff_reason_refs_json TEXT NOT NULL,
  blocked_by_policy_reason_refs_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  PRIMARY KEY (snapshot_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_phase5_network_slot_candidates_capacity_unit
  ON phase5_network_slot_candidates (capacity_unit_ref, start_at, end_at);

CREATE TABLE IF NOT EXISTS phase5_capacity_rank_proofs (
  capacity_rank_proof_id TEXT PRIMARY KEY,
  snapshot_ref TEXT NOT NULL REFERENCES phase5_network_candidate_snapshots (snapshot_id),
  rank_plan_version_ref TEXT NOT NULL,
  uncertainty_model_version_ref TEXT NOT NULL,
  policy_tuple_hash TEXT NOT NULL,
  proof_checksum TEXT NOT NULL,
  ordered_candidate_refs_json TEXT NOT NULL,
  ranked_candidates_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS phase5_capacity_rank_explanations (
  snapshot_ref TEXT NOT NULL REFERENCES phase5_network_candidate_snapshots (snapshot_id),
  capacity_rank_explanation_id TEXT NOT NULL,
  candidate_ref TEXT NOT NULL,
  policy_tuple_hash TEXT NOT NULL,
  window_class INTEGER NOT NULL CHECK (window_class BETWEEN 0 AND 2),
  source_trust_state TEXT NOT NULL CHECK (
    source_trust_state IN ('trusted', 'degraded', 'quarantined')
  ),
  base_utility REAL NOT NULL,
  uncertainty_radius REAL NOT NULL CHECK (uncertainty_radius >= 0),
  robust_fit REAL NOT NULL,
  patient_reason_cue_refs_json TEXT NOT NULL,
  staff_reason_refs_json TEXT NOT NULL,
  blocked_by_policy_reason_refs_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  PRIMARY KEY (snapshot_ref, capacity_rank_explanation_id)
);

CREATE TABLE IF NOT EXISTS phase5_cross_site_decision_plans (
  decision_plan_id TEXT PRIMARY KEY,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  snapshot_id TEXT NOT NULL REFERENCES phase5_network_candidate_snapshots (snapshot_id),
  policy_evaluation_ref TEXT NOT NULL REFERENCES phase5_network_coordination_policy_evaluations (policy_evaluation_id),
  policy_tuple_hash TEXT NOT NULL,
  ordered_candidate_refs_json TEXT NOT NULL,
  patient_offerable_frontier_refs_json TEXT NOT NULL,
  direct_commit_frontier_refs_json TEXT NOT NULL,
  callback_reasoning_refs_json TEXT NOT NULL,
  diagnostic_only_refs_json TEXT NOT NULL,
  dominance_decisions_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS phase5_enhanced_access_minutes_ledgers (
  enhanced_access_minutes_ledger_id TEXT PRIMARY KEY,
  pcn_ref TEXT NOT NULL,
  policy_tuple_hash TEXT NOT NULL,
  week_start_at TEXT NOT NULL,
  week_end_at TEXT NOT NULL,
  adjusted_population INTEGER NOT NULL CHECK (adjusted_population >= 0),
  minutes_per_1000_required INTEGER NOT NULL CHECK (minutes_per_1000_required >= 0),
  required_minutes INTEGER NOT NULL CHECK (required_minutes >= 0),
  delivered_minutes INTEGER NOT NULL CHECK (delivered_minutes >= 0),
  available_minutes INTEGER NOT NULL CHECK (available_minutes >= 0),
  cancelled_minutes INTEGER NOT NULL CHECK (cancelled_minutes >= 0),
  replacement_minutes INTEGER NOT NULL CHECK (replacement_minutes >= 0),
  ledger_state TEXT NOT NULL CHECK (
    ledger_state IN ('on_track', 'at_risk', 'make_up_required', 'completed')
  ),
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_minutes_ledgers_pcn_week
  ON phase5_enhanced_access_minutes_ledgers (pcn_ref, week_start_at);

CREATE TABLE IF NOT EXISTS phase5_cancellation_make_up_ledgers (
  cancellation_make_up_ledger_id TEXT PRIMARY KEY,
  pcn_ref TEXT NOT NULL,
  policy_tuple_hash TEXT NOT NULL,
  service_date TEXT NOT NULL,
  cancelled_minutes INTEGER NOT NULL CHECK (cancelled_minutes >= 0),
  replacement_minutes INTEGER NOT NULL CHECK (replacement_minutes >= 0),
  make_up_due_at TEXT NOT NULL,
  commissioner_exception_ref TEXT,
  make_up_state TEXT NOT NULL CHECK (
    make_up_state IN (
      'replacement_due',
      'replacement_provided',
      'exception_granted',
      'expired'
    )
  ),
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_cancellation_make_up_ledgers_pcn_date
  ON phase5_cancellation_make_up_ledgers (pcn_ref, service_date);

CREATE TABLE IF NOT EXISTS phase5_capacity_supply_exceptions (
  capacity_supply_exception_id TEXT PRIMARY KEY,
  snapshot_id TEXT,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  source_ref TEXT,
  candidate_ref TEXT,
  family TEXT NOT NULL CHECK (
    family IN ('missing', 'staleness', 'trust', 'visibility', 'policy', 'dedupe')
  ),
  exception_code TEXT NOT NULL CHECK (
    exception_code IN (
      'CAPACITY_MISSING',
      'CAPACITY_STALE',
      'CAPACITY_DEGRADED_CALLBACK_ONLY',
      'CAPACITY_DEGRADED_DIAGNOSTIC_ONLY',
      'CAPACITY_QUARANTINED',
      'CAPACITY_HIDDEN',
      'CAPACITY_POLICY_INVALID',
      'CAPACITY_DEDUPE_COLLISION'
    )
  ),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'blocking')),
  safe_summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_capacity_supply_exceptions_snapshot
  ON phase5_capacity_supply_exceptions (snapshot_id, hub_coordination_case_id, created_at);

CREATE TABLE IF NOT EXISTS phase5_network_capacity_replay_fixtures (
  network_capacity_replay_fixture_id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  hub_coordination_case_id TEXT NOT NULL REFERENCES phase5_hub_coordination_cases (hub_coordination_case_id),
  evaluated_at TEXT NOT NULL,
  presented_policy_tuple_hash TEXT,
  adjusted_population INTEGER,
  delivered_minutes INTEGER,
  available_minutes INTEGER,
  cancelled_minutes INTEGER,
  replacement_minutes INTEGER,
  commissioner_exception_ref TEXT,
  minimum_necessary_contract_ref TEXT,
  week_start_at TEXT,
  week_end_at TEXT,
  cancellation_service_date TEXT,
  adapter_bindings_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase5_network_capacity_replay_fixtures_snapshot
  ON phase5_network_capacity_replay_fixtures (snapshot_id, hub_coordination_case_id);

COMMIT;
