import type {
  AssistiveProvenanceActorContext,
  AssistiveProvenanceActorRole,
  RecordInferenceLogCommand,
} from "../../packages/domains/assistive_provenance/src/index.ts";

export function actor(
  actorRole: AssistiveProvenanceActorRole,
  purposeOfUse = "phase8_provenance_test",
): AssistiveProvenanceActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse,
    routeIntentBindingRef: "route-intent:assistive-provenance",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

export function promptPackageCommand() {
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

export function inferenceLogCommand(promptSnapshotRef: string): RecordInferenceLogCommand {
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
