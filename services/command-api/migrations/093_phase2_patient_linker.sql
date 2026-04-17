BEGIN;

CREATE TABLE IF NOT EXISTS patient_link_calibration_profiles (
  link_calibration_profile_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '172.phase2.patient-link.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-patient-link-v1'),
  calibration_version_ref TEXT NOT NULL,
  threshold_version_ref TEXT NOT NULL,
  route_sensitivity_family TEXT NOT NULL,
  calibrator_type TEXT NOT NULL,
  alpha_link REAL NOT NULL,
  alpha_subject REAL NOT NULL,
  delta_drift REAL NOT NULL,
  thresholds_json TEXT NOT NULL,
  minimum_calibration_posture TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  coefficients_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_link_candidate_search_specs (
  candidate_search_spec_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '172.phase2.patient-link.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-patient-link-v1'),
  subject_ref TEXT NOT NULL,
  route_sensitivity_family TEXT NOT NULL,
  permitted_search_keys_json TEXT NOT NULL,
  ignored_search_keys_json TEXT NOT NULL,
  provenance_sources_json TEXT NOT NULL,
  search_boundaries_json TEXT NOT NULL,
  pds_enrichment_seam_ref TEXT NOT NULL,
  gp_linkage_posture TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_link_candidate_sets (
  candidate_set_ref TEXT PRIMARY KEY,
  candidate_search_spec_ref TEXT NOT NULL REFERENCES patient_link_candidate_search_specs(candidate_search_spec_id),
  candidate_refs_json TEXT NOT NULL,
  frozen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_match_evidence_basis (
  match_evidence_basis_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '172.phase2.patient-link.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-patient-link-v1'),
  candidate_set_ref TEXT NOT NULL REFERENCES patient_link_candidate_sets(candidate_set_ref),
  subject_ref TEXT NOT NULL,
  candidate_patient_ref TEXT NOT NULL,
  raw_evidence_refs_json TEXT NOT NULL,
  normalized_feature_values_json TEXT NOT NULL,
  provenance_penalties_json TEXT NOT NULL,
  missingness_flags_json TEXT NOT NULL,
  calibrator_version_ref TEXT NOT NULL,
  threshold_version_ref TEXT NOT NULL,
  policy_version_ref TEXT NOT NULL,
  confidence_model_state TEXT NOT NULL,
  drift_score REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_link_decisions (
  patient_link_decision_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL CHECK (schema_version = '172.phase2.patient-link.v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'phase2-patient-link-v1'),
  candidate_search_spec_ref TEXT NOT NULL REFERENCES patient_link_candidate_search_specs(candidate_search_spec_id),
  match_evidence_basis_refs_json TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  winner_candidate_ref TEXT NOT NULL,
  runner_up_candidate_ref TEXT,
  p_link REAL NOT NULL,
  lcb_link_alpha REAL NOT NULL,
  ucb_link_alpha REAL NOT NULL,
  p_subject REAL NOT NULL,
  lcb_subject_alpha REAL NOT NULL,
  runner_up_probability_upper_bound REAL NOT NULL,
  gap_logit REAL NOT NULL,
  confidence_model_state TEXT NOT NULL,
  link_state TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  auto_link_checks_json TEXT NOT NULL,
  identity_binding_authority_intent TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  decided_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_link_binding_intents (
  authority_intent_id TEXT PRIMARY KEY,
  subject_ref TEXT NOT NULL,
  patient_link_decision_ref TEXT NOT NULL REFERENCES patient_link_decisions(patient_link_decision_id),
  candidate_patient_ref TEXT,
  intent_kind TEXT NOT NULL,
  link_state TEXT NOT NULL,
  decision_class TEXT NOT NULL,
  confidence_values_json TEXT NOT NULL,
  provenance_refs_json TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_link_pds_enrichment_audit (
  pds_enrichment_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_ref TEXT NOT NULL,
  seam_ref TEXT NOT NULL,
  status TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patient_link_candidate_specs_subject
  ON patient_link_candidate_search_specs(subject_ref, route_sensitivity_family, created_at);

CREATE INDEX IF NOT EXISTS idx_patient_match_evidence_basis_candidate_set
  ON patient_match_evidence_basis(candidate_set_ref, candidate_patient_ref);

CREATE INDEX IF NOT EXISTS idx_patient_link_decisions_subject
  ON patient_link_decisions(subject_ref, decided_at);

CREATE INDEX IF NOT EXISTS idx_patient_link_binding_intents_decision
  ON patient_link_binding_intents(patient_link_decision_ref, intent_kind);

COMMIT;
