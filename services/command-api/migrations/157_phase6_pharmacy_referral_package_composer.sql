BEGIN;

CREATE TABLE IF NOT EXISTS phase6_pharmacy_referral_package (
  package_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  patient_ref TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_capability_snapshot_id TEXT NOT NULL,
  pathway_ref TEXT,
  fhir_representation_set_id TEXT,
  service_request_artifact_id TEXT,
  communication_artifact_id TEXT,
  consent_artifact_id TEXT,
  provenance_artifact_id TEXT,
  audit_event_artifact_id TEXT,
  patient_summary_artifact_id TEXT,
  clinical_summary_artifact_id TEXT,
  consent_record_id TEXT NOT NULL,
  consent_checkpoint_id TEXT NOT NULL,
  directory_snapshot_id TEXT NOT NULL,
  compiled_policy_bundle_ref TEXT NOT NULL,
  selection_binding_hash TEXT NOT NULL,
  package_fingerprint TEXT NOT NULL,
  package_hash TEXT NOT NULL,
  package_state TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  representation_contract_ref TEXT NOT NULL,
  visibility_policy_ref TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  source_practice_ref TEXT NOT NULL,
  source_practice_summary TEXT NOT NULL,
  request_lineage_summary TEXT NOT NULL,
  frozen_at TIMESTAMPTZ,
  superseded_by_package_id TEXT,
  invalidation_reason_code TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_referral_package_case
  ON phase6_pharmacy_referral_package (pharmacy_case_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_referral_package_hash
  ON phase6_pharmacy_referral_package (package_hash);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_referral_package_fingerprint
  ON phase6_pharmacy_referral_package (package_fingerprint);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_referral_package_consent_checkpoint
  ON phase6_pharmacy_referral_package (consent_checkpoint_id, package_state);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_package_artifact (
  package_artifact_id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  artifact_class TEXT NOT NULL,
  source_artifact_ref TEXT,
  source_hash TEXT,
  derivation_ref TEXT,
  visibility_policy_ref TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  governance_decision_id TEXT NOT NULL,
  content_state TEXT NOT NULL,
  canonical_artifact_ref TEXT NOT NULL,
  canonical_hash TEXT NOT NULL,
  fhir_resource_record_id TEXT,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_package_artifact_package
  ON phase6_pharmacy_package_artifact (package_id, artifact_class);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_package_governance_decision (
  package_content_governance_decision_id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  artifact_class TEXT NOT NULL,
  candidate_ref TEXT NOT NULL,
  source_artifact_ref TEXT,
  source_hash TEXT,
  derivation_ref TEXT,
  visibility_policy_ref TEXT NOT NULL,
  minimum_necessary_contract_ref TEXT NOT NULL,
  decision_state TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  label TEXT NOT NULL,
  resulting_artifact_id TEXT,
  absence_reason_code TEXT,
  redaction_transform_ref TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_package_governance_decision_package
  ON phase6_pharmacy_package_governance_decision (package_id, artifact_class, candidate_ref);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_package_freeze_record (
  package_freeze_record_id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  representation_contract_ref TEXT NOT NULL,
  fhir_representation_set_id TEXT NOT NULL,
  package_fingerprint TEXT NOT NULL,
  package_hash TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  compiled_policy_bundle_ref TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_package_freeze_record_package
  ON phase6_pharmacy_package_freeze_record (package_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_package_supersession_record (
  package_supersession_record_id TEXT PRIMARY KEY,
  superseded_package_id TEXT NOT NULL,
  successor_package_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_package_supersession_record_superseded
  ON phase6_pharmacy_package_supersession_record (superseded_package_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_package_invalidation_record (
  package_invalidation_record_id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  invalidation_reason_code TEXT NOT NULL,
  invalidated_by_ref TEXT,
  invalidated_at TIMESTAMPTZ NOT NULL,
  representation_invalidated BOOLEAN NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_package_invalidation_record_package
  ON phase6_pharmacy_package_invalidation_record (package_id, invalidated_at DESC);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_correlation_record (
  correlation_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  dispatch_attempt_id TEXT,
  provider_id TEXT NOT NULL,
  patient_ref TEXT NOT NULL,
  service_type TEXT NOT NULL,
  directory_snapshot_id TEXT NOT NULL,
  provider_capability_snapshot_id TEXT NOT NULL,
  dispatch_plan_ref TEXT,
  transport_mode TEXT,
  transport_assurance_profile_ref TEXT,
  dispatch_adapter_binding_ref TEXT,
  dispatch_plan_hash TEXT,
  package_hash TEXT NOT NULL,
  outbound_reference_set_hash TEXT,
  transport_acceptance_state TEXT NOT NULL,
  provider_acceptance_state TEXT NOT NULL,
  authoritative_dispatch_proof_state TEXT NOT NULL,
  current_proof_envelope_ref TEXT,
  current_dispatch_settlement_ref TEXT,
  acknowledgement_state TEXT NOT NULL,
  confidence_floor DOUBLE PRECISION NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  route_intent_tuple_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_correlation_record_case
  ON phase6_pharmacy_correlation_record (pharmacy_case_id, updated_at DESC);

COMMIT;
