CREATE TABLE IF NOT EXISTS assistive_prompt_package (
  prompt_package_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  prompt_package_ref TEXT NOT NULL,
  prompt_bundle_hash TEXT NOT NULL,
  release_candidate_ref TEXT,
  watch_tuple_hash TEXT,
  variable_schema_ref TEXT NOT NULL,
  variable_schema_hash TEXT NOT NULL,
  masking_class TEXT NOT NULL,
  disclosure_class TEXT NOT NULL,
  storage_artifact_ref TEXT NOT NULL,
  package_state TEXT NOT NULL,
  canonical_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_prompt_package_release_or_watch_tuple_required CHECK (
    release_candidate_ref IS NOT NULL OR watch_tuple_hash IS NOT NULL
  ),
  CONSTRAINT assistive_prompt_package_hashes_required CHECK (
    length(prompt_bundle_hash) > 0
    AND length(variable_schema_hash) > 0
    AND length(canonical_hash) > 0
  ),
  CONSTRAINT assistive_prompt_package_state_bounded CHECK (
    package_state IN ('draft', 'active', 'superseded', 'revoked')
  )
);

CREATE TABLE IF NOT EXISTS assistive_prompt_snapshot (
  prompt_snapshot_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  prompt_package_ref TEXT NOT NULL REFERENCES assistive_prompt_package(prompt_package_id),
  release_candidate_ref TEXT,
  watch_tuple_hash TEXT,
  masking_class TEXT NOT NULL,
  disclosure_class TEXT NOT NULL,
  variable_schema_ref TEXT NOT NULL,
  variable_schema_hash TEXT NOT NULL,
  rendered_prompt_artifact_ref TEXT,
  protected_prompt_artifact_ref TEXT,
  canonical_hash TEXT NOT NULL,
  snapshot_state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_prompt_snapshot_immutable_hash_required CHECK (length(canonical_hash) > 0),
  CONSTRAINT assistive_prompt_snapshot_release_or_watch_tuple_required CHECK (
    release_candidate_ref IS NOT NULL OR watch_tuple_hash IS NOT NULL
  ),
  CONSTRAINT assistive_prompt_snapshot_state_bounded CHECK (
    snapshot_state IN ('current', 'superseded', 'revoked')
  )
);

CREATE TABLE IF NOT EXISTS assistive_inference_log (
  assistive_inference_log_id TEXT PRIMARY KEY,
  assistive_run_ref TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  model_version_ref TEXT NOT NULL,
  prompt_snapshot_ref TEXT NOT NULL REFERENCES assistive_prompt_snapshot(prompt_snapshot_id),
  input_evidence_snapshot_refs JSONB NOT NULL,
  input_evidence_snapshot_hash TEXT NOT NULL,
  input_capture_bundle_ref TEXT NOT NULL,
  input_derivation_package_refs JSONB NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  output_schema_bundle_ref TEXT NOT NULL,
  calibration_bundle_ref TEXT NOT NULL,
  runtime_image_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  output_artifact_refs JSONB NOT NULL,
  assistive_run_settlement_ref TEXT NOT NULL,
  feedback_chain_ref TEXT,
  protected_input_artifact_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  log_hash TEXT NOT NULL,
  replayability_state TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_inference_log_refs_hashes_only CHECK (
    length(model_version_ref) > 0
    AND length(input_evidence_snapshot_hash) > 0
    AND length(policy_bundle_ref) > 0
    AND length(output_schema_bundle_ref) > 0
    AND length(calibration_bundle_ref) > 0
    AND length(runtime_image_ref) > 0
    AND length(log_hash) > 0
  ),
  CONSTRAINT assistive_inference_log_evidence_refs_required CHECK (
    jsonb_array_length(input_evidence_snapshot_refs) > 0
    AND jsonb_array_length(input_derivation_package_refs) > 0
    AND jsonb_array_length(output_artifact_refs) > 0
  ),
  CONSTRAINT assistive_inference_log_replayability_bounded CHECK (
    replayability_state IN ('replayable', 'degraded', 'blocked')
  )
);

