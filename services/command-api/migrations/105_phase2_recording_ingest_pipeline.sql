CREATE TABLE IF NOT EXISTS phase2_recording_fetch_jobs (
  recording_fetch_job_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  provider_recording_ref TEXT NOT NULL,
  canonical_event_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  retry_count INTEGER NOT NULL CHECK (retry_count >= 0),
  next_retry_at TIMESTAMPTZ,
  timeout_posture TEXT NOT NULL CHECK (
    timeout_posture IN (
      'within_provider_sla',
      'retry_backoff_active',
      'timeout_manual_review',
      'terminal'
    )
  ),
  current_phase TEXT NOT NULL CHECK (
    current_phase IN (
      'scheduled',
      'fetch_pending',
      'fetch_in_progress',
      'fetched_to_quarantine',
      'quarantine_assessed',
      'governed_storage_settled',
      'document_reference_linked',
      'terminal_blocked',
      'terminal_succeeded'
    )
  ),
  quarantine_assessment_ref TEXT,
  object_storage_ref TEXT,
  document_reference_ref TEXT,
  terminal_outcome TEXT NOT NULL CHECK (
    terminal_outcome IN (
      'pending',
      'succeeded',
      'recording_missing',
      'provider_unavailable_retryable',
      'corrupt_or_integrity_failed',
      'unsupported_format',
      'malware_or_scan_blocked',
      'size_or_duration_exceeded',
      'provider_ref_mismatch',
      'manual_audio_review_required'
    )
  ),
  terminal_outcome_at TIMESTAMPTZ,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-recording-ingest-190.v1'
  ),
  retry_policy_version_ref TEXT NOT NULL CHECK (
    retry_policy_version_ref = 'phase2-recording-fetch-retry-190.v1'
  ),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyRecordingIngestPipeline',
  CHECK (created_by_authority = 'TelephonyRecordingIngestPipeline'),
  UNIQUE (call_session_ref, provider_recording_ref),
  UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS phase2_recording_quarantine_objects (
  quarantine_object_ref TEXT PRIMARY KEY,
  recording_fetch_job_ref TEXT NOT NULL REFERENCES phase2_recording_fetch_jobs(recording_fetch_job_ref),
  call_session_ref TEXT NOT NULL,
  provider_recording_ref TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  content_digest TEXT NOT NULL,
  media_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyRecordingIngestPipeline',
  CHECK (created_by_authority = 'TelephonyRecordingIngestPipeline'),
  UNIQUE (recording_fetch_job_ref)
);

CREATE TABLE IF NOT EXISTS phase2_recording_asset_quarantine_assessments (
  quarantine_assessment_ref TEXT PRIMARY KEY,
  recording_fetch_job_ref TEXT NOT NULL REFERENCES phase2_recording_fetch_jobs(recording_fetch_job_ref),
  call_session_ref TEXT NOT NULL,
  provider_recording_ref TEXT NOT NULL,
  quarantine_object_ref TEXT,
  media_family TEXT NOT NULL CHECK (media_family = 'audio'),
  detected_media_type TEXT,
  byte_size INTEGER,
  duration_seconds INTEGER,
  checksum_sha256 TEXT,
  transport_integrity_state TEXT NOT NULL CHECK (
    transport_integrity_state IN ('passed', 'failed', 'not_supplied')
  ),
  provider_authenticity_state TEXT NOT NULL CHECK (
    provider_authenticity_state IN ('passed', 'failed')
  ),
  format_policy_state TEXT NOT NULL CHECK (
    format_policy_state IN ('allowed', 'unsupported', 'size_or_duration_exceeded')
  ),
  malware_scan_state TEXT NOT NULL CHECK (
    malware_scan_state IN ('clean', 'malware', 'unreadable', 'scanner_timeout')
  ),
  quarantine_outcome TEXT NOT NULL CHECK (
    quarantine_outcome IN (
      'clean',
      'retryable_hold',
      'blocked_malware',
      'blocked_integrity',
      'blocked_unsupported_format',
      'blocked_missing',
      'blocked_size_duration',
      'blocked_provider_ref_mismatch'
    )
  ),
  manual_review_disposition_ref TEXT,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-audio-format-scan-policy-190.v1'
  ),
  assessed_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyRecordingIngestPipeline',
  CHECK (created_by_authority = 'TelephonyRecordingIngestPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_recording_governed_audio_objects (
  object_storage_ref TEXT PRIMARY KEY,
  canonical_object_ref TEXT NOT NULL,
  recording_fetch_job_ref TEXT NOT NULL REFERENCES phase2_recording_fetch_jobs(recording_fetch_job_ref),
  call_session_ref TEXT NOT NULL,
  provider_recording_ref TEXT NOT NULL,
  quarantine_object_ref TEXT NOT NULL,
  storage_class TEXT NOT NULL CHECK (storage_class = 'governed_audio'),
  retention_class TEXT NOT NULL CHECK (retention_class = 'clinical_audio_evidence'),
  encryption_key_lineage_ref TEXT NOT NULL,
  content_digest TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (
    media_type IN ('audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm')
  ),
  disclosure_class TEXT NOT NULL CHECK (disclosure_class = 'clinical_evidence_audio'),
  duplicate_asset_detection_ref TEXT NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-audio-governed-object-policy-190.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyRecordingIngestPipeline',
  CHECK (created_by_authority = 'TelephonyRecordingIngestPipeline'),
  UNIQUE (provider_recording_ref, content_digest)
);

