import { describe, expect, it } from "vitest";
import {
  createDraftAutosaveStore,
  createDraftSessionAutosaveService,
  createSubmissionBackboneCommandService,
} from "../src/index.ts";
import {
  createDeterministicBackboneIdGenerator,
  RequestAggregate,
} from "@vecells/domain-kernel";

function runtimeContext(overrides: Record<string, unknown> = {}) {
  return {
    routeFamilyRef: "rf_intake_self_service",
    actionScope: "envelope_resume",
    lineageScope: "envelope" as const,
    routeIntentBindingRef: "RIB_144_DRAFT_RESUME_V1",
    routeIntentBindingState: "live" as const,
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
    channelReleaseFreezeState: "monitoring" as const,
    manifestVersionRef: "manifest_phase1_browser_v1",
    sessionEpochRef: "session_epoch_browser_v1",
    ...overrides,
  };
}

function runtimeContextFromLease(lease: { toSnapshot(): Record<string, unknown> }, overrides = {}) {
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

async function createSeededDraft() {
  const store = createDraftAutosaveStore();
  const draftService = createDraftSessionAutosaveService(
    store,
    createDeterministicBackboneIdGenerator("par144_draft_service"),
  );

  const created = await draftService.createDraft({
    requestType: "Symptoms",
    surfaceChannelProfile: "browser",
    routeEntryRef: "phase1_intake_entry",
    createdAt: "2026-10-14T14:30:00Z",
    sessionEpochRef: "session_epoch_browser_v1",
  });

  return { store, draftService, created };
}

describe("draft session autosave backbone", () => {
  it("creates a canonical draft, records one accepted mutation, and replays idempotent autosave safely", async () => {
    const { store, draftService, created } = await createSeededDraft();

    expect(created.events.map((event) => event.eventType)).toEqual(["intake.draft.created"]);
    expect(store.getDraftMutabilitySnapshot(created.envelope.envelopeId)).toEqual({
      liveAccessGrantRefs: [created.accessGrant.grantId],
      liveDraftLeaseRefs: [created.lease.leaseId],
    });

    const firstPatch = await draftService.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "draft_cmd_001",
        idempotencyKey: "draft_patch_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: { symptomDuration: "3_days" },
        freeTextNarrative: "Pain has been steadily increasing.",
        currentStepKey: "details",
        completedStepKeys: ["request_type", "details"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2026-10-14T14:31:00Z",
      },
      runtimeContextFromLease(created.lease),
    );
    const replayedPatch = await draftService.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "draft_cmd_001",
        idempotencyKey: "draft_patch_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: { symptomDuration: "3_days" },
        freeTextNarrative: "Pain has been steadily increasing.",
        currentStepKey: "details",
        completedStepKeys: ["request_type", "details"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2026-10-14T14:31:30Z",
      },
      runtimeContextFromLease(created.lease),
    );

    expect(firstPatch.replayed).toBe(false);
    expect(firstPatch.saveSettlement.toSnapshot().ackState).toBe("saved_authoritative");
    expect(firstPatch.view.draftVersion).toBe(2);
    expect(firstPatch.events.map((event) => event.eventType)).toEqual([
      "intake.draft.updated",
      "intake.resume.continuity.updated",
    ]);
    expect(replayedPatch.replayed).toBe(true);
    expect(replayedPatch.mutationRecord?.mutationId).toBe(firstPatch.mutationRecord?.mutationId);
    expect(await store.listDraftMutations()).toHaveLength(1);
    expect(await store.listDraftSaveSettlements()).toHaveLength(1);
  });

  it("allows background read-only leases without superseding the foreground owner and blocks mutation from that lane", async () => {
    const { draftService, created } = await createSeededDraft();

    const resumed = await draftService.resumeDraft({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      requestedLeaseMode: "background_read_only",
      resumedAt: "2026-10-14T14:32:00Z",
      sessionEpochRef: created.lease.toSnapshot().sessionEpochRef,
      routeFamilyRef: created.lease.toSnapshot().routeFamilyRef,
      routeIntentBindingRef: created.lease.toSnapshot().routeIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: created.lease.toSnapshot().audienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: created.lease.toSnapshot().releaseApprovalFreezeRef,
      channelReleaseFreezeState: created.lease.toSnapshot().channelReleaseFreezeState,
      manifestVersionRef: created.lease.toSnapshot().manifestVersionRef,
    });

    expect(resumed.reusedExistingLease).toBe(false);
    expect(resumed.lease.toSnapshot().leaseMode).toBe("background_read_only");
    expect(resumed.continuityProjection.toSnapshot().continuityState).toBe("stable_read_only");
    expect(created.lease.toSnapshot().leaseState).toBe("live");

    const blockedPatch = await draftService.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: resumed.view.draftVersion,
        clientCommandId: "draft_cmd_background_001",
        idempotencyKey: "draft_patch_background_001",
        leaseId: resumed.lease.leaseId,
        resumeToken: created.view.resumeToken,
        freeTextNarrative: "Background lane attempted a mutation.",
        currentStepKey: "details",
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        recordedAt: "2026-10-14T14:32:30Z",
      },
      runtimeContextFromLease(resumed.lease),
    );

    expect(blockedPatch.saveSettlement.toSnapshot().ackState).toBe("recovery_required");
    expect(blockedPatch.recoveryRecord?.toSnapshot().reasonCodes).toContain(
      "BACKGROUND_LEASE_MUTATION_FORBIDDEN",
    );
    expect(blockedPatch.mutationRecord).toBeNull();
  });

  it("supersedes the old foreground lease on a new foreground resume and routes stale owners into recovery", async () => {
    const { draftService, created } = await createSeededDraft();

    const resumed = await draftService.resumeDraft({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      requestedLeaseMode: "foreground_mutating",
      resumedAt: "2026-10-14T14:33:00Z",
      sessionEpochRef: created.lease.toSnapshot().sessionEpochRef,
      routeFamilyRef: created.lease.toSnapshot().routeFamilyRef,
      routeIntentBindingRef: created.lease.toSnapshot().routeIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: created.lease.toSnapshot().audienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: created.lease.toSnapshot().releaseApprovalFreezeRef,
      channelReleaseFreezeState: created.lease.toSnapshot().channelReleaseFreezeState,
      manifestVersionRef: created.lease.toSnapshot().manifestVersionRef,
    });

    expect(resumed.reusedExistingLease).toBe(false);
    expect(resumed.recoveryRecord?.toSnapshot().recoveryReason).toBe("lease_superseded");

    const stalePatch = await draftService.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "draft_cmd_stale_owner_001",
        idempotencyKey: "draft_patch_stale_owner_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        freeTextNarrative: "Original tab attempted a stale mutation.",
        currentStepKey: "details",
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        recordedAt: "2026-10-14T14:33:30Z",
      },
      runtimeContextFromLease(created.lease),
    );

    expect(stalePatch.saveSettlement.toSnapshot().ackState).toBe("recovery_required");
    expect(stalePatch.recoveryRecord?.toSnapshot().reasonCodes).toContain("LEASE_NOT_LIVE");
  });

  it("opens a semantic merge plan instead of silently overwriting when draftVersion is stale", async () => {
    const { draftService, created } = await createSeededDraft();

    await draftService.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "draft_cmd_merge_seed_001",
        idempotencyKey: "draft_patch_merge_seed_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: { symptomDuration: "3_days" },
        currentStepKey: "details",
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        recordedAt: "2026-10-14T14:34:00Z",
      },
      runtimeContextFromLease(created.lease),
    );

    const mergeRequired = await draftService.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "draft_cmd_merge_conflict_001",
        idempotencyKey: "draft_patch_merge_conflict_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: { symptomDuration: "7_days" },
        currentStepKey: "details",
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        recordedAt: "2026-10-14T14:34:30Z",
      },
      runtimeContextFromLease(created.lease),
    );

    expect(mergeRequired.saveSettlement.toSnapshot().ackState).toBe("merge_required");
    expect(mergeRequired.saveSettlement.toSnapshot().reasonCodes).toContain(
      "DRAFT_VERSION_CONFLICT",
    );
    expect(mergeRequired.mergePlan?.toSnapshot().mergeState).toBe("open");
    expect(mergeRequired.mergePlan?.toSnapshot().conflictingFieldRefs[0]?.fieldRef).toBe(
      "structuredAnswers",
    );
    expect(mergeRequired.view.uiJourneyState.sameShellRecoveryState).toBe("recovery_only");
  });

  it("supersedes active draft grants and leases once promotion commits", async () => {
    const { store, draftService, created } = await createSeededDraft();
    const submissionCommands = createSubmissionBackboneCommandService(
      store,
      createDeterministicBackboneIdGenerator("par144_promotion_boundary"),
    );

    await submissionCommands.appendEnvelopeIngress({
      envelopeId: created.envelope.envelopeId,
      ingressRecordRef: "ingress_par144_001",
      updatedAt: "2026-10-14T14:35:00Z",
    });
    await submissionCommands.attachEnvelopeEvidence({
      envelopeId: created.envelope.envelopeId,
      evidenceSnapshotRef: "snapshot_par144_001",
      updatedAt: "2026-10-14T14:35:30Z",
    });
    await submissionCommands.attachEnvelopeNormalization({
      envelopeId: created.envelope.envelopeId,
      normalizedSubmissionRef: "normalized_par144_001",
      updatedAt: "2026-10-14T14:36:00Z",
    });
    await submissionCommands.markEnvelopeReady({
      envelopeId: created.envelope.envelopeId,
      promotionDecisionRef: "promotion_decision_par144_001",
      updatedAt: "2026-10-14T14:36:30Z",
    });
    await submissionCommands.promoteEnvelope({
      envelopeId: created.envelope.envelopeId,
      promotedAt: "2026-10-14T14:37:00Z",
      tenantId: "tenant_par144",
      requestType: "Symptoms",
      episodeFingerprint: "episode_fingerprint_par144",
      promotionCommandActionRecordRef: "cmd_action_par144",
      promotionCommandSettlementRecordRef: "cmd_settlement_par144",
      supersededAccessGrantRefs: [created.accessGrant.grantId],
      supersededDraftLeaseRefs: [created.lease.leaseId],
    });

    const superseded = await draftService.supersedeDraftForPromotion({
      draftPublicId: created.view.draftPublicId,
      recordedAt: "2026-10-14T14:37:30Z",
    });

    expect(superseded.supersededLeases).toHaveLength(1);
    expect(superseded.continuityProjection.toSnapshot().continuityState).toBe("blocked");
    expect(superseded.recoveryRecord.toSnapshot().recoveryReason).toBe(
      "promoted_request_available",
    );
    expect(superseded.supersession?.supersession.toSnapshot().causeClass).toBe("draft_promoted");
  });

  it("keeps promotion supersession exact-once and resolves stale route entry to the authoritative request shell", async () => {
    const { store, draftService, created } = await createSeededDraft();
    const submissionCommands = createSubmissionBackboneCommandService(
      store,
      createDeterministicBackboneIdGenerator("par154_promotion_boundary"),
    );

    await submissionCommands.appendEnvelopeIngress({
      envelopeId: created.envelope.envelopeId,
      ingressRecordRef: "ingress_par154_001",
      updatedAt: "2026-10-14T14:40:00Z",
    });
    await submissionCommands.attachEnvelopeEvidence({
      envelopeId: created.envelope.envelopeId,
      evidenceSnapshotRef: "snapshot_par154_001",
      updatedAt: "2026-10-14T14:40:30Z",
    });
    await submissionCommands.attachEnvelopeNormalization({
      envelopeId: created.envelope.envelopeId,
      normalizedSubmissionRef: "normalized_par154_001",
      updatedAt: "2026-10-14T14:41:00Z",
    });
    await submissionCommands.markEnvelopeReady({
      envelopeId: created.envelope.envelopeId,
      promotionDecisionRef: "promotion_decision_par154_001",
      updatedAt: "2026-10-14T14:41:30Z",
    });
    await submissionCommands.promoteEnvelope({
      envelopeId: created.envelope.envelopeId,
      promotedAt: "2026-10-14T14:42:00Z",
      tenantId: "tenant_par154",
      requestType: "Symptoms",
      episodeFingerprint: "episode_fingerprint_par154",
      promotionCommandActionRecordRef: "cmd_action_par154",
      promotionCommandSettlementRecordRef: "cmd_settlement_par154",
      supersededAccessGrantRefs: [created.accessGrant.grantId],
      supersededDraftLeaseRefs: [created.lease.leaseId],
    });

    const first = await draftService.supersedeDraftForPromotion({
      draftPublicId: created.view.draftPublicId,
      recordedAt: "2026-10-14T14:42:30Z",
      reasonCodes: ["DRAFT_PROMOTED_IMMUTABLE_SUBMIT_BOUNDARY"],
    });
    const replay = await draftService.supersedeDraftForPromotion({
      draftPublicId: created.view.draftPublicId,
      recordedAt: "2026-10-14T14:42:45Z",
      reasonCodes: ["DRAFT_PROMOTED_IMMUTABLE_SUBMIT_BOUNDARY"],
    });
    const resolution = await draftService.resolveDraftRouteEntry({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      leaseId: created.lease.leaseId,
      entrySurface: "refresh",
      observedAt: "2026-10-14T14:43:00Z",
    });
    const denied = await draftService.resolveDraftRouteEntry({
      draftPublicId: created.view.draftPublicId,
      entrySurface: "browser_reentry",
      observedAt: "2026-10-14T14:43:10Z",
    });

    expect(replay.recoveryRecord.recoveryRecordId).toBe(first.recoveryRecord.recoveryRecordId);
    expect(replay.continuityProjection.projectionId).toBe(first.continuityProjection.projectionId);
    expect(await store.listAccessGrantSupersessions()).toHaveLength(1);
    expect(
      (await store.listDraftRecoveryRecords()).filter(
        (record) => record.toSnapshot().recoveryReason === "promoted_request_available",
      ),
    ).toHaveLength(1);
    expect(resolution.entryAuthorityState).toBe("request_redirect");
    expect(resolution.targetIntent).toBe("open_request_receipt");
    expect(resolution.targetPathname).toBe(
      `/intake/requests/${resolution.requestPublicId}/receipt`,
    );
    expect(resolution.proofState).toBe("grant_superseded_same_lineage");
    expect(resolution.mutatingResumeState).toBe("blocked");
    expect(denied.entryAuthorityState).toBe("denied_scope");
    expect(denied.requestPublicId).toBeNull();
    expect(denied.targetPathname).toBe(
      `/intake/drafts/${created.view.draftPublicId}/recovery`,
    );
  });

  it("routes same-lineage promoted draft re-entry to request status once the request is already active", async () => {
    const { store, draftService, created } = await createSeededDraft();
    const submissionCommands = createSubmissionBackboneCommandService(
      store,
      createDeterministicBackboneIdGenerator("par154_status_boundary"),
    );

    await submissionCommands.appendEnvelopeIngress({
      envelopeId: created.envelope.envelopeId,
      ingressRecordRef: "ingress_par154_status_001",
      updatedAt: "2026-10-14T14:48:00Z",
    });
    await submissionCommands.attachEnvelopeEvidence({
      envelopeId: created.envelope.envelopeId,
      evidenceSnapshotRef: "snapshot_par154_status_001",
      updatedAt: "2026-10-14T14:48:30Z",
    });
    await submissionCommands.attachEnvelopeNormalization({
      envelopeId: created.envelope.envelopeId,
      normalizedSubmissionRef: "normalized_par154_status_001",
      updatedAt: "2026-10-14T14:49:00Z",
    });
    await submissionCommands.markEnvelopeReady({
      envelopeId: created.envelope.envelopeId,
      promotionDecisionRef: "promotion_decision_par154_status_001",
      updatedAt: "2026-10-14T14:49:30Z",
    });
    await submissionCommands.promoteEnvelope({
      envelopeId: created.envelope.envelopeId,
      promotedAt: "2026-10-14T14:50:00Z",
      tenantId: "tenant_par154_status",
      requestType: "Symptoms",
      episodeFingerprint: "episode_fingerprint_par154_status",
      promotionCommandActionRecordRef: "cmd_action_par154_status",
      promotionCommandSettlementRecordRef: "cmd_settlement_par154_status",
      supersededAccessGrantRefs: [created.accessGrant.grantId],
      supersededDraftLeaseRefs: [created.lease.leaseId],
    });
    await draftService.supersedeDraftForPromotion({
      draftPublicId: created.view.draftPublicId,
      recordedAt: "2026-10-14T14:50:30Z",
      reasonCodes: ["DRAFT_PROMOTED_IMMUTABLE_SUBMIT_BOUNDARY"],
    });

    const promotedEnvelope = await store.getSubmissionEnvelope(created.envelope.envelopeId);
    const promotedRequestRef = promotedEnvelope?.toSnapshot().promotedRequestRef;
    expect(promotedRequestRef).toBeTruthy();
    const promotedRequest = await store.getRequest(promotedRequestRef!);
    expect(promotedRequest).not.toBeNull();
    const activeRequest = RequestAggregate.hydrate({
      ...promotedRequest!.toSnapshot(),
      workflowState: "triage_active",
      requestVersion: promotedRequest!.toSnapshot().requestVersion + 1,
      updatedAt: "2026-10-14T14:51:00Z",
      version: promotedRequest!.version + 1,
    });
    await store.saveRequest(activeRequest, { expectedVersion: promotedRequest!.version });

    const resolution = await draftService.resolveDraftRouteEntry({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      leaseId: created.lease.leaseId,
      entrySurface: "browser_reentry",
      observedAt: "2026-10-14T14:51:30Z",
    });

    expect(resolution.entryAuthorityState).toBe("request_redirect");
    expect(resolution.targetIntent).toBe("open_request_status");
    expect(resolution.targetPathname).toBe(
      `/intake/requests/${resolution.requestPublicId}/status`,
    );
    expect(resolution.proofState).toBe("grant_superseded_same_lineage");
  });

  it("keeps background tabs from mutating after promotion and routes them into promoted-request recovery", async () => {
    const { store, draftService, created } = await createSeededDraft();
    const submissionCommands = createSubmissionBackboneCommandService(
      store,
      createDeterministicBackboneIdGenerator("par154_background_boundary"),
    );
    const background = await draftService.resumeDraft({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      requestedLeaseMode: "background_read_only",
      resumedAt: "2026-10-14T14:44:00Z",
      sessionEpochRef: created.lease.toSnapshot().sessionEpochRef,
      routeFamilyRef: created.lease.toSnapshot().routeFamilyRef,
      routeIntentBindingRef: created.lease.toSnapshot().routeIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: created.lease.toSnapshot().audienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: created.lease.toSnapshot().releaseApprovalFreezeRef,
      channelReleaseFreezeState: created.lease.toSnapshot().channelReleaseFreezeState,
      manifestVersionRef: created.lease.toSnapshot().manifestVersionRef,
    });

    await submissionCommands.appendEnvelopeIngress({
      envelopeId: created.envelope.envelopeId,
      ingressRecordRef: "ingress_par154_bg_001",
      updatedAt: "2026-10-14T14:44:30Z",
    });
    await submissionCommands.attachEnvelopeEvidence({
      envelopeId: created.envelope.envelopeId,
      evidenceSnapshotRef: "snapshot_par154_bg_001",
      updatedAt: "2026-10-14T14:45:00Z",
    });
    await submissionCommands.attachEnvelopeNormalization({
      envelopeId: created.envelope.envelopeId,
      normalizedSubmissionRef: "normalized_par154_bg_001",
      updatedAt: "2026-10-14T14:45:30Z",
    });
    await submissionCommands.markEnvelopeReady({
      envelopeId: created.envelope.envelopeId,
      promotionDecisionRef: "promotion_decision_par154_bg_001",
      updatedAt: "2026-10-14T14:46:00Z",
    });
    await submissionCommands.promoteEnvelope({
      envelopeId: created.envelope.envelopeId,
      promotedAt: "2026-10-14T14:46:30Z",
      tenantId: "tenant_par154_bg",
      requestType: "Symptoms",
      episodeFingerprint: "episode_fingerprint_par154_bg",
      promotionCommandActionRecordRef: "cmd_action_par154_bg",
      promotionCommandSettlementRecordRef: "cmd_settlement_par154_bg",
      supersededAccessGrantRefs: [created.accessGrant.grantId],
      supersededDraftLeaseRefs: [created.lease.leaseId, background.lease.leaseId],
    });
    await draftService.supersedeDraftForPromotion({
      draftPublicId: created.view.draftPublicId,
      recordedAt: "2026-10-14T14:47:00Z",
    });

    const blockedPatch = await draftService.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: background.view.draftVersion,
        clientCommandId: "draft_cmd_promoted_background_001",
        idempotencyKey: "draft_patch_promoted_background_001",
        leaseId: background.lease.leaseId,
        resumeToken: created.view.resumeToken,
        freeTextNarrative: "Background tab attempted a post-promotion mutation.",
        currentStepKey: "review_submit",
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/review`,
        recordedAt: "2026-10-14T14:47:30Z",
      },
      runtimeContextFromLease(background.lease),
    );

    expect(blockedPatch.mutationRecord).toBeNull();
    expect(blockedPatch.saveSettlement.toSnapshot().ackState).toBe("recovery_required");
    expect(blockedPatch.recoveryRecord?.toSnapshot().recoveryReason).toBe(
      "promoted_request_available",
    );
    expect(blockedPatch.recoveryRecord?.toSnapshot().requestPublicId).toMatch(/^req_/);
  });
});
