import { describe, expect, it } from "vitest";

import {
  create354OperationsHarness,
  seed354BounceBackCase,
  seed354WaitingChoiceCase,
  seed354WaitingOutcomeCase,
} from "./354_pharmacy_operations.helpers.ts";

describe("354 pharmacy operations queue membership", () => {
  it("derives active, waiting-choice, waiting-outcome, and bounce-back queues from upstream truth families", async () => {
    const harness = create354OperationsHarness();
    const waitingChoice = await seed354WaitingChoiceCase({
      harness,
      seed: "354_waiting_choice",
    });
    const waitingOutcome = await seed354WaitingOutcomeCase({
      harness,
      seed: "354_waiting_outcome",
    });
    const bounceBack = await seed354BounceBackCase({
      harness,
      seed: "354_bounce_back",
    });

    const refreshed = await harness.operationsService.refreshOperationsProjections({
      recordedAt: "2026-04-24T19:30:00.000Z",
    });

    expect(
      refreshed.activeCases.some(
        (row) => row.pharmacyCaseRef.refId === waitingChoice.pharmacyCaseId,
      ),
    ).toBe(true);
    expect(
      refreshed.activeCases.some(
        (row) => row.pharmacyCaseRef.refId === waitingOutcome.pharmacyCaseId,
      ),
    ).toBe(true);
    expect(
      refreshed.activeCases.some(
        (row) => row.pharmacyCaseRef.refId === bounceBack.pharmacyCaseId,
      ),
    ).toBe(true);

    expect(
      refreshed.waitingForChoice.some(
        (row) => row.pharmacyCaseRef.refId === waitingChoice.pharmacyCaseId,
      ),
    ).toBe(true);
    expect(
      refreshed.waitingOutcome.some(
        (row) => row.pharmacyCaseRef.refId === waitingOutcome.pharmacyCaseId,
      ),
    ).toBe(true);
    expect(
      refreshed.bounceBack.some(
        (row) => row.pharmacyCaseRef.refId === bounceBack.pharmacyCaseId,
      ),
    ).toBe(true);

    const queueSummary =
      await harness.operationsService.queryService.fetchQueueCountsAndAgeingSummaries({
        recordedAt: "2026-04-24T19:30:00.000Z",
      });
    expect(
      queueSummary.some(
        (entry) =>
          entry.worklistFamily === "pharmacy_waiting_for_choice_projection" &&
          entry.totalCount >= 1,
      ),
    ).toBe(true);
    expect(
      queueSummary.some(
        (entry) =>
          entry.worklistFamily === "pharmacy_dispatched_waiting_outcome_projection" &&
          entry.totalCount >= 1,
      ),
    ).toBe(true);
    expect(
      queueSummary.some(
        (entry) =>
          entry.worklistFamily === "pharmacy_bounce_back_projection" && entry.totalCount >= 1,
      ),
    ).toBe(true);
  });
});
