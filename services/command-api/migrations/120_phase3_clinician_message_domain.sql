BEGIN;

CREATE TABLE IF NOT EXISTS phase3_clinician_message_threads (
  thread_id TEXT PRIMARY KEY,
  source_triage_task_ref TEXT NOT NULL,
  clinician_message_seed_ref TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  state TEXT NOT NULL,
  thread_purpose_ref TEXT NOT NULL,
  closure_rule_ref TEXT NOT NULL,
  author_actor_ref TEXT NOT NULL,
  approver_actor_ref TEXT,
  approval_required_state TEXT NOT NULL,
  latest_draft_ref TEXT NOT NULL,
  message_subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  dispatch_fence_counter INTEGER NOT NULL,
  active_dispatch_envelope_ref TEXT,
  latest_delivery_evidence_bundle_ref TEXT,
  current_expectation_envelope_ref TEXT,
  active_resolution_gate_ref TEXT,
  latest_reply_ref TEXT,
  reachability_dependency_ref TEXT,
  request_lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  patient_visible_expectation_state TEXT NOT NULL,
  re_safety_required INTEGER NOT NULL,
  callback_escalation_ref TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (dispatch_fence_counter >= 0),
  CHECK (ownership_epoch >= 1),
  CHECK (current_lineage_fence_epoch >= 1),
  CHECK (re_safety_required IN (0, 1)),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_clinician_message_threads_task_updated
  ON phase3_clinician_message_threads (source_triage_task_ref, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_clinician_message_threads_seed
  ON phase3_clinician_message_threads (clinician_message_seed_ref);

CREATE TABLE IF NOT EXISTS phase3_message_dispatch_envelopes (
  message_dispatch_envelope_id TEXT PRIMARY KEY,
  thread_ref TEXT NOT NULL,
  thread_version_ref TEXT NOT NULL,
  draft_ref TEXT NOT NULL,
  approved_by_ref TEXT,
  delivery_plan_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  request_lifecycle_lease_ref TEXT NOT NULL,
  dispatch_fence_epoch INTEGER NOT NULL,
  ownership_epoch_ref INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  idempotency_record_ref TEXT NOT NULL,
  adapter_dispatch_attempt_ref TEXT NOT NULL,
  adapter_effect_key TEXT NOT NULL,
  latest_receipt_checkpoint_ref TEXT,
  support_mutation_attempt_ref TEXT,
  support_action_record_ref TEXT,
  repair_intent TEXT NOT NULL,
  contact_route_ref TEXT,
  channel_template_ref TEXT NOT NULL,
  transport_state TEXT NOT NULL,
  delivery_evidence_state TEXT NOT NULL,
  current_delivery_confidence_ref TEXT NOT NULL,
  delivery_model_version_ref TEXT NOT NULL,
  calibration_version TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (dispatch_fence_epoch >= 1),
  CHECK (ownership_epoch_ref >= 1),
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_message_dispatch_envelopes_natural_key
  ON phase3_message_dispatch_envelopes (thread_ref, thread_version_ref, dispatch_fence_epoch);

CREATE INDEX IF NOT EXISTS idx_phase3_message_dispatch_envelopes_thread_created
  ON phase3_message_dispatch_envelopes (thread_ref, created_at);

CREATE TABLE IF NOT EXISTS phase3_message_delivery_evidence_bundles (
  message_delivery_evidence_bundle_id TEXT PRIMARY KEY,
  thread_ref TEXT NOT NULL,
  dispatch_envelope_ref TEXT NOT NULL,
  dispatch_fence_epoch INTEGER NOT NULL,
  thread_version_ref TEXT NOT NULL,
  receipt_checkpoint_ref TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  evidence_strength TEXT NOT NULL,
  provider_disposition_ref TEXT NOT NULL,
  delivery_artifact_refs_json TEXT NOT NULL,
  reachability_dependency_ref TEXT,
  support_action_settlement_ref TEXT,
  causal_token TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (dispatch_fence_epoch >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_message_delivery_evidence_thread_recorded
  ON phase3_message_delivery_evidence_bundles (thread_ref, recorded_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_message_delivery_evidence_thread_causal
  ON phase3_message_delivery_evidence_bundles (thread_ref, causal_token);

CREATE TABLE IF NOT EXISTS phase3_thread_expectation_envelopes (
  thread_expectation_envelope_id TEXT PRIMARY KEY,
  thread_ref TEXT NOT NULL,
  reachability_dependency_ref TEXT,
  contact_repair_journey_ref TEXT,
  identity_repair_branch_disposition_ref TEXT,
  patient_visible_state TEXT NOT NULL,
  reply_window_ref TEXT NOT NULL,
  delivery_risk_state TEXT NOT NULL,
  state_confidence_band TEXT NOT NULL,
  fallback_guidance_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  required_release_approval_freeze_ref TEXT,
  channel_release_freeze_state TEXT NOT NULL,
  required_assurance_slice_trust_refs_json TEXT NOT NULL,
  latest_support_action_settlement_ref TEXT,
  transition_envelope_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  freeze_disposition_ref TEXT,
  causal_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_thread_expectation_envelopes_thread_revision
  ON phase3_thread_expectation_envelopes (thread_ref, monotone_revision);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_thread_expectation_envelopes_thread_causal
  ON phase3_thread_expectation_envelopes (thread_ref, causal_token);

CREATE TABLE IF NOT EXISTS phase3_thread_resolution_gates (
  thread_resolution_gate_id TEXT PRIMARY KEY,
  thread_ref TEXT NOT NULL,
  latest_dispatch_ref TEXT NOT NULL,
  latest_reply_ref TEXT,
  latest_expectation_envelope_ref TEXT NOT NULL,
  latest_support_action_settlement_ref TEXT,
  decision TEXT NOT NULL,
  decision_reason_ref TEXT NOT NULL,
  same_shell_recovery_ref TEXT,
  requires_lifecycle_review INTEGER NOT NULL,
  causal_token TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL,
  version INTEGER NOT NULL,
  CHECK (requires_lifecycle_review IN (0, 1)),
  CHECK (monotone_revision >= 1),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_thread_resolution_gates_thread_revision
  ON phase3_thread_resolution_gates (thread_ref, monotone_revision);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_thread_resolution_gates_thread_causal
  ON phase3_thread_resolution_gates (thread_ref, causal_token);

CREATE TABLE IF NOT EXISTS phase3_message_patient_replies (
  message_patient_reply_id TEXT PRIMARY KEY,
  thread_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  dispatch_envelope_ref TEXT NOT NULL,
  thread_version_ref TEXT NOT NULL,
  reply_route_family_ref TEXT NOT NULL,
  reply_channel_ref TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  reply_artifact_refs_json TEXT NOT NULL,
  provider_correlation_ref TEXT,
  secure_entry_grant_ref TEXT,
  classification_hint TEXT NOT NULL,
  re_safety_required INTEGER NOT NULL,
  needs_assimilation INTEGER NOT NULL,
  causal_token TEXT NOT NULL,
  replied_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (re_safety_required IN (0, 1)),
  CHECK (needs_assimilation IN (0, 1)),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_message_patient_replies_thread_replied
  ON phase3_message_patient_replies (thread_ref, replied_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_message_patient_replies_thread_causal
  ON phase3_message_patient_replies (thread_ref, causal_token);

CREATE TABLE IF NOT EXISTS phase3_message_thread_outbox_entries (
  outbox_entry_id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  effect_type TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  dispatch_envelope_ref TEXT,
  delivery_evidence_bundle_ref TEXT,
  expectation_envelope_ref TEXT,
  resolution_gate_ref TEXT,
  patient_reply_ref TEXT,
  payload_digest_ref TEXT NOT NULL,
  dispatch_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  dispatched_at TEXT,
  cancelled_at TEXT,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_message_thread_outbox_effect_key
  ON phase3_message_thread_outbox_entries (effect_key);

CREATE INDEX IF NOT EXISTS idx_phase3_message_thread_outbox_thread_created
  ON phase3_message_thread_outbox_entries (thread_id, created_at);

COMMIT;
