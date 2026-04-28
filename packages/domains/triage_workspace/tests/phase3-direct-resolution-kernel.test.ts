import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3DirectResolutionKernelService,
  createPhase3DirectResolutionKernelStore,
  type CommitDirectResolutionSettlementInput,
} from "../src/index.ts";

function createHarness(seed: string) {
  const repositories = createPhase3DirectResolutionKernelStore();
  const service = createPhase3DirectResolutionKernelService(repositories, {
    idGenerator: createDeterministicBackboneIdGenerator(`phase3_direct_resolution_${seed}`),
  });

  return { repositories, service };
}

function createCommitInput(
  seed: string,
  overrides: Partial<CommitDirectResolutionSettlementInput> = {},
): CommitDirectResolutionSettlementInput {
  const base: CommitDirectResolutionSettlementInput = {
    settlement: {
      settlementId: `settlement_${seed}`,
      taskId: `task_${seed}`,
      requestId: `request_${seed}`,
      requestLineageRef: `lineage_${seed}`,
      decisionEpochRef: `epoch_${seed}`,
      decisionId: `decision_${seed}`,
      endpointCode: "clinician_callback",
      settlementClass: "direct_resolution",
      triageTaskStatus: "resolved_without_appointment",
      callbackSeedRef: `callback_seed_${seed}`,
      clinicianMessageSeedRef: null,
      selfCareStarterRef: null,
      adminResolutionStarterRef: null,
      bookingIntentRef: null,
      pharmacyIntentRef: null,
      lineageCaseLinkRef: `lineage_case_link_${seed}`,
      presentationArtifactRef: `presentation_${seed}`,
      patientStatusProjectionRef: `projection_${seed}`,
      lifecycleHookEffectRef: `outbox_lifecycle_${seed}`,
      closureEvaluationEffectRef: null,
      settlementState: "settled",
      commandActionRecordRef: `command_action_${seed}`,
      commandSettlementRecordRef: `command_settlement_${seed}`,
      routeIntentBindingRef: `route_intent_${seed}`,
      decisionSupersessionRecordRef: null,
      recordedAt: "2026-04-16T10:00:00.000Z",
    },
    callbackSeed: {
      callbackSeedId: `callback_seed_${seed}`,
      taskId: `task_${seed}`,
      requestId: `request_${seed}`,
      requestLineageRef: `lineage_${seed}`,
      episodeRef: `episode_${seed}`,
      decisionEpochRef: `epoch_${seed}`,
      decisionId: `decision_${seed}`,
      lineageCaseLinkRef: `lineage_case_link_${seed}`,
      lifecycleLeaseRef: `lease_${seed}`,
      leaseAuthorityRef: "lease_authority_callback_seed",
      leaseTtlSeconds: 1800,
      ownershipEpoch: 2,
      fencingToken: `fence_${seed}`,
      currentLineageFenceEpoch: 3,
      callbackWindowRef: "after_18_00",
      callbackReasonSummary: "Direct callback selected.",
      commandActionRecordRef: `command_action_${seed}`,
      commandSettlementRecordRef: `command_settlement_${seed}`,
      seedState: "live",
      decisionSupersessionRecordRef: null,
      createdAt: "2026-04-16T10:00:00.000Z",
      updatedAt: "2026-04-16T10:00:00.000Z",
    },
    clinicianMessageSeed: null,
    selfCareStarter: null,
    adminResolutionStarter: null,
    bookingIntent: null,
    pharmacyIntent: null,
    presentationArtifact: {
      presentationArtifactId: `presentation_${seed}`,
      taskId: `task_${seed}`,
      requestId: `request_${seed}`,
      decisionEpochRef: `epoch_${seed}`,
      endpointDecisionRef: `decision_${seed}`,
      artifactType: "clinician_callback_confirmation",
      artifactPresentationContractRef: "artifact_presentation_contract_triage_outcome_v1",
      outboundNavigationGrantPolicyRef: "outbound_navigation_grant_policy_triage_outcome_v1",
      audienceSurfaceRuntimeBindingRef: "audience_surface_runtime_binding_staff_workspace_v1",
      surfaceRouteContractRef: "surface_route_contract_triage_workspace_v1",
      surfacePublicationRef: "surface_publication_triage_workspace_v1",
      runtimePublicationBundleRef: "runtime_publication_bundle_triage_workspace_v1",
      visibilityTier: "summary_first",
      summarySafetyTier: "patient_safe",
      placeholderContractRef: "placeholder_contract_triage_outcome_v1",
      artifactState: "summary_only",
      headline: "Callback queued",
      summaryLines: [
        "A callback case seed was created from the current triage decision.",
        "The callback domain now owns the next live contact step.",
      ],
      patientFacingSummary: "A callback has been queued.",
      provenanceRefs: [`decision_${seed}`, `epoch_${seed}`],
      commandActionRecordRef: `command_action_${seed}`,
      commandSettlementRecordRef: `command_settlement_${seed}`,
      decisionSupersessionRecordRef: null,
      createdAt: "2026-04-16T10:00:00.000Z",
      updatedAt: "2026-04-16T10:00:00.000Z",
    },
    patientStatusProjection: {
      projectionUpdateId: `projection_${seed}`,
      taskId: `task_${seed}`,
      requestId: `request_${seed}`,
      requestLineageRef: `lineage_${seed}`,
      decisionEpochRef: `epoch_${seed}`,
      decisionId: `decision_${seed}`,
      endpointCode: "clinician_callback",
      statusCode: "callback_created",
      headline: "Callback queued",
      summaryLines: ["The care team queued a callback."],
      patientFacingSummary: "The care team queued a callback.",
      visibilityState: "live",
      sourceSettlementRef: `settlement_${seed}`,
      decisionSupersessionRecordRef: null,
      createdAt: "2026-04-16T10:00:00.000Z",
      updatedAt: "2026-04-16T10:00:00.000Z",
    },
    outboxEntries: [
      {
        outboxEntryId: `outbox_status_${seed}`,
        taskId: `task_${seed}`,
        requestId: `request_${seed}`,
        requestLineageRef: `lineage_${seed}`,
        settlementRef: `settlement_${seed}`,
        decisionEpochRef: `epoch_${seed}`,
        effectType: "patient_status_projection",
        effectKey: `task_${seed}::patient_status_projection::projection_${seed}`,
        targetRef: `projection_${seed}`,
        dispatchState: "pending",
        reasonRef: null,
        createdAt: "2026-04-16T10:00:00.000Z",
        dispatchedAt: null,
        cancelledAt: null,
      },
      {
        outboxEntryId: `outbox_consequence_${seed}`,
        taskId: `task_${seed}`,
        requestId: `request_${seed}`,
        requestLineageRef: `lineage_${seed}`,
        settlementRef: `settlement_${seed}`,
        decisionEpochRef: `epoch_${seed}`,
        effectType: "consequence_publication",
        effectKey: `task_${seed}::consequence_publication::callback_seed_${seed}`,
        targetRef: `callback_seed_${seed}`,
        dispatchState: "pending",
        reasonRef: null,
        createdAt: "2026-04-16T10:00:00.000Z",
        dispatchedAt: null,
        cancelledAt: null,
      },
      {
        outboxEntryId: `outbox_artifact_${seed}`,
        taskId: `task_${seed}`,
        requestId: `request_${seed}`,
        requestLineageRef: `lineage_${seed}`,
        settlementRef: `settlement_${seed}`,
        decisionEpochRef: `epoch_${seed}`,
        effectType: "presentation_artifact_publication",
        effectKey: `task_${seed}::presentation_artifact_publication::presentation_${seed}`,
        targetRef: `presentation_${seed}`,
        dispatchState: "pending",
        reasonRef: null,
        createdAt: "2026-04-16T10:00:00.000Z",
        dispatchedAt: null,
        cancelledAt: null,
      },
      {
        outboxEntryId: `outbox_lifecycle_${seed}`,
        taskId: `task_${seed}`,
        requestId: `request_${seed}`,
        requestLineageRef: `lineage_${seed}`,
        settlementRef: `settlement_${seed}`,
        decisionEpochRef: `epoch_${seed}`,
        effectType: "lifecycle_outcome_recorded",
        effectKey: `task_${seed}::lifecycle_outcome_recorded::settlement_${seed}`,
        targetRef: `settlement_${seed}`,
        dispatchState: "pending",
        reasonRef: null,
        createdAt: "2026-04-16T10:00:00.000Z",
        dispatchedAt: null,
        cancelledAt: null,
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    settlement: { ...base.settlement, ...(overrides.settlement ?? {}) },
    callbackSeed:
      overrides.callbackSeed === undefined
        ? base.callbackSeed
        : overrides.callbackSeed,
    clinicianMessageSeed:
      overrides.clinicianMessageSeed === undefined
        ? base.clinicianMessageSeed
        : overrides.clinicianMessageSeed,
    selfCareStarter:
      overrides.selfCareStarter === undefined
        ? base.selfCareStarter
        : overrides.selfCareStarter,
    adminResolutionStarter:
      overrides.adminResolutionStarter === undefined
        ? base.adminResolutionStarter
        : overrides.adminResolutionStarter,
    bookingIntent:
      overrides.bookingIntent === undefined ? base.bookingIntent : overrides.bookingIntent,
    pharmacyIntent:
      overrides.pharmacyIntent === undefined ? base.pharmacyIntent : overrides.pharmacyIntent,
    presentationArtifact: {
      ...base.presentationArtifact,
      ...(overrides.presentationArtifact ?? {}),
    },
    patientStatusProjection: {
      ...base.patientStatusProjection,
      ...(overrides.patientStatusProjection ?? {}),
    },
    outboxEntries: overrides.outboxEntries ?? base.outboxEntries,
  };
}

describe("phase 3 direct-resolution kernel", () => {
  it("keeps one authoritative settlement and deduplicates replay by task plus DecisionEpoch", async () => {
    const { service } = createHarness("replay");
    const input = createCommitInput("replay");

    const first = await service.commitDirectResolutionSettlement(input);
    const replay = await service.commitDirectResolutionSettlement(input);

    expect(first.settlement?.settlementId).toBe("settlement_replay");
    expect(replay.settlement?.settlementId).toBe("settlement_replay");
    expect(replay.callbackSeed?.callbackSeedId).toBe("callback_seed_replay");
    expect(replay.outboxEntries).toHaveLength(4);
    expect(replay.outboxEntries.every((entry) => entry.dispatchState === "pending")).toBe(true);
  });

  it("degrades stale consequence state to recovery_only and emits one recovery-required projection", async () => {
    const { service } = createHarness("supersession");
    await service.commitDirectResolutionSettlement(
      createCommitInput("supersession", {
        settlement: {
          endpointCode: "clinician_message",
          clinicianMessageSeedRef: "message_seed_supersession",
          callbackSeedRef: null,
        },
        callbackSeed: null,
        clinicianMessageSeed: {
          clinicianMessageSeedId: "message_seed_supersession",
          taskId: "task_supersession",
          requestId: "request_supersession",
          requestLineageRef: "lineage_supersession",
          episodeRef: "episode_supersession",
          decisionEpochRef: "epoch_supersession",
          decisionId: "decision_supersession",
          lineageCaseLinkRef: "lineage_case_link_supersession",
          lifecycleLeaseRef: "lease_supersession",
          leaseAuthorityRef: "lease_authority_clinician_message_seed",
          leaseTtlSeconds: 1800,
          ownershipEpoch: 2,
          fencingToken: "fence_supersession",
          currentLineageFenceEpoch: 3,
          messageSubject: "Follow-up",
          messageBody: "Please confirm the current symptom pattern.",
          commandActionRecordRef: "command_action_supersession",
          commandSettlementRecordRef: "command_settlement_supersession",
          seedState: "live",
          decisionSupersessionRecordRef: null,
          createdAt: "2026-04-16T10:00:00.000Z",
          updatedAt: "2026-04-16T10:00:00.000Z",
        },
        presentationArtifact: {
          artifactType: "clinician_message_preview",
        },
        patientStatusProjection: {
          endpointCode: "clinician_message",
          statusCode: "clinician_message_created",
        },
        outboxEntries: createCommitInput("supersession").outboxEntries.map((entry) =>
          entry.effectType === "consequence_publication"
            ? {
                ...entry,
                effectKey:
                  "task_supersession::consequence_publication::message_seed_supersession",
                targetRef: "message_seed_supersession",
              }
            : entry,
        ),
      }),
    );

    const reconciled = await service.reconcileSupersededConsequences({
      taskId: "task_supersession",
      priorDecisionEpochRef: "epoch_supersession",
      decisionSupersessionRecordRef: "supersession_record_001",
      reconciledAt: "2026-04-16T10:05:00.000Z",
    });

    expect(reconciled.settlement?.settlementState).toBe("recovery_only");
    expect(reconciled.clinicianMessageSeed?.seedState).toBe("recovery_only");
    expect(reconciled.presentationArtifact?.artifactState).toBe("recovery_only");
    expect(reconciled.patientStatusProjection?.statusCode).toBe("recovery_required");
    expect(reconciled.outboxEntries.some((entry) => entry.dispatchState === "cancelled")).toBe(true);
    expect(
      reconciled.outboxEntries.filter((entry) => entry.effectType === "patient_status_projection"),
    ).toHaveLength(2);
  });

  it("drains pending outbox effects exactly once and records the dispatch witness", async () => {
    const { service } = createHarness("drain");
    await service.commitDirectResolutionSettlement(createCommitInput("drain"));

    const drained = await service.drainOutboxWorker({
      evaluatedAt: "2026-04-16T10:10:00.000Z",
    });
    const replay = await service.drainOutboxWorker({
      evaluatedAt: "2026-04-16T10:11:00.000Z",
    });

    expect(drained.dispatched).toHaveLength(4);
    expect(drained.outboxEntries.every((entry) => entry.dispatchState === "dispatched")).toBe(
      true,
    );
    expect(replay.dispatched).toHaveLength(0);
  });
});
