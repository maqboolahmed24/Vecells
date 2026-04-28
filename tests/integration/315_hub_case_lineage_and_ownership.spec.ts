import { describe, expect, it } from "vitest";

import {
  buildHubCommand,
  buildOwnedHubCommand,
  createFallbackCallbackPath,
  setupClaimedHubCase,
} from "./315_hub_case.helpers.ts";

describe("315 hub case lineage and ownership", () => {
  it("preserves booking lineage and rejects hub mutation when the source booking branch is stale", async () => {
    const { service, request, created, claimed } = await setupClaimedHubCase("315_integration_stale");

    expect(created.hubCase.parentLineageCaseLinkRef).toBe(
      request.networkBookingRequest.originLineageCaseLinkRef,
    );
    expect(created.lineageCaseLink.parentLineageCaseLinkRef).toBe(
      request.networkBookingRequest.originLineageCaseLinkRef,
    );

    await expect(
      service.beginCandidateSearch(
        buildOwnedHubCommand(
          claimed.hubCase,
          "315_integration_stale",
          "begin_candidate_search",
          5,
          {
            sourceBookingBranchState: "stale",
            compiledPolicyBundleRef: "policy_bundle_315_integration_stale",
            enhancedAccessPolicyRef: "enhanced_access_policy_315_integration_stale",
            policyEvaluationRef: "policy_evaluation_315_integration_stale",
            policyTupleHash: "policy_tuple_315_integration_stale",
          },
        ),
      ),
    ).rejects.toMatchObject({
      code: "STALE_SOURCE_BOOKING_BRANCH",
    });

    const bundle = await service.queryHubCaseBundle(claimed.hubCase.hubCoordinationCaseId);
    expect(bundle?.transitionJournal.at(-1)?.failureCode).toBe("STALE_SOURCE_BOOKING_BRANCH");
  });

  it("surfaces stale-owner recovery explicitly and closes a callback branch only after release", async () => {
    const recoveryFlow = await setupClaimedHubCase("315_callback_recovery");

    const staleRecovery = await recoveryFlow.service.markStaleOwnerRecoveryPending(
      buildOwnedHubCommand(
        recoveryFlow.claimed.hubCase,
        "315_callback_recovery",
        "stale_owner_recovery",
        5,
        {
          activeOwnershipTransitionRef: "stale_owner_recovery_315_callback_recovery",
        },
      ),
    );

    const { callbackPending, callbackOffered, released, closed } =
      await createFallbackCallbackPath("315_callback_branch");

    expect(staleRecovery.hubCase.ownerState).toBe("stale_owner_recovery");
    expect(staleRecovery.hubCase.openCaseBlockerRefs).toContain("ownership_transition_open");
    expect(callbackPending.hubCase.status).toBe("callback_transfer_pending");
    expect(callbackOffered.hubCase.status).toBe("callback_offered");
    expect(released.hubCase.ownerState).toBe("unclaimed");
    expect(closed.hubCase.status).toBe("closed");
  });
});
