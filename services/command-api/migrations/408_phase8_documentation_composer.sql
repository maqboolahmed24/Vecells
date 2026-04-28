-- Phase 8 task 408: structured documentation composer.
-- This schema stores frozen context refs, approved templates, calibration bundles, immutable evidence maps,
-- contradiction checks, draft artifacts, and presentation posture. It does not store raw draft text or final writeback.

CREATE TABLE IF NOT EXISTS assistive_documentation_context_snapshot (
  context_snapshot_id TEXT PRIMARY KEY,
  request_ref TEXT NOT NULL,
  task_ref TEXT NOT NULL,
  review_bundle_ref TEXT NOT NULL,
  transcript_refs JSONB NOT NULL,
  attachment_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  history_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  template_ref TEXT NOT NULL,
  review_version_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  lineage_fence_epoch TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  context_hash TEXT NOT NULL,
  context_state TEXT NOT NULL DEFAULT 'frozen' CHECK (context_state = 'frozen'),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_documentation_context_transcripts_required CHECK (jsonb_array_length(transcript_refs) > 0),
  CONSTRAINT assistive_documentation_context_no_mutable_request CHECK (request_ref NOT ILIKE 'mutable:%' AND request_ref NOT ILIKE '%mutable_current%')
);

CREATE TABLE IF NOT EXISTS assistive_documentation_template_registry (
  draft_template_id TEXT PRIMARY KEY,
  draft_family TEXT NOT NULL CHECK (
    draft_family IN (
      'triage_summary',
      'clinician_note_draft',
      'patient_message_draft',
      'callback_summary',
      'pharmacy_or_booking_handoff_summary'
    )
  ),
  approved_template_version_ref TEXT NOT NULL,
  approved_state TEXT NOT NULL CHECK (approved_state IN ('draft', 'approved', 'revoked')),
  required_section_types JSONB NOT NULL,
  optional_section_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  calibration_profile_ref TEXT NOT NULL,
  artifact_presentation_contract_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_documentation_template_sections_required CHECK (jsonb_array_length(required_section_types) > 0)
);

CREATE TABLE IF NOT EXISTS assistive_documentation_calibration_bundle (
  calibration_bundle_id TEXT PRIMARY KEY,
  calibration_profile_ref TEXT NOT NULL,
  release_cohort_ref TEXT NOT NULL,
  watch_tuple_ref TEXT NOT NULL,
  calibration_version TEXT NOT NULL,
  validated_window_state TEXT NOT NULL CHECK (validated_window_state IN ('validated', 'missing', 'expired', 'invalid')),
  c_doc_render NUMERIC NOT NULL,
  theta_doc_render NUMERIC NOT NULL,
  lambda_conflict NUMERIC NOT NULL,
  lambda_unsupported NUMERIC NOT NULL,
  lambda_missing NUMERIC NOT NULL,
  buckets JSONB NOT NULL,
  visible_confidence_allowed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_documentation_calibration_thresholds CHECK (
    c_doc_render >= 0
    AND c_doc_render <= 1
    AND theta_doc_render >= 0
    AND theta_doc_render <= 1
    AND lambda_conflict >= 0
    AND lambda_unsupported >= 0
    AND lambda_missing >= 0
  ),
  CONSTRAINT assistive_documentation_visible_confidence_requires_validated_window CHECK (
    visible_confidence_allowed = FALSE OR validated_window_state = 'validated'
  )
);

CREATE TABLE IF NOT EXISTS assistive_documentation_evidence_map_set (
  evidence_map_set_id TEXT PRIMARY KEY,
  artifact_ref TEXT NOT NULL,
  artifact_revision_ref TEXT NOT NULL,
  context_snapshot_id TEXT NOT NULL REFERENCES assistive_documentation_context_snapshot(context_snapshot_id),
  map_hash TEXT NOT NULL,
  map_state TEXT NOT NULL DEFAULT 'immutable' CHECK (map_state = 'immutable'),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (artifact_ref, artifact_revision_ref, context_snapshot_id, map_hash)
);

