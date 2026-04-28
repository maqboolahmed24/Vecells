-- par_080_phase0_track_backend_build_identity_repair_orchestrator_and_reachability_governor
-- Canonical append-only wrong-patient repair authority tables.

create table if not exists identity_repair_cases (
  repair_case_id text primary key,
  episode_id text not null,
  affected_request_refs jsonb not null,
  opened_signal_refs jsonb not null,
  frozen_identity_binding_ref text not null,
  frozen_subject_ref text not null,
  frozen_patient_ref text null,
  suspected_wrong_binding_ref text null,
  repair_basis text not null,
  lineage_fence_epoch integer not null,
  state text not null,
  opened_by text not null,
  supervisor_approval_ref text null,
  independent_review_ref text null,
  freeze_record_ref text null,
  projection_rebuild_ref text null,
  downstream_disposition_refs jsonb not null,
  compensation_refs jsonb not null,
  release_settlement_ref text null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists identity_repair_cases_episode_idx
  on identity_repair_cases (episode_id, created_at desc);

create index if not exists identity_repair_cases_binding_idx
  on identity_repair_cases (frozen_identity_binding_ref, state);

create table if not exists identity_repair_signals (
  repair_signal_id text primary key,
  episode_id text not null,
  affected_request_ref text not null,
  observed_identity_binding_ref text not null,
  observed_session_ref text null,
  observed_access_grant_ref text null,
  observed_route_intent_binding_ref text null,
  signal_class text not null,
  signal_disposition text not null,
  evidence_refs jsonb not null,
  opened_repair_case_ref text null references identity_repair_cases(repair_case_id),
  reported_by text not null,
  reported_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists identity_repair_signals_episode_idx
  on identity_repair_signals (episode_id, reported_at desc);

create index if not exists identity_repair_signals_case_idx
  on identity_repair_signals (opened_repair_case_ref, reported_at desc);

create table if not exists identity_repair_freeze_records (
  freeze_record_id text primary key,
  identity_repair_case_ref text not null references identity_repair_cases(repair_case_id),
  frozen_identity_binding_ref text not null,
  lineage_fence_epoch integer not null,
  session_termination_settlement_refs jsonb not null,
  access_grant_supersession_refs jsonb not null,
  superseded_route_intent_binding_refs jsonb not null,
  communications_hold_state text not null,
  projection_hold_state text not null,
  affected_audience_refs jsonb not null,
  freeze_state text not null,
  activated_at timestamptz not null,
  released_at timestamptz null,
  row_version integer not null default 1
);

create index if not exists identity_repair_freeze_records_case_idx
  on identity_repair_freeze_records (identity_repair_case_ref, activated_at desc);

create table if not exists identity_repair_branch_dispositions (
  branch_disposition_id text primary key,
  identity_repair_case_ref text not null references identity_repair_cases(repair_case_id),
  branch_type text not null,
  governing_object_ref text not null,
  frozen_identity_binding_ref text not null,
  required_disposition text not null,
  compensation_ref text null,
  revalidation_settlement_ref text null,
  branch_state text not null,
  released_at timestamptz null,
  row_version integer not null default 1
);

create index if not exists identity_repair_branch_dispositions_case_idx
  on identity_repair_branch_dispositions (identity_repair_case_ref, branch_state);

create table if not exists identity_repair_release_settlements (
  release_settlement_id text primary key,
  identity_repair_case_ref text not null references identity_repair_cases(repair_case_id),
  resulting_identity_binding_ref text not null,
  freeze_record_ref text not null references identity_repair_freeze_records(freeze_record_id),
  downstream_disposition_refs jsonb not null,
  projection_rebuild_ref text null,
  replacement_access_grant_refs jsonb not null,
  replacement_route_intent_binding_refs jsonb not null,
  replacement_session_establishment_decision_ref text null,
  communications_resume_state text not null,
  release_mode text not null,
  recorded_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists identity_repair_release_settlements_case_idx
  on identity_repair_release_settlements (identity_repair_case_ref, recorded_at desc);
