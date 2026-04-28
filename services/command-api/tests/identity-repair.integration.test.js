import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  validateIdentityRepairLedgerState,
} from "@vecells/domain-identity-access";
import { RequestAggregate } from "@vecells/domain-kernel";
import { createIdentityAccessApplication } from "../src/identity-access.ts";

async function seedIdentityRepairApplication(seed) {
  const application = createIdentityAccessApplication();
  const episode = EpisodeAggregate.create({
    episodeId: `episode_cmdapi_080_${seed}`,
    episodeFingerprint: `episode_fp_cmdapi_080_${seed}`,
    openedAt: "2026-04-12T18:00:00Z",
  });
  const request = RequestAggregate.create({
    requestId: `request_cmdapi_080_${seed}`,
    episodeId: episode.episodeId,
    originEnvelopeRef: `envelope_cmdapi_080_${seed}`,
    promotionRecordRef: `promotion_cmdapi_080_${seed}`,
    tenantId: "tenant_cmdapi_080",
    sourceChannel: "self_service_form",
    originIngressRecordRef: `ingress_cmdapi_080_${seed}`,
    normalizedSubmissionRef: `normalized_cmdapi_080_${seed}`,
    requestType: "clinical_question",
    requestLineageRef: `lineage_cmdapi_080_${seed}`,
    createdAt: "2026-04-12T18:00:00Z",
  });
  await application.repositories.saveEpisode(episode);
  await application.repositories.saveRequest(request);

  const bindingResult = await application.identityBindingAuthority.settleBinding({
    requestId: request.requestId,
    episodeId: episode.episodeId,
    subjectRef: `subject_cmdapi_080_${seed}`,
    patientRef: `patient_cmdapi_080_${seed}`,
    runnerUpPatientRef: `patient_cmdapi_080_${seed}_runner_up`,
    candidatePatientRefs: [`patient_cmdapi_080_${seed}`, `patient_cmdapi_080_${seed}_runner_up`],
    candidateSetRef: `candidate_set_cmdapi_080_${seed}_v1`,
    bindingState: "verified_patient",
    ownershipState: "claimed",
    decisionClass: "claim_confirmed",
    assuranceLevel: "high",
    verifiedContactRouteRef: `contact_route_cmdapi_080_${seed}_sms`,
    matchEvidenceRef: `match_evidence_cmdapi_080_${seed}_v1`,
    linkProbability: 0.99,
    linkProbabilityLowerBound: 0.98,
    runnerUpProbabilityUpperBound: 0.02,
    subjectProofProbabilityLowerBound: 0.98,
    gapLogit: 6.5,
    calibrationVersionRef: `calibration_cmdapi_080_${seed}_v1`,
    confidenceModelState: "calibrated",
    bindingAuthorityRef: "identity_binding_authority_cmdapi_080",
    stepUpMethod: "nhs_login_subject_and_phone_match",
    createdAt: "2026-04-12T18:01:00Z",
  });

  const bookingGrant = await application.accessGrantService.issueGrantForUseCase({
    useCase: "booking_manage",
    routeFamilyRef: "rf_patient_appointments",
    governingObjectRef: request.requestId,
    governingVersionRef: `${request.requestId}@v1`,
    recoveryRouteRef: "rf_patient_secure_link_recovery",
    subjectRef: `subject_cmdapi_080_${seed}`,
    boundPatientRef: `patient_cmdapi_080_${seed}`,
    issuedIdentityBindingRef: bindingResult.binding.bindingId,
    boundContactRouteRef: `contact_route_cmdapi_080_${seed}_sms`,
    issuedRouteIntentBindingRef: `route_intent_cmdapi_080_${seed}_booking_v1`,
    tokenKeyVersionRef: "token_key_cmdapi_080_v1",
    issuedLineageFenceEpoch: 1,
    presentedToken: `token-booking-cmdapi-080-${seed}`,
    expiresAt: "2026-04-12T18:40:00Z",
    createdAt: "2026-04-12T18:02:00Z",
  });
  const pharmacyGrant = await application.accessGrantService.issueGrantForUseCase({
    useCase: "pharmacy_choice",
    routeFamilyRef: "rf_patient_requests",
    governingObjectRef: request.requestId,
    governingVersionRef: `${request.requestId}@v1`,
    recoveryRouteRef: "rf_patient_secure_link_recovery",
    subjectRef: `subject_cmdapi_080_${seed}`,
    boundPatientRef: `patient_cmdapi_080_${seed}`,
    issuedIdentityBindingRef: bindingResult.binding.bindingId,
    boundContactRouteRef: `contact_route_cmdapi_080_${seed}_sms`,
    issuedRouteIntentBindingRef: `route_intent_cmdapi_080_${seed}_pharmacy_v1`,
    tokenKeyVersionRef: "token_key_cmdapi_080_v1",
    issuedLineageFenceEpoch: 1,
    presentedToken: `token-pharmacy-cmdapi-080-${seed}`,
    expiresAt: "2026-04-12T18:45:00Z",
    createdAt: "2026-04-12T18:02:30Z",
  });

  return {
    application,
    episode,
    request,
    binding: bindingResult.binding,
    bookingGrant: "grant" in bookingGrant ? bookingGrant.grant : null,
    pharmacyGrant: "grant" in pharmacyGrant ? pharmacyGrant.grant : null,
  };
}

