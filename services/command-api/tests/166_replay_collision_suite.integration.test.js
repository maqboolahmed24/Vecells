import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createDuplicateReviewApplication } from "../src/duplicate-review.ts";
import { createIntakeSubmitApplication } from "../src/intake-submit.ts";
import { createReplayCollisionApplication } from "../src/replay-collision-authority.ts";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
const SUBMIT_CASES_PATH = path.join(ROOT, "data", "test", "166_submit_replay_cases.csv");
const COLLISION_CASES_PATH = path.join(ROOT, "data", "test", "166_collision_review_cases.csv");
const STALE_CASES_PATH = path.join(
  ROOT,
  "data",
  "test",
  "166_stale_resume_and_promotion_cases.csv",
);
const EXPECTED_COUNTS_PATH = path.join(
  ROOT,
  "data",
  "test",
  "166_expected_idempotency_and_side_effect_counts.json",
);

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

const submitRows = parseCsv(fs.readFileSync(SUBMIT_CASES_PATH, "utf8"));
const collisionRows = parseCsv(fs.readFileSync(COLLISION_CASES_PATH, "utf8"));
const staleRows = parseCsv(fs.readFileSync(STALE_CASES_PATH, "utf8"));
const expectedCounts = JSON.parse(fs.readFileSync(EXPECTED_COUNTS_PATH, "utf8"));

function rowById(rows, caseId) {
  const row = rows.find((candidate) => candidate.case_id === caseId);
  expect(row, `${caseId} missing from machine-readable matrix`).toBeDefined();
  return row;
}

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
    requestType: overrides.requestType ?? "Symptoms",
    surfaceChannelProfile: "browser",
    routeEntryRef: "phase1_intake_entry",
    createdAt: overrides.createdAt ?? "2026-04-15T08:00:00Z",
    sessionEpochRef: "session_epoch_browser_v1",
  });

  const structuredAnswers = {
    "symptoms.category": "general",
    "symptoms.onsetPrecision": "exact_date",
    "symptoms.onsetDate": "2026-04-10",
    "symptoms.worseningNow": false,
    "symptoms.severityClues": ["sleep_affected"],
    "symptoms.narrative":
      overrides.freeTextNarrative ?? "The problem has been getting harder to ignore.",
    ...overrides.structuredAnswers,
  };

  const patched = await application.drafts.patchDraft(
    created.view.draftPublicId,
    {
      draftVersion: created.view.draftVersion,
      clientCommandId: overrides.patchClientCommandId ?? "cmd_submit_patch_166_001",
      idempotencyKey: overrides.patchIdempotencyKey ?? "idem_submit_patch_166_001",
      leaseId: created.lease.leaseId,
      resumeToken: created.view.resumeToken,
      structuredAnswers,
      freeTextNarrative:
        overrides.freeTextNarrative ?? "The problem has been getting harder to ignore.",
      currentStepKey: "review_submit",
      completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
      currentPathname: `/intake/drafts/${created.view.draftPublicId}/review-submit`,
      shellContinuityKey: "patient.portal.requests",
      selectedAnchorKey: overrides.selectedAnchorKey ?? "request-proof",
      recordedAt: overrides.patchedAt ?? "2026-04-15T08:01:00Z",
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
    sourceEvidenceRef: "draft_patch::contact_pref_166_001",
    clientCommandId: overrides.contactClientCommandId ?? "cmd_contact_pref_166_001",
    idempotencyKey: overrides.contactIdempotencyKey ?? "idem_contact_pref_166_001",
    recordedAt: overrides.contactAt ?? "2026-04-15T08:02:00Z",
  });

  application.validation.seedUrgentDecisionState(created.view.draftPublicId, "clear");
  application.validation.seedConvergenceState(created.view.draftPublicId, "valid");

  return {
    created,
    patched,
  };
}

async function currentSubmitCommand(application, draftPublicId, overrides = {}) {
  const projection =
    await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
  const snapshot = projection.toSnapshot();
  return {
    draftPublicId,
    draftVersion: snapshot.authoritativeDraftVersion,
    leaseId: snapshot.activeLeaseRef,
    resumeToken: snapshot.resumeToken,
    clientCommandId: "cmd_submit_166_001",
    idempotencyKey: "idem_submit_166_001",
    sourceCommandId: "source_submit_166_001",
    transportCorrelationId: "transport_submit_166_001",
    intentGeneration: 1,
    observedAt: "2026-04-15T08:03:00Z",
    ...overrides,
  };
}

