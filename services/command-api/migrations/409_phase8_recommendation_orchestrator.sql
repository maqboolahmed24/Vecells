-- Phase 8 task 409: bounded risk extraction, question suggestion, and endpoint recommendation orchestrator.
-- The schema stores review-only suggestions, calibrated full-space support, abstention, draft insertion leases,
-- and authoritative suggestion action settlements. It does not store endpoint decisions or mutate workflow state.

CREATE TABLE IF NOT EXISTS assistive_suggestion_calibration_bundle (
  calibration_bundle_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  release_cohort_ref TEXT NOT NULL,
  watch_tuple_ref TEXT NOT NULL,
  calibration_version TEXT NOT NULL,
  risk_matrix_version TEXT NOT NULL,
  uncertainty_selector_version_ref TEXT NOT NULL,
  conformal_bundle_ref TEXT NOT NULL,
  threshold_set_ref TEXT NOT NULL,
  validated_calibration_state TEXT NOT NULL CHECK (validated_calibration_state IN ('validated', 'missing', 'expired', 'invalid')),
  validated_uncertainty_selector_state TEXT NOT NULL CHECK (validated_uncertainty_selector_state IN ('validated', 'missing', 'expired', 'invalid')),
  validated_conformal_state TEXT NOT NULL CHECK (validated_conformal_state IN ('validated', 'missing', 'expired', 'invalid')),
  fixed_hypothesis_space JSONB NOT NULL,
  coverage_target NUMERIC NOT NULL,
  risk_target NUMERIC NOT NULL,
  nonconformity_version TEXT NOT NULL,
  q_alpha NUMERIC NOT NULL,
  thresholds JSONB NOT NULL,
  loss_matrix JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_suggestion_full_space_required CHECK (jsonb_array_length(fixed_hypothesis_space) > 0),
  CONSTRAINT assistive_suggestion_calibration_probability_bounds CHECK (
    coverage_target >= 0
    AND coverage_target <= 1
    AND risk_target >= 0
    AND risk_target <= 1
    AND q_alpha >= 0
    AND q_alpha <= 1
  )
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_rule_guard_result (
  guard_result_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  context_snapshot_id TEXT NOT NULL,
  hard_stop_triggered BOOLEAN NOT NULL,
  conflict_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_endpoint_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_suggestion_set JSONB NOT NULL,
  allowed_suggestion_set_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_suggestion_allowed_set_hash_required CHECK (allowed_suggestion_set_hash <> '')
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_risk_signal (
  risk_signal_id TEXT PRIMARY KEY,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  supporting_evidence_refs JSONB NOT NULL,
  posterior_probability NUMERIC NOT NULL,
  confidence_descriptor TEXT NOT NULL CHECK (confidence_descriptor IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')),
  rule_guard_state TEXT NOT NULL CHECK (rule_guard_state IN ('allowed', 'blocked_by_guard', 'hard_stop')),
  evidence_coverage NUMERIC NOT NULL,
  CONSTRAINT assistive_suggestion_risk_signal_score_bounds CHECK (
    posterior_probability >= 0
    AND posterior_probability <= 1
    AND evidence_coverage >= 0
    AND evidence_coverage <= 1
  )
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_question_recommendation (
  recommendation_id TEXT PRIMARY KEY,
  question_set_ref TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  posterior_probability NUMERIC NOT NULL,
  confidence_descriptor TEXT NOT NULL CHECK (confidence_descriptor IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')),
  evidence_refs JSONB NOT NULL,
  evidence_coverage NUMERIC NOT NULL,
  CONSTRAINT assistive_suggestion_question_score_bounds CHECK (
    posterior_probability >= 0
    AND posterior_probability <= 1
    AND evidence_coverage >= 0
    AND evidence_coverage <= 1
  )
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_endpoint_hypothesis (
  hypothesis_id TEXT PRIMARY KEY,
  endpoint_code TEXT NOT NULL,
  ranking_position INTEGER NOT NULL,
  rationale_ref TEXT NOT NULL,
  supporting_evidence_refs JSONB NOT NULL,
  posterior_probability NUMERIC NOT NULL,
  allowed_conditional_probability NUMERIC NOT NULL,
  confidence_descriptor TEXT NOT NULL CHECK (confidence_descriptor IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')),
  expected_harm NUMERIC NOT NULL,
  evidence_coverage NUMERIC NOT NULL,
  margin_to_runner_up NUMERIC NOT NULL,
  prediction_set_state TEXT NOT NULL CHECK (prediction_set_state IN ('in_set', 'out_of_set', 'blocked_by_guard')),
  rule_guard_state TEXT NOT NULL CHECK (rule_guard_state IN ('allowed', 'blocked_by_guard', 'hard_stop')),
  insert_eligible BOOLEAN NOT NULL,
  CONSTRAINT assistive_suggestion_hypothesis_score_bounds CHECK (
    posterior_probability >= 0
    AND posterior_probability <= 1
    AND allowed_conditional_probability >= 0
    AND allowed_conditional_probability <= 1
    AND expected_harm >= 0
    AND evidence_coverage >= 0
    AND evidence_coverage <= 1
  )
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_conformal_prediction_set (
  prediction_set_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  context_snapshot_id TEXT NOT NULL,
  included_hypotheses JSONB NOT NULL,
  coverage_target NUMERIC NOT NULL,
  risk_target NUMERIC NOT NULL,
  nonconformity_version TEXT NOT NULL,
  constructed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_surface_binding (
  suggestion_surface_binding_id TEXT PRIMARY KEY,
  suggestion_envelope_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  assistive_surface_binding_ref TEXT NOT NULL,
  staff_workspace_consistency_projection_ref TEXT NOT NULL,
  workspace_slice_trust_projection_ref TEXT NOT NULL,
  audience_surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  binding_state TEXT NOT NULL CHECK (binding_state IN ('live', 'observe_only', 'stale', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_envelope (
  suggestion_envelope_id TEXT PRIMARY KEY,
  context_snapshot_id TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  priority_band_suggestion TEXT NOT NULL,
  risk_signal_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  endpoint_hypotheses JSONB NOT NULL,
  question_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_hypothesis_ref TEXT,
  confidence_descriptor TEXT NOT NULL CHECK (confidence_descriptor IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')),
  allowed_set_mass NUMERIC NOT NULL,
  epistemic_uncertainty NUMERIC NOT NULL,
  prediction_set_ref TEXT NOT NULL REFERENCES assistive_suggestion_conformal_prediction_set(prediction_set_id),
  abstention_state TEXT NOT NULL CHECK (abstention_state IN ('none', 'review_only', 'full')),
  calibration_version TEXT NOT NULL,
  risk_matrix_version TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch TEXT NOT NULL,
  allowed_suggestion_set_hash TEXT NOT NULL,
  surface_binding_ref TEXT NOT NULL REFERENCES assistive_suggestion_surface_binding(suggestion_surface_binding_id),
  one_click_insert_state TEXT NOT NULL CHECK (one_click_insert_state IN ('armed', 'observe_only', 'blocked')),
  stale_at TIMESTAMPTZ,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_suggestion_envelope_score_bounds CHECK (
    allowed_set_mass >= 0
    AND allowed_set_mass <= 1
    AND epistemic_uncertainty >= 0
    AND epistemic_uncertainty <= 1
  ),
  CONSTRAINT assistive_suggestion_top_only_when_not_full_abstain CHECK (abstention_state <> 'full' OR top_hypothesis_ref IS NULL),
  CONSTRAINT assistive_suggestion_insert_only_when_not_abstained CHECK (one_click_insert_state <> 'armed' OR abstention_state = 'none')
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_abstention_record (
  abstention_id TEXT PRIMARY KEY,
  suggestion_envelope_ref TEXT NOT NULL REFERENCES assistive_suggestion_envelope(suggestion_envelope_id),
  capability_code TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  context_snapshot_id TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch TEXT NOT NULL,
  diagnostic_metric_ref TEXT NOT NULL,
  review_only_state TEXT NOT NULL CHECK (review_only_state IN ('observe_only', 'blocked', 'full_abstain')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_draft_insertion_lease (
  suggestion_draft_insertion_lease_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  suggestion_envelope_ref TEXT NOT NULL REFERENCES assistive_suggestion_envelope(suggestion_envelope_id),
  decision_epoch_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  decision_dock_ref TEXT NOT NULL,
  draft_insertion_point_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch TEXT NOT NULL,
  allowed_suggestion_set_hash TEXT NOT NULL,
  slot_hash TEXT NOT NULL,
  lease_state TEXT NOT NULL CHECK (lease_state IN ('live', 'consumed', 'stale', 'expired', 'revoked')),
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_suggestion_lease_expiry_order CHECK (expires_at > issued_at)
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_action_record (
  suggestion_action_record_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  suggestion_envelope_ref TEXT NOT NULL REFERENCES assistive_suggestion_envelope(suggestion_envelope_id),
  suggestion_draft_insertion_lease_ref TEXT REFERENCES assistive_suggestion_draft_insertion_lease(suggestion_draft_insertion_lease_id),
  assistive_artifact_action_record_ref TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('insert_draft', 'regenerate', 'dismiss', 'acknowledge_abstain')),
  decision_dock_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch TEXT NOT NULL,
  allowed_suggestion_set_hash TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  CONSTRAINT assistive_suggestion_insert_action_requires_lease CHECK (
    action_type <> 'insert_draft' OR suggestion_draft_insertion_lease_ref IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_action_settlement (
  suggestion_action_settlement_id TEXT PRIMARY KEY,
  suggestion_action_record_ref TEXT NOT NULL REFERENCES assistive_suggestion_action_record(suggestion_action_record_id),
  command_settlement_record_ref TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  result TEXT NOT NULL CHECK (
    result IN (
      'draft_inserted',
      'regenerated',
      'dismissed',
      'abstention_acknowledged',
      'observe_only',
      'stale_recoverable',
      'blocked_policy',
      'blocked_posture',
      'failed'
    )
  ),
  release_recovery_disposition_ref TEXT NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_presentation_artifact (
  suggestion_presentation_artifact_id TEXT PRIMARY KEY,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('endpoint_explainer', 'risk_signal_summary', 'question_set_preview', 'abstention_notice')),
  suggestion_envelope_ref TEXT NOT NULL REFERENCES assistive_suggestion_envelope(suggestion_envelope_id),
  summary_ref TEXT NOT NULL,
  artifact_presentation_contract_ref TEXT NOT NULL,
  outbound_navigation_grant_policy_ref TEXT,
  masking_policy_ref TEXT NOT NULL,
  external_handoff_policy_ref TEXT,
  artifact_state TEXT NOT NULL CHECK (artifact_state IN ('summary_only', 'interactive_same_shell', 'recovery_only', 'blocked')),
  blocking_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_suggestion_external_handoff_has_grant CHECK (
    external_handoff_policy_ref IS NULL OR outbound_navigation_grant_policy_ref IS NOT NULL OR artifact_state = 'blocked'
  )
);

CREATE TABLE IF NOT EXISTS assistive_suggestion_audit_record (
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
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assistive_suggestion_envelope_context
  ON assistive_suggestion_envelope(context_snapshot_id, decision_epoch_ref, policy_bundle_ref);

CREATE INDEX IF NOT EXISTS idx_assistive_suggestion_envelope_abstention
  ON assistive_suggestion_envelope(abstention_state, one_click_insert_state);

CREATE INDEX IF NOT EXISTS idx_assistive_suggestion_action_settlement
  ON assistive_suggestion_action_settlement(suggestion_action_record_ref, result);
