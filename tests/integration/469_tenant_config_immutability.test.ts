import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPhase9IncidentTenantGovernanceDependencyHygieneSuite,
  writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts,
} from "../../tools/test/run_phase9_incident_tenant_governance_dependency_hygiene";

const root = path.resolve(__dirname, "..", "..");

function loadFixture() {
  const fixturePath = path.join(root, "tests/fixtures/469_incident_tenant_hygiene_cases.json");
  if (!fs.existsSync(fixturePath)) {
    writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts();
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReturnType<
    typeof buildPhase9IncidentTenantGovernanceDependencyHygieneSuite
  >["fixture"];
}

describe("469 tenant config immutability", () => {
  it("preserves immutable config versions and parent lineage", () => {
    const fixture = loadFixture();
    const versioning = fixture.tenantCases.configVersioning;
    expect(versioning.root.parentVersionRef).toBe("config-version:genesis");
    expect(versioning.child.parentVersionRef).toBe(versioning.root.configVersionId);
    expect(versioning.child.changeType).toBe("promote");
    expect(versioning.child.attestationRef).toMatch(/^attestation:/);
    expect(versioning.parentChainValid).toBe(true);
    expect(versioning.rootGenesisValid).toBe(true);
    expect(versioning.immutableHashChanged).toBe(true);
    expect(versioning.chainHashChanged).toBe(true);
  });

  it("captures tenant baseline matrix drift and policy pack compatibility windows", () => {
    const fixture = loadFixture();
    const baseline = fixture.tenantCases.baselineDrift;
    expect(baseline.liveBaseline.approvalState).toBe("approved");
    expect(baseline.candidateBaseline.approvalState).toBe("draft");
    expect(baseline.diffRows.length).toBeGreaterThanOrEqual(4);
    expect(baseline.diffRows.map((row) => row.fieldName)).toEqual(
      expect.arrayContaining([
        "enabledCapabilities",
        "integrationRefs",
        "policyPackRefs",
        "standardsVersionRefs",
      ]),
    );
    expect(baseline.matrixRows.length).toBeGreaterThanOrEqual(3);

    const policyPacks = fixture.tenantCases.policyPacks;
    expect(policyPacks.allRequiredFamiliesCovered).toBe(true);
    expect(policyPacks.allEffectiveWindowsValid).toBe(true);
    expect(policyPacks.versions.map((pack) => pack.packType).sort()).toEqual(
      [...fixture.requiredPolicyPackTypes].sort(),
    );
    expect(
      policyPacks.versions.every((pack) => pack.compatibilityRefs.length > 0 && pack.packHash),
    ).toBe(true);
  });

  it("blocks unsafe compiled policy bundles and stale operational decisions", () => {
    const fixture = loadFixture();
    const compile = fixture.tenantCases.compileGate;
    expect(compile.validCompileVerdict.compileGateState).toBe("pass");
    expect(compile.validBundle.compatibilityState).toBe("valid");
    expect(compile.visibilityBlockedVerdict.compileGateState).toBe("blocked");
    expect(compile.visibilityBlockedVerdict.blockerRefs.length).toBeGreaterThan(0);
    expect(compile.stalePharmacyDispatchVerdict.compileGateState).toBe("blocked");
    expect(compile.stalePharmacyDispatchVerdict.blockerRefs.join("|")).toMatch(
      /provider|consent|dispatch/,
    );
    expect(compile.staleAssistiveVerdict.compileGateState).toBe("blocked");
    expect(compile.staleAssistiveVerdict.blockerRefs.join("|")).toMatch(/assistive/);
  });

  it("requires reference simulation readiness and prevents approval shortcuts", () => {
    const fixture = loadFixture();
    const compile = fixture.tenantCases.compileGate;
    expect(compile.compilationRecord.compileState).toBe("ready");
    expect(compile.compilationRecord.referenceScenarioSetRef).toMatch(/^reference-scenario-set:/);
    expect(compile.compilationRecord.surfaceSchemaSetRef).toMatch(/^surface-schema-set:/);
    expect(compile.simulationEnvelope.compileReadinessState).toBe("ready");
    expect(compile.simulationEnvelope.governanceReviewPackageRef).toMatch(
      /^governance-review-package:/,
    );

    const promotion = fixture.tenantCases.promotion;
    expect(promotion.ready.state).toBe("pass");
    expect(promotion.approvalBypass.state).toBe("invalidated");
    expect(promotion.approvalBypass.blockerRefs).toEqual(
      expect.arrayContaining(["approval:audit-missing", "approval:bundle-hash-mismatch"]),
    );
    expect(promotion.drift.state).toBe("invalidated");
    expect(promotion.drift.blockerRefs).toEqual(
      expect.arrayContaining(["standards-watchlist:approval-hash-drift"]),
    );
  });
});
