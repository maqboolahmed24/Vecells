CREATE TABLE IF NOT EXISTS assistive_session (
  assistive_session_id text PRIMARY KEY,
  task_ref text NOT NULL,
  context_snapshot_ref text NOT NULL,
  review_version_ref text NOT NULL,
  decision_epoch_ref text NOT NULL,
  policy_bundle_ref text NOT NULL,
  lineage_fence_epoch text NOT NULL,
  entity_continuity_key text NOT NULL,
  selected_anchor_ref text NOT NULL,
  surface_binding_ref text NOT NULL,
  surface_publication_ref text NOT NULL,
  runtime_publication_bundle_ref text NOT NULL,
  runtime_publication_state text NOT NULL,
  staff_workspace_consistency_projection_ref text NOT NULL,
  workspace_slice_trust_projection_ref text NOT NULL,
  workspace_trust_envelope_ref text NOT NULL,
  assistive_capability_trust_envelope_ref text NOT NULL,
  review_action_lease_ref text NOT NULL,
  session_fence_token_hash text NOT NULL,
  trust_envelope_actionability_state text NOT NULL,
  trust_envelope_completion_adjacency_state text NOT NULL,
  live_ttl_seconds integer NOT NULL,
  grace_ttl_seconds integer NOT NULL,
  last_validated_at timestamptz NOT NULL,
  session_state text NOT NULL,
  insert_posture_state text NOT NULL,
  blocking_reason_refs jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT assistive_session_same_shell_refs_required CHECK (
    task_ref <> ''
    AND context_snapshot_ref <> ''
    AND selected_anchor_ref <> ''
    AND staff_workspace_consistency_projection_ref <> ''
    AND workspace_slice_trust_projection_ref <> ''
    AND workspace_trust_envelope_ref <> ''
    AND assistive_capability_trust_envelope_ref <> ''
  ),
  CONSTRAINT assistive_session_fence_token_hashed CHECK (session_fence_token_hash <> '' AND length(session_fence_token_hash) >= 16),
  CONSTRAINT assistive_session_ttl_positive CHECK (live_ttl_seconds > 0 AND grace_ttl_seconds > 0),
  CONSTRAINT assistive_session_insert_posture_separated CHECK (
    session_state IN ('live', 'stale', 'recovery_required', 'blocked')
    AND insert_posture_state IN ('allowed', 'regenerate_required', 'governed_recovery', 'blocked')
  )
);

CREATE TABLE IF NOT EXISTS assistive_draft_insertion_point (
  assistive_draft_insertion_point_id text PRIMARY KEY,
  assistive_session_ref text NOT NULL,
  task_ref text NOT NULL,
  surface_ref text NOT NULL,
  content_class text NOT NULL,
  selected_anchor_ref text NOT NULL,
  review_version_ref text NOT NULL,
  decision_epoch_ref text NOT NULL,
  lineage_fence_epoch text NOT NULL,
  slot_hash text NOT NULL,
  slot_state text NOT NULL,
  quiet_return_target_ref text NOT NULL,
  last_validated_at timestamptz NOT NULL,
  CONSTRAINT assistive_insertion_point_slot_hash_required CHECK (slot_hash <> ''),
  CONSTRAINT assistive_insertion_point_content_class_bounded CHECK (
    content_class IN ('note_section', 'message_body', 'endpoint_reasoning', 'question_set')
  ),
  CONSTRAINT assistive_insertion_point_state_valid CHECK (slot_state IN ('live', 'occupied', 'stale', 'blocked'))
);

