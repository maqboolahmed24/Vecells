import { describe, expect, it } from "vitest";

import {
  buildCompleteFallbackInput,
  buildLinkReturnInput,
  buildResolveNoSlotInput,
  openFallbackOfferSession,
  setupHubFallbackHarness,
} from "./323_hub_fallback.helpers.ts";

describe("323 hub fallback return and loop prevention", () => {
  it("returns to practice with governed reopen linkage and preserved offer provenance", async () => {
    const harness = await setupHubFallbackHarness("323_return_reopen");
    const opened = await openFallbackOfferSession(harness);

    const created = await harness.fallbackService.resolveNoSlotFallback(
      buildResolveNoSlotInput(harness, {
        trustedAlternativeFrontierExists: true,
        callbackRequested: true,
        offerLeadMinutes: 50,
        callbackLeadMinutes: 40,
        alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
        bestTrustedFit: 0.33,
        trustGap: 0.71,
        pBreach: 0.82,
      }),
    );

    expect(created.route).toBe("return_to_practice");
    expect(created.returnToPracticeRecord).not.toBeNull();
    expect(created.hubTransition?.hubCase.status).toBe("escalated_back");
    expect(created.truthProjection?.fallbackLinkState).toBe("return_pending_link");
    expect(created.truthProjection?.closureState).toBe("blocked_by_fallback_linkage");
    expect(created.session?.openChoiceState).toBe("read_only_provenance");
    expect(created.session?.patientChoiceState).toBe("recovery_only");
    expect(created.returnToPracticeRecord?.urgencyCarryFloor).toBe(0.82);
    expect(created.returnToPracticeRecord?.bounceCount).toBe(1);

    const linked = await harness.fallbackService.linkReturnToPractice(
      buildLinkReturnInput(created.fallbackRecord!.hubFallbackRecordId, "323_return_reopen"),
    );

    expect(linked.returnToPracticeRecord.reopenedWorkflowRef).toContain("practice_reopen_");
    expect(linked.returnToPracticeRecord.reopenLifecycleState).toBe("linked");
    expect(linked.fallbackRecord.fallbackState).toBe("transferred");
    expect(linked.truthProjection.fallbackLinkState).toBe("return_linked");
    expect(linked.truthProjection.closureState).toBe("closable");

    const completed = await harness.fallbackService.completeHubFallback(
      buildCompleteFallbackInput(created.fallbackRecord!.hubFallbackRecordId, "323_return_reopen"),
    );

    expect(completed.closedCase?.hubCase.status).toBe("closed");
  });

  it("halts silent hub-practice ping-pong when bounce count is high and novelty remains low", async () => {
    const harness = await setupHubFallbackHarness("323_loop_guard");
    await harness.fallbackRepositories.saveCycleCounter({
      hubFallbackCycleCounterId: "hub_cycle_counter_323_loop_guard",
      hubCoordinationCaseId: harness.candidatesReady.hubCase.hubCoordinationCaseId,
      bounceCount: 2,
      previousBestTrustedFit: 0.42,
      previousPriorityBand: "priority",
      latestNoveltyScore: 0.12,
      lastReturnedAt: "2026-04-24T09:09:00.000Z",
      updatedAt: "2026-04-24T09:09:00.000Z",
      version: 1,
    });

    const created = await harness.fallbackService.resolveNoSlotFallback(
      buildResolveNoSlotInput(harness, {
        trustedAlternativeFrontierExists: false,
        degradedOnlyEvidence: true,
        callbackRequested: false,
        policyRequiresCallback: false,
        offerLeadMinutes: 60,
        callbackLeadMinutes: 50,
        bestTrustedFit: 0.44,
        trustGap: 0.55,
        pBreach: 0.76,
        newClinicalContextScore: 0.1,
      }),
    );

    expect(created.route).toBe("return_to_practice");
    expect(created.cycleCounter?.bounceCount).toBe(3);
    expect(created.supervisorEscalation?.escalationState).toBe("required");
    expect(created.exception?.exceptionClass).toBe("loop_prevention");
    expect(created.exception?.escalationState).toBe("supervisor_review_required");
    expect(created.fallbackRecord?.fallbackState).toBe("supervisor_review_required");
    expect(created.returnToPracticeRecord?.returnState).toBe("supervisor_review_required");
  });
});
