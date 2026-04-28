import { describe, expect, it } from "vitest";
import {
  aggregateFamilies,
  bootstrapDomainModule,
  createPhase6PharmacyBounceBackService,
  createPhase6PharmacyBounceBackStore,
  createDeterministicPharmacyDispatchAdapter,
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  createPhase6PharmacyDirectoryChoiceEngineService,
  createPhase6PharmacyDirectoryChoiceStore,
  createPhase6PharmacyDispatchService,
  createPhase6PharmacyDispatchStore,
  createPhase6PharmacyEligibilityEngineService,
  createPhase6PharmacyEligibilityStore,
  createPhase6PharmacyConsoleBackendService,
  createPhase6PharmacyConsoleStore,
  createPhase6PharmacyOperationsService,
  createPhase6PharmacyOperationsStore,
  createPhase6PharmacyOutcomeReconciliationService,
  createPhase6PharmacyOutcomeStore,
  createPhase6PharmacyPatientStatusService,
  createPhase6PharmacyPatientStatusStore,
  createPhase6PharmacyReferralPackageService,
  createPhase6PharmacyReferralPackageStore,
  domainServiceFamilies,
  eventFamilies,
  ownedObjectFamilies,
  packageContract,
  pharmacyProductMergePreviewCases,
  phase6PharmacyPathwayCodes,
  pharmacyRuleThresholdIds,
  policyFamilies,
  projectionFamilies,
  resolvePharmacyProductMergePreviewForMessageCluster,
  resolvePharmacyProductMergePreviewForRequest,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";
import { publishedEventFamilies } from "@vecells/event-contracts";
import { foundationPolicyScopeCatalog } from "@vecells/authz-policy";
import { observabilitySignalFamilies } from "@vecells/observability";

describe("public package surface", () => {
  it("boots through public dependencies only", () => {
    expect(packageContract.packageName).toBe("@vecells/domain-pharmacy");
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
    expect(typeof createPhase6PharmacyBounceBackStore).toBe("function");
    expect(typeof createPhase6PharmacyBounceBackService).toBe("function");
    expect(typeof createPhase6PharmacyCaseKernelStore).toBe("function");
    expect(typeof createPhase6PharmacyCaseKernelService).toBe("function");
    expect(typeof createPhase6PharmacyDirectoryChoiceStore).toBe("function");
    expect(typeof createPhase6PharmacyDirectoryChoiceEngineService).toBe("function");
    expect(typeof createPhase6PharmacyReferralPackageStore).toBe("function");
    expect(typeof createPhase6PharmacyReferralPackageService).toBe("function");
    expect(typeof createPhase6PharmacyDispatchStore).toBe("function");
    expect(typeof createPhase6PharmacyDispatchService).toBe("function");
    expect(typeof createDeterministicPharmacyDispatchAdapter).toBe("function");
    expect(typeof createPhase6PharmacyEligibilityStore).toBe("function");
    expect(typeof createPhase6PharmacyEligibilityEngineService).toBe("function");
    expect(typeof createPhase6PharmacyConsoleStore).toBe("function");
    expect(typeof createPhase6PharmacyConsoleBackendService).toBe("function");
    expect(typeof createPhase6PharmacyOperationsStore).toBe("function");
    expect(typeof createPhase6PharmacyOperationsService).toBe("function");
    expect(typeof createPhase6PharmacyOutcomeStore).toBe("function");
    expect(typeof createPhase6PharmacyOutcomeReconciliationService).toBe("function");
    expect(typeof createPhase6PharmacyPatientStatusStore).toBe("function");
    expect(typeof createPhase6PharmacyPatientStatusService).toBe("function");
    expect(Array.isArray(pharmacyProductMergePreviewCases)).toBe(true);
    expect(resolvePharmacyProductMergePreviewForRequest("request_211_b")?.pharmacyCaseId).toBe(
      "PHC-2057",
    );
    expect(
      resolvePharmacyProductMergePreviewForMessageCluster("cluster_368_pharmacy_urgent_return")
        ?.requestRef,
    ).toBe("request_215_callback");
    expect(phase6PharmacyPathwayCodes.length).toBe(7);
    expect(pharmacyRuleThresholdIds.length).toBeGreaterThan(0);
  });
});
