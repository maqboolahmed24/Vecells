import { describe, expect, it } from "vitest";
import {
  automationTelemetryCatalog,
  bootstrapSharedPackage,
  ownedContractFamilies,
  ownedObjectFamilies,
  packageContract,
  persistentShellCatalog,
  routeGuardCatalog,
  selectedAnchorContractFamilies,
  selectedAnchorManagerCatalog,
  selectedAnchorObjectFamilies,
} from "../src/index";

describe("public package surface", () => {
  it("boots through documented public contracts", () => {
    expect(packageContract.packageName).toBe("@vecells/persistent-shell");
    expect(bootstrapSharedPackage().shells).toBe(persistentShellCatalog.shellCount);
    expect(ownedObjectFamilies).toHaveLength(11);
    expect(ownedContractFamilies).toHaveLength(3);
  });

  it("publishes the par_106 catalog summary", () => {
    expect(persistentShellCatalog.taskId).toBe("par_106");
    expect(persistentShellCatalog.primaryAudienceShellCount).toBe(6);
    expect(persistentShellCatalog.shellCount).toBe(7);
    expect(persistentShellCatalog.routeResidencyCount).toBe(19);
  });

  it("publishes the par_108 continuity manager surface", () => {
    expect(selectedAnchorManagerCatalog.taskId).toBe("par_108");
    expect(selectedAnchorManagerCatalog.routeCount).toBe(19);
    expect(selectedAnchorManagerCatalog.policyCount).toBe(19);
    expect(selectedAnchorManagerCatalog.adjacencyCount).toBe(99);
    expect(selectedAnchorObjectFamilies).toHaveLength(4);
    expect(selectedAnchorContractFamilies).toHaveLength(1);
  });

  it("publishes the par_112 route-guard surface", () => {
    expect(routeGuardCatalog.taskId).toBe("par_112");
    expect(routeGuardCatalog.routeCount).toBe(19);
    expect(routeGuardCatalog.channelProfileCount).toBe(4);
    expect(routeGuardCatalog.embeddedGuardedRouteCount).toBe(1);
  });

  it("publishes the par_114 automation and ui telemetry vocabulary", () => {
    expect(automationTelemetryCatalog.taskId).toBe("par_114");
    expect(automationTelemetryCatalog.routeProfileCount).toBe(19);
    expect(automationTelemetryCatalog.markerClassCount).toBe(9);
    expect(automationTelemetryCatalog.eventBindingCount).toBe(133);
    expect(automationTelemetryCatalog.redactedEnvelopeCount).toBe(24);
  });
});
