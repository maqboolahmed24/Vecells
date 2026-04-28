-- Phase 8 task 415: drift, fairness, incident, watch-tuple, and trust projection monitoring.
-- These tables intentionally persist refs, hashes, counts, intervals, and blocker codes only.

CREATE TABLE IF NOT EXISTS shadow_comparison_run (
  comparison_run_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  human_outcome_ref TEXT NOT NULL,
  model_outcome_ref TEXT NOT NULL,
  delta_metrics_ref TEXT NOT NULL,
  override_disposition_ref TEXT,
  incident_outcome_ref TEXT,
  decision_latency_ms INTEGER NOT NULL CHECK (decision_latency_ms >= 0),
  evidence_level TEXT NOT NULL CHECK (evidence_level IN ('offline_gold', 'live_shadow', 'post_visible')),
  route_family_ref TEXT NOT NULL,
  tenant_ref TEXT NOT NULL,
  release_cohort_ref TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  metric_window_ref TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT shadow_comparison_refs_only CHECK (
    delta_metrics_ref <> '' AND human_outcome_ref <> '' AND model_outcome_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS release_guard_threshold (
  threshold_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  metric_level TEXT NOT NULL CHECK (metric_level IN ('visible', 'insert', 'commit', 'release')),
  target_risk_alpha NUMERIC NOT NULL CHECK (target_risk_alpha >= 0 AND target_risk_alpha <= 1),
  minimum_sample_size INTEGER NOT NULL CHECK (minimum_sample_size > 0),
  interval_method_ref TEXT NOT NULL CHECK (interval_method_ref IN ('wilson_95', 'beta_binomial_95')),
  sequential_detector_policy_ref TEXT NOT NULL,
  warning_level NUMERIC NOT NULL CHECK (warning_level >= 0 AND warning_level <= 1),
  block_level NUMERIC NOT NULL CHECK (block_level >= 0 AND block_level <= 1),
  effect_size_floor NUMERIC NOT NULL CHECK (effect_size_floor >= 0 AND effect_size_floor <= 1),
  evidence_boundary NUMERIC NOT NULL CHECK (evidence_boundary >= 0 AND evidence_boundary <= 1),
  metric_direction TEXT NOT NULL CHECK (metric_direction IN ('higher_is_better', 'lower_is_better')),
  penalty_weight NUMERIC NOT NULL CHECK (penalty_weight >= 0 AND penalty_weight <= 1),
  threshold_state TEXT NOT NULL CHECK (threshold_state IN ('active', 'superseded', 'retired')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT release_guard_threshold_interval_policy_required CHECK (
    interval_method_ref <> '' AND sequential_detector_policy_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS drift_signal (
  drift_signal_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  segment_key TEXT NOT NULL,
  detector_type TEXT NOT NULL CHECK (
    detector_type IN (
      'representation_mmd',
      'output_js',
      'performance_delta',
      'calibration_gap',
      'fairness_gap'
    )
  ),
  effect_size NUMERIC NOT NULL CHECK (effect_size >= 0),
  evidence_value NUMERIC NOT NULL CHECK (evidence_value >= 0),
  threshold_ref TEXT,
  minimum_effect_size NUMERIC NOT NULL CHECK (minimum_effect_size >= 0),
  evidence_boundary NUMERIC NOT NULL CHECK (evidence_boundary >= 0),
  observed_at TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('none', 'watch', 'warning', 'critical')),
  trigger_state TEXT NOT NULL CHECK (trigger_state IN ('clear', 'watch', 'warn', 'block')),
  CONSTRAINT drift_signal_effect_and_evidence_required CHECK (
    trigger_state <> 'block' OR (effect_size >= minimum_effect_size AND evidence_value >= evidence_boundary)
  )
);

CREATE TABLE IF NOT EXISTS bias_slice_metric (
  slice_metric_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  slice_definition TEXT NOT NULL,
  clinically_comparable_stratum_ref TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  metric_direction TEXT NOT NULL CHECK (metric_direction IN ('higher_is_better', 'lower_is_better')),
  numerator INTEGER NOT NULL CHECK (numerator >= 0),
  denominator INTEGER NOT NULL CHECK (denominator > 0 AND numerator <= denominator),
  posterior_mean NUMERIC NOT NULL CHECK (posterior_mean >= 0 AND posterior_mean <= 1),
  interval_low NUMERIC NOT NULL CHECK (interval_low >= 0 AND interval_low <= 1),
  interval_high NUMERIC NOT NULL CHECK (interval_high >= 0 AND interval_high <= 1),
  effective_sample_size INTEGER NOT NULL CHECK (effective_sample_size >= 0),
  reference_slice_ref TEXT NOT NULL,
  metric_set TEXT NOT NULL,
  window_ref TEXT NOT NULL,
  threshold_ref TEXT,
  action_state TEXT NOT NULL CHECK (action_state IN ('insufficient_evidence', 'watch', 'warn', 'block')),
  CONSTRAINT bias_slice_metric_interval_required CHECK (interval_low <= posterior_mean AND posterior_mean <= interval_high),
  CONSTRAINT fairness_small_slices_not_healthy CHECK (action_state <> 'watch' OR effective_sample_size > 0)
);

CREATE TABLE IF NOT EXISTS assistive_incident_link (
  incident_link_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  incident_system_ref TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  investigation_state TEXT NOT NULL CHECK (investigation_state IN ('open', 'investigating', 'mitigated', 'closed')),
  disclosure_fence_failure BOOLEAN NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_incident_link_refs_only CHECK (
    assistive_session_ref <> '' AND incident_system_ref <> '' AND watch_tuple_hash <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_capability_watch_tuple (
  assistive_capability_watch_tuple_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  rollout_ladder_policy_ref TEXT NOT NULL,
  model_version_ref TEXT NOT NULL,
  prompt_bundle_hash TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  release_cohort_ref TEXT NOT NULL,
  surface_route_contract_refs JSONB NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  calibration_bundle_ref TEXT NOT NULL,
  uncertainty_selector_version_ref TEXT NOT NULL,
  conformal_bundle_ref TEXT NOT NULL,
  threshold_set_ref TEXT NOT NULL,
  route_contract_tuple_hash TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL UNIQUE,
  tuple_state TEXT NOT NULL CHECK (tuple_state IN ('current', 'superseded', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_watch_tuple_immutable_hash_required CHECK (
    watch_tuple_hash <> '' AND prompt_bundle_hash <> '' AND runtime_publication_bundle_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_capability_trust_projection (
  assistive_capability_trust_projection_id TEXT PRIMARY KEY,
  watch_tuple_hash TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  rollout_ladder_policy_ref TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  assurance_slice_trust_refs JSONB NOT NULL,
  incident_rate_ref TEXT,
  surface_publication_state TEXT NOT NULL CHECK (
    surface_publication_state IN ('published', 'stale', 'conflict', 'withdrawn', 'blocked')
  ),
  runtime_publication_bundle_ref TEXT NOT NULL,
  runtime_publication_state TEXT NOT NULL CHECK (
    runtime_publication_state IN ('current', 'stale', 'withdrawn', 'blocked', 'missing')
  ),
  assistive_kill_switch_state_ref TEXT,
  assistive_kill_switch_state TEXT NOT NULL CHECK (
    assistive_kill_switch_state IN ('inactive', 'shadow_only', 'blocked', 'withdrawn')
  ),
  release_freeze_record_ref TEXT,
  freeze_state TEXT NOT NULL CHECK (freeze_state IN ('none', 'monitoring', 'frozen', 'shadow_only', 'released')),
  freeze_disposition_ref TEXT,
  release_recovery_disposition_ref TEXT NOT NULL,
  trust_score NUMERIC NOT NULL CHECK (trust_score >= 0 AND trust_score <= 1),
  trust_penalty_ref TEXT NOT NULL,
  trust_penalty_components JSONB NOT NULL,
  threshold_state TEXT NOT NULL CHECK (threshold_state IN ('green', 'warn', 'block')),
  trust_state TEXT NOT NULL CHECK (trust_state IN ('trusted', 'degraded', 'quarantined', 'shadow_only', 'frozen')),
  visibility_eligibility_state TEXT NOT NULL CHECK (visibility_eligibility_state IN ('visible', 'observe_only', 'blocked')),
  insert_eligibility_state TEXT NOT NULL CHECK (insert_eligibility_state IN ('enabled', 'observe_only', 'blocked')),
  approval_eligibility_state TEXT NOT NULL CHECK (approval_eligibility_state IN ('single_review', 'dual_review', 'blocked')),
  rollout_ceiling_state TEXT NOT NULL CHECK (rollout_ceiling_state IN ('shadow_only', 'visible', 'observe_only', 'blocked')),
  fallback_mode TEXT NOT NULL CHECK (
    fallback_mode IN ('shadow_only', 'observe_only', 'read_only_provenance', 'placeholder_only', 'assistive_hidden')
  ),
  blocking_reason_codes JSONB NOT NULL,
  threshold_breach_refs JSONB NOT NULL,
  incident_link_refs JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT trust_projection_monotonic_inputs_required CHECK (
    trust_penalty_ref <> '' AND release_recovery_disposition_ref <> ''
  ),
  CONSTRAINT trust_projection_hard_blockers_fail_closed CHECK (
    (surface_publication_state = 'published' AND runtime_publication_state = 'current')
    OR trust_state IN ('quarantined', 'shadow_only', 'frozen')
  )
);

CREATE TABLE IF NOT EXISTS assistive_capability_rollout_verdict (
  assistive_capability_rollout_verdict_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  rollout_slice_contract_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  release_cohort_ref TEXT NOT NULL,
  slice_membership_state TEXT NOT NULL CHECK (
    slice_membership_state IN ('in_slice', 'out_of_slice', 'unknown', 'superseded')
  ),
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  trust_projection_ref TEXT NOT NULL,
  release_freeze_record_ref TEXT,
  freeze_disposition_ref TEXT,
  policy_state TEXT NOT NULL CHECK (policy_state IN ('exact', 'stale', 'blocked')),
  publication_state TEXT NOT NULL CHECK (publication_state IN ('published', 'stale', 'withdrawn', 'blocked')),
  shadow_evidence_state TEXT NOT NULL CHECK (shadow_evidence_state IN ('complete', 'stale', 'missing', 'blocked')),
  visible_evidence_state TEXT NOT NULL CHECK (visible_evidence_state IN ('complete', 'stale', 'missing', 'blocked')),
  insert_evidence_state TEXT NOT NULL CHECK (insert_evidence_state IN ('complete', 'stale', 'missing', 'blocked')),
  commit_evidence_state TEXT NOT NULL CHECK (commit_evidence_state IN ('complete', 'stale', 'missing', 'blocked')),
  rollout_rung TEXT NOT NULL CHECK (
    rollout_rung IN ('shadow_only', 'visible_summary', 'visible_insert', 'visible_commit', 'frozen', 'withdrawn')
  ),
  render_posture TEXT NOT NULL CHECK (render_posture IN ('shadow_only', 'visible', 'observe_only', 'blocked')),
  insert_posture TEXT NOT NULL CHECK (insert_posture IN ('enabled', 'observe_only', 'blocked')),
  approval_posture TEXT NOT NULL CHECK (approval_posture IN ('single_review', 'dual_review', 'blocked')),
  fallback_mode TEXT NOT NULL CHECK (
    fallback_mode IN ('shadow_only', 'observe_only', 'read_only_provenance', 'placeholder_only', 'assistive_hidden')
  ),
  verdict_state TEXT NOT NULL CHECK (verdict_state IN ('current', 'stale', 'superseded', 'blocked')),
  blocking_reason_codes JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT current_posture_fail_closed_on_missing_evidence CHECK (
    (render_posture <> 'visible' OR visible_evidence_state = 'complete')
    AND (insert_posture <> 'enabled' OR insert_evidence_state = 'complete')
    AND (approval_posture = 'blocked' OR commit_evidence_state = 'complete')
  )
);

CREATE TABLE IF NOT EXISTS assistive_current_posture (
  current_posture_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  trust_projection_ref TEXT NOT NULL,
  rollout_verdict_ref TEXT NOT NULL,
  trust_state TEXT NOT NULL CHECK (trust_state IN ('trusted', 'degraded', 'quarantined', 'shadow_only', 'frozen')),
  posture_state TEXT NOT NULL CHECK (posture_state IN ('current', 'observe_only', 'shadow_only', 'blocked')),
  visibility_ceiling TEXT NOT NULL CHECK (visibility_ceiling IN ('visible', 'observe_only', 'blocked')),
  insert_ceiling TEXT NOT NULL CHECK (insert_ceiling IN ('enabled', 'observe_only', 'blocked')),
  approval_ceiling TEXT NOT NULL CHECK (approval_ceiling IN ('single_review', 'dual_review', 'blocked')),
  render_posture TEXT NOT NULL CHECK (render_posture IN ('shadow_only', 'visible', 'observe_only', 'blocked')),
  insert_posture TEXT NOT NULL CHECK (insert_posture IN ('enabled', 'observe_only', 'blocked')),
  approval_posture TEXT NOT NULL CHECK (approval_posture IN ('single_review', 'dual_review', 'blocked')),
  fallback_mode TEXT NOT NULL CHECK (
    fallback_mode IN ('shadow_only', 'observe_only', 'read_only_provenance', 'placeholder_only', 'assistive_hidden')
  ),
  threshold_breach_refs JSONB NOT NULL,
  incident_link_refs JSONB NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  resolved_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT route_cohort_posture_authoritative CHECK (
    route_family_ref <> '' AND trust_projection_ref <> '' AND rollout_verdict_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_monitoring_audit_record (
  audit_record_id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  audit_correlation_id TEXT NOT NULL,
  purpose_of_use TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted', 'blocked', 'failed_closed')),
  reason_codes JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT monitoring_phi_safe_refs_only CHECK (
    subject_ref NOT LIKE '%transcript:%' AND subject_ref NOT LIKE '%prompt-fragment:%'
  )
);
