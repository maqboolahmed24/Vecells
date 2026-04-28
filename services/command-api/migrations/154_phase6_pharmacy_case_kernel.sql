BEGIN;

-- PharmacyCase depends on the existing foundation persistence for RequestLineage,
-- LineageCaseLink, RequestLifecycleLease, LineageFence, CommandActionRecord, and
-- CommandSettlementRecord. This migration adds the Phase 6 pharmacy bounded-context
-- tables only.

CREATE TABLE IF NOT EXISTS phase6_pharmacy_cases (
  pharmacy_case_id TEXT PRIMARY KEY,
  episode_ref_json TEXT NOT NULL,
  origin_request_id TEXT NOT NULL,
  request_lineage_ref_json TEXT NOT NULL,
  lineage_case_link_ref_json TEXT NOT NULL UNIQUE,
  origin_task_id TEXT NOT NULL,
  pharmacy_intent_id TEXT NOT NULL,
  source_decision_epoch_ref_json TEXT NOT NULL,
  source_decision_supersession_ref_json TEXT,
  patient_ref_json TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (
    service_type IN ('clinical_pathway_consultation', 'minor_illness_fallback')
  ),
  candidate_pathway TEXT CHECK (
    candidate_pathway IS NULL OR
    candidate_pathway IN (
      'uncomplicated_uti_female_16_64',
      'shingles_18_plus',
      'acute_otitis_media_1_17',
      'acute_sore_throat_5_plus',
      'acute_sinusitis_12_plus',
      'impetigo_1_plus',
      'infected_insect_bites_1_plus',
      'minor_illness_fallback'
    )
  ),
  eligibility_ref_json TEXT,
  choice_session_ref_json TEXT,
  selected_provider_ref_json TEXT,
  active_consent_ref_json TEXT,
  active_consent_checkpoint_ref_json TEXT,
  latest_consent_revocation_ref_json TEXT,
  active_dispatch_attempt_ref_json TEXT,
  correlation_ref_json TEXT,
  outcome_ref_json TEXT,
  bounce_back_ref_json TEXT,
  lease_ref_json TEXT NOT NULL,
  ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 0),
  stale_owner_recovery_ref_json TEXT,
  lineage_fence_ref_json TEXT NOT NULL,
  current_confirmation_gate_refs_json TEXT NOT NULL,
  current_closure_blocker_refs_json TEXT NOT NULL,
  active_reachability_dependency_refs_json TEXT NOT NULL,
  active_identity_repair_case_ref_json TEXT,
  identity_repair_branch_disposition_ref_json TEXT,
  identity_repair_release_settlement_ref_json TEXT,
  status TEXT NOT NULL CHECK (
    status IN (
      'candidate_received',
      'rules_evaluating',
      'ineligible_returned',
      'eligible_choice_pending',
      'provider_selected',
      'consent_pending',
      'package_ready',
      'dispatch_pending',
      'referred',
      'consultation_outcome_pending',
      'outcome_reconciliation_pending',
      'resolved_by_pharmacy',
      'unresolved_returned',
      'urgent_bounce_back',
      'no_contact_return_pending',
      'closed'
    )
  ),
  sla_target_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_cases_origin_tuple
  ON phase6_pharmacy_cases (
    origin_request_id,
    pharmacy_intent_id,
    source_decision_epoch_ref_json
  );

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_cases_lineage
  ON phase6_pharmacy_cases (tenant_id, status, origin_request_id);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_cases_request_lineage
  ON phase6_pharmacy_cases (request_lineage_ref_json, lineage_case_link_ref_json);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_stale_ownership_recoveries (
  stale_ownership_recovery_id TEXT PRIMARY KEY,
  pharmacy_case_ref_json TEXT NOT NULL,
  lease_ref_at_detection_json TEXT NOT NULL,
  lineage_fence_ref_at_detection_json TEXT NOT NULL,
  scoped_mutation_gate_ref TEXT NOT NULL,
  stale_ownership_epoch INTEGER NOT NULL CHECK (stale_ownership_epoch >= 0),
  failure_code TEXT NOT NULL,
  recovery_state TEXT NOT NULL CHECK (recovery_state IN ('pending', 'resolved')),
  first_detected_at TEXT NOT NULL,
  last_detected_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution_lease_ref_json TEXT,
  resolution_lineage_fence_ref_json TEXT,
  resolution_ownership_epoch INTEGER CHECK (
    resolution_ownership_epoch IS NULL OR resolution_ownership_epoch >= 0
  ),
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_phase6_pharmacy_stale_recovery_case
  ON phase6_pharmacy_stale_ownership_recoveries (
    pharmacy_case_ref_json,
    recovery_state,
    last_detected_at
  );

CREATE TABLE IF NOT EXISTS phase6_pharmacy_case_transition_journal (
  pharmacy_case_transition_journal_entry_id TEXT PRIMARY KEY,
  pharmacy_case_id TEXT NOT NULL REFERENCES phase6_pharmacy_cases (pharmacy_case_id),
  lineage_case_link_ref TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  next_status TEXT NOT NULL,
  transition_event TEXT NOT NULL,
  transition_outcome TEXT NOT NULL CHECK (transition_outcome IN ('applied', 'rejected')),
  failure_code TEXT,
  actor_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  lease_ref_at_decision TEXT,
  expected_ownership_epoch INTEGER,
  expected_lineage_fence_ref TEXT,
  scoped_mutation_gate_ref TEXT,
  transition_predicate_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  dependent_ref TEXT,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_transition_action
  ON phase6_pharmacy_case_transition_journal (pharmacy_case_id, command_action_record_ref);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_transition_version
  ON phase6_pharmacy_case_transition_journal (pharmacy_case_id, version);

CREATE TABLE IF NOT EXISTS phase6_pharmacy_case_event_journal (
  pharmacy_case_event_journal_entry_id TEXT PRIMARY KEY,
  aggregate_kind TEXT NOT NULL CHECK (aggregate_kind IN ('pharmacy_case')),
  aggregate_id TEXT NOT NULL REFERENCES phase6_pharmacy_cases (pharmacy_case_id),
  event_name TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  command_action_record_ref TEXT NOT NULL,
  command_settlement_record_ref TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phase6_pharmacy_event_version
  ON phase6_pharmacy_case_event_journal (aggregate_id, version);

COMMIT;
