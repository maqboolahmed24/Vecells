-- Phase 8 task 416: assistive freeze disposition and freshness invalidations.
-- Persist structured refs, hashes, state, blocker codes, and recovery posture only.

CREATE TABLE IF NOT EXISTS assistive_release_freeze_record (
  assistive_release_freeze_record_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  rollout_slice_contract_ref TEXT NOT NULL,
  rollout_verdict_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  audience_tier TEXT NOT NULL,
  release_cohort_ref TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  policy_bundle_ref TEXT NOT NULL,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  rollout_rung_at_freeze TEXT NOT NULL CHECK (
    rollout_rung_at_freeze IN ('shadow_only', 'visible_summary', 'visible_insert', 'visible_commit')
  ),
  fallback_mode TEXT NOT NULL CHECK (
    fallback_mode IN ('shadow_only', 'read_only_provenance', 'placeholder_only', 'assistive_hidden')
  ),
  trigger_type TEXT NOT NULL CHECK (
    trigger_type IN (
      'threshold_breach',
      'trust_degraded',
      'trust_quarantined',
      'policy_drift',
      'publication_stale',
      'incident_spike',
      'runtime_publication_stale',
      'selected_anchor_drift',
      'decision_epoch_drift',
      'insertion_point_drift',
      'final_artifact_superseded',
      'manual_freeze'
    )
  ),
  trigger_ref TEXT NOT NULL,
  freeze_state TEXT NOT NULL CHECK (freeze_state IN ('monitoring', 'frozen', 'shadow_only', 'released')),
  opened_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  current_blocker_refs JSONB NOT NULL,
  freeze_record_hash TEXT NOT NULL,
  CONSTRAINT assistive_release_freeze_record_current_truth CHECK (
    watch_tuple_hash <> '' AND release_recovery_disposition_ref <> '' AND freeze_record_hash <> ''
  ),
  CONSTRAINT assistive_release_freeze_record_refs_only CHECK (
    trigger_ref NOT LIKE '%draft-text:%' AND trigger_ref NOT LIKE '%transcript:%'
  )
);

CREATE TABLE IF NOT EXISTS assistive_freeze_disposition (
  assistive_freeze_disposition_id TEXT PRIMARY KEY,
  capability_code TEXT NOT NULL,
  rollout_verdict_ref TEXT NOT NULL,
  freeze_record_ref TEXT NOT NULL,
  freeze_mode TEXT NOT NULL CHECK (
    freeze_mode IN ('shadow_only', 'read_only_provenance', 'placeholder_only', 'assistive_hidden')
  ),
  staff_message_ref TEXT NOT NULL,
  recovery_action_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  preserve_visible_artifacts BOOLEAN NOT NULL,
  preserve_provenance_footer BOOLEAN NOT NULL,
  suppress_accept BOOLEAN NOT NULL,
  suppress_insert BOOLEAN NOT NULL,
  suppress_regenerate BOOLEAN NOT NULL,
  suppress_export BOOLEAN NOT NULL,
  suppress_completion_adjacent BOOLEAN NOT NULL,
  applies_to_route_families JSONB NOT NULL,
  disposition_state TEXT NOT NULL CHECK (disposition_state IN ('current', 'superseded', 'released')),
  resolved_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assistive_freeze_disposition_exact_modes_only CHECK (
    freeze_mode IN ('shadow_only', 'read_only_provenance', 'placeholder_only', 'assistive_hidden')
  ),
  CONSTRAINT assistive_freeze_disposition_blocks_stale_write_controls CHECK (
    suppress_accept AND suppress_insert AND suppress_export AND suppress_completion_adjacent
  )
);

