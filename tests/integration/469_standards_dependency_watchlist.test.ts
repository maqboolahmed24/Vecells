import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPhase9IncidentTenantGovernanceDependencyHygieneSuite,
  writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts,
} from "../../tools/test/run_phase9_incident_tenant_governance_dependency_hygiene";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts();
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as T;
}

function loadFixture() {
  return readJson<ReturnType<typeof buildPhase9IncidentTenantGovernanceDependencyHygieneSuite>["fixture"]>(
    "tests/fixtures/469_incident_tenant_hygiene_cases.json",
  );
}

describe("469 standards dependency watchlist", () => {
  it("keeps standards baseline maps candidate-bound and hash stable across repeated scans", () => {
    const fixture = loadFixture();
    const watchlist = fixture.tenantCases.standardsWatchlist;
    expect(watchlist.baselineMap.baselineState).toBe("exact");
    expect(watchlist.baselineMap.candidateBundleHash).toBe(watchlist.blocked.candidateBundleHash);
    expect(watchlist.baselineMap.liveBundleHash).toBe(watchlist.blocked.liveBundleHash);
    expect(watchlist.baselineMap.affectedRouteFamilyRefs).toEqual(
      expect.arrayContaining(["route-family:governance-config", "route-family:patient-records"]),
    );
    expect(watchlist.hashParity).toBe(true);
    expect(watchlist.blocked.watchlistHash).toBe(watchlist.repeatedBlocked.watchlistHash);
    expect(watchlist.cleanHashDiffers).toBe(true);
    expect(watchlist.blocked.watchlistHash).not.toBe(watchlist.clean.watchlistHash);
  });

  it("blocks compile and promotion when dependency lifecycle findings remain unresolved", () => {
    const fixture = loadFixture();
    const watchlist = fixture.tenantCases.standardsWatchlist;
    expect(watchlist.blocked.watchlistState).toBe("blocked");
    expect(watchlist.blocked.compileGateState).toBe("blocked");
    expect(watchlist.blocked.promotionGateState).toBe("blocked");
    expect(watchlist.blocked.blockingFindingRefs.length).toBeGreaterThan(0);

    const hygiene = fixture.tenantCases.dependencyHygiene;
    expect(hygiene.registryEntries.some((entry) => entry.supportState === "end_of_life")).toBe(
      true,
    );
    expect(hygiene.everyBlockingDependencyHasOwnerAndRemediation).toBe(true);
    for (const record of hygiene.lifecycleRecords.filter(
      (row) => row.promotionImpact !== "none",
    )) {
      expect(record.ownerRef).toMatch(/^owner:/);
      expect(record.replacementRef).toMatch(/^replacement:/);
      expect(record.remediationDueAt).toMatch(/^2026-/);
      expect(record.affectedRouteFamilyRefs.length).toBeGreaterThan(0);
      expect(record.affectedSimulationRefs.length).toBeGreaterThan(0);
      expect(watchlist.blocked.dependencyLifecycleRecordRefs).toContain(
        record.dependencyLifecycleRecordId,
      );
    }
  });

  it("propagates watchlist drift into promotion blockers and evidence coverage", () => {
    const fixture = loadFixture();
    const evidence = readJson<any>(
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
    );
    expect(fixture.tenantCases.promotion.drift.state).toBe("invalidated");
    expect(fixture.tenantCases.promotion.drift.blockerRefs).toEqual(
      expect.arrayContaining([
        "standards-watchlist:approval-hash-drift",
        "standards-watchlist:blocked",
        "standards-watchlist:promotion-blocked",
      ]),
    );
    expect(evidence.coverage.standardsWatchlistHashParity).toBe(true);
    expect(evidence.coverage.dependencyLifecycleHygiene).toBe(true);
    expect(evidence.gapClosures.standardsDriftGap).toBe(true);
  });
});
