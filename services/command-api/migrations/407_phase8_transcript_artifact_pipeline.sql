-- Phase 8 task 407: governed audio, transcript, and artifact-normalization plane.
-- Raw audio/text storage remains behind artifact refs; this schema stores lineage, policy, state, and safe refs.

CREATE TABLE IF NOT EXISTS assistive_transcript_audio_capture_session (
  audio_capture_session_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (
    source_type IN ('telephony_recording', 'uploaded_audio_artifact', 'clinician_dictation_clip', 'live_ambient_capture', 'uploaded_text_artifact')
  ),
  capture_mode TEXT NOT NULL CHECK (
    capture_mode IN ('existing_recording', 'uploaded_artifact', 'manual_dictation', 'manual_start_ambient', 'automatic_ambient')
  ),
  permission_state TEXT NOT NULL CHECK (
    permission_state IN ('not_required_prior_capture', 'informed', 'explicit_granted', 'objected', 'withdrawn', 'blocked', 'policy_pending')
  ),
  permission_evidence_ref TEXT NOT NULL,
  tenant_ambient_policy_ref TEXT,
  local_governance_approval_ref TEXT,
  retention_policy_ref TEXT NOT NULL,
  retention_envelope_ref TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  artifact_ref TEXT NOT NULL,
  source_capture_bundle_ref TEXT,
  artifact_quarantine_state TEXT NOT NULL CHECK (artifact_quarantine_state IN ('quarantined', 'cleared', 'blocked')),
  capture_session_state TEXT NOT NULL CHECK (capture_session_state IN ('open', 'ended', 'blocked', 'superseded')),
  blocking_reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT assistive_transcript_ambient_manual_start CHECK (
    source_type <> 'live_ambient_capture'
    OR (
      capture_mode = 'manual_start_ambient'
      AND permission_state = 'explicit_granted'
      AND tenant_ambient_policy_ref IS NOT NULL
      AND local_governance_approval_ref IS NOT NULL
    )
  ),
  CONSTRAINT assistive_transcript_automatic_ambient_disabled CHECK (capture_mode <> 'automatic_ambient')
);

