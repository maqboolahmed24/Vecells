import { describe, expect, it } from "vitest";
import { createIntakeSubmitApplication } from "../src/intake-submit.ts";

function runtimeContext(overrides = {}) {
  return {
    routeFamilyRef: "rf_intake_self_service",
    actionScope: "envelope_resume",
    lineageScope: "envelope",
    routeIntentBindingRef: "RIB_148_SUBMIT_V1",
    routeIntentBindingState: "live",
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
    channelReleaseFreezeState: "monitoring",
    manifestVersionRef: "manifest_phase1_browser_v1",
    sessionEpochRef: "session_epoch_browser_v1",
    ...overrides,
  };
}

function runtimeContextFromLease(lease, overrides = {}) {
  const snapshot = lease.toSnapshot();
  return runtimeContext({
    routeFamilyRef: snapshot.routeFamilyRef,
    routeIntentBindingRef: snapshot.routeIntentBindingRef,
    audienceSurfaceRuntimeBindingRef: snapshot.audienceSurfaceRuntimeBindingRef,
    releaseApprovalFreezeRef: snapshot.releaseApprovalFreezeRef,
    channelReleaseFreezeState: snapshot.channelReleaseFreezeState,
    manifestVersionRef: snapshot.manifestVersionRef,
    sessionEpochRef: snapshot.sessionEpochRef,
    subjectBindingVersionRef: snapshot.subjectBindingVersionRef,
    subjectRef: snapshot.subjectRef,
    ...overrides,
  });
}

async function buildReadyDraft(application, overrides = {}) {
  const created = await application.drafts.createDraft({
    requestType: "Symptoms",
    surfaceChannelProfile: "browser",
    routeEntryRef: "phase1_intake_entry",
    createdAt: "2026-04-14T22:00:00Z",
    sessionEpochRef: "session_epoch_browser_v1",
  });

  const patched = await application.drafts.patchDraft(
    created.view.draftPublicId,
    {
      draftVersion: created.view.draftVersion,
      clientCommandId: "cmd_submit_patch_148_001",
      idempotencyKey: "idem_submit_patch_148_001",
      leaseId: created.lease.leaseId,
      resumeToken: created.view.resumeToken,
      structuredAnswers: {
        "symptoms.category": "general",
        "symptoms.onsetPrecision": "exact_date",
        "symptoms.onsetDate": "2026-04-10",
        "symptoms.worseningNow": false,
        "symptoms.severityClues": ["sleep_affected"],
        "symptoms.narrative":
          overrides.freeTextNarrative ?? "The problem has been getting harder to ignore.",
        ...overrides.structuredAnswers,
      },
      freeTextNarrative:
        overrides.freeTextNarrative ?? "The problem has been getting harder to ignore.",
      currentStepKey: "review_submit",
      completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
      currentPathname: `/intake/drafts/${created.view.draftPublicId}/review-submit`,
      shellContinuityKey: "patient.portal.requests",
      selectedAnchorKey: overrides.selectedAnchorKey ?? "request-proof",
      recordedAt: "2026-04-14T22:01:00Z",
    },
    runtimeContextFromLease(created.lease),
  );

  await application.contactPreferenceApp.captureContactPreferences({
    draftPublicId: created.view.draftPublicId,
    preferredChannel: "sms",
    destinations: {
      sms: "+44 7700 900123",
      phone: "+44 7700 900456",
      email: "patient@example.com",
    },
    contactWindow: "weekday_daytime",
    voicemailAllowed: true,
    followUpPermission: true,
    quietHours: {
      startLocalTime: "20:00",
      endLocalTime: "08:00",
      timezone: "Europe/London",
    },
    languagePreference: "en",
    translationRequired: false,
    accessibilityNeeds: ["large_text"],
    sourceEvidenceRef: "draft_patch::contact_pref_148_001",
    clientCommandId: "cmd_contact_pref_148_001",
    idempotencyKey: "idem_contact_pref_148_001",
    recordedAt: "2026-04-14T22:02:00Z",
  });

  if (overrides.withAttachment) {
    const initiated = await application.attachmentApp.initiateAttachmentUpload({
      draftPublicId: created.view.draftPublicId,
      fileName: "proof.pdf",
      declaredMimeType: "application/pdf",
      byteSize: 2048,
      initiatedAt: "2026-04-14T22:02:10Z",
      clientUploadId: "upl_submit_148_001",
    });
    await application.attachmentApp.recordAttachmentUpload({
      uploadSessionId: initiated.uploadSession.uploadSessionId,
      fileName: "proof.pdf",
      reportedMimeType: "application/pdf",
      bytes: Buffer.from("proof-pdf"),
      uploadedAt: "2026-04-14T22:02:11Z",
    });
    await application.attachmentApp.runAttachmentWorker({
      now: "2026-04-14T22:02:12Z",
    });
  }

  application.validation.seedUrgentDecisionState(created.view.draftPublicId, "clear");
  application.validation.seedConvergenceState(created.view.draftPublicId, "valid");

  const projection = await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(
    created.view.draftPublicId,
  );

  return {
    created,
    patched,
    projection,
  };
}

