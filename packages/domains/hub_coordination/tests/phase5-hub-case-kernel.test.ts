import { describe, expect, it } from "vitest";

import {
  createPhase5HubCaseKernelService,
  createPhase5HubCaseKernelStore,
} from "../src/phase5-hub-case-kernel.ts";
import {
  buildCreateHubCaseCommand,
  buildOwnedHubCommand,
  buildPhase4FallbackRequestCommand,
  progressClaimedHubCaseToBookedViaService,
  releaseAndCloseBookedCase,
  setupClaimedHubCase,
} from "../../../../tests/integration/315_hub_case.helpers.ts";

describe("phase5 hub case kernel", () => {
  it("creates a durable network request and hub child lineage from phase4 fallback", async () => {
    const service = createPhase5HubCaseKernelService({
      repositories: createPhase5HubCaseKernelStore(),
    });

    const request = await service.createNetworkBookingRequestFromPhase4Fallback(
      buildPhase4FallbackRequestCommand("315_unit_create"),
    );
    const created = await service.createHubCoordinationCaseFromNetworkRequest(
      buildCreateHubCaseCommand(
        "315_unit_create",
        request.networkBookingRequest.networkBookingRequestId,
      ),
    );

    expect(request.replayed).toBe(false);
    expect(created.hubCase.status).toBe("hub_requested");
    expect(created.hubCase.requestLineageRef).toBe(
      request.networkBookingRequest.requestLineageRef,
    );
    expect(created.hubCase.parentLineageCaseLinkRef).toBe(
      request.networkBookingRequest.originLineageCaseLinkRef,
    );
    expect(created.lineageCaseLink.parentLineageCaseLinkRef).toBe(
      request.networkBookingRequest.originLineageCaseLinkRef,
    );
    expect(created.transitionJournalEntry.previousStatus).toBe("none");
    expect(created.emittedEvents.map((event) => event.eventType)).toContain("hub.case.created");
  });

  it("fails closed on stale ownership fence and writes a rejected audit entry", async () => {
    const { service, claimed } = await setupClaimedHubCase("315_stale_fence");

    await expect(
      service.beginCandidateSearch(
        buildOwnedHubCommand(
          claimed.hubCase,
          "315_stale_fence",
          "begin_candidate_search",
          5,
          {
            expectedOwnershipFenceToken: "stale_fence_token",
            compiledPolicyBundleRef: "policy_bundle_315_stale_fence",
            enhancedAccessPolicyRef: "enhanced_access_policy_315_stale_fence",
            policyEvaluationRef: "policy_evaluation_315_stale_fence",
            policyTupleHash: "policy_tuple_315_stale_fence",
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: "STALE_OWNERSHIP_FENCE",
    });

    const bundle = await service.queryHubCaseBundle(claimed.hubCase.hubCoordinationCaseId);
    const lastJournal = bundle?.transitionJournal.at(-1);
    expect(bundle?.hubCase.status).toBe("claimed");
    expect(lastJournal?.transitionOutcome).toBe("rejected");
    expect(lastJournal?.failureCode).toBe("STALE_OWNERSHIP_FENCE");
  });

  it("requires release before close and then closes with the lineage branch intact", async () => {
    const { service, claimed } = await setupClaimedHubCase("315_close_gate");
    const bookedPath = await progressClaimedHubCaseToBookedViaService(
      service,
      claimed,
      "315_close_gate",
    );

    await expect(
      service.closeHubCase(
        buildOwnedHubCommand(bookedPath.booked.hubCase, "315_close_gate", "close_case", 13, {
          closeDecisionRef: "close_decision_315_close_gate",
        }),
      ),
    ).rejects.toMatchObject({
      code: "CLOSED_CASE_REQUIRES_RELEASED_OWNERSHIP",
    });

    const { released, closed } = await releaseAndCloseBookedCase(
      service,
      bookedPath.booked,
      "315_close_gate",
    );

    expect(released.hubCase.ownerState).toBe("unclaimed");
    expect(closed.hubCase.status).toBe("closed");
    expect(closed.hubCase.openCaseBlockerRefs).toEqual([]);
    expect(closed.lineageCaseLink.ownershipState).toBe("closed");
  });
});
