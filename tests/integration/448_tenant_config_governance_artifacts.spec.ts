import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
  createPhase9TenantConfigGovernanceFixture,
  type Phase9TenantConfigGovernanceFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("448 Phase 9 tenant config governance artifacts", () => {
  it("publishes tenant config governance contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      canonicalAdapterPosture: {
        standardsDependencyWatchlist: string;
        schemaConflictGapRequired: boolean;
      };
      deterministicReplay: { replayHash: string };
      promotionAuthority: { readyPromotionState: string };
    }>("data/contracts/448_phase9_tenant_config_governance_contract.json");
    const fixture = readJson<Phase9TenantConfigGovernanceFixture>(
      "data/fixtures/448_phase9_tenant_config_governance_fixtures.json",
    );
    const recomputed = createPhase9TenantConfigGovernanceFixture();

    expect(contract.schemaVersion).toBe(PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "TenantBaselineProfile",
        "ConfigVersion",
        "PolicyPackVersion",
        "CompiledPolicyBundle",
        "ConfigCompilationRecord",
        "ConfigSimulationEnvelope",
        "StandardsDependencyWatchlist",
        "LegacyReferenceFinding",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining([
        "createTenantBaselineProfile",
        "createConfigVersion",
        "runDependencyHygieneScan",
        "runLegacyReferenceScan",
        "generateStandardsDependencyWatchlist",
        "assessPromotionReadiness",
      ]),
    );
    expect(contract.canonicalAdapterPosture.standardsDependencyWatchlist).toBe(
      "platform-admin-canonical",
    );
    expect(contract.canonicalAdapterPosture.schemaConflictGapRequired).toBe(true);
    expect(contract.promotionAuthority.readyPromotionState).toBe("pass");
    expect(fixture.replayHash).toBe(recomputed.replayHash);
    expect(contract.deterministicReplay.replayHash).toBe(fixture.replayHash);
  });

  it("stores baseline diff matrix watchlist register and runbook notes", () => {
    const summary = readText("data/analysis/448_phase9_tenant_config_governance_summary.md");
    const notes = readText("data/analysis/448_algorithm_alignment_notes.md");
    const diffMatrix = readText("data/analysis/448_tenant_baseline_diff_matrix.csv");
    const register = readText("data/analysis/448_dependency_watchlist_register.csv");

    expect(summary).toContain("Tenant baselines preserve");
    expect(summary).toContain("Promotion readiness fails closed");
    expect(notes).toContain("canonical compiled policy bundle validation");
    expect(notes).toContain("Promotion readiness requires");
    expect(diffMatrix).toContain("standardsVersionRefs");
    expect(diffMatrix).toContain("policyPackRefs");
    expect(register).toContain("watchlistRef,compileGate,promotionGate");
    expect(register).toContain("blocked");
  });

  it("publishes schema-conflict gap for narrower identity-access watchlist record", () => {
    const gap = readJson<{
      taskId: string;
      missingSurface: string;
      expectedOwnerTask: string;
      sourceBlueprintBlock: string;
      temporaryFallback: string;
      canonicalFieldsPreserved: string[];
    }>("data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_448_CONFIG_SCHEMA_CONFLICT.json");

    expect(gap.taskId).toBe("448");
    expect(gap.missingSurface).toContain("StandardsDependencyWatchlistRecord");
    expect(gap.expectedOwnerTask).toBe("phase-0/platform-admin canonical config contracts");
    expect(gap.sourceBlueprintBlock).toBe(
      "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
    );
    expect(gap.temporaryFallback).toContain("platform-admin canonical shape");
    expect(gap.canonicalFieldsPreserved).toEqual(
      expect.arrayContaining([
        "standardsBaselineMapRef",
        "dependencyLifecycleRecordRefs",
        "legacyReferenceFindingRefs",
        "policyCompatibilityAlertRefs",
        "standardsExceptionRecordRefs",
        "watchlistHash",
      ]),
    );
  });
});
