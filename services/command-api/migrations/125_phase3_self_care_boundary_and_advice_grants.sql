CREATE TABLE IF NOT EXISTS phase3_self_care_boundary_decisions (
  self_care_boundary_decision_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  evidence_snapshot_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  decision_state TEXT NOT NULL,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  admin_mutation_authority_state TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  admin_resolution_subtype_ref TEXT,
  route_intent_binding_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  dependency_set_ref TEXT,
  advice_render_settlement_ref TEXT,
  admin_resolution_case_ref TEXT,
  self_care_experience_projection_ref TEXT,
  admin_resolution_experience_projection_ref TEXT,
  reopen_trigger_refs_json TEXT NOT NULL,
  reopen_state TEXT NOT NULL,
  boundary_state TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  compiled_policy_bundle_ref TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_self_care_boundary_decisions_task_decided
  ON phase3_self_care_boundary_decisions (task_id, decided_at);

CREATE INDEX IF NOT EXISTS idx_phase3_self_care_boundary_decisions_epoch_hash
  ON phase3_self_care_boundary_decisions (decision_epoch_ref, boundary_tuple_hash);

CREATE TABLE IF NOT EXISTS phase3_self_care_boundary_supersession_records (
  boundary_supersession_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  prior_boundary_decision_ref TEXT NOT NULL,
  replacement_boundary_decision_ref TEXT NOT NULL,
  prior_decision_epoch_ref TEXT NOT NULL,
  replacement_decision_epoch_ref TEXT NOT NULL,
  prior_boundary_tuple_hash TEXT NOT NULL,
  replacement_boundary_tuple_hash TEXT NOT NULL,
  cause_class TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_self_care_boundary_supersession_task_recorded
  ON phase3_self_care_boundary_supersession_records (task_id, recorded_at);

CREATE TABLE IF NOT EXISTS phase3_advice_eligibility_grants (
  advice_eligibility_grant_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  grant_tuple_hash TEXT NOT NULL,
  evidence_snapshot_ref TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  safety_state TEXT NOT NULL,
  route_family TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  channel_ref TEXT NOT NULL,
  locale_ref TEXT NOT NULL,
  compiled_policy_bundle_ref TEXT NOT NULL,
  advice_bundle_version_ref TEXT NOT NULL,
  lineage_fence_epoch INTEGER NOT NULL,
  route_intent_ref TEXT NOT NULL,
  subject_binding_version_ref TEXT,
  session_epoch_ref TEXT,
  assurance_slice_trust_refs_json TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  grant_state TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_eligibility_grants_task_issued
  ON phase3_advice_eligibility_grants (task_id, issued_at);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_eligibility_grants_epoch_state
  ON phase3_advice_eligibility_grants (decision_epoch_ref, grant_state);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_eligibility_grants_expiry
  ON phase3_advice_eligibility_grants (grant_state, expires_at);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_eligibility_grants_subject_session
  ON phase3_advice_eligibility_grants (subject_binding_version_ref, session_epoch_ref);

CREATE TABLE IF NOT EXISTS phase3_advice_eligibility_grant_transition_records (
  advice_eligibility_grant_transition_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  advice_eligibility_grant_ref TEXT NOT NULL,
  prior_grant_state TEXT NOT NULL,
  next_grant_state TEXT NOT NULL,
  cause_class TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  replacement_grant_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_eligibility_grant_transition_task_recorded
  ON phase3_advice_eligibility_grant_transition_records (task_id, recorded_at);
