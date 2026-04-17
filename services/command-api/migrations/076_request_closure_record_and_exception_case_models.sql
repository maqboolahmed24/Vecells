CREATE TABLE IF NOT EXISTS request_closure_records (
  closure_record_id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  required_lineage_epoch INTEGER NOT NULL,
  decision TEXT NOT NULL,
  closed_by_mode TEXT NOT NULL,
  materialized_blocker_set_hash TEXT NOT NULL,
  terminal_outcome_ref TEXT,
  consumed_causal_token_ref TEXT,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fallback_review_cases (
  fallback_case_id TEXT PRIMARY KEY,
  lineage_scope TEXT NOT NULL,
  request_id TEXT,
  episode_id TEXT,
  request_lineage_ref TEXT,
  trigger_class TEXT NOT NULL,
  patient_visible_state TEXT NOT NULL,
  case_state TEXT NOT NULL,
  closure_basis TEXT NOT NULL,
  manual_owner_queue TEXT NOT NULL,
  sla_anchor_at TEXT NOT NULL,
  receipt_issued_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);
