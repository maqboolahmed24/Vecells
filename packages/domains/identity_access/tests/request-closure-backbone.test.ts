import { describe, expect, it } from "vitest";
import {
  assertRequestWorkflowCloseAllowed,
  createRequestClosureAuthorityService,
  createRequestClosureSimulationHarness,
  createRequestClosureStore,
} from "../src/index.ts";

describe("request closure backbone", () => {
  it("persists a legal close only when blockers, confirmations, and command-following debt are empty", async () => {
    const repositories = createRequestClosureStore();
    const authority = createRequestClosureAuthorityService(repositories);

    const result = await authority.evaluateAndSave({
      episodeId: "episode_close",
      requestId: "request_close",
      requestLineageRef: "lineage_close",
      evaluatedAt: "2026-04-12T23:00:00Z",
      requiredLineageEpoch: 14,
      terminalOutcomeRef: "outcome_close",
      currentClosureBlockerRefs: [],
      currentConfirmationGateRefs: [],
      requiredCommandFollowingProjectionRefs: ["projection_close"],
      consumedCausalTokenRef: "causal_close",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    expect(result.snapshot.decision).toBe("close");
    expect(result.snapshot.closedByMode).toBe("routine_terminal_outcome");
    expect(result.deferReasonCodes).toEqual([]);
    expect(result.snapshot.currentClosureBlockerRefs).toEqual([]);
    expect(result.snapshot.currentConfirmationGateRefs).toEqual([]);
    expect(() => assertRequestWorkflowCloseAllowed(result.snapshot)).not.toThrow();
  });

  it("defers when duplicate review remains open on the lineage", async () => {
    const repositories = createRequestClosureStore();
    const authority = createRequestClosureAuthorityService(repositories);

    const result = await authority.evaluateAndSave({
      episodeId: "episode_duplicate",
      requestId: "request_duplicate",
      requestLineageRef: "lineage_duplicate",
      evaluatedAt: "2026-04-12T23:01:00Z",
      requiredLineageEpoch: 15,
      blockingDuplicateClusterRefs: ["duplicate_cluster_001"],
      currentClosureBlockerRefs: ["duplicate_cluster_001"],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_duplicate",
      requiredCommandFollowingProjectionRefs: ["projection_duplicate"],
      consumedCausalTokenRef: "causal_duplicate",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    expect(result.snapshot.decision).toBe("defer");
    expect(result.snapshot.closedByMode).toBe("not_closed");
    expect(result.deferReasonCodes).toContain("REPAIR_OR_REVIEW_OPEN");
    expect(result.blockerRefs).toContain("duplicate_cluster_001");
  });

  it("fails close validation when materialized blocker refs remain even if canonical arrays are empty", async () => {
    const repositories = createRequestClosureStore();
    const authority = createRequestClosureAuthorityService(repositories);

    const result = await authority.evaluateAndSave({
      episodeId: "episode_stale",
      requestId: "request_stale",
      requestLineageRef: "lineage_stale",
      evaluatedAt: "2026-04-12T23:02:00Z",
      requiredLineageEpoch: 16,
      currentClosureBlockerRefs: ["stale_blocker_ref_001"],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_stale",
      requiredCommandFollowingProjectionRefs: ["projection_stale"],
      consumedCausalTokenRef: "causal_stale",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    expect(result.snapshot.decision).toBe("defer");
    expect(result.deferReasonCodes).toContain("MATERIALIZED_BLOCKERS_PRESENT");
  });

  it("rejects wrong-patient repair from being modeled as a fallback review case", async () => {
    const repositories = createRequestClosureStore();
    const authority = createRequestClosureAuthorityService(repositories);

    await expect(
      authority.openFallbackReviewCase({
        lineageScope: "request",
        requestId: "request_wrong_patient",
        episodeId: "episode_wrong_patient",
        requestLineageRef: "lineage_wrong_patient",
        triggerClass: "auth_recovery",
        governedRecoveryFamily: "wrong_patient_repair",
        patientVisibleState: "under_manual_review",
        manualOwnerQueue: "identity_repair",
        slaAnchorAt: "2026-04-12T23:03:00Z",
        receiptIssuedAt: "2026-04-12T23:03:10Z",
        createdAt: "2026-04-12T23:03:10Z",
      }),
    ).rejects.toThrow(/IdentityRepairCase/i);
  });

  it("requires recovery, supersession, or governed manual settlement before a fallback case can close", async () => {
    const repositories = createRequestClosureStore();
    const authority = createRequestClosureAuthorityService(repositories);

    const opened = await authority.openFallbackReviewCase({
      lineageScope: "request",
      requestId: "request_fallback",
      episodeId: "episode_fallback",
      requestLineageRef: "lineage_fallback",
      triggerClass: "artifact_quarantine",
      patientVisibleState: "submitted_degraded",
      manualOwnerQueue: "manual_exception_review",
      slaAnchorAt: "2026-04-12T23:04:00Z",
      receiptIssuedAt: "2026-04-12T23:04:05Z",
      createdAt: "2026-04-12T23:04:05Z",
    });

    await expect(
      authority.closeFallbackReviewCase({
        fallbackCaseId: opened.snapshot.fallbackCaseId,
        updatedAt: "2026-04-12T23:05:00Z",
        closedAt: "2026-04-12T23:05:00Z",
        closureBasis: "recovered",
      }),
    ).rejects.toThrow(/recovery has been recorded/i);

    const recovered = await authority.recoverFallbackReviewCase({
      fallbackCaseId: opened.snapshot.fallbackCaseId,
      updatedAt: "2026-04-12T23:05:30Z",
      recoveredAt: "2026-04-12T23:05:30Z",
      latestRecoveryEvidenceRef: "recovery_evidence_001",
    });

    const closed = await authority.closeFallbackReviewCase({
      fallbackCaseId: recovered.snapshot.fallbackCaseId,
      updatedAt: "2026-04-12T23:06:00Z",
      closedAt: "2026-04-12T23:06:00Z",
      closureBasis: "recovered",
    });

    expect(closed.snapshot.caseState).toBe("closed");
    expect(closed.snapshot.closureBasis).toBe("recovered");
    expect(closed.snapshot.patientVisibleState).toBe("closed");
  });

  it("publishes the full simulator scenario pack needed by the later lifecycle coordinator", async () => {
    const simulation = createRequestClosureSimulationHarness();
    const results = await simulation.runAllScenarios();

    expect(results).toHaveLength(7);
    expect(results.find((entry) => entry.scenarioId === "legal_close_no_blockers")?.decision).toBe(
      "close",
    );
    expect(
      results.find((entry) => entry.scenarioId === "defer_duplicate_review_open")?.deferReasonCodes,
    ).toContain("REPAIR_OR_REVIEW_OPEN");
    expect(
      results.find((entry) => entry.scenarioId === "defer_stale_materialized_blocker_refs")
        ?.deferReasonCodes,
    ).toContain("MATERIALIZED_BLOCKERS_PRESENT");
  });
});