CREATE TABLE IF NOT EXISTS assistive_provenance_envelope (
  provenance_envelope_id TEXT PRIMARY KEY,
  artifact_ref TEXT NOT NULL,
  artifact_revision_ref TEXT NOT NULL,
  capability_code TEXT NOT NULL,
  assistive_inference_log_ref TEXT NOT NULL REFERENCES assistive_inference_log(assistive_inference_log_id),
  input_evidence_snapshot_ref TEXT NOT NULL,
  input_evidence_snapshot_hash TEXT NOT NULL,
  input_capture_bundle_ref TEXT NOT NULL,
  input_derivation_package_refs JSONB NOT NULL,
  model_version_ref TEXT NOT NULL,
  prompt_snapshot_ref TEXT NOT NULL REFERENCES assistive_prompt_snapshot(prompt_snapshot_id),
  output_schema_bundle_ref TEXT NOT NULL,
  calibration_bundle_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  runtime_image_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  feedback_chain_ref TEXT,
  final_human_artifact_ref TEXT,
  authoritative_workflow_settlement_ref TEXT,
  freshness_state TEXT NOT NULL,
  trust_state TEXT NOT NULL,
  continuity_validation_state TEXT NOT NULL,
  masking_class TEXT NOT NULL,
  disclosure_class TEXT NOT NULL,
  replayability_state TEXT NOT NULL,
  envelope_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_provenance_one_per_artifact_revision UNIQUE (artifact_ref, artifact_revision_ref),
  CONSTRAINT assistive_provenance_replay_refs_required CHECK (
    length(model_version_ref) > 0
    AND length(prompt_snapshot_ref) > 0
    AND length(input_evidence_snapshot_hash) > 0
    AND length(output_schema_bundle_ref) > 0
    AND length(calibration_bundle_ref) > 0
    AND length(policy_bundle_ref) > 0
    AND length(runtime_image_ref) > 0
    AND length(envelope_hash) > 0
  ),
  CONSTRAINT assistive_provenance_replayability_bounded CHECK (
    replayability_state IN ('replayable', 'degraded', 'blocked')
  )
);

CREATE TABLE IF NOT EXISTS assistive_replay_manifest (
  replay_manifest_id TEXT PRIMARY KEY,
  provenance_envelope_ref TEXT NOT NULL REFERENCES assistive_provenance_envelope(provenance_envelope_id),
  assistive_inference_log_ref TEXT NOT NULL REFERENCES assistive_inference_log(assistive_inference_log_id),
  model_version_ref TEXT NOT NULL,
  prompt_snapshot_ref TEXT NOT NULL REFERENCES assistive_prompt_snapshot(prompt_snapshot_id),
  input_evidence_snapshot_refs JSONB NOT NULL,
  input_evidence_snapshot_hash TEXT NOT NULL,
  input_capture_bundle_ref TEXT NOT NULL,
  input_derivation_package_refs JSONB NOT NULL,
  output_schema_bundle_ref TEXT NOT NULL,
  calibration_bundle_ref TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  runtime_image_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_candidate_ref TEXT,
  watch_tuple_hash TEXT,
  replay_harness_version_ref TEXT NOT NULL,
  protected_artifact_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  manifest_hash TEXT NOT NULL,
  manifest_state TEXT NOT NULL,
  assembled_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_replay_manifest_pins_runtime CHECK (
    length(model_version_ref) > 0
    AND length(prompt_snapshot_ref) > 0
    AND length(input_evidence_snapshot_hash) > 0
    AND length(output_schema_bundle_ref) > 0
    AND length(calibration_bundle_ref) > 0
    AND length(policy_bundle_ref) > 0
    AND length(runtime_image_ref) > 0
    AND length(replay_harness_version_ref) > 0
  ),
  CONSTRAINT assistive_replay_manifest_release_or_watch_tuple_required CHECK (
    release_candidate_ref IS NOT NULL OR watch_tuple_hash IS NOT NULL
  ),
  CONSTRAINT assistive_replay_manifest_state_bounded CHECK (
    manifest_state IN ('assembled', 'blocked', 'superseded')
  )
);

