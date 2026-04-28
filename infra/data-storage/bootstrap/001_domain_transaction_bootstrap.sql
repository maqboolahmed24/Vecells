BEGIN;

CREATE SCHEMA IF NOT EXISTS vecells_control;
CREATE SCHEMA IF NOT EXISTS vecells_request;
CREATE SCHEMA IF NOT EXISTS vecells_identity;
CREATE SCHEMA IF NOT EXISTS vecells_evidence;
CREATE SCHEMA IF NOT EXISTS vecells_reservation;
CREATE SCHEMA IF NOT EXISTS vecells_release;

CREATE TABLE IF NOT EXISTS vecells_control.schema_migration_history (
  migration_id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by text NOT NULL,
  checksum text NOT NULL
);

CREATE TABLE IF NOT EXISTS vecells_control.tenant_slice_registry (
  tenant_tuple_ref text PRIMARY KEY,
  data_partition_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_request.requests (
  request_id text PRIMARY KEY,
  tenant_tuple_ref text NOT NULL,
  workflow_state text NOT NULL,
  current_lineage_ref text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_request.request_lineages (
  request_lineage_ref text PRIMARY KEY,
  request_id text NOT NULL,
  parent_request_lineage_ref text,
  continuity_mode text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_identity.identity_bindings (
  identity_binding_ref text PRIMARY KEY,
  request_lineage_ref text NOT NULL,
  subject_binding_mode text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_evidence.evidence_snapshots (
  evidence_snapshot_ref text PRIMARY KEY,
  request_lineage_ref text NOT NULL,
  parity_state text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_reservation.reservation_fences (
  reservation_fence_ref text PRIMARY KEY,
  governing_object_ref text NOT NULL,
  fence_state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_release.release_approval_freezes (
  release_approval_freeze_ref text PRIMARY KEY,
  environment_ring text NOT NULL,
  freeze_state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
