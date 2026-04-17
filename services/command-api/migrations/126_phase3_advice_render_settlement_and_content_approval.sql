-- 126_phase3_advice_render_settlement_and_content_approval.sql
-- Phase 3 advice render settlement and content approval persistence contract.
--
-- This migration is intentionally schema-first and simulator-safe for the prompt
-- track. The executable in-memory kernel remains the source of behavior in tests
-- until the repository-backed persistence adapter is introduced.

CREATE TABLE IF NOT EXISTS phase3_clinical_content_approval_records (
  clinical_content_approval_record_id TEXT PRIMARY KEY,
  pathway_ref TEXT NOT NULL,
  advice_bundle_version_ref TEXT NOT NULL,
  clinical_intent_ref TEXT NOT NULL,
  compiled_policy_bundle_ref TEXT NOT NULL,
  approval_scope_hash TEXT NOT NULL,
  approval_state TEXT NOT NULL,
  review_schedule_ref TEXT,
  approved_by_ref TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  supersedes_approval_record_ref TEXT,
  approved_audience_tier_refs_json TEXT NOT NULL,
  approved_channel_refs_json TEXT NOT NULL,
  approved_locale_refs_json TEXT NOT NULL,
  approved_reading_level_refs_json TEXT NOT NULL,
  approved_accessibility_variant_refs_json TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_content_review_schedules (
  content_review_schedule_id TEXT PRIMARY KEY,
  pathway_ref TEXT NOT NULL,
  advice_bundle_version_ref TEXT NOT NULL,
  review_cadence_ref TEXT NOT NULL,
  review_state TEXT NOT NULL,
  last_reviewed_at TEXT NOT NULL,
  next_review_due_at TEXT NOT NULL,
  hard_expiry_at TEXT,
  review_owner_ref TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_advice_bundle_versions (
  advice_bundle_version_id TEXT PRIMARY KEY,
  pathway_ref TEXT NOT NULL,
  compiled_policy_bundle_ref TEXT NOT NULL,
  clinical_intent_ref TEXT NOT NULL,
  audience_tier_refs_json TEXT NOT NULL,
  variant_set_ref TEXT NOT NULL,
  safety_net_instruction_set_ref TEXT NOT NULL,
  supersedes_advice_bundle_version_ref TEXT,
  invalidation_trigger_refs_json TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  approval_record_ref TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_advice_variant_sets (
  advice_variant_set_id TEXT PRIMARY KEY,
  advice_bundle_version_ref TEXT NOT NULL,
  channel_ref TEXT NOT NULL,
  locale_ref TEXT NOT NULL,
  reading_level_ref TEXT,
  content_blocks_ref TEXT NOT NULL,
  fallback_transform_ref TEXT,
  preview_checksum TEXT NOT NULL,
  translation_version_ref TEXT NOT NULL,
  accessibility_variant_refs_json TEXT NOT NULL,
  linked_artifact_contract_refs_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_advice_render_settlements (
  advice_render_settlement_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  advice_eligibility_grant_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  decision_supersession_record_ref TEXT,
  advice_bundle_version_ref TEXT NOT NULL,
  advice_variant_set_ref TEXT NOT NULL,
  clinical_content_approval_record_ref TEXT NOT NULL,
  content_review_schedule_ref TEXT NOT NULL,
  route_intent_binding_ref TEXT NOT NULL,
  command_action_ref TEXT NOT NULL,
  command_settlement_ref TEXT NOT NULL,
  release_approval_freeze_ref TEXT,
  channel_release_freeze_ref TEXT,
  surface_route_contract_ref TEXT NOT NULL,
  surface_publication_ref TEXT NOT NULL,
  runtime_publication_bundle_ref TEXT NOT NULL,
  dependency_set_ref TEXT,
  clinical_meaning_state TEXT NOT NULL,
  operational_follow_up_scope TEXT NOT NULL,
  reopen_state TEXT NOT NULL,
  render_state TEXT NOT NULL,
  trust_state TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  patient_timeline_ref TEXT,
  communication_template_ref TEXT,
  control_status_snapshot_ref TEXT,
  artifact_presentation_contract_ref TEXT NOT NULL,
  outbound_navigation_grant_policy_ref TEXT NOT NULL,
  transition_envelope_ref TEXT NOT NULL,
  recovery_disposition_ref TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  placeholder_contract_ref TEXT NOT NULL,
  recovery_route_ref TEXT NOT NULL,
  rendered_content_blocks_ref TEXT NOT NULL,
  variant_fallback_path_refs_json TEXT NOT NULL,
  linked_artifact_contract_refs_json TEXT NOT NULL,
  supersedes_advice_render_settlement_ref TEXT,
  settled_at TEXT NOT NULL,
  render_revision INTEGER NOT NULL,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS phase3_ccar_bundle_idx
  ON phase3_clinical_content_approval_records (advice_bundle_version_ref, approved_at);

CREATE INDEX IF NOT EXISTS phase3_crs_bundle_idx
  ON phase3_content_review_schedules (advice_bundle_version_ref, next_review_due_at);

CREATE INDEX IF NOT EXISTS phase3_abv_pathway_idx
  ON phase3_advice_bundle_versions (pathway_ref, effective_from);

CREATE INDEX IF NOT EXISTS phase3_avs_bundle_idx
  ON phase3_advice_variant_sets (advice_bundle_version_ref, channel_ref, locale_ref);

CREATE INDEX IF NOT EXISTS phase3_ars_task_idx
  ON phase3_advice_render_settlements (task_id, settled_at);
