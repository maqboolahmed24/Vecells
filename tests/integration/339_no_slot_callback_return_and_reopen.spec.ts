import { describe, expect, it } from "vitest";

import {
  createCallbackFallbackFlow,
  createReturnFallbackFlow,
} from "./339_commit_mesh_no_slot.helpers.ts";
import {
  buildResolveNoSlotInput,
  setupHubFallbackHarness,
} from "./323_hub_fallback.helpers.ts";

describe("339 no-slot callback, return, and reopen continuity", () => {
  it("keeps callback fallback blocked from closure until linkage is durable and preserves provenance", async () => {
    const flow = await createCallbackFallbackFlow("339_callback_flow");

    expect(flow.created.route).toBe("callback");
    expect(flow.created.fallbackRecord?.fallbackState).toBe("pending_link");
    expect(flow.created.hubTransition?.hubCase.status).toBe("callback_transfer_pending");
    expect(flow.created.truthProjection?.fallbackLinkState).toBe("callback_pending_link");
    expect(flow.created.truthProjection?.closureState).toBe("blocked_by_fallback_linkage");
    expect(flow.created.session?.openChoiceState).toBe("read_only_provenance");
    expect(flow.created.session?.patientChoiceState).toBe("callback_requested");
    expect(flow.created.fallbackCard?.sourceFallbackRef).toBe(
      flow.created.fallbackRecord?.hubFallbackRecordId,
    );

    expect(flow.linked.callbackFallbackRecord.callbackCaseRef).toContain("callback_case_");
    expect(flow.linked.callbackFallbackRecord.callbackExpectationEnvelopeRef).toContain(
      "callback_expectation_",
    );
    expect(flow.linked.fallbackRecord.fallbackState).toBe("transferred");
    expect(flow.linked.truthProjection.fallbackLinkState).toBe("callback_linked");
    expect(flow.linked.truthProjection.closureState).toBe("closable");
  });

  it("links return-to-practice reopen continuity and escalates repeated low-novelty bounce-back instead of silently retrying", async () => {
    const returnFlow = await createReturnFallbackFlow("339_return_flow");

    expect(returnFlow.created.route).toBe("return_to_practice");
    expect(returnFlow.created.returnToPracticeRecord).not.toBeNull();
    expect(returnFlow.created.hubTransition?.hubCase.status).toBe("escalated_back");
    expect(returnFlow.created.truthProjection?.fallbackLinkState).toBe("return_pending_link");
    expect(returnFlow.created.truthProjection?.closureState).toBe("blocked_by_fallback_linkage");
    expect(returnFlow.created.session?.openChoiceState).toBe("read_only_provenance");
    expect(returnFlow.created.returnToPracticeRecord?.urgencyCarryFloor).toBe(0.82);
    expect(returnFlow.created.returnToPracticeRecord?.bounceCount).toBe(1);

    expect(returnFlow.linked.returnToPracticeRecord.reopenedWorkflowRef).toContain(
      "practice_reopen_",
    );
    expect(returnFlow.linked.returnToPracticeRecord.reopenLifecycleState).toBe("linked");
    expect(returnFlow.linked.fallbackRecord.fallbackState).toBe("transferred");
    expect(returnFlow.linked.truthProjection.fallbackLinkState).toBe("return_linked");
    expect(returnFlow.linked.truthProjection.closureState).toBe("closable");

    const loopHarness = await setupHubFallbackHarness("339_loop_guard");
    await loopHarness.fallbackRepositories.saveCycleCounter({
      hubFallbackCycleCounterId: "hub_cycle_counter_339_loop_guard",
      hubCoordinationCaseId: loopHarness.candidatesReady.hubCase.hubCoordinationCaseId,
      bounceCount: 2,
      previousBestTrustedFit: 0.42,
      previousPriorityBand: "priority",
      latestNoveltyScore: 0.12,
      lastReturnedAt: "2026-04-24T09:09:00.000Z",
      updatedAt: "2026-04-24T09:09:00.000Z",
      version: 1,
    });

    const escalated = await loopHarness.fallbackService.resolveNoSlotFallback(
      buildResolveNoSlotInput(loopHarness, {
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

    expect(escalated.route).toBe("return_to_practice");
    expect(escalated.cycleCounter?.bounceCount).toBe(3);
    expect(escalated.supervisorEscalation?.escalationState).toBe("required");
    expect(escalated.exception?.exceptionClass).toBe("loop_prevention");
    expect(escalated.exception?.escalationState).toBe("supervisor_review_required");
    expect(escalated.fallbackRecord?.fallbackState).toBe("supervisor_review_required");
    expect(escalated.returnToPracticeRecord?.returnState).toBe("supervisor_review_required");
  });
});
