import { describe, expect, it } from "vitest";
import {
  IDENTITY_REPAIR_POLICY_VERSION,
  createIdentityRepairOrchestrator,
  identityRepairChainMigrationPlanRefs,
  identityRepairChainParallelInterfaceGaps,
  identityRepairChainPersistenceTables,
} from "../src/identity-repair-chain.ts";

function signalInput(overrides = {}) {
  return {
    idempotencyKey: "signal_182_patient_report",
    episodeId: "episode_182",
    affectedRequestRef: "request_182",
    observedIdentityBindingRef: "binding_wrong_182",
    frozenIdentityBindingRef: "binding_wrong_182",
    observedSessionRef: "session_182",
    observedAccessGrantRef: "grant_182",
    observedRouteIntentBindingRef: "route_intent_182",
    frozenSubjectRef: "nhs_subject_wrong_182",
    frozenPatientRef: "patient_wrong_182",
    suspectedWrongBindingRef: "binding_correct_candidate_182",
    signalClass: "patient_report",
    signalDisposition: "credible_misbinding",
    evidenceRefs: ["evidence_182_patient_report"],
    reportedBy: "patient_182",
    reportedAt: "2026-04-15T09:00:00.000Z",
    ...overrides,
  };
}

function createHarness() {
  const calls = {
    sessions: [],
    grants: [],
    routes: [],
    communicationFreezes: [],
    communicationReleases: [],
    projectionDegrades: [],
    projectionRebuilds: [],
    authority: [],
  };
  const application = createIdentityRepairOrchestrator({
    sessionGovernor: {
      async freezeSessions(input) {
        calls.sessions.push(input);
        return {
          sessionTerminationSettlementRefs: input.observedSessionRefs.map(
            (ref) => `session-freeze-${ref}`,
          ),
          reasonCodes: ["IR_182_SESSION_GOVERNOR_FROZE_STALE_SESSIONS"],
        };
      },
    },
    accessGrantService: {
      async supersedeGrantsForIdentityRepair(input) {
        calls.grants.push(input);
        return {
          accessGrantSupersessionRefs: input.observedAccessGrantRefs.map(
            (ref) => `grant-supersession-${ref}`,
          ),
          reasonCodes: ["IR_182_ACCESS_GRANTS_SUPERSEDED_BY_ACCESS_GRANT_SERVICE"],
        };
      },
    },
    routeIntentSupersession: {
      async supersedeRouteIntentsForIdentityRepair(input) {
        calls.routes.push(input);
        return {
          supersededRouteIntentBindingRefs: input.observedRouteIntentBindingRefs.map(
            (ref) => `route-supersession-${ref}`,
          ),
          reasonCodes: ["IR_182_ROUTE_INTENTS_SUPERSEDED"],
        };
      },
    },
    communicationFreeze: {
      async freezeNonEssentialCommunications(input) {
        calls.communicationFreezes.push(input);
        return {
          communicationsHoldRef: "communications_hold_182",
          communicationsHoldState: "active",
          affectedAudienceRefs: ["patient", "support", "notification_worker"],
          reasonCodes: ["IR_182_NON_ESSENTIAL_COMMUNICATIONS_FROZEN"],
        };
      },
      async releaseCommunications(input) {
        calls.communicationReleases.push(input);
        return {
          communicationsReleaseRef: "communications_release_182",
          reasonCodes: ["IR_182_FRESH_AUTHORITY_ONLY_AFTER_RELEASE"],
        };
      },
    },
    projectionDegradation: {
      async degradeForIdentityHold(input) {
        calls.projectionDegrades.push(input);
        return {
          patientIdentityHoldProjectionRef: "hold_projection_182",
          patientActionRecoveryProjectionRef: "recovery_projection_182",
          projectionHoldState: "summary_only",
          reasonCodes: ["IR_182_PATIENT_IDENTITY_HOLD_PROJECTION"],
        };
      },
      async rebuildAfterRelease(input) {
        calls.projectionRebuilds.push(input);
        return {
          projectionRebuildRef: "projection_rebuild_182",
          reasonCodes: ["IR_182_FRESH_AUTHORITY_ONLY_AFTER_RELEASE"],
        };
      },
    },
    identityBindingAuthority: {
      async settleRepairBinding(input) {
        calls.authority.push(input);
        return {
          bindingAuthoritySettlementRef: "identity_binding_authority_settlement_182",
          resultingIdentityBindingRef: "binding_corrected_182",
          decision: "accepted",
          reasonCodes: ["IR_182_CORRECTION_ONLY_THROUGH_IDENTITY_BINDING_AUTHORITY"],
        };
      },
    },
  });
  return { application, calls };
}

