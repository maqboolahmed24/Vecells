import { describe, expect, it } from "vitest";
import {
  bootstrapSharedPackage,
  createBuildProvenanceSimulationHarness,
  createCanaryRollbackSimulationHarness,
  createDependencyDegradationSimulationHarness,
  createRuntimePublicationSimulationHarness,
  createRuntimeTopologyPublicationSimulationHarness,
  createSupplyChainVerificationSimulationHarness,
  createResilienceBaselineSimulationHarness,
  createBrowserRuntimeSimulationHarness,
  createProjectionRebuildSimulationHarness,
  createMigrationBackfillSimulationHarness,
  createReleaseWatchPipelineSimulationHarness,
  isLiveReleaseTrustVerdict,
  ownedContractFamilies,
  ownedObjectFamilies,
  packageContract,
  releaseTrustAllowsCalmTruth,
  releaseTrustAllowsMutation,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";
import { publishedEventFamilies } from "@vecells/event-contracts";
import { publishedSurfaceContractFamilies } from "@vecells/api-contracts";
import { observabilitySignalFamilies } from "@vecells/observability";

describe("public package surface", () => {
  it("boots through documented public contracts", () => {
    expect(packageContract.packageName).toBe("@vecells/release-controls");
    expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
    expect(Array.isArray(ownedObjectFamilies)).toBe(true);
    expect(Array.isArray(ownedContractFamilies)).toBe(true);
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
    expect(Array.isArray(publishedEventFamilies)).toBe(true);
    expect(Array.isArray(publishedSurfaceContractFamilies)).toBe(true);
    expect(Array.isArray(observabilitySignalFamilies)).toBe(true);
    expect(isLiveReleaseTrustVerdict({ surfaceAuthorityState: "live" })).toBe(true);
    expect(
      releaseTrustAllowsCalmTruth({
        surfaceAuthorityState: "live",
        calmTruthState: "allowed",
      }),
    ).toBe(true);
    expect(
      releaseTrustAllowsMutation({
        surfaceAuthorityState: "live",
        mutationAuthorityState: "enabled",
      }),
    ).toBe(true);
  });

  it("runs the build provenance simulation harness", () => {
    const harness = createBuildProvenanceSimulationHarness();
    expect(harness.verification.verified).toBe(true);
    expect(harness.publishDecision.decisionState).toBe("approved");
  });

  it("runs the runtime publication simulation harness", () => {
    const harness = createRuntimePublicationSimulationHarness();
    expect(harness.bundle.publicationState).toBe("published");
    expect(harness.parityRecord.parityState).toBe("exact");
    expect(harness.verdict.publishable).toBe(true);
  });

  it("runs the browser runtime simulation harness", () => {
    const harness = createBrowserRuntimeSimulationHarness();
    expect(harness.catalog.taskId).toBe("par_096");
    expect(harness.scenarios.length).toBeGreaterThan(0);
    expect(harness.telemetryEvents.length).toBe(harness.scenarios.length);
  });

  it("runs the migration and backfill simulation harness", () => {
    const harness = createMigrationBackfillSimulationHarness();
    expect(harness.plan.migrationPlanId).toBe("SMP_095_PATIENT_REQUESTS_ADDITIVE");
    expect(harness.backfillPlan.backfillPlanId).toBe("PBP_095_PATIENT_REQUESTS_DUAL_READ");
    expect(typeof harness.runner.execute).toBe("function");
  });

  it("runs the release watch pipeline simulation harness", () => {
    const harness = createReleaseWatchPipelineSimulationHarness();
    expect(harness.evaluation.watchState).toBe("satisfied");
    expect(harness.evaluation.observationWindow.observationState).toBe("satisfied");
    expect(harness.evaluation.triggerEvaluations).toHaveLength(2);
  });

  it("runs the dependency degradation simulation harness", () => {
    const harness = createDependencyDegradationSimulationHarness();
    expect(harness.catalog.taskId).toBe("par_098");
    expect(harness.decisions).toHaveLength(6);
    expect(harness.metrics.degradedEntryCount).toBeGreaterThan(0);
  });

  it("runs the runtime topology publication simulation harness", () => {
    const harness = createRuntimeTopologyPublicationSimulationHarness();
    expect(harness.catalog.taskId).toBe("par_099");
    expect(harness.verdict.publishable).toBe(true);
    expect(harness.currentGraphSnapshot.verdict.publishable).toBe(false);
  });

  it("runs the supply-chain provenance simulation harness", () => {
    const harness = createSupplyChainVerificationSimulationHarness();
    expect(harness.record.verificationState).toBe("verified");
    expect(harness.verification.verified).toBe(true);
    expect(harness.revokedRecord.runtimeConsumptionState).toBe("withdrawn");
  });

  it("runs the resilience baseline simulation harness", () => {
    const harness = createResilienceBaselineSimulationHarness();
    expect(harness.scenario.snapshot.readinessState).toBe("exact_and_ready");
    expect(harness.essentialFunctions).toHaveLength(9);
    expect(harness.snapshotValidation.valid).toBe(true);
  });

  it("runs the canary and rollback simulation harness", () => {
    const harness = createCanaryRollbackSimulationHarness();
    expect(harness.rehearsal.impactPreview.previewState).toBe("preview");
    expect(harness.rehearsal.executionReceipt.executionState).toBe("accepted");
    expect(harness.rehearsal.settlement.settlementState).toBe("accepted_pending_observation");
  });

  it("runs the projection rebuild simulation harness", () => {
    const harness = createProjectionRebuildSimulationHarness();
    expect(harness.eventStream.length).toBeGreaterThan(0);
    expect(typeof harness.worker.run).toBe("function");
  });
});
