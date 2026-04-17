BEGIN;

CREATE SCHEMA IF NOT EXISTS vecells_fhir;

CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_representation_contracts (
  fhir_representation_contract_id text PRIMARY KEY,
  governing_aggregate_type text NOT NULL,
  representation_purpose text NOT NULL,
  contract_version_ref text NOT NULL,
  published_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_representation_sets (
  fhir_representation_set_ref text PRIMARY KEY,
  fhir_representation_contract_id text NOT NULL,
  governing_aggregate_ref text NOT NULL,
  aggregate_version integer NOT NULL,
  materialized_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_resource_records (
  fhir_resource_record_ref text PRIMARY KEY,
  fhir_representation_set_ref text NOT NULL,
  resource_type text NOT NULL,
  logical_id text NOT NULL,
  version_id text NOT NULL,
  materialized_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_exchange_bundles (
  fhir_exchange_bundle_ref text PRIMARY KEY,
  fhir_representation_set_ref text NOT NULL,
  bundle_purpose text NOT NULL,
  export_state text NOT NULL,
  staged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fhir_resource_records_logical
  ON vecells_fhir.fhir_resource_records (resource_type, logical_id, version_id);

COMMIT;