async function countSideEffects(application) {
  const requests = await application.repositories.listRequests();
  const requestRefs = requests.map((request) => request.toSnapshot().requestId);
  const safetyRows = (
    await Promise.all(
      requestRefs.map((requestRef) =>
        application.synchronousSafety.repositories.listSafetyDecisionRecordsByRequest(requestRef),
      ),
    )
  ).flat();
  return {
    requests: requests.length,
    promotionRecords: (await application.repositories.listSubmissionPromotionRecords()).length,
    submitSettlements: (await application.transactionRepositories.listIntakeSubmitSettlements())
      .length,
    snapshotFreezes: (await application.transactionRepositories.listSubmissionSnapshotFreezes())
      .length,
    normalizationSeeds: (await application.transactionRepositories.listSubmitNormalizationSeeds())
      .length,
    safetyDecisions: safetyRows.length,
    triageTasks: (await application.triage.repositories.listTriageTasks()).length,
    communicationEnvelopes: (
      await application.confirmationDispatch.communicationRepositories.listCommunicationEnvelopes()
    ).length,
    receiptBridges: (
      await application.confirmationDispatch.communicationRepositories.listReceiptBridges()
    ).length,
  };
}

function diffCounts(after, before) {
  return Object.fromEntries(
    Object.entries(after).map(([key, value]) => [key, value - before[key]]),
  );
}

async function applyRawOnlyProjectionDrift(application, draftPublicId, suffix) {
  const projection =
    await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
  const snapshot = projection.toSnapshot();
  await application.repositories.saveDraftContinuityEvidenceProjection(
    projection.withSystemAttachmentRefs({
      attachmentRefs: snapshot.attachmentRefs,
      latestSettlementRef: `system_rewrite_for_semantic_replay_${suffix}`,
      recordedAt: "2026-04-15T08:03:05Z",
    }),
    { expectedVersion: snapshot.version },
  );
}

async function applySemanticProjectionDrift(application, draftPublicId, suffix) {
  const projection =
    await application.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
  const snapshot = projection.toSnapshot();
  await application.repositories.saveDraftContinuityEvidenceProjection(
    projection.withSystemAttachmentRefs({
      attachmentRefs: [...snapshot.attachmentRefs, `att_collision_166_${suffix}`],
      latestSettlementRef: `system_rewrite_for_collision_review_${suffix}`,
      recordedAt: "2026-04-15T08:03:06Z",
    }),
    { expectedVersion: snapshot.version },
  );
}

function baseReplayAuthorityCommand(overrides = {}) {
  return {
    actionScope: "phase1_intake_submit",
    governingLineageRef: "lineage_166_replay_authority",
    effectiveActorRef: "draft_166_replay_authority",
    sourceCommandId: "idem_166_reused_key",
    sourceCommandIdFamily: "idempotency_key",
    transportCorrelationId: "transport_166_replay_authority",
    causalParentRef: "causal_166_replay_authority",
    intentGeneration: 1,
    expectedEffectSetRefs: ["request.created", "request.submitted"],
    scope: {
      governingObjectRef: "submission_envelope_166_replay_authority",
      governingObjectVersionRef: "v1",
      routeIntentTupleHash: "route_tuple_166_replay_authority",
      routeContractDigestRef: "route_digest_166_replay_authority",
      audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
      releaseTrustFreezeVerdictRef: "release_freeze_phase1_self_service_v1",
    },
    rawPayload: '{"requestType":"Symptoms","message":"Need help"}',
    semanticPayload: {
      requestType: "Symptoms",
      message: "Need help",
    },
    firstAcceptedActionRecordRef: "action_166_replay_authority",
    acceptedSettlementRef: "settlement_166_replay_authority",
    decisionBasisRef: "decision_basis_166_replay_authority",
    observedAt: "2026-04-15T08:10:00Z",
    ...overrides,
  };
}

