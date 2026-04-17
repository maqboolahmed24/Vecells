-- Phase 2 optional PDS adapter and enrichment flow.
-- PDS remains disabled by default and cannot mutate local binding or patient ownership.

CREATE TABLE IF NOT EXISTS phase2_pds_gating_decisions (
  gating_decision_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  tenant_ref TEXT NOT NULL,
  environment TEXT NOT NULL,
  route_sensitivity_family TEXT NOT NULL,
  requested_operation TEXT NOT NULL,
  decision_state TEXT NOT NULL,
  access_mode TEXT NOT NULL,
  feature_flag_enabled INTEGER NOT NULL,
  onboarding_ready INTEGER NOT NULL,
  legal_basis_satisfied INTEGER NOT NULL,
  endpoint_configured INTEGER NOT NULL,
  route_approved INTEGER NOT NULL,
  local_flow_continuation TEXT NOT NULL CHECK (local_flow_continuation IN ('local_matching_only', 'pds_enrichment_allowed')),
  reason_codes_json TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'PdsEnrichmentOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_pds_enrichment_requests (
  pds_enrichment_request_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  tenant_ref TEXT NOT NULL,
  environment TEXT NOT NULL,
  route_sensitivity_family TEXT NOT NULL,
  requested_operation TEXT NOT NULL,
  local_evidence_refs_json TEXT NOT NULL,
  legal_basis_evidence_ref TEXT,
  legal_basis_mode TEXT NOT NULL,
  query_digest TEXT NOT NULL,
  gating_decision_ref TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'PdsEnrichmentOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_pds_normalized_snapshots (
  pds_demographics_ref TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  tenant_ref TEXT NOT NULL,
  route_sensitivity_family TEXT NOT NULL,
  pds_record_ref TEXT NOT NULL,
  pds_record_version_ref TEXT,
  pds_source_last_updated_at TEXT,
  cached_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  stale_after TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  normalized_demographic_digest TEXT NOT NULL,
  demographic_evidence_json TEXT NOT NULL,
  provenance_json TEXT NOT NULL,
  data_class_separation_json TEXT NOT NULL,
  authoritative_local_binding_state_ref TEXT,
  communication_preference_ref TEXT,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'PdsEnrichmentOrchestrator')
);

CREATE INDEX IF NOT EXISTS idx_phase2_pds_snapshot_cache
  ON phase2_pds_normalized_snapshots (
    subject_ref,
    tenant_ref,
    route_sensitivity_family,
    normalized_demographic_digest
  );

CREATE TABLE IF NOT EXISTS phase2_pds_enrichment_outcomes (
  pds_enrichment_outcome_ref TEXT PRIMARY KEY,
  pds_enrichment_request_ref TEXT NOT NULL UNIQUE,
  gating_decision_ref TEXT NOT NULL,
  outcome_state TEXT NOT NULL,
  pds_lookup_outcome TEXT NOT NULL,
  pds_demographics_ref TEXT,
  freshness_state TEXT NOT NULL,
  pds_provenance_penalty REAL NOT NULL,
  binding_mutation_prohibited INTEGER NOT NULL CHECK (binding_mutation_prohibited = 1),
  local_flow_continuation TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  settled_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'PdsEnrichmentOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_pds_change_signals (
  change_signal_ref TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  pds_record_ref TEXT NOT NULL,
  tenant_ref TEXT NOT NULL,
  environment TEXT NOT NULL,
  change_event_type TEXT NOT NULL,
  notification_ref TEXT NOT NULL,
  signal_state TEXT NOT NULL,
  queued_refresh_ref TEXT,
  mutation_prohibited INTEGER NOT NULL CHECK (mutation_prohibited = 1),
  reason_codes_json TEXT NOT NULL,
  received_at TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'PdsEnrichmentOrchestrator')
);

CREATE TABLE IF NOT EXISTS phase2_pds_adapter_events (
  event_ref TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  subject_ref TEXT,
  occurred_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'PdsEnrichmentOrchestrator')
);
