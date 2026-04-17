import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  createReachabilityGovernorService,
  createReachabilitySimulationHarness,
  createReachabilityStore,
  estimateReachabilitySuccessProbability,
  validateReachabilityLedgerState,
} from "../src/index.ts";
import { RequestAggregate, createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

async function seedLineage() {
  const store = createReachabilityStore();
  const episode = EpisodeAggregate.create({
    episodeId: "episode_069_primary",
    episodeFingerprint: "episode_fp_069_primary",
    openedAt: "2026-04-12T16:00:00Z",
  });
  const request = RequestAggregate.create({
    requestId: "request_069_primary",
    episodeId: episode.episodeId,
    originEnvelopeRef: "envelope_069_primary",
    promotionRecordRef: "promotion_069_primary",
    tenantId: "tenant_069",
    sourceChannel: "self_service_form",
    originIngressRecordRef: "ingress_069_primary",
    normalizedSubmissionRef: "normalized_069_primary",
    requestType: "clinical_question",
    requestLineageRef: "lineage_069_primary",
    createdAt: "2026-04-12T16:00:00Z",
  });
  await store.saveEpisode(episode);
  await store.saveRequest(request);
  const governor = createReachabilityGovernorService(
    store,
    createDeterministicBackboneIdGenerator("par069_reachability"),
  );
  const simulator = createReachabilitySimulationHarness(governor);
  return { store, governor, simulator, episode, request };
}

describe("reachability backbone", () => {
  it("keeps transport acknowledgement as at-risk rather than calm reachability proof", async () => {
    const { governor, simulator, episode, request } = await seedLineage();
    const initial = await governor.freezeContactRouteSnapshot({
      subjectRef: "subject_069_primary",
      routeRef: "contact_route_069_sms",
      routeVersionRef: "contact_route_069_sms_v1",
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900069",
      preferenceProfileRef: "preference_profile_069_sms",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-12T16:01:00Z",
    });
    const dependency = await governor.createDependency({
      episodeId: episode.episodeId,
      requestId: request.requestId,
      domain: "callback",
      domainObjectRef: "callback_case_069_primary",
      requiredRouteRef: initial.snapshot.toSnapshot().routeRef,
      purpose: "callback",
      blockedActionScopeRefs: ["callback_status_entry", "callback_response"],
      selectedAnchorRef: "anchor_callback_069",
      requestReturnBundleRef: "return_bundle_069",
      resumeContinuationRef: "resume_069",
      deadlineAt: "2026-04-12T17:00:00Z",
      failureEffect: "urgent_review",
      assessedAt: "2026-04-12T16:01:10Z",
    });

    const result = await simulator.simulateScenario({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      channel: "sms",
      scenario: "accepted",
      observedAt: "2026-04-12T16:02:00Z",
      recordedAt: "2026-04-12T16:02:00Z",
    });

    expect(result.assessment.toSnapshot().assessmentState).toBe("at_risk");
    expect(result.assessment.toSnapshot().dominantReasonCode).toBe("TRANSPORT_ACK_WITHOUT_PROOF");
    expect(result.dependency.toSnapshot().routeHealthState).toBe("degraded");
  });

  it("settles clear only after durable positive reachability evidence under a current snapshot", async () => {
    const { governor, simulator, episode, request } = await seedLineage();
    const initial = await governor.freezeContactRouteSnapshot({
      subjectRef: "subject_069_delivery",
      routeRef: "contact_route_069_delivery_sms",
      routeVersionRef: "contact_route_069_delivery_sms_v1",
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900074",
      preferenceProfileRef: "preference_profile_069_delivery_sms",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-12T16:03:00Z",
    });
    const dependency = await governor.createDependency({
      episodeId: episode.episodeId,
      requestId: request.requestId,
      domain: "patient",
      domainObjectRef: "message_thread_069_primary",
      requiredRouteRef: initial.snapshot.toSnapshot().routeRef,
      purpose: "clinician_message",
      blockedActionScopeRefs: ["message_thread_entry", "message_reply"],
      selectedAnchorRef: "anchor_message_069",
      requestReturnBundleRef: "return_bundle_069_message",
      resumeContinuationRef: "resume_069_message",
      deadlineAt: "2026-04-12T18:00:00Z",
      failureEffect: "requeue",
      assessedAt: "2026-04-12T16:03:10Z",
    });

    await simulator.simulateScenario({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      channel: "sms",
      scenario: "accepted",
      observedAt: "2026-04-12T16:04:00Z",
      recordedAt: "2026-04-12T16:04:00Z",
    });
    const delivered = await simulator.simulateScenario({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      channel: "sms",
      scenario: "delivered",
      contactRouteSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      observedAt: "2026-04-12T16:04:30Z",
      recordedAt: "2026-04-12T16:04:30Z",
    });

    expect(delivered.assessment.toSnapshot().assessmentState).toBe("clear");
    expect(delivered.assessment.toSnapshot().routeAuthorityState).toBe("current");
    expect(estimateReachabilitySuccessProbability(delivered.assessment)).toBe(1);
  });

  it("rebinds a blocked dependency only after candidate route verification mints a fresh snapshot", async () => {
    const { store, governor, simulator, episode, request } = await seedLineage();
    const initial = await governor.freezeContactRouteSnapshot({
      subjectRef: "subject_069_repair",
      routeRef: "contact_route_069_voice",
      routeVersionRef: "contact_route_069_voice_v1",
      routeKind: "voice",
      normalizedAddressRef: "tel:+447700900070",
      preferenceProfileRef: "preference_profile_069_voice",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-12T16:05:00Z",
    });
    const dependency = await governor.createDependency({
      episodeId: episode.episodeId,
      requestId: request.requestId,
      domain: "pharmacy",
      domainObjectRef: "pharmacy_case_069_primary",
      requiredRouteRef: initial.snapshot.toSnapshot().routeRef,
      purpose: "urgent_return",
      blockedActionScopeRefs: ["pharmacy_status_entry", "contact_route_repair"],
      selectedAnchorRef: "anchor_pharmacy_069",
      requestReturnBundleRef: "return_bundle_069_pharmacy",
      resumeContinuationRef: "resume_069_pharmacy",
      deadlineAt: "2026-04-12T16:45:00Z",
      failureEffect: "escalate",
      assessedAt: "2026-04-12T16:05:10Z",
    });

    const failed = await simulator.simulateScenario({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      channel: "voice",
      scenario: "invalid_route",
      observedAt: "2026-04-12T16:06:00Z",
      recordedAt: "2026-04-12T16:06:00Z",
    });
    expect(failed.assessment.toSnapshot().assessmentState).toBe("blocked");

    const repair = await governor.openRepairJourney({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      patientRecoveryLoopRef: "patient_recovery_loop_069",
      issuedAt: "2026-04-12T16:06:30Z",
    });
    const candidate = await governor.freezeContactRouteSnapshot({
      subjectRef: "subject_069_repair",
      routeRef: "contact_route_069_voice",
      routeVersionRef: "contact_route_069_voice_v2",
      routeKind: "voice",
      normalizedAddressRef: "tel:+447700900071",
      preferenceProfileRef: "preference_profile_069_voice",
      verificationState: "unverified",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      expectedCurrentSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      createdAt: "2026-04-12T16:07:00Z",
    });
    await governor.attachCandidateSnapshot({
      repairJourneyRef: repair.journey.repairJourneyId,
      contactRouteSnapshotRef: candidate.snapshot.contactRouteSnapshotId,
      updatedAt: "2026-04-12T16:07:05Z",
    });
    const checkpoint = await governor.issueVerificationCheckpoint({
      repairJourneyRef: repair.journey.repairJourneyId,
      contactRouteRef: "contact_route_069_voice",
      contactRouteVersionRef: "contact_route_069_voice_v2",
      verificationMethod: "otp",
      dependentGrantRefs: ["grant_069_pharmacy_status"],
      dependentRouteIntentRefs: ["route_intent_069_pharmacy_repair"],
      evaluatedAt: "2026-04-12T16:07:15Z",
    });
    const settled = await governor.settleVerificationCheckpoint({
      checkpointId: checkpoint.checkpointId,
      verificationState: "verified",
      evaluatedAt: "2026-04-12T16:07:45Z",
    });

    expect(settled.resultingSnapshot).not.toBeNull();
    expect(settled.resultingSnapshot?.toSnapshot().verificationState).toBe("verified_current");
    expect(settled.checkpoint.toSnapshot().rebindState).toBe("rebound");
    expect(settled.assessment.toSnapshot().assessmentState).toBe("clear");
    expect(settled.dependency.toSnapshot().currentContactRouteSnapshotRef).toBe(
      settled.resultingSnapshot?.contactRouteSnapshotId,
    );
    expect(settled.journey.toSnapshot().journeyState).toBe("completed");

    const issues = await validateReachabilityLedgerState(store);
    expect(issues).toEqual([]);
  });

  it("fails closed when verification expires and keeps the same-shell repair path active", async () => {
    const { governor, episode, request } = await seedLineage();
    const initial = await governor.freezeContactRouteSnapshot({
      subjectRef: "subject_069_expiry",
      routeRef: "contact_route_069_sms_expiry",
      routeVersionRef: "contact_route_069_sms_expiry_v1",
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900072",
      preferenceProfileRef: "preference_profile_069_expiry",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      createdAt: "2026-04-12T16:08:00Z",
    });
    const dependency = await governor.createDependency({
      episodeId: episode.episodeId,
      requestId: request.requestId,
      domain: "patient",
      domainObjectRef: "waitlist_offer_069_primary",
      requiredRouteRef: initial.snapshot.toSnapshot().routeRef,
      purpose: "waitlist_offer",
      blockedActionScopeRefs: ["waitlist_offer", "contact_route_repair"],
      selectedAnchorRef: "anchor_waitlist_069",
      requestReturnBundleRef: "return_bundle_069_waitlist",
      resumeContinuationRef: "resume_069_waitlist",
      deadlineAt: "2026-04-12T17:15:00Z",
      failureEffect: "invalidate_pending_action",
      assessedAt: "2026-04-12T16:08:10Z",
    });
    await governor.recordObservation({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      observationClass: "bounce",
      observationSourceRef: "provider:sms",
      observedAt: "2026-04-12T16:08:30Z",
      recordedAt: "2026-04-12T16:08:30Z",
      outcomePolarity: "negative",
      authorityWeight: "strong",
      evidenceRef: "receipt_069_waitlist_bounce",
    });
    await governor.refreshDependencyAssessment({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      assessedAt: "2026-04-12T16:08:31Z",
    });
    const repair = await governor.openRepairJourney({
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      issuedAt: "2026-04-12T16:09:00Z",
    });
    const candidate = await governor.freezeContactRouteSnapshot({
      subjectRef: "subject_069_expiry",
      routeRef: "contact_route_069_sms_expiry",
      routeVersionRef: "contact_route_069_sms_expiry_v2",
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900073",
      preferenceProfileRef: "preference_profile_069_expiry",
      verificationState: "unverified",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "patient_confirmed",
      expectedCurrentSnapshotRef: initial.snapshot.contactRouteSnapshotId,
      createdAt: "2026-04-12T16:09:10Z",
    });
    await governor.attachCandidateSnapshot({
      repairJourneyRef: repair.journey.repairJourneyId,
      contactRouteSnapshotRef: candidate.snapshot.contactRouteSnapshotId,
      updatedAt: "2026-04-12T16:09:15Z",
    });
    const checkpoint = await governor.issueVerificationCheckpoint({
      repairJourneyRef: repair.journey.repairJourneyId,
      contactRouteRef: "contact_route_069_sms_expiry",
      contactRouteVersionRef: "contact_route_069_sms_expiry_v2",
      verificationMethod: "otp",
      evaluatedAt: "2026-04-12T16:09:20Z",
    });
    const settled = await governor.settleVerificationCheckpoint({
      checkpointId: checkpoint.checkpointId,
      verificationState: "expired",
      evaluatedAt: "2026-04-12T16:10:00Z",
    });

    expect(settled.resultingSnapshot).toBeNull();
    expect(settled.checkpoint.toSnapshot().rebindState).toBe("blocked");
    expect(settled.assessment.toSnapshot().assessmentState).toBe("blocked");
    expect(settled.dependency.toSnapshot().currentContactRouteSnapshotRef).toBe(
      initial.snapshot.contactRouteSnapshotId,
    );
    expect(settled.journey.toSnapshot().journeyState).toBe("recovery_required");
  });

  it("maps simulator channels and scenarios into canonical observation classes", async () => {
    const { governor, simulator, episode, request } = await seedLineage();
    const snapshot = await governor.freezeContactRouteSnapshot({
      subjectRef: "subject_069_sim",
      routeRef: "contact_route_069_sim",
      routeVersionRef: "contact_route_069_sim_v1",
      routeKind: "email",
      normalizedAddressRef: "mailto:sim069@example.com",
      preferenceProfileRef: "preference_profile_069_sim",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "support_captured",
      createdAt: "2026-04-12T16:11:00Z",
    });
    const dependency = await governor.createDependency({
      episodeId: episode.episodeId,
      requestId: request.requestId,
      domain: "staff",
      domainObjectRef: "support_recovery_069",
      requiredRouteRef: snapshot.snapshot.toSnapshot().routeRef,
      purpose: "outcome_confirmation",
      blockedActionScopeRefs: ["status_view", "contact_route_repair"],
      selectedAnchorRef: "anchor_support_069",
      requestReturnBundleRef: "return_bundle_069_support",
      resumeContinuationRef: "resume_069_support",
      deadlineAt: "2026-04-12T18:00:00Z",
      failureEffect: "requeue",
      assessedAt: "2026-04-12T16:11:05Z",
    });

    const scenarios = [];
    scenarios.push(
      await simulator.simulateScenario({
        reachabilityDependencyRef: dependency.dependency.dependencyId,
        channel: "voice",
        scenario: "manual_reachable",
        observedAt: "2026-04-12T16:11:10Z",
        recordedAt: "2026-04-12T16:11:10Z",
      }),
    );
    scenarios.push(
      await simulator.simulateScenario({
        reachabilityDependencyRef: dependency.dependency.dependencyId,
        channel: "email",
        scenario: "disputed",
        observedAt: "2026-04-12T16:11:20Z",
        recordedAt: "2026-04-12T16:11:20Z",
      }),
    );
    scenarios.push(
      await simulator.simulateScenario({
        reachabilityDependencyRef: dependency.dependency.dependencyId,
        channel: "otp",
        scenario: "verification_failure",
        observedAt: "2026-04-12T16:11:30Z",
        recordedAt: "2026-04-12T16:11:30Z",
      }),
    );

    expect(scenarios[0].observation.toSnapshot().observationClass).toBe(
      "manual_confirmed_reachable",
    );
    expect(scenarios[1].observation.toSnapshot().observationClass).toBe("manual_dispute");
    expect(scenarios[2].observation.toSnapshot().observationClass).toBe("verification_failure");
  });
});