describe("seq_166 replay collision and stale promotion suite", () => {
  it("loads the machine-readable fixture families and expected count model", () => {
    expect(submitRows).toHaveLength(expectedCounts.fixtureCounts.submitReplayCases);
    expect(collisionRows).toHaveLength(expectedCounts.fixtureCounts.collisionReviewCases);
    expect(staleRows).toHaveLength(expectedCounts.fixtureCounts.staleResumeAndPromotionCases);
    expect(expectedCounts.globalInvariants.duplicateNotificationAllowed).toBe(false);
    expect(expectedCounts.globalInvariants.stalePromotedDraftReopensMutableEditing).toBe(false);
  });

  it("returns the prior authoritative IntakeSubmitSettlement for exact replay without side-effect deltas", async () => {
    const row = rowById(submitRows, "SUB166_EXACT_REPLAY_SAME_TAB");
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application);
    const command = await currentSubmitCommand(application, created.view.draftPublicId);

    const first = await application.submitDraft(command);
    const beforeReplay = await countSideEffects(application);
    const replay = await application.submitDraft({
      ...command,
      observedAt: "2026-04-15T08:03:10Z",
    });
    const afterReplay = await countSideEffects(application);

    expect(replay.decisionClass).toBe(row.expected_decision_class);
    expect(replay.replayed).toBe(true);
    expect(replay.requestRef).toBe(first.requestRef);
    expect(replay.settlement.intakeSubmitSettlementId).toBe(
      first.settlement.intakeSubmitSettlementId,
    );
    expect(replay.transitionEnvelope.targetIntent).toBe("authoritative_request_shell");
    expect(diffCounts(afterReplay, beforeReplay)).toMatchObject({
      requests: 0,
      promotionRecords: 0,
      safetyDecisions: 0,
      triageTasks: 0,
      communicationEnvelopes: 0,
      receiptBridges: 0,
    });
  });

  it("serializes concurrent double submit and refresh-before-settlement into one backend and visible outcome", async () => {
    rowById(submitRows, "SUB166_CONCURRENT_DOUBLE_TAP");
    rowById(submitRows, "SUB166_REFRESH_BEFORE_SETTLEMENT");
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application, {
      patchClientCommandId: "cmd_submit_patch_166_concurrent",
      patchIdempotencyKey: "idem_submit_patch_166_concurrent",
      contactClientCommandId: "cmd_contact_pref_166_concurrent",
      contactIdempotencyKey: "idem_contact_pref_166_concurrent",
    });
    const command = await currentSubmitCommand(application, created.view.draftPublicId, {
      sourceCommandId: "source_submit_166_concurrent",
      transportCorrelationId: "transport_submit_166_concurrent",
    });

    const [left, right] = await Promise.all([
      application.submitDraft(command),
      application.submitDraft({
        ...command,
        observedAt: "2026-04-15T08:03:11Z",
      }),
    ]);
    const decisions = [left.decisionClass, right.decisionClass].sort();
    const committed = left.decisionClass === "new_lineage" ? left : right;
    const replay = left.decisionClass === "new_lineage" ? right : left;
    const counts = await countSideEffects(application);

    expect(decisions).toEqual(["exact_replay", "new_lineage"]);
    expect(replay.requestRef).toBe(committed.requestRef);
    expect(replay.settlement.intakeSubmitSettlementId).toBe(
      committed.settlement.intakeSubmitSettlementId,
    );
    expect(counts).toMatchObject({
      requests: 1,
      promotionRecords: 1,
      submitSettlements: 1,
      safetyDecisions: 1,
      triageTasks: 1,
      communicationEnvelopes: 1,
      receiptBridges: 1,
    });

    const routeResolution = await application.drafts.resolveDraftRouteEntry({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      leaseId: created.lease.leaseId,
      entrySurface: "refresh",
      observedAt: "2026-04-15T08:03:12Z",
    });
    expect(routeResolution.entryAuthorityState).toBe("request_redirect");
    expect(routeResolution.promotedRequestRef).toBe(committed.requestRef);
    expect(routeResolution.targetIntent).toBe("open_request_receipt");
  });

  it("returns semantic replay for refresh and auth-return transport drift without new side effects", async () => {
    rowById(submitRows, "SUB166_SEMANTIC_REPLAY_REFRESH");
    rowById(submitRows, "SUB166_AUTH_RETURN_REPLAY");
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application, {
      patchClientCommandId: "cmd_submit_patch_166_semantic",
      patchIdempotencyKey: "idem_submit_patch_166_semantic",
      contactClientCommandId: "cmd_contact_pref_166_semantic",
      contactIdempotencyKey: "idem_contact_pref_166_semantic",
    });
    const command = await currentSubmitCommand(application, created.view.draftPublicId, {
      sourceCommandId: "source_submit_166_semantic",
      transportCorrelationId: "transport_submit_166_semantic",
    });

    const first = await application.submitDraft(command);
    await applyRawOnlyProjectionDrift(application, created.view.draftPublicId, "semantic");
    const beforeReplay = await countSideEffects(application);
    const replay = await application.submitDraft({
      ...command,
      observedAt: "2026-04-15T08:03:20Z",
    });
    const afterReplay = await countSideEffects(application);

    expect(replay.decisionClass).toBe("semantic_replay");
    expect(replay.replayed).toBe(true);
    expect(replay.requestRef).toBe(first.requestRef);
    expect(replay.receiptConsistencyEnvelope?.consistencyEnvelopeId).toBe(
      first.receiptConsistencyEnvelope?.consistencyEnvelopeId,
    );
    expect(diffCounts(afterReplay, beforeReplay)).toMatchObject({
      requests: 0,
      promotionRecords: 0,
      safetyDecisions: 0,
      triageTasks: 0,
      communicationEnvelopes: 0,
      receiptBridges: 0,
    });
  });

  it("opens explicit collision review for source and transport identifier reuse with changed semantics", async () => {
    rowById(collisionRows, "COL166_SOURCE_COMMAND_CHANGED_ATTACHMENT");
    rowById(collisionRows, "COL166_TRANSPORT_CHANGED_ATTACHMENT");
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application, {
      patchClientCommandId: "cmd_submit_patch_166_collision",
      patchIdempotencyKey: "idem_submit_patch_166_collision",
      contactClientCommandId: "cmd_contact_pref_166_collision",
      contactIdempotencyKey: "idem_contact_pref_166_collision",
    });
    const command = await currentSubmitCommand(application, created.view.draftPublicId, {
      sourceCommandId: "source_submit_166_collision",
      transportCorrelationId: "transport_submit_166_collision",
    });

    await application.submitDraft(command);
    await applySemanticProjectionDrift(application, created.view.draftPublicId, "source");
    const beforeCollision = await countSideEffects(application);
    const sourceCollision = await application.submitDraft({
      ...command,
      observedAt: "2026-04-15T08:03:30Z",
    });
    const afterSourceCollision = await countSideEffects(application);

    expect(sourceCollision.decisionClass).toBe("collision_review");
    expect(sourceCollision.requestRef).toBeNull();
    expect(sourceCollision.settlement.toSnapshot().settlementState).toBe("collision_review_open");
    expect(sourceCollision.settlement.toSnapshot().collisionReviewRef).toBeTruthy();
    expect(diffCounts(afterSourceCollision, beforeCollision)).toMatchObject({
      requests: 0,
      promotionRecords: 0,
      communicationEnvelopes: 0,
      receiptBridges: 0,
      submitSettlements: 1,
      snapshotFreezes: 1,
      normalizationSeeds: 1,
    });

    const transportApp = createIntakeSubmitApplication();
    const { created: transportDraft } = await buildReadyDraft(transportApp, {
      patchClientCommandId: "cmd_submit_patch_166_transport",
      patchIdempotencyKey: "idem_submit_patch_166_transport",
      contactClientCommandId: "cmd_contact_pref_166_transport",
      contactIdempotencyKey: "idem_contact_pref_166_transport",
    });
    const transportCommand = await currentSubmitCommand(
      transportApp,
      transportDraft.view.draftPublicId,
      {
        sourceCommandId: "source_submit_166_transport_a",
        transportCorrelationId: "transport_submit_166_transport_reused",
      },
    );
    await transportApp.submitDraft(transportCommand);
    await applySemanticProjectionDrift(
      transportApp,
      transportDraft.view.draftPublicId,
      "transport",
    );
    const transportCollision = await transportApp.submitDraft({
      ...transportCommand,
      sourceCommandId: "source_submit_166_transport_b",
      observedAt: "2026-04-15T08:03:31Z",
    });

    expect(transportCollision.decisionClass).toBe("collision_review");
    expect(transportCollision.requestRef).toBeNull();
    expect(transportCollision.settlement.toSnapshot().settlementState).toBe(
      "collision_review_open",
    );
  });

  it("keeps reused idempotency scope drift in collision review instead of silently deduping", async () => {
    rowById(collisionRows, "COL166_IDEMPOTENCY_KEY_SCOPE_DRIFT");
    const application = createReplayCollisionApplication();
    const first = await application.authority.resolveInboundCommand(baseReplayAuthorityCommand());
    const collision = await application.authority.resolveInboundCommand(
      baseReplayAuthorityCommand({
        rawPayload: '{"requestType":"Admin","message":"Need a changed request"}',
        semanticPayload: {
          requestType: "Admin",
          message: "Need a changed request",
        },
        firstAcceptedActionRecordRef: "action_166_replay_authority_collision",
        acceptedSettlementRef: "settlement_166_replay_authority_collision",
        observedAt: "2026-04-15T08:10:10Z",
      }),
    );

    expect(first.decisionClass).toBe("distinct");
    expect(collision.decisionClass).toBe("collision_review");
    expect(collision.blockedAutomaticMutation).toBe(true);
    expect(collision.collisionReview?.toSnapshot().collisionClass).toBe("idempotency_key_reuse");
    expect(await application.repositories.listIdempotencyRecords()).toHaveLength(1);
    expect(await application.repositories.listReplayCollisionReviews()).toHaveLength(1);
  });

  it("blocks stale tabs and stale submit tokens after promotion without reopening mutable draft state", async () => {
    rowById(staleRows, "STALE166_BACKGROUND_AUTOSAVE_AFTER_PROMOTION");
    rowById(staleRows, "STALE166_STALE_RESUME_TOKEN_REDIRECT");
    rowById(staleRows, "STALE166_STALE_SUBMIT_AFTER_PROMOTION");
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application, {
      patchClientCommandId: "cmd_submit_patch_166_stale",
      patchIdempotencyKey: "idem_submit_patch_166_stale",
      contactClientCommandId: "cmd_contact_pref_166_stale",
      contactIdempotencyKey: "idem_contact_pref_166_stale",
    });
    const command = await currentSubmitCommand(application, created.view.draftPublicId, {
      sourceCommandId: "source_submit_166_stale",
      transportCorrelationId: "transport_submit_166_stale",
    });
    const first = await application.submitDraft(command);
    const beforeStale = await countSideEffects(application);

    const stalePatch = await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_late_patch_166",
        idempotencyKey: "idem_late_patch_166",
        leaseId: created.lease.leaseId,
        resumeToken: "stale_resume_token_166",
        structuredAnswers: {
          "symptoms.category": "general",
          "symptoms.narrative": "A stale tab tried to save after submit.",
        },
        freeTextNarrative: "A stale tab tried to save after submit.",
        currentStepKey: "details",
        completedStepKeys: ["request_type", "details"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2026-04-15T08:04:00Z",
      },
      runtimeContextFromLease(created.lease),
    );
    const afterStalePatch = await countSideEffects(application);
    const routeResolution = await application.drafts.resolveDraftRouteEntry({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      leaseId: created.lease.leaseId,
      entrySurface: "refresh",
      observedAt: "2026-04-15T08:04:05Z",
    });
    const staleSubmitReplay = await application.submitDraft({
      ...command,
      leaseId: "lease_stale_after_promotion_166",
      resumeToken: "resume_stale_after_promotion_166",
      observedAt: "2026-04-15T08:04:10Z",
    });

    expect(stalePatch.saveSettlement.toSnapshot().ackState).toBe("recovery_required");
    expect(stalePatch.view.uiJourneyState.quietStatusState).not.toBe("saved_authoritative");
    expect(stalePatch.view.channelCapabilityCeiling.mutatingResumeState).toBe("blocked");
    expect(stalePatch.recoveryRecord?.toSnapshot().reasonCodes).toContain(
      "DRAFT_RESUME_TOKEN_FORMAT_INVALID",
    );
    expect(diffCounts(afterStalePatch, beforeStale)).toMatchObject({
      requests: 0,
      promotionRecords: 0,
      communicationEnvelopes: 0,
      receiptBridges: 0,
    });
    expect(routeResolution.entryAuthorityState).toBe("request_redirect");
    expect(routeResolution.targetIntent).toBe("open_request_receipt");
    expect(routeResolution.promotedRequestRef).toBe(first.requestRef);
    expect(staleSubmitReplay.decisionClass).toBe("exact_replay");
    expect(staleSubmitReplay.requestRef).toBe(first.requestRef);
  });

  it("keeps pre-promotion stale submit in recovery without request or notification side effects", async () => {
    rowById(staleRows, "STALE166_PRE_PROMOTION_MISSING_LEASE_RECOVERY");
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application, {
      patchClientCommandId: "cmd_submit_patch_166_missing_lease",
      patchIdempotencyKey: "idem_submit_patch_166_missing_lease",
      contactClientCommandId: "cmd_contact_pref_166_missing_lease",
      contactIdempotencyKey: "idem_contact_pref_166_missing_lease",
    });

    const stale = await application.submitDraft({
      ...(await currentSubmitCommand(application, created.view.draftPublicId, {
        sourceCommandId: "source_submit_166_missing_lease",
        transportCorrelationId: "transport_submit_166_missing_lease",
      })),
      leaseId: "lease_missing_166",
      resumeToken: "resume_token_stale_166",
      observedAt: "2026-04-15T08:04:30Z",
    });

    expect(stale.decisionClass).toBe("stale_recoverable");
    expect(stale.requestRef).toBeNull();
    expect(stale.settlement.toSnapshot().settlementState).toBe("recovery_required");
    expect(stale.reasonCodes).toEqual(
      expect.arrayContaining([
        "DRAFT_LEASE_NOT_FOUND",
        "DRAFT_RESUME_TOKEN_MISMATCH",
        "DRAFT_ACTIVE_LEASE_MISMATCH",
      ]),
    );
    expect(await application.repositories.listRequests()).toHaveLength(0);
    expect(
      await application.confirmationDispatch.communicationRepositories.listCommunicationEnvelopes(),
    ).toHaveLength(0);
  });

  it("replays notification worker jobs onto the existing confirmation envelope and bridge", async () => {
    rowById(submitRows, "SUB166_NOTIFICATION_JOB_REPLAY");
    const application = createIntakeSubmitApplication();
    const { created } = await buildReadyDraft(application, {
      patchClientCommandId: "cmd_submit_patch_166_notification",
      patchIdempotencyKey: "idem_submit_patch_166_notification",
      contactClientCommandId: "cmd_contact_pref_166_notification",
      contactIdempotencyKey: "idem_contact_pref_166_notification",
    });
    const first = await application.submitDraft(
      await currentSubmitCommand(application, created.view.draftPublicId, {
        sourceCommandId: "source_submit_166_notification",
        transportCorrelationId: "transport_submit_166_notification",
      }),
    );
    const contactSummary =
      await application.contactPreferenceApp.buildContactPreferenceValidationSummary(
        created.view.draftPublicId,
      );
    const beforeReplay = await countSideEffects(application);
    const replay = await application.confirmationDispatch.queueRoutineConfirmation({
      requestRef: first.requestRef,
      requestLineageRef: first.requestLineageRef,
      triageTaskRef: first.triageTask.triageTaskId,
      receiptEnvelopeRef: first.receiptConsistencyEnvelope.consistencyEnvelopeId,
      outcomeArtifactRef: first.outcomePresentationArtifact.intakeOutcomePresentationArtifactId,
      routeSubjectRef: first.requestRef,
      contactSummary,
      queuedAt: "2026-04-15T08:05:00Z",
    });
    const afterReplay = await countSideEffects(application);

    expect(replay.replayed).toBe(true);
    expect(replay.events).toEqual([]);
    expect(diffCounts(afterReplay, beforeReplay)).toMatchObject({
      communicationEnvelopes: 0,
      receiptBridges: 0,
    });
  });

  it("preserves same-request attach and same-episode link only through explicit duplicate-review authority", async () => {
    rowById(collisionRows, "COL166_SAME_REQUEST_ATTACH_WITH_WITNESS");
    rowById(collisionRows, "COL166_SAME_EPISODE_LINK_HUMAN_REVIEW");
    rowById(collisionRows, "COL166_CONFLICT_REVIEW_REQUIRED");
    const application = createDuplicateReviewApplication();

    const sameRequest = await application.simulation.simulateScenario(
      "same_request_continuation_with_witness",
    );
    const sameEpisode = await application.authority.applyResolutionDecision({
      clusterId: sameRequest.cluster.clusterId,
      decisionClass: "same_episode_link",
      winningPairEvidenceRef: sameRequest.pairEvidences[0].pairEvidenceId,
      reviewMode: "human_review",
      reasonCodes: ["HUMAN_REVIEW_CONFIRMED_SAME_EPISODE"],
      decidedByRef: "reviewer_166_same_episode",
      decidedAt: "2026-04-15T08:06:00Z",
    });
    const conflict = await application.simulation.simulateScenario(
      "conflicting_candidates_low_margin",
    );

    expect(sameRequest.decision.toSnapshot().decisionClass).toBe("same_request_attach");
    expect(sameRequest.decision.toSnapshot().continuityWitnessClass).toBe("workflow_return");
    expect(sameEpisode.decision.toSnapshot().decisionClass).toBe("same_episode_link");
    expect(sameEpisode.cluster.toSnapshot().relationType).toBe("same_episode_confirmed");
    expect(conflict.decision.toSnapshot().decisionClass).toBe("review_required");
    expect(conflict.cluster.toSnapshot().instabilityState).toBe("blocked_conflict");
  });
});
