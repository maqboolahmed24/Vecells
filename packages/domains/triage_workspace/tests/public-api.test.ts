import { describe, expect, it } from "vitest";
import {
  aggregateFamilies,
  bootstrapDomainModule,
  createPhase1EtaEngine,
  createPhase1TriageHandoffService,
  createPhase3ApprovalEscalationKernelService,
  createPhase3ApprovalEscalationKernelStore,
  createPhase3AdviceRenderKernelService,
  createPhase3AdviceRenderKernelStore,
  createPhase3CallbackKernelService,
  createPhase3CallbackKernelStore,
  createPhase3ClinicianMessageKernelService,
  createPhase3ClinicianMessageKernelStore,
  createPhase3DirectResolutionKernelService,
  createPhase3DirectResolutionKernelStore,
  createPhase3ReopenLaunchKernelService,
  createPhase3ReopenLaunchKernelStore,
  createPhase3SelfCareBoundaryKernelService,
  createPhase3SelfCareBoundaryKernelStore,
  createPhase3TaskCompletionContinuityKernelService,
  createPhase3TaskCompletionContinuityKernelStore,
  createPhase1TriageStore,
  createPhase3MoreInfoKernelService,
  createPhase3MoreInfoKernelStore,
  createPhase3TriageKernelService,
  createPhase3TriageKernelStore,
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
    expect(packageContract.packageName).toBe("@vecells/domain-triage-workspace");
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
    expect(typeof createPhase1TriageStore).toBe("function");
    expect(typeof createPhase1EtaEngine).toBe("function");
    expect(typeof createPhase1TriageHandoffService).toBe("function");
    expect(typeof createPhase3ApprovalEscalationKernelStore).toBe("function");
    expect(typeof createPhase3ApprovalEscalationKernelService).toBe("function");
    expect(typeof createPhase3AdviceRenderKernelStore).toBe("function");
    expect(typeof createPhase3AdviceRenderKernelService).toBe("function");
    expect(typeof createPhase3CallbackKernelStore).toBe("function");
    expect(typeof createPhase3CallbackKernelService).toBe("function");
    expect(typeof createPhase3ClinicianMessageKernelStore).toBe("function");
    expect(typeof createPhase3ClinicianMessageKernelService).toBe("function");
    expect(typeof createPhase3DirectResolutionKernelStore).toBe("function");
    expect(typeof createPhase3DirectResolutionKernelService).toBe("function");
    expect(typeof createPhase3ReopenLaunchKernelStore).toBe("function");
    expect(typeof createPhase3ReopenLaunchKernelService).toBe("function");
    expect(typeof createPhase3SelfCareBoundaryKernelStore).toBe("function");
    expect(typeof createPhase3SelfCareBoundaryKernelService).toBe("function");
    expect(typeof createPhase3TaskCompletionContinuityKernelStore).toBe("function");
    expect(typeof createPhase3TaskCompletionContinuityKernelService).toBe("function");
    expect(typeof createPhase3MoreInfoKernelStore).toBe("function");
    expect(typeof createPhase3MoreInfoKernelService).toBe("function");
    expect(typeof createPhase3TriageKernelStore).toBe("function");
    expect(typeof createPhase3TriageKernelService).toBe("function");
  });
});
