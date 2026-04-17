-- par_071_phase0_track_backend_implement_request_lifecycle_lease_lineage_fence_and_command_action_records
-- Canonical compare-and-set lease, stale-owner recovery, lineage fence, and command-action tables.

create table if not exists request_lifecycle_leases (
  lease_id text primary key,
  episode_id text not null,
  request_id text not null,
  request_lineage_ref text not null,
  domain text not null,
  domain_object_ref text not null,
  lease_authority_ref text not null,
  owner_actor_ref text not null,
  owner_session_ref text null,
  owner_worker_ref text null,
  ownership_epoch integer not null,
  lease_scope_hash text not null,
  state text not null,
  close_block_reason text null,
  lease_ttl_seconds integer not null,
  heartbeat_at timestamptz not null,
  fencing_token text not null,
  stale_owner_recovery_ref text null,
  superseded_by_lease_ref text null,
  acquired_at timestamptz not null,
  released_at timestamptz null,
  break_eligible_at timestamptz null,
  broken_by_actor_ref text null,
  break_reason text null,
  row_version integer not null default 1
);

create index if not exists request_lifecycle_leases_authority_idx
  on request_lifecycle_leases (domain, domain_object_ref, ownership_epoch desc);

create index if not exists request_lifecycle_leases_request_idx
  on request_lifecycle_leases (request_id, state, acquired_at desc);

create table if not exists stale_ownership_recovery_records (
  stale_ownership_recovery_id text primary key,
  request_id text not null,
  lease_ref text not null references request_lifecycle_leases(lease_id),
  domain text not null,
  domain_object_ref text not null,
  last_ownership_epoch integer not null,
  last_fencing_token text not null,
  detected_at timestamptz not null,
  detected_by_ref text not null,
  recovery_reason text not null,
  blocked_action_scope_refs jsonb not null,
  operator_visible_work_ref text not null,
  same_shell_recovery_route_ref text not null,
  resolution_state text not null,
  resolved_at timestamptz null,
  row_version integer not null default 1
);

create index if not exists stale_ownership_recovery_records_lease_idx
  on stale_ownership_recovery_records (lease_ref, detected_at desc);

create table if not exists lease_takeover_records (
  lease_takeover_record_id text primary key,
  prior_lease_ref text not null references request_lifecycle_leases(lease_id),
  replacement_lease_ref text null references request_lifecycle_leases(lease_id),
  from_owner_ref text not null,
  to_owner_ref text not null,
  authorized_by_ref text not null,
  takeover_reason text not null,
  takeover_state text not null,
  issued_at timestamptz not null,
  committed_at timestamptz null,
  cancelled_at timestamptz null,
  row_version integer not null default 1
);

create index if not exists lease_takeover_records_prior_lease_idx
  on lease_takeover_records (prior_lease_ref, issued_at desc);

create table if not exists lineage_fences (
  fence_id text primary key,
  episode_id text not null,
  current_epoch integer not null,
  issued_for text not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists lineage_fences_episode_epoch_idx
  on lineage_fences (episode_id, current_epoch desc);

create table if not exists command_action_records (
  action_record_id text primary key,
  action_scope text not null,
  governing_object_ref text not null,
  canonical_object_descriptor_ref text not null,
  initiating_bounded_context_ref text not null,
  governing_bounded_context_ref text not null,
  governing_object_version_ref text not null,
  lineage_scope text not null,
  route_intent_ref text not null,
  route_contract_digest_ref text not null,
  required_context_boundary_refs jsonb not null,
  parent_anchor_ref text not null,
  route_intent_tuple_hash text not null,
  edge_correlation_id text not null,
  initiating_ui_event_ref text not null,
  initiating_ui_event_causality_frame_ref text not null,
  acting_context_ref text not null,
  policy_bundle_ref text not null,
  lineage_fence_epoch integer not null,
  source_command_id text not null,
  transport_correlation_id text not null,
  semantic_payload_hash text not null,
  idempotency_key text not null,
  idempotency_record_ref text not null,
  command_following_token_ref text not null,
  expected_effect_set_hash text not null,
  causal_token text not null,
  created_at timestamptz not null,
  settled_at timestamptz null,
  supersedes_action_record_ref text null references command_action_records(action_record_id),
  row_version integer not null default 1
);

create index if not exists command_action_records_governing_object_idx
  on command_action_records (governing_object_ref, created_at desc);

create index if not exists command_action_records_source_command_idx
  on command_action_records (governing_object_ref, source_command_id, action_scope, created_at desc);

create index if not exists command_action_records_idempotency_idx
  on command_action_records (governing_object_ref, route_intent_tuple_hash, idempotency_key, semantic_payload_hash);

create table if not exists lease_authority_states (
  authority_key text primary key,
  episode_id text not null,
  request_id text not null,
  request_lineage_ref text not null,
  domain text not null,
  domain_object_ref text not null,
  governing_object_version_ref text not null,
  current_lease_ref text null references request_lifecycle_leases(lease_id),
  current_ownership_epoch integer not null,
  current_fencing_token text null,
  current_lineage_epoch integer not null,
  updated_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists lease_authority_states_request_idx
  on lease_authority_states (request_id, domain, domain_object_ref);