CREATE TABLE IF NOT EXISTS assistive_documentation_evidence_map (
  evidence_map_id TEXT PRIMARY KEY,
  evidence_map_set_ref TEXT NOT NULL REFERENCES assistive_documentation_evidence_map_set(evidence_map_set_id),
  output_span_ref TEXT NOT NULL,
  source_evidence_refs JSONB NOT NULL,
  support_weight NUMERIC NOT NULL,
  required_weight NUMERIC NOT NULL,
  support_strength TEXT NOT NULL CHECK (support_strength IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')),
  CONSTRAINT assistive_documentation_evidence_weight_bounds CHECK (
    support_weight >= 0
    AND required_weight > 0
    AND support_weight <= required_weight
  ),
  CONSTRAINT assistive_documentation_source_evidence_required CHECK (jsonb_array_length(source_evidence_refs) > 0)
);

CREATE TABLE IF NOT EXISTS assistive_documentation_contradiction_check (
  check_result_id TEXT PRIMARY KEY,
  artifact_ref TEXT NOT NULL,
  contradiction_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  unsupported_assertion_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  template_conformance_state TEXT NOT NULL CHECK (template_conformance_state IN ('conformant', 'non_conformant', 'not_checked')),
  unsupported_assertion_rate NUMERIC NOT NULL,
  risk_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_documentation_contradiction_rate_bounds CHECK (
    unsupported_assertion_rate >= 0
    AND unsupported_assertion_rate <= 1
    AND risk_score >= 0
    AND risk_score <= 1
  )
);

CREATE TABLE IF NOT EXISTS assistive_documentation_draft_section (
  section_id TEXT PRIMARY KEY,
  section_type TEXT NOT NULL,
  section_state TEXT NOT NULL CHECK (section_state IN ('rendered', 'abstained', 'missing_info')),
  generated_text_ref TEXT,
  output_span_ref TEXT NOT NULL,
  evidence_span_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_info_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_probability NUMERIC NOT NULL,
  evidence_coverage NUMERIC NOT NULL,
  unsupported_assertion_risk NUMERIC NOT NULL,
  confidence_descriptor TEXT NOT NULL CHECK (confidence_descriptor IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')),
  CONSTRAINT assistive_documentation_rendered_section_has_text_ref CHECK (section_state <> 'rendered' OR generated_text_ref IS NOT NULL),
  CONSTRAINT assistive_documentation_section_score_bounds CHECK (
    support_probability >= 0
    AND support_probability <= 1
    AND evidence_coverage >= 0
    AND evidence_coverage <= 1
    AND unsupported_assertion_risk >= 0
    AND unsupported_assertion_risk <= 1
  )
);

CREATE TABLE IF NOT EXISTS assistive_documentation_draft_note_artifact (
  draft_note_id TEXT PRIMARY KEY,
  draft_family TEXT NOT NULL CHECK (
    draft_family IN (
      'triage_summary',
      'clinician_note_draft',
      'patient_message_draft',
      'callback_summary',
      'pharmacy_or_booking_handoff_summary'
    )
  ),
  context_snapshot_id TEXT NOT NULL REFERENCES assistive_documentation_context_snapshot(context_snapshot_id),
  template_ref TEXT NOT NULL REFERENCES assistive_documentation_template_registry(draft_template_id),
  artifact_revision_ref TEXT NOT NULL,
  section_refs JSONB NOT NULL,
  overall_confidence_descriptor TEXT NOT NULL CHECK (
    overall_confidence_descriptor IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')
  ),
  minimum_section_support NUMERIC NOT NULL,
  unsupported_assertion_risk NUMERIC NOT NULL,
  abstention_state TEXT NOT NULL CHECK (abstention_state IN ('none', 'partial', 'full')),
  calibration_version TEXT NOT NULL,
  calibration_bundle_ref TEXT NOT NULL REFERENCES assistive_documentation_calibration_bundle(calibration_bundle_id),
  release_cohort_ref TEXT NOT NULL,
  watch_tuple_ref TEXT NOT NULL,
  evidence_map_set_ref TEXT NOT NULL REFERENCES assistive_documentation_evidence_map_set(evidence_map_set_id),
  contradiction_check_result_ref TEXT NOT NULL REFERENCES assistive_documentation_contradiction_check(check_result_id),
  artifact_presentation_contract_ref TEXT NOT NULL,
  visible_confidence_allowed BOOLEAN NOT NULL,
  draft_state TEXT NOT NULL CHECK (draft_state IN ('candidate', 'renderable', 'partial_abstention', 'full_abstention', 'blocked', 'revoked')),
  review_state TEXT NOT NULL CHECK (review_state IN ('draft_pending_review', 'reviewed', 'rejected', 'blocked', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_documentation_draft_sections_required CHECK (jsonb_array_length(section_refs) > 0),
  CONSTRAINT assistive_documentation_draft_support_bounds CHECK (
    minimum_section_support >= 0
    AND minimum_section_support <= 1
    AND unsupported_assertion_risk >= 0
    AND unsupported_assertion_risk <= 1
  )
);

CREATE TABLE IF NOT EXISTS assistive_documentation_message_draft_artifact (
  message_draft_id TEXT PRIMARY KEY,
  context_snapshot_id TEXT NOT NULL REFERENCES assistive_documentation_context_snapshot(context_snapshot_id),
  message_type TEXT NOT NULL CHECK (
    message_type IN (
      'triage_summary',
      'clinician_note_draft',
      'patient_message_draft',
      'callback_summary',
      'pharmacy_or_booking_handoff_summary'
    )
  ),
  artifact_revision_ref TEXT NOT NULL,
  body_ref TEXT,
  output_span_ref TEXT NOT NULL,
  support_probability NUMERIC NOT NULL,
  evidence_coverage NUMERIC NOT NULL,
  unsupported_assertion_risk NUMERIC NOT NULL,
  abstention_state TEXT NOT NULL CHECK (abstention_state IN ('none', 'partial', 'full')),
  calibration_version TEXT NOT NULL,
  calibration_bundle_ref TEXT NOT NULL REFERENCES assistive_documentation_calibration_bundle(calibration_bundle_id),
  release_cohort_ref TEXT NOT NULL,
  watch_tuple_ref TEXT NOT NULL,
  evidence_map_set_ref TEXT NOT NULL REFERENCES assistive_documentation_evidence_map_set(evidence_map_set_id),
  contradiction_check_result_ref TEXT NOT NULL REFERENCES assistive_documentation_contradiction_check(check_result_id),
  artifact_presentation_contract_ref TEXT NOT NULL,
  confidence_descriptor TEXT NOT NULL CHECK (confidence_descriptor IN ('suppressed', 'insufficient', 'guarded', 'supported', 'strong')),
  visible_confidence_allowed BOOLEAN NOT NULL,
  review_state TEXT NOT NULL CHECK (review_state IN ('draft_pending_review', 'reviewed', 'rejected', 'blocked', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_documentation_message_body_when_not_abstained CHECK (abstention_state <> 'none' OR body_ref IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS assistive_documentation_presentation_artifact (
  documentation_presentation_artifact_id TEXT PRIMARY KEY,
  artifact_ref TEXT NOT NULL,
  artifact_kind TEXT NOT NULL CHECK (artifact_kind IN ('draft_note', 'message_draft')),
  artifact_presentation_contract_ref TEXT NOT NULL,
  outbound_navigation_grant_policy_ref TEXT,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  artifact_state TEXT NOT NULL CHECK (
    artifact_state IN ('summary_only', 'inline_renderable', 'external_handoff_ready', 'recovery_only', 'blocked', 'revoked')
  ),
  blocking_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_documentation_external_handoff_has_grant CHECK (
    artifact_state <> 'external_handoff_ready' OR outbound_navigation_grant_policy_ref IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS assistive_documentation_audit_record (
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

CREATE INDEX IF NOT EXISTS idx_assistive_documentation_context_request
  ON assistive_documentation_context_snapshot(request_ref, task_ref);

CREATE INDEX IF NOT EXISTS idx_assistive_documentation_map_artifact
  ON assistive_documentation_evidence_map_set(artifact_ref, artifact_revision_ref, context_snapshot_id);

CREATE INDEX IF NOT EXISTS idx_assistive_documentation_draft_state
  ON assistive_documentation_draft_note_artifact(draft_state, abstention_state, visible_confidence_allowed);

CREATE INDEX IF NOT EXISTS idx_assistive_documentation_message_review_state
  ON assistive_documentation_message_draft_artifact(review_state, abstention_state, visible_confidence_allowed);
