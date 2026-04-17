BEGIN;

CREATE TABLE IF NOT EXISTS phase3_callback_case_seeds (
  callback_seed_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  lease_ttl_seconds INTEGER NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  callback_window_ref TEXT NOT NULL,
  callback_reason_summary TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  seed_state TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (lease_ttl_seconds >= 1),
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_callback_case_seeds_task_created
  ON phase3_callback_case_seeds (task_id, created_at);

CREATE TABLE IF NOT EXISTS phase3_clinician_message_seeds (
  clinician_message_seed_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  lease_ttl_seconds INTEGER NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  message_subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  seed_state TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (lease_ttl_seconds >= 1),
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_clinician_message_seeds_task_created
  ON phase3_clinician_message_seeds (task_id, created_at);

CREATE TABLE IF NOT EXISTS phase3_self_care_consequence_starters (
  self_care_starter_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  boundary_tuple_ref TEXT,
  advice_summary TEXT NOT NULL,
  safety_net_advice TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  starter_state TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS phase3_admin_resolution_starters (
  admin_resolution_starter_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  lease_ttl_seconds INTEGER NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  admin_resolution_subtype_ref TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  starter_state TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (lease_ttl_seconds >= 1),
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_admin_resolution_starters_task_created
  ON phase3_admin_resolution_starters (task_id, created_at);

CREATE TABLE IF NOT EXISTS phase3_booking_intents (
  intent_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  source_triage_task_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  priority_band TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  modality TEXT NOT NULL,
  clinician_type TEXT NOT NULL,
  continuity_preference TEXT NOT NULL,
  access_needs TEXT NOT NULL,
  patient_preference_summary TEXT NOT NULL,
  created_from_decision_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  lease_ttl_seconds INTEGER NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  intent_state TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (lease_ttl_seconds >= 1),
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_booking_intents_task_created
  ON phase3_booking_intents (source_triage_task_ref, created_at);

CREATE TABLE IF NOT EXISTS phase3_pharmacy_intents (
  intent_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  source_triage_task_ref TEXT NOT NULL,
  lineage_case_link_ref TEXT NOT NULL,
  suspected_pathway TEXT NOT NULL,
  eligibility_facts_json TEXT NOT NULL,
  exclusion_flags_json TEXT NOT NULL,
  patient_choice_pending INTEGER NOT NULL,
  created_from_decision_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  lifecycle_lease_ref TEXT NOT NULL,
  lease_authority_ref TEXT NOT NULL,
  lease_ttl_seconds INTEGER NOT NULL,
  ownership_epoch INTEGER NOT NULL,
  fencing_token TEXT NOT NULL,
  current_lineage_fence_epoch INTEGER NOT NULL,
  intent_state TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (patient_choice_pending IN (0, 1)),
  CHECK (lease_ttl_seconds >= 1),
  CHECK (ownership_epoch >= 0),
  CHECK (current_lineage_fence_epoch >= 0),
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_pharmacy_intents_task_created
  ON phase3_pharmacy_intents (source_triage_task_ref, created_at);

CREATE TABLE IF NOT EXISTS phase3_direct_resolution_settlements (
  settlement_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  endpoint_code TEXT NOT NULL,
  settlement_class TEXT NOT NULL,
  triage_task_status TEXT NOT NULL,
  callback_seed_ref TEXT,
  clinician_message_seed_ref TEXT,
  self_care_starter_ref TEXT,
  admin_resolution_starter_ref TEXT,
  booking_intent_ref TEXT,
  pharmacy_intent_ref TEXT,
  lineage_case_link_ref TEXT,
  presentation_artifact_ref TEXT NOT NULL,
  patient_status_projection_ref TEXT NOT NULL,
  lifecycle_hook_effect_ref TEXT NOT NULL,
  closure_evaluation_effect_ref TEXT,
  settlement_state TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_direct_resolution_settlements_task_epoch
  ON phase3_direct_resolution_settlements (task_id, decision_epoch_ref);

CREATE TABLE IF NOT EXISTS phase3_triage_outcome_presentation_artifacts (
  presentation_artifact_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  endpoint_decision_ref TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  artifact_presentation_contract_ref TEXT NOT NULL,
  outbound_navigation_grant_policy_ref TEXT NOT NULL,
  audience_surface_runtime_binding_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  artifact_state TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary_lines_json TEXT NOT NULL,
  patient_facing_summary TEXT NOT NULL,
  provenance_refs_json TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_triage_outcome_presentation_artifacts_task_created
  ON phase3_triage_outcome_presentation_artifacts (task_id, created_at);

CREATE TABLE IF NOT EXISTS phase3_patient_status_projection_updates (
  projection_update_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  endpoint_code TEXT NOT NULL,
  status_code TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary_lines_json TEXT NOT NULL,
  patient_facing_summary TEXT NOT NULL,
  visibility_state TEXT NOT NULL,
  source_settlement_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_phase3_patient_status_projection_updates_task_created
  ON phase3_patient_status_projection_updates (task_id, created_at);

CREATE TABLE IF NOT EXISTS phase3_direct_resolution_outbox_entries (
  outbox_entry_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  settlement_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  effect_type TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  dispatch_state TEXT NOT NULL,
  reason_ref TEXT,
  created_at TEXT NOT NULL,
  dispatched_at TEXT,
  cancelled_at TEXT,
  version INTEGER NOT NULL,
  CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase3_direct_resolution_outbox_entries_effect_key
  ON phase3_direct_resolution_outbox_entries (effect_key);

CREATE INDEX IF NOT EXISTS idx_phase3_direct_resolution_outbox_entries_task_created
  ON phase3_direct_resolution_outbox_entries (task_id, created_at);

COMMIT;
