CREATE TABLE IF NOT EXISTS governance_review_packages (
  governance_review_package_id TEXT PRIMARY KEY,
  package_state TEXT NOT NULL,
  review_package_hash TEXT NOT NULL,
  scope_tuple_hash TEXT NOT NULL,
  baseline_tuple_hash TEXT NOT NULL,
  compilation_tuple_hash TEXT NOT NULL,
  approval_tuple_hash TEXT NOT NULL,
  standards_watchlist_hash TEXT NOT NULL,
  assembled_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS standards_dependency_watchlists (
  standards_dependency_watchlist_id TEXT PRIMARY KEY,
  watchlist_state TEXT NOT NULL,
  compile_gate_state TEXT NOT NULL,
  promotion_gate_state TEXT NOT NULL,
  watchlist_hash TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS release_approval_freezes (
  release_approval_freeze_id TEXT PRIMARY KEY,
  release_candidate_ref TEXT NOT NULL,
  governance_review_package_ref TEXT NOT NULL,
  standards_dependency_watchlist_ref TEXT NOT NULL,
  freeze_state TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  approval_tuple_hash TEXT NOT NULL,
  review_package_hash TEXT NOT NULL,
  standards_watchlist_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS channel_release_freeze_records (
  channel_freeze_id TEXT PRIMARY KEY,
  channel_family TEXT NOT NULL,
  release_approval_freeze_ref TEXT NOT NULL,
  channel_state TEXT NOT NULL,
  effective_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assurance_slice_trust_records (
  slice_trust_id TEXT PRIMARY KEY,
  slice_namespace TEXT NOT NULL,
  producer_scope_ref TEXT NOT NULL,
  trust_state TEXT NOT NULL,
  completeness_state TEXT NOT NULL,
  trust_lower_bound REAL NOT NULL,
  hard_block_state INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS release_trust_freeze_verdicts (
  release_trust_freeze_verdict_id TEXT PRIMARY KEY,
  audience_surface TEXT NOT NULL,
  route_family_ref TEXT NOT NULL,
  release_approval_freeze_ref TEXT NOT NULL,
  surface_authority_state TEXT NOT NULL,
  calm_truth_state TEXT NOT NULL,
  mutation_authority_state TEXT NOT NULL,
  provenance_consumption_state TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL
);
