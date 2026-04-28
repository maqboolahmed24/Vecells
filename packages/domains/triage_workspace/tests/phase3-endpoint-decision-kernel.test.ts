import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3EndpointDecisionKernelService,
  createPhase3EndpointDecisionKernelStore,
  type DecisionEpochFenceInput,
  type DecisionPreviewInput,
  type Phase3EndpointCode,
} from "../src/phase3-endpoint-decision-kernel.ts";

function createFence(seed: string, overrides: Partial<DecisionEpochFenceInput> = {}) {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    reviewSessionRef: `review_session_${seed}`,
    reviewVersionRef: 1,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHashRef: `anchor_tuple_${seed}`,
    governingSnapshotRef: `governing_snapshot_${seed}`,
    evidenceSnapshotRef: `evidence_snapshot_${seed}`,
    compiledPolicyBundleRef: "phase3_endpoint_policy_bundle_238.v1",
    safetyDecisionEpochRef: `request_${seed}::safety_epoch::1`,
    duplicateLineageRef: null,
    lineageFenceEpoch: 1,
    ownershipEpochRef: 1,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    surfaceRouteContractRef: `route_contract_${seed}`,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    releasePublicationParityRef: `surface_publication_${seed}::runtime_publication_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_trust_${seed}`,
    continuityEvidenceRef: `continuity_${seed}`,
    releaseRecoveryDispositionRef: `recovery_${seed}`,
    writeState: "live",
    ...overrides,
  } satisfies DecisionEpochFenceInput;
}

function createPreview(seed: string, overrides: Partial<DecisionPreviewInput> = {}) {
  return {
    requestSummaryLines: [`Request ${seed}`, "Dry cough for three days"],
    patientNarrative: ["Worse at night"],
    safetySummaryLines: ["Screen clear"],
    contactSummaryLines: ["SMS preferred"],
    duplicateSummaryLines: ["Duplicate clear"],
    identitySummaryLines: ["Matched patient"],
    priorResponseSummaryLines: ["No prior follow-up"],
    sourceArtifactRefs: [`artifact_${seed}_summary`, `artifact_${seed}_contact`],
    reviewBundleDigestRef: `review_bundle_${seed}`,
    rulesVersion: "235.review-bundle-summary.v1",
    templateVersion: "238.endpoint-preview.v1",
    ...overrides,
  } satisfies DecisionPreviewInput;
}

function createCommand(seed: string, recordedAt = "2026-04-16T12:00:00.000Z") {
  return {
    actorRef: `reviewer_${seed}`,
    routeIntentTupleHash: `route_tuple_${seed}`,
    routeIntentBindingRef: `route_binding_${seed}`,
    commandActionRecordRef: `command_action_${seed}`,
    commandSettlementRecordRef: `command_settlement_${seed}`,
    transitionEnvelopeRef: `transition_envelope_${seed}`,
    releaseRecoveryDispositionRef: `recovery_${seed}`,
    causalToken: `causal_${seed}`,
    recordedAt,
    recoveryRouteRef: `/workspace/tasks/task_${seed}/recover`,
  };
}

function createPayload(endpoint: Phase3EndpointCode, overrides: Record<string, unknown> = {}) {
  const baseByEndpoint: Record<Phase3EndpointCode, Record<string, unknown>> = {
    admin_resolution: {
      summary: "Administrative clarification only.",
    },
    self_care_and_safety_net: {
      summary: "Self-care advice is sufficient.",
      safetyNetAdvice: "Book urgent review if fever develops.",
    },
    clinician_message: {
      messageBody: "Please confirm whether the cough is productive.",
    },
    clinician_callback: {
      callbackWindow: "after_18_00",
    },
    appointment_required: {
      appointmentReason: "Chest symptoms need same-day examination.",
    },
    pharmacy_first_candidate: {
      medicationQuestion: "Potential inhaler side effect requires pharmacist review.",
    },
    duty_clinician_escalation: {
      escalationReason: "Potential deterioration during current episode.",
    },
  };
  return {
    ...baseByEndpoint[endpoint],
    ...overrides,
  };
}

