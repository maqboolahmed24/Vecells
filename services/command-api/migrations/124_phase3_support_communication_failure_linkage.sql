-- 124_phase3_support_communication_failure_linkage.sql
-- Support-side callback/message failure linkage, settlements, and resolution snapshots.

CREATE TABLE IF NOT EXISTS phase3_support_tickets (
  support_ticket_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  communication_domain TEXT NOT NULL,
  communication_object_ref TEXT NOT NULL,
  failure_path_key TEXT NOT NULL UNIQUE,
  ticket_state TEXT NOT NULL,
  ticket_version_ref TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_support_lineage_bindings (
  support_lineage_binding_id TEXT PRIMARY KEY,
  support_ticket_id TEXT NOT NULL,
  binding_hash TEXT NOT NULL,
  primary_request_lineage_ref TEXT NOT NULL,
  primary_lineage_case_link_ref TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  binding_state TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_support_lineage_scope_members (
  support_lineage_scope_member_id TEXT PRIMARY KEY,
  support_lineage_binding_ref TEXT NOT NULL,
  member_role TEXT NOT NULL,
  actionability TEXT NOT NULL,
  member_state TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  governing_object_version_ref TEXT NOT NULL,
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_support_lineage_artifact_bindings (
  support_lineage_artifact_binding_id TEXT PRIMARY KEY,
  support_lineage_binding_ref TEXT NOT NULL,
  support_lineage_scope_member_ref TEXT NOT NULL,
  support_ticket_id TEXT NOT NULL,
  source_lineage_ref TEXT NOT NULL,
  source_lineage_case_link_ref TEXT NOT NULL,
  source_evidence_snapshot_ref TEXT NOT NULL,
  source_artifact_ref TEXT NOT NULL,
  derived_artifact_ref TEXT NOT NULL,
  note_or_summary_ref TEXT NOT NULL,
  parity_digest_ref TEXT NOT NULL,
  binding_state TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_support_action_records (
  support_action_record_id TEXT PRIMARY KEY,
  support_ticket_id TEXT NOT NULL,
  support_lineage_binding_ref TEXT NOT NULL,
  support_lineage_scope_member_ref TEXT NOT NULL,
  action_scope TEXT NOT NULL,
  governing_object_ref TEXT NOT NULL,
  governing_thread_ref TEXT NOT NULL,
  governing_subthread_ref TEXT,
  governing_thread_tuple_hash TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_by_ref TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_support_action_settlements (
  support_action_settlement_id TEXT PRIMARY KEY,
  support_ticket_id TEXT NOT NULL,
  support_lineage_binding_ref TEXT NOT NULL,
  support_lineage_scope_member_ref TEXT NOT NULL,
  support_action_record_id TEXT,
  command_settlement_record_ref TEXT NOT NULL,
  governing_thread_ref TEXT NOT NULL,
  governing_subthread_ref TEXT,
  governing_thread_tuple_hash TEXT NOT NULL,
  result TEXT NOT NULL,
  authoritative_outcome_state TEXT NOT NULL,
  authoritative_delivery_state TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_support_resolution_snapshots (
  support_resolution_snapshot_id TEXT PRIMARY KEY,
  support_ticket_id TEXT NOT NULL,
  support_lineage_binding_ref TEXT NOT NULL,
  ticket_version_ref TEXT NOT NULL,
  resolution_code TEXT NOT NULL,
  summary_ref TEXT NOT NULL,
  handoff_summary_ref TEXT,
  confirmation_state TEXT NOT NULL,
  support_presentation_artifact_ref TEXT NOT NULL,
  created_at TEXT NOT NULL
);
