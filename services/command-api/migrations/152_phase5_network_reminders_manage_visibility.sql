-- 152_phase5_network_reminders_manage_visibility.sql
-- Phase 5 network reminders, leased manage capabilities, same-shell manage settlements,
-- practice visibility projections, and unified reminder timeline publications.
-- Depends on:
--   144_phase5_staff_identity_acting_context_visibility.sql
--   145_phase5_enhanced_access_policy_engine.sql
--   149_phase5_hub_commit_engine.sql
--   150_phase5_practice_continuity_chain.sql
--   151_phase5_hub_fallback_workflows.sql

CREATE TABLE IF NOT EXISTS phase5_network_reminder_plans (
  network_reminder_plan_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  hub_appointment_id text NOT NULL,
  thread_id text NOT NULL,
  conversation_cluster_ref text NOT NULL,
  conversation_subthread_ref text NOT NULL,
  communication_envelope_ref text NOT NULL,
  template_set_ref text NOT NULL,
  template_version_ref text NOT NULL,
  route_profile_ref text NOT NULL,
  channel text NOT NULL,
  payload_ref text NOT NULL,
  contact_route_ref text NOT NULL,
  contact_route_version_ref text NOT NULL,
  current_contact_route_snapshot_ref text NOT NULL,
  reachability_dependency_ref text NOT NULL,
  current_reachability_assessment_ref text NOT NULL,
  reachability_epoch integer NOT NULL,
  contact_repair_journey_ref text NOT NULL,
  delivery_model_version_ref text NOT NULL,
  artifact_presentation_contract_ref text NOT NULL,
  outbound_navigation_grant_policy_ref text NOT NULL,
  transition_envelope_ref text NOT NULL,
  release_recovery_disposition_ref text NOT NULL,
  appointment_version_ref text NOT NULL,
  truth_tuple_hash text NOT NULL,
  schedule_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule_state text NOT NULL,
  transport_ack_state text NOT NULL,
  delivery_evidence_state text NOT NULL,
  delivery_risk_state text NOT NULL,
  authoritative_outcome_state text NOT NULL,
  state_confidence_band text NOT NULL,
  suppression_reason_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_delivery_attempt_at timestamptz,
  next_attempt_at timestamptz,
  next_reminder_due_at timestamptz,
  causal_token text NOT NULL,
  monotone_revision integer NOT NULL,
  recorded_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_network_reminder_schedules (
  network_reminder_schedule_id text PRIMARY KEY,
  reminder_plan_ref text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  schedule_kind text NOT NULL,
  schedule_state text NOT NULL,
  template_version_ref text NOT NULL,
  route_profile_ref text NOT NULL,
  contact_route_version_ref text NOT NULL,
  reachability_assessment_ref text NOT NULL,
  truth_tuple_hash text NOT NULL,
  created_at timestamptz NOT NULL,
  sent_at timestamptz,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_network_reminder_delivery_evidence (
  network_reminder_delivery_evidence_id text PRIMARY KEY,
  reminder_plan_ref text NOT NULL,
  reminder_schedule_ref text NOT NULL,
  observed_at timestamptz NOT NULL,
  evidence_state text NOT NULL,
  transport_ack_state text NOT NULL,
  delivery_risk_state text NOT NULL,
  adapter_name text NOT NULL,
  adapter_correlation_key text,
  external_dispatch_ref text,
  suppression_reason_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_reminder_timeline_publications (
  reminder_timeline_publication_id text PRIMARY KEY,
  reminder_plan_ref text NOT NULL,
  publication_kind text NOT NULL,
  thread_id text NOT NULL,
  conversation_subthread_ref text NOT NULL,
  communication_envelope_ref text NOT NULL,
  publication_ref text NOT NULL,
  published_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_network_manage_capabilities (
  network_manage_capabilities_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  hub_appointment_id text NOT NULL,
  appointment_version_ref text NOT NULL,
  capability_state text NOT NULL,
  read_only_mode text NOT NULL,
  reason_code text NOT NULL,
  policy_tuple_hash text NOT NULL,
  truth_tuple_hash text NOT NULL,
  visibility_envelope_version_ref text NOT NULL,
  supplier_truth_version_ref text NOT NULL,
  session_fence_token text NOT NULL,
  subject_fence_token text NOT NULL,
  manage_window_ends_at timestamptz NOT NULL,
  allowed_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked_reason_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  fallback_route_ref text,
  compiled_policy_bundle_ref text NOT NULL,
  enhanced_access_policy_ref text NOT NULL,
  practice_visibility_policy_ref text NOT NULL,
  policy_evaluation_ref text NOT NULL,
  route_intent_ref text NOT NULL,
  subject_ref text NOT NULL,
  session_epoch_ref text NOT NULL,
  subject_binding_version_ref text NOT NULL,
  manifest_version_ref text,
  release_approval_freeze_ref text NOT NULL,
  channel_release_freeze_state text NOT NULL,
  mutation_gate_ref text NOT NULL,
  consistency_token text NOT NULL,
  state_confidence_band text NOT NULL,
  causal_token text NOT NULL,
  monotone_revision integer NOT NULL,
  recorded_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_hub_manage_settlements (
  hub_manage_settlement_id text PRIMARY KEY,
  idempotency_key text NOT NULL,
  hub_coordination_case_id text NOT NULL,
  hub_appointment_id text NOT NULL,
  network_manage_capabilities_ref text NOT NULL,
  action_scope text NOT NULL,
  route_intent_ref text NOT NULL,
  mutation_gate_ref text NOT NULL,
  lineage_fence_epoch integer NOT NULL,
  result text NOT NULL,
  experience_continuity_evidence_ref text,
  causal_token text NOT NULL,
  transition_envelope_ref text NOT NULL,
  surface_route_contract_ref text NOT NULL,
  surface_publication_ref text NOT NULL,
  runtime_publication_bundle_ref text NOT NULL,
  release_recovery_disposition_ref text NOT NULL,
  state_confidence_band text NOT NULL,
  recovery_route_ref text,
  presentation_artifact_ref text,
  blocker_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  recorded_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE TABLE IF NOT EXISTS phase5_practice_visibility_projections (
  practice_visibility_projection_id text PRIMARY KEY,
  hub_coordination_case_id text NOT NULL,
  hub_appointment_id text NOT NULL,
  origin_practice_ods text NOT NULL,
  bundle_version integer NOT NULL,
  entity_version_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  minimum_necessary_view_ref text NOT NULL,
  visibility_envelope_version_ref text NOT NULL,
  cross_organisation_visibility_envelope_ref text NOT NULL,
  acting_context_ref text NOT NULL,
  acting_scope_tuple_ref text NOT NULL,
  practice_visibility_policy_ref text NOT NULL,
  service_obligation_policy_ref text NOT NULL,
  policy_evaluation_ref text NOT NULL,
  policy_tuple_hash text NOT NULL,
  minimum_necessary_contract_ref text NOT NULL,
  slot_summary_ref text NOT NULL,
  confirmation_state text NOT NULL,
  patient_facing_state_ref text NOT NULL,
  notification_state text NOT NULL,
  ack_generation integer NOT NULL,
  practice_acknowledgement_state text NOT NULL,
  manage_settlement_state text NOT NULL,
  supplier_mirror_state text NOT NULL,
  latest_continuity_message_ref text,
  truth_projection_ref text NOT NULL,
  truth_tuple_hash text NOT NULL,
  experience_continuity_evidence_ref text,
  transition_envelope_ref text NOT NULL,
  release_recovery_disposition_ref text NOT NULL,
  patient_safe_status text NOT NULL,
  projection_state text NOT NULL,
  visible_field_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_field_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  state_confidence_band text NOT NULL,
  action_required_state text NOT NULL,
  stale_at timestamptz NOT NULL,
  causal_token text NOT NULL,
  monotone_revision integer NOT NULL,
  recorded_at timestamptz NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase5_network_reminder_plans_case
  ON phase5_network_reminder_plans (hub_coordination_case_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_network_reminder_plans_appointment
  ON phase5_network_reminder_plans (hub_appointment_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_network_reminder_schedules_plan
  ON phase5_network_reminder_schedules (reminder_plan_ref, scheduled_for DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_network_reminder_delivery_evidence_plan
  ON phase5_network_reminder_delivery_evidence (reminder_plan_ref, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_reminder_timeline_publications_plan
  ON phase5_reminder_timeline_publications (reminder_plan_ref, published_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase5_hub_manage_settlements_idempotency
  ON phase5_hub_manage_settlements (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_phase5_network_manage_capabilities_appointment
  ON phase5_network_manage_capabilities (hub_appointment_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_hub_manage_settlements_appointment
  ON phase5_hub_manage_settlements (hub_appointment_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_practice_visibility_projections_case
  ON phase5_practice_visibility_projections (hub_coordination_case_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_phase5_practice_visibility_delta_records_case_recorded_at
  ON phase5_practice_visibility_delta_records (hub_coordination_case_id, recorded_at DESC);
