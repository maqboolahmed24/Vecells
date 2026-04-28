-- 129_phase3_self_care_outcome_analytics_and_expectation_templates.sql
-- Phase 3 self-care outcome analytics, patient expectation templates, and watch-window linkage.

CREATE TABLE IF NOT EXISTS phase3_patient_expectation_templates (
  patient_expectation_template_id TEXT PRIMARY KEY,
  patient_expectation_template_ref TEXT NOT NULL UNIQUE,
  expectation_class TEXT NOT NULL,
  allowed_consequence_classes_json TEXT NOT NULL,
  advice_pathway_ref TEXT,
  admin_resolution_subtype_ref TEXT,
  binding_rule_ref TEXT NOT NULL,
  active_version_ref TEXT,
  supported_channel_refs_json TEXT NOT NULL,
  supported_locale_refs_json TEXT NOT NULL,
  template_state TEXT NOT NULL,
  last_published_at TEXT,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_expectation_template_versions (
  patient_expectation_template_version_id TEXT PRIMARY KEY,
  patient_expectation_template_ref TEXT NOT NULL,
  template_version_number INTEGER NOT NULL,
  version_digest TEXT NOT NULL,
  template_state TEXT NOT NULL,
  authoring_provenance_ref TEXT NOT NULL,
  approval_provenance_ref TEXT,
  policy_bundle_ref TEXT NOT NULL,
  coverage_channel_refs_json TEXT NOT NULL,
  coverage_locale_refs_json TEXT NOT NULL,
  coverage_reading_level_refs_json TEXT NOT NULL,
  coverage_accessibility_variant_refs_json TEXT NOT NULL,
  default_variant_ref TEXT NOT NULL,
  summary_safe_variant_ref TEXT NOT NULL,
  placeholder_safe_variant_ref TEXT NOT NULL,
  supersedes_patient_expectation_template_version_ref TEXT,
  published_at TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_patient_expectation_template_variants (
  patient_expectation_template_variant_id TEXT PRIMARY KEY,
  patient_expectation_template_version_ref TEXT NOT NULL,
  patient_expectation_template_ref TEXT NOT NULL,
  delivery_mode TEXT NOT NULL,
  channel_ref TEXT NOT NULL,
  locale_ref TEXT NOT NULL,
  reading_level_ref TEXT,
  accessibility_variant_refs_json TEXT NOT NULL,
  audience_tier_refs_json TEXT NOT NULL,
  release_state_refs_json TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  render_input_ref TEXT NOT NULL,
  headline_text TEXT NOT NULL,
  body_text TEXT NOT NULL,
  next_step_text TEXT NOT NULL,
  safety_net_text TEXT NOT NULL,
  placeholder_text TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_advice_follow_up_watch_windows (
  advice_follow_up_watch_window_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  consequence_class TEXT NOT NULL,
  admin_resolution_subtype_ref TEXT,
  advice_bundle_version_ref TEXT NOT NULL,
  watch_start_at TEXT NOT NULL,
  watch_until TEXT NOT NULL,
  recontact_threshold_ref TEXT NOT NULL,
  escalation_threshold_ref TEXT NOT NULL,
  rollback_review_state TEXT NOT NULL,
  watch_revision INTEGER NOT NULL,
  assurance_slice_trust_refs_json TEXT NOT NULL,
  watch_state TEXT NOT NULL,
  latest_review_outcome_ref TEXT,
  linked_analytics_refs_json TEXT NOT NULL,
  watch_digest TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phase3_advice_usage_analytics_records (
  advice_usage_analytics_record_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  request_ref TEXT NOT NULL,
  boundary_decision_ref TEXT NOT NULL,
  boundary_tuple_hash TEXT NOT NULL,
  decision_epoch_ref TEXT NOT NULL,
  consequence_class TEXT NOT NULL,
  event_class TEXT NOT NULL,
  advice_bundle_version_ref TEXT,
  advice_variant_set_ref TEXT,
  patient_expectation_template_ref TEXT NOT NULL,
  patient_expectation_template_version_ref TEXT NOT NULL,
  patient_expectation_template_variant_ref TEXT NOT NULL,
  admin_resolution_subtype_ref TEXT,
  admin_resolution_case_ref TEXT,
  completion_artifact_ref TEXT,
  watch_window_ref TEXT,
  watch_window_timing TEXT NOT NULL,
  channel_ref TEXT NOT NULL,
  locale_ref TEXT NOT NULL,
  reading_level_ref TEXT,
  accessibility_variant_refs_json TEXT NOT NULL,
  audience_tier_ref TEXT NOT NULL,
  release_state TEXT NOT NULL,
  visibility_tier TEXT NOT NULL,
  summary_safety_tier TEXT NOT NULL,
  observational_authority_state TEXT NOT NULL,
  reason_code_refs_json TEXT NOT NULL,
  event_occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  analytics_digest TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phase3_patient_expectation_templates_state_ref
  ON phase3_patient_expectation_templates (template_state, patient_expectation_template_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_patient_expectation_template_versions_template_state
  ON phase3_patient_expectation_template_versions (patient_expectation_template_ref, template_state);

CREATE INDEX IF NOT EXISTS idx_phase3_patient_expectation_template_variants_lookup
  ON phase3_patient_expectation_template_variants (
    patient_expectation_template_ref,
    channel_ref,
    locale_ref,
    delivery_mode
  );

CREATE INDEX IF NOT EXISTS idx_phase3_advice_follow_up_watch_windows_task_bundle
  ON phase3_advice_follow_up_watch_windows (task_id, advice_bundle_version_ref, watch_state);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_follow_up_watch_windows_tuple_epoch
  ON phase3_advice_follow_up_watch_windows (boundary_tuple_hash, decision_epoch_ref);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_usage_analytics_records_task_event
  ON phase3_advice_usage_analytics_records (task_id, event_class, recorded_at);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_usage_analytics_records_watch_window
  ON phase3_advice_usage_analytics_records (watch_window_ref, event_occurred_at);

CREATE INDEX IF NOT EXISTS idx_phase3_advice_usage_analytics_records_boundary_bundle
  ON phase3_advice_usage_analytics_records (
    request_ref,
    boundary_tuple_hash,
    decision_epoch_ref,
    advice_bundle_version_ref,
    admin_resolution_subtype_ref,
    completion_artifact_ref
  );

CREATE INDEX IF NOT EXISTS idx_phase3_advice_usage_analytics_records_locale_channel_template
  ON phase3_advice_usage_analytics_records (
    locale_ref,
    channel_ref,
    patient_expectation_template_version_ref
  );
