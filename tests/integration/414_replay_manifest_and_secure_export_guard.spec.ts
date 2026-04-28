import { describe, expect, it } from "vitest";
import { createAssistiveProvenancePlane } from "../../packages/domains/assistive_provenance/src/index.ts";
import { actor, inferenceLogCommand, promptPackageCommand } from "./414_test_helpers.ts";

const fixedClock = { now: () => "2026-04-28T00:15:00.000Z" };

describe("414 replay manifest and secure export guard", () => {
  it("assembles replay manifests from immutable model, prompt, evidence, policy, and runtime refs", () => {
    const plane = createAssistiveProvenancePlane({ clock: fixedClock });
    const { envelope } = seedEnvelope(plane);

    const manifest = plane.replayManifests.assembleReplayManifest(
      {
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        replayHarnessVersionRef: "replay-harness:phase8:v1",
      },
      actor("replay_manifest_assembler", "phase8_replay_manifest_test"),
    );

    expect(manifest.manifestState).toBe("assembled");
    expect(manifest.modelVersionRef).toBe("model-version:gpt-5.4:clinical-doc:v1");
    expect(manifest.inputEvidenceSnapshotHash).toBe("evidence-snapshot-hash:v1");
    expect(manifest.protectedArtifactRefs).toEqual(
      expect.arrayContaining([
        "artifact:protected-transcript-slice:v1",
        "artifact:protected-rendered-prompt:v1",
      ]),
    );
  });

  it("blocks raw content export and restricts full replay to assurance or safety audiences", () => {
    const plane = createAssistiveProvenancePlane({ clock: fixedClock });
    const { envelope } = seedEnvelope(plane);
    const manifest = plane.replayManifests.assembleReplayManifest(
      {
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        replayHarnessVersionRef: "replay-harness:phase8:v1",
      },
      actor("replay_manifest_assembler", "phase8_replay_manifest_test"),
    );

    const blockedRaw = plane.exportGuard.guardExport(
      {
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        replayManifestRef: manifest.replayManifestId,
        exportAudience: "assurance",
        requestedLayer: "full_replay",
        artifactPresentationContractRef: "artifact-presentation:provenance-replay",
        allowRawPromptOrEvidenceContent: true,
      },
      actor("provenance_export_guard", "phase8_export_guard_test"),
    );

    expect(blockedRaw.decisionState).toBe("blocked");
    expect(blockedRaw.blockingReasonCodes).toContain("provenance_export_guard_blocks_raw_content");

    const blockedAudience = plane.exportGuard.guardExport(
      {
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        replayManifestRef: manifest.replayManifestId,
        exportAudience: "same_shell_ui",
        requestedLayer: "full_replay",
        artifactPresentationContractRef: "artifact-presentation:provenance-replay",
      },
      actor("provenance_export_guard", "phase8_export_guard_test"),
    );

    expect(blockedAudience.decisionState).toBe("blocked");
    expect(blockedAudience.blockingReasonCodes).toContain(
      "full_replay_restricted_to_assurance_or_safety",
    );

    const allowed = plane.exportGuard.guardExport(
      {
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        replayManifestRef: manifest.replayManifestId,
        exportAudience: "safety",
        requestedLayer: "full_replay",
        artifactPresentationContractRef: "artifact-presentation:provenance-replay",
      },
      actor("provenance_export_guard", "phase8_export_guard_test"),
    );

    expect(allowed.decisionState).toBe("allowed");
  });
});

function seedEnvelope(plane: ReturnType<typeof createAssistiveProvenancePlane>) {
  const promptPackage = plane.promptPackages.registerPromptPackage(
    promptPackageCommand(),
    actor("prompt_registry", "phase8_replay_manifest_test"),
  );
  const snapshot = plane.promptSnapshots.storePromptSnapshot(
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
    actor("prompt_snapshot_store", "phase8_replay_manifest_test"),
  );
  const log = plane.inferenceLogs.recordInferenceLog(
    inferenceLogCommand(snapshot.promptSnapshotId),
    actor("inference_logger", "phase8_replay_manifest_test"),
  );
  const envelope = plane.provenanceEnvelopes.writeProvenanceEnvelope(
    {
      artifactRef: "draft-note:task-001:v1",
      artifactRevisionRef: "artifact-revision:draft-note:v1",
      capabilityCode: "documentation.note_draft",
      assistiveInferenceLogRef: log.assistiveInferenceLogId,
      feedbackChainRef: "assistive-feedback-chain:task-001:v1",
      trustState: "trusted",
      continuityValidationState: "trusted",
      maskingClass: "minimum_necessary",
      disclosureClass: "replay_restricted",
    },
    actor("provenance_writer", "phase8_replay_manifest_test"),
  );
  return { envelope };
}
