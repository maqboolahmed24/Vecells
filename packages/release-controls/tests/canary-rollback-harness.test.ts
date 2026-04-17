import { describe, expect, it } from "vitest";
import {
  CanaryRollbackHarnessCoordinator,
  createCanaryRollbackSimulationHarness,
  createWaveActionContext,
  createWaveActionImpactPreview,
  createWaveGuardrailSnapshot,
  type WaveActionContext,
} from "../src/canary-rollback-harness.ts";

function createContext(overrides: Partial<WaveActionContext> = {}): WaveActionContext {
  return createWaveActionContext({
    environmentRing: "local",
    releaseRef: "rc::foundation::local",
    actionType: "canary_start",
    requestedBy: "ops://runtime-control",
    idempotencyKey: "canary-local-001",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    targetPublicationBundleRef: "rpb::local::authoritative",
    rollbackTargetPublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
    releaseWatchTupleRef: "RWT_LOCAL_V1::local_accepted",
    waveObservationPolicyRef: "WOP_LOCAL_V1::local_accepted",
    waveControlFenceRef: "wave-control-fence::local",
    operationalReadinessSnapshotRef: "ORS_101_LOCAL_EXACT_AND_READY",
    buildProvenanceRef: "bpr::run_release_controls_local_verified",
    activeChannelFreezeRefs: [],
    recoveryDispositionRefs: ["RRD_PATIENT_HOME_READ_ONLY", "RRD_OPERATIONS_DIAGNOSTIC_ONLY"],
    rollbackRunbookBindingRefs: ["RBR_101_EF_RELEASE_GOVERNANCE"],
    rollbackReadinessEvidenceRefs: ["REP_101_EF_RELEASE_GOVERNANCE"],
    affectedTenantCount: 1,
    affectedOrganisationCount: 1,
    affectedRouteFamilyRefs: ["rf_patient_requests", "rf_operations_console"],
    affectedAudienceSurfaceRefs: ["surf_patient_home", "surf_operations_board"],
    affectedGatewaySurfaceRefs: ["gws_patient_portal", "gws_operations_board"],
    watchState: "accepted",
    observationState: "open",
    rollbackReadinessState: "ready",
    readinessState: "exact_and_ready",
    publicationState: "published",
    parityState: "exact",
    routeExposureState: "publishable",
    buildProvenanceState: "verified",
    trustState: "live",
    continuityState: "healthy",
    tupleFreshnessState: "current",
    recoveryDispositionState: "normal",
    currentTupleHash: "tuple::local::accepted",
    targetTupleHash: "tuple::local::accepted",
    blockerRefs: [],
    warningRefs: [],
    sourceRefs: ["canary-rollback-harness.test.ts"],
    now: "2026-04-13T12:00:00.000Z",
    ...overrides,
  });
}

