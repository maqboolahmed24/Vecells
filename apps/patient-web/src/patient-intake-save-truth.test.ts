import { describe, expect, it } from "vitest";
import { defaultIntakeMissionFrameMemory } from "./patient-intake-mission-frame.model";
import {
  buildContinueEntry,
  createAuthoritativeRecord,
  deriveDraftSaveTruth,
  type DraftRecoveryRecordView,
} from "./patient-intake-save-truth";

function seedAuthoritativeRecord() {
  const memory = {
    ...defaultIntakeMissionFrameMemory("dft_test_autosave"),
    requestType: "Symptoms" as const,
    detailNarrative: "Breathing feels tighter than usual.",
    completedStepKeys: ["request_type", "details"] as const,
  };
  return createAuthoritativeRecord({
    draftPublicId: memory.draftPublicId,
    requestPublicId: null,
    memory,
    pathname: `/start-request/${memory.draftPublicId}/details`,
    currentStepKey: "details",
    selectedAnchorKey: "patient-intake-details",
    focusedFieldKey: "symptoms.category",
    scrollTop: 128,
    sessionId: "session_test",
    savedAt: "2026-04-15T09:30:00.000Z",
  });
}

describe("patient intake save truth", () => {
  it("keeps saving above saved until the authoritative settlement is complete", () => {
    const authoritativeRecord = seedAuthoritativeRecord();

    const truth = deriveDraftSaveTruth({
      authoritativeRecord,
      localSettlement: {
        settlementId: "local_pending",
        ackState: "local_ack",
        authoritativeDraftVersion: authoritativeRecord.saveSettlement.authoritativeDraftVersion,
        recordedAt: "2026-04-15T09:31:00.000Z",
        reasonCodes: [],
        continuityProjectionRef: null,
        mergePlanRef: null,
        recoveryRecordRef: null,
        source: "session_local",
      },
      mergePlan: null,
      recoveryRecord: null,
      localDirty: true,
      pendingIntent: "debounced",
      nowIso: "2026-04-15T09:31:10.000Z",
    });

    expect(truth.state).toBe("saving");
    expect(truth.shouldWarnOnHardExit).toBe(true);
    expect(truth.suppressSavedReason).toBe("local_changes_not_settled");
  });

  it("suppresses saved and requires review when a merge plan is open", () => {
    const authoritativeRecord = seedAuthoritativeRecord();

    const truth = deriveDraftSaveTruth({
      authoritativeRecord,
      localSettlement: {
        settlementId: "merge_pending",
        ackState: "merge_required",
        authoritativeDraftVersion: authoritativeRecord.saveSettlement.authoritativeDraftVersion + 1,
        recordedAt: "2026-04-15T09:32:00.000Z",
        reasonCodes: ["DRAFT_VERSION_CONFLICT"],
        continuityProjectionRef: null,
        mergePlanRef: "merge_plan",
        recoveryRecordRef: null,
        source: "session_local",
      },
      mergePlan: {
        mergePlanId: "merge_plan",
        mergeState: "open",
        openedAt: "2026-04-15T09:32:00.000Z",
        expectedDraftVersion: 1,
        actualDraftVersion: 2,
        resolutionByGroup: { answers: "keep_local" },
        groups: [
          {
            groupId: "answers",
            groupType: "answer_fields",
            title: "Question answers",
            localLabel: "Your recent value",
            localValue: "Chest pain",
            serverLabel: "Newer saved value",
            serverValue: "Shortness of breath",
            selectedResolution: "keep_local",
            systemReason: "Conflict detected.",
          },
        ],
      },
      recoveryRecord: null,
      localDirty: false,
      pendingIntent: "none",
      nowIso: "2026-04-15T09:32:05.000Z",
    });

    expect(truth.state).toBe("review changes");
    expect(truth.actionLabel).toBe("Review changes");
    expect(truth.suppressSavedReason).toBe("merge_required_open");
  });

  it("surfaces resume safely when continuity is blocked", () => {
    const authoritativeRecord = seedAuthoritativeRecord();
    const recoveryRecord: DraftRecoveryRecordView = {
      recoveryRecordId: "recovery_test",
      recoveryReason: "lease_expired",
      recoveryState: "open",
      recordedAt: "2026-04-15T09:33:00.000Z",
      reasonCodes: ["LEASE_EXPIRED"],
      dominantActionKind: "resume_current_step",
      dominantActionLabel: "Resume safely",
      targetPathname: `/start-request/${authoritativeRecord.draftPublicId}/recovery`,
      explanation: "This browser no longer holds the writable draft lane.",
      keptItems: ["Last safe step: details"],
    };

    const truth = deriveDraftSaveTruth({
      authoritativeRecord,
      localSettlement: {
        settlementId: "recovery_pending",
        ackState: "recovery_required",
        authoritativeDraftVersion: authoritativeRecord.saveSettlement.authoritativeDraftVersion,
        recordedAt: recoveryRecord.recordedAt,
        reasonCodes: recoveryRecord.reasonCodes,
        continuityProjectionRef: null,
        mergePlanRef: null,
        recoveryRecordRef: recoveryRecord.recoveryRecordId,
        source: "session_local",
      },
      mergePlan: null,
      recoveryRecord,
      localDirty: false,
      pendingIntent: "none",
      nowIso: "2026-04-15T09:33:10.000Z",
    });

    expect(truth.state).toBe("resume safely");
    expect(truth.actionLabel).toBe("Resume safely");
    expect(truth.suppressSavedReason).toBe("continuity_evidence_not_trusted");
  });

  it("turns the continue card into a recovery entry when same-shell recovery is active", () => {
    const record = seedAuthoritativeRecord();
    record.continuityProjection.sameShellRecoveryState = "recovery_only";

    const entry = buildContinueEntry(record, null, "2026-04-15T09:40:00.000Z");

    expect(entry.statusState).toBe("resume safely");
    expect(entry.dominantActionLabel).toBe("Resume safely");
  });
});
