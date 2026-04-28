import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPhase9FullRegressionAndDefensiveSecuritySuite,
  writePhase9FullRegressionAndDefensiveSecurityArtifacts,
} from "../../tools/testing/run_470_full_regression_and_defensive_security";

const root = path.resolve(__dirname, "..", "..");

function loadFixture() {
  const fixturePath = path.join(root, "tests/fixtures/470_cross_phase_synthetic_programme_cases.json");
  if (!fs.existsSync(fixturePath)) {
    writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReturnType<
    typeof buildPhase9FullRegressionAndDefensiveSecuritySuite
  >["fixture"];
}

describe("470 patient, staff, ops, and governance journeys", () => {
  it("keeps the mandatory patient and staff workflow terms in first-class regression cases", () => {
    const fixture = loadFixture();
    const serialized = JSON.stringify(fixture.journeyCases);
    for (const requiredTerm of [
      "patient intake",
      "receipt",
      "status",
      "manage recovery",
      "red flag diversion",
      "safety epoch",
      "identity grant",
      "secure link",
      "access renewal",
      "duplicate review",
      "same episode review",
      "queue rank",
      "task review",
      "more-info",
      "endpoint selection",
      "booking handoff",
      "next task",
      "local booking",
      "hub coordination",
      "external confirmation gates",
      "smart waitlist",
      "offer",
      "hold",
      "confirm",
      "expire",
      "pharmacy referral",
      "bounce-back",
      "outbound comms",
      "reachability repair",
      "assistive review",
      "final artifact",
      "override",
      "downgrade",
    ]) {
      expect(serialized, requiredTerm).toContain(requiredTerm);
    }
  });

  it("covers every required operations, records, tenant, access, and conformance surface", () => {
    const fixture = loadFixture();
    expect(fixture.surfaceCases.map((surface) => surface.surfaceId)).toEqual(
      expect.arrayContaining([
        "operations-overview",
        "queue-heatmap",
        "investigation",
        "intervention-allocation",
        "audit-explorer",
        "assurance-pack",
        "resilience-board",
        "incident-desk",
        "records-governance",
        "tenant-governance",
        "access-studio",
        "compliance-ledger",
        "conformance-scorecard",
      ]),
    );

    for (const surface of fixture.surfaceCases) {
      expect(surface.routeIntentBinding).toBe("runtime_verified");
      expect(surface.sameShellRecovery).toBe("required");
      expect(surface.routeParamsCarryOnlyOpaqueRefs).toBe(true);
      expect(surface.accessibleNameRoleValueChecks).toBe(true);
      expect(surface.telemetryRedactionFence).toBe("metadata_only");
      expect(surface.sourceRef).toMatch(/^(data\/contracts|data\/evidence)\//);
    }
  });

  it("makes the deferred NHS App and channel scope explicit instead of treating it as a hidden pass", () => {
    const fixture = loadFixture();
    expect(fixture.nhsAppDeferredChannelScope.state).toBe("deferred_scope_bounded");
    expect(fixture.nhsAppDeferredChannelScope.gapClosed).toBe(true);
    expect(fixture.nhsAppDeferredChannelScope.currentRuntimeDependenciesCovered).toEqual(
      expect.arrayContaining([
        expect.stringContaining("task 461"),
        expect.stringContaining("task 462"),
        expect.stringContaining("task 463"),
        expect.stringContaining("task 464"),
      ]),
    );
    expect(fixture.nhsAppDeferredChannelScope.deferredOutOfScope).toContain(
      "real NHS App integration traffic",
    );
  });
});
