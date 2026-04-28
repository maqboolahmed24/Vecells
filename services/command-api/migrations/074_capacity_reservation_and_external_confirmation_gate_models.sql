BEGIN;

CREATE TABLE IF NOT EXISTS capacity_reservations (
  reservation_id TEXT PRIMARY KEY,
  capacity_identity_ref TEXT NOT NULL,
  canonical_reservation_key TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  holder_ref TEXT NOT NULL,
  state TEXT NOT NULL,
  commit_mode TEXT NOT NULL,
  reservation_version INTEGER NOT NULL,
  active_fencing_token TEXT NOT NULL,
  truth_basis_hash TEXT NOT NULL,
  supplier_observed_at TEXT NOT NULL,
  revalidated_at TEXT NULL,
  expires_at TEXT NULL,
  confirmed_at TEXT NULL,
  released_at TEXT NULL,
  superseded_by_reservation_ref TEXT NULL,
  terminal_reason_code TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'CapacityReservation',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (superseded_by_reservation_ref) REFERENCES capacity_reservations(reservation_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_capacity_reservations_key_version
  ON capacity_reservations(canonical_reservation_key, reservation_version);

CREATE INDEX IF NOT EXISTS idx_capacity_reservations_truth_basis
  ON capacity_reservations(truth_basis_hash);

CREATE TABLE IF NOT EXISTS reservation_truth_projections (
  reservation_truth_projection_id TEXT PRIMARY KEY,
  capacity_reservation_ref TEXT NOT NULL,
  canonical_reservation_key TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_object_ref TEXT NOT NULL,
  selected_anchor_ref TEXT NOT NULL,
  truth_state TEXT NOT NULL,
  display_exclusivity_state TEXT NOT NULL,
  countdown_mode TEXT NOT NULL,
  exclusive_until_at TEXT NULL,
  reservation_version_ref TEXT NOT NULL,
  truth_basis_hash TEXT NOT NULL,
  projection_freshness_envelope_ref TEXT NOT NULL,
  reason_refs_json TEXT NOT NULL DEFAULT '[]',
  generated_at TEXT NOT NULL,
  projection_revision INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'ReservationTruthProjection',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capacity_reservation_ref) REFERENCES capacity_reservations(reservation_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_truth_projection_revision
  ON reservation_truth_projections(capacity_reservation_ref, projection_revision);

CREATE INDEX IF NOT EXISTS idx_reservation_truth_projection_key
  ON reservation_truth_projections(canonical_reservation_key, generated_at);

CREATE TABLE IF NOT EXISTS external_confirmation_gates (
  gate_id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  domain_object_ref TEXT NOT NULL,
  transport_mode TEXT NOT NULL,
  assurance_level TEXT NOT NULL,
  evidence_model_version_ref TEXT NOT NULL,
  required_hard_match_refs_json TEXT NOT NULL DEFAULT '[]',
  positive_evidence_refs_json TEXT NOT NULL DEFAULT '[]',
  negative_evidence_refs_json TEXT NOT NULL DEFAULT '[]',
  proof_refs_json TEXT NOT NULL DEFAULT '[]',
  confirmation_deadline_at TEXT NOT NULL,
  prior_probability REAL NOT NULL,
  posterior_log_odds REAL NOT NULL,
  confirmation_confidence REAL NOT NULL,
  competing_gate_margin REAL NOT NULL,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  gate_revision INTEGER NOT NULL,
  threshold_policy_ref TEXT NOT NULL,
  tau_hold REAL NOT NULL,
  tau_confirm REAL NOT NULL,
  delta_confirm REAL NOT NULL,
  source_family_refs_json TEXT NOT NULL DEFAULT '[]',
  satisfied_hard_match_refs_json TEXT NOT NULL DEFAULT '[]',
  failed_hard_match_refs_json TEXT NOT NULL DEFAULT '[]',
  contradictory_evidence_refs_json TEXT NOT NULL DEFAULT '[]',
  manual_override_requested INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL DEFAULT 'ExternalConfirmationGate',
  persistence_schema_version INTEGER NOT NULL DEFAULT 1,
  persisted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (episode_id) REFERENCES episodes(episode_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_external_confirmation_gate_revision
  ON external_confirmation_gates(gate_id, gate_revision);

CREATE INDEX IF NOT EXISTS idx_external_confirmation_gate_domain_object
  ON external_confirmation_gates(domain, domain_object_ref, state);

COMMIT;
