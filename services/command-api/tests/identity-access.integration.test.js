import { describe, expect, it } from "vitest";
import {
  createIdentityAccessApplication,
  identityAccessMigrationPlanRefs,
  identityAccessPersistenceTables,
} from "../src/identity-access.ts";
import { EpisodeAggregate } from "@vecells/domain-identity-access";
import { RequestAggregate } from "@vecells/domain-kernel";

describe("identity access application seam", () => {
  it("composes binding, grant, and reachability authorities over append-only persistence tables", async () => {
    const application = createIdentityAccessApplication();
    const episode = EpisodeAggregate.create({
      episodeId: "episode_cmdapi_069",
      episodeFingerprint: "episode_fp_cmdapi_069",
      openedAt: "2026-04-12T15:00:00Z",
    });
    const request = RequestAggregate.create({
      requestId: "request_cmdapi_069",
      episodeId: episode.episodeId,
      originEnvelopeRef: "envelope_cmdapi_069",
      promotionRecordRef: "promotion_cmdapi_069",
      tenantId: "tenant_cmdapi_069",
      sourceChannel: "self_service_form",
      originIngressRecordRef: "ingress_cmdapi_069",
      normalizedSubmissionRef: "normalized_cmdapi_069",
      requestType: "clinical_question",
      requestLineageRef: "lineage_cmdapi_069",
      createdAt: "2026-04-12T15:00:00Z",
    });
    await application.repositories.saveEpisode(episode);
    await application.repositories.saveRequest(request);

    const bindingResult = await application.identityBindingAuthority.settleBinding({
      requestId: request.requestId,
      episodeId: episode.episodeId,
      subjectRef: "subject_cmdapi_069",
      patientRef: "patient_cmdapi_069",
      candidatePatientRefs: ["patient_cmdapi_069"],
      candidateSetRef: "candidate_set_cmdapi_069",
      bindingState: "verified_patient",
      ownershipState: "claimed",
      decisionClass: "claim_confirmed",
      assuranceLevel: "high",
      verifiedContactRouteRef: "contact_route_cmdapi_069_sms",
      matchEvidenceRef: "match_evidence_cmdapi_069",
      linkProbability: 0.99,
      linkProbabilityLowerBound: 0.97,
      runnerUpProbabilityUpperBound: 0.03,
      subjectProofProbabilityLowerBound: 0.96,
      gapLogit: 6.4,
      calibrationVersionRef: "calibration_cmdapi_069",
      confidenceModelState: "calibrated",
      bindingAuthorityRef: "identity_binding_authority_cmdapi_069",
      patientLinkProvenanceRef: "auth_callback_cmdapi_069",
      patientLinkEvaluatedAt: "2026-04-12T15:01:00Z",
      patientLinkExpiresAt: "2026-04-12T16:01:00Z",
      createdAt: "2026-04-12T15:01:00Z",
    });

    const issued = await application.accessGrantService.issueGrant({
      grantFamily: "transaction_action_minimal",
      actionScope: "message_reply",
      lineageScope: "request",
      routeFamilyRef: "rf_patient_message_reply",
      governingObjectRef: request.requestId,
      governingVersionRef: "request_cmdapi_069_v2",
      phiExposureClass: "minimal",
      issuedRouteIntentBindingRef: "route_intent_cmdapi_069",
      requiredIdentityBindingRef: bindingResult.binding.bindingId,
      requiredReleaseApprovalFreezeRef: "release_freeze_cmdapi_069",
      requiredChannelReleaseFreezeRef: null,
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_cmdapi_069",
      minimumBridgeCapabilitiesRef: null,
      requiredAssuranceSliceTrustRefs: ["assurance_slice_cmdapi_069"],
      recoveryRouteRef: "rf_recover_message_reply",
      subjectRef: bindingResult.binding.toSnapshot().subjectRef,
      boundPatientRef: bindingResult.binding.toSnapshot().patientRef,
      issuedIdentityBindingRef: bindingResult.binding.bindingId,
      boundContactRouteRef: "contact_route_cmdapi_069_sms",
      subjectBindingMode: "hard_subject",
      tokenKeyVersionRef: "token_key_cmdapi_069_v1",
      validatorVersionRef: "transaction_action_minimal_validator::v1",
      issuedSessionEpochRef: "session_epoch_cmdapi_069_v1",
      issuedSubjectBindingVersionRef: `${bindingResult.binding.bindingId}@v${bindingResult.binding.toSnapshot().bindingVersion}`,
      issuedLineageFenceEpoch: 3,
      presentedToken: "command-api-grant-069",
      expiresAt: "2026-04-12T16:15:00Z",
      createdAt: "2026-04-12T15:05:00Z",
    });
    const redemption = await application.accessGrantService.redeemGrant({
      presentedToken: "command-api-grant-069",
      context: {
        routeFamily: "rf_patient_message_reply",
        actionScope: "message_reply",
        lineageScope: "request",
        governingObjectRef: request.requestId,
        governingVersionRef: "request_cmdapi_069_v2",
        identityBindingRef: bindingResult.binding.bindingId,
        releaseApprovalFreezeRef: "release_freeze_cmdapi_069",
        audienceSurfaceRuntimeBindingRef: "audience_runtime_cmdapi_069",
        assuranceSliceTrustRefs: ["assurance_slice_cmdapi_069"],
        lineageFenceEpoch: 3,
        sessionEpochRef: "session_epoch_cmdapi_069_v1",
        subjectBindingVersionRef: `${bindingResult.binding.bindingId}@v${bindingResult.binding.toSnapshot().bindingVersion}`,
        tokenKeyVersionRef: "token_key_cmdapi_069_v1",
      },
      recordedAt: "2026-04-12T15:06:00Z",
      resultingSessionRef: "session_cmdapi_069",
      resultingRouteIntentBindingRef: "route_intent_cmdapi_069",
    });

    const initialSnapshot = await application.reachabilityGovernor.freezeContactRouteSnapshot({
      subjectRef: bindingResult.binding.toSnapshot().subjectRef,
      routeRef: "contact_route_cmdapi_069_sms",
      routeVersionRef: "contact_route_cmdapi_069_sms_v1",
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900069",
      preferenceProfileRef: "preference_profile_cmdapi_069",
      verificationCheckpointRef: null,
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-12T15:07:00Z",
    });

    const dependencyResult = await application.reachabilityGovernor.createDependency({
      episodeId: episode.episodeId,
      requestId: request.requestId,
      domain: "callback",
      domainObjectRef: "callback_case_cmdapi_069",
      requiredRouteRef: initialSnapshot.snapshot.toSnapshot().routeRef,
      purpose: "callback",
      blockedActionScopeRefs: ["callback_status_entry", "callback_response"],
      selectedAnchorRef: "anchor_callback_cmdapi_069",
      requestReturnBundleRef: "return_bundle_cmdapi_069",
      resumeContinuationRef: "resume_continuation_cmdapi_069",
      deadlineAt: "2026-04-12T16:30:00Z",
      failureEffect: "urgent_review",
      assessedAt: "2026-04-12T15:07:30Z",
    });

    const accepted = await application.reachabilitySimulation.simulateScenario({
      reachabilityDependencyRef: dependencyResult.dependency.dependencyId,
      channel: "sms",
      scenario: "accepted",
      observedAt: "2026-04-12T15:08:00Z",
      recordedAt: "2026-04-12T15:08:00Z",
    });
    const delivered = await application.reachabilitySimulation.simulateScenario({
      reachabilityDependencyRef: dependencyResult.dependency.dependencyId,
      channel: "sms",
      scenario: "delivered",
      observedAt: "2026-04-12T15:08:30Z",
      recordedAt: "2026-04-12T15:08:30Z",
    });

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/080_identity_repair_and_reachability_governor.sql",
    );
    expect(application.migrationPlanRefs).toEqual(identityAccessMigrationPlanRefs);
    expect(identityAccessPersistenceTables).toEqual([
      "identity_bindings",
      "patient_links",
      "access_grant_scope_envelopes",
      "access_grants",
      "access_grant_redemption_records",
      "access_grant_supersession_records",
      "contact_route_snapshots",
      "reachability_observations",
      "reachability_assessment_records",
      "reachability_dependencies",
      "contact_route_repair_journeys",
      "contact_route_verification_checkpoints",
      "identity_repair_signals",
      "identity_repair_cases",
      "identity_repair_freeze_records",
      "identity_repair_branch_dispositions",
      "identity_repair_release_settlements",
      "lineage_fences",
    ]);
    expect(bindingResult.request.toSnapshot().identityState).toBe("claimed");
    expect(issued.grant.toSnapshot().grantState).toBe("live");
    expect(redemption.replayed).toBe(false);
    expect(redemption.redemption?.toSnapshot().decision).toBe("allow");
    expect(accepted.assessment.toSnapshot().assessmentState).toBe("at_risk");
    expect(accepted.assessment.toSnapshot().dominantReasonCode).toBe("TRANSPORT_ACK_WITHOUT_PROOF");
    expect(delivered.assessment.toSnapshot().assessmentState).toBe("clear");
    expect(delivered.assessment.toSnapshot().routeAuthorityState).toBe("current");
    expect(typeof application.identityRepairOrchestrator.recordSignal).toBe("function");
    expect(typeof application.identityRepairSimulation.runScenario).toBe("function");
  });
});
