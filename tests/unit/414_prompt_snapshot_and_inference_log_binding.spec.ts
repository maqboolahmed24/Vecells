import { describe, expect, it } from "vitest";
import {
  createAssistiveProvenancePlane,
  type AssistiveProvenanceActorContext,
  type AssistiveProvenanceActorRole,
  type RecordInferenceLogCommand,
} from "../../packages/domains/assistive_provenance/src/index.ts";

const fixedClock = { now: () => "2026-04-28T00:05:00.000Z" };

function actor(actorRole: AssistiveProvenanceActorRole): AssistiveProvenanceActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_provenance_test",
    routeIntentBindingRef: "route-intent:assistive-provenance",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("414 prompt snapshot and inference log binding", () => {
  it("stores immutable prompt snapshots bound to release or watch tuple lineage", () => {
    const plane = createAssistiveProvenancePlane({ clock: fixedClock });
    const promptPackage = plane.promptPackages.registerPromptPackage(
      promptPackageCommand(),
      actor("prompt_registry"),
    );

    const snapshot = plane.promptSnapshots.storePromptSnapshot(
      {
        promptSnapshotId: "prompt-snapshot:fixed",
        capabilityCode: "documentation.note_draft",
        promptPackageRef: promptPackage.promptPackageId,
        releaseCandidateRef: "assistive-release-candidate:rc1",
        maskingClass: "minimum_necessary",
        disclosureClass: "replay_restricted",
        variableSchemaRef: "prompt-variable-schema:note-draft:v1",
        variableSchemaHash: "variable-schema-hash:v1",
        protectedPromptArtifactRef: "artifact:protected-rendered-prompt:v1",
      },
      actor("prompt_snapshot_store"),
    );

    expect(snapshot.snapshotState).toBe("current");
    expect(snapshot.canonicalHash).toHaveLength(32);
    expect(() =>
      plane.promptSnapshots.storePromptSnapshot(
        {
          promptSnapshotId: "prompt-snapshot:fixed",
          capabilityCode: "documentation.note_draft",
          promptPackageRef: promptPackage.promptPackageId,
          releaseCandidateRef: "assistive-release-candidate:rc1",
          maskingClass: "minimum_necessary",
          disclosureClass: "replay_restricted",
          variableSchemaRef: "prompt-variable-schema:note-draft:v2",
          variableSchemaHash: "variable-schema-hash:v2",
        },
        actor("prompt_snapshot_store"),
      ),
    ).toThrow(/prompt_snapshot_immutable/);
  });

  it("persists inference logs from replay-critical refs and hashes only", () => {
    const plane = createAssistiveProvenancePlane({ clock: fixedClock });
    const snapshot = seedPromptSnapshot(plane);

    const log = plane.inferenceLogs.recordInferenceLog(
      inferenceLogCommand(snapshot.promptSnapshotId),
      actor("inference_logger"),
    );

    expect(log.replayabilityState).toBe("replayable");
    expect(log.modelVersionRef).toBe("model-version:gpt-5.4:clinical-doc:v1");
    expect(log.inputEvidenceSnapshotRefs).toEqual(["evidence-snapshot:task-001:v1"]);
    expect(log.protectedInputArtifactRefs).toEqual(["artifact:protected-transcript-slice:v1"]);

    expect(() =>
      plane.inferenceLogs.recordInferenceLog(
        {
          ...inferenceLogCommand(snapshot.promptSnapshotId),
          assistiveRunRef: "assistive-run:missing-runtime",
          runtimeImageRef: "",
        },
        actor("inference_logger"),
      ),
    ).toThrow(/missing_provenance_fail_closed/);
  });
});

function seedPromptSnapshot(plane: ReturnType<typeof createAssistiveProvenancePlane>) {
  const promptPackage = plane.promptPackages.registerPromptPackage(
    promptPackageCommand(),
    actor("prompt_registry"),
  );
  return plane.promptSnapshots.storePromptSnapshot(
    {
      capabilityCode: "documentation.note_draft",
      promptPackageRef: promptPackage.promptPackageId,
      releaseCandidateRef: "assistive-release-candidate:rc1",
      maskingClass: "minimum_necessary",
      disclosureClass: "replay_restricted",
      variableSchemaRef: "prompt-variable-schema:note-draft:v1",
      variableSchemaHash: "variable-schema-hash:v1",
      protectedPromptArtifactRef: "artifact:protected-rendered-prompt:v1",
    },
    actor("prompt_snapshot_store"),
  );
}

function promptPackageCommand() {
  return {
    capabilityCode: "documentation.note_draft",
    promptPackageRef: "prompt-package:note-draft:v1",
    promptBundleHash: "prompt-bundle-hash:v1",
    releaseCandidateRef: "assistive-release-candidate:rc1",
    variableSchemaRef: "prompt-variable-schema:note-draft:v1",
    variableSchemaHash: "variable-schema-hash:v1",
    maskingClass: "minimum_necessary" as const,
    disclosureClass: "replay_restricted" as const,
    storageArtifactRef: "artifact:prompt-package:v1",
  };
}

function inferenceLogCommand(promptSnapshotRef: string): RecordInferenceLogCommand {
  return {
    assistiveRunRef: "assistive-run:note-draft:v1",
    capabilityCode: "documentation.note_draft",
    modelVersionRef: "model-version:gpt-5.4:clinical-doc:v1",
    promptSnapshotRef,
    inputEvidenceSnapshotRefs: ["evidence-snapshot:task-001:v1"],
    inputEvidenceSnapshotHash: "evidence-snapshot-hash:v1",
    inputCaptureBundleRef: "capture-bundle:task-001:v1",
    inputDerivationPackageRefs: ["derivation-package:transcript:v1"],
    policyBundleRef: "compiled-policy-bundle:phase8:v1",
    outputSchemaBundleRef: "output-schema:note-draft:v1",
    calibrationBundleRef: "calibration-bundle:doc:v1",
    runtimeImageRef: "runtime-image:assistive-doc:v1",
    surfacePublicationRef: "surface-publication:staff-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    outputArtifactRefs: ["draft-note:task-001:v1"],
    assistiveRunSettlementRef: "assistive-run-settlement:renderable:v1",
    feedbackChainRef: "assistive-feedback-chain:task-001:v1",
    protectedInputArtifactRefs: ["artifact:protected-transcript-slice:v1"],
  };
}
