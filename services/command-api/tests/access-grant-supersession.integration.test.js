import { describe, expect, it } from "vitest";
import {
  ACCESS_GRANT_POLICY_VERSION,
  createAccessGrantSupersessionApplication,
  createInMemoryAccessGrantSupersessionRepository,
  accessGrantSupersessionMigrationPlanRefs,
  accessGrantSupersessionParallelInterfaceGaps,
  accessGrantSupersessionPersistenceTables,
} from "../src/access-grant-supersession.ts";

function routeTuple(overrides = {}) {
  return {
    routeFamily: "rf_phase2_claim_redemption",
    actionScope: "claim",
    governingObjectRef: "draft_public_181",
    governingObjectVersionRef: "draft_version_181_v1",
    sessionEpochRef: "session_epoch_181_v1",
    subjectBindingVersionRef: "binding_181_pending_v1",
    lineageFenceRef: "lineage_fence_181_v1",
    grantFamily: "claim_step_up",
    routeProfileRef: "RCP_180_DRAFT_CLAIM_INTO_AUTHENTICATED_ACCOUNT",
    releaseApprovalFreezeRef: null,
    manifestVersionRef: null,
    channelPosture: "web",
    embeddedPosture: "not_embedded",
    audienceScope: "patient_authenticated",
    visibilityScope: "authenticated_summary",
    ...overrides,
  };
}

function grantInput(overrides = {}) {
  const tuple = routeTuple(overrides.routeTuple ?? {});
  return {
    issueIdempotencyKey: "issue_181_claim",
    grantFamily: tuple.grantFamily,
    actionScope: tuple.actionScope,
    routeFamily: tuple.routeFamily,
    governingObjectRef: tuple.governingObjectRef,
    governingObjectVersionRef: tuple.governingObjectVersionRef,
    sessionEpochRef: tuple.sessionEpochRef,
    subjectBindingVersionRef: tuple.subjectBindingVersionRef,
    lineageFenceRef: tuple.lineageFenceRef,
    routeIntentBindingRef: "rib_181_claim",
    releaseApprovalFreezeRef: tuple.releaseApprovalFreezeRef,
    manifestVersionRef: tuple.manifestVersionRef,
    channelPosture: tuple.channelPosture,
    embeddedPosture: tuple.embeddedPosture,
    audienceScope: tuple.audienceScope,
    visibilityScope: tuple.visibilityScope,
    subjectRef: "nhs_subject_181",
    lineageScope: { lineageKind: "draft", lineageRef: "draft_public_181" },
    phiExposureClass: "minimal",
    recoveryRouteRef: "recovery://claim",
    opaqueToken: "token_181_claim",
    expiresAt: "2026-04-15T13:00:00.000Z",
    issuedBy: "AccessGrantService",
    issuedAt: "2026-04-15T12:00:00.000Z",
    ...overrides,
    routeTuple: undefined,
  };
}

function publicStatusGrantInput(overrides = {}) {
  const tuple = routeTuple({
    routeFamily: "rf_phase2_authenticated_request_status",
    actionScope: "status_view",
    governingObjectRef: "request_181",
    governingObjectVersionRef: "request_181_v1",
    grantFamily: "public_status_minimal",
    routeProfileRef: "RCP_180_AUTHENTICATED_REQUEST_STATUS_VIEW",
    visibilityScope: "public_safe_summary",
    ...overrides.routeTuple,
  });
  return grantInput({
    issueIdempotencyKey: "issue_181_public_status",
    grantFamily: "public_status_minimal",
    actionScope: "status_view",
    routeFamily: tuple.routeFamily,
    governingObjectRef: tuple.governingObjectRef,
    governingObjectVersionRef: tuple.governingObjectVersionRef,
    sessionEpochRef: tuple.sessionEpochRef,
    subjectBindingVersionRef: tuple.subjectBindingVersionRef,
    lineageFenceRef: tuple.lineageFenceRef,
    routeIntentBindingRef: "rib_181_public_status",
    releaseApprovalFreezeRef: tuple.releaseApprovalFreezeRef,
    manifestVersionRef: tuple.manifestVersionRef,
    channelPosture: tuple.channelPosture,
    embeddedPosture: tuple.embeddedPosture,
    audienceScope: tuple.audienceScope,
    visibilityScope: tuple.visibilityScope,
    lineageScope: { lineageKind: "request", lineageRef: "request_181" },
    recoveryRouteRef: "recovery://request-status",
    opaqueToken: "token_181_public_status",
    ...overrides,
  });
}

