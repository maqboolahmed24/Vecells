import { describe, expect, it } from "vitest";

import {
  buildHubCommand,
  buildOwnedHubCommand,
  createFallbackCallbackPath,
  progressClaimedHubCaseToBookedViaService,
  releaseAndCloseBookedCase,
  setupClaimedHubCase,
} from "../integration/315_hub_case.helpers.ts";

describe("315 hub case kernel properties", () => {
  it("keeps one request lineage and parent booking link across booked and callback completion paths", async () => {
    const bookedFlow = await setupClaimedHubCase("315_property_booked");
    const bookedPath = await progressClaimedHubCaseToBookedViaService(
      bookedFlow.service,
      bookedFlow.claimed,
      "315_property_booked",
    );
    const bookedClosed = await releaseAndCloseBookedCase(
      bookedFlow.service,
      bookedPath.booked,
      "315_property_booked",
    );

    const callbackPath = await createFallbackCallbackPath("315_property_callback");

    const cases = [bookedClosed.closed, callbackPath.closed];
    for (const result of cases) {
      expect(result.hubCase.requestLineageRef).toMatch(/^request_lineage_/);
      expect(result.hubCase.parentLineageCaseLinkRef).toMatch(/^booking_lineage_/);
      expect(result.lineageCaseLink.requestLineageRef).toBe(result.hubCase.requestLineageRef);
      expect(result.lineageCaseLink.parentLineageCaseLinkRef).toBe(
        result.hubCase.parentLineageCaseLinkRef,
      );
      expect(result.hubCase.openCaseBlockerRefs).toEqual([]);
      expect(result.hubCase.status).toBe("closed");
    }
  });

  it("monotonically advances ownership epoch across claim, recovery, reclaim, and release", async () => {
    const { service, claimed } = await setupClaimedHubCase("315_property_epoch");

    const staleRecovery = await service.markStaleOwnerRecoveryPending(
      buildOwnedHubCommand(claimed.hubCase, "315_property_epoch", "stale_owner_recovery", 5, {
        activeOwnershipTransitionRef: "stale_owner_recovery_315_property_epoch",
      }),
    );
    const reclaimed = await service.claimHubCase(
      buildHubCommand(
        staleRecovery.hubCase.hubCoordinationCaseId,
        "315_property_epoch",
        "reclaim_case",
        6,
        {
          expectedOwnershipEpoch: staleRecovery.hubCase.ownershipEpoch,
          claimedBy: "coordinator_reclaimed_315_property_epoch",
          actingOrg: {
            organisationRef: "hub_org_315_property_epoch",
            organisationKind: "hub",
            siteRef: "hub_site_315_property_epoch",
          },
          ownershipLeaseRef: "lease_315_property_epoch_reclaimed",
          newOwnershipFenceToken: "fence_315_property_epoch_reclaimed",
        },
      ),
    );
    const released = await service.releaseHubCase(
      buildOwnedHubCommand(reclaimed.hubCase, "315_property_epoch", "release_case", 7),
    );

    expect(staleRecovery.hubCase.ownershipEpoch).toBeGreaterThan(claimed.hubCase.ownershipEpoch);
    expect(reclaimed.hubCase.ownershipEpoch).toBeGreaterThan(
      staleRecovery.hubCase.ownershipEpoch,
    );
    expect(released.hubCase.ownershipEpoch).toBeGreaterThan(reclaimed.hubCase.ownershipEpoch);
    expect(released.hubCase.ownerState).toBe("unclaimed");
  });
});
