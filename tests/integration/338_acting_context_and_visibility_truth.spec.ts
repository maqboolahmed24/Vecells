import { describe, expect, it } from "vitest";

import {
  buildHubAuthorityCommand,
  setupHubScopeVisibilityHarness,
} from "./316_hub_scope_visibility.helpers.ts";
import {
  EXPECTED_VISIBLE_FIELDS_338,
  SECRET_VISIBILITY_FIELDS_338,
  materializeVisibilityProjection338,
} from "./338_scope_capacity.helpers.ts";

describe("338 acting context and visibility truth", () => {
  it("freezes writable posture when organisation scope drifts instead of silently widening mutation authority", async () => {
    const harness = await setupHubScopeVisibilityHarness("338_scope");

    const current = await harness.visibilityService.validateCurrentHubCommandScope(
      buildHubAuthorityCommand(
        {
          seed: "338_scope",
          staffIdentityContextId: harness.bootstrap.staffIdentityContext.staffIdentityContextId,
          actingContextId: harness.bootstrap.actingContext.actingContextId,
          scopeTupleHash: harness.bootstrap.actingContext.scopeTupleHash,
          minimumNecessaryContractRef: harness.bootstrap.actingContext.minimumNecessaryContractRef,
          visibilityEnvelopeId:
            harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
          hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
          expectedOwnershipEpoch: harness.claimed.hubCase.ownershipEpoch,
          expectedOwnershipFenceToken: harness.claimed.hubCase.ownershipFenceToken,
        },
        "begin_candidate_search",
        "hub_case_detail",
        6,
      ),
    );

    const drifted = await harness.visibilityService.validateCurrentHubCommandScope(
      buildHubAuthorityCommand(
        {
          seed: "338_scope",
          staffIdentityContextId: harness.bootstrap.staffIdentityContext.staffIdentityContextId,
          actingContextId: harness.bootstrap.actingContext.actingContextId,
          scopeTupleHash: harness.bootstrap.actingContext.scopeTupleHash,
          minimumNecessaryContractRef: harness.bootstrap.actingContext.minimumNecessaryContractRef,
          visibilityEnvelopeId:
            harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
          hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
          expectedOwnershipEpoch: harness.claimed.hubCase.ownershipEpoch,
          expectedOwnershipFenceToken: harness.claimed.hubCase.ownershipFenceToken,
        },
        "begin_candidate_search",
        "hub_case_detail",
        7,
        {
          observedActiveOrganisationRef: "ODS_338_scope",
        },
      ),
    );

    expect(current.decision).toBe("allowed");
    expect(current.authorityEvidence.scopeDrifted).toBe(false);
    expect(drifted.decision).toBe("stale");
    expect(drifted.reasonCode).toBe("organisation_switch");
    expect(drifted.authorityEvidence.scopeDrifted).toBe(true);
    expect(drifted.actingContext.contextState).toBe("stale");
    expect(drifted.visibilityEnvelope?.envelopeState).toBe("stale");
  });

  it("projects different minimum-necessary payloads for each audience tier without leaking withheld fields", async () => {
    const hub = await materializeVisibilityProjection338("hub_desk_visibility", "338_hub");
    const origin = await materializeVisibilityProjection338(
      "origin_practice_visibility",
      "338_origin",
    );
    const site = await materializeVisibilityProjection338(
      "servicing_site_visibility",
      "338_site",
    );

    const cases = [
      ["hub_desk_visibility", hub],
      ["origin_practice_visibility", origin],
      ["servicing_site_visibility", site],
    ] as const;

    for (const [tierId, result] of cases) {
      const visibleKeys = Object.keys(result.projection.visibleFields).sort();
      expect(visibleKeys).toEqual([...EXPECTED_VISIBLE_FIELDS_338[tierId]].sort());
      expect(Object.values(result.projection.visibleFields)).not.toContain("secret");
      expect(result.envelope.audienceTierRef).toBe(tierId);
      expect(result.envelope.envelopeState).toBe("current");
      for (const secretField of SECRET_VISIBILITY_FIELDS_338) {
        expect(visibleKeys).not.toContain(secretField);
      }
    }
    expect(hub.projection.withheldFieldRefs.length).toBeGreaterThan(0);
    expect(origin.projection.withheldFieldRefs.length).toBeGreaterThan(0);
    expect(site.projection.withheldFieldRefs.length).toBeGreaterThan(0);
  });
});
