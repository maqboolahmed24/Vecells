import { describe, expect, it } from "vitest";

import {
  build352OutcomePayload,
  create352OutcomeHarness,
  ingest352Outcome,
  seed352OutcomeReadyCase,
} from "../integration/352_pharmacy_outcome.helpers.ts";

describe("352 pharmacy outcome replay and match properties", () => {
  it("keeps the winning score tuple deterministic for the same seeded lineage", async () => {
    const leftHarness = create352OutcomeHarness();
    const rightHarness = create352OutcomeHarness();

    const leftSeed = await seed352OutcomeReadyCase({
      harness: leftHarness,
      seed: "352_property",
    });
    const rightSeed = await seed352OutcomeReadyCase({
      harness: rightHarness,
      seed: "352_property",
    });

    const leftMatch = await leftHarness.outcomeService.matchOutcomeEvidence(
      await build352OutcomePayload({
        harness: leftHarness,
        pharmacyCaseId: leftSeed.currentCase.pharmacyCaseId,
        classificationState: "resolved_no_supply",
        sourceType: "gp_workflow_observation",
        sourceMessageKey: "property_message_352",
      }),
    );
    const rightMatch = await rightHarness.outcomeService.matchOutcomeEvidence(
      await build352OutcomePayload({
        harness: rightHarness,
        pharmacyCaseId: rightSeed.currentCase.pharmacyCaseId,
        classificationState: "resolved_no_supply",
        sourceType: "gp_workflow_observation",
        sourceMessageKey: "property_message_352",
      }),
    );

    expect(leftMatch.matchPreview.scorecard.matchScore).toBe(
      rightMatch.matchPreview.scorecard.matchScore,
    );
    expect(leftMatch.matchPreview.scorecard.posteriorMatchConfidence).toBe(
      rightMatch.matchPreview.scorecard.posteriorMatchConfidence,
    );
    expect(leftMatch.matchPreview.matchState).toBe(rightMatch.matchPreview.matchState);
  });

  it("returns duplicate_ignored on exact replay for every trusted source family", async () => {
    const sourceFamilies = [
      "gp_workflow_observation",
      "direct_structured_message",
    ] as const;

    for (const sourceType of sourceFamilies) {
      const harness = create352OutcomeHarness();
      const seeded = await seed352OutcomeReadyCase({
        harness,
        seed: `352_replay_${sourceType}`,
      });

      await ingest352Outcome({
        harness,
        pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
        classificationState: "resolved_no_supply",
        sourceType,
        sourceMessageKey: `${sourceType}_replay_352`,
      });
      const replay = await ingest352Outcome({
        harness,
        pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
        classificationState: "resolved_no_supply",
        sourceType,
        sourceMessageKey: `${sourceType}_replay_352`,
      });

      expect(replay.settlement.result).toBe("duplicate_ignored");
      expect(replay.caseMutation).toBeNull();
    }
  });
});
