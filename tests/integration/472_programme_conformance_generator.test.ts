import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { writeProgrammeConformanceArtifacts } from "../../tools/conformance/generate_472_programme_conformance_scorecard";

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

const requiredFiles = [
  "tools/conformance/generate_472_programme_conformance_scorecard.ts",
  "data/conformance/472_cross_phase_conformance_scorecard.json",
  "data/conformance/472_phase_conformance_rows.json",
  "data/conformance/472_cross_phase_control_family_rows.json",
  "data/conformance/472_deferred_scope_and_phase7_dependency_note.json",
  "data/conformance/472_summary_alignment_corrections.json",
  "docs/programme/472_programme_merge_conformance_report.md",
  "docs/programme/472_bau_handoff_summary.md",
  "docs/architecture/472_cross_phase_conformance_topology.mmd",
  "data/contracts/472_programme_conformance_scorecard.schema.json",
  "data/analysis/472_algorithm_alignment_notes.md",
  "data/analysis/472_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_472_PROGRAMME_SCORECARD_GENERATOR.json",
];

describe("task 472 programme conformance generator", () => {
  beforeAll(() => {
    writeProgrammeConformanceArtifacts();
  });

  it("writes the required programme scorecard artifacts", () => {
    for (const requiredFile of requiredFiles) {
      expect(fs.existsSync(path.join(root, requiredFile)), requiredFile).toBe(true);
    }

    const scorecard = readJson<any>("data/conformance/472_cross_phase_conformance_scorecard.json");
    expect(scorecard.schemaVersion).toBe("472.programme.conformance-scorecard.v1");
    expect(scorecard.scorecardState).toBe("exact");
    expect(scorecard.allMandatoryRowsExact).toBe(true);
    expect(scorecard.blockerCount).toBe(0);
    expect(scorecard.scorecardHash).toMatch(/^[a-f0-9]{64}$/);
    expect(scorecard.phase9ExitGateDecisionRef).toBe(
      "data/evidence/471_phase9_exit_gate_decision.json",
    );
    expect(scorecard.bauHandoffState).toBe("ready_for_bau_handoff");
  });

  it("includes every phase and mandatory cross-cutting control family", () => {
    const phaseRows = readJson<any>("data/conformance/472_phase_conformance_rows.json").rows;
    const controlRows = readJson<any>(
      "data/conformance/472_cross_phase_control_family_rows.json",
    ).rows;

    expect(phaseRows.map((row: any) => row.rowCode)).toEqual([
      "phase_0",
      "phase_1",
      "phase_2",
      "phase_3",
      "phase_4",
      "phase_5",
      "phase_6",
      "phase_7",
      "phase_8",
      "phase_9",
    ]);
    expect(controlRows.length).toBeGreaterThanOrEqual(14);

    for (const family of [
      "patient_shell_continuity",
      "staff_workspace_continuity",
      "operations_console_continuity",
      "governance_admin_config_access",
      "audit_break_glass_support_replay",
      "assurance_pack_evidence_graph",
      "records_lifecycle_retention",
      "resilience_restore_failover_chaos",
      "incident_near_miss_reportability_capa",
      "tenant_config_standards_dependency_hygiene",
      "release_runtime_publication_recovery_disposition",
      "accessibility_content_design_contract",
      "artifact_presentation_outbound_navigation_grant",
      "ui_telemetry_disclosure_fence",
    ]) {
      expect(
        controlRows.some((row: any) => row.rowCode === family),
        family,
      ).toBe(true);
    }

    for (const row of [...phaseRows, ...controlRows]) {
      expect(row.rowHash).toMatch(/^[a-f0-9]{64}$/);
      expect(row.sourceRefs.length).toBeGreaterThan(0);
      expect(row.canonicalBlueprintRefs.length).toBeGreaterThan(0);
      expect(row.requiredProofRefs.length).toBeGreaterThan(0);
    }
  });
});