CREATE TABLE IF NOT EXISTS assistive_transcript_retention_envelope (
  retention_envelope_id TEXT PRIMARY KEY,
  artifact_type TEXT NOT NULL CHECK (
    artifact_type IN (
      'audio_capture',
      'raw_transcript',
      'speaker_segments',
      'clinical_concept_spans',
      'redacted_transcript',
      'transcript_presentation'
    )
  ),
  artifact_ref TEXT NOT NULL,
  retention_basis TEXT NOT NULL,
  delete_after TIMESTAMPTZ NOT NULL,
  review_schedule TEXT NOT NULL,
  legal_hold_ref TEXT,
  retention_freeze_ref TEXT,
  policy_conflict_ref TEXT,
  envelope_state TEXT NOT NULL CHECK (envelope_state IN ('active', 'delete_due', 'blocked', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_transcript_job (
  transcript_job_id TEXT PRIMARY KEY,
  audio_capture_session_ref TEXT NOT NULL REFERENCES assistive_transcript_audio_capture_session(audio_capture_session_id),
  audio_artifact_ref TEXT NOT NULL,
  source_capture_bundle_ref TEXT NOT NULL,
  diarisation_mode TEXT NOT NULL CHECK (diarisation_mode IN ('none', 'single_speaker', 'multi_speaker')),
  language_mode TEXT NOT NULL CHECK (language_mode IN ('english_uk', 'english_second_language', 'multilingual_review_required')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'running', 'completed', 'quarantined', 'failed_closed', 'cancelled')),
  model_version_ref TEXT NOT NULL,
  transcript_model_policy_ref TEXT NOT NULL,
  output_ref TEXT,
  error_ref TEXT,
  supersedes_transcript_artifact_ref TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assistive_transcript_speaker_segment (
  segment_id TEXT PRIMARY KEY,
  speaker_label TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  text_ref TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  CONSTRAINT assistive_transcript_segment_order CHECK (end_ms > start_ms),
  CONSTRAINT assistive_transcript_segment_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE TABLE IF NOT EXISTS assistive_transcript_derivation_package (
  derivation_package_id TEXT PRIMARY KEY,
  source_capture_bundle_ref TEXT NOT NULL,
  transcript_job_ref TEXT NOT NULL REFERENCES assistive_transcript_job(transcript_job_id),
  model_version_ref TEXT NOT NULL,
  diarisation_mode TEXT NOT NULL,
  language_mode TEXT NOT NULL,
  audio_quality_state TEXT NOT NULL CHECK (audio_quality_state IN ('clear', 'noisy', 'low_quality', 'unsupported')),
  diarisation_uncertainty_state TEXT NOT NULL CHECK (diarisation_uncertainty_state IN ('complete', 'uncertain', 'failed')),
  normalization_version_ref TEXT NOT NULL,
  concept_extraction_version_ref TEXT,
  redaction_policy_ref TEXT,
  supersedes_derivation_package_ref TEXT,
  derivation_hash TEXT NOT NULL,
  immutability_state TEXT NOT NULL DEFAULT 'immutable' CHECK (immutability_state = 'immutable'),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_transcript_artifact (
  transcript_artifact_id TEXT PRIMARY KEY,
  audio_capture_session_ref TEXT NOT NULL REFERENCES assistive_transcript_audio_capture_session(audio_capture_session_id),
  source_capture_bundle_ref TEXT NOT NULL,
  derivation_package_ref TEXT NOT NULL REFERENCES assistive_transcript_derivation_package(derivation_package_id),
  raw_transcript_ref TEXT NOT NULL,
  speaker_segments_ref TEXT NOT NULL,
  speaker_segment_refs JSONB NOT NULL,
  confidence_summary TEXT NOT NULL,
  clinical_concept_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  redaction_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  redaction_state TEXT NOT NULL CHECK (redaction_state IN ('pending', 'settled', 'failed', 'not_required')),
  retention_envelope_ref TEXT NOT NULL REFERENCES assistive_transcript_retention_envelope(retention_envelope_id),
  artifact_state TEXT NOT NULL CHECK (artifact_state IN ('candidate', 'normalized', 'quarantined', 'ready_for_drafting', 'superseded', 'revoked')),
  referenced_by_frozen_evidence_snapshot_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  supersedes_transcript_artifact_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_transcript_speaker_segments_required CHECK (jsonb_array_length(speaker_segment_refs) > 0)
);

CREATE TABLE IF NOT EXISTS assistive_transcript_clinical_concept_span (
  concept_span_id TEXT PRIMARY KEY,
  transcript_artifact_ref TEXT NOT NULL REFERENCES assistive_transcript_artifact(transcript_artifact_id),
  source_segment_ref TEXT NOT NULL,
  concept_type TEXT NOT NULL,
  value_ref TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  normalization_ref TEXT NOT NULL,
  CONSTRAINT assistive_transcript_concept_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE TABLE IF NOT EXISTS assistive_transcript_redaction_span (
  redaction_span_id TEXT PRIMARY KEY,
  transcript_artifact_ref TEXT NOT NULL REFERENCES assistive_transcript_artifact(transcript_artifact_id),
  source_segment_ref TEXT NOT NULL,
  redaction_class TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  replacement_ref TEXT NOT NULL,
  policy_ref TEXT NOT NULL,
  CONSTRAINT assistive_transcript_redaction_span_order CHECK (end_offset > start_offset)
);

CREATE TABLE IF NOT EXISTS assistive_transcript_presentation_artifact (
  transcript_presentation_artifact_id TEXT PRIMARY KEY,
  transcript_artifact_ref TEXT NOT NULL REFERENCES assistive_transcript_artifact(transcript_artifact_id),
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
  CONSTRAINT assistive_transcript_external_handoff_has_grant CHECK (
    artifact_state <> 'external_handoff_ready' OR outbound_navigation_grant_policy_ref IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS assistive_transcript_domain_event (
  event_id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL CHECK (event_name IN ('assistive.transcript.ready', 'assistive.context.snapshot.created')),
  subject_ref TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  emitted_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assistive_transcript_audit_record (
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

CREATE INDEX IF NOT EXISTS idx_assistive_transcript_capture_permission
  ON assistive_transcript_audio_capture_session(permission_state, artifact_quarantine_state);

CREATE INDEX IF NOT EXISTS idx_assistive_transcript_job_status
  ON assistive_transcript_job(audio_capture_session_ref, status);

CREATE INDEX IF NOT EXISTS idx_assistive_transcript_artifact_state
  ON assistive_transcript_artifact(artifact_state, redaction_state);

CREATE INDEX IF NOT EXISTS idx_assistive_transcript_retention_state
  ON assistive_transcript_retention_envelope(envelope_state, delete_after);
