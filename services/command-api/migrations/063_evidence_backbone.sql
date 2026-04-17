BEGIN;

CREATE TABLE IF NOT EXISTS evidence_source_artifacts (
  artifact_id TEXT PRIMARY KEY,
  locator TEXT NOT NULL,
  checksum TEXT NOT NULL,
  checksum_algorithm TEXT NOT NULL DEFAULT 'sha256',
  media_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  created_at TEXT NOT NULL,
  source_artifact_ref TEXT
);

CREATE TABLE IF NOT EXISTS evidence_derived_artifacts (
  artifact_id TEXT PRIMARY KEY,
  locator TEXT NOT NULL,
  checksum TEXT NOT NULL,
  checksum_algorithm TEXT NOT NULL DEFAULT 'sha256',
  media_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  created_at TEXT NOT NULL,
  source_artifact_ref TEXT
);

CREATE TABLE IF NOT EXISTS evidence_redacted_artifacts (
  artifact_id TEXT PRIMARY KEY,
  locator TEXT NOT NULL,
  checksum TEXT NOT NULL,
  checksum_algorithm TEXT NOT NULL DEFAULT 'sha256',
  media_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  created_at TEXT NOT NULL,
  source_artifact_ref TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_capture_bundles (
  capture_bundle_id TEXT PRIMARY KEY,
  evidence_lineage_ref TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  replay_class TEXT NOT NULL,
  transport_correlation_ref TEXT,
  capture_policy_version TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  semantic_hash TEXT NOT NULL,
  source_artifact_refs_json TEXT NOT NULL DEFAULT '[]',
  attachment_artifact_refs_json TEXT NOT NULL DEFAULT '[]',
  audio_artifact_refs_json TEXT NOT NULL DEFAULT '[]',
  metadata_artifact_refs_json TEXT NOT NULL DEFAULT '[]',
  bundle_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  record_version INTEGER NOT NULL DEFAULT 1 CHECK (record_version = 1)
);

CREATE TABLE IF NOT EXISTS evidence_derivation_packages (
  derivation_package_id TEXT PRIMARY KEY,
  evidence_lineage_ref TEXT NOT NULL,
  capture_bundle_ref TEXT NOT NULL,
  source_bundle_hash TEXT NOT NULL,
  parent_derivation_package_ref TEXT,
  supersedes_derivation_package_ref TEXT,
  derivation_class TEXT NOT NULL,
  derivation_version TEXT NOT NULL,
  policy_version_ref TEXT NOT NULL,
  derived_artifact_ref TEXT NOT NULL,
  derived_artifact_hash TEXT NOT NULL,
  structured_digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  record_version INTEGER NOT NULL DEFAULT 1 CHECK (record_version = 1),
  FOREIGN KEY (capture_bundle_ref) REFERENCES evidence_capture_bundles (capture_bundle_id),
  FOREIGN KEY (parent_derivation_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (supersedes_derivation_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (derived_artifact_ref) REFERENCES evidence_derived_artifacts (artifact_id)
);

CREATE TABLE IF NOT EXISTS evidence_redaction_transforms (
  redaction_transform_id TEXT PRIMARY KEY,
  evidence_lineage_ref TEXT NOT NULL,
  source_capture_bundle_ref TEXT,
  source_derivation_package_ref TEXT,
  source_artifact_ref TEXT NOT NULL,
  source_artifact_hash TEXT NOT NULL,
  redaction_policy_version TEXT NOT NULL,
  redacted_artifact_ref TEXT NOT NULL,
  redacted_artifact_hash TEXT NOT NULL,
  transform_digest TEXT NOT NULL UNIQUE,
  supersedes_redaction_transform_ref TEXT,
  created_at TEXT NOT NULL,
  record_version INTEGER NOT NULL DEFAULT 1 CHECK (record_version = 1),
  FOREIGN KEY (source_capture_bundle_ref) REFERENCES evidence_capture_bundles (capture_bundle_id),
  FOREIGN KEY (source_derivation_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (redacted_artifact_ref) REFERENCES evidence_redacted_artifacts (artifact_id),
  FOREIGN KEY (supersedes_redaction_transform_ref) REFERENCES evidence_redaction_transforms (redaction_transform_id),
  CHECK (
    (source_capture_bundle_ref IS NOT NULL AND source_derivation_package_ref IS NULL) OR
    (source_capture_bundle_ref IS NULL AND source_derivation_package_ref IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS evidence_summary_parity_records (
  parity_record_id TEXT PRIMARY KEY,
  evidence_lineage_ref TEXT NOT NULL,
  capture_bundle_ref TEXT NOT NULL,
  normalized_derivation_package_ref TEXT NOT NULL,
  authoritative_derived_facts_package_ref TEXT,
  summary_derivation_package_ref TEXT NOT NULL,
  summary_kind TEXT NOT NULL,
  authority_digest TEXT NOT NULL,
  summary_digest TEXT NOT NULL,
  parity_digest TEXT NOT NULL,
  parity_policy_version TEXT NOT NULL,
  parity_state TEXT NOT NULL,
  blocking_reason_refs_json TEXT NOT NULL DEFAULT '[]',
  supersedes_parity_record_ref TEXT,
  created_at TEXT NOT NULL,
  record_version INTEGER NOT NULL DEFAULT 1 CHECK (record_version = 1),
  FOREIGN KEY (capture_bundle_ref) REFERENCES evidence_capture_bundles (capture_bundle_id),
  FOREIGN KEY (normalized_derivation_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (authoritative_derived_facts_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (summary_derivation_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (supersedes_parity_record_ref) REFERENCES evidence_summary_parity_records (parity_record_id)
);

CREATE TABLE IF NOT EXISTS evidence_snapshots (
  evidence_snapshot_id TEXT PRIMARY KEY,
  evidence_lineage_ref TEXT NOT NULL,
  capture_bundle_ref TEXT NOT NULL,
  authoritative_normalized_derivation_package_ref TEXT NOT NULL,
  authoritative_derived_facts_package_ref TEXT,
  current_summary_parity_record_ref TEXT,
  supersedes_evidence_snapshot_ref TEXT,
  material_delta_disposition TEXT,
  snapshot_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  record_version INTEGER NOT NULL DEFAULT 1 CHECK (record_version = 1),
  FOREIGN KEY (capture_bundle_ref) REFERENCES evidence_capture_bundles (capture_bundle_id),
  FOREIGN KEY (authoritative_normalized_derivation_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (authoritative_derived_facts_package_ref) REFERENCES evidence_derivation_packages (derivation_package_id),
  FOREIGN KEY (current_summary_parity_record_ref) REFERENCES evidence_summary_parity_records (parity_record_id),
  FOREIGN KEY (supersedes_evidence_snapshot_ref) REFERENCES evidence_snapshots (evidence_snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_capture_bundles_lineage
  ON evidence_capture_bundles (evidence_lineage_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_evidence_derivation_packages_capture_class
  ON evidence_derivation_packages (capture_bundle_ref, derivation_class, created_at);

CREATE INDEX IF NOT EXISTS idx_evidence_redaction_transforms_source
  ON evidence_redaction_transforms (source_artifact_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_evidence_summary_parity_records_capture_state
  ON evidence_summary_parity_records (capture_bundle_ref, parity_state, created_at);

CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_lineage_created
  ON evidence_snapshots (evidence_lineage_ref, created_at);

COMMIT;
