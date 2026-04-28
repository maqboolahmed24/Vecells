BEGIN;

-- Phase 6 Pharmacy First eligibility and rule-pack persistence. The domain service
-- currently evaluates against an in-memory repository for local proofs, but these
-- tables freeze the production-shaped storage model for immutable pack promotion,
-- replay, golden-case regression, and explanation history.

CREATE TABLE IF NOT EXISTS phase6_pharmacy_rule_packs (
  rule_pack_id TEXT PRIMARY KEY,
  predecessor_rule_pack_ref_json TEXT,
  superseded_by_rule_pack_ref_json TEXT,
  pack_state TEXT NOT NULL CHECK (
    pack_state IN ('draft', 'compiled', 'promoted', 'superseded', 'retired')
  ),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  service_spec_version TEXT NOT NULL,
  overlap_strategy TEXT NOT NULL CHECK (
    overlap_strategy IN ('forbid_overlap', 'machine_resolved_supersede_previous')
  ),
  immutability_state TEXT NOT NULL CHECK (
    immutability_state = 'immutable_once_promoted'
  ),
  eligibility_thresholds_json TEXT NOT NULL,
  reconciliation_thresholds_json TEXT NOT NULL,
  global_exclusions_json TEXT NOT NULL,
  red_flag_bridges_json TEXT NOT NULL,
  minor_illness_policy_json TEXT NOT NULL,
  pathway_metadata_json TEXT NOT NULL,
  global_rule_catalog_json TEXT NOT NULL,
  minor_illness_feature_catalog_json TEXT NOT NULL,
  display_text_refs_json TEXT NOT NULL,
  display_text_catalog_json TEXT NOT NULL,
  changelog_text TEXT NOT NULL,
  hazard_traceability_refs_json TEXT NOT NULL,
  compile_hash TEXT,
  compiled_artifact_ref TEXT,
  last_validated_at TEXT,
  last_validation_errors_json TEXT NOT NULL,
  promoted_at TEXT,
  promoted_by_ref TEXT,
  promotion_reason TEXT,
  retired_at TEXT,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_rule_packs_state_window
  ON phase6_pharmacy_rule_packs (pack_state, effective_from, effective_to);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_rule_packs_compile_hash
  ON phase6_pharmacy_rule_packs (compile_hash)
  WHERE compile_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS phase6_pharmacy_rule_pack_threshold_sets (
  threshold_set_id TEXT PRIMARY KEY,
  rule_pack_id TEXT NOT NULL
    REFERENCES phase6_pharmacy_rule_packs (rule_pack_id)
    ON DELETE CASCADE,
  threshold_snapshot_json TEXT NOT NULL,
  threshold_values_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_threshold_sets_pack
  ON phase6_pharmacy_rule_pack_threshold_sets (rule_pack_id);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_pathway_definitions (
  pathway_definition_id TEXT PRIMARY KEY,
  rule_pack_id TEXT NOT NULL
    REFERENCES phase6_pharmacy_rule_packs (rule_pack_id)
    ON DELETE CASCADE,
  pathway_code TEXT NOT NULL CHECK (
    pathway_code IN (
      'uncomplicated_uti_female_16_64',
      'shingles_18_plus',
      'acute_otitis_media_1_17',
      'acute_sore_throat_5_plus',
      'acute_sinusitis_12_plus',
      'impetigo_1_plus',
      'infected_insect_bites_1_plus'
    )
  ),
  display_name TEXT NOT NULL,
  age_sex_gate_json TEXT NOT NULL,
  required_symptoms_json TEXT NOT NULL,
  required_symptom_weights_json TEXT NOT NULL,
  exclusion_rules_json TEXT NOT NULL,
  red_flag_rules_json TEXT NOT NULL,
  minor_illness_fallback_rules_json TEXT NOT NULL,
  timing_guardrail_ref_json TEXT NOT NULL,
  allowed_escalation_modes_json TEXT NOT NULL,
  supply_modes_json TEXT NOT NULL,
  precedence_ordinal INTEGER NOT NULL CHECK (precedence_ordinal > 0),
  contradiction_rule_ids_json TEXT NOT NULL,
  patient_eligible_summary_ref TEXT NOT NULL,
  patient_eligible_next_step_ref TEXT NOT NULL,
  patient_ineligible_summary_ref TEXT NOT NULL,
  patient_ineligible_next_step_ref TEXT NOT NULL,
  staff_summary_ref TEXT NOT NULL,
  next_best_endpoint_suggestion TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  UNIQUE (rule_pack_id, pathway_code)
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_pathway_precedence
  ON phase6_pharmacy_pathway_definitions (rule_pack_id, precedence_ordinal, pathway_code);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_timing_guardrails (
  guardrail_id TEXT PRIMARY KEY,
  rule_pack_id TEXT NOT NULL
    REFERENCES phase6_pharmacy_rule_packs (rule_pack_id)
    ON DELETE CASCADE,
  pathway_code TEXT NOT NULL CHECK (
    pathway_code IN (
      'uncomplicated_uti_female_16_64',
      'shingles_18_plus',
      'acute_otitis_media_1_17',
      'acute_sore_throat_5_plus',
      'acute_sinusitis_12_plus',
      'impetigo_1_plus',
      'infected_insect_bites_1_plus'
    )
  ),
  materiality_level TEXT NOT NULL CHECK (
    materiality_level IN ('high', 'medium', 'low')
  ),
  max_recommended_delay_minutes INTEGER NOT NULL CHECK (max_recommended_delay_minutes > 0),
  max_allowed_delay_minutes INTEGER NOT NULL CHECK (max_allowed_delay_minutes > 0),
  latest_safe_opening_delta_minutes INTEGER NOT NULL,
  suppression_policy TEXT NOT NULL CHECK (
    suppression_policy IN (
      'suppress_unsafe',
      'suppress_from_recommended_frontier',
      'warn_only'
    )
  ),
  warning_copy_ref TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  UNIQUE (rule_pack_id, pathway_code)
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_timing_guardrails_pathway
  ON phase6_pharmacy_timing_guardrails (rule_pack_id, pathway_code);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_compiled_rule_packs (
  compiled_artifact_id TEXT PRIMARY KEY,
  rule_pack_id TEXT NOT NULL
    REFERENCES phase6_pharmacy_rule_packs (rule_pack_id)
    ON DELETE CASCADE,
  rule_pack_version TEXT NOT NULL,
  compile_hash TEXT NOT NULL,
  compiled_at TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  overlap_strategy TEXT NOT NULL CHECK (
    overlap_strategy IN ('forbid_overlap', 'machine_resolved_supersede_previous')
  ),
  pathway_order_json TEXT NOT NULL,
  threshold_snapshot_json TEXT NOT NULL,
  threshold_values_json TEXT NOT NULL,
  pathways_json TEXT NOT NULL,
  minor_illness_policy_json TEXT NOT NULL,
  global_exclusions_json TEXT NOT NULL,
  red_flag_bridges_json TEXT NOT NULL,
  global_rule_catalog_json TEXT NOT NULL,
  minor_illness_feature_catalog_json TEXT NOT NULL,
  display_text_catalog_json TEXT NOT NULL,
  reconciliation_thresholds_json TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_compiled_rule_pack_hash
  ON phase6_pharmacy_compiled_rule_packs (rule_pack_id, compile_hash);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_golden_cases (
  golden_case_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  expected_pathway_code TEXT CHECK (
    expected_pathway_code IS NULL OR
    expected_pathway_code IN (
      'uncomplicated_uti_female_16_64',
      'shingles_18_plus',
      'acute_otitis_media_1_17',
      'acute_sore_throat_5_plus',
      'acute_sinusitis_12_plus',
      'impetigo_1_plus',
      'infected_insect_bites_1_plus'
    )
  ),
  expected_final_disposition TEXT NOT NULL CHECK (
    expected_final_disposition IN (
      'eligible_choice_pending',
      'minor_illness_fallback',
      'ineligible_returned'
    )
  ),
  expected_recommended_lane TEXT NOT NULL CHECK (
    expected_recommended_lane IN (
      'clinical_pathway_consultation',
      'minor_illness_fallback',
      'non_pharmacy_return'
    )
  ),
  expected_pathway_gate_result TEXT NOT NULL CHECK (
    expected_pathway_gate_result IN (
      'eligible',
      'hard_failed',
      'fallback_only',
      'global_blocked'
    )
  ),
  expected_unsafe_fallback_reason_code TEXT,
  expected_next_best_endpoint_suggestion TEXT NOT NULL,
  forbid_behavior_drift INTEGER NOT NULL CHECK (forbid_behavior_drift IN (0, 1)),
  notes TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_eligibility_explanation_bundles (
  bundle_id TEXT PRIMARY KEY,
  evaluation_ref_json TEXT NOT NULL,
  patient_facing_reason_json TEXT NOT NULL,
  staff_facing_reason_json TEXT NOT NULL,
  matched_rules_json TEXT NOT NULL,
  next_best_endpoint_suggestion TEXT NOT NULL,
  shared_evidence_hash TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_explanations_evaluation
  ON phase6_pharmacy_eligibility_explanation_bundles (evaluation_ref_json);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_explanations_shared_hash
  ON phase6_pharmacy_eligibility_explanation_bundles (shared_evidence_hash);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_eligibility_evaluations (
  evaluation_id TEXT PRIMARY KEY,
  pharmacy_case_ref_json TEXT NOT NULL,
  rule_pack_ref_json TEXT NOT NULL,
  rule_pack_version TEXT NOT NULL,
  selected_pathway_code TEXT CHECK (
    selected_pathway_code IS NULL OR
    selected_pathway_code IN (
      'uncomplicated_uti_female_16_64',
      'shingles_18_plus',
      'acute_otitis_media_1_17',
      'acute_sore_throat_5_plus',
      'acute_sinusitis_12_plus',
      'impetigo_1_plus',
      'infected_insect_bites_1_plus'
    )
  ),
  evaluated_pathways_json TEXT NOT NULL,
  matched_rule_ids_json TEXT NOT NULL,
  threshold_snapshot_json TEXT NOT NULL,
  age_sex_gate_result TEXT NOT NULL CHECK (
    age_sex_gate_result IN ('pass', 'fail')
  ),
  pathway_gate_result TEXT NOT NULL CHECK (
    pathway_gate_result IN ('eligible', 'hard_failed', 'fallback_only', 'global_blocked')
  ),
  exclusion_matches_json TEXT NOT NULL,
  pathway_exclusion_score REAL NOT NULL CHECK (
    pathway_exclusion_score >= 0 AND pathway_exclusion_score <= 1
  ),
  global_exclusion_score REAL NOT NULL CHECK (
    global_exclusion_score >= 0 AND global_exclusion_score <= 1
  ),
  required_symptom_support REAL NOT NULL CHECK (
    required_symptom_support >= 0 AND required_symptom_support <= 1
  ),
  evidence_completeness REAL NOT NULL CHECK (
    evidence_completeness >= 0 AND evidence_completeness <= 1
  ),
  contradiction_score REAL NOT NULL CHECK (
    contradiction_score >= 0 AND contradiction_score <= 1
  ),
  eligibility_confidence REAL NOT NULL CHECK (
    eligibility_confidence >= 0 AND eligibility_confidence <= 1
  ),
  recommended_lane TEXT NOT NULL CHECK (
    recommended_lane IN (
      'clinical_pathway_consultation',
      'minor_illness_fallback',
      'non_pharmacy_return'
    )
  ),
  final_disposition TEXT NOT NULL CHECK (
    final_disposition IN (
      'eligible_choice_pending',
      'minor_illness_fallback',
      'ineligible_returned'
    )
  ),
  unsafe_fallback_reason_code TEXT,
  explanation_bundle_ref_json TEXT NOT NULL,
  timing_guardrail_ref_json TEXT,
  fallback_score REAL CHECK (
    fallback_score IS NULL OR (fallback_score >= 0 AND fallback_score <= 1)
  ),
  shared_evidence_hash TEXT NOT NULL,
  evidence_snapshot_json TEXT NOT NULL,
  replay_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_evaluations_replay_key
  ON phase6_pharmacy_eligibility_evaluations (replay_key);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_evaluations_case_created
  ON phase6_pharmacy_eligibility_evaluations (pharmacy_case_ref_json, created_at);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_evaluations_rule_pack
  ON phase6_pharmacy_eligibility_evaluations (rule_pack_version, selected_pathway_code);

COMMIT;
