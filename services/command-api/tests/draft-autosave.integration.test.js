import { describe, expect, it } from "vitest";
import {
  createDraftAutosaveApplication,
  draftAutosaveMigrationPlanRefs,
  draftAutosavePersistenceTables,
} from "../src/draft-autosave.ts";

function runtimeContext(overrides = {}) {
  return {
    routeFamilyRef: "rf_intake_self_service",
    actionScope: "envelope_resume",
    lineageScope: "envelope",
    routeIntentBindingRef: "RIB_144_DRAFT_RESUME_V1",
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

describe("draft autosave application seam", () => {
  it("composes the draft create/resume/patch boundary with replay-safe settlement and lease fencing", async () => {
    const application = createDraftAutosaveApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2026-04-14T15:10:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    const saved = await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_phase1_patch_001",
        idempotencyKey: "idem_phase1_patch_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: { symptomDuration: "3_days" },
        currentStepKey: "details",
        completedStepKeys: ["request_type", "details"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2026-04-14T15:11:00Z",
      },
      runtimeContextFromLease(created.lease),
    );

    const replayed = await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_phase1_patch_001",
        idempotencyKey: "idem_phase1_patch_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: { symptomDuration: "3_days" },
        currentStepKey: "details",
        completedStepKeys: ["request_type", "details"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2026-04-14T15:11:30Z",
      },
      runtimeContextFromLease(created.lease),
    );

    const backgroundResume = await application.drafts.resumeDraft({
      draftPublicId: created.view.draftPublicId,
      resumeToken: created.view.resumeToken,
      requestedLeaseMode: "background_read_only",
      resumedAt: "2026-04-14T15:12:00Z",
      sessionEpochRef: created.lease.toSnapshot().sessionEpochRef,
      routeFamilyRef: created.lease.toSnapshot().routeFamilyRef,
      routeIntentBindingRef: created.lease.toSnapshot().routeIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: created.lease.toSnapshot().audienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: created.lease.toSnapshot().releaseApprovalFreezeRef,
      channelReleaseFreezeState: created.lease.toSnapshot().channelReleaseFreezeState,
      manifestVersionRef: created.lease.toSnapshot().manifestVersionRef,
    });

    const blocked = await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: backgroundResume.view.draftVersion,
        clientCommandId: "cmd_phase1_patch_background_001",
        idempotencyKey: "idem_phase1_patch_background_001",
        leaseId: backgroundResume.lease.leaseId,
        resumeToken: created.view.resumeToken,
        freeTextNarrative: "Background tab attempted a mutation.",
        currentStepKey: "details",
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/details`,
        recordedAt: "2026-04-14T15:12:30Z",
      },
      runtimeContextFromLease(backgroundResume.lease),
    );

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/082_draft_session_lease_and_autosave.sql",
    );
    expect(application.migrationPlanRefs).toEqual(draftAutosaveMigrationPlanRefs);
    expect(draftAutosavePersistenceTables).toEqual([
      "submission_envelopes",
      "access_grant_scope_envelopes",
      "access_grants",
      "access_grant_supersession_records",
      "draft_session_leases",
      "draft_mutation_records",
      "draft_save_settlements",
      "draft_merge_plans",
      "draft_recovery_records",
      "draft_continuity_evidence_projections",
    ]);
    expect(saved.replayed).toBe(false);
    expect(saved.saveSettlement.toSnapshot().ackState).toBe("saved_authoritative");
    expect(saved.view.draftVersion).toBe(2);
    expect(replayed.replayed).toBe(true);
    expect(replayed.mutationRecord?.mutationId).toBe(saved.mutationRecord?.mutationId);
    expect(backgroundResume.lease.toSnapshot().leaseMode).toBe("background_read_only");
    expect(blocked.saveSettlement.toSnapshot().ackState).toBe("recovery_required");
    expect(blocked.recoveryRecord?.toSnapshot().reasonCodes).toContain(
      "BACKGROUND_LEASE_MUTATION_FORBIDDEN",
    );
  });
});
