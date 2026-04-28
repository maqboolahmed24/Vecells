-- par_355_phase6_track_backend_build_pharmacy_console_support_region_and_stock_truth_api
-- Canonical persistence scaffolding for same-shell pharmacy console support-region truth.

create table if not exists phase6_pharmacy_medication_line_state (
  pharmacy_medication_line_state_id text primary key,
  pharmacy_case_id text not null,
  line_item_ref text not null,
  line_item_version_ref text not null,
  policy_bundle_ref text not null,
  review_session_ref text not null,
  selected_candidate_ref text,
  current_line_state text not null,
  communication_previewed boolean not null default false,
  version integer not null
);

create table if not exists phase6_pharmacy_inventory_support_record (
  inventory_support_record_id text primary key,
  pharmacy_case_id text not null,
  line_item_ref text not null,
  candidate_ref text not null,
  product_identity_ref text not null,
  equivalence_class text not null,
  verified_at timestamptz,
  stale_after_at timestamptz,
  hard_stop_after_at timestamptz,
  expiry_band text not null,
  trust_state text not null,
  freshness_confidence_state text not null,
  quarantine_flag boolean not null default false,
  supervisor_hold_flag boolean not null default false,
  version integer not null
);

create index if not exists idx_phase6_inventory_support_case_line
  on phase6_pharmacy_inventory_support_record (pharmacy_case_id, line_item_ref);

create table if not exists phase6_inventory_comparison_fence (
  inventory_comparison_fence_id text primary key,
  pharmacy_case_id text not null,
  line_item_ref text not null,
  candidate_ref text not null,
  fence_state text not null,
  invalidated_reason_code text,
  fence_epoch integer not null,
  refreshed_at timestamptz not null,
  version integer not null
);

create index if not exists idx_phase6_inventory_comparison_fence_case_line
  on phase6_inventory_comparison_fence (pharmacy_case_id, line_item_ref, fence_state);

create table if not exists phase6_supply_computation (
  supply_computation_id text primary key,
  pharmacy_case_id text not null,
  line_item_ref text not null,
  candidate_ref text not null,
  coverage_ratio numeric,
  remaining_base_units numeric,
  days_covered numeric,
  computation_state text not null,
  computed_at timestamptz not null,
  version integer not null
);

create index if not exists idx_phase6_supply_computation_case_line
  on phase6_supply_computation (pharmacy_case_id, line_item_ref, candidate_ref);

create table if not exists phase6_pharmacy_console_summary_projection (
  pharmacy_console_summary_projection_id text primary key,
  pharmacy_case_id text not null,
  dominant_promoted_region text not null,
  handoff_readiness_state text not null,
  action_settlement_state text not null,
  continuity_validation_state text not null,
  assurance_state text not null,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_pharmacy_console_worklist_projection (
  pharmacy_console_worklist_projection_id text primary key,
  pharmacy_case_id text not null,
  case_status text not null,
  support_region_state text not null,
  inventory_freshness_state text not null,
  handoff_readiness_state text not null,
  action_settlement_state text not null,
  continuity_validation_state text not null,
  assurance_state text not null,
  computed_at timestamptz not null,
  version integer not null
);

create index if not exists idx_phase6_console_worklist_state
  on phase6_pharmacy_console_worklist_projection (
    support_region_state,
    inventory_freshness_state,
    handoff_readiness_state,
    action_settlement_state,
    continuity_validation_state,
    assurance_state
  );

create table if not exists phase6_pharmacy_case_workbench_projection (
  pharmacy_case_workbench_projection_id text primary key,
  pharmacy_case_id text not null,
  summary_projection_ref text not null,
  mission_projection_ref text not null,
  medication_validation_projection_ref text not null,
  handoff_projection_ref text not null,
  action_settlement_projection_ref text not null,
  assurance_projection_ref text not null,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_pharmacy_mission_projection (
  pharmacy_mission_projection_id text primary key,
  pharmacy_case_id text not null,
  mission_token_ref text not null,
  dominant_promoted_region text not null,
  queue_anchor_lease_ref text not null,
  handoff_watch_window_ref text,
  fence_epoch integer not null,
  continuity_validation_state text not null,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_medication_validation_projection (
  medication_validation_projection_id text primary key,
  pharmacy_case_id text not null,
  case_checkpoint_rollup text not null,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_inventory_truth_projection (
  inventory_truth_projection_id text primary key,
  pharmacy_case_id text not null,
  line_item_ref text not null,
  dominant_freshness_state text not null,
  hard_stop_reached boolean not null default false,
  trust_state text not null,
  computed_at timestamptz not null,
  version integer not null
);

create index if not exists idx_phase6_inventory_truth_case_line
  on phase6_inventory_truth_projection (pharmacy_case_id, line_item_ref, dominant_freshness_state);

create table if not exists phase6_inventory_comparison_projection (
  inventory_comparison_projection_id text primary key,
  pharmacy_case_id text not null,
  line_item_ref text not null,
  active_fence_ref text,
  preserved_read_only_fence_ref text,
  dominant_compare_state text not null,
  computed_at timestamptz not null,
  version integer not null
);

create index if not exists idx_phase6_inventory_comparison_case_line
  on phase6_inventory_comparison_projection (pharmacy_case_id, line_item_ref, dominant_compare_state);

create table if not exists phase6_pharmacy_handoff_projection (
  pharmacy_handoff_projection_id text primary key,
  pharmacy_case_id text not null,
  handoff_readiness_state text not null,
  inventory_freshness_state text not null,
  patient_communication_preview_state text not null,
  action_settlement_ref text not null,
  continuity_evidence_ref text not null,
  handoff_watch_projection_ref text not null,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_pharmacy_handoff_watch_projection (
  pharmacy_handoff_watch_projection_id text primary key,
  pharmacy_case_id text not null,
  watch_window_state text not null,
  watch_window_start_at timestamptz,
  watch_window_end_at timestamptz,
  recovery_owner_ref text,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_pharmacy_action_settlement_projection (
  pharmacy_action_settlement_projection_id text primary key,
  pharmacy_case_id text not null,
  canonical_settlement_type text not null,
  canonical_settlement_ref text,
  mutation_gate_ref text,
  fence_epoch integer not null,
  agreement_state text not null,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_pharmacy_console_continuity_projection (
  pharmacy_console_continuity_projection_id text primary key,
  pharmacy_case_id text not null,
  continuity_evidence_projection_ref text,
  validation_state text not null,
  pending_posture text,
  next_review_at timestamptz,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_pharmacy_assurance_projection (
  pharmacy_assurance_projection_id text primary key,
  pharmacy_case_id text not null,
  choice_truth_projection_ref text,
  dispatch_truth_projection_ref text,
  outcome_truth_projection_ref text,
  consent_checkpoint_projection_ref text,
  practice_visibility_projection_ref text,
  assurance_state text not null,
  current_recovery_owner_ref text,
  computed_at timestamptz not null,
  version integer not null
);

create table if not exists phase6_pharmacy_console_audit_event (
  pharmacy_console_audit_event_id text primary key,
  pharmacy_case_id text not null,
  line_item_ref text,
  scope_kind text not null,
  event_name text not null,
  payload_digest text not null,
  recorded_at timestamptz not null,
  version integer not null
);
