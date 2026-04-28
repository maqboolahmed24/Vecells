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

describe("469 legacy reference and exception expiry", () => {
  it("exposes legacy reference blast radius across routes, bundles, and simulations", () => {
    const fixture = loadFixture();
    const legacy = fixture.tenantCases.legacyAndExceptions;
    expect(legacy.legacyReferenceFindings.length).toBeGreaterThanOrEqual(2);
    for (const finding of legacy.legacyReferenceFindings) {
      expect(finding.findingState).toBe("open");
      expect(finding.affectedRouteRefs.length).toBeGreaterThan(0);
      expect(finding.affectedRouteFamilyRefs.length).toBeGreaterThan(0);
      expect(finding.affectedBundleRefs.length).toBeGreaterThan(0);
      expect(finding.affectedSimulationRefs.length).toBeGreaterThan(0);
      expect(finding.watchlistHash).toMatch(/^watchlist-hash:/);
    }
    expect(legacy.resolvedLegacyFinding.findingState).toBe("resolved");
  });

  it("enforces policy compatibility alert class and affected surface coverage", () => {
    const fixture = loadFixture();
    const alert = fixture.tenantCases.legacyAndExceptions.policyCompatibilityAlert;
    expect(alert.compatibilityClass).toBe("compile_blocking");
    expect(alert.alertState).toBe("open");
    expect(alert.evidenceRefs.length).toBeGreaterThan(0);
    expect(alert.affectedPolicyDomains).toEqual(
      expect.arrayContaining(["visibility", "minimum-necessary"]),
    );
    expect(alert.affectedRouteFamilyRefs).toContain("route-family:patient-records");
    expect(alert.affectedSimulationRefs).toContain("simulation:patient-record-preview");
  });

  it("reopens linked findings when standards exceptions expire", () => {
    const fixture = loadFixture();
    const legacy = fixture.tenantCases.legacyAndExceptions;
    expect(Date.parse(legacy.expiredException.expiresAt)).toBeLessThan(
      Date.parse(fixture.generatedAt),
    );
    expect(legacy.expiredException.requiredReopenFindingRefs.length).toBeGreaterThan(0);
    expect(legacy.reopenedFindingRefs).toEqual(
      expect.arrayContaining(legacy.expiredException.requiredReopenFindingRefs),
    );
    expect(legacy.exceptionExpiryReopenedFindings).toBe(true);
    expect(fixture.tenantCases.standardsWatchlist.blocked.standardsExceptionRecordRefs).toContain(
      legacy.expiredException.standardsExceptionRecordId,
    );
  });

  it("closes exception permanence and config shortcut gaps in evidence", () => {
    const evidence = readJson<any>(
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
    );
    expect(evidence.coverage.legacyReferenceBlastRadius).toBe(true);
    expect(evidence.coverage.policyCompatibilityAlertEnforcement).toBe(true);
    expect(evidence.coverage.standardsExceptionExpiryReopensFindings).toBe(true);
    expect(evidence.coverage.approvalGateBypassPrevention).toBe(true);
    expect(evidence.gapClosures.exceptionPermanenceGap).toBe(true);
    expect(evidence.gapClosures.configShortcutGap).toBe(true);
  });
});