CREATE TABLE IF NOT EXISTS assistive_policy_freshness_verdict (
  policy_freshness_verdict_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  release_candidate_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  expected_policy_bundle_ref TEXT NOT NULL,
  session_policy_bundle_ref TEXT NOT NULL,
  prompt_policy_bundle_ref TEXT NOT NULL,
  approval_gate_policy_bundle_ref TEXT NOT NULL,
  threshold_set_policy_bundle_ref TEXT NOT NULL,
  freshness_state TEXT NOT NULL CHECK (freshness_state IN ('current', 'stale', 'mismatched', 'missing', 'blocked')),
  drifted_refs JSONB NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  invalidates_actionability BOOLEAN NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT policy_freshness_tuple_match_required CHECK (
    invalidates_actionability
    OR (
      expected_policy_bundle_ref = session_policy_bundle_ref
      AND expected_policy_bundle_ref = prompt_policy_bundle_ref
      AND expected_policy_bundle_ref = approval_gate_policy_bundle_ref
      AND expected_policy_bundle_ref = threshold_set_policy_bundle_ref
    )
  )
);

CREATE TABLE IF NOT EXISTS assistive_publication_freshness_verdict (
  publication_freshness_verdict_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  surface_binding_ref TEXT NOT NULL,
  expected_surface_route_contract_ref TEXT NOT NULL,
  actual_surface_route_contract_ref TEXT NOT NULL,
  expected_surface_publication_ref TEXT NOT NULL,
  actual_surface_publication_ref TEXT NOT NULL,
  expected_runtime_publication_bundle_ref TEXT NOT NULL,
  actual_runtime_publication_bundle_ref TEXT NOT NULL,
  surface_publication_state TEXT NOT NULL CHECK (
    surface_publication_state IN ('current', 'stale', 'mismatched', 'withdrawn', 'missing', 'blocked')
  ),
  runtime_publication_state TEXT NOT NULL CHECK (
    runtime_publication_state IN ('current', 'stale', 'withdrawn', 'missing', 'blocked')
  ),
  freshness_state TEXT NOT NULL CHECK (
    freshness_state IN ('current', 'stale', 'mismatched', 'withdrawn', 'missing', 'blocked')
  ),
  drifted_refs JSONB NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  invalidates_actionability BOOLEAN NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT publication_freshness_tuple_match_required CHECK (
    invalidates_actionability
    OR (
      expected_surface_route_contract_ref = actual_surface_route_contract_ref
      AND expected_surface_publication_ref = actual_surface_publication_ref
      AND expected_runtime_publication_bundle_ref = actual_runtime_publication_bundle_ref
    )
  )
);

CREATE TABLE IF NOT EXISTS assistive_session_invalidation_record (
  session_invalidation_record_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  watch_tuple_hash TEXT NOT NULL,
  trust_projection_ref TEXT NOT NULL,
  rollout_verdict_ref TEXT NOT NULL,
  policy_freshness_verdict_ref TEXT,
  publication_freshness_verdict_ref TEXT,
  freeze_record_ref TEXT,
  affected_feedback_chain_refs JSONB NOT NULL,
  affected_patch_lease_refs JSONB NOT NULL,
  affected_work_protection_lease_refs JSONB NOT NULL,
  invalidated_surfaces JSONB NOT NULL,
  trigger_type TEXT NOT NULL CHECK (
    trigger_type IN (
      'trust_degradation',
      'policy_promotion',
      'policy_bundle_mismatch',
      'publication_drift',
      'runtime_publication_drift',
      'decision_epoch_drift',
      'selected_anchor_drift',
      'insertion_point_drift',
      'incident_linked',
      'final_artifact_superseded'
    )
  ),
  trigger_ref TEXT NOT NULL,
  selected_anchor_ref TEXT,
  decision_epoch_ref TEXT,
  insertion_point_ref TEXT,
  final_human_artifact_ref TEXT,
  invalidation_state TEXT NOT NULL CHECK (invalidation_state IN ('invalidated', 'stale_recoverable', 'blocked')),
  recovery_required BOOLEAN NOT NULL,
  stale_action_blockers JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT stale_session_invalidates_actionability CHECK (recovery_required),
  CONSTRAINT invalidation_records_refs_only CHECK (
    trigger_ref NOT LIKE '%draft-text:%' AND trigger_ref NOT LIKE '%prompt-fragment:%'
  )
);

