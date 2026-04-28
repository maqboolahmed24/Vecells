import fs from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION_PATH =
  "/Users/test/Code/V/services/command-api/migrations/143_phase5_hub_case_kernel.sql";
const FIXTURE_CATALOG_PATH =
  "/Users/test/Code/V/data/analysis/315_hub_lineage_migration_fixture_catalog.csv";

describe("315 hub case migration catalog", () => {
  it("publishes the persisted request/case/journal tables and fixture coverage", () => {
    const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
    const csv = fs.readFileSync(FIXTURE_CATALOG_PATH, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_network_booking_requests");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_coordination_cases");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_case_transition_journal");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_event_journal");
    expect(sql).toContain("lineage and command-settlement");

    const rows = csv.trim().split(/\r?\n/);
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(csv).toContain("callback_reentry");
    expect(csv).toContain("supervisor_return");
    expect(csv).toContain("services/command-api/migrations/143_phase5_hub_case_kernel.sql");
  });
});

