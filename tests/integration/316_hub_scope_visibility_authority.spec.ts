import { describe, expect, it } from "vitest";

import {
  buildHubAuthorityCommand,
  buildOwnedHubCommand,
  setupHubScopeVisibilityHarness,
} from "./316_hub_scope_visibility.helpers.ts";

describe("316 hub scope and visibility authority", () => {
  it("authorizes a current hub mutation only when scope, visibility envelope, and ownership fence all align", async () => {
    const harness = await setupHubScopeVisibilityHarness("316_integration_allowed");

    const authority = await harness.visibilityService.assertCurrentHubCommandScope(
      buildHubAuthorityCommand(
        {
          seed: "316_integration_allowed",
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

    const searched = await harness.service.beginCandidateSearch(
      buildOwnedHubCommand(
        harness.claimed.hubCase,
        "316_integration_allowed",
        "begin_candidate_search",
        6,
        {
          compiledPolicyBundleRef: "policy_bundle_316_integration_allowed",
          enhancedAccessPolicyRef: "enhanced_access_policy_316_integration_allowed",
          policyEvaluationRef: "policy_evaluation_316_integration_allowed",
          policyTupleHash: "policy_tuple_316_integration_allowed",
        },
      ),
    );

    expect(authority.decision).toBe("allowed");
    expect(authority.visibilityEnvelope?.envelopeState).toBe("current");
    expect(authority.authorityEvidence.decision).toBe("allowed");
    expect(searched.hubCase.status).toBe("candidate_searching");
  });

  it("freezes writable posture when the actor presents a stale organisation scope", async () => {
    const harness = await setupHubScopeVisibilityHarness("316_integration_drift");

    const authority = await harness.visibilityService.validateCurrentHubCommandScope(
      buildHubAuthorityCommand(
        {
          seed: "316_integration_drift",
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
        {
          observedActiveOrganisationRef: "ODS_316_integration_drift",
        },
      ),
    );

    expect(authority.decision).toBe("stale");
    expect(authority.reasonCode).toBe("organisation_switch");
    expect(authority.driftDetection.driftClasses).toContain("organisation_switch");
    expect(authority.authorityEvidence.scopeDrifted).toBe(true);
    expect(authority.actingContext.contextState).toBe("stale");
  });

  it("rejects ownership-sensitive writes when the ownership fence is stale even if the scope is current", async () => {
    const harness = await setupHubScopeVisibilityHarness("316_integration_fence");

    const authority = await harness.visibilityService.validateCurrentHubCommandScope(
      buildHubAuthorityCommand(
        {
          seed: "316_integration_fence",
          staffIdentityContextId: harness.bootstrap.staffIdentityContext.staffIdentityContextId,
          actingContextId: harness.bootstrap.actingContext.actingContextId,
          scopeTupleHash: harness.bootstrap.actingContext.scopeTupleHash,
          minimumNecessaryContractRef: harness.bootstrap.actingContext.minimumNecessaryContractRef,
          visibilityEnvelopeId:
            harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
          hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
          expectedOwnershipEpoch: harness.claimed.hubCase.ownershipEpoch,
          expectedOwnershipFenceToken: "stale_fence_token",
        },
        "begin_candidate_search",
        "hub_case_detail",
        6,
      ),
    );

    expect(authority.decision).toBe("stale");
    expect(authority.reasonCode).toBe("stale_ownership_fence");
    expect(authority.authorityEvidence.ownershipDrifted).toBe(true);
  });
});
