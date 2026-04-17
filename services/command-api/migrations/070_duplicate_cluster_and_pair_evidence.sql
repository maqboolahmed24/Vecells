-- par_070_phase0_track_backend_implement_duplicate_cluster_and_duplicate_pair_evidence_models
-- Canonical duplicate evidence, review container, and settlement authority tables.

create table if not exists duplicate_pair_evidences (
  pair_evidence_id text primary key,
  incoming_lineage_ref text not null,
  incoming_snapshot_ref text not null,
  candidate_request_ref text not null,
  candidate_episode_ref text not null,
  replay_signal_refs jsonb not null,
  continuity_signal_refs jsonb not null,
  conflict_signal_refs jsonb not null,
  relation_model_version_ref text not null,
  channel_calibration_ref text not null,
  threshold_policy_ref text not null,
  feature_vector_hash text not null,
  pi_retry double precision not null,
  pi_same_request_attach double precision not null,
  pi_same_episode double precision not null,
  pi_related_episode double precision not null,
  pi_new_episode double precision not null,
  class_margin double precision not null,
  candidate_margin double precision not null,
  uncertainty_score double precision not null,
  hard_blocker_refs jsonb not null,
  evidence_state text not null,
  created_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists duplicate_pair_evidences_incoming_idx
  on duplicate_pair_evidences (incoming_lineage_ref, created_at desc);

create index if not exists duplicate_pair_evidences_candidate_idx
  on duplicate_pair_evidences (candidate_request_ref, candidate_episode_ref);

create table if not exists duplicate_clusters (
  cluster_id text primary key,
  episode_id text not null,
  canonical_request_id text not null,
  member_request_refs jsonb not null,
  member_snapshot_refs jsonb not null,
  candidate_request_refs jsonb not null,
  pairwise_evidence_refs jsonb not null,
  current_resolution_decision_ref text null,
  resolution_decision_refs jsonb not null,
  relation_type text not null,
  review_status text not null,
  decision_ref text null,
  cluster_confidence double precision not null,
  threshold_policy_ref text not null,
  channel_calibration_ref text not null,
  instability_state text not null,
  last_recomputed_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  row_version integer not null default 1
);

create index if not exists duplicate_clusters_canonical_idx
  on duplicate_clusters (canonical_request_id, created_at desc);

create index if not exists duplicate_clusters_episode_idx
  on duplicate_clusters (episode_id, review_status, created_at desc);

create table if not exists duplicate_resolution_decisions (
  duplicate_resolution_decision_id text primary key,
  duplicate_cluster_ref text not null references duplicate_clusters(cluster_id),
  incoming_lineage_ref text not null,
  incoming_snapshot_ref text not null,
  target_request_ref text null,
  target_episode_ref text null,
  winning_pair_evidence_ref text not null references duplicate_pair_evidences(pair_evidence_id),
  competing_pair_evidence_refs jsonb not null,
  decision_class text not null,
  continuity_witness_class text not null,
  continuity_witness_ref text null,
  review_mode text not null,
  reason_codes jsonb not null,
  decision_state text not null,
  supersedes_decision_ref text null references duplicate_resolution_decisions(duplicate_resolution_decision_id),
  downstream_invalidation_refs jsonb not null,
  decided_by_ref text not null,
  decided_at timestamptz not null,
  reverted_at timestamptz null,
  row_version integer not null default 1
);

create index if not exists duplicate_resolution_decisions_cluster_idx
  on duplicate_resolution_decisions (duplicate_cluster_ref, decided_at desc);

create index if not exists duplicate_resolution_decisions_target_idx
  on duplicate_resolution_decisions (target_request_ref, target_episode_ref, decided_at desc);
