-- par_069_phase0_track_backend_implement_contact_route_snapshot_and_reachability_assessment_models
-- Canonical append-only contact-route and reachability authority tables.

create table if not exists contact_route_snapshots (
  contact_route_snapshot_id text primary key,
  subject_ref text not null,
  route_ref text not null,
  route_version_ref text not null,
  route_kind text not null,
  normalized_address_ref text not null,
  preference_profile_ref text not null,
  verification_checkpoint_ref text null,
  verification_state text not null,
  demographic_freshness_state text not null,
  preference_freshness_state text not null,
  source_authority_class text not null,
  supersedes_snapshot_ref text null references contact_route_snapshots(contact_route_snapshot_id),
  snapshot_version integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  row_version integer not null default 1,
  unique (route_ref, snapshot_version)
);

create index if not exists contact_route_snapshots_route_idx
  on contact_route_snapshots (route_ref, snapshot_version desc);

create table if not exists reachability_dependencies (
  dependency_id text primary key,
  episode_id text not null,
  request_id text not null,
  domain text not null,
  domain_object_ref text not null,
  required_route_ref text not null,
  contact_route_version_ref text not null,
  current_contact_route_snapshot_ref text not null references contact_route_snapshots(contact_route_snapshot_id),
  current_reachability_assessment_ref text not null,
  reachability_epoch integer not null,
  purpose text not null,
  blocked_action_scope_refs jsonb not null,
  selected_anchor_ref text not null,
  request_return_bundle_ref text null,
  resume_continuation_ref text null,
  repair_journey_ref text null,
  route_authority_state text not null,
  route_health_state text not null,
  delivery_risk_state text not null,
  repair_state text not null,
  deadline_at timestamptz not null,
  failure_effect text not null,
  state text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists reachability_dependencies_request_idx
  on reachability_dependencies (request_id, state, purpose);

create table if not exists reachability_observations (
  reachability_observation_id text primary key,
  reachability_dependency_ref text not null references reachability_dependencies(dependency_id),
  contact_route_snapshot_ref text not null references contact_route_snapshots(contact_route_snapshot_id),
  observation_class text not null,
  observation_source_ref text not null,
  observed_at timestamptz not null,
  recorded_at timestamptz not null,
  outcome_polarity text not null,
  authority_weight text not null,
  evidence_ref text not null,
  supersedes_observation_ref text null references reachability_observations(reachability_observation_id),
  row_version integer not null default 1
);

create index if not exists reachability_observations_dependency_idx
  on reachability_observations (reachability_dependency_ref, observed_at, recorded_at);

create table if not exists reachability_assessment_records (
  reachability_assessment_id text primary key,
  reachability_dependency_ref text not null references reachability_dependencies(dependency_id),
  governing_object_ref text not null,
  contact_route_snapshot_ref text not null references contact_route_snapshots(contact_route_snapshot_id),
  considered_observation_refs jsonb not null,
  prior_assessment_ref text null references reachability_assessment_records(reachability_assessment_id),
  route_authority_state text not null,
  deliverability_state text not null,
  delivery_risk_state text not null,
  assessment_state text not null,
  false_negative_guard_state text not null,
  dominant_reason_code text not null,
  resulting_repair_state text not null,
  resulting_reachability_epoch integer not null,
  assessed_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists reachability_assessment_records_dependency_idx
  on reachability_assessment_records (reachability_dependency_ref, assessed_at desc);

create table if not exists contact_route_repair_journeys (
  repair_journey_id text primary key,
  reachability_dependency_ref text not null references reachability_dependencies(dependency_id),
  governing_object_ref text not null,
  blocked_action_scope_refs jsonb not null,
  selected_anchor_ref text not null,
  request_return_bundle_ref text null,
  resume_continuation_ref text null,
  patient_recovery_loop_ref text null,
  blocked_assessment_ref text not null references reachability_assessment_records(reachability_assessment_id),
  current_contact_route_snapshot_ref text not null references contact_route_snapshots(contact_route_snapshot_id),
  candidate_contact_route_snapshot_ref text null references contact_route_snapshots(contact_route_snapshot_id),
  verification_checkpoint_ref text null,
  resulting_reachability_assessment_ref text null references reachability_assessment_records(reachability_assessment_id),
  journey_state text not null,
  issued_at timestamptz not null,
  updated_at timestamptz not null,
  completed_at timestamptz null,
  row_version integer not null default 1
);

create index if not exists contact_route_repair_journeys_dependency_idx
  on contact_route_repair_journeys (reachability_dependency_ref, issued_at desc);

create table if not exists contact_route_verification_checkpoints (
  checkpoint_id text primary key,
  repair_journey_ref text not null references contact_route_repair_journeys(repair_journey_id),
  contact_route_ref text not null,
  contact_route_version_ref text not null,
  pre_verification_assessment_ref text not null references reachability_assessment_records(reachability_assessment_id),
  verification_method text not null,
  verification_state text not null,
  resulting_contact_route_snapshot_ref text null references contact_route_snapshots(contact_route_snapshot_id),
  resulting_reachability_assessment_ref text null references reachability_assessment_records(reachability_assessment_id),
  rebind_state text not null,
  dependent_grant_refs jsonb not null,
  dependent_route_intent_refs jsonb not null,
  evaluated_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists contact_route_verification_checkpoints_repair_idx
  on contact_route_verification_checkpoints (repair_journey_ref, evaluated_at desc);
