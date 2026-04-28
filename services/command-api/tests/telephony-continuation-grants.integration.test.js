import { describe, expect, it } from "vitest";
import {
  createAccessGrantSupersessionApplication,
  createInMemoryAccessGrantSupersessionRepository,
} from "../src/access-grant-supersession.ts";
import {
  createInMemoryTelephonyContinuationRepository,
  createTelephonyContinuationApplication,
  telephonyContinuationGapResolutions,
  telephonyContinuationLifetimePolicy,
  telephonyContinuationMigrationPlanRefs,
  telephonyContinuationPersistenceTables,
} from "../src/telephony-continuation-grants.ts";

const observedAt = "2026-04-15T16:00:00.000Z";
const callSessionRef = "call_session_192_demo";

function evidenceReadiness(overrides = {}) {
  return {
    telephonyEvidenceReadinessAssessmentRef:
      overrides.telephonyEvidenceReadinessAssessmentRef ?? "tel_era_192_ready",
    schemaVersion: "191.phase2.telephony-readiness.v1",
    policyVersion: "phase2-evidence-readiness-191.v1",
    callSessionRef,
    submissionEnvelopeRef: "submission_envelope_192",
    urgentLiveAssessmentRef: null,
    transcriptReadinessRef: "tel_trr_191_ready",
    structuredCaptureRefs: ["structured_capture_192"],
    identityEvidenceRefs: ["identity_evidence_192"],
    contactRouteEvidenceRefs: ["contact_route_192"],
    manualReviewDispositionRef: null,
    continuationEligibilityRef: null,
    usabilityState: overrides.usabilityState ?? "safety_usable",
    promotionReadiness: overrides.promotionReadiness ?? "ready_to_promote",
    governingInputRefs: ["tel_trr_191_ready", "identity_evidence_192"],
    supersedesEvidenceReadinessAssessmentRef: null,
    reasonCodes: ["TEL_READY_191_SAFETY_USABLE_READY_TO_PROMOTE"],
    assessedAt: observedAt,
    recordedBy: "TelephonyReadinessPipeline",
    ...overrides,
  };
}

function verification(overrides = {}) {
  return {
    telephonyVerificationDecisionRef: "tvd_192_seeded",
    identityConfidenceAssessmentRef: "tica_192_high",
    destinationConfidenceAssessmentRef: "tdca_192_high",
    bestCandidateRef: "patient_192",
    nextAllowedContinuationPosture: "seeded_continuation_candidate",
    reasonCodes: ["TEL_VERIFY_189_SEEDED_CONTINUATION_ALLOWED"],
    ...overrides,
  };
}

function destination(overrides = {}) {
  return {
    destinationConfidenceRef: "tdca_192_high",
    destinationHash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    maskedDestination: "+44******1234",
    verifiedForPatient: true,
    intendedPatientRef: "patient_192",
    channelControlProofRef: "channel_control_192",
    ...overrides,
  };
}

function authorityBinding(overrides = {}) {
  return {
    boundSubjectRef: "nhs_subject_192",
    boundIdentityBindingRef: "identity_binding_192_v3",
    boundSessionEpoch: "session_epoch_192_v1",
    boundSubjectBindingVersion: "subject_binding_192_v3",
    boundPatientRef: "patient_192",
    bindingState: "high_assurance",
    current: true,
    ...overrides,
  };
}

function routeFence(overrides = {}) {
  return {
    routeFamilyRef: "rf_phase2_sms_continuation",
    actionScope: "secure_resume",
    requestSeedRef: "request_seed_192",
    governingObjectVersionRef: "request_seed_192_v1",
    routeIntentBindingRef: "rib_192_sms_continuation",
    lineageFenceRef: "lineage_fence_192_v1",
    manifestVersionRef: "manifest_192_v1",
    releaseApprovalFreezeRef: "release_freeze_192_v1",
    minimumBridgeCapabilitiesRef: "bridge_sms_192_v1",
    channelReleaseFreezeState: "live",
    requiredAudienceSurfaceRuntimeBindingRef: "asrb_patient_sms_192",
    sameLineageRecoveryRouteRef: "recovery://telephony-continuation",
    patientShellContinuityKey: "patient_shell_192",
    patientNavReturnContractRef: "pnrc_192",
    patientShellConsistencyRef: "psc_192",
    ...overrides,
  };
}

