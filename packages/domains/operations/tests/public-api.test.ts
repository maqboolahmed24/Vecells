import { describe, expect, it } from "vitest";
import {
  aggregateFamilies,
  bootstrapDomainModule,
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
    expect(packageContract.packageName).toBe("@vecells/domain-operations");
    expect(ownedObjectFamilies.length).toBeGreaterThan(0);
    expect(bootstrapDomainModule().objectFamilies).toBe(ownedObjectFamilies.length);
    expect(Array.isArray(aggregateFamilies)).toBe(true);
    expect(Array.isArray(domainServiceFamilies)).toBe(true);
    expect(Array.isArray(eventFamilies)).toBe(true);
    expect(Array.isArray(policyFamilies)).toBe(true);
    expect(Array.isArray(projectionFamilies)).toBe(true);
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
    expect(Array.isArray(publishedEventFamilies)).toBe(true);
    expect(Array.isArray(foundationPolicyScopeCatalog)).toBe(true);
    expect(Array.isArray(observabilitySignalFamilies)).toBe(true);
  });
});
