import { describe, expect, it } from "vitest";

import {
  create354OperationsHarness,
  force354DiscoveryUnavailable,
  seed354BounceBackCase,
  seed354WaitingChoiceCase,
  seed354WaitingOutcomeCase,
} from "./354_pharmacy_operations.helpers.ts";

describe("354 pharmacy exception and visibility", () => {
  it("publishes minimum-necessary practice visibility and explicit exception classes without reading raw timelines", async () => {
    const harness = create354OperationsHarness();
    const waitingChoice = await seed354WaitingChoiceCase({
      harness,
      seed: "354_discovery_gap",
    });
    await force354DiscoveryUnavailable({
      harness,
      pharmacyCaseId: waitingChoice.pharmacyCaseId,
    });

    const waitingOutcome = await seed354WaitingOutcomeCase({
      harness,
      seed: "354_outcome_window",
    });
    const bounceBack = await seed354BounceBackCase({
      harness,
      seed: "354_visibility_bounce_back",
    });

    const exceptionWorklist =
      await harness.operationsService.queryService.fetchDispatchExceptionWorklist({
        recordedAt: "2026-04-24T19:30:00.000Z",
      });

    const discoveryRow = exceptionWorklist.rows.find(
      (row) => row.pharmacyCaseRef.refId === waitingChoice.pharmacyCaseId,
    );
    expect(discoveryRow?.activeExceptionClasses).toContain("discovery_unavailable");
    expect(discoveryRow?.activeExceptionClasses).toContain("no_eligible_providers_returned");

    const outcomeRow = exceptionWorklist.rows.find(
      (row) => row.pharmacyCaseRef.refId === waitingOutcome.pharmacyCaseId,
    );
    expect(outcomeRow?.activeExceptionClasses).toContain("no_outcome_within_configured_window");

    const bounceBackVisibility =
      await harness.operationsService.queryService.fetchPracticeVisibilityModel(
        bounceBack.pharmacyCaseId,
        {
          recordedAt: "2026-04-24T19:30:00.000Z",
        },
      );
    expect(bounceBackVisibility).not.toBeNull();
    expect(bounceBackVisibility?.reachabilityRepairState).not.toBeNull();
    expect(bounceBackVisibility?.currentCloseBlockerRefs).toBeDefined();
    expect(bounceBackVisibility?.activeExceptionClasses).toContain(
      "reachability_repair_required",
    );
    expect(bounceBackVisibility?.minimumNecessaryRefs.dispatchTruthProjectionRef).toBeTruthy();
    expect(bounceBackVisibility?.minimumNecessaryTimestamps.caseCreatedAt).toBeTruthy();
    expect(bounceBackVisibility?.minimumNecessaryTimestamps.caseUpdatedAt).toBeTruthy();
    expect(bounceBackVisibility?.minimumNecessaryTimestamps.lastMeaningfulEventAt).toBeTruthy();
  });
});
