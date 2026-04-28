CREATE TABLE IF NOT EXISTS evidence_assimilation_records (
  evidence_assimilation_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  attachment_disposition TEXT NOT NULL,
  assimilation_state TEXT NOT NULL,
  resulting_snapshot_ref TEXT,
  material_delta_assessment_ref TEXT NOT NULL,
  classification_decision_ref TEXT NOT NULL,
  resulting_preemption_ref TEXT,
  resulting_safety_epoch INTEGER NOT NULL,
  decided_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS material_delta_assessments (
  material_delta_assessment_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  evidence_assimilation_ref TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  materiality_class TEXT NOT NULL,
  trigger_decision TEXT NOT NULL,
  decision_basis TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_classification_decisions (
  classification_decision_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  evidence_assimilation_ref TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  dominant_evidence_class TEXT NOT NULL,
  classification_basis TEXT NOT NULL,
  confidence_band TEXT NOT NULL,
  misclassification_risk_state TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS safety_preemption_records (
  preemption_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  evidence_assimilation_ref TEXT NOT NULL,
  material_delta_assessment_ref TEXT NOT NULL,
  classification_decision_ref TEXT NOT NULL,
  opening_safety_epoch INTEGER NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS safety_decision_records (
  safety_decision_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  preemption_ref TEXT NOT NULL,
  classification_decision_ref TEXT NOT NULL,
  rule_pack_version_ref TEXT NOT NULL,
  calibrator_version_ref TEXT NOT NULL,
  decision_outcome TEXT NOT NULL,
  requested_safety_state TEXT NOT NULL,
  decision_state TEXT NOT NULL,
  resulting_safety_epoch INTEGER NOT NULL,
  decided_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS urgent_diversion_settlements (
  urgent_diversion_settlement_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  preemption_ref TEXT NOT NULL,
  safety_decision_ref TEXT NOT NULL,
  action_mode TEXT NOT NULL,
  settlement_state TEXT NOT NULL,
  issued_at TEXT,
  settled_at TEXT,
  payload_json TEXT NOT NULL
);
