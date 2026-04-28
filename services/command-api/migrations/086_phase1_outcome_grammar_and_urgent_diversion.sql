-- par_151_phase1_track_backend_build_urgent_diversion_settlement_and_receipt_grammar
-- Durable outcome grammar and urgent-diversion issuance substrate.

create table if not exists urgent_diversion_settlements (
  urgent_diversion_settlement_id text primary key,
  request_id text not null,
  preemption_ref text not null,
  safety_decision_ref text not null,
  action_mode text not null,
  presentation_artifact_ref text null,
  authoritative_action_ref text null,
  settlement_state text not null,
  supersedes_settlement_ref text null,
  issued_at timestamptz null,
  settled_at timestamptz null
);

create table if not exists patient_receipt_consistency_envelopes (
  consistency_envelope_id text primary key,
  request_ref text null,
  request_lineage_ref text null,
  submission_promotion_record_ref text null,
  normalized_submission_ref text null,
  receipt_consistency_key text null,
  status_consistency_key text null,
  receipt_bucket text not null,
  eta_promise_ref text not null,
  eta_lower_bound_at timestamptz null,
  eta_median_at timestamptz null,
  eta_upper_bound_at timestamptz null,
  bucket_confidence numeric not null,
  promise_state text not null,
  calibration_version_ref text not null,
  status_projection_version_ref text not null,
  causal_token text not null,
  monotone_revision integer not null,
  visibility_tier text not null,
  issued_at timestamptz not null,
  version integer not null
);

create table if not exists intake_outcome_presentation_artifacts (
  intake_outcome_presentation_artifact_id text primary key,
  request_public_id text null,
  request_ref text null,
  request_lineage_ref text null,
  intake_submit_settlement_ref text not null,
  outcome_result text not null,
  applies_to_state text not null,
  copy_deck_id text not null,
  copy_variant_ref text not null,
  focus_target text not null,
  primary_action_id text not null,
  secondary_action_id text null,
  artifact_presentation_contract_ref text not null,
  outbound_navigation_grant_policy_ref text not null,
  audience_surface_runtime_binding_ref text not null,
  surface_route_contract_ref text not null,
  surface_publication_ref text not null,
  runtime_publication_bundle_ref text not null,
  release_publication_parity_ref text not null,
  route_pattern text not null,
  visibility_tier text not null,
  summary_safety_tier text not null,
  placeholder_contract_ref text not null,
  artifact_state text not null,
  outbound_navigation_grant_ref text null,
  created_at timestamptz not null,
  version integer not null
);

create table if not exists outbound_navigation_grants (
  outbound_navigation_grant_id text primary key,
  intake_submit_settlement_ref text not null,
  request_ref text null,
  request_public_id text null,
  route_family_ref text not null,
  continuity_key text not null,
  selected_anchor_ref text not null,
  return_target_ref text not null,
  destination_type text not null,
  destination_label text not null,
  scrubbed_destination text not null,
  reason_code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null,
  version integer not null
);

create table if not exists phase1_outcome_tuples (
  phase1_outcome_tuple_id text primary key,
  outcome_grammar_contract_ref text not null,
  intake_submit_settlement_ref text not null unique,
  request_ref text null,
  request_lineage_ref text null,
  request_public_id text null,
  outcome_result text not null,
  applies_to_state text not null,
  presentation_artifact_ref text not null,
  receipt_envelope_ref text null,
  urgent_diversion_settlement_ref text null,
  outbound_navigation_grant_ref text null,
  replay_tuple_hash text not null,
  continuity_posture text not null,
  recorded_at timestamptz not null,
  version integer not null
);
