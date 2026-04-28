import { describe, expect, it } from "vitest";
import {
  createAssistiveEvaluationPlane,
  type CaptureShadowDatasetCommand,
  type EvaluationActorContext,
  type EvaluationActorRole,
} from "../../packages/domains/assistive_evaluation/src/index.ts";

const fixedClock = { now: () => "2026-04-27T11:00:00.000Z" };

function actor(actorRole: EvaluationActorRole): EvaluationActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_shadow_export_test",
    routeIntentBindingRef: "route-intent:evaluation-ops",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

function shadowCommand(overrides: Partial<CaptureShadowDatasetCommand> = {}): CaptureShadowDatasetCommand {
  return {
    requestRef: "request:frozen:shadow-001",
    taskRef: "task:frozen:shadow-001",
    requestLineageRef: "lineage:request:shadow-001",
    taskLineageRef: "lineage:task:shadow-001",
    evidenceSnapshotRefs: ["evidence-snapshot:shadow-001"],
    evidenceCaptureBundleRefs: ["evidence-capture:shadow-001"],
    evidenceDerivationPackageRefs: ["evidence-derivation:shadow-001"],
    expectedOutputsRef: "expected-output:shadow-001",
    featureSnapshotRefs: ["feature-snapshot:shadow-001"],
    promptTemplateVersionRef: "prompt-template:summary:v1",
    modelRegistryEntryRef: "model-registry:shadow:v1",
    outputSchemaVersionRef: "schema:summary:v1",
    runtimeConfigHash: "sha256:runtime-config-shadow",
    capabilityCode: "summary_note_draft",
    sensitivityTag: "nhs_internal_shadow",
    surfaceRouteContractRef: "route-contract:evaluation-workbench:v1",
    surfacePublicationRef: "surface-publication:evaluation-workbench:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    telemetryDisclosureFenceRef: "telemetry-fence:evaluation:v1",
    releaseRecoveryDispositionRef: "release-recovery:observe-only:v1",
    assistiveEvaluationSurfaceBindingRef: "eval-surface-binding:shadow:v1",
    shadowModeEvidenceRequirementRef: "shadow-requirement:summary:v1",
    completenessState: "complete",
    assistiveOutputVisibleToEndUsers: false,
    ...overrides,
  };
}

describe("406 shadow dataset capture and export", () => {
  it("captures shadow_live bundles only through invisible governed jobs", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const capture = plane.shadowCapture.captureShadowCase(shadowCommand(), actor("shadow_dataset_capture_job"));
    const bundle = plane.store.replayBundles.get(capture.replayBundleRef);

    expect(capture.captureState).toBe("captured");
    expect(capture.assistiveOutputVisibleToEndUsers).toBe(false);
    expect(bundle?.datasetPartition).toBe("shadow_live");
    expect(() =>
      plane.shadowCapture.captureShadowCase(
        shadowCommand({ assistiveOutputVisibleToEndUsers: true }),
        actor("shadow_dataset_capture_job"),
      ),
    ).toThrow(/may not expose assistive output/i);
  });

  it("generates summary-first exports and blocks raw PHI or direct storage handoff", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const capture = plane.shadowCapture.captureShadowCase(shadowCommand(), actor("shadow_dataset_capture_job"));
    const exportActor = actor("evaluation_workbench");

    const summary = plane.exports.generateExportArtifact(
      {
        replayBundleRef: capture.replayBundleRef,
        artifactPresentationContractRef: "artifact-presentation:evaluation-summary:v1",
        surfaceRouteContractRef: "route-contract:evaluation-workbench:v1",
        surfacePublicationRef: "surface-publication:evaluation-workbench:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        visibilityTier: "internal_summary",
        summarySafetyTier: "phi_safe_aggregate",
        placeholderContractRef: "placeholder:evaluation-export:v1",
        redactionTransformHash: "sha256:redaction-summary",
      },
      exportActor,
    );
    const blocked = plane.exports.generateExportArtifact(
      {
        replayBundleRef: capture.replayBundleRef,
        artifactPresentationContractRef: "artifact-presentation:evaluation-summary:v1",
        surfaceRouteContractRef: "route-contract:evaluation-workbench:v1",
        surfacePublicationRef: "surface-publication:evaluation-workbench:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        visibilityTier: "internal_summary",
        summarySafetyTier: "unsafe_raw",
        placeholderContractRef: "placeholder:evaluation-export:v1",
        redactionTransformHash: "sha256:redaction-summary",
        exportFormat: "csv_phi",
        containsRawPhi: true,
        directStorageUrl: "s3://raw-evaluation-dump/case.csv",
      },
      exportActor,
    );

    expect(summary.artifactState).toBe("summary_only");
    expect(blocked.artifactState).toBe("blocked");
    expect(blocked.blockingReasonCodes).toEqual(
      expect.arrayContaining(["raw_phi_export_forbidden", "phi_csv_export_forbidden", "direct_storage_url_forbidden"]),
    );
  });

  it("defaults evaluation surfaces to observe-only when later trust inputs are missing", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const bindingActor = actor("evaluation_data_steward");
    const observeOnly = plane.surfaceBindings.resolveBinding(
      {
        routeFamilyRef: "evaluation-workbench",
        surfaceRouteContractRef: "route-contract:evaluation-workbench:v1",
        surfacePublicationRef: "surface-publication:evaluation-workbench:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        telemetryDisclosureFenceRef: "telemetry-fence:evaluation:v1",
        releaseRecoveryDispositionRef: "release-recovery:observe-only:v1",
        trustState: "unknown",
      },
      bindingActor,
    );
    const blocked = plane.surfaceBindings.resolveBinding(
      {
        routeFamilyRef: "evaluation-workbench",
        surfaceRouteContractRef: "route-contract:evaluation-workbench:v1",
        surfacePublicationRef: "surface-publication:evaluation-workbench:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        requiredTrustRefs: ["trust:eval:v1"],
        releaseRecoveryDispositionRef: "release-recovery:observe-only:v1",
        trustState: "trusted",
      },
      bindingActor,
    );

    expect(observeOnly.bindingState).toBe("observe_only");
    expect(blocked.bindingState).toBe("blocked");
    expect(blocked.blockingReasonCodes).toContain("telemetry_disclosure_fence_missing");
  });
});