function claimInput(token, overrides = {}) {
  const tuple = routeTuple(overrides.routeTuple ?? {});
  return {
    claimIdempotencyKey: "claim_idem_181",
    publicId: "draft_public_181",
    presentedToken: token,
    routeTuple: tuple,
    routeIntentBinding: {
      routeIntentBindingRef: "rib_181_claim",
      bindingState: "live",
      routeFamily: tuple.routeFamily,
      actionScope: "claim",
      governingObjectRef: tuple.governingObjectRef,
      governingObjectVersionRef: tuple.governingObjectVersionRef,
      sessionEpochRef: tuple.sessionEpochRef,
      subjectBindingVersionRef: tuple.subjectBindingVersionRef,
      lineageFenceRef: tuple.lineageFenceRef,
    },
    session: {
      sessionRef: "session_181",
      sessionState: "active",
      sessionEpochRef: "session_epoch_181_v1",
      subjectRef: "nhs_subject_181",
      subjectBindingVersionRef: "binding_181_pending_v1",
    },
    sessionEstablishmentDecision: {
      sessionDecisionRef: "session_decision_181_claim_pending",
      writableAuthorityState: "claim_pending",
      sessionEpochRef: "session_epoch_181_v1",
      subjectBindingVersionRef: "binding_181_pending_v1",
    },
    capabilityDecision: {
      capabilityDecisionRef: "cap_181_allow_claim",
      decisionState: "allow",
      writableAuthorityState: "read_only",
      reasonCodes: ["CAP_180_CAPABILITY_ALLOW"],
    },
    identityPosture: {
      verificationLevel: "nhs_p9",
      completedStepUpRef: null,
    },
    bindingAuthority: {
      subjectRef: "nhs_subject_181",
      expectedCurrentBindingVersionRef: "binding_181_pending_v1",
      patientLinkDecisionRef: "pld_181_claim",
      targetPatientRef: "patient_181",
      confidence: {
        P_link: 0.992,
        LCB_link_alpha: 0.981,
        P_subject: 0.991,
        LCB_subject_alpha: 0.979,
        runnerUpProbabilityUpperBound: 0.01,
        gap_logit: 5.8,
        confidenceModelState: "calibrated",
      },
      provenanceRefs: ["pld_181_claim", "iev_181_auth_claim"],
      derivedLineageRefs: [{ lineageKind: "request", lineageRef: "request_181" }],
      actorRef: "claim_workflow",
    },
    sameLineageRecoveryAvailable: true,
    observedAt: "2026-04-15T12:05:00.000Z",
    ...overrides,
  };
}

function createHarness() {
  const repository = createInMemoryAccessGrantSupersessionRepository();
  const bindingCalls = [];
  const rotationCalls = [];
  const application = createAccessGrantSupersessionApplication({
    repository,
    identityBindingAuthority: {
      async settleClaimConfirmed(input) {
        bindingCalls.push(input);
        return {
          settlementRef: "ibas_181_claim_confirmed",
          bindingVersionRef: "binding_181_claimed_v2",
          decision: "accepted",
          reasonCodes: [
            "BINDING_179_ACCEPTED_APPEND_ONLY",
            "ACCESS_181_BINDING_AUTHORITY_CLAIM_CONFIRMED",
          ],
        };
      },
    },
    sessionGovernor: {
      async rotateAfterClaim(input) {
        rotationCalls.push(input);
        return {
          rotatedSessionEpochRef: "session_epoch_181_v2",
          sessionSettlementRef: "session_settlement_181_claim_rotation",
          reasonCodes: ["ACCESS_181_SESSION_ROTATED_AFTER_CLAIM"],
        };
      },
    },
  });
  return { application, repository, bindingCalls, rotationCalls };
}

