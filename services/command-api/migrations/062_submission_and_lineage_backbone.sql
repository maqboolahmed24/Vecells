BEGIN;

CREATE TABLE IF NOT EXISTS submission_envelopes (
  envelope_id TEXT PRIMARY KEY,
  source_channel TEXT NOT NULL,
  initial_surface_channel_profile TEXT NOT NULL,
  intake_convergence_contract_ref TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  latest_ingress_record_ref TEXT,
  latest_evidence_snapshot_ref TEXT,
  current_normalized_submission_ref TEXT,
  retention_class TEXT NOT NULL,
  verified_subject_ref TEXT,
  candidate_patient_refs_json TEXT NOT NULL DEFAULT '[]',
  candidate_episode_ref TEXT,
  candidate_request_ref TEXT,
  promotion_decision_ref TEXT,
  promotion_record_ref TEXT UNIQUE,
  expires_at TEXT,
  promoted_request_ref TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS submission_promotion_records (
  promotion_record_id TEXT PRIMARY KEY,
  submission_envelope_ref TEXT NOT NULL UNIQUE,
  source_lineage_ref TEXT NOT NULL,
  request_ref TEXT NOT NULL UNIQUE,
  request_lineage_ref TEXT NOT NULL UNIQUE,
  promotion_command_action_record_ref TEXT NOT NULL,
  promotion_command_settlement_record_ref TEXT NOT NULL,
  promoted_evidence_snapshot_ref TEXT NOT NULL,
  promoted_normalized_submission_ref TEXT NOT NULL,
  promoted_draft_version INTEGER NOT NULL CHECK (promoted_draft_version >= 1),
  intake_experience_bundle_ref TEXT NOT NULL,
  receipt_consistency_key TEXT NOT NULL UNIQUE,
  status_consistency_key TEXT NOT NULL,
  patient_journey_lineage_ref TEXT NOT NULL,
  superseded_access_grant_refs_json TEXT NOT NULL DEFAULT '[]',
  superseded_draft_lease_refs_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  FOREIGN KEY (submission_envelope_ref) REFERENCES submission_envelopes (envelope_id)
);

CREATE TABLE IF NOT EXISTS episodes (
  episode_id TEXT PRIMARY KEY,
  patient_ref TEXT,
  current_identity_binding_ref TEXT,
  active_identity_repair_case_ref TEXT,
  current_confirmation_gate_refs_json TEXT NOT NULL DEFAULT '[]',
  current_closure_blocker_refs_json TEXT NOT NULL DEFAULT '[]',
  episode_fingerprint TEXT NOT NULL,
  origin_request_ref TEXT,
  member_request_refs_json TEXT NOT NULL DEFAULT '[]',
  request_lineage_refs_json TEXT NOT NULL DEFAULT '[]',
  state TEXT NOT NULL,
  resolution_reason TEXT,
  opened_at TEXT NOT NULL,
  resolved_at TEXT,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS requests (
  request_id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  origin_envelope_ref TEXT NOT NULL,
  promotion_record_ref TEXT NOT NULL UNIQUE,
  request_version INTEGER NOT NULL CHECK (request_version >= 1),
  tenant_id TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  origin_ingress_record_ref TEXT NOT NULL,
  normalized_submission_ref TEXT NOT NULL,
  request_type TEXT NOT NULL,
  narrative_ref TEXT,
  structured_data_ref TEXT,
  attachment_refs_json TEXT NOT NULL DEFAULT '[]',
  contact_preferences_ref TEXT,
  workflow_state TEXT NOT NULL,
  safety_state TEXT NOT NULL,
  identity_state TEXT NOT NULL,
  priority_band TEXT,
  pathway_ref TEXT,
  assigned_queue_ref TEXT,
  patient_ref TEXT,
  current_identity_binding_ref TEXT,
  current_evidence_snapshot_ref TEXT,
  current_evidence_assimilation_ref TEXT,
  current_material_delta_assessment_ref TEXT,
  current_evidence_classification_ref TEXT,
  current_safety_preemption_ref TEXT,
  current_safety_decision_ref TEXT,
  current_urgent_diversion_settlement_ref TEXT,
  safety_decision_epoch INTEGER NOT NULL DEFAULT 0 CHECK (safety_decision_epoch >= 0),
  request_lineage_ref TEXT NOT NULL UNIQUE,
  current_triage_task_ref TEXT,
  latest_lineage_case_link_ref TEXT,
  active_lineage_case_link_refs_json TEXT NOT NULL DEFAULT '[]',
  current_confirmation_gate_refs_json TEXT NOT NULL DEFAULT '[]',
  current_closure_blocker_refs_json TEXT NOT NULL DEFAULT '[]',
  sla_clock_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  FOREIGN KEY (episode_id) REFERENCES episodes (episode_id),
  FOREIGN KEY (origin_envelope_ref) REFERENCES submission_envelopes (envelope_id),
  FOREIGN KEY (promotion_record_ref) REFERENCES submission_promotion_records (promotion_record_id)
);

CREATE TABLE IF NOT EXISTS request_lineages (
  request_lineage_id TEXT PRIMARY KEY,
  episode_ref TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  origin_envelope_ref TEXT,
  submission_promotion_record_ref TEXT,
  branch_class TEXT NOT NULL,
  branch_decision_ref TEXT,
  continuity_witness_class TEXT NOT NULL,
  continuity_witness_ref TEXT NOT NULL,
  latest_triage_task_ref TEXT,
  latest_decision_epoch_ref TEXT,
  latest_closure_record_ref TEXT,
  active_lineage_case_link_refs_json TEXT NOT NULL DEFAULT '[]',
  latest_lineage_case_link_ref TEXT,
  lineage_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  FOREIGN KEY (episode_ref) REFERENCES episodes (episode_id),
  FOREIGN KEY (request_ref) REFERENCES requests (request_id),
  FOREIGN KEY (origin_envelope_ref) REFERENCES submission_envelopes (envelope_id),
  FOREIGN KEY (submission_promotion_record_ref) REFERENCES submission_promotion_records (promotion_record_id)
);

CREATE TABLE IF NOT EXISTS lineage_case_links (
  lineage_case_link_id TEXT PRIMARY KEY,
  request_lineage_ref TEXT NOT NULL,
  episode_ref TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  case_family TEXT NOT NULL,
  domain_case_ref TEXT NOT NULL,
  parent_lineage_case_link_ref TEXT,
  origin_decision_epoch_ref TEXT,
  origin_decision_supersession_ref TEXT,
  origin_triage_task_ref TEXT,
  origin_duplicate_resolution_decision_ref TEXT,
  link_reason TEXT NOT NULL,
  ownership_state TEXT NOT NULL,
  current_closure_blocker_refs_json TEXT NOT NULL DEFAULT '[]',
  current_confirmation_gate_refs_json TEXT NOT NULL DEFAULT '[]',
  latest_milestone_ref TEXT,
  return_to_triage_ref TEXT,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  superseded_at TEXT,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  FOREIGN KEY (request_lineage_ref) REFERENCES request_lineages (request_lineage_id),
  FOREIGN KEY (episode_ref) REFERENCES episodes (episode_id),
  FOREIGN KEY (request_ref) REFERENCES requests (request_id),
  FOREIGN KEY (parent_lineage_case_link_ref) REFERENCES lineage_case_links (lineage_case_link_id),
  UNIQUE (request_lineage_ref, case_family, domain_case_ref)
);

CREATE INDEX IF NOT EXISTS idx_submission_envelopes_state
  ON submission_envelopes (state, updated_at);

CREATE INDEX IF NOT EXISTS idx_requests_episode_state
  ON requests (episode_id, workflow_state, updated_at);

CREATE INDEX IF NOT EXISTS idx_request_lineages_episode_branch
  ON request_lineages (episode_ref, branch_class, updated_at);

CREATE INDEX IF NOT EXISTS idx_lineage_case_links_active
  ON lineage_case_links (request_lineage_ref, ownership_state, updated_at);

COMMIT;