CREATE TABLE IF NOT EXISTS feedback_eligibility_flag (
  feedback_flag_id TEXT PRIMARY KEY,
  assistive_feedback_chain_ref TEXT NOT NULL,
  assistive_capability_trust_envelope_ref TEXT NOT NULL,
  override_record_id TEXT,
  final_human_artifact_ref TEXT,
  authoritative_workflow_settlement_ref TEXT,
  provenance_envelope_ref TEXT NOT NULL REFERENCES assistive_provenance_envelope(provenance_envelope_id),
  eligible_for_training BOOLEAN NOT NULL,
  eligibility_state TEXT NOT NULL,
  exclusion_reason TEXT,
  requires_adjudication BOOLEAN NOT NULL,
  adjudication_case_ref TEXT,
  latest_incident_link_ref TEXT,
  label_quality_state TEXT NOT NULL,
  counterfactual_completeness_state TEXT NOT NULL,
  supersedes_feedback_flag_ref TEXT REFERENCES feedback_eligibility_flag(feedback_flag_id),
  evaluated_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT feedback_eligibility_state_bounded CHECK (
    eligibility_state IN (
      'pending_settlement',
      'requires_adjudication',
      'eligible',
      'excluded',
      'revoked'
    )
  ),
  CONSTRAINT feedback_eligibility_settlement_backed CHECK (
    eligible_for_training = FALSE
    OR (
      eligibility_state = 'eligible'
      AND final_human_artifact_ref IS NOT NULL
      AND authoritative_workflow_settlement_ref IS NOT NULL
      AND label_quality_state IN ('routine_clean', 'adjudicated')
    )
  ),
  CONSTRAINT feedback_eligibility_revoked_points_back CHECK (
    eligibility_state <> 'revoked' OR supersedes_feedback_flag_ref IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS trainability_revocation_record (
  revocation_record_id TEXT PRIMARY KEY,
  previous_feedback_flag_ref TEXT NOT NULL REFERENCES feedback_eligibility_flag(feedback_flag_id),
  replacement_feedback_flag_ref TEXT NOT NULL REFERENCES feedback_eligibility_flag(feedback_flag_id),
  assistive_feedback_chain_ref TEXT NOT NULL,
  revocation_reason TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  incident_link_ref TEXT,
  adjudication_case_ref TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT trainability_revocation_reason_bounded CHECK (
    revocation_reason IN (
      'incident_linked',
      'final_artifact_superseded',
      'adjudication_outcome',
      'exclusion_decision',
      'provenance_invalidated'
    )
  )
);

CREATE TABLE IF NOT EXISTS assistive_provenance_export_decision (
  export_decision_id TEXT PRIMARY KEY,
  provenance_envelope_ref TEXT NOT NULL REFERENCES assistive_provenance_envelope(provenance_envelope_id),
  replay_manifest_ref TEXT REFERENCES assistive_replay_manifest(replay_manifest_id),
  export_audience TEXT NOT NULL,
  requested_layer TEXT NOT NULL,
  outbound_navigation_grant_ref TEXT,
  artifact_presentation_contract_ref TEXT NOT NULL,
  decision_state TEXT NOT NULL,
  allowed_artifact_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocking_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  decided_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_provenance_export_decision_bounded CHECK (
    decision_state IN ('allowed', 'blocked', 'redacted_summary_only')
  ),
  CONSTRAINT assistive_provenance_export_guard_blocks_raw_content CHECK (
    decision_state <> 'allowed'
    OR jsonb_array_length(blocking_reason_codes) = 0
  ),
  CONSTRAINT assistive_provenance_export_external_handoff_granted CHECK (
    export_audience <> 'external_handoff' OR outbound_navigation_grant_ref IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS assistive_provenance_audit_record (
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
  CONSTRAINT assistive_provenance_audit_outcome_bounded CHECK (
    outcome IN ('accepted', 'blocked', 'failed_closed')
  )
);
