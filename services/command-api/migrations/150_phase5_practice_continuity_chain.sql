-- 150_phase5_practice_continuity_chain.sql
-- Phase 5 practice continuity outbox, delivery evidence, acknowledgement chain, and monotone delta persistence.
-- Depends on:
--   144_phase5_staff_identity_acting_context_visibility.sql
--   145_phase5_enhanced_access_policy_engine.sql
--   149_phase5_hub_commit_engine.sql

CREATE TABLE IF NOT EXISTS phase5_practice_continuity_payload_documents (
  practice_continuity_payload_document_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  visibility_envelope_version_ref text NOT NULL,
  minimum_necessary_contract_ref text NOT NULL,
  placeholder_contract_ref text NOT NULL,
  visible_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  withheld_field_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  serialized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_checksum text NOT NULL,
  created_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_practice_continuity_messages (
  practice_continuity_message_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  appointment_record_ref text NOT NULL,
  hub_appointment_id text NOT NULL,
  origin_practice_ods text NOT NULL,
  message_class text NOT NULL,
  payload_ref text NOT NULL,
  payload_checksum text NOT NULL,
  dedupe_key text NOT NULL,
  continuity_channel text NOT NULL,
  dispatch_workflow_id text NOT NULL,
  command_action_record_ref text NOT NULL,
  idempotency_record_ref text NOT NULL,
  adapter_dispatch_attempt_ref text,
  latest_receipt_checkpoint_ref text,
  visibility_envelope_version_ref text NOT NULL,
  delivery_model_version_ref text NOT NULL,
  practice_visibility_policy_ref text NOT NULL,
  service_obligation_policy_ref text NOT NULL,
  policy_evaluation_ref text NOT NULL,
  policy_tuple_hash text NOT NULL,
  transport_state text NOT NULL,
  transport_ack_state text NOT NULL,
  transport_accepted_at timestamptz,
  delivery_state text NOT NULL,
  delivery_evidence_state text NOT NULL,
  delivery_evidence_ref text,
  delivery_risk_state text NOT NULL,
  delivery_risk_posture text NOT NULL,
  delivery_attempt_count integer NOT NULL DEFAULT 0,
  first_delivered_at timestamptz,
  ack_generation integer NOT NULL,
  ack_state text NOT NULL,
  ack_due_at timestamptz NOT NULL,
  acknowledgement_evidence_state text NOT NULL,
  acknowledgement_evidence_ref text,
  truth_projection_ref text NOT NULL,
  truth_tuple_hash text NOT NULL,
  transition_envelope_ref text,
  release_recovery_disposition_ref text,
  state_confidence_band text NOT NULL,
  causal_token text NOT NULL,
  monotone_revision integer NOT NULL,
  message_state text NOT NULL,
  superseded_by_message_ref text,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_practice_continuity_dispatch_attempts (
  practice_continuity_dispatch_attempt_id text PRIMARY KEY,
  practice_continuity_message_ref text NOT NULL,
  hub_coordination_case_id text NOT NULL,
  continuity_channel text NOT NULL,
  dispatch_state text NOT NULL,
  attempt_number integer NOT NULL,
  dedupe_key text NOT NULL,
  adapter_name text NOT NULL,
  adapter_correlation_key text,
  external_dispatch_ref text,
  attempted_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_practice_continuity_receipt_checkpoints (
  practice_continuity_receipt_checkpoint_id text PRIMARY KEY,
  practice_continuity_message_ref text NOT NULL,
  hub_coordination_case_id text NOT NULL,
  dispatch_attempt_ref text,
  checkpoint_kind text NOT NULL,
  evidence_ref text,
  recorded_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_practice_continuity_delivery_evidence (
  practice_continuity_delivery_evidence_id text PRIMARY KEY,
  practice_continuity_message_ref text NOT NULL,
  hub_coordination_case_id text NOT NULL,
  receipt_checkpoint_ref text NOT NULL,
  evidence_kind text NOT NULL,
  delivery_state text NOT NULL,
  delivery_risk_posture text NOT NULL,
  evidence_ref text,
  observed_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_practice_acknowledgement_records (
  acknowledgement_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  practice_continuity_message_ref text NOT NULL,
  hub_appointment_id text NOT NULL,
  ack_generation integer NOT NULL,
  truth_tuple_hash text NOT NULL,
  causal_token text NOT NULL,
  ack_state text NOT NULL,
  ack_evidence_kind text NOT NULL,
  acknowledged_at timestamptz,
  acknowledged_by_ref text,
  visibility_envelope_version_ref text NOT NULL,
  policy_evaluation_ref text NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_practice_visibility_delta_records (
  practice_visibility_delta_record_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  hub_appointment_id text NOT NULL,
  prior_projection_ref text,
  next_projection_ref text NOT NULL,
  prior_ack_generation integer NOT NULL,
  next_ack_generation integer NOT NULL,
  prior_visibility_envelope_version_ref text,
  next_visibility_envelope_version_ref text NOT NULL,
  truth_tuple_hash text NOT NULL,
  delta_reason text NOT NULL,
  change_class text NOT NULL,
  continuity_message_ref text,
  monotone_validation text NOT NULL,
  state_confidence_band text NOT NULL,
  causal_token text NOT NULL,
  monotone_revision integer NOT NULL,
  recorded_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);
