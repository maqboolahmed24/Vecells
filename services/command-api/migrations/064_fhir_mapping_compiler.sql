BEGIN;

CREATE TABLE IF NOT EXISTS fhir_representation_contracts (
  fhir_representation_contract_id TEXT PRIMARY KEY,
  owning_bounded_context_ref TEXT NOT NULL,
  governing_aggregate_type TEXT NOT NULL,
  representation_purpose TEXT NOT NULL,
  trigger_milestone_types_json TEXT NOT NULL DEFAULT '[]',
  required_evidence_refs_json TEXT NOT NULL DEFAULT '[]',
  allowed_resource_types_json TEXT NOT NULL DEFAULT '[]',
  required_profile_canonical_urls_json TEXT NOT NULL DEFAULT '[]',
  identifier_policy_ref TEXT NOT NULL,
  status_mapping_policy_ref TEXT NOT NULL,
  cardinality_policy_ref TEXT NOT NULL,
  redaction_policy_ref TEXT NOT NULL,
  companion_artifact_policy_ref TEXT NOT NULL,
  replay_policy_ref TEXT NOT NULL,
  supersession_policy_ref TEXT NOT NULL,
  callback_correlation_policy_ref TEXT NOT NULL,
  declared_bundle_policy_refs_json TEXT NOT NULL DEFAULT '[]',
  contract_version_ref TEXT NOT NULL,
  contract_state TEXT NOT NULL,
  published_at TEXT NOT NULL,
  resource_profiles_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS fhir_representation_sets (
  fhir_representation_set_id TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK (record_version >= 1),
  representation_contract_ref TEXT NOT NULL,
  governing_aggregate_type TEXT NOT NULL,
  governing_aggregate_ref TEXT NOT NULL,
  governing_aggregate_version_ref TEXT NOT NULL,
  governing_lineage_ref TEXT NOT NULL,
  evidence_snapshot_ref TEXT,
  representation_purpose TEXT NOT NULL,
  resource_record_refs_json TEXT NOT NULL DEFAULT '[]',
  bundle_artifact_ref TEXT,
  set_hash TEXT NOT NULL,
  causal_token TEXT NOT NULL,
  monotone_revision INTEGER NOT NULL CHECK (monotone_revision >= 1),
  representation_state TEXT NOT NULL,
  supersedes_representation_set_ref TEXT,
  superseded_by_representation_set_ref TEXT,
  invalidation_reason_ref TEXT,
  generated_at TEXT NOT NULL,
  PRIMARY KEY (fhir_representation_set_id, record_version),
  FOREIGN KEY (representation_contract_ref) REFERENCES fhir_representation_contracts (fhir_representation_contract_id)
);

CREATE TABLE IF NOT EXISTS fhir_resource_records (
  fhir_resource_record_id TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK (record_version >= 1),
  representation_set_ref TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  profile_canonical_url TEXT NOT NULL,
  logical_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  subject_ref TEXT,
  payload_artifact_ref TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  source_aggregate_refs_json TEXT NOT NULL DEFAULT '[]',
  identifier_set_hash TEXT NOT NULL,
  provenance_audit_join_ref TEXT,
  storage_disposition TEXT NOT NULL,
  materialization_state TEXT NOT NULL,
  superseded_by_representation_set_ref TEXT,
  invalidation_reason_ref TEXT,
  written_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (fhir_resource_record_id, record_version)
);

CREATE TABLE IF NOT EXISTS fhir_exchange_bundles (
  fhir_exchange_bundle_id TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK (record_version >= 1),
  representation_set_ref TEXT NOT NULL,
  adapter_contract_profile_ref TEXT NOT NULL,
  direction TEXT NOT NULL,
  bundle_type TEXT NOT NULL,
  transport_payload_ref TEXT NOT NULL,
  transport_payload_hash TEXT NOT NULL,
  target_partner_ref TEXT,
  correlation_key TEXT NOT NULL,
  receipt_checkpoint_ref TEXT,
  exchange_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  closed_at TEXT,
  bundle_policy_ref TEXT NOT NULL,
  superseded_by_bundle_ref TEXT,
  invalidation_reason_ref TEXT,
  bundle_payload_json TEXT NOT NULL,
  PRIMARY KEY (fhir_exchange_bundle_id, record_version)
);

CREATE INDEX IF NOT EXISTS idx_fhir_representation_sets_contract_aggregate
  ON fhir_representation_sets (
    representation_contract_ref,
    governing_aggregate_ref,
    governing_aggregate_version_ref,
    monotone_revision
  );

CREATE INDEX IF NOT EXISTS idx_fhir_representation_sets_lineage_state
  ON fhir_representation_sets (governing_lineage_ref, representation_state, generated_at);

CREATE INDEX IF NOT EXISTS idx_fhir_resource_records_set_type
  ON fhir_resource_records (representation_set_ref, resource_type, materialization_state);

CREATE INDEX IF NOT EXISTS idx_fhir_exchange_bundles_set_state
  ON fhir_exchange_bundles (representation_set_ref, bundle_type, exchange_state, created_at);

COMMIT;
