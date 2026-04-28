import { describe, expect, it } from "vitest";
import {
  EventApplier,
  createProjectionHandlerRegistry,
  createProjectionRebuildSimulationHarness,
  createProjectionRuntimeStore,
  evaluateProjectionCompatibility,
  evaluateProjectionReadinessVerdict,
  makeProjectionReplayEvent,
  validateProjectionLedgerState,
} from "../src/index.ts";

describe("projection rebuild worker", () => {
  it("rebuilds the patient requests projection from immutable events", async () => {
    const harness = createProjectionRebuildSimulationHarness();

    const result = await harness.worker.run({
      rebuildJobId: "test_cold_patient_rebuild",
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
          projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
          projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_V1",
        },
      ],
    });

    expect(result.ledgers[0].processedEventCount).toBe(5);
    expect(result.readinessVerdicts[0].readinessState).toBe("live");

    const document = harness.store.getProjectionDocument(
      "PRCF_082_PATIENT_REQUESTS",
      "PRCV_082_PATIENT_REQUESTS_V1",
    );
    expect(document?.state).toMatchObject({
      openRequestCount: 0,
      submittedRequestCount: 1,
      closedRequestCount: 1,
      calmSummaryState: "tracking",
    });
    expect(validateProjectionLedgerState(harness.store).valid).toBe(true);
  });

  it("replays after a crash without duplicating projection effects", async () => {
    const harness = createProjectionRebuildSimulationHarness();

    const crashed = await harness.worker.run({
      rebuildJobId: "test_ops_crash",
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
          projectionVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
          projectionVersionSetRef: "PRCVS_082_OPERATIONS_BOARD_V1",
        },
      ],
      simulateCrashAfterApplyCount: 1,
    });

    expect(crashed.ledgers[0].rebuildState).toBe("crashed");

    const resumed = await harness.worker.run({
      rebuildJobId: "test_ops_resume",
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
          projectionVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
          projectionVersionSetRef: "PRCVS_082_OPERATIONS_BOARD_V1",
        },
      ],
    });

    expect(resumed.ledgers[0].duplicateEventCount).toBe(1);
    expect(resumed.ledgers[0].rebuildState).toBe("completed");

    const document = harness.store.getProjectionDocument(
      "PRCF_082_OPERATIONS_BOARD",
      "PRCV_082_OPERATIONS_BOARD_V1",
    );
    expect(document?.state).toMatchObject({
      blockedDependencyCount: 1,
      repairingDependencyCount: 1,
    });
  });

  it("resumes a staff-workspace catch-up from a saved checkpoint", async () => {
    const harness = createProjectionRebuildSimulationHarness();
    const seedEvent = harness.eventStream.find(
      (event) => event.eventName === "triage.task.created",
    );

    expect(seedEvent).toBeDefined();
    if (!seedEvent) {
      return;
    }

    harness.applier.apply({
      projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
      projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
      projectionKey: "singleton",
      event: seedEvent,
    });
    harness.store.saveCheckpoint({
      projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
      projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
      projectionKey: "singleton",
      checkpointToken: "checkpoint_staff_082_partial",
      checkpointedThroughEventId: seedEvent.eventId,
      checkpointedThroughPosition: seedEvent.streamPosition,
      nextStreamPosition: seedEvent.streamPosition + 1,
      updatedAt: new Date().toISOString(),
    });
    harness.store.saveCursor({
      cursorRef: "cursor_staff_082_partial",
      projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
      projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
      projectionKey: "singleton",
      environment: "lab",
      rebuildMode: "catch_up",
      rebuildState: "idle",
      nextStreamPosition: seedEvent.streamPosition + 1,
      lastSeenEventId: seedEvent.eventId,
      checkpointToken: "checkpoint_staff_082_partial",
      updatedAt: new Date().toISOString(),
    });

    const resumed = await harness.worker.run({
      rebuildJobId: "test_staff_partial_resume",
      rebuildMode: "catch_up",
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
          projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
          projectionVersionSetRef: "PRCVS_082_STAFF_WORKSPACE_V1",
        },
      ],
    });

    expect(resumed.ledgers[0].processedEventCount).toBe(1);
    expect(resumed.ledgers[0].resumeCount).toBe(1);
    expect(resumed.readinessVerdicts[0].readinessState).toBe("live");
    const document = harness.store.getProjectionDocument(
      "PRCF_082_STAFF_WORKSPACE",
      "PRCV_082_STAFF_WORKSPACE_V1",
    );
    expect(document?.state).toMatchObject({
      activeTaskCount: 0,
      settledTaskCount: 1,
    });
  });

  it("fails closed on an incompatible event version", () => {
    const store = createProjectionRuntimeStore();
    const applier = new EventApplier(store, createProjectionHandlerRegistry());

    const result = applier.apply({
      projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
      projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
      projectionKey: "singleton",
      event: {
        eventId: "evt_future",
        eventName: "request.created",
        schemaVersionRef: "CESV_REQUEST_CREATED_V2",
        emittedAt: new Date().toISOString(),
        streamPosition: 1,
        partitionKey: "REQ_082_FUTURE",
        contractDigest: "future_digest",
        payload: { requestId: "REQ_082_FUTURE" },
      },
    });

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.blockerRef).toBe("unknown_schema_version");
    }
  });

  it("supports dual-read rebuild comparison before cutover", async () => {
    const harness = createProjectionRebuildSimulationHarness();

    await harness.worker.run({
      rebuildJobId: "test_dual_read_baseline",
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
          projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
          projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_V1",
        },
      ],
    });

    const dryRun = await harness.worker.run({
      rebuildJobId: "test_dual_read_candidate",
      rebuildMode: "dry_run",
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
          projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
          projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_DUAL_READ",
        },
      ],
    });

    expect(dryRun.readinessVerdicts[0]).toMatchObject({
      compatibilityState: "dual_read",
      readinessState: "recovering",
      readPathDisposition: "summary_only",
    });
    expect(dryRun.dryRunComparisons[0].coreParityMatch).toBe(true);
    expect(dryRun.dryRunComparisons[0].changedFields).toContain("projectionFlavor");
  });

  it("downgrades stale projections to summary only instead of implying completeness", () => {
    const compatibility = evaluateProjectionCompatibility({
      projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
      projectionVersionSetRef: "PRCVS_082_STAFF_WORKSPACE_V1",
      availableSchemaVersionRefs: ["CESV_TRIAGE_TASK_CREATED_V1", "CESV_TRIAGE_TASK_SETTLED_V1"],
    });

    const readiness = evaluateProjectionReadinessVerdict({
      projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
      projectionVersionSetRef: "PRCVS_082_STAFF_WORKSPACE_V1",
      compatibilityVerdict: compatibility,
      checkpointLag: 3,
      checkpointToken: "checkpoint_082_stale",
      rebuildState: "completed",
    });

    expect(readiness.readinessState).toBe("stale");
    expect(readiness.readPathDisposition).toBe("summary_only");
    expect(readiness.writableDisposition).toBe("guarded");
  });

  it("blocks publication when the version set requires an unsupported schema", () => {
    const compatibility = evaluateProjectionCompatibility({
      projectionVersionRef: "PRCV_082_SUPPORT_REPLAY_V2",
      projectionVersionSetRef: "PRCVS_082_SUPPORT_REPLAY_BLOCKED",
      availableSchemaVersionRefs: ["CESV_EXCEPTION_REVIEW_CASE_OPENED_V1"],
    });

    expect(compatibility.compatibilityState).toBe("blocked");
    expect(compatibility.missingSchemaVersionRefs).toContain(
      "CESV_EXCEPTION_REVIEW_CASE_RECOVERED_V1",
    );
  });

  it("builds deterministic envelopes from the canonical schema registry", () => {
    const event = makeProjectionReplayEvent({
      eventName: "exception.review_case.opened",
      streamPosition: 8,
      payload: { caseId: "EXC_082_101" },
    });

    expect(event.schemaVersionRef).toBe("CESV_EXCEPTION_REVIEW_CASE_OPENED_V1");
    expect(event.contractDigest).toHaveLength(64);
  });
});
