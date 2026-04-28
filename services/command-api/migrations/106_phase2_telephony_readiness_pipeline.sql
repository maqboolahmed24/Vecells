CREATE TABLE IF NOT EXISTS phase2_transcript_jobs (
  transcript_job_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  recording_artifact_ref TEXT NOT NULL,
  audio_ingest_settlement_ref TEXT NOT NULL,
  recording_document_reference_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  job_state TEXT NOT NULL CHECK (job_state IN ('queued', 'running', 'succeeded', 'degraded', 'failed')),
  worker_attempt_count INTEGER NOT NULL CHECK (worker_attempt_count >= 0),
  supersedes_transcript_job_ref TEXT,
  derivation_package_ref TEXT,
  transcript_readiness_ref TEXT,
  evidence_readiness_assessment_ref TEXT,
  terminal_outcome TEXT NOT NULL CHECK (
    terminal_outcome IN ('pending', 'ready', 'degraded', 'failed', 'unusable_terminal')
  ),
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-transcript-readiness-191.v1'
  ),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyReadinessPipeline',
  CHECK (created_by_authority = 'TelephonyReadinessPipeline'),
  UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS phase2_transcript_derivation_packages (
  derivation_package_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  transcript_job_ref TEXT NOT NULL REFERENCES phase2_transcript_jobs(transcript_job_ref),
  capture_bundle_ref TEXT NOT NULL,
  derivation_class TEXT NOT NULL CHECK (
    derivation_class = 'telephony_transcript_and_fact_extraction'
  ),
  input_artifact_refs TEXT[] NOT NULL,
  derivation_version_ref TEXT NOT NULL CHECK (
    derivation_version_ref = 'phase2-telephony-fact-extractor-191.v1'
  ),
  output_ref TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  transcript_artifact_ref TEXT NOT NULL CHECK (
    transcript_artifact_ref LIKE 'artifact://telephony-transcript/%'
  ),
  transcript_artifact_digest TEXT NOT NULL,
  materiality_class TEXT NOT NULL CHECK (materiality_class = 'clinically_material'),
  supersedes_derivation_package_ref TEXT,
  derived_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyReadinessPipeline',
  CHECK (created_by_authority = 'TelephonyReadinessPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_safety_facts (
  telephony_safety_facts_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  transcript_job_ref TEXT NOT NULL REFERENCES phase2_transcript_jobs(transcript_job_ref),
  derivation_package_ref TEXT NOT NULL,
  extraction_version_ref TEXT NOT NULL CHECK (
    extraction_version_ref = 'phase2-telephony-fact-extractor-191.v1'
  ),
  transcript_digest TEXT NOT NULL,
  transcript_word_count INTEGER NOT NULL CHECK (transcript_word_count >= 0),
  transcript_fact_signals JSONB NOT NULL,
  keypad_fact_signals JSONB NOT NULL,
  operator_supplement_refs TEXT[] NOT NULL,
  contradiction_flags TEXT[] NOT NULL,
  coverage_gaps TEXT[] NOT NULL,
  clinically_relevant_snippet_refs TEXT[] NOT NULL,
  fact_completeness TEXT NOT NULL CHECK (fact_completeness IN ('none', 'partial', 'complete')),
  created_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyReadinessPipeline',
  CHECK (created_by_authority = 'TelephonyReadinessPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_transcript_readiness_records (
  telephony_transcript_readiness_record_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  recording_artifact_ref TEXT NOT NULL,
  transcript_job_ref TEXT NOT NULL REFERENCES phase2_transcript_jobs(transcript_job_ref),
  transcript_state TEXT NOT NULL CHECK (
    transcript_state IN (
      'not_started',
      'queued',
      'running',
      'partial',
      'ready',
      'degraded',
      'failed',
      'superseded'
    )
  ),
  coverage_class TEXT NOT NULL CHECK (
    coverage_class IN ('none', 'keyword_only', 'partial_utterance', 'clinically_sufficient')
  ),
  quality_band TEXT NOT NULL CHECK (quality_band IN ('unknown', 'low', 'medium', 'high')),
  contradiction_posture TEXT NOT NULL CHECK (
    contradiction_posture IN ('none', 'suspected', 'unresolved', 'resolved')
  ),
  segment_completeness_posture TEXT NOT NULL CHECK (
    segment_completeness_posture IN ('missing', 'partial', 'complete')
  ),
  extraction_completeness_posture TEXT NOT NULL CHECK (
    extraction_completeness_posture IN ('not_started', 'partial', 'complete', 'failed')
  ),
  derivation_package_ref TEXT,
  derived_facts_package_ref TEXT,
  blocking_reason_codes TEXT[] NOT NULL,
  supersedes_transcript_readiness_ref TEXT,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-transcript-readiness-191.v1'
  ),
  checked_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyReadinessPipeline',
  CHECK (created_by_authority = 'TelephonyReadinessPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_evidence_readiness_assessments (
  telephony_evidence_readiness_assessment_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  submission_envelope_ref TEXT,
  urgent_live_assessment_ref TEXT,
  transcript_readiness_ref TEXT,
  structured_capture_refs TEXT[] NOT NULL,
  identity_evidence_refs TEXT[] NOT NULL,
  contact_route_evidence_refs TEXT[] NOT NULL,
  manual_review_disposition_ref TEXT,
  continuation_eligibility_ref TEXT,
  usability_state TEXT NOT NULL CHECK (
    usability_state IN (
      'awaiting_recording',
      'awaiting_transcript',
      'awaiting_structured_capture',
      'urgent_live_only',
      'safety_usable',
      'manual_review_only',
      'unusable_terminal'
    )
  ),
  promotion_readiness TEXT NOT NULL CHECK (
    promotion_readiness IN ('blocked', 'continuation_only', 'ready_to_seed', 'ready_to_promote')
  ),
  governing_input_refs TEXT[] NOT NULL,
  supersedes_evidence_readiness_assessment_ref TEXT,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-evidence-readiness-191.v1'
  ),
  assessed_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyReadinessPipeline',
  CHECK (created_by_authority = 'TelephonyReadinessPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_manual_audio_review_queue_entries (
  manual_audio_review_queue_entry_ref TEXT PRIMARY KEY,
  manual_review_disposition_ref TEXT NOT NULL,
  call_session_ref TEXT NOT NULL,
  trigger_class TEXT NOT NULL CHECK (
    trigger_class IN (
      'recording_missing',
      'transcript_degraded',
      'contradictory_capture',
      'identity_ambiguous',
      'handset_untrusted',
      'urgent_live_without_routine_evidence'
    )
  ),
  review_mode TEXT NOT NULL CHECK (
    review_mode IN (
      'audio_review',
      'callback_required',
      'staff_transcription',
      'follow_up_needed',
      'abandon'
    )
  ),
  review_state TEXT NOT NULL CHECK (review_state = 'open'),
  transcript_readiness_ref TEXT,
  evidence_readiness_assessment_ref TEXT,
  reason_codes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyReadinessPipeline',
  CHECK (created_by_authority = 'TelephonyReadinessPipeline'),
  UNIQUE (manual_review_disposition_ref)
);

CREATE INDEX IF NOT EXISTS idx_phase2_transcript_jobs_runnable
  ON phase2_transcript_jobs(job_state, updated_at)
  WHERE job_state IN ('queued', 'running');

CREATE INDEX IF NOT EXISTS idx_phase2_transcript_readiness_latest
  ON phase2_telephony_transcript_readiness_records(call_session_ref, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase2_evidence_readiness_latest
  ON phase2_telephony_evidence_readiness_assessments(call_session_ref, assessed_at DESC);