describe("phase 3 endpoint decision kernel", () => {
  it("mints one live DecisionEpoch on first endpoint mutation and reuses it while the tuple stays current", async () => {
    const repositories = createPhase3EndpointDecisionKernelStore();
    const service = createPhase3EndpointDecisionKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_endpoint_kernel_reuse"),
    });

    const selected = await service.selectEndpoint({
      taskId: "task_reuse",
      requestId: "request_reuse",
      chosenEndpoint: "clinician_message",
      reasoningText: "Need a clarifying message before direct advice.",
      payload: createPayload("clinician_message"),
      fence: createFence("reuse"),
      previewInput: createPreview("reuse"),
      command: createCommand("reuse_select"),
    });
    const updated = await service.updateEndpointPayload({
      taskId: "task_reuse",
      requestId: "request_reuse",
      decisionId: selected.decision.decisionId,
      chosenEndpoint: "clinician_message",
      reasoningText: "Need a clarifying message before direct advice.",
      payload: createPayload("clinician_message", { messageBody: "Please send the cough duration and any wheeze." }),
      fence: createFence("reuse"),
      previewInput: createPreview("reuse"),
      command: createCommand("reuse_update", "2026-04-16T12:05:00.000Z"),
    });

    expect(selected.epoch.epochState).toBe("live");
    expect(selected.decision.decisionState).toBe("drafting");
    expect(updated.epoch.epochId).toBe(selected.epoch.epochId);
    expect(updated.decision.decisionVersion).toBe(selected.decision.decisionVersion + 1);
    expect(updated.binding.bindingState).toBe("live");
  });

  it("keeps preview generation deterministic and degrades stale previews to recovery_only on selected-anchor drift", async () => {
    const repositories = createPhase3EndpointDecisionKernelStore();
    const service = createPhase3EndpointDecisionKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_endpoint_kernel_preview"),
    });

    const selected = await service.selectEndpoint({
      taskId: "task_preview",
      requestId: "request_preview",
      chosenEndpoint: "self_care_and_safety_net",
      reasoningText: "No red flags and symptoms fit self-care guidance.",
      payload: createPayload("self_care_and_safety_net"),
      fence: createFence("preview"),
      previewInput: createPreview("preview"),
      command: createCommand("preview_select"),
    });
    const previewOne = await service.previewEndpointOutcome({
      taskId: "task_preview",
      requestId: "request_preview",
      decisionId: selected.decision.decisionId,
      fence: createFence("preview"),
      previewInput: createPreview("preview"),
      command: createCommand("preview_one", "2026-04-16T12:01:00.000Z"),
    });
    const previewTwo = await service.regeneratePreview({
      taskId: "task_preview",
      requestId: "request_preview",
      decisionId: selected.decision.decisionId,
      fence: createFence("preview"),
      previewInput: createPreview("preview"),
      command: createCommand("preview_two", "2026-04-16T12:02:00.000Z"),
    });

    expect(previewOne.previewArtifact?.previewDigest).toBe(previewTwo.previewArtifact?.previewDigest);
    expect(previewOne.previewArtifact?.previewArtifactId).toBe(
      previewTwo.previewArtifact?.previewArtifactId,
    );

    const invalidated = await service.invalidateStaleDecision({
      taskId: "task_preview",
      requestId: "request_preview",
      decisionId: previewTwo.decision.decisionId,
      fence: createFence("preview", {
        selectedAnchorRef: "anchor_preview_shifted",
        selectedAnchorTupleHashRef: "anchor_tuple_preview_shifted",
      }),
      previewInput: createPreview("preview"),
      command: createCommand("preview_invalidate", "2026-04-16T12:03:00.000Z"),
    });
    const previewArtifacts = await repositories.listPreviewArtifactsForTask("task_preview");
    const stalePreview = previewArtifacts.find(
      (artifact) => artifact.previewArtifactId === previewOne.previewArtifact?.previewArtifactId,
    );

    expect(invalidated.supersessionRecord?.reasonCodeRefs).toContain(
      "DECISION_238_SELECTED_ANCHOR_DRIFT",
    );
    expect(invalidated.epoch.epochId).not.toBe(previewTwo.epoch.epochId);
    expect(stalePreview?.artifactState).toBe("recovery_only");
  });

  it("marks preview_only bindings without letting publish drift pretend the path stays live", async () => {
    const service = createPhase3EndpointDecisionKernelService(
      createPhase3EndpointDecisionKernelStore(),
      {
        idGenerator: createDeterministicBackboneIdGenerator("phase3_endpoint_kernel_preview_only"),
      },
    );

    const selected = await service.selectEndpoint({
      taskId: "task_preview_only",
      requestId: "request_preview_only",
      chosenEndpoint: "admin_resolution",
      reasoningText: "This is an administrative correction only.",
      payload: createPayload("admin_resolution"),
      fence: createFence("preview_only", { writeState: "preview_only" }),
      previewInput: createPreview("preview_only"),
      command: createCommand("preview_only_select"),
    });

    expect(selected.binding.bindingState).toBe("preview_only");
    expect(selected.boundaryTuple?.endpointCode).toBe("admin_resolution");
    expect(selected.approvalAssessment.requiredApprovalMode).toBe("not_required");
  });

  it("persists approval burden as epoch-bound truth and blocks submit until approval is satisfied", async () => {
    const service = createPhase3EndpointDecisionKernelService(
      createPhase3EndpointDecisionKernelStore(),
      {
        idGenerator: createDeterministicBackboneIdGenerator("phase3_endpoint_kernel_approval"),
      },
    );

    const selected = await service.selectEndpoint({
      taskId: "task_approval",
      requestId: "request_approval",
      chosenEndpoint: "appointment_required",
      reasoningText: "Needs same-day examination.",
      payload: createPayload("appointment_required"),
      fence: createFence("approval"),
      previewInput: createPreview("approval"),
      command: createCommand("approval_select"),
    });
    const submitted = await service.submitEndpointDecision({
      taskId: "task_approval",
      requestId: "request_approval",
      decisionId: selected.decision.decisionId,
      fence: createFence("approval"),
      previewInput: createPreview("approval"),
      command: createCommand("approval_submit", "2026-04-16T12:04:00.000Z"),
    });

    expect(selected.approvalAssessment.requiredApprovalMode).toBe("required");
    expect(submitted.settlement.result).toBe("blocked_approval_gate");
    expect(submitted.decision.decisionState).toBe("awaiting_approval");
    expect(submitted.binding.bindingState).toBe("live");
  });
});
