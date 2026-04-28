import { describe, expect, it } from "vitest";

import {
  create350DispatchHarness,
  load350CurrentCase,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "./350_pharmacy_dispatch.helpers.ts";

describe("350 dispatch receipt and truth", () => {
  it("keeps truth pending on transport acknowledgement and only settles calm once authoritative proof arrives", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_truth",
    });

    const submitted = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_truth_submit",
    });

    expect(submitted.dispatchBundle.truthProjection.authoritativeProofState).toBe("pending");
    expect(submitted.dispatchBundle.settlement.result).toBe("pending_ack");

    const confirmed = await harness.dispatchService.ingestReceiptEvidence({
      dispatchAttemptId: submitted.dispatchBundle.attempt.dispatchAttemptId,
      lane: "authoritative",
      sourceClass: "authoritative_bars_response",
      recordedAt: "2026-04-23T14:24:00.000Z",
      transportMessageId: "bars_authoritative_message_350_truth",
      orderingKey: "2026-04-23T14:24:00.000Z",
      rawEvidence: {
        proof: "structured-authoritative-ack",
      },
      semanticEvidence: {
        proof: "structured-authoritative-ack",
      },
      proofRef: "bars_proof_350_truth",
      satisfiesHardMatchRefs: ["authoritative_dispatch_proof"],
    });

    expect(confirmed.proofEnvelope.proofState).toBe("satisfied");
    expect(confirmed.settlement.result).toBe("live_referral_confirmed");
    expect(confirmed.truthProjection.authoritativeProofState).toBe("satisfied");
    expect(confirmed.truthProjection.audienceMessageRef).toBe(
      "pharmacy.dispatch.truth.live_referral_confirmed",
    );

    const currentCase = await load350CurrentCase(harness, frozenState.pharmacyCaseId);
    expect(currentCase.status).toBe("referred");
  });
});
