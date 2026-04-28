import { describe, expect, it } from "vitest";
import {
  createAssistiveProvenancePlane,
  type AssistiveProvenanceActorContext,
  type AssistiveProvenanceActorRole,
} from "../../packages/domains/assistive_provenance/src/index.ts";
import { actor, inferenceLogCommand, promptPackageCommand } from "./414_test_helpers.ts";

const fixedClock = { now: () => "2026-04-28T00:10:00.000Z" };

function localActor(actorRole: AssistiveProvenanceActorRole): AssistiveProvenanceActorContext {
  return actor(actorRole, "phase8_feedback_eligibility_test");
}

describe("414 feedback eligibility materialization and revocation", () => {
  it("materializes eligible only from clean settled final human artifact truth", () => {
    const plane = createAssistiveProvenancePlane({ clock: fixedClock });
    const envelope = seedEnvelope(plane);

    const pending = plane.feedbackEligibility.materializeFeedbackEligibility(
      {
        assistiveFeedbackChainRef: "assistive-feedback-chain:task-001:v1",
        assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001:v1",
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        chainState: "in_review",
        workflowSettlementState: "pending",
        labelQualityState: "pending",
        counterfactualCompletenessState: "partial",
      },
      localActor("feedback_eligibility_materializer"),
    );

    expect(pending.eligibleForTraining).toBe(false);
    expect(pending.eligibilityState).toBe("pending_settlement");

    const eligible = plane.feedbackEligibility.materializeFeedbackEligibility(
      {
        assistiveFeedbackChainRef: "assistive-feedback-chain:task-001:v1",
        assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001:v1",
        overrideRecordId: "override-record:task-001:v1",
        finalHumanArtifactRef: "final-human-artifact:task-001:v1",
        authoritativeWorkflowSettlementRef: "command-settlement:task-001:settled",
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        workflowSettlementState: "settled",
        chainState: "settled_clean",
        labelQualityState: "routine_clean",
        counterfactualCompletenessState: "complete",
      },
      localActor("feedback_eligibility_materializer"),
    );

    expect(eligible.eligibleForTraining).toBe(true);
    expect(eligible.eligibilityState).toBe("eligible");
  });

  it("revokes trainability by appending a replacement revoked flag", () => {
    const plane = createAssistiveProvenancePlane({ clock: fixedClock });
    const envelope = seedEnvelope(plane);
    const eligible = plane.feedbackEligibility.materializeFeedbackEligibility(
      {
        assistiveFeedbackChainRef: "assistive-feedback-chain:task-001:v1",
        assistiveCapabilityTrustEnvelopeRef: "assistive-capability-trust-envelope:task-001:v1",
        finalHumanArtifactRef: "final-human-artifact:task-001:v1",
        authoritativeWorkflowSettlementRef: "command-settlement:task-001:settled",
        provenanceEnvelopeRef: envelope.provenanceEnvelopeId,
        workflowSettlementState: "settled",
        chainState: "settled_clean",
        labelQualityState: "adjudicated",
        counterfactualCompletenessState: "complete",
      },
      localActor("feedback_eligibility_materializer"),
    );

    const { revocationRecord, replacementFlag } = plane.trainabilityRevocations.revokeTrainability(
      {
        previousFeedbackFlagRef: eligible.feedbackFlagId,
        revocationReason: "incident_linked",
        evidenceRef: "incident-review:task-001",
        incidentLinkRef: "assistive-incident-link:task-001",
      },
      localActor("trainability_revocation_service"),
    );

    expect(plane.runtime.store.feedbackEligibilityFlags.get(eligible.feedbackFlagId)).toEqual(
      eligible,
    );
    expect(replacementFlag.eligibilityState).toBe("revoked");
    expect(replacementFlag.supersedesFeedbackFlagRef).toBe(eligible.feedbackFlagId);
    expect(revocationRecord.previousFeedbackFlagRef).toBe(eligible.feedbackFlagId);
    expect(
      plane.runtime.store.currentFeedbackFlagByChain.get(eligible.assistiveFeedbackChainRef),
    ).toBe(replacementFlag.feedbackFlagId);
  });
});

function seedEnvelope(plane: ReturnType<typeof createAssistiveProvenancePlane>) {
  const promptPackage = plane.promptPackages.registerPromptPackage(
    promptPackageCommand(),
    localActor("prompt_registry"),
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
    localActor("prompt_snapshot_store"),
  );
  const log = plane.inferenceLogs.recordInferenceLog(
    inferenceLogCommand(snapshot.promptSnapshotId),
    localActor("inference_logger"),
  );
  return plane.provenanceEnvelopes.writeProvenanceEnvelope(
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
    localActor("provenance_writer"),
  );
}
