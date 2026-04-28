CREATE TABLE IF NOT EXISTS assistive_feedback_chain (
  assistive_feedback_chain_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  assistive_capability_trust_envelope_ref TEXT NOT NULL,
  artifact_ref TEXT NOT NULL,
  artifact_revision_ref TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  task_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch TEXT NOT NULL,
  chain_tuple_hash TEXT NOT NULL,
  action_record_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  latest_action_record_ref TEXT,
  override_record_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_override_record_ref TEXT,
  approval_gate_assessment_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_approval_gate_assessment_ref TEXT,
  current_final_human_artifact_ref TEXT,
  feedback_eligibility_flag_ref TEXT,
  incident_link_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  supersedes_feedback_chain_ref TEXT REFERENCES assistive_feedback_chain(assistive_feedback_chain_id),
  superseded_by_feedback_chain_ref TEXT,
  chain_state TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT assistive_feedback_chain_state_bounded CHECK (
    chain_state IN (
      'in_review',
      'approval_pending',
      'settled_clean',
      'adjudication_pending',
      'excluded',
      'revoked',
      'superseded'
    )
  ),
  CONSTRAINT assistive_feedback_chain_hash_required CHECK (length(artifact_hash) > 0),
  CONSTRAINT assistive_feedback_chain_tuple_hash_required CHECK (length(chain_tuple_hash) > 0),
  CONSTRAINT assistive_feedback_chain_selected_anchor_required CHECK (length(selected_anchor_ref) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS assistive_feedback_chain_one_live_revision_idx
  ON assistive_feedback_chain(chain_tuple_hash)
  WHERE chain_state IN ('in_review', 'approval_pending', 'settled_clean', 'adjudication_pending');

CREATE TABLE IF NOT EXISTS assistive_artifact_action_record (
  action_record_id TEXT PRIMARY KEY,
  assistive_session_id TEXT NOT NULL,
  assistive_feedback_chain_ref TEXT NOT NULL REFERENCES assistive_feedback_chain(assistive_feedback_chain_id),
  assistive_capability_trust_envelope_ref TEXT NOT NULL,
  artifact_ref TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_gesture_key TEXT NOT NULL,
  section_ref TEXT,
  actor_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  review_action_lease_ref TEXT NOT NULL,
  ui_event_envelope_ref TEXT NOT NULL,
  ui_transition_settlement_record_ref TEXT NOT NULL,
  ui_telemetry_disclosure_fence_ref TEXT NOT NULL,
  resulting_override_record_ref TEXT,
  resulting_approval_gate_assessment_ref TEXT,
  resulting_final_human_artifact_ref TEXT,
  resulting_feedback_eligibility_flag_ref TEXT,
  supersedes_action_record_ref TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  authoritative_settlement_state TEXT NOT NULL,
  action_state TEXT NOT NULL,
  CONSTRAINT assistive_action_type_bounded CHECK (
    action_type IN (
      'accept_unchanged',
      'accept_after_edit',
      'reject_to_alternative',
      'abstained_by_human',
      'insert_draft',
      'regenerate',
      'dismiss_suggestion',
      'acknowledge_abstain',
      'stale_recovery'
    )
  ),
  CONSTRAINT assistive_action_gesture_key_required CHECK (length(action_gesture_key) > 0),
  CONSTRAINT assistive_action_same_chain_gesture_unique UNIQUE (
    assistive_feedback_chain_ref,
    action_gesture_key
  ),
  CONSTRAINT assistive_action_settlement_state_bounded CHECK (
    authoritative_settlement_state IN (
      'pending',
      'settled',
      'recovery_required',
      'manual_handoff_required',
      'stale_recoverable'
    )
  ),
  CONSTRAINT assistive_action_state_bounded CHECK (action_state IN ('captured', 'superseded', 'revoked')),
  CONSTRAINT assistive_action_phi_safe_telemetry_required CHECK (
    length(ui_event_envelope_ref) > 0
    AND length(ui_transition_settlement_record_ref) > 0
    AND length(ui_telemetry_disclosure_fence_ref) > 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS assistive_action_gesture_global_idx
  ON assistive_artifact_action_record(action_gesture_key);

CREATE TABLE IF NOT EXISTS override_record (
  override_record_id TEXT PRIMARY KEY,
  assistive_session_id TEXT NOT NULL,
  assistive_feedback_chain_ref TEXT NOT NULL REFERENCES assistive_feedback_chain(assistive_feedback_chain_id),
  assistive_artifact_action_record_ref TEXT NOT NULL REFERENCES assistive_artifact_action_record(action_record_id),
  assistive_capability_trust_envelope_ref TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  model_output_ref TEXT NOT NULL,
  human_output_ref TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  override_disposition TEXT NOT NULL,
  override_scope TEXT NOT NULL,
  changed_span_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  override_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason_requirement_state TEXT NOT NULL,
  free_text_ref TEXT,
  display_confidence_band TEXT NOT NULL,
  allowed_set_mass_at_decision NUMERIC NOT NULL,
  epistemic_uncertainty_at_decision NUMERIC NOT NULL,
  expected_harm_at_decision NUMERIC NOT NULL,
  trust_score_at_decision NUMERIC NOT NULL,
  session_freshness_penalty NUMERIC NOT NULL,
  continuity_validation_state TEXT NOT NULL,
  provenance_envelope_ref TEXT NOT NULL,
  confidence_digest_ref TEXT NOT NULL,
  approval_gate_assessment_ref TEXT,
  final_human_artifact_ref TEXT,
  feedback_eligibility_flag_ref TEXT,
  selected_anchor_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  reason_policy_bundle_ref TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  override_state TEXT NOT NULL,
  CONSTRAINT override_record_disposition_bounded CHECK (
    override_disposition IN (
      'accepted_unchanged',
      'accepted_after_edit',
      'rejected_to_alternative',
      'abstained_by_human'
    )
  ),
  CONSTRAINT override_record_scope_bounded CHECK (
    override_scope IN ('style_only', 'content_material', 'policy_exception', 'trust_recovery')
  ),
  CONSTRAINT override_reason_required_codes_present CHECK (
    reason_requirement_state <> 'required' OR jsonb_array_length(override_reason_codes) > 0
  ),
  CONSTRAINT override_record_no_raw_text CHECK (free_text_ref IS NULL OR free_text_ref LIKE 'artifact:%'),
  CONSTRAINT override_record_state_bounded CHECK (override_state IN ('captured', 'superseded', 'revoked'))
);

CREATE TABLE IF NOT EXISTS human_approval_gate_assessment (
  approval_gate_assessment_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  assistive_feedback_chain_ref TEXT NOT NULL REFERENCES assistive_feedback_chain(assistive_feedback_chain_id),
  assistive_capability_trust_envelope_ref TEXT NOT NULL,
  artifact_ref TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  approval_policy_bundle_ref TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  risk_tier TEXT NOT NULL,
  expected_harm_at_gate NUMERIC NOT NULL,
  required_approver_count INTEGER NOT NULL,
  current_approver_count INTEGER NOT NULL,
  current_approver_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  trust_score_at_gate NUMERIC NOT NULL,
  session_freshness_penalty NUMERIC NOT NULL,
  continuity_validation_state TEXT NOT NULL,
  eligibility_state TEXT NOT NULL,
  blocking_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_human_artifact_ref TEXT,
  computed_at TIMESTAMPTZ NOT NULL,
  assessment_state TEXT NOT NULL,
  CONSTRAINT human_approval_gate_required_count_bounded CHECK (required_approver_count IN (1, 2)),
  CONSTRAINT human_approval_gate_current_count_sane CHECK (current_approver_count >= 0),
  CONSTRAINT human_approval_gate_distinct_approver_refs_present CHECK (
    current_approver_count = jsonb_array_length(current_approver_refs)
  ),
  CONSTRAINT human_approval_gate_eligibility_bounded CHECK (
    eligibility_state IN ('blocked', 'single_review', 'dual_review', 'ready_to_settle')
  ),
  CONSTRAINT human_approval_gate_no_soft_commit CHECK (
    eligibility_state <> 'ready_to_settle' OR current_approver_count >= required_approver_count
  ),
  CONSTRAINT human_approval_gate_assessment_state_bounded CHECK (
    assessment_state IN ('current', 'superseded', 'blocked', 'settled')
  )
);

CREATE TABLE IF NOT EXISTS final_human_artifact (
  final_artifact_id TEXT PRIMARY KEY,
  task_ref TEXT NOT NULL,
  assistive_feedback_chain_ref TEXT NOT NULL REFERENCES assistive_feedback_chain(assistive_feedback_chain_id),
  assistive_capability_trust_envelope_ref TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  content_ref TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  approved_by_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_event_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_at TIMESTAMPTZ NOT NULL,
  approval_mode TEXT NOT NULL,
  approval_gate_assessment_ref TEXT NOT NULL REFERENCES human_approval_gate_assessment(approval_gate_assessment_id),
  source_assistive_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  artifact_presentation_contract_ref TEXT NOT NULL,
  authoritative_workflow_settlement_ref TEXT NOT NULL,
  task_completion_settlement_envelope_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  workflow_settlement_state TEXT NOT NULL,
  superseded_by_final_human_artifact_ref TEXT,
  settled_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT final_human_artifact_type_bounded CHECK (
    artifact_type IN (
      'clinical_note',
      'patient_message',
      'endpoint_decision',
      'question_set',
      'handoff_summary'
    )
  ),
  CONSTRAINT final_human_artifact_approval_mode_bounded CHECK (
    approval_mode IN ('de_novo', 'assistive_seeded', 'assistive_edited')
  ),
  CONSTRAINT final_human_artifact_authoritative_settlement_required CHECK (
    workflow_settlement_state = 'settled'
    AND length(authoritative_workflow_settlement_ref) > 0
    AND length(task_completion_settlement_envelope_ref) > 0
  ),
  CONSTRAINT final_human_artifact_source_assistive_refs_required CHECK (
    jsonb_array_length(source_assistive_refs) > 0
  )
);

CREATE TABLE IF NOT EXISTS assistive_feedback_chain_audit_record (
  audit_record_id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  audit_correlation_id TEXT NOT NULL,
  purpose_of_use TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_feedback_audit_outcome_bounded CHECK (
    outcome IN ('accepted', 'blocked', 'failed_closed')
  )
);
