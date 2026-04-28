import { describe, expect, it } from "vitest";

import {
  create350DispatchHarness,
  seed350FrozenPackageCase,
} from "../integration/350_pharmacy_dispatch.helpers.ts";

describe("350 dispatch determinism and retry", () => {
  it("derives the same governed plan hash for the same frozen package and route tuple", async () => {
    const harnessA = create350DispatchHarness();
    const frozenA = await seed350FrozenPackageCase({
      harness: harnessA,
      seed: "350_prop_same",
    });
    const planA = await harnessA.dispatchService.planDispatch({
      pharmacyCaseId: frozenA.pharmacyCaseId,
      packageId: frozenA.packageBundle.package.packageId,
      routeIntentBindingRef: frozenA.packageBundle.package.routeIntentBindingRef,
      canonicalObjectDescriptorRef: "PharmacyDispatchAttempt.v1",
      governingObjectVersionRef: "phase6_dispatch_contract_v1",
      recordedAt: "2026-04-23T14:15:00.000Z",
    });

    const harnessB = create350DispatchHarness();
    const frozenB = await seed350FrozenPackageCase({
      harness: harnessB,
      seed: "350_prop_same",
    });
    const planB = await harnessB.dispatchService.planDispatch({
      pharmacyCaseId: frozenB.pharmacyCaseId,
      packageId: frozenB.packageBundle.package.packageId,
      routeIntentBindingRef: frozenB.packageBundle.package.routeIntentBindingRef,
      canonicalObjectDescriptorRef: "PharmacyDispatchAttempt.v1",
      governingObjectVersionRef: "phase6_dispatch_contract_v1",
      recordedAt: "2026-04-23T14:15:00.000Z",
    });

    expect(planA.plan.dispatchPlanHash).toBe(planB.plan.dispatchPlanHash);
    expect(planA.manifest.manifestHash).toBe(planB.manifest.manifestHash);
    expect(planA.binding.bindingHash).toBe(planB.binding.bindingHash);
  });
});
