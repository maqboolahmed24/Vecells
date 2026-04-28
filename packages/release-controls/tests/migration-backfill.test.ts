import { describe, expect, it } from "vitest";
import {
  createMigrationBackfillSimulationHarness,
  createProjectionRebuildSimulationHarness,
  validateGovernedProjectionBackfillPlan,
  validateSchemaMigrationPlan,
} from "../src/index.ts";

describe("migration backfill runner", () => {
  it("builds deterministic impact previews for the governed plan", () => {
    const harness = createMigrationBackfillSimulationHarness();
    const validation = validateSchemaMigrationPlan(harness.plan);
    const backfillValidation = validateGovernedProjectionBackfillPlan(harness.backfillPlan);

    expect(validation.valid).toBe(true);
    expect(backfillValidation.valid).toBe(true);

    const previewA = harness.runner.preview({
      plan: harness.plan,
      backfillPlan: harness.backfillPlan,
      binding: harness.binding,
      bundle: harness.bundle,
      currentBundle: harness.currentBundle,
      parityRecord: harness.parityRecord,
      currentParity: harness.currentParity,
      intent: "dry_run",
      options: {
        operatorRef: "operator::preview",
      },
    });
    const previewB = harness.runner.preview({
      plan: harness.plan,
      backfillPlan: harness.backfillPlan,
      binding: harness.binding,
      bundle: harness.bundle,
      currentBundle: harness.currentBundle,
      parityRecord: harness.parityRecord,
      currentParity: harness.currentParity,
      intent: "dry_run",
      options: {
        operatorRef: "operator::preview",
      },
    });

    expect(previewA.impactPreview).toEqual(previewB.impactPreview);
    expect(previewA.impactPreview.affectedRouteFamilyRefs).toEqual(
      harness.plan.affectedRouteFamilyRefs,
    );
  });

  it("settles a dry run as pending observation instead of implying production safety", async () => {
    const harness = createMigrationBackfillSimulationHarness();

    const result = await harness.runner.execute({
      plan: harness.plan,
      backfillPlan: harness.backfillPlan,
      binding: harness.binding,
      bundle: harness.bundle,
      currentBundle: harness.currentBundle,
      parityRecord: harness.parityRecord,
      currentParity: harness.currentParity,
      projectionWorker: harness.projectionWorker,
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: harness.backfillPlan.projectionFamilyRef,
          projectionVersionRef: harness.backfillPlan.projectionVersionRef,
          projectionVersionSetRef: harness.backfillPlan.projectionContractVersionSetRefs[0]!,
        },
      ],
      intent: "dry_run",
      options: {
        operatorRef: "operator::dry-run",
        observedMinutes: 45,
        observedSamples: 4,
        comparisonMatches: true,
        rollbackModeMatches: true,
      },
    });

    expect(result.publicationVerdict.publishable).toBe(true);
    expect(result.routeReadinessVerdicts[0]?.verdictState).toBe("ready");
    expect(result.settlement.result).toBe("accepted_pending_observation");
    expect(result.settlement.observationState).toBe("satisfied");
  });

  it("fails closed when runtime publication parity drifts", async () => {
    const harness = createMigrationBackfillSimulationHarness();

    const result = await harness.runner.execute({
      plan: harness.plan,
      backfillPlan: harness.backfillPlan,
      binding: harness.binding,
      bundle: harness.bundle,
      currentBundle: harness.currentBundle,
      parityRecord: harness.parityRecord,
      currentParity: {
        ...harness.currentParity,
        driftReasonIds: ["DRIFT_ROUTE_CONTRACT_DIGESTS"],
      },
      projectionWorker: harness.projectionWorker,
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: harness.backfillPlan.projectionFamilyRef,
          projectionVersionRef: harness.backfillPlan.projectionVersionRef,
          projectionVersionSetRef: harness.backfillPlan.projectionContractVersionSetRefs[0]!,
        },
      ],
      intent: "execute",
      options: {
        operatorRef: "operator::blocked",
      },
    });

    expect(result.publicationVerdict.publishable).toBe(false);
    expect(result.routeReadinessVerdicts[0]?.verdictState).toBe("blocked");
    expect(result.settlement.result).toBe("blocked_policy");
  });

  it("resumes a checkpointed backfill instead of replaying from the beginning", async () => {
    const migrationHarness = createMigrationBackfillSimulationHarness();
    const projectionHarness = createProjectionRebuildSimulationHarness();
    const seedEvent = projectionHarness.eventStream.find(
      (event) => event.eventName === "request.created",
    );

    expect(seedEvent).toBeDefined();
    if (!seedEvent) {
      return;
    }

    projectionHarness.applier.apply({
      projectionFamilyRef: migrationHarness.backfillPlan.projectionFamilyRef,
      projectionVersionRef: migrationHarness.backfillPlan.projectionVersionRef,
      projectionKey: "singleton",
      event: seedEvent,
    });
    projectionHarness.store.saveCheckpoint({
      projectionFamilyRef: migrationHarness.backfillPlan.projectionFamilyRef,
      projectionVersionRef: migrationHarness.backfillPlan.projectionVersionRef,
      projectionKey: "singleton",
      checkpointToken: "checkpoint_095_partial",
      checkpointedThroughEventId: seedEvent.eventId,
      checkpointedThroughPosition: seedEvent.streamPosition,
      nextStreamPosition: seedEvent.streamPosition + 1,
      updatedAt: new Date().toISOString(),
    });
    projectionHarness.store.saveCursor({
      cursorRef: "cursor_095_partial",
      projectionFamilyRef: migrationHarness.backfillPlan.projectionFamilyRef,
      projectionVersionRef: migrationHarness.backfillPlan.projectionVersionRef,
      projectionKey: "singleton",
      environment: "ci-preview",
      rebuildMode: "rebuild",
      rebuildState: "idle",
      nextStreamPosition: seedEvent.streamPosition + 1,
      lastSeenEventId: seedEvent.eventId,
      checkpointToken: "checkpoint_095_partial",
      updatedAt: new Date().toISOString(),
    });

    const result = await migrationHarness.runner.execute({
      plan: migrationHarness.plan,
      backfillPlan: migrationHarness.backfillPlan,
      binding: migrationHarness.binding,
      bundle: migrationHarness.bundle,
      currentBundle: migrationHarness.currentBundle,
      parityRecord: migrationHarness.parityRecord,
      currentParity: migrationHarness.currentParity,
      projectionWorker: projectionHarness.worker,
      eventStream: projectionHarness.eventStream,
      targets: [
        {
          projectionFamilyRef: migrationHarness.backfillPlan.projectionFamilyRef,
          projectionVersionRef: migrationHarness.backfillPlan.projectionVersionRef,
          projectionVersionSetRef:
            migrationHarness.backfillPlan.projectionContractVersionSetRefs[0]!,
        },
      ],
      intent: "execute",
      options: {
        operatorRef: "operator::resume",
        observedMinutes: 45,
        observedSamples: 4,
        comparisonMatches: true,
        rollbackModeMatches: true,
      },
    });

    expect(result.backfillResult?.ledgers[0]?.resumeCount).toBe(1);
    expect(result.backfillResult?.ledgers[0]?.processedEventCount).toBeGreaterThan(0);
    expect(result.routeReadinessVerdicts[0]?.verdictState).toBe("ready");
  });

  it("keeps routes constrained while the observation window is incomplete", async () => {
    const harness = createMigrationBackfillSimulationHarness();

    const result = await harness.runner.execute({
      plan: harness.plan,
      backfillPlan: harness.backfillPlan,
      binding: harness.binding,
      bundle: harness.bundle,
      currentBundle: harness.currentBundle,
      parityRecord: harness.parityRecord,
      currentParity: harness.currentParity,
      projectionWorker: harness.projectionWorker,
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: harness.backfillPlan.projectionFamilyRef,
          projectionVersionRef: harness.backfillPlan.projectionVersionRef,
          projectionVersionSetRef: harness.backfillPlan.projectionContractVersionSetRefs[0]!,
        },
      ],
      intent: "execute",
      options: {
        operatorRef: "operator::observe",
        observedMinutes: 10,
        observedSamples: 1,
        comparisonMatches: true,
        rollbackModeMatches: true,
      },
    });

    expect(result.routeReadinessVerdicts[0]?.verdictState).toBe("constrained");
    expect(result.routeReadinessVerdicts[0]?.allowedSurfaceState).toBe("summary_only");
    expect(result.settlement.result).toBe("accepted_pending_observation");
  });

  it("forces rollback-required posture when rollback mode proof diverges", async () => {
    const harness = createMigrationBackfillSimulationHarness();

    const result = await harness.runner.execute({
      plan: harness.plan,
      backfillPlan: harness.backfillPlan,
      binding: harness.binding,
      bundle: harness.bundle,
      currentBundle: harness.currentBundle,
      parityRecord: harness.parityRecord,
      currentParity: harness.currentParity,
      projectionWorker: harness.projectionWorker,
      eventStream: harness.eventStream,
      targets: [
        {
          projectionFamilyRef: harness.backfillPlan.projectionFamilyRef,
          projectionVersionRef: harness.backfillPlan.projectionVersionRef,
          projectionVersionSetRef: harness.backfillPlan.projectionContractVersionSetRefs[0]!,
        },
      ],
      intent: "execute",
      options: {
        operatorRef: "operator::rollback",
        observedMinutes: 45,
        observedSamples: 4,
        comparisonMatches: true,
        rollbackModeMatches: false,
      },
    });

    expect(result.routeReadinessVerdicts[0]?.verdictState).toBe("blocked");
    expect(result.routeReadinessVerdicts[0]?.blockerRefs).toContain("ROLLBACK_MODE_MISMATCH");
    expect(result.settlement.result).toBe("rollback_required");
  });
});
