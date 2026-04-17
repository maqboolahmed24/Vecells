-- 123_phase3_patient_conversation_tuple_and_visibility.sql
-- Phase 3 authoritative patient conversation tuple and visibility projections.

CREATE TABLE IF NOT EXISTS phase3_patient_communication_envelopes (
  communication_envelope_ref TEXT PRIMARY KEY,
  cluster_ref TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  subthread_ref TEXT NOT NULL,
  communication_kind TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  sort_at TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_conversation_subthreads (
  subthread_projection_ref TEXT PRIMARY KEY,
  cluster_ref TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  subthread_ref TEXT NOT NULL,
  subthread_type TEXT NOT NULL,
  surface_state TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_conversation_threads (
  thread_projection_ref TEXT PRIMARY KEY,
  cluster_ref TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  thread_tuple_hash TEXT NOT NULL,
  receipt_grammar_version_ref TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_conversation_clusters (
  cluster_projection_ref TEXT PRIMARY KEY,
  cluster_ref TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  visibility_projection_ref TEXT NOT NULL,
  tuple_availability_state TEXT NOT NULL,
  continuity_validation_state TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_communication_visibility_projections (
  visibility_projection_ref TEXT PRIMARY KEY,
  cluster_or_thread_ref TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  preview_mode TEXT NOT NULL,
  release_state TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  continuity_evidence_ref TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_receipt_envelopes (
  receipt_envelope_ref TEXT PRIMARY KEY,
  cluster_ref TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  source_envelope_ref TEXT NOT NULL,
  receipt_kind TEXT NOT NULL,
  grammar_version_ref TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_conversation_legacy_backfill_records (
  backfill_row_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_lineage_ref TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_patient_conversation_envelopes_cluster
  ON phase3_patient_communication_envelopes (cluster_ref, sort_at);
CREATE INDEX IF NOT EXISTS idx_phase3_patient_conversation_subthreads_cluster
  ON phase3_patient_conversation_subthreads (cluster_ref, subthread_type);
CREATE INDEX IF NOT EXISTS idx_phase3_patient_conversation_threads_cluster
  ON phase3_patient_conversation_threads (cluster_ref);
CREATE INDEX IF NOT EXISTS idx_phase3_patient_conversation_clusters_cluster
  ON phase3_patient_conversation_clusters (cluster_ref);
CREATE INDEX IF NOT EXISTS idx_phase3_patient_visibility_cluster
  ON phase3_patient_communication_visibility_projections (cluster_or_thread_ref, audience_tier);
CREATE INDEX IF NOT EXISTS idx_phase3_patient_receipts_cluster
  ON phase3_patient_receipt_envelopes (cluster_ref, thread_id);
CREATE INDEX IF NOT EXISTS idx_phase3_patient_legacy_backfill_task
  ON phase3_patient_conversation_legacy_backfill_records (task_id, occurred_at);