describe("canary and rollback harness", () => {
  it("creates a wave-action impact preview bound to watch tuple, readiness snapshot, and rollback evidence", () => {
    const context = createContext();
    const guardrail = createWaveGuardrailSnapshot(context);
    const preview = createWaveActionImpactPreview({
      context,
      guardrailSnapshot: guardrail,
    });

    expect(preview.previewState).toBe("preview");
    expect(preview.waveGuardrailSnapshotRef).toBe(guardrail.waveGuardrailSnapshotId);
    expect(preview.releaseWatchTupleRef).toBe(context.releaseWatchTupleRef);
    expect(preview.operationalReadinessSnapshotRef).toBe(context.operationalReadinessSnapshotRef);
    expect(preview.rollbackReadinessEvidenceRefs).toContain("REP_101_EF_RELEASE_GOVERNANCE");
  });

  it("blocks widen when the watch tuple or readiness proof is stale", () => {
    const context = createContext({
      actionType: "widen",
      watchState: "stale",
      observationState: "open",
      readinessState: "stale_rehearsal_evidence",
    });

    const preview = createWaveActionImpactPreview({
      context,
    });

    expect(preview.previewState).toBe("blocked");
    expect(preview.blockerRefs).toContain("ACTION_REQUIRES_FRESH_READINESS");
    expect(preview.blockerRefs).toContain("ACTION_REQUIRES_SATISFIED_WATCH");
  });

  it("allows rollback only when explicit target bundle and evidence refs are present", () => {
    const blocked = createWaveActionImpactPreview({
      context: createContext({
        actionType: "rollback",
        watchState: "rollback_required",
        rollbackTargetPublicationBundleRef: null,
        rollbackRunbookBindingRefs: [],
        rollbackReadinessEvidenceRefs: [],
      }),
    });

    expect(blocked.previewState).toBe("blocked");
    expect(blocked.blockerRefs).toContain("ACTION_REQUIRES_EXPLICIT_ROLLBACK_TARGET_AND_EVIDENCE");
  });

  it("accepts rollback when guardrail failures arm the action and rollback evidence is bound", () => {
    const coordinator = new CanaryRollbackHarnessCoordinator();
    const rehearsal = coordinator.rehearse(
      createContext({
        actionType: "rollback",
        environmentRing: "integration",
        runtimePublicationBundleRef: "rpb::integration::authoritative",
        targetPublicationBundleRef: "rpb::local::authoritative",
        rollbackTargetPublicationBundleRef: "rpb::local::authoritative",
        releasePublicationParityRef: "rpp::integration::authoritative",
        releaseWatchTupleRef: "RWT_INTEGRATION_V1::stale",
        waveObservationPolicyRef: "WOP_INTEGRATION_V1::stale",
        operationalReadinessSnapshotRef: "ORS_101_INTEGRATION_BLOCKED_RESTORE_PROOF",
        buildProvenanceRef: "bpr::run_gateway_integration_quarantined_dependency",
        watchState: "rollback_required",
        observationState: "expired",
        rollbackReadinessState: "ready",
        readinessState: "blocked_restore_proof",
        publicationState: "conflict",
        parityState: "conflict",
        routeExposureState: "frozen",
        buildProvenanceState: "quarantined",
        trustState: "degraded",
        continuityState: "breached",
        tupleFreshnessState: "drifted",
        recoveryDispositionState: "recovery_only",
        currentTupleHash: "tuple::integration::rollback-breach",
        targetTupleHash: "tuple::local::rollback-safe",
      }),
    );

    expect(rehearsal.guardrailSnapshot.guardrailState).toBe("frozen");
    expect(rehearsal.impactPreview.previewState).toBe("preview");
    expect(rehearsal.executionReceipt.executionState).toBe("accepted");
    expect(rehearsal.observationWindow.observationState).toBe("rollback_required");
    expect(rehearsal.settlement.settlementState).toBe("rollback_required");
    expect(rehearsal.cockpit.cockpitState).toBe("rollback_required");
  });

  it("accepts kill-switch when severe trust or parity failure freezes the guardrail", () => {
    const coordinator = new CanaryRollbackHarnessCoordinator();
    const rehearsal = coordinator.rehearse(
      createContext({
        actionType: "kill_switch",
        environmentRing: "preprod",
        runtimePublicationBundleRef: "rpb::preprod::authoritative",
        targetPublicationBundleRef: "rpb::preprod::authoritative",
        rollbackTargetPublicationBundleRef: "rpb::local::authoritative",
        releasePublicationParityRef: "rpp::preprod::authoritative",
        releaseWatchTupleRef: "RWT_PREPROD_V1::rollback_required",
        waveObservationPolicyRef: "WOP_PREPROD_V1::rollback_required",
        operationalReadinessSnapshotRef: "ORS_101_PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
        buildProvenanceRef: "bpr::run_command_preprod_revoked",
        watchState: "rollback_required",
        observationState: "expired",
        readinessState: "assurance_or_freeze_blocked",
        publicationState: "withdrawn",
        parityState: "withdrawn",
        routeExposureState: "withdrawn",
        buildProvenanceState: "revoked",
        trustState: "quarantined",
        continuityState: "breached",
        recoveryDispositionState: "kill_switch_active",
        currentTupleHash: "tuple::preprod::kill-switch",
        targetTupleHash: "tuple::preprod::kill-switch",
      }),
    );

    expect(rehearsal.guardrailSnapshot.guardrailState).toBe("frozen");
    expect(rehearsal.executionReceipt.executionState).toBe("accepted");
    expect(rehearsal.observationWindow.observationState).toBe("observed");
    expect(rehearsal.settlement.settlementState).toBe("constrained");
  });

  it("forces rollforward to supersede the old tuple before settling satisfied", () => {
    const coordinator = new CanaryRollbackHarnessCoordinator();
    const current = createContext({
      actionType: "rollforward",
      watchState: "satisfied",
      observationState: "satisfied",
      currentTupleHash: "tuple::local::rollforward-new",
      targetTupleHash: "tuple::local::rollforward-new",
    });
    const superseded = createContext({
      actionType: "rollforward",
      idempotencyKey: "rollforward-local-old",
      watchState: "satisfied",
      observationState: "satisfied",
      tupleFreshnessState: "superseded",
      currentTupleHash: "tuple::local::rollforward-old",
      targetTupleHash: "tuple::local::rollforward-new",
    });

    const rehearsal = coordinator.rehearse(current, {
      supersededContext: superseded,
    });

    expect(rehearsal.supersededImpactPreview?.previewState).toBe("superseded");
    expect(rehearsal.settlement.settlementState).toBe("satisfied");
    expect(rehearsal.cockpit.cockpitState).toBe("satisfied");
  });

  it("deduplicates action submission by idempotency key", () => {
    const coordinator = new CanaryRollbackHarnessCoordinator();
    const context = createContext();

    const first = coordinator.rehearse(context);
    const second = coordinator.rehearse(context);

    expect(first.executionReceipt.executionState).toBe("accepted");
    expect(second.executionReceipt.executionState).toBe("deduplicated");
  });

  it("runs the canary and rollback simulation harness", () => {
    const harness = createCanaryRollbackSimulationHarness();

    expect(harness.rehearsal.impactPreview.previewState).toBe("preview");
    expect(harness.rehearsal.executionReceipt.executionState).toBe("accepted");
    expect(harness.rehearsal.settlement.settlementState).toBe("accepted_pending_observation");
    expect(harness.metrics.actionRecordCount).toBe(1);
  });
});
