import { describe, expect, it } from "vitest";
import {
  createAssistiveEvaluationPlane,
  type CreateCaseReplayBundleCommand,
  type EvaluationActorContext,
  type EvaluationActorRole,
} from "../../packages/domains/assistive_evaluation/src/index.ts";

const fixedClock = { now: () => "2026-04-27T10:00:00.000Z" };

function actor(actorRole: EvaluationActorRole): EvaluationActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_replay_determinism_test",
    routeIntentBindingRef: "route-intent:replay-harness",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

function bundleCommand(overrides: Partial<CreateCaseReplayBundleCommand> = {}): CreateCaseReplayBundleCommand {
  return {
    requestRef: "request:frozen:replay-001",
    taskRef: "task:frozen:replay-001",
    requestLineageRef: "lineage:request:replay-001",
    taskLineageRef: "lineage:task:replay-001",
    evidenceSnapshotRefs: ["evidence-snapshot:replay-001"],
    evidenceCaptureBundleRefs: ["evidence-capture:replay-001"],
    evidenceDerivationPackageRefs: ["evidence-derivation:replay-001"],
    expectedOutputsRef: "expected-output:replay-001",
    featureSnapshotRefs: ["feature-snapshot:replay-001"],
    promptTemplateVersionRef: "prompt-template:summary:v1",
    modelRegistryEntryRef: "model-registry:shadow:v1",
    outputSchemaVersionRef: "schema:summary:v1",
    runtimeConfigHash: "sha256:runtime-config-001",
    datasetPartition: "shadow_live",
    sensitivityTag: "nhs_internal_shadow",
    surfaceRouteContractRef: "route-contract:evaluation-workbench:v1",
    surfacePublicationRef: "surface-publication:evaluation-workbench:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    telemetryDisclosureFenceRef: "telemetry-fence:evaluation:v1",
    ...overrides,
  };
}

describe("406 replay harness determinism", () => {
  it("produces stable replay input and output hashes from pinned artifacts", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const captureJob = actor("shadow_dataset_capture_job");
    const replayHarness = actor("replay_harness");
    const bundle = plane.replayBundles.createReplayBundle(bundleCommand(), captureJob);

    const runA = plane.replayHarness.scheduleReplayRun(
      {
        replayBundleRef: bundle.replayBundleId,
        replayHarnessVersionRef: "replay-harness:phase8:v1",
      },
      replayHarness,
    );
    const runB = plane.replayHarness.scheduleReplayRun(
      {
        replayBundleRef: bundle.replayBundleId,
        replayHarnessVersionRef: "replay-harness:phase8:v1",
      },
      replayHarness,
    );
    const completedA = plane.replayHarness.executeReplayRun(
      {
        replayRunId: runA.replayRunId,
        outputRef: "assistive-output:summary:case-001",
        outputSchemaVersionRef: "schema:summary:v1",
        runtimeConfigHash: "sha256:runtime-config-001",
        comparisonSummaryRef: "comparison:summary:case-001",
        executorVersionRef: "executor:deterministic:v1",
      },
      replayHarness,
    );
    const completedB = plane.replayHarness.executeReplayRun(
      {
        replayRunId: runB.replayRunId,
        outputRef: "assistive-output:summary:case-001",
        outputSchemaVersionRef: "schema:summary:v1",
        runtimeConfigHash: "sha256:runtime-config-001",
        comparisonSummaryRef: "comparison:summary:case-001",
        executorVersionRef: "executor:deterministic:v1",
      },
      replayHarness,
    );

    expect(runA.replayInputHash).toBe(runB.replayInputHash);
    expect(completedA.outputHash).toBe(completedB.outputHash);
    expect(completedA.runState).toBe("completed");
  });

  it("fails closed when pinned inputs are missing, mutable, or runtime hashes drift", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const captureJob = actor("shadow_dataset_capture_job");
    const replayHarness = actor("replay_harness");

    expect(() =>
      plane.replayBundles.createReplayBundle(bundleCommand({ featureSnapshotRefs: [] }), captureJob),
    ).toThrow(/featureSnapshotRefs/);
    expect(() =>
      plane.replayBundles.createReplayBundle(
        bundleCommand({ mutableCurrentTaskStateRef: "mutable:task-current-view" }),
        captureJob,
      ),
    ).toThrow(/mutable current task state/i);

    const bundle = plane.replayBundles.createReplayBundle(bundleCommand(), captureJob);
    const run = plane.replayHarness.scheduleReplayRun(
      {
        replayBundleRef: bundle.replayBundleId,
        replayHarnessVersionRef: "replay-harness:phase8:v1",
      },
      replayHarness,
    );

    const failed = plane.replayHarness.executeReplayRun(
      {
        replayRunId: run.replayRunId,
        outputRef: "assistive-output:summary:case-001",
        outputSchemaVersionRef: "schema:summary:v1",
        runtimeConfigHash: "sha256:runtime-config-DRIFTED",
      },
      replayHarness,
    );

    expect(failed.runState).toBe("failed_closed");
    expect(failed.failureReasonCodes).toContain("runtime_config_hash_mismatch");
  });

  it("does not allow replay execution to mutate live workflow state", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const bundle = plane.replayBundles.createReplayBundle(bundleCommand(), actor("shadow_dataset_capture_job"));
    const run = plane.replayHarness.scheduleReplayRun(
      {
        replayBundleRef: bundle.replayBundleId,
        replayHarnessVersionRef: "replay-harness:phase8:v1",
      },
      actor("replay_harness"),
    );

    const failed = plane.replayHarness.executeReplayRun(
      {
        replayRunId: run.replayRunId,
        outputRef: "assistive-output:summary:case-001",
        outputSchemaVersionRef: "schema:summary:v1",
        runtimeConfigHash: "sha256:runtime-config-001",
        liveWorkflowMutationRef: "command:set-task-state",
      },
      actor("replay_harness"),
    );

    expect(failed.runState).toBe("failed_closed");
    expect(failed.failureReasonCodes).toContain("live_workflow_mutation_forbidden");
  });
});