async function openedAndFrozenHarness() {
  const harness = createHarness();
  const opened = await harness.application.identityRepairOrchestrator.recordSignal(signalInput());
  const frozen = await harness.application.identityRepairOrchestrator.commitFreeze({
    freezeIdempotencyKey: "freeze_182",
    identityRepairCaseRef: opened.repairCase.repairCaseId,
    actorRef: "support_operator_182",
    observedAt: "2026-04-15T09:05:00.000Z",
  });
  return { ...harness, opened, frozen };
}

async function settleBranches(application, repairCaseRef) {
  const branches = application.repository.snapshots().branchDispositions;
  for (const branch of branches) {
    const nextState =
      branch.requiredDisposition === "compensate_external"
        ? "compensated"
        : branch.requiredDisposition === "manual_review_only"
          ? "manual_review_closed"
          : branch.requiredDisposition === "rebuild_required"
            ? "rebuilt"
            : branch.requiredDisposition === "suppress_visibility"
              ? "terminal_suppressed"
              : branch.requiredDisposition === "already_safe"
                ? "already_safe"
                : "released";
    await application.identityRepairOrchestrator.settleBranchDisposition({
      identityRepairCaseRef: repairCaseRef,
      branchDispositionId: branch.branchDispositionId,
      nextState,
      compensationRef:
        branch.requiredDisposition === "compensate_external"
          ? `compensation-${branch.branchRef}`
          : null,
      reviewedBy: "repair_reviewer_182",
      observedAt: "2026-04-15T09:30:00.000Z",
    });
  }
}

