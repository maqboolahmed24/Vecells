import { describe, expect, it } from "vitest";

import {
  create355ConsoleHarness,
  create355FenceForSelectedCandidate,
  seed355OutcomeReviewCase,
} from "./355_pharmacy_console.helpers.ts";

describe("355 outcome review and assurance posture", () => {
  it("blocks calm handoff and assurance when outcome truth is unsettled", async () => {
    const harness = create355ConsoleHarness();
    const seeded = await seed355OutcomeReviewCase({
      harness,
      seed: "355_outcome",
    });

    await create355FenceForSelectedCandidate({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      lineItemRef: seeded.lineItemRef,
      candidateRef: seeded.exactCandidateRef,
      recordedAt: "2026-04-24T10:05:00.000Z",
    });

    const actionSettlement = await harness.consoleService.fetchActionSettlementProjection(
      seeded.currentCase.pharmacyCaseId,
      { recordedAt: "2026-04-24T10:06:00.000Z" },
    );
    expect(actionSettlement?.canonicalSettlementType).toBe("outcome");
    expect(actionSettlement?.agreementState).toBe("blocked");
    expect(actionSettlement?.blockingReasonCodes).toContain("OUTCOME_REVIEW_OR_GATE_ACTIVE");

    const assurance = await harness.consoleService.fetchAssuranceProjection(
      seeded.currentCase.pharmacyCaseId,
      { recordedAt: "2026-04-24T10:06:00.000Z" },
    );
    expect(assurance?.assuranceState).toBe("outcome_review");
    expect(assurance?.blockingReasonCodes).toContain("OUTCOME_REVIEW_ACTIVE");

    const handoff = await harness.consoleService.fetchHandoffProjection(
      seeded.currentCase.pharmacyCaseId,
      { recordedAt: "2026-04-24T10:06:00.000Z" },
    );
    expect(handoff?.handoffReadinessState).toBe("not_ready");
    expect(handoff?.blockingReasonCodes).toContain("ACTION_SETTLEMENT_UNRESOLVED");
  });
});