describe("identity repair command-api seam", () => {
  it("freezes stale grants and clears lineage blockers only after governed repair release", async () => {
    const context = await seedIdentityRepairApplication("release");
    const opened = await context.application.identityRepairOrchestrator.recordSignal({
      repairSignalId: "repair_signal_cmdapi_080_release",
      episodeId: context.episode.episodeId,
      affectedRequestRef: context.request.requestId,
      observedIdentityBindingRef: context.binding.bindingId,
      observedSessionRef: "session_cmdapi_080_release",
      observedAccessGrantRef: context.bookingGrant?.grantId ?? null,
      observedRouteIntentBindingRef: "route_intent_cmdapi_080_release_observed",
      signalClass: "auth_subject_conflict",
      signalDisposition: "confirmed_misbinding",
      evidenceRefs: ["evidence_cmdapi_080_release_auth", "evidence_cmdapi_080_release_support"],
      reportedBy: "support.identity.080",
      reportedAt: "2026-04-12T18:05:00Z",
    });
    const frozen = await context.application.identityRepairOrchestrator.commitFreeze({
      repairCaseRef: opened.repairCase.repairCaseId,
      affectedBranches: [
        {
          branchType: "booking",
          governingObjectRef: "booking_cmdapi_080_release",
          requiresRevalidation: true,
        },
        {
          branchType: "callback",
          governingObjectRef: "callback_cmdapi_080_release",
          hasExternalSideEffect: true,
          requiresCompensation: true,
        },
        {
          branchType: "outbound_communication",
          governingObjectRef: "outbound_sms_cmdapi_080_release",
        },
      ],
      activatedAt: "2026-04-12T18:06:00Z",
    });

    expect(frozen.freezeRecord.toSnapshot().freezeState).toBe("active");
    expect(frozen.supersededGrantRefs).toEqual(
      expect.arrayContaining(
        [context.bookingGrant?.grantId, context.pharmacyGrant?.grantId].filter(Boolean),
      ),
    );

    await context.application.identityRepairOrchestrator.markCorrected({
      repairCaseRef: opened.repairCase.repairCaseId,
      supervisorApprovalRef: "supervisor_approval_cmdapi_080_release",
      independentReviewRef: "independent_review_cmdapi_080_release",
      projectionRebuildRef: "projection_rebuild_cmdapi_080_release",
      correctedAt: "2026-04-12T18:10:00Z",
    });

    for (const branch of frozen.branchDispositions) {
      if (branch.requiredDisposition === "revalidate_under_new_binding") {
        await context.application.identityRepairOrchestrator.settleBranchDisposition({
          branchDispositionRef: branch.branchDispositionId,
          nextState: "rebuilt",
          revalidationSettlementRef: `revalidation_${branch.branchDispositionId}`,
          releasedAt: "2026-04-12T18:12:00Z",
        });
      } else {
        await context.application.identityRepairOrchestrator.settleBranchDisposition({
          branchDispositionRef: branch.branchDispositionId,
          nextState: "released",
          compensationRef:
            branch.requiredDisposition === "compensate_external"
              ? `compensation_${branch.branchDispositionId}`
              : null,
          releasedAt: "2026-04-12T18:12:00Z",
        });
      }
    }

    const correctedBinding = await context.application.identityBindingAuthority.settleBinding({
      requestId: context.request.requestId,
      episodeId: context.episode.episodeId,
      subjectRef: `subject_cmdapi_080_release`,
      patientRef: `patient_cmdapi_080_release_corrected`,
      runnerUpPatientRef: `patient_cmdapi_080_release`,
      candidatePatientRefs: [`patient_cmdapi_080_release_corrected`, `patient_cmdapi_080_release`],
      candidateSetRef: "candidate_set_cmdapi_080_release_v2",
      bindingState: "corrected",
      ownershipState: "claimed",
      decisionClass: "correction_applied",
      assuranceLevel: "high",
      verifiedContactRouteRef: "contact_route_cmdapi_080_release_sms",
      matchEvidenceRef: "match_evidence_cmdapi_080_release_v2",
      linkProbability: 0.995,
      linkProbabilityLowerBound: 0.99,
      runnerUpProbabilityUpperBound: 0.01,
      subjectProofProbabilityLowerBound: 0.99,
      gapLogit: 7.3,
      calibrationVersionRef: "calibration_cmdapi_080_release_v2",
      confidenceModelState: "calibrated",
      bindingAuthorityRef: "identity_binding_authority_cmdapi_080",
      stepUpMethod: "independent_review_release",
      expectedCurrentBindingRef: context.binding.bindingId,
      repairCaseRef: opened.repairCase.repairCaseId,
      repairFreezeRef: frozen.freezeRecord.freezeRecordId,
      repairReleaseSettlementRef: "release_pending_cmdapi_080_release",
      createdAt: "2026-04-12T18:14:00Z",
    });

    const released = await context.application.identityRepairOrchestrator.settleRelease({
      repairCaseRef: opened.repairCase.repairCaseId,
      resultingIdentityBindingRef: correctedBinding.binding.bindingId,
      replacementAccessGrantRefs: ["grant_cmdapi_080_release_replacement"],
      replacementRouteIntentBindingRefs: ["route_intent_cmdapi_080_release_replacement"],
      replacementSessionEstablishmentDecisionRef: "session_cmdapi_080_release_replacement",
      communicationsResumeState: "resumed",
      releaseMode: "writable_resume",
      recordedAt: "2026-04-12T18:16:00Z",
    });

    const request = await context.application.repositories.getRequest(context.request.requestId);
    const episode = await context.application.repositories.getEpisode(context.episode.episodeId);
    const issues = await validateIdentityRepairLedgerState(context.application.repositories);

    expect(released.repairCase.state).toBe("closed");
    expect(released.releaseSettlement.toSnapshot().releaseMode).toBe("writable_resume");
    expect(request?.toSnapshot().currentClosureBlockerRefs).not.toContain(
      opened.repairCase.repairCaseId,
    );
    expect(episode?.toSnapshot().activeIdentityRepairCaseRef).toBeNull();
    expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });
});