async function currentSubmitCommand(application, draftPublicId, overrides = {}) {
  const projection = await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(
    draftPublicId,
  );
  const snapshot = projection.toSnapshot();
  return {
    draftPublicId,
    draftVersion: snapshot.authoritativeDraftVersion,
    leaseId: snapshot.activeLeaseRef,
    resumeToken: snapshot.resumeToken,
    clientCommandId: "cmd_submit_148_001",
    idempotencyKey: "idem_submit_148_001",
    sourceCommandId: "source_submit_148_001",
    transportCorrelationId: "transport_submit_148_001",
    intentGeneration: 1,
    observedAt: "2026-04-14T22:03:00Z",
    ...overrides,
  };
}

describe("intake submit application seam", () => {
  it("freezes immutable evidence, promotes one request lineage, and supersedes live draft mutability in one transaction", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);

    const result = await application.submitDraft(
      await currentSubmitCommand(application, created.view.draftPublicId),
    );
    const routeResolution = await application.drafts.resolveDraftRouteEntry({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      leaseId: created.lease.leaseId,
      entrySurface: "refresh",
      observedAt: "2026-04-14T22:03:06Z",
    });

    const request = await application.repositories.getRequest(result.requestRef);
    const requestLineage = await application.repositories.getRequestLineage(result.requestLineageRef);
    const lease = await application.repositories.getDraftLease(created.lease.leaseId);
    const promotionRecords = await application.repositories.listSubmissionPromotionRecords();
    const confirmationEnvelopes =
      await application.confirmationDispatch.communicationRepositories.listCommunicationEnvelopes();
    const confirmationBridges =
      await application.confirmationDispatch.communicationRepositories.listReceiptBridges();
    const activeGrants = (
      await application.repositories.listAccessGrantsForGoverningObject(result.settlement.envelopeRef)
    ).filter((grant) => {
      const state = grant.toSnapshot().grantState;
      return state !== "superseded" && state !== "rotated" && state !== "revoked" && state !== "expired";
    });

    expect(result.decisionClass).toBe("new_lineage");
    expect(result.replayed).toBe(false);
    expect(result.settlement.toSnapshot().settlementState).toBe("request_submitted");
    expect(result.submissionSnapshotFreeze?.toSnapshot().evidenceCaptureBundleRef).toBe(
      result.evidenceCaptureBundleRef,
    );
    expect(result.normalizedSubmission?.toSnapshot().normalizationVersionRef).toBe(
      "PHASE1_NORMALIZED_SUBMISSION_V1",
    );
    expect(result.normalizationSeed?.toSnapshot().submitNormalizationSeedId).toBe(
      result.settlement.toSnapshot().normalizedSubmissionRef,
    );
    expect(result.evidenceClassification?.classificationDecisionId).toBeTruthy();
    expect(result.safetyPreemption?.preemptionId).toBeTruthy();
    expect(result.safetyDecision?.safetyDecisionId).toBeTruthy();
    expect(result.normalizationSeed?.toSnapshot().normalizedPayload.requestShape).toMatchObject({
      symptoms: {
        symptomCategoryCode: "general",
      },
    });
    expect(result.outcomeTuple?.outcomeResult).toBe("triage_ready");
    expect(result.outcomeTuple?.appliesToState).toBe("screen_clear");
    expect(result.outcomePresentationArtifact?.copyVariantRef).toBe("COPYVAR_142_SAFE_CLEAR_V1");
    expect(result.receiptConsistencyEnvelope?.promiseState).toBe("on_track");
    expect(result.outboundNavigationGrant).toBeNull();
    expect(result.triageTask?.requestRef).toBe(result.requestRef);
    expect(result.triageTask?.taskState).toBe("queued");
    expect(result.triageEtaForecast?.triageTaskRef).toBe(result.triageTask?.triageTaskId);
    expect(result.patientStatusProjection?.triageTaskRef).toBe(result.triageTask?.triageTaskId);
    expect(request?.toSnapshot().workflowState).toBe("triage_ready");
    expect(request?.toSnapshot().currentTriageTaskRef).toBe(result.triageTask?.triageTaskId);
    expect(request?.toSnapshot().assignedQueueRef).toBe(result.triageTask?.workflowQueueRef);
    expect(requestLineage?.toSnapshot().latestTriageTaskRef).toBe(result.triageTask?.triageTaskId);
    expect(request?.toSnapshot().safetyState).toBe(
      result.safetyDecision?.requestedSafetyState ?? "not_screened",
    );
    expect(request?.toSnapshot().currentEvidenceClassificationRef).toBe(
      result.evidenceClassification?.classificationDecisionId,
    );
    expect(request?.toSnapshot().currentSafetyDecisionRef).toBe(
      result.safetyDecision?.safetyDecisionId,
    );
    expect(lease?.toSnapshot().leaseState).toBe("superseded");
    expect(activeGrants).toEqual([]);
    expect(promotionRecords).toHaveLength(1);
    expect(confirmationEnvelopes).toHaveLength(1);
    expect(confirmationEnvelopes[0]?.toSnapshot().receiptEnvelopeRef).toBe(
      result.receiptConsistencyEnvelope?.consistencyEnvelopeId,
    );
    expect(confirmationEnvelopes[0]?.toSnapshot().dispatchEligibilityState).toBe(
      "blocked_route_truth",
    );
    expect(confirmationBridges[0]?.toSnapshot().authoritativeOutcomeState).toBe(
      "recovery_required",
    );
    expect(routeResolution.entryAuthorityState).toBe("request_redirect");
    expect(routeResolution.targetIntent).toBe("open_request_receipt");
    expect(routeResolution.promotedRequestRef).toBe(result.requestRef);
    expect(routeResolution.targetPathname).toBe(
      `/intake/requests/${routeResolution.requestPublicId}/receipt`,
    );
    expect(routeResolution.receiptConsistencyKey).toBe(
      result.receiptConsistencyEnvelope?.receiptConsistencyKey ?? null,
    );
    expect(routeResolution.proofState).toBe("grant_superseded_same_lineage");
    expect(result.events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "request.created",
        "request.submitted",
        "request.safety.classified",
        "request.safety.preempted",
        "request.safety.decided",
        "triage.task.created",
        "patient.receipt.issued",
        "patient.receipt.consistency.updated",
        "communication.queued",
        "communication.receipt.enveloped",
      ]),
    );
  });

  it("issues urgent diversion durably and moves the promoted request into urgent_diverted", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application, {
      structuredAnswers: {
        "symptoms.category": "chest_breathing",
        "symptoms.chestPainLocation": "centre_chest",
        "symptoms.onsetPrecision": "exact_date",
        "symptoms.onsetDate": "2026-04-14",
        "symptoms.worseningNow": true,
        "symptoms.severityClues": ["mobility_affected", "sudden_change"],
        "symptoms.narrative": "Chest pain and struggling to breathe right now.",
      },
      freeTextNarrative: "Chest pain and struggling to breathe right now.",
    });

    const result = await application.submitDraft(
      await currentSubmitCommand(application, created.view.draftPublicId, {
        observedAt: "2026-04-14T22:03:05Z",
      }),
    );
    const routeResolution = await application.drafts.resolveDraftRouteEntry({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      leaseId: created.lease.leaseId,
      entrySurface: "auth_return",
      observedAt: "2026-04-14T22:03:06Z",
    });

    const request = await application.repositories.getRequest(result.requestRef);

    expect(result.safetyDecision?.requestedSafetyState).toBe("urgent_diversion_required");
    expect(result.safetyDecision?.decisionOutcome).toBe("urgent_required");
    expect(result.urgentDiversionSettlement?.settlementState).toBe("issued");
    expect(result.outcomeTuple?.outcomeResult).toBe("urgent_diversion");
    expect(result.outcomeTuple?.appliesToState).toBe("urgent_diverted");
    expect(result.outcomePresentationArtifact?.copyVariantRef).toBe("COPYVAR_142_URGENT_ISSUED_V1");
    expect(result.receiptConsistencyEnvelope).toBeNull();
    expect(result.outboundNavigationGrant?.destinationType).toBe("external_browser");
    expect(result.triageTask).toBeNull();
    expect(result.triageEtaForecast).toBeNull();
    expect(result.patientStatusProjection).toBeNull();
    expect(request?.toSnapshot().workflowState).toBe("intake_normalized");
    expect(request?.toSnapshot().safetyState).toBe("urgent_diverted");
    expect(request?.toSnapshot().currentUrgentDiversionSettlementRef).toBe(
      result.urgentDiversionSettlement?.urgentDiversionSettlementId,
    );
    expect(routeResolution.entryAuthorityState).toBe("request_redirect");
    expect(routeResolution.targetIntent).toBe("open_urgent_guidance");
    expect(routeResolution.targetPathname).toBe(
      `/intake/requests/${routeResolution.requestPublicId}/urgent-guidance`,
    );
    expect(result.events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "request.safety.urgent_diversion_required",
        "safety.urgent_diversion.completed",
      ]),
    );
  });

  it("returns the prior authoritative settlement on exact replay without creating a second request", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);
    const command = await currentSubmitCommand(application, created.view.draftPublicId);

    const first = await application.submitDraft(command);
    const replay = await application.submitDraft({
      ...command,
      observedAt: "2026-04-14T22:03:10Z",
    });

    expect(first.decisionClass).toBe("new_lineage");
    expect(replay.decisionClass).toBe("exact_replay");
    expect(replay.replayed).toBe(true);
    expect(replay.requestRef).toBe(first.requestRef);
    expect(replay.settlement.intakeSubmitSettlementId).toBe(
      first.settlement.intakeSubmitSettlementId,
    );
    expect(await application.repositories.listRequests()).toHaveLength(1);
    expect(await application.transactionRepositories.listIntakeSubmitSettlements()).toHaveLength(1);
  });

  it("returns semantic replay when raw draft evidence drifts but the semantic submit fingerprint stays stable", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);
    const command = await currentSubmitCommand(application, created.view.draftPublicId);

    const first = await application.submitDraft(command);
    const projection = await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(
      created.view.draftPublicId,
    );
    const snapshot = projection.toSnapshot();
    const rawOnlyUpdate = projection.withSystemAttachmentRefs({
      attachmentRefs: snapshot.attachmentRefs,
      latestSettlementRef: "system_rewrite_for_semantic_replay",
      recordedAt: "2026-04-14T22:03:05Z",
    });
    await application.repositories.saveDraftContinuityEvidenceProjection(rawOnlyUpdate, {
      expectedVersion: snapshot.version,
    });

    const replay = await application.submitDraft({
      ...command,
      observedAt: "2026-04-14T22:03:20Z",
    });

    expect(replay.decisionClass).toBe("semantic_replay");
    expect(replay.replayed).toBe(true);
    expect(replay.requestRef).toBe(first.requestRef);
    expect(replay.settlement.intakeSubmitSettlementId).toBe(
      first.settlement.intakeSubmitSettlementId,
    );
    expect(await application.repositories.listRequests()).toHaveLength(1);
  });

  it("opens explicit collision review when a reused command key arrives with changed submit semantics", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);
    const command = await currentSubmitCommand(application, created.view.draftPublicId);

    const first = await application.submitDraft(command);
    const projection = await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(
      created.view.draftPublicId,
    );
    const snapshot = projection.toSnapshot();
    const semanticChange = projection.withSystemAttachmentRefs({
      attachmentRefs: [...snapshot.attachmentRefs, "att_collision_148_extra"],
      latestSettlementRef: "system_rewrite_for_collision_review",
      recordedAt: "2026-04-14T22:03:06Z",
    });
    await application.repositories.saveDraftContinuityEvidenceProjection(semanticChange, {
      expectedVersion: snapshot.version,
    });

    const collision = await application.submitDraft({
      ...command,
      observedAt: "2026-04-14T22:03:30Z",
    });

    expect(first.decisionClass).toBe("new_lineage");
    expect(collision.decisionClass).toBe("collision_review");
    expect(collision.replayed).toBe(false);
    expect(collision.requestRef).toBeNull();
    expect(collision.settlement.toSnapshot().settlementState).toBe("collision_review_open");
    expect(collision.settlement.toSnapshot().collisionReviewRef).toBeTruthy();
    expect(collision.submissionSnapshotFreeze).not.toBeNull();
    expect(await application.repositories.listRequests()).toHaveLength(1);
    expect(await application.transactionRepositories.listSubmissionSnapshotFreezes()).toHaveLength(2);
  });

  it("returns a stale recoverable settlement when the resume token or active lease is no longer authoritative", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);

    const stale = await application.submitDraft({
      ...(await currentSubmitCommand(application, created.view.draftPublicId)),
      leaseId: "lease_missing_148",
      resumeToken: "resume_token_stale_148",
      observedAt: "2026-04-14T22:03:40Z",
    });

    expect(stale.decisionClass).toBe("stale_recoverable");
    expect(stale.requestRef).toBeNull();
    expect(stale.settlement.toSnapshot().settlementState).toBe("recovery_required");
    expect(stale.outcomeTuple?.outcomeResult).toBe("stale_recoverable");
    expect(stale.receiptConsistencyEnvelope?.promiseState).toBe("recovery_required");
    expect(stale.events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "patient.receipt.degraded",
        "patient.receipt.consistency.updated",
      ]),
    );
    expect(stale.reasonCodes).toEqual(
      expect.arrayContaining([
        "DRAFT_LEASE_NOT_FOUND",
        "DRAFT_RESUME_TOKEN_MISMATCH",
        "DRAFT_ACTIVE_LEASE_MISMATCH",
      ]),
    );
    expect(await application.repositories.listRequests()).toHaveLength(0);
    expect(await application.transactionRepositories.listSubmissionSnapshotFreezes()).toHaveLength(0);
  });

  it("publishes denied-scope recovery grammar when submit readiness blocks the draft", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);

    application.validation.seedConvergenceState(created.view.draftPublicId, "invalid");

    const blocked = await application.submitDraft(
      await currentSubmitCommand(application, created.view.draftPublicId, {
        observedAt: "2026-04-14T22:03:45Z",
      }),
    );

    expect(blocked.decisionClass).toBe("submit_blocked");
    expect(blocked.requestRef).toBeNull();
    expect(blocked.settlement.toSnapshot().settlementState).toBe("submit_blocked");
    expect(blocked.outcomeTuple?.outcomeResult).toBe("denied_scope");
    expect(blocked.outcomeTuple?.appliesToState).toBe("denied_scope");
    expect(blocked.outcomePresentationArtifact?.copyVariantRef).toBe(
      "COPYVAR_151_DENIED_SCOPE_V1",
    );
    expect(blocked.receiptConsistencyEnvelope?.promiseState).toBe("recovery_required");
  });

  it("serializes concurrent double-submit attempts behind the promotion boundary and reuses one request", async () => {
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);
    const command = await currentSubmitCommand(application, created.view.draftPublicId);

    const [left, right] = await Promise.all([
      application.submitDraft(command),
      application.submitDraft({
        ...command,
        observedAt: "2026-04-14T22:03:50Z",
      }),
    ]);

    const decisions = [left.decisionClass, right.decisionClass].sort();
    const committed = left.decisionClass === "new_lineage" ? left : right;
    const replay = left.decisionClass === "new_lineage" ? right : left;

    expect(decisions).toEqual(["exact_replay", "new_lineage"]);
    expect(replay.requestRef).toBe(committed.requestRef);
    expect(await application.repositories.listRequests()).toHaveLength(1);
    expect(await application.transactionRepositories.listIntakeSubmitSettlements()).toHaveLength(1);
  });
});
