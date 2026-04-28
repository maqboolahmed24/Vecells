import fs from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION_PATH =
  "/Users/test/Code/V/services/command-api/migrations/149_phase5_hub_commit_engine.sql";
const SPLIT_BRAIN_CASES_PATH =
  "/Users/test/Code/V/data/analysis/321_commit_race_and_split_brain_cases.csv";
const IMPORT_CORRELATION_PATH =
  "/Users/test/Code/V/data/analysis/321_imported_confirmation_correlation_examples.json";

describe("321 hub commit migration and artifacts", () => {
  it("publishes the persisted commit, gate, appointment, reconciliation, and mirror surfaces", () => {
    const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
    const splitBrainCases = fs.readFileSync(SPLIT_BRAIN_CASES_PATH, "utf8");
    const importCorrelation = fs.readFileSync(IMPORT_CORRELATION_PATH, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_action_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_commit_attempts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_booking_evidence_bundles");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_appointment_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_commit_settlements");
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS phase5_hub_continuity_evidence_projections",
    );
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS phase5_hub_commit_reconciliation_records",
    );
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_supplier_mirror_states");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_supplier_drift_hooks");
    expect(sql).toContain("148_phase5_alternative_offer_engine.sql");

    const splitBrainRows = splitBrainCases.trim().split(/\r?\n/);
    expect(splitBrainRows.length).toBeGreaterThanOrEqual(6);
    expect(splitBrainCases).toContain("race_321_001");
    expect(splitBrainCases).toContain("split_brain_321_003");
    expect(splitBrainCases).toContain(MIGRATION_PATH);

    expect(importCorrelation).toContain("\"exampleId\": \"import_corr_321_001\"");
    expect(importCorrelation).toContain("\"exampleId\": \"import_corr_321_005\"");
    expect(importCorrelation).toContain("\"expectedOutcome\": \"booked_pending_ack\"");
    expect(importCorrelation).toContain("\"expectedOutcome\": \"imported_disputed\"");
  });
});
