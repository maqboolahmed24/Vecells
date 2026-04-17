CREATE TABLE IF NOT EXISTS phase2_call_session_timeout_policies (
  policy_version_ref TEXT PRIMARY KEY,
  menu_selected_timeout_seconds INTEGER NOT NULL CHECK (menu_selected_timeout_seconds = 180),
  identity_in_progress_timeout_seconds INTEGER NOT NULL CHECK (identity_in_progress_timeout_seconds = 240),
  recording_expected_timeout_seconds INTEGER NOT NULL CHECK (recording_expected_timeout_seconds = 600),
  timeout_clock TEXT NOT NULL CHECK (timeout_clock = 'last_state_transition_updated_at'),
  timeout_disposition JSONB NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService')
);

CREATE TABLE IF NOT EXISTS phase2_call_session_canonical_events (
  call_session_event_ref TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  source_canonical_event_ref TEXT NOT NULL,
  source_canonical_event_type TEXT NOT NULL,
  call_session_ref TEXT NOT NULL,
  provider_correlation_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  sequence INTEGER,
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  event_payload JSONB NOT NULL,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (policy_version_ref = 'phase2-call-session-state-machine-188.v1'),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService'),
  UNIQUE (call_session_ref, idempotency_key)
);

CREATE TABLE IF NOT EXISTS phase2_call_session_aggregates (
  call_session_ref TEXT PRIMARY KEY,
  provider_correlation_ref TEXT NOT NULL,
  call_state TEXT NOT NULL,
  state_sequence TEXT[] NOT NULL,
  canonical_event_refs TEXT[] NOT NULL,
  event_idempotency_keys TEXT[] NOT NULL,
  menu_capture_refs TEXT[] NOT NULL,
  current_menu_capture_ref TEXT,
  current_menu_path TEXT,
  urgent_live_assessment_refs TEXT[] NOT NULL,
  current_urgent_live_assessment_ref TEXT NOT NULL,
  urgent_live_posture TEXT NOT NULL,
  safety_preemption_ref TEXT,
  recording_refs TEXT[] NOT NULL,
  verification_ref TEXT,
  transcript_readiness_ref TEXT,
  evidence_readiness_assessment_ref TEXT,
  continuation_eligibility_ref TEXT,
  manual_review_disposition_ref TEXT,
  request_seed_ref TEXT,
  latest_submission_ingress_ref TEXT,
  lineage_ref TEXT NOT NULL,
  masked_caller_ref TEXT,
  masked_caller_fragment TEXT,
  current_last_seen_event_ref TEXT NOT NULL,
  next_expected_milestone TEXT NOT NULL,
  active_blocker_reason TEXT NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (policy_version_ref = 'phase2-call-session-state-machine-188.v1'),
  timeout_policy_version_ref TEXT NOT NULL CHECK (timeout_policy_version_ref = 'phase2-call-session-timeout-policy-188.v1'),
  rebuild_rule JSONB NOT NULL,
  state_revision INTEGER NOT NULL,
  reason_codes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService')
);

CREATE TABLE IF NOT EXISTS phase2_menu_selection_captures (
  menu_capture_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL REFERENCES phase2_call_session_aggregates(call_session_ref),
  selected_top_level_path TEXT NOT NULL CHECK (selected_top_level_path IN ('symptoms', 'medications', 'admin', 'results', 'unknown')),
  raw_transport_source_family TEXT NOT NULL CHECK (raw_transport_source_family IN ('dtmf', 'speech', 'operator', 'simulator', 'unknown')),
  normalized_menu_code TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  provider_event_ref TEXT NOT NULL,
  confidence NUMERIC,
  parse_posture TEXT NOT NULL,
  branch_repeat_count INTEGER NOT NULL,
  correction_of_capture_ref TEXT,
  masked_caller_context_ref TEXT,
  session_correlation_refs TEXT[] NOT NULL,
  canonical_event_ref TEXT NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (policy_version_ref = 'phase2-call-session-state-machine-188.v1'),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_urgent_live_assessments (
  telephony_urgent_live_assessment_id TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL REFERENCES phase2_call_session_aggregates(call_session_ref),
  signal_refs TEXT[] NOT NULL,
  signal_source_classes TEXT[] NOT NULL,
  assessment_outcome TEXT NOT NULL CHECK (assessment_outcome IN ('none', 'suspected', 'urgent_live_required')),
  preemption_ref TEXT,
  assessment_state TEXT NOT NULL CHECK (assessment_state IN ('open', 'preempted', 'cleared', 'superseded')),
  assessed_at TIMESTAMPTZ NOT NULL,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (policy_version_ref = 'phase2-call-session-state-machine-188.v1'),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService')
);

CREATE TABLE IF NOT EXISTS phase2_telephony_safety_preemption_records (
  safety_preemption_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL REFERENCES phase2_call_session_aggregates(call_session_ref),
  priority TEXT NOT NULL CHECK (priority = 'urgent_live'),
  status TEXT NOT NULL CHECK (status = 'pending'),
  opened_by_urgent_live_assessment_ref TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  reason_codes TEXT[] NOT NULL,
  policy_version_ref TEXT NOT NULL CHECK (policy_version_ref = 'phase2-call-session-state-machine-188.v1'),
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService')
);

CREATE TABLE IF NOT EXISTS phase2_call_session_support_projections (
  projection_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL REFERENCES phase2_call_session_aggregates(call_session_ref),
  current_call_state TEXT NOT NULL,
  current_menu_path TEXT,
  current_urgent_live_posture TEXT NOT NULL,
  current_last_seen_event_ref TEXT NOT NULL,
  next_expected_milestone TEXT NOT NULL,
  active_blocker_or_hold_reason TEXT NOT NULL,
  linked_recording_refs TEXT[] NOT NULL,
  verification_ref TEXT,
  transcript_readiness_ref TEXT,
  evidence_readiness_assessment_ref TEXT,
  continuation_eligibility_ref TEXT,
  masked_caller_fragment TEXT,
  disclosure_boundary TEXT NOT NULL CHECK (disclosure_boundary = 'support_safe_masked_projection'),
  derived_from_event_refs TEXT[] NOT NULL,
  derived_at TIMESTAMPTZ NOT NULL,
  reason_codes TEXT[] NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService')
);

CREATE TABLE IF NOT EXISTS phase2_call_session_rebuild_checkpoints (
  rebuild_checkpoint_ref TEXT PRIMARY KEY,
  call_session_ref TEXT NOT NULL REFERENCES phase2_call_session_aggregates(call_session_ref),
  source_event_count INTEGER NOT NULL,
  rebuild_rule JSONB NOT NULL,
  deterministic_projection_ref TEXT NOT NULL,
  rebuilt_at TIMESTAMPTZ NOT NULL,
  created_by_authority TEXT NOT NULL DEFAULT 'TelephonyCallSessionService',
  CHECK (created_by_authority = 'TelephonyCallSessionService')
);

CREATE INDEX IF NOT EXISTS idx_phase2_call_session_events_order
  ON phase2_call_session_canonical_events(call_session_ref, sequence, occurred_at, event_type);

CREATE INDEX IF NOT EXISTS idx_phase2_menu_capture_current
  ON phase2_menu_selection_captures(call_session_ref, captured_at, canonical_event_ref);

CREATE INDEX IF NOT EXISTS idx_phase2_call_session_projection_state
  ON phase2_call_session_support_projections(call_session_ref, current_call_state, derived_at);