CREATE TABLE IF NOT EXISTS phase2_recording_document_reference_links (
  document_reference_link_ref TEXT PRIMARY KEY,
  document_reference_ref TEXT NOT NULL,
  document_reference_logical_id TEXT NOT NULL,
  representation_set_ref TEXT NOT NULL,
  document_reference_record_ref TEXT NOT NULL,
  call_session_ref TEXT NOT NULL,
  provider_recording_ref TEXT NOT NULL,
  object_storage_ref TEXT NOT NULL REFERENCES phase2_recording_governed_audio_objects(object_storage_ref),
  canonical_object_ref TEXT NOT NULL,
  content_digest TEXT NOT NULL,
  media_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  artifact_url TEXT NOT NULL CHECK (artifact_url LIKE 'artifact://recording-audio/%'),
  source_aggregate_refs TEXT[] NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-recording-ingest-190.v1'
  ),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyRecordingIngestPipeline',
  CHECK (created_by_authority = 'TelephonyRecordingIngestPipeline'),
  UNIQUE (call_session_ref, provider_recording_ref),
  UNIQUE (object_storage_ref)
);

CREATE TABLE IF NOT EXISTS phase2_recording_ingest_settlements (
  audio_ingest_settlement_ref TEXT PRIMARY KEY,
  recording_fetch_job_ref TEXT NOT NULL REFERENCES phase2_recording_fetch_jobs(recording_fetch_job_ref),
  call_session_ref TEXT NOT NULL,
  provider_recording_ref TEXT NOT NULL,
  quarantine_assessment_ref TEXT,
  object_storage_ref TEXT,
  document_reference_ref TEXT,
  settlement_outcome TEXT NOT NULL CHECK (
    settlement_outcome IN (
      'governed_audio_ready',
      'recording_missing',
      'manual_audio_review_required',
      'retry_scheduled',
      'blocked_terminal'
    )
  ),
  no_orphan_guarantee TEXT NOT NULL CHECK (
    no_orphan_guarantee IN (
      'quarantine_only_no_governed_object',
      'governed_object_has_document_reference',
      'retry_without_storage'
    )
  ),
  call_session_event_type TEXT NOT NULL CHECK (
    call_session_event_type IN (
      'recording_available',
      'manual_followup_requested',
      'recording_fetch_retry_scheduled'
    )
  ),
  call_session_event_payload_ref TEXT NOT NULL,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (
    policy_version_ref = 'phase2-recording-ingest-190.v1'
  ),
  settled_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyRecordingIngestPipeline',
  CHECK (created_by_authority = 'TelephonyRecordingIngestPipeline')
);

CREATE TABLE IF NOT EXISTS phase2_recording_manual_review_dispositions (
  manual_review_disposition_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL,
  recording_fetch_job_ref TEXT NOT NULL REFERENCES phase2_recording_fetch_jobs(recording_fetch_job_ref),
  provider_recording_ref TEXT NOT NULL,
  trigger_class TEXT NOT NULL CHECK (trigger_class IN ('recording_missing', 'unusable_audio')),
  review_mode TEXT NOT NULL CHECK (
    review_mode IN ('audio_review', 'callback_required', 'staff_transcription', 'follow_up_needed')
  ),
  review_state TEXT NOT NULL CHECK (review_state = 'open'),
  reason_codes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyRecordingIngestPipeline',
  CHECK (created_by_authority = 'TelephonyRecordingIngestPipeline')
);

CREATE INDEX IF NOT EXISTS idx_phase2_recording_fetch_jobs_due
  ON phase2_recording_fetch_jobs(next_retry_at, current_phase)
  WHERE terminal_outcome_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_phase2_recording_quarantine_assessments_job
  ON phase2_recording_asset_quarantine_assessments(recording_fetch_job_ref, assessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase2_recording_document_reference_current
  ON phase2_recording_document_reference_links(call_session_ref, provider_recording_ref);

