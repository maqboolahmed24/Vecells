-- par_073_queue_rank_models
-- Canonical queue-ordering substrate: plan, snapshot, entry, and suggestion views.

create table if not exists queue_rank_plans (
  queue_rank_plan_id text primary key,
  queue_family_ref text not null,
  eligibility_rule_set_ref text not null,
  lexicographic_tier_policy_ref text not null,
  within_tier_weight_set_ref text not null,
  fairness_merge_policy_ref text not null,
  overload_guard_policy_ref text not null,
  assignment_suggestion_policy_ref text not null,
  explanation_schema_ref text not null,
  canonical_tie_break_policy_ref text not null,
  plan_hash text not null,
  effective_at timestamptz not null,
  version integer not null
);

create unique index if not exists idx_queue_rank_plans_family_effective
  on queue_rank_plans (queue_family_ref, effective_at desc, version desc);

create table if not exists queue_rank_snapshots (
  rank_snapshot_id text primary key,
  queue_ref text not null,
  queue_rank_plan_ref text not null references queue_rank_plans(queue_rank_plan_id),
  as_of_at timestamptz not null,
  source_fact_cut_ref text not null,
  overload_state text not null check (overload_state in ('nominal', 'overload_critical')),
  fairness_cycle_state_ref text not null,
  row_order_hash text not null,
  generated_at timestamptz not null,
  version integer not null
);

create index if not exists idx_queue_rank_snapshots_queue_generated
  on queue_rank_snapshots (queue_ref, generated_at desc);

create table if not exists queue_rank_entries (
  rank_entry_id text primary key,
  rank_snapshot_ref text not null references queue_rank_snapshots(rank_snapshot_id),
  task_ref text not null,
  ordinal integer not null,
  eligibility_state text not null check (
    eligibility_state in ('eligible', 'held_preemption', 'held_trust', 'excluded_scope')
  ),
  lexicographic_tier text not null,
  urgency_score numeric not null,
  residual_band text not null,
  contact_risk_band text not null,
  duplicate_review_flag boolean not null,
  urgency_carry numeric not null,
  fairness_band_ref text not null,
  fairness_credit_before numeric not null,
  fairness_credit_after numeric not null,
  canonical_tie_break_key text not null,
  explanation_payload_ref text not null,
  generated_at timestamptz not null,
  version integer not null
);

create unique index if not exists idx_queue_rank_entries_snapshot_ordinal
  on queue_rank_entries (rank_snapshot_ref, ordinal);

create table if not exists queue_assignment_suggestion_snapshots (
  suggestion_snapshot_id text primary key,
  rank_snapshot_ref text not null references queue_rank_snapshots(rank_snapshot_id),
  reviewer_scope_ref text not null,
  candidate_window_size integer not null,
  fairness_promise_state text not null check (
    fairness_promise_state in ('active', 'suppressed_overload')
  ),
  governed_auto_claim_refs jsonb not null,
  generated_at timestamptz not null,
  version integer not null
);

create index if not exists idx_queue_assignment_suggestions_snapshot
  on queue_assignment_suggestion_snapshots (rank_snapshot_ref, generated_at desc);
