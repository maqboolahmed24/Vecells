import { describe, expect, it } from "vitest";
import {
  PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
  PHASE3_DUPLICATE_REVIEW_QUERY_SURFACES,
  PHASE3_DUPLICATE_REVIEW_SCHEMA_VERSION,
  PHASE3_DUPLICATE_REVIEW_SERVICE_NAME,
  createDuplicateReviewApplication,
  duplicateReviewMigrationPlanRefs,
  duplicateReviewPersistenceTables,
  duplicateReviewRoutes,
  phase3DuplicateReviewScenarioIds,
} from "../src/duplicate-review.ts";

describe("phase 3 duplicate review application seam", () => {
  it("publishes the duplicate review query and resolve surfaces against triage tasks", async () => {
    const application = createDuplicateReviewApplication();
    const queried = await application.queryTaskDuplicateReview(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID);

    expect(application.serviceName).toBe(PHASE3_DUPLICATE_REVIEW_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_DUPLICATE_REVIEW_SCHEMA_VERSION);
    expect(application.querySurfaces).toEqual(PHASE3_DUPLICATE_REVIEW_QUERY_SURFACES);
    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/111_phase3_duplicate_review_projection_and_invalidation.sql",
    );
    expect(application.migrationPlanRefs).toEqual(duplicateReviewMigrationPlanRefs);
    expect(duplicateReviewPersistenceTables).toEqual(
      expect.arrayContaining([
        "duplicate_review_snapshots",
        "duplicate_consequence_invalidation_records",
        "phase3_triage_tasks",
      ]),
    );
    expect(duplicateReviewRoutes.map((route) => route.routeId)).toEqual([
      "workspace_task_duplicate_review_current",
      "workspace_task_duplicate_review_resolve",
    ]);
    expect(queried.snapshot.taskId).toBe(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID);
    expect(queried.snapshot.authorityBoundary.duplicateClusterAuthority).toBe("DuplicateCluster");
    expect(queried.snapshot.authorityBoundary.sameRequestAttachAuthority).toBe(
      "DuplicateResolutionDecision",
    );
    expect(queried.snapshot.authorityBoundary.replayAuthority).toBe("IdempotencyRecord");
    expect(queried.snapshot.queueRelevance.queueBlockingState).toBe("explicit_review_required");
    expect(queried.snapshot.workspaceRelevance.actionScope).toBe("resolve_duplicate_cluster");
    expect(queried.snapshot.currentDecisionClass).toBe("review_required");
  });

  it("requires the latest snapshot and emits explicit stale-consequence invalidations on reversal", async () => {
    const application = createDuplicateReviewApplication();
    const initial = await application.queryTaskDuplicateReview(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID);

    const attached = await application.resolveTaskDuplicateReview(
      PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
      {
        duplicateReviewSnapshotRef: initial.snapshot.duplicateReviewSnapshotId,
        decisionClass: "same_request_attach",
        winningPairEvidenceRef:
          initial.snapshot.winningPairEvidenceRef ?? initial.snapshot.pairEvidenceRefs[0],
        continuityWitnessClass: "workflow_return",
        continuityWitnessRef: "witness_234_workflow_return",
        reviewMode: "human_review",
        reasonCodes: ["WORKFLOW_RETURN_CONFIRMED", "CONTINUITY_WITNESS_PRESENT"],
        decidedByRef: "reviewer_234_primary",
        decidedAt: "2026-04-16T11:10:00.000Z",
      },
    );

    expect(attached.decision.decisionClass).toBe("same_request_attach");
    expect(attached.invalidations).toEqual([]);

    await expect(
      application.resolveTaskDuplicateReview(PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID, {
        duplicateReviewSnapshotRef: initial.snapshot.duplicateReviewSnapshotId,
        decisionClass: "separate_request",
        winningPairEvidenceRef:
          attached.snapshot.winningPairEvidenceRef ?? attached.snapshot.pairEvidenceRefs[0],
        reviewMode: "human_review",
        reasonCodes: ["STALE_SNAPSHOT"],
        decidedByRef: "reviewer_234_primary",
        decidedAt: "2026-04-16T11:15:00.000Z",
      }),
    ).rejects.toThrow(/latest DuplicateReviewSnapshot/i);

    const separated = await application.resolveTaskDuplicateReview(
      PHASE3_DUPLICATE_REVIEW_FIXTURE_TASK_ID,
      {
        duplicateReviewSnapshotRef: attached.snapshot.duplicateReviewSnapshotId,
        decisionClass: "separate_request",
        winningPairEvidenceRef:
          attached.snapshot.winningPairEvidenceRef ?? attached.snapshot.pairEvidenceRefs[0],
        reviewMode: "human_review",
        reasonCodes: ["LATE_EVIDENCE_DELTA", "ATTACH_NO_LONGER_SAFE"],
        decidedByRef: "reviewer_234_primary",
        decidedAt: "2026-04-16T11:16:00.000Z",
      },
    );

    expect(separated.supersededDecisionRef).toBe(attached.decision.duplicateResolutionDecisionId);
    expect(separated.invalidations.map((entry) => entry.targetType)).toEqual(
      expect.arrayContaining([
        "approval_checkpoint",
        "endpoint_outcome_preview",
        "booking_intent",
        "pharmacy_intent",
        "workspace_assumption",
      ]),
    );
    expect(separated.snapshot.currentInvalidationBurden.totalCount).toBe(
      separated.invalidations.length,
    );
  });

  it("keeps the scenario pack coherent for 234", async () => {
    const application = createDuplicateReviewApplication();
    const scenarios = await application.runAllScenarios();

    expect(phase3DuplicateReviewScenarioIds).toEqual([
      "review_required_snapshot",
      "same_request_attach_with_witness",
      "reversal_invalidates_downstream",
      "retry_authority_boundary",
    ]);
    expect(scenarios).toHaveLength(4);
    expect(scenarios.map((entry) => entry.scenarioId)).toEqual(phase3DuplicateReviewScenarioIds);
    expect(
      scenarios.find((entry) => entry.scenarioId === "retry_authority_boundary")?.decisionClass,
    ).toBe("exact_retry_collapse");
  });
});