CREATE TABLE IF NOT EXISTS assistive_draft_patch_lease (
  assistive_draft_patch_lease_id text PRIMARY KEY,
  assistive_session_ref text NOT NULL,
  artifact_ref text NOT NULL,
  section_ref text NOT NULL,
  draft_insertion_point_ref text NOT NULL,
  review_action_lease_ref text NOT NULL,
  selected_anchor_ref text NOT NULL,
  review_version_ref text NOT NULL,
  decision_epoch_ref text NOT NULL,
  lineage_fence_epoch text NOT NULL,
  slot_hash text NOT NULL,
  content_class text NOT NULL,
  lease_state text NOT NULL,
  invalidating_drift_state text NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CONSTRAINT assistive_patch_lease_requires_slot_hash CHECK (slot_hash <> ''),
  CONSTRAINT assistive_patch_lease_content_class_bounded CHECK (
    content_class IN ('note_section', 'message_body', 'endpoint_reasoning', 'question_set')
  ),
  CONSTRAINT assistive_patch_lease_expiry_order CHECK (expires_at > issued_at),
  CONSTRAINT assistive_patch_lease_active_or_invalidated CHECK (
    lease_state IN ('active', 'invalidated', 'released', 'expired')
    AND invalidating_drift_state IN (
      'none',
      'review_version',
      'decision_epoch',
      'policy_bundle',
      'publication',
      'trust',
      'insertion_point_invalidated',
      'anchor_invalidated',
      'lease_expired'
    )
  )
);

CREATE TABLE IF NOT EXISTS assistive_work_protection_lease (
  assistive_work_protection_lease_id text PRIMARY KEY,
  assistive_session_id text NOT NULL,
  workspace_focus_protection_lease_ref text NOT NULL,
  assistive_capability_trust_envelope_ref text NOT NULL,
  artifact_ref text NOT NULL,
  lock_reason text NOT NULL,
  selected_anchor_ref text NOT NULL,
  draft_insertion_point_ref text,
  protected_region_ref text NOT NULL,
  quiet_return_target_ref text NOT NULL,
  buffered_deferred_delta_refs jsonb NOT NULL,
  queue_change_batch_ref text,
  lease_state text NOT NULL,
  invalidating_drift_state text NOT NULL,
  started_at timestamptz NOT NULL,
  released_at timestamptz,
  CONSTRAINT assistive_work_protection_same_shell_required CHECK (
    workspace_focus_protection_lease_ref <> ''
    AND selected_anchor_ref <> ''
    AND protected_region_ref <> ''
    AND quiet_return_target_ref <> ''
  ),
  CONSTRAINT assistive_work_protection_lock_reason_valid CHECK (lock_reason IN ('composing', 'comparing', 'confirming', 'reading_delta')),
  CONSTRAINT assistive_work_protection_state_valid CHECK (lease_state IN ('active', 'invalidated', 'released', 'expired'))
);

CREATE TABLE IF NOT EXISTS assistive_deferred_delta (
  assistive_deferred_delta_id text PRIMARY KEY,
  assistive_session_ref text NOT NULL,
  assistive_work_protection_lease_ref text NOT NULL,
  delta_kind text NOT NULL,
  blocker_severity text NOT NULL,
  source_ref text NOT NULL,
  target_ref text NOT NULL,
  delta_hash text NOT NULL,
  delta_state text NOT NULL,
  received_at timestamptz NOT NULL,
  CONSTRAINT assistive_deferred_delta_hash_required CHECK (delta_hash <> ''),
  CONSTRAINT assistive_deferred_delta_state_valid CHECK (delta_state IN ('buffered', 'released', 'superseded', 'blocking_bypass'))
);

CREATE TABLE IF NOT EXISTS assistive_quiet_return_target (
  assistive_quiet_return_target_id text PRIMARY KEY,
  assistive_session_ref text NOT NULL,
  selected_anchor_ref text NOT NULL,
  protected_region_ref text NOT NULL,
  prior_quiet_region_ref text NOT NULL,
  primary_reading_target_ref text NOT NULL,
  return_route_ref text NOT NULL,
  quiet_return_target_hash text NOT NULL,
  target_state text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT assistive_quiet_return_target_same_shell_required CHECK (
    selected_anchor_ref <> ''
    AND protected_region_ref <> ''
    AND prior_quiet_region_ref <> ''
    AND primary_reading_target_ref <> ''
    AND return_route_ref <> ''
  )
);

CREATE TABLE IF NOT EXISTS assistive_work_protection_audit_record (
  audit_record_id text PRIMARY KEY,
  service_name text NOT NULL,
  action text NOT NULL,
  actor_ref text NOT NULL,
  actor_role text NOT NULL,
  route_intent_binding_ref text NOT NULL,
  audit_correlation_id text NOT NULL,
  purpose_of_use text NOT NULL,
  subject_ref text NOT NULL,
  outcome text NOT NULL,
  reason_codes jsonb NOT NULL,
  recorded_at timestamptz NOT NULL
);
