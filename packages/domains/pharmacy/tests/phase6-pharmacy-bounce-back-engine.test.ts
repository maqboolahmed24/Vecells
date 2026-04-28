import { describe, expect, it } from "vitest";

import { create353BounceBackHarness } from "../../../../tests/integration/353_pharmacy_bounce_back.helpers.ts";
import { ingest352Outcome, seed352OutcomeReadyCase } from "../../../../tests/integration/352_pharmacy_outcome.helpers.ts";

const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;

describe("phase6 pharmacy bounce-back engine", () => {
  it("derives urgent return posture from a 352 outcome settlement without inventing a second classification rule set", async () => {
    const harness = create353BounceBackHarness();
    const seeded = await seed352OutcomeReadyCase({
      harness,
      seed: "353_unit_outcome_preview",
    });

    const outcome = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "urgent_gp_action",
      sourceType: "gp_workflow_observation",
      recordedAt: "2026-04-23T19:05:00.000Z",
    });

    const preview = await harness.bounceBackService.previewNormalizedBounceBack({
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      sourceKind: "outcome_observation",
      sourceOutcomeOrDispatchRef: {
        targetFamily: "PharmacyOutcomeSettlement",
        refId: outcome.settlement.settlementId,
        ownerTask: TASK_343,
      },
      evidenceSummaryRef: "preview:urgent_gp_action",
      receivedAt: "2026-04-23T19:05:00.000Z",
      recordedAt: "2026-04-23T19:06:00.000Z",
    });

    expect(preview.bounceBackType).toBe("urgent_gp_return");
    expect(preview.directUrgentRouteRequired).toBe(true);
    expect(preview.reopenedCaseStatus).toBe("urgent_bounce_back");
    expect(preview.reopenPriorityBand).toBe(3);
  });
});
