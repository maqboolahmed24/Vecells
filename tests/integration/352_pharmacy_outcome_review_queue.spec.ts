import { describe, expect, it } from "vitest";

import {
  ingest352Outcome,
  project352PatientStatus,
  seed352OutcomeReadyCase,
  create352OutcomeHarness,
} from "./352_pharmacy_outcome.helpers.ts";

describe("352 pharmacy outcome review queue and reopen truth", () => {
  it("routes low-assurance email evidence without trustworthy correlation into review debt", async () => {
    const harness = create352OutcomeHarness();
    const seeded = await seed352OutcomeReadyCase({
      harness,
      seed: "352_review",
    });

    const review = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "medicine_supplied",
      sourceType: "email_ingest",
      recordedAt: "2026-04-23T18:20:00.000Z",
      withTrustedCorrelation: false,
    });

    expect(review.settlement.result).toBe("review_required");
    expect(review.reconciliationGate?.gateState).toBe("open");
    expect(review.caseMutation?.pharmacyCase.status).toBe("outcome_reconciliation_pending");

    const debt = await harness.outcomeService.getOutcomeReviewDebt(
      seeded.currentCase.pharmacyCaseId,
    );

    expect(debt).toHaveLength(1);
    expect(debt[0]?.reconciliationGate?.outcomeReconciliationGateId).toBe(
      review.reconciliationGate?.outcomeReconciliationGateId,
    );

    const projected = await project352PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T18:21:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("reviewing_next_steps");
    expect(projected.instructionPanel.reviewText).toContain("reviewing");
  });

  it("reopens for safety on urgent outcome classes instead of settling calm completion", async () => {
    const harness = create352OutcomeHarness();
    const seeded = await seed352OutcomeReadyCase({
      harness,
      seed: "352_reopen",
    });

    const reopened = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "urgent_gp_action",
      sourceType: "direct_structured_message",
      recordedAt: "2026-04-23T18:30:00.000Z",
    });

    expect(reopened.settlement.result).toBe("reopened_for_safety");
    expect(reopened.caseMutation?.pharmacyCase.status).toBe("urgent_bounce_back");
    expect(reopened.outcomeTruthProjection.outcomeTruthState).toBe("reopened_for_safety");
  });
});
