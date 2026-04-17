import { describe, expect, it } from "vitest";
import {
  PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
  PHASE3_QUEUE_ENGINE_SCHEMA_VERSION,
  PHASE3_QUEUE_ENGINE_SERVICE_NAME,
  createQueueRankingApplication,
  phase3QueueScenarioIds,
  queueRankingMigrationPlanRefs,
  queueRankingPersistenceTables,
  queueRankingRoutes,
} from "../src/queue-ranking.ts";

describe("phase3 queue engine command-api seam", () => {
  it("publishes the phase3 queue routes and composes deterministic scenarios", async () => {
    const application = createQueueRankingApplication();
    const scenarios = await application.simulation.runAllScenarios();

    expect(application.serviceName).toBe(PHASE3_QUEUE_ENGINE_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_QUEUE_ENGINE_SCHEMA_VERSION);
    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/110_phase3_triage_task_kernel.sql",
    );
    expect(application.migrationPlanRefs).toEqual(queueRankingMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(queueRankingPersistenceTables);
    expect(application.querySurfaces).toContain("GET /v1/workspace/queues/{queueKey}");
    expect(queueRankingRoutes.map((route) => route.routeId)).toEqual([
      "workspace_queue_current",
      "workspace_queue_assignment_suggestions_current",
      "workspace_queue_refresh_current",
      "workspace_queue_soft_claim",
    ]);
    expect(scenarios.map((scenario) => scenario.scenarioId)).toEqual([...phase3QueueScenarioIds]);

    const exact = scenarios.find((scenario) => scenario.scenarioId === "exact_formula_sort_precedence");
    expect(exact?.orderedTaskRefs[0]).toBe("task_queue_escalated");
    expect(exact?.heldTaskRefs).toEqual([]);

    const overload = scenarios.find((scenario) => scenario.scenarioId === "overload_critical_posture");
    expect(overload?.overloadState).toBe("overload_critical");

    const suggestions = scenarios.find(
      (scenario) => scenario.scenarioId === "reviewer_suggestion_downstream_only",
    );
    expect(suggestions?.suggestionSnapshotId).toBeTruthy();
    expect(suggestions?.governedAutoClaimRefs.length).toBeGreaterThan(0);

    const race = scenarios.find((scenario) => scenario.scenarioId === "soft_claim_race_serialized");
    expect(race?.softClaimOutcome).toBe("blocked_race");
  });

  it("queries the latest queue snapshot and blocks soft claim when workspace mutation is frozen", async () => {
    const application = createQueueRankingApplication();
    const refreshed = await application.refreshQueueSnapshot({
      queueKey: PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
      asOfAt: "2026-04-16T11:00:00Z",
      generatedAt: "2026-04-16T11:00:05Z",
      sourceFactCutRef: "fact_cut_query_current",
      trustInputRefs: ["trust_slice_queue", "trust_slice_reachability", "trust_slice_workspace"],
      telemetry: {
        criticalArrivalRatePerHour: 0.4,
        empiricalServiceRatePerHour: 1.25,
        activeReviewerCount: 4,
      },
      taskFacts: [
        {
          taskRef: "task_query_claimable",
          queueEnteredAt: "2026-04-16T09:00:00Z",
          slaTargetAt: "2026-04-16T12:00:00Z",
          expectedHandleMinutes: 16,
          clinicalPriorityBand: 5,
          residualRisk: 0.82,
          contactRisk: 0.24,
          assimilationPending: false,
          preemptionPending: false,
          escalated: true,
          returned: false,
          lastMaterialReturnAt: null,
          evidenceDeltaSeverity: 0,
          urgencyCarry: 0.34,
          vulnerability: 0.12,
          coverageFit: 0.84,
          duplicateReviewFlag: false,
          fairnessBandRef: "band_routine",
          trustState: "trusted",
          missingTrustInputRefs: [],
          scopeExcluded: false,
          archetypeRef: "triage_review",
        },
      ],
    });

    const queried = await application.queryQueue(PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY);
    expect(queried?.snapshot.rankSnapshotId).toBe(refreshed.snapshot.rankSnapshotId);
    expect(queried?.entries[0]?.taskRef).toBe("task_query_claimable");

    await expect(
      application.softClaimTask({
        queueKey: PHASE3_QUEUE_ENGINE_FIXTURE_QUEUE_KEY,
        taskId: "task_query_claimable",
        rankSnapshotRef: refreshed.snapshot.rankSnapshotId,
        actorRef: "reviewer_preview_only",
        claimedAt: "2026-04-16T11:00:10Z",
        mutationAuthorityState: "frozen",
      }),
    ).rejects.toThrow("not currently writable");
  });
});