function redemptionTuple(family = "continuation_seeded_verified", overrides = {}) {
  const seeded = family === "continuation_seeded_verified";
  return {
    routeFamily: "rf_phase2_sms_continuation",
    actionScope: "secure_resume",
    governingObjectRef: "request_seed_192",
    governingObjectVersionRef: "request_seed_192_v1",
    sessionEpochRef: seeded ? "session_epoch_192_v1" : null,
    subjectBindingVersionRef: seeded ? "subject_binding_192_v3" : null,
    lineageFenceRef: "lineage_fence_192_v1",
    grantFamily: family,
    releaseApprovalFreezeRef: "release_freeze_192_v1",
    manifestVersionRef: "manifest_192_v1",
    channelPosture: "sms",
    embeddedPosture: "not_embedded",
    audienceScope: "patient_public",
    visibilityScope: seeded ? "scoped_phi" : "public_safe_summary",
    ...overrides,
  };
}

function createHarness() {
  const continuationRepository = createInMemoryTelephonyContinuationRepository();
  const accessGrantRepository = createInMemoryAccessGrantSupersessionRepository();
  const accessGrantApp = createAccessGrantSupersessionApplication({
    repository: accessGrantRepository,
  });
  const app = createTelephonyContinuationApplication({
    repository: continuationRepository,
    accessGrantService: accessGrantApp.accessGrantService,
  });
  return { app, continuationRepository, accessGrantRepository };
}

async function settle(app, overrides = {}) {
  return app.service.settleContinuationEligibility({
    callSessionRef,
    idempotencyKey: overrides.idempotencyKey ?? "eligibility_192_seeded",
    evidenceReadinessAssessment: overrides.evidenceReadinessAssessment ?? evidenceReadiness(),
    verificationDecision: Object.prototype.hasOwnProperty.call(overrides, "verificationDecision")
      ? overrides.verificationDecision
      : verification(),
    destinationPosture: overrides.destinationPosture ?? destination(),
    authorityBinding: overrides.authorityBinding ?? authorityBinding(),
    routeFence: overrides.routeFence ?? routeFence(),
    observedAt,
  });
}

async function issue(app, eligibility, overrides = {}) {
  return app.service.issueContinuation({
    idempotencyKey: overrides.idempotencyKey ?? "issue_192_seeded",
    eligibility,
    evidenceReadinessAssessment: overrides.evidenceReadinessAssessment ?? evidenceReadiness(),
    destinationPosture: overrides.destinationPosture ?? destination(),
    authorityBinding: overrides.authorityBinding ?? authorityBinding(),
    routeFence: overrides.routeFence ?? routeFence(),
    actorRef: "telephony_continuation_worker_192",
    observedAt,
    expiresAt: overrides.expiresAt,
  });
}

function expectNoSmsPhiOrTokenLeak(value, token) {
  const text = JSON.stringify(value);
  expect(text).not.toContain(token);
  expect(text).not.toContain("patient_192 has");
  expect(text).not.toContain("NHS");
  expect(text).not.toContain("full phone");
}

