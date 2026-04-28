import { describe, expect, it } from "vitest";

import {
  create352OutcomeHarness,
  ingest352Outcome,
  project352PatientStatus,
  seed352OutcomeReadyCase,
} from "./352_pharmacy_outcome.helpers.ts";

describe("352 pharmacy outcome gate resolution", () => {
  it("lets an operator resolve a review gate to apply without inventing a second ingest path", async () => {
    const harness = create352OutcomeHarness();
    const seeded = await seed352OutcomeReadyCase({
      harness,
      seed: "352_gate_apply",
    });

    const review = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "medicine_supplied",
      sourceType: "email_ingest",
      recordedAt: "2026-04-23T18:20:00.000Z",
      withTrustedCorrelation: false,
    });

    expect(review.reconciliationGate?.gateState).toBe("open");

    const resolved = await harness.outcomeService.resolveOutcomeReconciliationGate({
      outcomeReconciliationGateId:
        review.reconciliationGate!.outcomeReconciliationGateId,
      resolution: "apply",
      actorRef: "ops_reviewer_352",
      commandActionRecordRef: "ops_review_action_352",
      commandSettlementRecordRef: "ops_review_settlement_352",
      reasonCode: "operator_apply_reviewed_outcome",
      recordedAt: "2026-04-23T18:25:00.000Z",
      resolutionNotesRef: "matched_by_manual_ops_review",
    });

    expect(resolved.reconciliationGate.gateState).toBe("resolved_apply");
    expect(resolved.ingestAttempt.manualReviewState).toBe("approved_apply");
    expect(resolved.settlement.result).toBe("resolved_pending_projection");
    expect(resolved.caseMutation?.pharmacyCase.status).toBe("resolved_by_pharmacy");
    expect(resolved.outcomeTruthProjection.outcomeTruthState).toBe("settled_resolved");

    const projected = await project352PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T18:26:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("completed");
  });

  it("supports explicit unmatched resolution without mutating the case a second time", async () => {
    const harness = create352OutcomeHarness();
    const seeded = await seed352OutcomeReadyCase({
      harness,
      seed: "352_gate_unmatched",
    });

    const review = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "medicine_supplied",
      sourceType: "email_ingest",
      recordedAt: "2026-04-23T18:40:00.000Z",
      withTrustedCorrelation: false,
    });

    const resolved = await harness.outcomeService.resolveOutcomeReconciliationGate({
      outcomeReconciliationGateId:
        review.reconciliationGate!.outcomeReconciliationGateId,
      resolution: "unmatched",
      actorRef: "ops_reviewer_352_unmatched",
      commandActionRecordRef: "ops_review_action_352_unmatched",
      commandSettlementRecordRef: "ops_review_settlement_352_unmatched",
      reasonCode: "operator_marked_unmatched",
      recordedAt: "2026-04-23T18:45:00.000Z",
      resolutionNotesRef: "not_the_same_consultation",
    });

    expect(resolved.reconciliationGate.gateState).toBe("resolved_unmatched");
    expect(resolved.ingestAttempt.manualReviewState).toBe("approved_unmatched");
    expect(resolved.settlement.result).toBe("unmatched");
    expect(resolved.caseMutation).toBeNull();
  });
});