CREATE TABLE IF NOT EXISTS assistive_recovery_disposition_binding (
  recovery_binding_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  freeze_record_ref TEXT NOT NULL,
  freeze_disposition_ref TEXT NOT NULL,
  release_recovery_disposition_ref TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  same_shell_required BOOLEAN NOT NULL,
  shell_family_ref TEXT NOT NULL,
  dominant_recovery_action_ref TEXT NOT NULL,
  operator_message_ref TEXT NOT NULL,
  clinician_message_ref TEXT NOT NULL,
  preserved_artifact_refs JSONB NOT NULL,
  preserved_provenance_envelope_refs JSONB NOT NULL,
  binding_state TEXT NOT NULL CHECK (binding_state IN ('bound', 'stale', 'blocked')),
  blocking_reason_codes JSONB NOT NULL,
  bound_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT same_shell_recovery_disposition_required CHECK (same_shell_required)
);

CREATE TABLE IF NOT EXISTS assistive_actionability_freeze_decision (
  actionability_freeze_decision_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  requested_action TEXT NOT NULL CHECK (
    requested_action IN ('accept', 'insert', 'regenerate', 'export', 'completion_adjacent', 'view_provenance')
  ),
  freeze_record_ref TEXT,
  freeze_disposition_ref TEXT,
  policy_freshness_verdict_ref TEXT,
  publication_freshness_verdict_ref TEXT,
  session_invalidation_record_ref TEXT,
  recovery_binding_ref TEXT,
  decision_state TEXT NOT NULL CHECK (decision_state IN ('enabled', 'regenerate_only', 'observe_only', 'blocked')),
  allowed BOOLEAN NOT NULL,
  preserve_visible_artifacts BOOLEAN NOT NULL,
  preserve_provenance_footer BOOLEAN NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT actionability_freeze_guard_blocks_stale_controls CHECK (
    allowed OR decision_state IN ('observe_only', 'blocked', 'regenerate_only')
  )
);

CREATE TABLE IF NOT EXISTS assistive_session_reclearance_record (
  reclearance_record_id TEXT PRIMARY KEY,
  assistive_session_ref TEXT NOT NULL,
  previous_session_invalidation_ref TEXT NOT NULL,
  previous_patch_lease_refs JSONB NOT NULL,
  replacement_session_ref TEXT,
  replacement_patch_lease_refs JSONB NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('session_refresh', 'regeneration', 'operator_unfreeze')),
  reclearance_state TEXT NOT NULL CHECK (reclearance_state IN ('required', 'cleared', 'blocked')),
  required_fresh_refs JSONB NOT NULL,
  blocking_reason_codes JSONB NOT NULL,
  cleared_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT reclearance_requires_refresh_or_regeneration CHECK (
    reclearance_state <> 'cleared'
    OR method IN ('session_refresh', 'regeneration', 'operator_unfreeze')
  ),
  CONSTRAINT insertion_lease_not_silently_resurrected CHECK (
    reclearance_state <> 'cleared'
    OR previous_patch_lease_refs::TEXT <> replacement_patch_lease_refs::TEXT
  )
);

CREATE TABLE IF NOT EXISTS assistive_freeze_audit_record (
  audit_record_id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  audit_correlation_id TEXT NOT NULL,
  purpose_of_use TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted', 'blocked', 'failed_closed')),
  reason_codes JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT freeze_records_phi_safe_refs_only CHECK (
    subject_ref NOT LIKE '%draft-text:%'
    AND subject_ref NOT LIKE '%transcript:%'
    AND subject_ref NOT LIKE '%prompt-fragment:%'
  )
);
