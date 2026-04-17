BEGIN;

CREATE TABLE IF NOT EXISTS phase3_callback_cases (
  callback_case_id TEXT PRIMARY KEY,
  source_triage_task_ref TEXT NOT NULL,
  callback_seed_ref TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  state TEXT NOT NULL,
  callback_urgency_ref TEXT NOT NULL,
  preferred_window_ref TEXT NOT NULL,
  service_window_ref TEXT NOT NULL,
  contact_route_ref TEXT NOT NULL,
  fallback_route_ref TEXT NOT NULL,
  active_intent_lease_ref TEXT,
  attempt_counter INTEGER NOT NULL,
  latest_settled_attempt_ref TEXT,
  current_expectation_envelope_ref TEXT,
  latest_outcome_evidence_bundle_ref TEXT,
  active_resolution_gate_ref TEXT,
  retry_policy_ref TEXT NOT NULL,
  reachability_dependency_ref TEXT,
  patient_visible_expectation_state TEXT NOT NULL,
  latest_attempt_outcome TEXT,
  stale_promise_suppressed_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (attempt_counter >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_callback_cases_task_updated
  ON phase3_callback_cases (source_triage_task_ref, updated_at);

CREATE INDEX IF NOT EXISTS idx_phase3_callback_cases_seed
  ON phase3_callback_cases (callback_seed_ref);

CREATE TABLE IF NOT EXISTS phase3_callback_intent_leases (
  callback_intent_lease_id TEXT PRIMARY KEY,
  callback_case_ref TEXT NOT NULL,
  request_lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  owned_by_actor_ref TEXT NOT NULL,
  owned_by_session_ref TEXT NOT NULL,
  service_window_ref TEXT NOT NULL,
  contact_route_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  lease_mode TEXT NOT NULL,
  case_version_ref TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  last_heartbeat_at TEXT NOT NULL,
  stale_owner_recovery_ref TEXT,
  expires_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (lineage_fence_epoch >= 1),
  CHECK (ownership_epoch >= 1),
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_callback_intent_leases_case_revision
  ON phase3_callback_intent_leases (callback_case_ref, monotone_revision);

CREATE TABLE IF NOT EXISTS phase3_callback_attempt_records (
  callback_attempt_record_id TEXT PRIMARY KEY,
  callback_case_ref TEXT NOT NULL,
  callback_intent_lease_ref TEXT NOT NULL,
  request_lifecycle_lease_ref TEXT NOT NULL,
  attempt_ordinal INTEGER NOT NULL,
  attempt_fence_epoch INTEGER NOT NULL,
  ownership_epoch_ref INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  dial_target_ref TEXT NOT NULL,
  channel_provider_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  idempotency_record_ref TEXT NOT NULL,
  adapter_dispatch_attempt_ref TEXT NOT NULL,
  adapter_effect_key TEXT NOT NULL,
  latest_receipt_checkpoint_ref TEXT,
  latest_receipt_decision_class TEXT,
  initiated_at TEXT NOT NULL,
  settlement_state TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (attempt_ordinal >= 1),
  CHECK (attempt_fence_epoch >= 1),
  CHECK (ownership_epoch_ref >= 1),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_callback_attempt_records_natural_key
  ON phase3_callback_attempt_records (callback_case_ref, attempt_fence_epoch, dial_target_ref);

CREATE TABLE IF NOT EXISTS phase3_callback_expectation_envelopes (
  expectation_envelope_id TEXT PRIMARY KEY,
  callback_case_ref TEXT NOT NULL,
  identity_repair_branch_disposition_ref TEXT,
  patient_visible_state TEXT NOT NULL,
  expected_window_ref TEXT NOT NULL,
  window_lower_at TEXT NOT NULL,
  window_upper_at TEXT NOT NULL,
  window_risk_state TEXT NOT NULL,
  state_confidence_band TEXT NOT NULL,
  prediction_model_ref TEXT NOT NULL,
  fallback_guidance_ref TEXT NOT NULL,
  grant_set_ref TEXT,
  route_intent_binding_ref TEXT NOT NULL,
  required_release_approval_freeze_ref TEXT,
  channel_release_freeze_state TEXT NOT NULL,
  required_assurance_slice_trust_refs_json TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  freeze_disposition_ref TEXT,
  expectation_reason_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_callback_expectation_case_revision
  ON phase3_callback_expectation_envelopes (callback_case_ref, monotone_revision);

CREATE TABLE IF NOT EXISTS phase3_callback_outcome_evidence_bundles (
  callback_outcome_evidence_bundle_id TEXT PRIMARY KEY,
  callback_case_ref TEXT NOT NULL,
  attempt_ref TEXT NOT NULL,
  attempt_fence_epoch INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  recorded_by_actor_ref TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  route_evidence_ref TEXT NOT NULL,
  provider_disposition_ref TEXT,
  patient_acknowledgement_ref TEXT,
  safety_classification TEXT NOT NULL,
  safety_preemption_state TEXT NOT NULL,
  voicemail_policy_ref TEXT,
  voicemail_evidence_refs_json TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (attempt_fence_epoch >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_callback_outcome_case_recorded
  ON phase3_callback_outcome_evidence_bundles (callback_case_ref, recorded_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_callback_outcome_case_causal
  ON phase3_callback_outcome_evidence_bundles (callback_case_ref, causal_token);

CREATE TABLE IF NOT EXISTS phase3_callback_resolution_gates (
  callback_resolution_gate_id TEXT PRIMARY KEY,
  callback_case_ref TEXT NOT NULL,
  latest_attempt_ref TEXT NOT NULL,
  latest_outcome_evidence_ref TEXT NOT NULL,
  latest_expectation_envelope_ref TEXT NOT NULL,
  decision TEXT NOT NULL,
  decision_reason_ref TEXT NOT NULL,
  next_action_at TEXT,
  stale_promise_revocation_ref TEXT,
  requires_lifecycle_review INTEGER NOT NULL,
  causal_token TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (requires_lifecycle_review IN (0, 1)),
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_callback_resolution_case_revision
  ON phase3_callback_resolution_gates (callback_case_ref, monotone_revision);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_callback_resolution_case_causal
  ON phase3_callback_resolution_gates (callback_case_ref, causal_token);

COMMIT;
