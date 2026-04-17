import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  createAccessGrantService,
  createIdentityAccessStore,
  createIdentityBindingAuthorityService,
  validateIdentityAccessLedgerState,
} from "../src/index.ts";
import { RequestAggregate, createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

async function seedLineage() {
  const store = createIdentityAccessStore();
  const episode = EpisodeAggregate.create({
    episodeId: "episode_068_primary",
    episodeFingerprint: "episode_fp_068_primary",
    openedAt: "2026-04-12T14:00:00Z",
  });
  const request = RequestAggregate.create({
    requestId: "request_068_primary",
    episodeId: episode.episodeId,
    originEnvelopeRef: "envelope_068_primary",
    promotionRecordRef: "promotion_068_primary",
    tenantId: "tenant_068",
    sourceChannel: "self_service_form",
    originIngressRecordRef: "ingress_068_primary",
    normalizedSubmissionRef: "normalized_068_primary",
    requestType: "clinical_question",
    requestLineageRef: "lineage_068_primary",
    createdAt: "2026-04-12T14:00:00Z",
  });
  await store.saveEpisode(episode);
  await store.saveRequest(request);
  return { store, episode, request };
}

describe("identity access backbone", () => {
  it("appends identity binding versions and derives request, episode, and patient link state", async () => {
    const { store, request, episode } = await seedLineage();
    const authority = createIdentityBindingAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par068_binding"),
    );

    const first = await authority.settleBinding({
      requestId: request.requestId,
      episodeId: episode.episodeId,
      subjectRef: "subject_068_primary",
      candidatePatientRefs: ["patient_candidate_068_a", "patient_candidate_068_b"],
      candidateSetRef: "candidate_set_068_v1",
      bindingState: "provisional_verified",
      ownershipState: "claim_pending",
      decisionClass: "provisional_verify",
      assuranceLevel: "medium",
      verifiedContactRouteRef: "contact_route_068_sms",
      matchEvidenceRef: "match_evidence_068_v1",
      linkProbability: 0.86,
      linkProbabilityLowerBound: 0.78,
      runnerUpProbabilityUpperBound: 0.2,
      subjectProofProbabilityLowerBound: 0.81,
      gapLogit: 2.41,
      calibrationVersionRef: "calibration_068_v1",
      confidenceModelState: "calibrated",
      bindingAuthorityRef: "identity_binding_authority_068",
      patientLinkProvenanceRef: "auth_callback_068",
      patientLinkEvaluatedAt: "2026-04-12T14:01:00Z",
      patientLinkExpiresAt: "2026-04-12T15:01:00Z",
      createdAt: "2026-04-12T14:01:00Z",
    });

    expect(first.binding.toSnapshot().bindingVersion).toBe(1);
    expect(first.request.toSnapshot().patientRef).toBeNull();
    expect(first.request.toSnapshot().identityState).toBe("partial_match");
    expect(first.episode.toSnapshot().currentIdentityBindingRef).toBe(first.binding.bindingId);
    expect(first.patientLink.toSnapshot().patientRef).toBe("patient_candidate_068_a");
    expect(first.patientLink.toSnapshot().bindingVersionRef).toBe(`${first.binding.bindingId}@v1`);

    const second = await authority.settleBinding({
      requestId: request.requestId,
      episodeId: episode.episodeId,
      subjectRef: "subject_068_primary",
      patientRef: "patient_068_primary",
      runnerUpPatientRef: "patient_candidate_068_b",
      candidatePatientRefs: ["patient_068_primary", "patient_candidate_068_b"],
      candidateSetRef: "candidate_set_068_v2",
      bindingState: "verified_patient",
      ownershipState: "claimed",
      decisionClass: "claim_confirmed",
      assuranceLevel: "high",
      verifiedContactRouteRef: "contact_route_068_sms",
      matchEvidenceRef: "match_evidence_068_v2",
      linkProbability: 0.99,
      linkProbabilityLowerBound: 0.97,
      runnerUpProbabilityUpperBound: 0.04,
      subjectProofProbabilityLowerBound: 0.96,
      gapLogit: 6.2,
      calibrationVersionRef: "calibration_068_v2",
      confidenceModelState: "calibrated",
      bindingAuthorityRef: "identity_binding_authority_068",
      stepUpMethod: "nhs_login_subject_and_phone_match",
      expectedCurrentBindingRef: first.binding.bindingId,
      patientLinkProvenanceRef: "claim_path_068",
      patientLinkEvaluatedAt: "2026-04-12T14:05:00Z",
      patientLinkExpiresAt: "2026-04-12T15:05:00Z",
      createdAt: "2026-04-12T14:05:00Z",
    });

    const updatedRequest = await store.getRequest(request.requestId);
    const updatedEpisode = await store.getEpisode(episode.episodeId);
    const updatedFirst = await store.getIdentityBinding(first.binding.bindingId);

    expect(second.binding.toSnapshot().bindingVersion).toBe(2);
    expect(second.binding.toSnapshot().supersedesBindingRef).toBe(first.binding.bindingId);
    expect(updatedFirst?.toSnapshot().supersededByRef).toBe(second.binding.bindingId);
    expect(updatedRequest?.toSnapshot().patientRef).toBe("patient_068_primary");
    expect(updatedRequest?.toSnapshot().identityState).toBe("claimed");
    expect(updatedEpisode?.toSnapshot().patientRef).toBe("patient_068_primary");
    expect(second.patientLink.toSnapshot().patientRef).toBe("patient_068_primary");
  });

  it("requires repair refs for correction-applied and revoked binding decisions", async () => {
    const { store, request, episode } = await seedLineage();
    const authority = createIdentityBindingAuthorityService(
      store,
      createDeterministicBackboneIdGenerator("par068_repair"),
    );

    await expect(
      authority.settleBinding({
        requestId: request.requestId,
        episodeId: episode.episodeId,
        subjectRef: "subject_068_wrong_patient",
        candidatePatientRefs: ["patient_068_wrong"],
        candidateSetRef: "candidate_set_068_wrong",
        bindingState: "corrected",
        ownershipState: "claimed",
        decisionClass: "correction_applied",
        assuranceLevel: "high",
        matchEvidenceRef: "match_evidence_068_wrong",
        linkProbability: 0.98,
        linkProbabilityLowerBound: 0.97,
        runnerUpProbabilityUpperBound: 0.02,
        subjectProofProbabilityLowerBound: 0.96,
        gapLogit: 5.9,
        calibrationVersionRef: "calibration_068_v2",
        confidenceModelState: "calibrated",
        bindingAuthorityRef: "identity_binding_authority_068",
        createdAt: "2026-04-12T14:10:00Z",
      }),
    ).rejects.toThrow(/repair/i);
  });

  it("issues immutable scope envelopes and returns the same redemption on exact replay", async () => {
    const { store } = await seedLineage();
    const grants = createAccessGrantService(
      store,
      createDeterministicBackboneIdGenerator("par068_grants"),
    );

    const issued = await grants.issueGrant({
      grantFamily: "claim_step_up",
      actionScope: "claim",
      lineageScope: "request",
      routeFamilyRef: "rf_patient_claim",
      governingObjectRef: "request_068_primary",
      governingVersionRef: "request_068_primary_v1",
      phiExposureClass: "none",
      issuedRouteIntentBindingRef: "route_intent_068_claim",
      requiredIdentityBindingRef: "binding_required_068_claim",
      requiredReleaseApprovalFreezeRef: "release_freeze_068_claim",
      requiredChannelReleaseFreezeRef: null,
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_068_claim",
      minimumBridgeCapabilitiesRef: null,
      requiredAssuranceSliceTrustRefs: ["assurance_slice_068_claim"],
      recoveryRouteRef: "rf_recover_claim",
      subjectRef: "subject_068_primary",
      boundPatientRef: null,
      issuedIdentityBindingRef: "binding_required_068_claim",
      boundContactRouteRef: "contact_route_068_email",
      subjectBindingMode: "soft_subject",
      tokenKeyVersionRef: "token_key_068_v1",
      validatorVersionRef: "claim_step_up_validator::v1",
      issuedSessionEpochRef: "session_epoch_068_v1",
      issuedSubjectBindingVersionRef: "binding_required_068_claim@v2",
      issuedLineageFenceEpoch: 4,
      presentedToken: "public-token-068-claim",
      expiresAt: "2026-04-12T15:30:00Z",
      createdAt: "2026-04-12T14:30:00Z",
    });

    expect(issued.scopeEnvelope.toSnapshot().scopeHash).toHaveLength(64);
    expect(issued.grant.toSnapshot().grantState).toBe("live");

    const first = await grants.redeemGrant({
      presentedToken: "public-token-068-claim",
      context: {
        routeFamily: "rf_patient_claim",
        actionScope: "claim",
        lineageScope: "request",
        governingObjectRef: "request_068_primary",
        governingVersionRef: "request_068_primary_v1",
        identityBindingRef: "binding_required_068_claim",
        releaseApprovalFreezeRef: "release_freeze_068_claim",
        audienceSurfaceRuntimeBindingRef: "audience_runtime_068_claim",
        assuranceSliceTrustRefs: ["assurance_slice_068_claim"],
        lineageFenceEpoch: 4,
        sessionEpochRef: "session_epoch_068_v1",
        subjectBindingVersionRef: "binding_required_068_claim@v2",
        tokenKeyVersionRef: "token_key_068_v1",
        routeIntentBindingRef: "route_intent_068_claim",
      },
      recordedAt: "2026-04-12T14:31:00Z",
      resultingSessionRef: "session_068_claim",
      resultingRouteIntentBindingRef: "route_intent_068_claim",
    });
    const replay = await grants.redeemGrant({
      presentedToken: "public-token-068-claim",
      context: {
        routeFamily: "rf_patient_claim",
        actionScope: "claim",
        lineageScope: "request",
        governingObjectRef: "request_068_primary",
        governingVersionRef: "request_068_primary_v1",
        identityBindingRef: "binding_required_068_claim",
        releaseApprovalFreezeRef: "release_freeze_068_claim",
        audienceSurfaceRuntimeBindingRef: "audience_runtime_068_claim",
        assuranceSliceTrustRefs: ["assurance_slice_068_claim"],
        lineageFenceEpoch: 4,
        sessionEpochRef: "session_epoch_068_v1",
        subjectBindingVersionRef: "binding_required_068_claim@v2",
        tokenKeyVersionRef: "token_key_068_v1",
        routeIntentBindingRef: "route_intent_068_claim",
      },
      recordedAt: "2026-04-12T14:31:05Z",
      resultingSessionRef: "session_068_claim_replay",
      resultingRouteIntentBindingRef: "route_intent_068_claim_replay",
    });

    expect(first.replayed).toBe(false);
    expect(first.redemption?.toSnapshot().decision).toBe("allow");
    expect(first.redemption?.toSnapshot().decisionReasonCodes).toContain("GRANT_SCOPE_MATCHED");
    expect(replay.replayed).toBe(true);
    expect(replay.redemption?.redemptionId).toBe(first.redemption?.redemptionId);
  });

  it("records explicit supersession and keeps superseded grants out of live posture", async () => {
    const { store } = await seedLineage();
    const grants = createAccessGrantService(
      store,
      createDeterministicBackboneIdGenerator("par068_supersede"),
    );

    const initial = await grants.issueGrant({
      grantFamily: "support_recovery_minimal",
      actionScope: "contact_route_repair",
      lineageScope: "request",
      routeFamilyRef: "rf_contact_repair",
      governingObjectRef: "request_068_primary",
      governingVersionRef: "request_068_primary_v1",
      phiExposureClass: "minimal",
      issuedRouteIntentBindingRef: "route_intent_068_repair",
      requiredIdentityBindingRef: "binding_required_068_repair",
      requiredReleaseApprovalFreezeRef: "release_freeze_068_repair",
      requiredChannelReleaseFreezeRef: "channel_freeze_068_repair",
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_068_repair",
      minimumBridgeCapabilitiesRef: "bridge_caps_068_repair",
      requiredAssuranceSliceTrustRefs: ["assurance_slice_068_repair"],
      recoveryRouteRef: "rf_recover_contact_route",
      subjectRef: "subject_068_primary",
      boundPatientRef: "patient_068_primary",
      issuedIdentityBindingRef: "binding_required_068_repair",
      boundContactRouteRef: "contact_route_068_sms",
      subjectBindingMode: "hard_subject",
      tokenKeyVersionRef: "token_key_068_v2",
      validatorVersionRef: "support_recovery_minimal_validator::v1",
      issuedSessionEpochRef: "session_epoch_068_v2",
      issuedSubjectBindingVersionRef: "binding_required_068_repair@v3",
      issuedLineageFenceEpoch: 8,
      presentedToken: "support-recovery-068-v1",
      expiresAt: "2026-04-12T16:00:00Z",
      createdAt: "2026-04-12T14:40:00Z",
    });

    const superseded = await grants.supersedeGrants({
      causeClass: "manual_revoke",
      supersededGrantRefs: [initial.grant.grantId],
      governingObjectRef: "request_068_primary",
      lineageFenceEpoch: 9,
      sessionEpochRef: "session_epoch_068_v3",
      subjectBindingVersionRef: "binding_required_068_repair@v4",
      reasonCodes: ["MANUAL_REVOKE_REQUESTED"],
      recordedAt: "2026-04-12T14:45:00Z",
      replacementGrant: {
        grantFamily: "support_recovery_minimal",
        actionScope: "contact_route_repair",
        lineageScope: "request",
        routeFamilyRef: "rf_contact_repair",
        governingObjectRef: "request_068_primary",
        governingVersionRef: "request_068_primary_v2",
        phiExposureClass: "minimal",
        issuedRouteIntentBindingRef: "route_intent_068_repair_v2",
        requiredIdentityBindingRef: "binding_required_068_repair",
        requiredReleaseApprovalFreezeRef: "release_freeze_068_repair_v2",
        requiredChannelReleaseFreezeRef: "channel_freeze_068_repair_v2",
        requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_068_repair_v2",
        minimumBridgeCapabilitiesRef: "bridge_caps_068_repair_v2",
        requiredAssuranceSliceTrustRefs: ["assurance_slice_068_repair"],
        recoveryRouteRef: "rf_recover_contact_route",
        subjectRef: "subject_068_primary",
        boundPatientRef: "patient_068_primary",
        issuedIdentityBindingRef: "binding_required_068_repair",
        boundContactRouteRef: "contact_route_068_sms",
        subjectBindingMode: "hard_subject",
        tokenKeyVersionRef: "token_key_068_v3",
        validatorVersionRef: "support_recovery_minimal_validator::v1",
        issuedSessionEpochRef: "session_epoch_068_v3",
        issuedSubjectBindingVersionRef: "binding_required_068_repair@v4",
        issuedLineageFenceEpoch: 9,
        presentedToken: "support-recovery-068-v2",
        expiresAt: "2026-04-12T16:30:00Z",
        createdAt: "2026-04-12T14:45:00Z",
      },
    });

    const ledgerIssues = await validateIdentityAccessLedgerState(store);

    expect(superseded.supersession.toSnapshot().replacementGrantRef).toBe(
      superseded.replacementGrant?.grantId,
    );
    expect(superseded.supersededGrants[0].toSnapshot().grantState).toBe("rotated");
    expect(superseded.replacementGrant?.toSnapshot().grantState).toBe("live");
    expect(ledgerIssues).toEqual([]);
  });

  it("issues opaque use-case grants, blocks anonymous in-place upgrade, and replays redemption exactly once", async () => {
    const { store } = await seedLineage();
    const grants = createAccessGrantService(
      store,
      createDeterministicBackboneIdGenerator("par078_opaque_issue"),
    );

    const issued = await grants.issueGrantForUseCase({
      useCase: "message_reply",
      routeFamilyRef: "rf_patient_messages",
      governingObjectRef: "message_thread_078_primary",
      governingVersionRef: "message_thread_078_primary_v1",
      issuedRouteIntentBindingRef: "route_intent_078_message_reply",
      requiredIdentityBindingRef: "binding_required_078_message_reply",
      requiredReleaseApprovalFreezeRef: "release_freeze_078_message_reply",
      requiredChannelReleaseFreezeRef: null,
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_078_message_reply",
      minimumBridgeCapabilitiesRef: null,
      requiredAssuranceSliceTrustRefs: ["assurance_slice_078_message_reply"],
      recoveryRouteRef: "rf_recover_message_reply",
      subjectRef: "subject_078_primary",
      boundPatientRef: "patient_078_primary",
      issuedIdentityBindingRef: "binding_required_078_message_reply",
      boundContactRouteRef: "contact_route_078_sms",
      tokenKeyVersionRef: "token_key_local_v1",
      validatorVersionRef: "transaction_action_minimal_validator::v1",
      issuedSessionEpochRef: "session_epoch_078_v1",
      issuedSubjectBindingVersionRef: "binding_required_078_message_reply@v1",
      issuedLineageFenceEpoch: 6,
      presentedToken: "",
      transportClass: "email",
      expiresAt: "2026-04-12T15:45:00Z",
      createdAt: "2026-04-12T15:00:00Z",
    });

    expect(issued.outcome).toBe("issued");
    expect(issued.materializedToken?.opaqueToken.startsWith("ag.token_key_local_v1.")).toBe(true);
    expect(issued.grant.toSnapshot().grantState).toBe("live");

    const first = await grants.redeemGrant({
      presentedToken: issued.materializedToken!.opaqueToken,
      context: {
        routeFamily: "rf_patient_messages",
        actionScope: "message_reply",
        lineageScope: "request",
        governingObjectRef: "message_thread_078_primary",
        governingVersionRef: "message_thread_078_primary_v1",
        routeIntentBindingRef: "route_intent_078_message_reply",
        routeIntentTupleHash: "tuple_hash_078_message_reply",
        routeContractDigestRef: "digest078message0001",
        routeIntentBindingState: "live",
        identityBindingRef: "binding_required_078_message_reply",
        releaseApprovalFreezeRef: "release_freeze_078_message_reply",
        audienceSurfaceRuntimeBindingRef: "audience_runtime_078_message_reply",
        assuranceSliceTrustRefs: ["assurance_slice_078_message_reply"],
        lineageFenceEpoch: 6,
        sessionEpochRef: "session_epoch_078_v1",
        subjectBindingVersionRef: "binding_required_078_message_reply@v1",
        tokenKeyVersionRef: "token_key_local_v1",
      },
      recordedAt: "2026-04-12T15:05:00Z",
      currentSession: {
        sessionRef: "session_078_anon",
        subjectRef: null,
        identityBindingRef: null,
        sessionState: "anonymous",
        routeAuthorityState: "none",
        sessionEpochRef: null,
        subjectBindingVersionRef: null,
        csrfSecretRef: "csrf_anon_078",
      },
    });
    const replay = await grants.redeemGrant({
      presentedToken: issued.materializedToken!.opaqueToken,
      context: {
        routeFamily: "rf_patient_messages",
        actionScope: "message_reply",
        lineageScope: "request",
        governingObjectRef: "message_thread_078_primary",
        governingVersionRef: "message_thread_078_primary_v1",
        routeIntentBindingRef: "route_intent_078_message_reply",
        routeIntentTupleHash: "tuple_hash_078_message_reply",
        routeContractDigestRef: "digest078message0001",
        routeIntentBindingState: "live",
        identityBindingRef: "binding_required_078_message_reply",
        releaseApprovalFreezeRef: "release_freeze_078_message_reply",
        audienceSurfaceRuntimeBindingRef: "audience_runtime_078_message_reply",
        assuranceSliceTrustRefs: ["assurance_slice_078_message_reply"],
        lineageFenceEpoch: 6,
        sessionEpochRef: "session_epoch_078_v1",
        subjectBindingVersionRef: "binding_required_078_message_reply@v1",
        tokenKeyVersionRef: "token_key_local_v1",
      },
      recordedAt: "2026-04-12T15:05:20Z",
    });

    expect(first.redemption?.toSnapshot().decision).toBe("allow");
    expect(first.sessionDecision?.decision).toBe("create_fresh");
    expect(first.sessionDecision?.reasonCodes).toContain(
      "ANONYMOUS_SESSION_MAY_NOT_BE_UPGRADED_IN_PLACE",
    );
    expect(replay.replayed).toBe(true);
    expect(replay.redemption?.redemptionId).toBe(first.redemption?.redemptionId);
  });

  it("returns recover-only issuance outcomes and routes drifted redemptions into bounded recovery", async () => {
    const { store } = await seedLineage();
    const grants = createAccessGrantService(
      store,
      createDeterministicBackboneIdGenerator("par078_recovery"),
    );

    const recoverOnly = await grants.issueGrantForUseCase({
      useCase: "recover_only",
      routeFamilyRef: "rf_patient_secure_link_recovery",
      governingObjectRef: "request_078_recovery",
      governingVersionRef: "request_078_recovery_v1",
      recoveryRouteRef: "rf_recover_only",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedLineageFenceEpoch: 2,
      presentedToken: "",
      expiresAt: "2026-04-12T16:00:00Z",
      createdAt: "2026-04-12T15:10:00Z",
    });
    expect(recoverOnly.outcome).toBe("recover_only");

    const issued = await grants.issueGrantForUseCase({
      useCase: "secure_continuation",
      routeFamilyRef: "rf_patient_secure_link_recovery",
      governingObjectRef: "request_078_recovery",
      governingVersionRef: "request_078_recovery_v1",
      issuedRouteIntentBindingRef: "route_intent_078_secure_v1",
      requiredIdentityBindingRef: "binding_required_078_secure",
      requiredReleaseApprovalFreezeRef: "release_freeze_078_secure",
      requiredChannelReleaseFreezeRef: null,
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_078_secure",
      minimumBridgeCapabilitiesRef: null,
      requiredAssuranceSliceTrustRefs: ["assurance_slice_078_secure"],
      recoveryRouteRef: "rf_patient_secure_link_recovery",
      subjectRef: "subject_078_secure",
      boundPatientRef: "patient_078_secure",
      issuedIdentityBindingRef: "binding_required_078_secure",
      boundContactRouteRef: "contact_route_078_email",
      tokenKeyVersionRef: "token_key_local_v1",
      validatorVersionRef: "continuation_seeded_verified_validator::v1",
      issuedSessionEpochRef: "session_epoch_078_secure_v1",
      issuedSubjectBindingVersionRef: "binding_required_078_secure@v2",
      issuedLineageFenceEpoch: 3,
      presentedToken: "",
      expiresAt: "2026-04-12T16:10:00Z",
      createdAt: "2026-04-12T15:12:00Z",
    });

    const recovered = await grants.redeemGrant({
      presentedToken: issued.materializedToken!.opaqueToken,
      context: {
        routeFamily: "rf_patient_secure_link_recovery",
        actionScope: "secure_resume",
        lineageScope: "request",
        governingObjectRef: "request_078_recovery",
        governingVersionRef: "request_078_recovery_v1",
        routeIntentBindingRef: "route_intent_078_secure_v2",
        routeIntentTupleHash: "tuple_hash_078_secure_v2",
        routeContractDigestRef: "digest078secure0002",
        routeIntentBindingState: "stale",
        identityBindingRef: "binding_required_078_secure",
        releaseApprovalFreezeRef: "release_freeze_078_secure",
        audienceSurfaceRuntimeBindingRef: "audience_runtime_078_secure",
        assuranceSliceTrustRefs: ["assurance_slice_078_secure"],
        lineageFenceEpoch: 3,
        sessionEpochRef: "session_epoch_078_secure_v1",
        subjectBindingVersionRef: "binding_required_078_secure@v2",
        tokenKeyVersionRef: "token_key_local_v1",
      },
      recordedAt: "2026-04-12T15:14:00Z",
    });

    expect(recovered.redemption?.toSnapshot().decision).toBe("recover");
    expect(recovered.redemption?.toSnapshot().recoveryRouteRef).toBe(
      "rf_patient_secure_link_recovery",
    );
    expect(recovered.redemption?.toSnapshot().decisionReasonCodes).toContain(
      "ROUTE_INTENT_BINDING_DRIFT",
    );
    expect(recovered.redemption?.toSnapshot().decisionReasonCodes).toContain(
      "ROUTE_INTENT_NOT_LIVE",
    );
  });

  it("opens bounded auth bridge flows and supports explicit replace and revoke hooks", async () => {
    const { store } = await seedLineage();
    const grants = createAccessGrantService(
      store,
      createDeterministicBackboneIdGenerator("par078_auth_bridge"),
    );

    const issued = await grants.issueGrantForUseCase({
      useCase: "request_claim",
      routeFamilyRef: "rf_patient_secure_link_recovery",
      governingObjectRef: "request_078_claim",
      governingVersionRef: "request_078_claim_v1",
      issuedRouteIntentBindingRef: "route_intent_078_claim",
      requiredIdentityBindingRef: "binding_required_078_claim",
      requiredReleaseApprovalFreezeRef: "release_freeze_078_claim",
      requiredChannelReleaseFreezeRef: null,
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_078_claim",
      minimumBridgeCapabilitiesRef: "bridge_caps_078_claim",
      requiredAssuranceSliceTrustRefs: ["assurance_slice_078_claim"],
      recoveryRouteRef: "rf_recover_claim",
      subjectRef: "subject_078_claim",
      boundPatientRef: null,
      issuedIdentityBindingRef: "binding_required_078_claim",
      boundContactRouteRef: "contact_route_078_voice",
      tokenKeyVersionRef: "token_key_local_v1",
      validatorVersionRef: "claim_step_up_validator::v1",
      issuedSessionEpochRef: "session_epoch_078_claim_v1",
      issuedSubjectBindingVersionRef: "binding_required_078_claim@v1",
      issuedLineageFenceEpoch: 4,
      presentedToken: "",
      expiresAt: "2026-04-12T16:20:00Z",
      createdAt: "2026-04-12T15:20:00Z",
    });

    const authFlow = await grants.openAuthBridgeFlow({
      routeFamilyRef: "rf_patient_secure_link_recovery",
      actionScope: "claim",
      routeTargetRef: "request://078-claim-target",
      requestLineageRef: "lineage_078_claim",
      fallbackRouteRef: "rf_recover_claim",
      resumeContinuationRef: "resume_078_claim",
      subjectRef: "subject_078_claim",
      requiredIdentityBindingRef: "binding_required_078_claim",
      requiredCapabilityDecisionRef: "capability_078_claim",
      requiredPatientLinkRef: "patient_link_078_claim",
      requiredSessionState: "step_up_required",
      returnAuthority: "claim_pending",
      sessionEpochRef: "session_epoch_078_claim_v1",
      subjectBindingVersionRef: "binding_required_078_claim@v1",
      lineageFenceEpoch: 4,
      manifestVersionRef: "manifest_078_claim_v1",
      releaseApprovalFreezeRef: "release_freeze_078_claim",
      minimumBridgeCapabilitiesRef: "bridge_caps_078_claim",
      channelReleaseFreezeState: "monitoring",
      routeFreezeDispositionRef: "route_freeze_078_claim",
      expiresAt: "2026-04-12T15:40:00Z",
      requestedScopes: ["openid", "profile", "patient:read"],
      minimumClaims: ["sub", "nhs_number"],
      minimumAssuranceBand: "high",
      capabilityCeiling: "claim_pending",
      policyVersion: "auth_policy_078_v1",
      consentCopyVariantRef: "consent_copy_078_claim",
      maxAuthAgeSeconds: 300,
      requestContextHash: "request_context_hash_078_claim",
      startedAt: "2026-04-12T15:21:00Z",
    });

    expect(authFlow.scopeBundle.requestedScopes).toEqual(["openid", "patient:read", "profile"]);
    expect(authFlow.returnIntent.returnAuthority).toBe("claim_pending");
    expect(authFlow.transaction.transactionState).toBe("awaiting_callback");

    const replaced = await grants.replaceGrant({
      priorGrantRef: issued.grant.grantId,
      causeClass: "secure_link_reissue",
      recordedAt: "2026-04-12T15:25:00Z",
      lineageFenceEpoch: 5,
      governingObjectRef: "request_078_claim",
      replacementGrant: {
        grantFamily: "claim_step_up",
        actionScope: "claim",
        lineageScope: "request",
        routeFamilyRef: "rf_patient_secure_link_recovery",
        governingObjectRef: "request_078_claim",
        governingVersionRef: "request_078_claim_v2",
        phiExposureClass: "none",
        issuedRouteIntentBindingRef: "route_intent_078_claim_v2",
        requiredIdentityBindingRef: "binding_required_078_claim",
        requiredReleaseApprovalFreezeRef: "release_freeze_078_claim_v2",
        requiredChannelReleaseFreezeRef: null,
        requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_078_claim_v2",
        minimumBridgeCapabilitiesRef: "bridge_caps_078_claim",
        requiredAssuranceSliceTrustRefs: ["assurance_slice_078_claim"],
        recoveryRouteRef: "rf_recover_claim",
        subjectRef: "subject_078_claim",
        boundPatientRef: null,
        issuedIdentityBindingRef: "binding_required_078_claim",
        boundContactRouteRef: "contact_route_078_voice",
        subjectBindingMode: "soft_subject",
        tokenKeyVersionRef: "token_key_local_v1",
        validatorVersionRef: "claim_step_up_validator::v1",
        issuedSessionEpochRef: "session_epoch_078_claim_v2",
        issuedSubjectBindingVersionRef: "binding_required_078_claim@v2",
        issuedLineageFenceEpoch: 5,
        presentedToken: "",
        expiresAt: "2026-04-12T16:30:00Z",
        createdAt: "2026-04-12T15:25:00Z",
      },
    });
    expect(replaced.supersession.toSnapshot().causeClass).toBe("secure_link_reissue");
    expect(replaced.replacement.grant.toSnapshot().supersedesGrantRef).toBe(issued.grant.grantId);

    const revoked = await grants.revokeGrant({
      grantRef: replaced.replacement.grant.grantId,
      governingObjectRef: "request_078_claim",
      lineageFenceEpoch: 6,
      causeClass: "logout",
      reasonCodes: ["LOGOUT_REQUESTED"],
      recordedAt: "2026-04-12T15:30:00Z",
    });
    expect(revoked.supersession.toSnapshot().causeClass).toBe("logout");
    expect(revoked.revokedGrant.toSnapshot().grantState).toBe("revoked");
  });
});
