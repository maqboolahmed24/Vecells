import { describe, expect, it } from "vitest";
import {
  aggregateFamilies,
  bootstrapDomainModule,
  createPhase4BookingCapabilityEngineService,
  createPhase4BookingCapabilityEngineStore,
  createPhase4BookingCaseKernelService,
  createPhase4BookingCaseKernelStore,
  createPhase4BookingCommitService,
  createPhase4BookingCommitStore,
  createPhase4CapacityRankService,
  createPhase4CapacityRankStore,
  createPhase4SlotSearchSnapshotService,
  createPhase4SlotSearchSnapshotStore,
  domainServiceFamilies,
  eventFamilies,
  ownedObjectFamilies,
  packageContract,
  policyFamilies,
  projectionFamilies,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";
import { publishedEventFamilies } from "@vecells/event-contracts";
import { foundationPolicyScopeCatalog } from "@vecells/authz-policy";
import { observabilitySignalFamilies } from "@vecells/observability";

describe("public package surface", () => {
  it("boots through public dependencies only", () => {
    expect(packageContract.packageName).toBe("@vecells/domain-booking");
    expect(ownedObjectFamilies.length).toBeGreaterThan(0);
    expect(bootstrapDomainModule().objectFamilies).toBe(ownedObjectFamilies.length);
    expect(Array.isArray(aggregateFamilies)).toBe(true);
    expect(Array.isArray(domainServiceFamilies)).toBe(true);
    expect(Array.isArray(eventFamilies)).toBe(true);
    expect(Array.isArray(policyFamilies)).toBe(true);
    expect(Array.isArray(projectionFamilies)).toBe(true);
    expect(typeof createPhase4BookingCapabilityEngineStore).toBe("function");
    expect(typeof createPhase4BookingCapabilityEngineService).toBe("function");
    expect(typeof createPhase4BookingCaseKernelStore).toBe("function");
    expect(typeof createPhase4BookingCaseKernelService).toBe("function");
    expect(typeof createPhase4BookingCommitStore).toBe("function");
    expect(typeof createPhase4BookingCommitService).toBe("function");
    expect(typeof createPhase4CapacityRankStore).toBe("function");
    expect(typeof createPhase4CapacityRankService).toBe("function");
    expect(typeof createPhase4SlotSearchSnapshotStore).toBe("function");
    expect(typeof createPhase4SlotSearchSnapshotService).toBe("function");
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
    expect(Array.isArray(publishedEventFamilies)).toBe(true);
    expect(Array.isArray(foundationPolicyScopeCatalog)).toBe(true);
    expect(Array.isArray(observabilitySignalFamilies)).toBe(true);
  });
});
