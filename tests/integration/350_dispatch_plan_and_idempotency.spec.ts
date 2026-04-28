import { describe, expect, it } from "vitest";

import {
  create350DispatchHarness,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "./350_pharmacy_dispatch.helpers.ts";

describe("350 dispatch plan and idempotency", () => {
  it("replays identical submit commands onto the same live attempt and reuses the same truth", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_idempotent",
    });

    const first = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_idempotent",
    });
    const second = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_idempotent",
    });

    expect(first.dispatchBundle.attempt.dispatchAttemptId).toBe(
      second.dispatchBundle.attempt.dispatchAttemptId,
    );
    expect(first.dispatchBundle.plan.dispatchPlanHash).toBe(
      second.dispatchBundle.plan.dispatchPlanHash,
    );
    expect(second.replayed).toBe(true);
    expect(second.reusedExistingAttempt).toBe(true);
  });

  it("reuses the live attempt family on resend and appends outbound references", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_retry",
    });

    const first = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_retry_first",
      recordedAt: "2026-04-23T14:20:00.000Z",
    });
    const currentCase = await harness.caseKernelService.getPharmacyCase(frozenState.pharmacyCaseId);
    if (!currentCase) {
      throw new Error("PharmacyCase missing after first dispatch.");
    }
    const resent = await harness.dispatchService.resendDispatch({
      pharmacyCaseId: frozenState.pharmacyCaseId,
      packageId: frozenState.packageBundle.package.packageId,
      dispatchAttemptId: first.dispatchBundle.attempt.dispatchAttemptId,
      routeIntentBindingRef: frozenState.packageBundle.package.routeIntentBindingRef,
      canonicalObjectDescriptorRef: "PharmacyDispatchAttempt.v1",
      governingObjectVersionRef: "phase6_dispatch_contract_v1",
      actorRef: "actor_350_retry_second",
      commandActionRecordRef: "dispatch_action_350_retry_second",
      commandSettlementRecordRef: "dispatch_settlement_350_retry_second",
      recordedAt: "2026-04-23T14:35:00.000Z",
      leaseRef: currentCase.pharmacyCase.leaseRef,
      expectedOwnershipEpoch: currentCase.pharmacyCase.ownershipEpoch,
      expectedLineageFenceRef: currentCase.pharmacyCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_350_retry_second",
      reasonCode: "resend_dispatch",
      sourceCommandId: "350_retry_second",
    });

    expect(resent.dispatchBundle.attempt.dispatchAttemptId).toBe(
      first.dispatchBundle.attempt.dispatchAttemptId,
    );
    expect(resent.dispatchBundle.attempt.outboundReferenceSet.length).toBeGreaterThan(
      first.dispatchBundle.attempt.outboundReferenceSet.length,
    );
    expect(resent.reusedExistingAttempt).toBe(true);
  });
});