describe("IdentityRepairOrchestrator wrong-patient chain", () => {
  it("appends immutable signals and returns replay without a second case", async () => {
    const { application } = createHarness();

    const first = await application.identityRepairOrchestrator.recordSignal(signalInput());
    const duplicateIdempotency =
      await application.identityRepairOrchestrator.recordSignal(signalInput());
    const duplicateDigest = await application.identityRepairOrchestrator.recordSignal(
      signalInput({ idempotencyKey: "signal_182_patient_report_second_click" }),
    );

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/097_phase2_identity_repair_chain.sql",
    );
    expect(application.migrationPlanRefs).toEqual(identityRepairChainMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(identityRepairChainPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(identityRepairChainParallelInterfaceGaps);
    expect(application.policyVersion).toBe(IDENTITY_REPAIR_POLICY_VERSION);
    expect([
      "IdentityRepairOrchestrator",
      "AccessGrantService",
      "SessionGovernor",
      "IdentityBindingAuthority",
      "PatientIdentityHoldProjection",
    ]).toContain("IdentityRepairOrchestrator");
    expect(duplicateIdempotency.replayedSignal).toBe(true);
    expect(duplicateDigest.replayedSignal).toBe(true);
    expect(duplicateIdempotency.repairCase.repairCaseId).toBe(first.repairCase.repairCaseId);
    expect(application.repository.snapshots().signals).toHaveLength(1);
    expect(application.repository.snapshots().cases).toHaveLength(1);
  });

  it("reuses the active case for the same frozen identity binding", async () => {
    const { application } = createHarness();

    const first = await application.identityRepairOrchestrator.recordSignal(signalInput());
    const second = await application.identityRepairOrchestrator.recordSignal(
      signalInput({
        idempotencyKey: "signal_182_support_report",
        affectedRequestRef: "request_182_followup",
        signalClass: "support_report",
        signalDisposition: "confirmed_misbinding",
        evidenceRefs: ["evidence_182_support_report"],
        reportedBy: "support_operator_182",
      }),
    );

    expect(second.reusedActiveCase).toBe(true);
    expect(second.repairCase.repairCaseId).toBe(first.repairCase.repairCaseId);
    expect(second.repairCase.repairBasis).toBe("confirmed_wrong_patient");
    expect(second.repairCase.affectedRequestRefs).toEqual(["request_182", "request_182_followup"]);
    expect(application.repository.snapshots().signals).toHaveLength(2);
    expect(application.repository.snapshots().cases).toHaveLength(1);
  });

  it("commits the freeze exactly once and fences stale sessions, grants, route intents, communications, and projections", async () => {
    const { application, calls, opened } = await openedAndFrozenHarness();

    const replay = await application.identityRepairOrchestrator.commitFreeze({
      freezeIdempotencyKey: "freeze_182",
      identityRepairCaseRef: opened.repairCase.repairCaseId,
      actorRef: "support_operator_182",
      observedAt: "2026-04-15T09:06:00.000Z",
    });

    expect(replay.replayedFreeze).toBe(true);
    expect(calls.sessions).toHaveLength(1);
    expect(calls.grants).toHaveLength(1);
    expect(calls.routes).toHaveLength(1);
    expect(calls.communicationFreezes).toHaveLength(1);
    expect(calls.projectionDegrades).toHaveLength(1);
    expect(replay.freezeRecord.issuedFor).toBe("identity_repair");
    expect(replay.freezeRecord.lineageFenceRef).toContain("lineage_fence_identity_repair");
    expect(replay.freezeRecord.sessionTerminationSettlementRefs).toEqual([
      "session-freeze-session_182",
    ]);
    expect(replay.freezeRecord.accessGrantSupersessionRefs).toEqual([
      "grant-supersession-grant_182",
    ]);
    expect(replay.freezeRecord.supersededRouteIntentBindingRefs).toEqual([
      "route-supersession-route_intent_182",
    ]);
    expect(replay.freezeRecord.communicationsHoldState).toBe("active");
    expect(replay.patientIdentityHoldProjection.hiddenPhiDetail).toBe(true);
    expect(replay.patientActionRecoveryProjection.noGenericRedirect).toBe(true);
    expect(application.repository.snapshots().branchDispositions).toHaveLength(8);
  });

  it("routes exact replay during active repair to hold and recovery projections", async () => {
    const { application, opened } = await openedAndFrozenHarness();

    const routed = await application.identityRepairOrchestrator.routeDuringActiveRepair({
      frozenIdentityBindingRef: opened.repairCase.frozenIdentityBindingRef,
    });

    expect(routed.decision).toBe("identity_hold");
    expect(routed.patientIdentityHoldProjection.displayMode).toBe("summary_only");
    expect(routed.patientIdentityHoldProjection.blockedActions).toContain("view_phi_detail");
    expect(routed.patientActionRecoveryProjection.actionRoutingMode).toBe("recovery_only");
  });

  it("requires review, authority correction, and branch disposition settlement before release", async () => {
    const { application, calls, opened } = await openedAndFrozenHarness();

    await expect(
      application.identityRepairOrchestrator.settleRelease({
        releaseIdempotencyKey: "release_182_too_early",
        identityRepairCaseRef: opened.repairCase.repairCaseId,
        releaseMode: "read_only_resume",
        actorRef: "support_operator_182",
      }),
    ).rejects.toThrow("review");

    const review = await application.identityRepairOrchestrator.recordReviewApproval({
      reviewIdempotencyKey: "review_182",
      identityRepairCaseRef: opened.repairCase.repairCaseId,
      supervisorApprovalRef: "supervisor_approval_182",
      independentReviewRef: "independent_review_182",
      reviewedCorrectionPlanRef: "correction_plan_182",
      approvedBySupervisor: "supervisor_182",
      approvedByIndependentReviewer: "independent_reviewer_182",
      approvedAt: "2026-04-15T09:10:00.000Z",
    });

    await expect(
      application.identityRepairOrchestrator.settleRelease({
        releaseIdempotencyKey: "release_182_before_correction",
        identityRepairCaseRef: opened.repairCase.repairCaseId,
        releaseMode: "read_only_resume",
        actorRef: "support_operator_182",
      }),
    ).rejects.toThrow("IdentityBindingAuthority");

    const correction = await application.identityRepairOrchestrator.applyAuthorityCorrection({
      correctionIdempotencyKey: "correction_182",
      identityRepairCaseRef: opened.repairCase.repairCaseId,
      correctionMode: "correction_applied",
      correctedIdentityBindingRef: "binding_corrected_182",
      actorRef: "support_operator_182",
      observedAt: "2026-04-15T09:15:00.000Z",
    });
    const correctionReplay = await application.identityRepairOrchestrator.applyAuthorityCorrection({
      correctionIdempotencyKey: "correction_182",
      identityRepairCaseRef: opened.repairCase.repairCaseId,
      correctionMode: "correction_applied",
      correctedIdentityBindingRef: "binding_corrected_182",
      actorRef: "support_operator_182",
      observedAt: "2026-04-15T09:16:00.000Z",
    });

    expect(review.reviewApproval.supervisorApprovalRef).toBe("supervisor_approval_182");
    expect(correction.correction.bindingAuthoritySettlementRef).toBe(
      "identity_binding_authority_settlement_182",
    );
    expect(correctionReplay.replayedCorrection).toBe(true);
    expect(calls.authority).toHaveLength(1);

    await expect(
      application.identityRepairOrchestrator.settleRelease({
        releaseIdempotencyKey: "release_182_before_branches",
        identityRepairCaseRef: opened.repairCase.repairCaseId,
        releaseMode: "read_only_resume",
        actorRef: "support_operator_182",
      }),
    ).rejects.toThrow("branch dispositions");

    await settleBranches(application, opened.repairCase.repairCaseId);

    const release = await application.identityRepairOrchestrator.settleRelease({
      releaseIdempotencyKey: "release_182",
      identityRepairCaseRef: opened.repairCase.repairCaseId,
      releaseMode: "writable_resume",
      actorRef: "support_operator_182",
      observedAt: "2026-04-15T10:00:00.000Z",
    });
    const releaseReplay = await application.identityRepairOrchestrator.settleRelease({
      releaseIdempotencyKey: "release_182",
      identityRepairCaseRef: opened.repairCase.repairCaseId,
      releaseMode: "writable_resume",
      actorRef: "support_operator_182",
      observedAt: "2026-04-15T10:01:00.000Z",
    });

    expect(release.releaseSettlement.releaseMode).toBe("writable_resume");
    expect(release.releaseSettlement.freshSessionAllowed).toBe(true);
    expect(release.releaseSettlement.freshAccessGrantAllowed).toBe(true);
    expect(release.releaseSettlement.freshRouteIntentAllowed).toBe(true);
    expect(release.repairCase.state).toBe("closed");
    expect(releaseReplay.replayedRelease).toBe(true);
    expect(calls.communicationReleases).toHaveLength(1);
    expect(calls.projectionRebuilds).toHaveLength(1);
    expect(application.repository.snapshots().branchDispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branchType: "external_message_delivery",
          branchState: "compensated",
          compensationRef: expect.stringContaining("compensation-"),
        }),
        expect.objectContaining({
          branchType: "file_artifact_visibility",
          branchState: "terminal_suppressed",
        }),
      ]),
    );
  });
});
