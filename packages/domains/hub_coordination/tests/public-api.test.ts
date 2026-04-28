import { describe, expect, it } from "vitest";
import {
  aggregateFamilies,
  createPhase5AlternativeOfferEngineService,
  createPhase5HubCommitEngineService,
  createPhase5HubFallbackEngineService,
  createPhase5HubBackgroundIntegrityService,
  createPhase5PracticeContinuityService,
  bootstrapDomainModule,
  createPhase5EnhancedAccessPolicyService,
  createPhase5HubQueueEngineService,
  createPhase5NetworkCapacityPipelineService,
  createPhase5ReminderManageVisibilityService,
  createPhase5ActingScopeVisibilityService,
  createPhase5HubCaseKernelService,
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
    expect(packageContract.packageName).toBe("@vecells/domain-hub-coordination");
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
    expect(typeof createPhase5HubCaseKernelService).toBe("function");
    expect(typeof createPhase5ActingScopeVisibilityService).toBe("function");
    expect(typeof createPhase5EnhancedAccessPolicyService).toBe("function");
    expect(typeof createPhase5NetworkCapacityPipelineService).toBe("function");
    expect(typeof createPhase5HubQueueEngineService).toBe("function");
    expect(typeof createPhase5AlternativeOfferEngineService).toBe("function");
    expect(typeof createPhase5HubCommitEngineService).toBe("function");
    expect(typeof createPhase5PracticeContinuityService).toBe("function");
    expect(typeof createPhase5HubFallbackEngineService).toBe("function");
    expect(typeof createPhase5ReminderManageVisibilityService).toBe("function");
    expect(typeof createPhase5HubBackgroundIntegrityService).toBe("function");
  });
});