describe("canonical AccessGrantService supersession workflows", () => {
  it("issues a grant with immutable AccessGrantScopeEnvelope and rejects manual_only", async () => {
    const { application, repository } = createHarness();

    const issued = await application.accessGrantService.issueGrant(
      grantInput({
        issueIdempotencyKey: "issue_181_scope",
        opaqueToken: "raw-token-181-scope",
      }),
    );

    await expect(
      application.accessGrantService.issueGrant(
        grantInput({
          issueIdempotencyKey: "issue_181_manual_only",
          grantFamily: "manual_only",
          opaqueToken: "manual_only",
        }),
      ),
    ).rejects.toThrow("manual_only");

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/096_phase2_access_grant_supersession.sql",
    );
    expect(application.migrationPlanRefs).toEqual(accessGrantSupersessionMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(accessGrantSupersessionPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(accessGrantSupersessionParallelInterfaceGaps);
    expect(application.policyVersion).toBe(ACCESS_GRANT_POLICY_VERSION);
    expect(issued.scopeEnvelope.scopeHash).toBe(issued.scopeEnvelope.immutableScopeHash);
    expect(issued.scopeEnvelope.createdByAuthority).toBe("AccessGrantService");
    expect(issued.grant.tokenHash).not.toBe("raw-token-181-scope");
    expect(JSON.stringify(repository.snapshots())).not.toContain("raw-token-181-scope");
  });

  it("returns the original result for duplicate token redemption", async () => {
    const { application, repository } = createHarness();
    const issued = await application.accessGrantService.issueGrant(publicStatusGrantInput());

    const first = await application.accessGrantService.redeemGrant({
      redemptionIdempotencyKey: "redeem_181_public_first",
      presentedToken: issued.materializedToken,
      routeTuple: routeTuple({
        routeFamily: "rf_phase2_authenticated_request_status",
        actionScope: "status_view",
        governingObjectRef: "request_181",
        governingObjectVersionRef: "request_181_v1",
        grantFamily: "public_status_minimal",
        routeProfileRef: "RCP_180_AUTHENTICATED_REQUEST_STATUS_VIEW",
        visibilityScope: "public_safe_summary",
      }),
      actorRef: "nhs_subject_181",
      observedAt: "2026-04-15T12:10:00.000Z",
    });
    const second = await application.accessGrantService.redeemGrant({
      redemptionIdempotencyKey: "redeem_181_public_second_device",
      presentedToken: issued.materializedToken,
      routeTuple: routeTuple({
        routeFamily: "rf_phase2_authenticated_request_status",
        actionScope: "status_view",
        governingObjectRef: "request_181",
        governingObjectVersionRef: "request_181_v1",
        grantFamily: "public_status_minimal",
        routeProfileRef: "RCP_180_AUTHENTICATED_REQUEST_STATUS_VIEW",
        visibilityScope: "public_safe_summary",
      }),
      actorRef: "nhs_subject_181",
      observedAt: "2026-04-15T12:10:03.000Z",
    });

    expect(first.redemption.decision).toBe("redeemed");
    expect(second.replayed).toBe(true);
    expect(second.redemption.redemptionRef).toBe(first.redemption.redemptionRef);
    expect(second.redemption.reasonCodes).toContain("ACCESS_181_REPLAY_RETURNED");
    expect(repository.snapshots().redemptions).toHaveLength(1);
  });

  it("downgrades stale scope to same-lineage recovery and writes supersession", async () => {
    const { application, repository } = createHarness();
    const issued = await application.accessGrantService.issueGrant(
      publicStatusGrantInput({ issueIdempotencyKey: "issue_181_stale_scope" }),
    );

    const result = await application.accessGrantService.redeemGrant({
      redemptionIdempotencyKey: "redeem_181_stale_scope",
      presentedToken: issued.materializedToken,
      routeTuple: routeTuple({
        routeFamily: "rf_phase2_authenticated_request_status",
        actionScope: "status_view",
        governingObjectRef: "request_181",
        governingObjectVersionRef: "request_181_v2",
        grantFamily: "public_status_minimal",
        routeProfileRef: "RCP_180_AUTHENTICATED_REQUEST_STATUS_VIEW",
        visibilityScope: "public_safe_summary",
      }),
      actorRef: "nhs_subject_181",
      sameLineageRecoveryAvailable: true,
      observedAt: "2026-04-15T12:15:00.000Z",
    });

    expect(result.redemption.decision).toBe("recover_only");
    expect(result.redemption.recoveryRouteRef).toBe("recovery://request-status");
    expect(result.supersession?.causeClass).toBe("scope_drift");
    expect(result.scopeAuthorization?.authorizationState).toBe("recover_only");
    expect(repository.snapshots().supersessions).toHaveLength(1);
    expect(repository.snapshots().grants[0]?.grantState).toBe("recover_only");
  });

  it("records replacement grant supersession chains", async () => {
    const { application, repository } = createHarness();
    const issued = await application.accessGrantService.issueGrant(
      grantInput({
        issueIdempotencyKey: "issue_181_replace_old",
        opaqueToken: "token_181_replace_old",
      }),
    );

    const replacement = await application.accessGrantService.replaceGrant({
      supersessionIdempotencyKey: "replace_181_secure_link",
      predecessorGrantRef: issued.grant.grantRef,
      causeClass: "secure_link_reissue",
      actorRef: "AccessGrantService",
      observedAt: "2026-04-15T12:20:00.000Z",
      issue: grantInput({
        issueIdempotencyKey: "issue_181_replace_new",
        opaqueToken: "token_181_replace_new",
      }),
    });

    expect(replacement.supersession.successorGrantRef).toBe(replacement.replacement.grant.grantRef);
    expect(replacement.supersession.causeClass).toBe("secure_link_reissue");
    expect(
      repository.snapshots().grants.find((grant) => grant.grantRef === issued.grant.grantRef)
        ?.grantState,
    ).toBe("rotated");
    expect(repository.snapshots().supersessions[0]?.reasonCodes).toContain(
      "ACCESS_181_REPLACEMENT_GRANT_SUPERSEDES_PREDECESSOR",
    );
  });

  it("redeems claim through IdentityBindingAuthority and SessionGovernor without direct ownership writes", async () => {
    const { application, repository, bindingCalls, rotationCalls } = createHarness();
    const claimGrant = await application.accessGrantService.issueGrant(
      grantInput({
        issueIdempotencyKey: "issue_181_claim_success",
        opaqueToken: "token_181_claim_success",
      }),
    );
    const publicGrant = await application.accessGrantService.issueGrant(
      publicStatusGrantInput({
        issueIdempotencyKey: "issue_181_public_to_supersede",
        opaqueToken: "token_181_public_to_supersede",
      }),
    );

    const result = await application.accessGrantService.redeemClaim(
      claimInput(claimGrant.materializedToken, {
        claimIdempotencyKey: "claim_181_success",
        stalePublicGrantRefs: [publicGrant.grant.grantRef],
      }),
    );

    expect(result.settlement.decision).toBe("claim_confirmed");
    expect(result.redemption?.decision).toBe("redeemed");
    expect(result.bindingAuthoritySettlementRef).toBe("ibas_181_claim_confirmed");
    expect(result.rotatedSessionEpochRef).toBe("session_epoch_181_v2");
    expect(result.settlement.reasonCodes).toContain("ACCESS_181_NO_DIRECT_PATIENT_REF_MUTATION");
    expect(bindingCalls).toHaveLength(1);
    expect(bindingCalls[0].routeIntentBindingRef).toBe("rib_181_claim");
    expect(rotationCalls).toHaveLength(1);
    expect(result.supersessions).toHaveLength(2);
    expect(repository.snapshots().claimSettlements).toHaveLength(1);
    expect(JSON.stringify(repository.snapshots())).not.toContain(".patientRef =");
  });

  it("returns settled claim on cross-device replay without second authority calls", async () => {
    const { application, repository, bindingCalls, rotationCalls } = createHarness();
    const claimGrant = await application.accessGrantService.issueGrant(
      grantInput({
        issueIdempotencyKey: "issue_181_claim_replay",
        opaqueToken: "token_181_claim_replay",
      }),
    );

    const first = await application.accessGrantService.redeemClaim(
      claimInput(claimGrant.materializedToken, {
        claimIdempotencyKey: "claim_181_replay_first",
      }),
    );
    const second = await application.accessGrantService.redeemClaim(
      claimInput(claimGrant.materializedToken, {
        claimIdempotencyKey: "claim_181_replay_second_device",
        session: {
          sessionRef: "session_181_other_device",
          sessionState: "active",
          sessionEpochRef: "session_epoch_181_other",
          subjectRef: "nhs_subject_181",
          subjectBindingVersionRef: "binding_181_pending_v1",
        },
      }),
    );

    expect(first.settlement.decision).toBe("claim_confirmed");
    expect(second.replayed).toBe(true);
    expect(second.settlement.claimSettlementRef).toBe(first.settlement.claimSettlementRef);
    expect(second.settlement.reasonCodes).toContain("ACCESS_181_CLAIM_REPLAY_RETURNED");
    expect(bindingCalls).toHaveLength(1);
    expect(rotationCalls).toHaveLength(1);
    expect(repository.snapshots().claimSettlements).toHaveLength(1);
  });

  it("settles step_up_required without binding handoff when verification is too low", async () => {
    const { application, repository, bindingCalls, rotationCalls } = createHarness();
    const claimGrant = await application.accessGrantService.issueGrant(
      grantInput({
        issueIdempotencyKey: "issue_181_claim_step_up",
        opaqueToken: "token_181_claim_step_up",
      }),
    );

    const result = await application.accessGrantService.redeemClaim(
      claimInput(claimGrant.materializedToken, {
        claimIdempotencyKey: "claim_181_step_up_required",
        identityPosture: {
          verificationLevel: "nhs_low",
          completedStepUpRef: null,
        },
      }),
    );

    expect(result.settlement.decision).toBe("step_up_required");
    expect(result.settlement.recoveryRouteRef).toBe("step-up://claim-nhs-p9");
    expect(result.redemption?.decision).toBe("redeemed");
    expect(bindingCalls).toHaveLength(0);
    expect(rotationCalls).toHaveLength(0);
    expect(repository.snapshots().claimSettlements[0]?.reasonCodes).toContain(
      "ACCESS_181_CLAIM_STEP_UP_REQUIRED",
    );
  });
});
