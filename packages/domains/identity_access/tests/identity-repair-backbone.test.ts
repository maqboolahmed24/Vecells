import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  createAccessGrantService,
  createIdentityBindingAuthorityService,
  createIdentityRepairOrchestratorService,
  createIdentityRepairStore,
  createReachabilityGovernorService,
  evaluateContactRouteRepairJourney,
  evaluateRouteVerificationCheckpoint,
  validateIdentityRepairLedgerState,
} from "../src/index.ts";
import { RequestAggregate, createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

async function seedRepairScope(seed: string) {
  const store = createIdentityRepairStore();
  const episode = EpisodeAggregate.create({
    episodeId: `episode_080_${seed}`,
    episodeFingerprint: `episode_fp_080_${seed}`,
    openedAt: "2026-04-13T08:55:00Z",
  });
  const request = RequestAggregate.create({
    requestId: `request_080_${seed}`,
    episodeId: episode.episodeId,
    originEnvelopeRef: `envelope_080_${seed}`,
    promotionRecordRef: `promotion_080_${seed}`,
    tenantId: "tenant_080",
    sourceChannel: "self_service_form",
    originIngressRecordRef: `ingress_080_${seed}`,
    normalizedSubmissionRef: `normalized_080_${seed}`,
    requestType: "clinical_question",
    requestLineageRef: `lineage_080_${seed}`,
    createdAt: "2026-04-13T08:55:00Z",
  });
  await store.saveEpisode(episode);
  await store.saveRequest(request);

  const bindings = createIdentityBindingAuthorityService(
    store,
    createDeterministicBackboneIdGenerator(`par080_binding_${seed}`),
  );
  const binding = await bindings.settleBinding({
    requestId: request.requestId,
    episodeId: episode.episodeId,
    subjectRef: `subject_080_${seed}`,
    patientRef: `patient_080_${seed}`,
    runnerUpPatientRef: `patient_080_${seed}_runner_up`,
    candidatePatientRefs: [`patient_080_${seed}`, `patient_080_${seed}_runner_up`],
    candidateSetRef: `candidate_set_080_${seed}_v1`,
    bindingState: "verified_patient",
    ownershipState: "claimed",
    decisionClass: "claim_confirmed",
    assuranceLevel: "high",
    verifiedContactRouteRef: `contact_route_080_${seed}_sms`,
    matchEvidenceRef: `match_evidence_080_${seed}_v1`,
    linkProbability: 0.99,
    linkProbabilityLowerBound: 0.98,
    runnerUpProbabilityUpperBound: 0.02,
    subjectProofProbabilityLowerBound: 0.98,
    gapLogit: 6.4,
    calibrationVersionRef: `calibration_080_${seed}_v1`,
    confidenceModelState: "calibrated",
    bindingAuthorityRef: "identity_binding_authority_080",
    stepUpMethod: "nhs_login_subject_and_phone_match",
    createdAt: "2026-04-13T08:56:00Z",
  });

  const grants = createAccessGrantService(
    store,
    createDeterministicBackboneIdGenerator(`par080_grants_${seed}`),
  );
  const bookingGrant = await grants.issueGrantForUseCase({
    useCase: "booking_manage",
    routeFamilyRef: "rf_patient_appointments",
    governingObjectRef: request.requestId,
    governingVersionRef: `${request.requestId}@v1`,
    recoveryRouteRef: "rf_patient_secure_link_recovery",
    subjectRef: `subject_080_${seed}`,
    boundPatientRef: `patient_080_${seed}`,
    issuedIdentityBindingRef: binding.binding.bindingId,
    boundContactRouteRef: `contact_route_080_${seed}_sms`,
    issuedRouteIntentBindingRef: `route_intent_080_${seed}_booking_v1`,
    tokenKeyVersionRef: "token_key_080_v1",
    issuedLineageFenceEpoch: 1,
    presentedToken: `token-booking-080-${seed}`,
    expiresAt: "2026-04-13T09:40:00Z",
    createdAt: "2026-04-13T08:57:00Z",
  });
  const pharmacyGrant = await grants.issueGrantForUseCase({
    useCase: "pharmacy_choice",
    routeFamilyRef: "rf_patient_requests",
    governingObjectRef: request.requestId,
    governingVersionRef: `${request.requestId}@v1`,
    recoveryRouteRef: "rf_patient_secure_link_recovery",
    subjectRef: `subject_080_${seed}`,
    boundPatientRef: `patient_080_${seed}`,
    issuedIdentityBindingRef: binding.binding.bindingId,
    boundContactRouteRef: `contact_route_080_${seed}_sms`,
    issuedRouteIntentBindingRef: `route_intent_080_${seed}_pharmacy_v1`,
    tokenKeyVersionRef: "token_key_080_v1",
    issuedLineageFenceEpoch: 1,
    presentedToken: `token-pharmacy-080-${seed}`,
    expiresAt: "2026-04-13T09:45:00Z",
    createdAt: "2026-04-13T08:57:30Z",
  });

  const repair = createIdentityRepairOrchestratorService(
    store,
    createDeterministicBackboneIdGenerator(`par080_repair_${seed}`),
  );
  const governor = createReachabilityGovernorService(
    store,
    createDeterministicBackboneIdGenerator(`par080_reachability_${seed}`),
  );

  return {
    store,
    request,
    episode,
    bindings,
    binding: binding.binding,
    bookingGrant,
    pharmacyGrant,
    repair,
    governor,
  };
}

describe("identity repair backbone", () => {
  it("reuses the active repair case on exact signal replay and freezes impacted grants and branches", async () => {
    const context = await seedRepairScope("replay_freeze");
    const first = await context.repair.recordSignal({
      repairSignalId: "repair_signal_080_replay",
      episodeId: context.episode.episodeId,
      affectedRequestRef: context.request.requestId,
      observedIdentityBindingRef: context.binding.bindingId,
      observedSessionRef: "session_080_replay",
      observedAccessGrantRef:
        "grant" in context.bookingGrant ? context.bookingGrant.grant.grantId : null,
      observedRouteIntentBindingRef: "route_intent_080_replay_observed",
      signalClass: "support_report",
      signalDisposition: "credible_misbinding",
      evidenceRefs: ["evidence_080_replay_call", "evidence_080_replay_note"],
      reportedBy: "support.advisor.080",
      reportedAt: "2026-04-13T09:00:00Z",
    });
    const replay = await context.repair.recordSignal({
      repairSignalId: "repair_signal_080_replay",
      episodeId: context.episode.episodeId,
      affectedRequestRef: context.request.requestId,
      observedIdentityBindingRef: context.binding.bindingId,
      observedSessionRef: "session_080_replay",
      observedAccessGrantRef:
        "grant" in context.bookingGrant ? context.bookingGrant.grant.grantId : null,
      observedRouteIntentBindingRef: "route_intent_080_replay_observed",
      signalClass: "support_report",
      signalDisposition: "credible_misbinding",
      evidenceRefs: ["evidence_080_replay_call", "evidence_080_replay_note"],
      reportedBy: "support.advisor.080",
      reportedAt: "2026-04-13T09:00:00Z",
    });

    expect(replay.reusedExisting).toBe(true);
    expect(replay.signal.repairSignalId).toBe(first.signal.repairSignalId);
    expect(replay.repairCase.repairCaseId).toBe(first.repairCase.repairCaseId);

    const frozen = await context.repair.commitFreeze({
      repairCaseRef: first.repairCase.repairCaseId,
      affectedBranches: [
        {
          branchType: "booking",
          governingObjectRef: "booking_080_replay",
          requiresRevalidation: true,
        },
        {
          branchType: "callback",
          governingObjectRef: "callback_080_replay",
          hasExternalSideEffect: true,
          requiresCompensation: true,
        },
        {
          branchType: "pharmacy",
          governingObjectRef: "pharmacy_080_replay",
          requiresManualReview: true,
        },
        {
          branchType: "message_thread",
          governingObjectRef: "message_thread_080_replay",
          requiresRevalidation: true,
        },
      ],
      activatedAt: "2026-04-13T09:04:00Z",
    });

    const bookingGrant =
      "grant" in context.bookingGrant
        ? await context.store.getAccessGrant(context.bookingGrant.grant.grantId)
        : null;
    const pharmacyGrant =
      "grant" in context.pharmacyGrant
        ? await context.store.getAccessGrant(context.pharmacyGrant.grant.grantId)
        : null;
    const request = await context.store.getRequest(context.request.requestId);
    const episode = await context.store.getEpisode(context.episode.episodeId);
    const events = await context.store.listIdentityRepairReachabilityEvents();

    expect(frozen.freezeRecord.toSnapshot().freezeState).toBe("active");
    expect(frozen.supersededGrantRefs).toHaveLength(2);
    expect(bookingGrant?.toSnapshot().grantState).toBe("superseded");
    expect(pharmacyGrant?.toSnapshot().grantState).toBe("superseded");
    expect(
      frozen.freezeRecord
        .toSnapshot()
        .supersededRouteIntentBindingRefs.some((value) =>
          value.includes("route_intent_080_replay_observed"),
        ),
    ).toBe(true);
    expect(request?.toSnapshot().currentClosureBlockerRefs).toContain(
      first.repairCase.repairCaseId,
    );
    expect(episode?.toSnapshot().activeIdentityRepairCaseRef).toBe(first.repairCase.repairCaseId);
    expect(frozen.branchDispositions).toHaveLength(4);
    expect(events.map((event) => event.eventName)).toEqual(
      expect.arrayContaining([
        "identity.repair_case.opened",
        "identity.repair_signal.recorded",
        "identity.repair_case.freeze_committed",
        "identity.repair_branch.quarantined",
      ]),
    );
  });

  it("gates release until downstream branches are rebuilt or released, then clears blockers", async () => {
    const context = await seedRepairScope("release");
    const opened = await context.repair.recordSignal({
      repairSignalId: "repair_signal_080_release",
      episodeId: context.episode.episodeId,
      affectedRequestRef: context.request.requestId,
      observedIdentityBindingRef: context.binding.bindingId,
      observedSessionRef: "session_080_release",
      observedAccessGrantRef:
        "grant" in context.bookingGrant ? context.bookingGrant.grant.grantId : null,
      observedRouteIntentBindingRef: "route_intent_080_release_observed",
      signalClass: "auth_subject_conflict",
      signalDisposition: "confirmed_misbinding",
      evidenceRefs: ["evidence_080_release_auth", "evidence_080_release_support"],
      reportedBy: "auth.gateway.080",
      reportedAt: "2026-04-13T10:00:00Z",
    });
    const frozen = await context.repair.commitFreeze({
      repairCaseRef: opened.repairCase.repairCaseId,
      affectedBranches: [
        {
          branchType: "booking",
          governingObjectRef: "booking_080_release",
          requiresRevalidation: true,
        },
        {
          branchType: "callback",
          governingObjectRef: "callback_080_release",
          hasExternalSideEffect: true,
          requiresCompensation: true,
        },
        {
          branchType: "artifact_projection",
          governingObjectRef: "artifact_080_release",
        },
      ],
      activatedAt: "2026-04-13T10:05:00Z",
    });
    await context.repair.markCorrected({
      repairCaseRef: opened.repairCase.repairCaseId,
      supervisorApprovalRef: "supervisor_approval_080_release",
      independentReviewRef: "independent_review_080_release",
      projectionRebuildRef: "projection_rebuild_080_release",
      correctedAt: "2026-04-13T10:18:00Z",
    });

    await expect(
      context.repair.settleRelease({
        repairCaseRef: opened.repairCase.repairCaseId,
        resultingIdentityBindingRef: "binding_080_release_placeholder",
        replacementAccessGrantRefs: ["grant_080_release_replacement"],
        replacementRouteIntentBindingRefs: ["route_intent_080_release_replacement"],
        replacementSessionEstablishmentDecisionRef: "session_080_release_replacement",
        communicationsResumeState: "resumed",
        releaseMode: "writable_resume",
        recordedAt: "2026-04-13T10:24:00Z",
      }),
    ).rejects.toThrow(/must be rebuilt or released/i);

    for (const branch of frozen.branchDispositions) {
      if (branch.requiredDisposition === "revalidate_under_new_binding") {
        await context.repair.settleBranchDisposition({
          branchDispositionRef: branch.branchDispositionId,
          nextState: "rebuilt",
          revalidationSettlementRef: `revalidation_${branch.branchDispositionId}`,
          releasedAt: "2026-04-13T10:21:00Z",
        });
      } else {
        await context.repair.settleBranchDisposition({
          branchDispositionRef: branch.branchDispositionId,
          nextState: "released",
          compensationRef:
            branch.requiredDisposition === "compensate_external"
              ? `compensation_${branch.branchDispositionId}`
              : null,
          releasedAt: "2026-04-13T10:21:00Z",
        });
      }
    }

    const correctedBinding = await context.bindings.settleBinding({
      requestId: context.request.requestId,
      episodeId: context.episode.episodeId,
      subjectRef: `subject_080_release`,
      patientRef: `patient_080_release_corrected`,
      runnerUpPatientRef: `patient_080_release`,
      candidatePatientRefs: [`patient_080_release_corrected`, `patient_080_release`],
      candidateSetRef: "candidate_set_080_release_v2",
      bindingState: "corrected",
      ownershipState: "claimed",
      decisionClass: "correction_applied",
      assuranceLevel: "high",
      verifiedContactRouteRef: "contact_route_080_release_sms",
      matchEvidenceRef: "match_evidence_080_release_v2",
      linkProbability: 0.995,
      linkProbabilityLowerBound: 0.99,
      runnerUpProbabilityUpperBound: 0.01,
      subjectProofProbabilityLowerBound: 0.99,
      gapLogit: 7.1,
      calibrationVersionRef: "calibration_080_release_v2",
      confidenceModelState: "calibrated",
      bindingAuthorityRef: "identity_binding_authority_080",
      stepUpMethod: "independent_review_release",
      expectedCurrentBindingRef: context.binding.bindingId,
      repairCaseRef: opened.repairCase.repairCaseId,
      repairFreezeRef: frozen.freezeRecord.freezeRecordId,
      repairReleaseSettlementRef: "release_pending_080_release",
      createdAt: "2026-04-13T10:22:00Z",
    });

    const released = await context.repair.settleRelease({
      repairCaseRef: opened.repairCase.repairCaseId,
      resultingIdentityBindingRef: correctedBinding.binding.bindingId,
      replacementAccessGrantRefs: ["grant_080_release_replacement"],
      replacementRouteIntentBindingRefs: ["route_intent_080_release_replacement"],
      replacementSessionEstablishmentDecisionRef: "session_080_release_replacement",
      communicationsResumeState: "resumed",
      releaseMode: "writable_resume",
      recordedAt: "2026-04-13T10:24:00Z",
    });

    const request = await context.store.getRequest(context.request.requestId);
    const episode = await context.store.getEpisode(context.episode.episodeId);
    const issues = await validateIdentityRepairLedgerState(context.store);

    expect(released.repairCase.state).toBe("closed");
    expect(released.freezeRecord.toSnapshot().freezeState).toBe("released");
    expect(released.releaseSettlement.toSnapshot().releaseMode).toBe("writable_resume");
    expect(request?.toSnapshot().currentClosureBlockerRefs).not.toContain(
      opened.repairCase.repairCaseId,
    );
    expect(episode?.toSnapshot().activeIdentityRepairCaseRef).toBeNull();
    expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("deduplicates repeated reachability observations and reuses the current assessment when posture is unchanged", async () => {
    const context = await seedRepairScope("reachability_replay");
    const initial = await context.governor.freezeContactRouteSnapshot({
      subjectRef: "subject_080_reachability_replay",
      routeRef: "contact_route_080_reachability_replay_sms",
      routeVersionRef: "contact_route_080_reachability_replay_sms_v1",
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900080",
      preferenceProfileRef: "preference_profile_080_reachability_replay",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-13T11:00:00Z",
    });
    const dependency = await context.governor.createDependency({
      episodeId: context.episode.episodeId,
      requestId: context.request.requestId,
      domain: "callback",
      domainObjectRef: "callback_080_reachability_replay",
      requiredRouteRef: initial.snapshot.toSnapshot().routeRef,
      purpose: "callback",
      blockedActionScopeRefs: ["callback_status_entry", "callback_response"],
      selectedAnchorRef: "anchor_080_reachability_replay",
      requestReturnBundleRef: "return_bundle_080_reachability_replay",
      resumeContinuationRef: "resume_080_reachability_replay",
      deadlineAt: "2026-04-13T12:00:00Z",
      failureEffect: "urgent_review",
      assessedAt: "2026-04-13T11:00:30Z",
    });

    const firstObservation = await context.governor.recordObservation({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      contactRouteSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      observationClass: "transport_ack",
      observationSourceRef: "simulator:sms",
      observedAt: "2026-04-13T11:01:00Z",
      recordedAt: "2026-04-13T11:01:00Z",
      outcomePolarity: "positive",
      authorityWeight: "weak",
      evidenceRef: "reachability_evidence_080_replay",
    });
    const firstRefresh = await context.governor.refreshDependencyAssessment({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      contactRouteSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      assessedAt: "2026-04-13T11:01:00Z",
    });
    const replayedObservation = await context.governor.recordObservation({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      contactRouteSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      observationClass: "transport_ack",
      observationSourceRef: "simulator:sms",
      observedAt: "2026-04-13T11:01:00Z",
      recordedAt: "2026-04-13T11:01:05Z",
      outcomePolarity: "positive",
      authorityWeight: "weak",
      evidenceRef: "reachability_evidence_080_replay",
    });
    const replayedRefresh = await context.governor.refreshDependencyAssessment({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      contactRouteSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      assessedAt: "2026-04-13T11:01:05Z",
    });

    const assessments = await context.store.listReachabilityAssessments();
    const observations = await context.store.listReachabilityObservationsForDependency(
      dependency.dependency.dependencyId,
    );

    expect(replayedObservation.reachabilityObservationId).toBe(
      firstObservation.reachabilityObservationId,
    );
    expect(replayedRefresh.assessment.reachabilityAssessmentId).toBe(
      firstRefresh.assessment.reachabilityAssessmentId,
    );
    expect(observations).toHaveLength(1);
    expect(assessments).toHaveLength(2);
  });

  it("evaluates route verification and same-shell repair journey recovery from the governed reachability outputs", async () => {
    const context = await seedRepairScope("verification_verdict");
    const initial = await context.governor.freezeContactRouteSnapshot({
      subjectRef: "subject_080_verification",
      routeRef: "contact_route_080_verification_voice",
      routeVersionRef: "contact_route_080_verification_voice_v1",
      routeKind: "voice",
      normalizedAddressRef: "tel:+447700900081",
      preferenceProfileRef: "preference_profile_080_verification",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-13T11:10:00Z",
    });
    const dependency = await context.governor.createDependency({
      episodeId: context.episode.episodeId,
      requestId: context.request.requestId,
      domain: "pharmacy",
      domainObjectRef: "pharmacy_case_080_verification",
      requiredRouteRef: initial.snapshot.toSnapshot().routeRef,
      purpose: "urgent_return",
      blockedActionScopeRefs: ["pharmacy_status_entry", "contact_route_repair"],
      selectedAnchorRef: "anchor_080_verification",
      requestReturnBundleRef: "return_bundle_080_verification",
      resumeContinuationRef: "resume_080_verification",
      deadlineAt: "2026-04-13T12:00:00Z",
      failureEffect: "escalate",
      assessedAt: "2026-04-13T11:10:10Z",
    });
    await context.governor.recordObservation({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      contactRouteSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      observationClass: "invalid_route",
      observationSourceRef: "simulator:voice",
      observedAt: "2026-04-13T11:11:00Z",
      recordedAt: "2026-04-13T11:11:00Z",
      outcomePolarity: "negative",
      authorityWeight: "strong",
      evidenceRef: "evidence_080_verification_invalid",
    });
    const blocked = await context.governor.refreshDependencyAssessment({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      contactRouteSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      assessedAt: "2026-04-13T11:11:00Z",
    });
    const repairJourney = await context.governor.openRepairJourney({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      patientRecoveryLoopRef: "patient_recovery_loop_080_verification",
      issuedAt: "2026-04-13T11:12:00Z",
    });
    const candidate = await context.governor.freezeContactRouteSnapshot({
      subjectRef: "subject_080_verification",
      routeRef: "contact_route_080_verification_voice",
      routeVersionRef: "contact_route_080_verification_voice_v2",
      routeKind: "voice",
      normalizedAddressRef: "tel:+447700900082",
      preferenceProfileRef: "preference_profile_080_verification",
      verificationState: "unverified",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      expectedCurrentSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      createdAt: "2026-04-13T11:13:00Z",
    });
    await context.governor.attachCandidateSnapshot({
      repairJourneyRef: repairJourney.journey.repairJourneyId,
      contactRouteSnapshotRef: candidate.snapshot.contactRouteSnapshotId,
      updatedAt: "2026-04-13T11:13:10Z",
    });
    const checkpoint = await context.governor.issueVerificationCheckpoint({
      repairJourneyRef: repairJourney.journey.repairJourneyId,
      contactRouteRef: "contact_route_080_verification_voice",
      contactRouteVersionRef: "contact_route_080_verification_voice_v2",
      verificationMethod: "otp",
      dependentGrantRefs: ["grant_080_verification"],
      dependentRouteIntentRefs: ["route_intent_080_verification"],
      evaluatedAt: "2026-04-13T11:13:30Z",
    });
    const settled = await context.governor.settleVerificationCheckpoint({
      checkpointId: checkpoint.checkpointId,
      verificationState: "verified",
      evaluatedAt: "2026-04-13T11:14:00Z",
    });

    const checkpointVerdict = evaluateRouteVerificationCheckpoint({
      checkpoint: settled.checkpoint,
      assessment: settled.assessment,
    });
    const repairVerdict = evaluateContactRouteRepairJourney({
      dependency: settled.dependency,
      journey: settled.journey,
      assessment: settled.assessment,
      checkpoint: settled.checkpoint,
    });
    const events = await context.store.listIdentityRepairReachabilityEvents();

    expect(blocked.assessment.toSnapshot().assessmentState).toBe("blocked");
    expect(checkpointVerdict.mayResume).toBe(true);
    expect(repairVerdict.nextAction).toBe("resume_original_action");
    expect(events.map((event) => event.eventName)).toEqual(
      expect.arrayContaining([
        "reachability.route_snapshot.superseded",
        "reachability.changed",
        "reachability.repair.started",
        "reachability.verification_checkpoint.verified",
        "reachability.repair_journey.closed",
      ]),
    );
  });
});
