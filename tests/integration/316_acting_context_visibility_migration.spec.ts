import fs from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION_PATH =
  "/Users/test/Code/V/services/command-api/migrations/144_phase5_staff_identity_acting_context_visibility.sql";
const DRIFT_CASES_PATH = "/Users/test/Code/V/data/analysis/316_scope_drift_cases.csv";
const FIELD_MATRIX_PATH = "/Users/test/Code/V/data/analysis/316_visibility_tier_field_matrix.csv";

describe("316 acting context visibility migration", () => {
  it("publishes the durable scope, visibility, and audit tables plus analysis catalogs", () => {
    const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
    const driftCases = fs.readFileSync(DRIFT_CASES_PATH, "utf8");
    const fieldMatrix = fs.readFileSync(FIELD_MATRIX_PATH, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_staff_identity_contexts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_acting_contexts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_acting_scope_tuples");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_cross_org_visibility_envelopes");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_scope_authority_audit_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_break_glass_audit_records");
    expect(sql).toContain("Phase 5 scope and visibility authority");

    expect(driftCases).toContain("organisation_switch");
    expect(driftCases).toContain("tenant_scope_change");
    expect(driftCases).toContain("visibility_contract_drift");
    expect(fieldMatrix).toContain("origin_practice_visibility");
    expect(fieldMatrix).toContain("hub_desk_visibility");
    expect(fieldMatrix).toContain("servicing_site_visibility");
  });
});