describe("TelephonyContinuationGrantService", () => {
  it("issues seeded continuation through canonical AccessGrantService", async () => {
    const { app, continuationRepository } = createHarness();
    const eligibility = await settle(app);
    const issued = await issue(app, eligibility);

    expect(app.persistenceTables).toEqual(telephonyContinuationPersistenceTables);
    expect(app.migrationPlanRefs).toEqual(telephonyContinuationMigrationPlanRefs);
    expect(app.gapResolutions).toEqual(telephonyContinuationGapResolutions);
    expect(app.lifetimePolicy).toEqual(telephonyContinuationLifetimePolicy);
    expect(eligibility.eligibilityState).toBe("eligible_seeded");
    expect(issued.context.requestedGrantFamily).toBe("continuation_seeded_verified");
    expect(issued.grantIssue?.grant.grantFamily).toBe("continuation_seeded_verified");
    expect(issued.materializedToken).toBeTruthy();
    expect(issued.dispatchIntent.dispatchOutcome).toBe("queued");
    expect(issued.messageManifest?.containsPhi).toBe(false);
    expect(issued.messageManifest?.includesSignedUrl).toBe(false);
    expectNoSmsPhiOrTokenLeak(continuationRepository.snapshots(), issued.materializedToken);
  });

  it("downgrades seeded to challenge when seeded destination or binding fences are not lawful", async () => {
    const { app } = createHarness();
    const weakDestination = destination({
      verifiedForPatient: false,
      destinationConfidenceRef: "tdca_192_unverified",
    });
    const weakBinding = authorityBinding({
      bindingState: "candidate",
      boundIdentityBindingRef: null,
      current: true,
    });

    const eligibility = await settle(app, {
      idempotencyKey: "eligibility_192_challenge",
      destinationPosture: weakDestination,
      authorityBinding: weakBinding,
    });
    const issued = await issue(app, eligibility, {
      idempotencyKey: "issue_192_challenge",
      destinationPosture: weakDestination,
      authorityBinding: weakBinding,
    });

    expect(eligibility.eligibilityState).toBe("eligible_challenge");
    expect(eligibility.grantFamilyRecommendation).toBe("continuation_challenge");
    expect(eligibility.reasonCodes).toContain("TEL_CONT_192_DOWNGRADE_SEEDED_TO_CHALLENGE");
    expect(eligibility.downgradeReasonCodes).toContain(
      "TEL_CONT_192_DESTINATION_NOT_VERIFIED_FOR_SEEDED",
    );
    expect(issued.grantIssue?.grant.grantFamily).toBe("continuation_challenge");
    expect(issued.messageManifest?.bodyPreview).toContain("quick check");
    expect(issued.messageManifest?.bodyPreview).not.toContain("patient_192");
  });

  it("routes manual_only without creating a redeemable grant", async () => {
    const { app, accessGrantRepository } = createHarness();
    const manualReadiness = evidenceReadiness({
      telephonyEvidenceReadinessAssessmentRef: "tel_era_192_urgent",
      usabilityState: "urgent_live_only",
      promotionReadiness: "blocked",
    });
    const eligibility = await settle(app, {
      idempotencyKey: "eligibility_192_manual",
      evidenceReadinessAssessment: manualReadiness,
    });
    const issued = await issue(app, eligibility, {
      idempotencyKey: "issue_192_manual",
      evidenceReadinessAssessment: manualReadiness,
    });

    expect(eligibility.eligibilityState).toBe("manual_only");
    expect(issued.context.contextState).toBe("no_grant_manual_only");
    expect(issued.dispatchIntent.dispatchOutcome).toBe("no_redeemable_grant");
    expect(issued.grantIssue).toBeNull();
    expect(issued.materializedToken).toBeNull();
    expect(accessGrantRepository.snapshots().grants).toHaveLength(0);
  });

  it("redeems exact-once and mints a fresh secure-link session with CSRF rotation", async () => {
    const { app } = createHarness();
    const eligibility = await settle(app);
    const issued = await issue(app, eligibility);

    const redeemed = await app.service.redeemContinuation({
      redemptionIdempotencyKey: "redeem_192_seeded",
      presentedToken: issued.materializedToken,
      routeTuple: redemptionTuple("continuation_seeded_verified"),
      actorRef: "sms_browser_192",
      observedAt: "2026-04-15T16:05:00.000Z",
    });

    expect(redeemed.outcome.redemptionState).toBe("session_established");
    expect(redeemed.outcome.grantTokenReuseBlocked).toBe(true);
    expect(redeemed.secureLinkSession?.secureLinkSessionRef).toBeTruthy();
    expect(redeemed.secureLinkSession?.csrfSecretRef).toBeTruthy();
    expect(redeemed.secureLinkSession?.urlGrantReusable).toBe(false);
    expect(redeemed.secureLinkSession?.patientDataDisclosureAllowed).toBe(true);
    expect(redeemed.grantRedemption?.decision).toBe("redeemed");
  });

  it("returns the settled outcome for replayed clicks without a second session", async () => {
    const { app, continuationRepository } = createHarness();
    const eligibility = await settle(app);
    const issued = await issue(app, eligibility);
    const first = await app.service.redeemContinuation({
      redemptionIdempotencyKey: "redeem_192_replay_first",
      presentedToken: issued.materializedToken,
      routeTuple: redemptionTuple("continuation_seeded_verified"),
      actorRef: "sms_browser_192",
      observedAt: "2026-04-15T16:05:00.000Z",
    });
    const second = await app.service.redeemContinuation({
      redemptionIdempotencyKey: "redeem_192_replay_second",
      presentedToken: issued.materializedToken,
      routeTuple: redemptionTuple("continuation_seeded_verified"),
      actorRef: "sms_browser_second_192",
      observedAt: "2026-04-15T16:06:00.000Z",
    });

    expect(second.replayed).toBe(true);
    expect(second.outcome.secureLinkSessionRef).toBe(first.outcome.secureLinkSessionRef);
    expect(second.outcome.reasonCodes).toContain("TEL_CONT_192_REPLAY_RETURNED");
    expect(continuationRepository.snapshots().secureLinkSessions).toHaveLength(1);
  });

  it("supersedes older resend links and recovers same-lineage when the old link is clicked", async () => {
    const { app } = createHarness();
    const eligibility = await settle(app);
    const first = await issue(app, eligibility, { idempotencyKey: "issue_192_first_link" });
    const second = await issue(app, eligibility, { idempotencyKey: "issue_192_resend_link" });

    const staleClick = await app.service.redeemContinuation({
      redemptionIdempotencyKey: "redeem_192_old_link",
      presentedToken: first.materializedToken,
      routeTuple: redemptionTuple("continuation_seeded_verified"),
      actorRef: "sms_browser_192",
      observedAt: "2026-04-15T16:07:00.000Z",
    });

    expect(second.context.supersedesContextRef).toBe(first.context.continuationContextRef);
    expect(staleClick.outcome.redemptionState).toBe("superseded_recovery");
    expect(staleClick.recoveryContinuation?.sameShellRequired).toBe(true);
    expect(staleClick.outcome.reasonCodes).toContain("TEL_CONT_192_SUPERSEDED_LINK_RECOVERY");
  });

  it("issues recovery continuation when step-up interrupts challenge redemption", async () => {
    const { app } = createHarness();
    const eligibility = await settle(app, {
      idempotencyKey: "eligibility_192_step_up",
      verificationDecision: verification({
        nextAllowedContinuationPosture: "challenge_continuation_only",
      }),
    });
    const issued = await issue(app, eligibility, { idempotencyKey: "issue_192_step_up" });

    const interrupted = await app.service.redeemContinuation({
      redemptionIdempotencyKey: "redeem_192_step_up",
      presentedToken: issued.materializedToken,
      routeTuple: redemptionTuple("continuation_challenge"),
      actorRef: "sms_browser_192",
      interruption: "step_up_required",
      observedAt: "2026-04-15T16:05:00.000Z",
    });

    expect(interrupted.outcome.redemptionState).toBe("step_up_interrupted");
    expect(interrupted.secureLinkSession).toBeNull();
    expect(interrupted.recoveryContinuation?.selectedMobileStep).toBe("identity_challenge");
    expect(interrupted.recoveryContinuation?.sameShellRequired).toBe(true);
  });

  it("returns stale-link recovery when route or lineage fences drift", async () => {
    const { app } = createHarness();
    const eligibility = await settle(app);
    const issued = await issue(app, eligibility);

    const stale = await app.service.redeemContinuation({
      redemptionIdempotencyKey: "redeem_192_stale_route",
      presentedToken: issued.materializedToken,
      routeTuple: redemptionTuple("continuation_seeded_verified", {
        lineageFenceRef: "lineage_fence_192_v2",
      }),
      actorRef: "sms_browser_192",
      observedAt: "2026-04-15T16:05:00.000Z",
    });

    expect(stale.outcome.redemptionState).toBe("stale_link_recovery");
    expect(stale.recoveryContinuation?.selectedMobileStep).toBe("stale_link_recovery");
    expect(stale.outcome.reasonCodes).toContain("TEL_CONT_192_STALE_LINK_RECOVERY");
  });

  it("preserves same-shell continuity after interruption through RecoveryContinuationToken", async () => {
    const { app } = createHarness();
    const eligibility = await settle(app, {
      idempotencyKey: "eligibility_192_same_shell",
      verificationDecision: verification({
        nextAllowedContinuationPosture: "challenge_continuation_only",
      }),
    });
    const issued = await issue(app, eligibility, { idempotencyKey: "issue_192_same_shell" });
    const interrupted = await app.service.redeemContinuation({
      redemptionIdempotencyKey: "redeem_192_same_shell",
      presentedToken: issued.materializedToken,
      routeTuple: redemptionTuple("continuation_challenge"),
      actorRef: "sms_browser_192",
      interruption: "step_up_required",
      observedAt: "2026-04-15T16:05:00.000Z",
    });

    const consumed = await app.service.consumeRecoveryContinuation({
      recoveryContinuationRef: interrupted.outcome.recoveryContinuationRef,
    });

    expect(consumed.sameShellContinuityPreserved).toBe(true);
    expect(consumed.recoveryContinuation.requestSeedRef).toBe("request_seed_192");
    expect(consumed.recoveryContinuation.shellContinuityKey).toContain("request_seed_192");
  });
});
