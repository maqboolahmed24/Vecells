import { describe, expect, it } from "vitest";

import {
  create350DispatchHarness,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "./350_pharmacy_dispatch.helpers.ts";

describe("350 manual dispatch and contradiction", () => {
  it("supports manual assisted dispatch with second-review attestation as authoritative proof", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_manual",
      providerRef: "provider_A10002",
    });

    const submitted = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_manual_submit",
    });

    expect(submitted.dispatchBundle.plan.transportMode).toBe("manual_assisted_dispatch");
    expect(submitted.dispatchBundle.binding.requiresManualOperator).toBe(true);
    expect(submitted.dispatchBundle.proofEnvelope.proofState).toBe("pending");

    const attested = await harness.dispatchService.recordManualDispatchAssistance({
      dispatchAttemptId: submitted.dispatchBundle.attempt.dispatchAttemptId,
      operatorRef: "operator_350_manual",
      operatorActionRef: "operator_action_350_manual",
      secondReviewerRef: "reviewer_350_manual",
      evidenceRefs: ["manual_checklist_350_manual", "reviewer_attestation_350_manual"],
      attestationState: "attested",
      completedAt: "2026-04-23T14:30:00.000Z",
    });

    expect(attested.proofEnvelope.proofState).toBe("satisfied");
    expect(attested.settlement.result).toBe("live_referral_confirmed");
  });

  it("marks contradiction as disputed and routes recovery to reconciliation", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_contradiction",
    });

    const submitted = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_contradiction_submit",
    });

    const disputed = await harness.dispatchService.markDispatchContradiction({
      dispatchAttemptId: submitted.dispatchBundle.attempt.dispatchAttemptId,
      sourceClass: "provider_structured_ack",
      recordedAt: "2026-04-23T14:26:00.000Z",
      contradictionRef: "contra_350_provider_rejected",
      rawEvidence: {
        outcome: "provider_rejected_referral",
      },
      semanticEvidence: {
        outcome: "provider_rejected_referral",
      },
    });

    expect(disputed.proofEnvelope.proofState).toBe("disputed");
    expect(disputed.settlement.result).toBe("reconciliation_required");
    expect(disputed.truthProjection.proofRiskState).toBe("disputed");
  });
});
