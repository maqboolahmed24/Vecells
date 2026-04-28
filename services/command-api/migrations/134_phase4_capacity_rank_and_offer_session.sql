BEGIN;

CREATE TABLE IF NOT EXISTS phase4_rank_plans (
  rank_plan_id TEXT PRIMARY KEY,
  rank_plan_version TEXT NOT NULL,
  search_policy_ref TEXT NOT NULL,
  policy_bundle_hash TEXT NOT NULL,
  preferred_window_minutes INTEGER NOT NULL,
  acceptable_window_minutes INTEGER NOT NULL,
  same_band_reorder_slack_minutes_by_window_json TEXT NOT NULL,
  weights_json TEXT NOT NULL,
  taus_json TEXT NOT NULL,
  stable_tie_break_rule TEXT NOT NULL,
  compiled_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase4_capacity_rank_disclosure_policies (
  capacity_rank_disclosure_policy_id TEXT PRIMARY KEY,
  surface_family TEXT NOT NULL CHECK (
    surface_family IN ('patient_booking', 'staff_booking', 'support_replay', 'operations_capacity')
  ),
  audience_tier TEXT NOT NULL CHECK (
    audience_tier IN ('patient', 'staff', 'support', 'operations')
  ),
  patient_safe_fields_json TEXT NOT NULL,
  staff_replay_fields_json TEXT NOT NULL,
  operations_fields_json TEXT NOT NULL,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('active', 'superseded')),
  published_at TEXT NOT NULL,
  policy_version_ref TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase4_capacity_rank_proofs (
  capacity_rank_proof_id TEXT PRIMARY KEY,
  ranking_scope TEXT NOT NULL CHECK (ranking_scope IN ('local_booking')),
  source_snapshot_ref TEXT NOT NULL,
  source_decision_plan_ref TEXT,
  rank_plan_ref TEXT NOT NULL REFERENCES phase4_rank_plans (rank_plan_id),
  rank_plan_version_ref TEXT NOT NULL,
  candidate_universe_hash TEXT NOT NULL,
  ordered_candidate_refs_json TEXT NOT NULL,
  frontier_candidate_refs_json TEXT NOT NULL,
  dominated_candidate_refs_json TEXT NOT NULL,
  patient_offerable_candidate_refs_json TEXT NOT NULL,
  explanation_refs_json TEXT NOT NULL,
  tie_break_schema_ref TEXT NOT NULL,
  proof_checksum TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  superseded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_phase4_capacity_rank_proofs_source_snapshot
  ON phase4_capacity_rank_proofs (source_snapshot_ref, generated_at);

CREATE TABLE IF NOT EXISTS phase4_capacity_rank_explanations (
  capacity_rank_explanation_id TEXT PRIMARY KEY,
  capacity_rank_proof_ref TEXT NOT NULL REFERENCES phase4_capacity_rank_proofs (capacity_rank_proof_id),
  candidate_ref TEXT NOT NULL,
  canonical_slot_identity_ref TEXT NOT NULL,
  normalized_slot_ref TEXT NOT NULL,
  rank_ordinal INTEGER NOT NULL,
  window_class INTEGER NOT NULL CHECK (window_class IN (0, 1, 2)),
  frontier_state TEXT NOT NULL CHECK (
    frontier_state IN ('frontier_ranked', 'non_frontier', 'dominated_removed', 'filtered_out', 'explanation_only')
  ),
  source_trust_state TEXT NOT NULL CHECK (
    source_trust_state IN ('trusted', 'degraded', 'quarantined', 'not_applicable')
  ),
  normalized_feature_vector_json TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  patient_reason_cue_refs_json TEXT NOT NULL,
  staff_explanation_refs_json TEXT NOT NULL,
  support_explanation_refs_json TEXT NOT NULL,
  ops_diagnostic_refs_json TEXT NOT NULL,
  uncertainty_radius INTEGER NOT NULL,
  robust_fit TEXT NOT NULL,
  dominance_disposition TEXT NOT NULL CHECK (
    dominance_disposition IN ('none', 'retained', 'removed_by_dominance', 'retained_after_tie')
  ),
  canonical_tie_break_key TEXT NOT NULL,
  rank_plan_version_ref TEXT NOT NULL,
  explanation_tuple_hash TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_capacity_rank_explanations_proof
  ON phase4_capacity_rank_explanations (capacity_rank_proof_ref, rank_ordinal);

CREATE TABLE IF NOT EXISTS phase4_offer_sessions (
  offer_session_id TEXT PRIMARY KEY,
  booking_case_id TEXT NOT NULL,
  slot_set_snapshot_ref TEXT NOT NULL,
  rank_plan_ref TEXT NOT NULL REFERENCES phase4_rank_plans (rank_plan_id),
  rank_plan_version TEXT NOT NULL,
  capacity_rank_proof_ref TEXT NOT NULL REFERENCES phase4_capacity_rank_proofs (capacity_rank_proof_id),
  capacity_rank_disclosure_policy_ref TEXT NOT NULL REFERENCES phase4_capacity_rank_disclosure_policies (capacity_rank_disclosure_policy_id),
  capability_resolution_ref TEXT NOT NULL,
  capability_tuple_hash TEXT NOT NULL,
  provider_adapter_binding_ref TEXT NOT NULL,
  provider_adapter_binding_hash TEXT NOT NULL,
  search_policy_ref TEXT NOT NULL,
  selection_audience TEXT NOT NULL CHECK (selection_audience IN ('patient', 'staff')),
  offered_candidate_refs_json TEXT NOT NULL,
  selected_offer_candidate_ref TEXT,
  selected_normalized_slot_ref TEXT,
  selected_canonical_slot_identity_ref TEXT,
  selected_candidate_hash TEXT,
  reservation_truth_projection_ref TEXT NOT NULL,
  selection_token TEXT NOT NULL,
  selection_proof_hash TEXT NOT NULL,
  truth_mode TEXT NOT NULL CHECK (
    truth_mode IN ('truthful_nonexclusive', 'exclusive_hold', 'degraded_manual_pending')
  ),
  hold_support_state TEXT NOT NULL CHECK (
    hold_support_state IN ('not_supported', 'supported_later', 'degraded_manual_only')
  ),
  compare_mode_state TEXT NOT NULL CHECK (compare_mode_state IN ('list', 'calendar', 'compare')),
  expires_at TEXT NOT NULL,
  session_state TEXT NOT NULL CHECK (
    session_state IN ('offerable', 'branch_only', 'selected', 'superseded', 'expired', 'recovery_only')
  ),
  dominant_action_ref TEXT,
  continuation_branches_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  superseded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_phase4_offer_sessions_scope
  ON phase4_offer_sessions (booking_case_id, selection_audience, created_at);

CREATE TABLE IF NOT EXISTS phase4_offer_candidates (
  offer_candidate_id TEXT PRIMARY KEY,
  offer_session_ref TEXT NOT NULL REFERENCES phase4_offer_sessions (offer_session_id),
  capacity_rank_proof_ref TEXT NOT NULL REFERENCES phase4_capacity_rank_proofs (capacity_rank_proof_id),
  normalized_slot_ref TEXT NOT NULL,
  canonical_slot_identity_ref TEXT NOT NULL,
  candidate_rank INTEGER NOT NULL,
  candidate_hash TEXT NOT NULL,
  selection_audience TEXT NOT NULL CHECK (selection_audience IN ('patient', 'staff')),
  offerability_state TEXT NOT NULL CHECK (
    offerability_state IN ('patient_self_service', 'staff_assist_only', 'staff_and_patient')
  ),
  window_class INTEGER NOT NULL CHECK (window_class IN (0, 1, 2)),
  frontier_membership INTEGER NOT NULL CHECK (frontier_membership IN (0, 1)),
  soft_score_micros INTEGER NOT NULL,
  patient_reason_cue_refs_json TEXT NOT NULL,
  capacity_rank_explanation_ref TEXT NOT NULL REFERENCES phase4_capacity_rank_explanations (capacity_rank_explanation_id),
  slot_snapshot_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase4_offer_candidates_session_rank
  ON phase4_offer_candidates (offer_session_ref, candidate_rank);

COMMIT;
