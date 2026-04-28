import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  createLifecycleCoordinatorService,
  createLifecycleCoordinatorStore,
  runLifecycleCoordinatorSimulation,
} from "../src/index.ts";
import { RequestAggregate, RequestLineageAggregate } from "@vecells/domain-kernel";

async function seedLifecycleScope(seed: string) {
  const repositories = createLifecycleCoordinatorStore();
  const authority = createLifecycleCoordinatorService(repositories);
  const episodeId = `episode_test_${seed}`;
  const requestId = `request_test_${seed}`;
  const requestLineageRef = `lineage_test_${seed}`;
  const episode = EpisodeAggregate.create({
    episodeId,
    episodeFingerprint: `episode_fingerprint_${seed}`,
    openedAt: "2026-04-12T22:00:00Z",
  }).attachRequestMembership({
    requestRef: requestId,
    requestLineageRef,
    updatedAt: "2026-04-12T22:00:00Z",
  });
  const lineage = RequestLineageAggregate.create({
    requestLineageId: requestLineageRef,
    episodeRef: episodeId,
    requestRef: requestId,
    continuityWitnessRef: `promotion_${seed}`,
    createdAt: "2026-04-12T22:00:00Z",
  });
  const request = RequestAggregate.create({
    requestId,
    episodeId,
    originEnvelopeRef: `envelope_${seed}`,
    promotionRecordRef: `promotion_${seed}`,
    tenantId: "tenant_vecells_demo",
    sourceChannel: "self_service_form",
    originIngressRecordRef: `ingress_${seed}`,
    normalizedSubmissionRef: `normalized_${seed}`,
    requestType: "service_request",
    requestLineageRef,
    createdAt: "2026-04-12T22:00:00Z",
  });
  await repositories.saveEpisode(episode);
  await repositories.saveRequestLineage(lineage);
  await repositories.saveRequest(request);
  const fence = await authority.initializeLifecyclePartition({
    episodeId,
    issuedAt: "2026-04-12T22:00:00Z",
  });
  return {
    repositories,
    authority,
    episodeId,
    requestId,
    requestLineageRef,
    fence,
  };
}

describe("lifecycle coordinator backbone", () => {
  it("rejects child-domain signals that attempt to write closed workflow state directly", async () => {
    const root = await seedLifecycleScope("direct_close_guard");

    await expect(
      root.authority.recordLifecycleSignal({
        episodeId: root.episodeId,
        requestId: root.requestId,
        requestLineageRef: root.requestLineageRef,
        sourceDomain: "triage",
        signalFamily: "milestone",
        signalType: "triage.illegal.closed",
        domainObjectRef: "triage_case_illegal",
        milestoneHint: "closed" as never,
        presentedLineageEpoch: root.fence.currentEpoch,
        occurredAt: "2026-04-12T22:01:00Z",
        causalTokenRef: "causal_illegal_closed",
      }),
    ).rejects.toThrow(/write Request\.workflowState = closed directly/i);
  });

  it("rejects stale lifecycle signals after the lineage fence advances", async () => {
    const root = await seedLifecycleScope("stale_signal_epoch");

    const first = await root.authority.recordLifecycleSignal({
      signalId: "signal_stale_epoch_1",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "triage",
      signalFamily: "milestone",
      signalType: "triage.ready",
      domainObjectRef: "triage_case_stale_epoch",
      milestoneHint: "triage_ready",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_stale_epoch_1",
    });

    expect(first.currentFence.currentEpoch).toBe(root.fence.currentEpoch + 1);

    await expect(
      root.authority.recordLifecycleSignal({
        signalId: "signal_stale_epoch_2",
        episodeId: root.episodeId,
        requestId: root.requestId,
        requestLineageRef: root.requestLineageRef,
        sourceDomain: "booking",
        signalFamily: "milestone",
        signalType: "booking.confirmed",
        domainObjectRef: "booking_case_stale_epoch",
        milestoneHint: "outcome_recorded",
        terminalOutcomeRef: "outcome://booking/stale_epoch",
        presentedLineageEpoch: root.fence.currentEpoch,
        occurredAt: "2026-04-12T22:02:00Z",
        causalTokenRef: "causal_stale_epoch_2",
      }),
    ).rejects.toThrow(/presented stale lineage epoch 1; current is 2/i);
  });

  it("short-circuits exact signal replay even after the fence has moved forward", async () => {
    const root = await seedLifecycleScope("signal_replay");

    await root.authority.recordLifecycleSignal({
      signalId: "signal_replay_1",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "triage",
      signalFamily: "milestone",
      signalType: "triage.ready",
      domainObjectRef: "triage_case_replay",
      milestoneHint: "triage_ready",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_replay_1",
    });

    const replay = await root.authority.recordLifecycleSignal({
      signalId: "signal_replay_1",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "triage",
      signalFamily: "milestone",
      signalType: "triage.ready",
      domainObjectRef: "triage_case_replay",
      milestoneHint: "triage_ready",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_replay_1",
    });

    expect(replay.reusedExisting).toBe(true);
    expect(replay.currentFence.currentEpoch).toBe(2);
    expect(replay.signal.signalId).toBe("signal_replay_1");
  });

  it("closes only when blocker refs, gate refs, and terminal outcome constraints are all satisfied", async () => {
    const root = await seedLifecycleScope("legal_close");

    await root.authority.recordLifecycleSignal({
      signalId: "signal_close_ready",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "triage",
      signalFamily: "milestone",
      signalType: "triage.ready",
      domainObjectRef: "triage_case_close",
      milestoneHint: "triage_ready",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_close_ready",
    });
    const fenceAfterReady = await root.repositories.getCurrentLineageFenceForEpisode(
      root.episodeId,
    );
    expect(fenceAfterReady).toBeDefined();

    await root.authority.recordLifecycleSignal({
      signalId: "signal_close_terminal",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "booking",
      signalFamily: "terminal_outcome",
      signalType: "booking.confirmed",
      domainObjectRef: "booking_case_close",
      milestoneHint: "outcome_recorded",
      terminalOutcomeRef: "outcome://booking/confirmed/legal_close",
      presentedLineageEpoch: fenceAfterReady!.currentEpoch,
      occurredAt: "2026-04-12T22:02:00Z",
      causalTokenRef: "causal_close_terminal",
    });
    const fenceAfterOutcome = await root.repositories.getCurrentLineageFenceForEpisode(
      root.episodeId,
    );
    expect(fenceAfterOutcome).toBeDefined();

    const result = await root.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      presentedLineageEpoch: fenceAfterOutcome!.currentEpoch,
      evaluatedAt: "2026-04-12T22:03:00Z",
      consumedCausalTokenRef: "close_legal_close",
    });

    const request = await root.repositories.getRequest(root.requestId);
    expect(result.record.toSnapshot().decision).toBe("close");
    expect(result.record.toSnapshot().closedByMode).toBe("routine_terminal_outcome");
    expect(result.materializedState.currentClosureBlockerRefs).toEqual([]);
    expect(result.materializedState.currentConfirmationGateRefs).toEqual([]);
    expect(request?.workflowState).toBe("closed");
    expect(result.emittedEvents.map((event) => event.eventType)).toContain("request.closed");
  });

  it("defers close when confirmation-gate debt remains materialized", async () => {
    const root = await seedLifecycleScope("confirmation_defer");

    await root.authority.recordLifecycleSignal({
      signalId: "signal_confirmation_pending",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "booking",
      signalFamily: "confirmation",
      signalType: "booking.confirmation.pending",
      domainObjectRef: "booking_case_confirmation",
      milestoneHint: "handoff_active",
      currentConfirmationGateRefs: ["confirmation_gate_booking_001"],
      blockingConfirmationRefs: ["confirmation_gate_booking_001"],
      terminalOutcomeRef: "outcome://booking/pending_confirmation",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_confirmation_pending",
    });
    const fence = await root.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    expect(fence).toBeDefined();

    const result = await root.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      presentedLineageEpoch: fence!.currentEpoch,
      evaluatedAt: "2026-04-12T22:02:00Z",
      consumedCausalTokenRef: "close_confirmation_defer",
    });

    expect(result.record.toSnapshot().decision).toBe("defer");
    expect(result.record.toSnapshot().deferReasonCodes).toContain(
      "APPROVAL_OR_CONFIRMATION_PENDING",
    );
    expect(result.record.toSnapshot().deferReasonCodes).toContain("MATERIALIZED_BLOCKERS_PRESENT");
    expect(result.materializedState.currentConfirmationGateRefs).toEqual([
      "confirmation_gate_booking_001",
    ]);
  });

  it("reopens a closed request only through the governed reopen path", async () => {
    const root = await seedLifecycleScope("governed_reopen");

    await root.authority.recordLifecycleSignal({
      signalId: "signal_reopen_terminal",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "pharmacy",
      signalFamily: "terminal_outcome",
      signalType: "pharmacy.case.resolved",
      domainObjectRef: "pharmacy_case_reopen",
      milestoneHint: "outcome_recorded",
      terminalOutcomeRef: "outcome://pharmacy/resolved/governed_reopen",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_reopen_terminal",
    });
    const fenceAfterOutcome = await root.repositories.getCurrentLineageFenceForEpisode(
      root.episodeId,
    );
    expect(fenceAfterOutcome).toBeDefined();

    await root.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      presentedLineageEpoch: fenceAfterOutcome!.currentEpoch,
      evaluatedAt: "2026-04-12T22:02:00Z",
      consumedCausalTokenRef: "close_governed_reopen",
    });
    const fenceAfterClose = await root.repositories.getCurrentLineageFenceForEpisode(
      root.episodeId,
    );
    expect(fenceAfterClose).toBeDefined();

    const reopen = await root.authority.recordLifecycleSignal({
      signalId: "signal_governed_reopen",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "pharmacy",
      signalFamily: "reopen",
      signalType: "pharmacy.case.bounce_back",
      domainObjectRef: "pharmacy_case_reopen_bounce_back",
      reopenTriggerFamily: "pharmacy_unable_to_complete",
      reopenTargetState: "triage_active",
      uUnable: 0.8,
      presentedLineageEpoch: fenceAfterClose!.currentEpoch,
      occurredAt: "2026-04-12T22:03:00Z",
      causalTokenRef: "causal_governed_reopen",
    });

    const request = await root.repositories.getRequest(root.requestId);
    expect(reopen.reopenedRecord?.toSnapshot().reopenTriggerFamily).toBe(
      "pharmacy_unable_to_complete",
    );
    expect(reopen.emittedEvents.map((event) => event.eventType)).toContain("request.reopened");
    expect(request?.workflowState).toBe("triage_active");
  });

  it("rejects a close attempt that races with a newer blocker-opening signal", async () => {
    const root = await seedLifecycleScope("close_race");

    await root.authority.recordLifecycleSignal({
      signalId: "signal_close_race_terminal",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "booking",
      signalFamily: "terminal_outcome",
      signalType: "booking.confirmed",
      domainObjectRef: "booking_case_close_race",
      milestoneHint: "outcome_recorded",
      terminalOutcomeRef: "outcome://booking/close_race",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_close_race_terminal",
    });
    const candidateFence = await root.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    expect(candidateFence).toBeDefined();

    await root.authority.recordLifecycleSignal({
      signalId: "signal_close_race_blocker",
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageRef,
      sourceDomain: "hub",
      signalFamily: "confirmation",
      signalType: "hub.booking.confirmation_pending",
      domainObjectRef: "hub_case_close_race",
      milestoneHint: "handoff_active",
      currentConfirmationGateRefs: ["confirmation_gate_close_race_001"],
      blockingConfirmationRefs: ["confirmation_gate_close_race_001"],
      presentedLineageEpoch: candidateFence!.currentEpoch,
      occurredAt: "2026-04-12T22:01:30Z",
      causalTokenRef: "causal_close_race_blocker",
    });

    await expect(
      root.authority.evaluateRequestClosure({
        episodeId: root.episodeId,
        requestId: root.requestId,
        requestLineageRef: root.requestLineageRef,
        presentedLineageEpoch: candidateFence!.currentEpoch,
        evaluatedAt: "2026-04-12T22:02:00Z",
        consumedCausalTokenRef: "close_race_attempt",
      }),
    ).rejects.toThrow(/Close evaluation presented stale lineage epoch 2; current is 3/i);
  });

  it("produces deterministic simulation output across independent stores", async () => {
    const left = await runLifecycleCoordinatorSimulation();
    const right = await runLifecycleCoordinatorSimulation();
    const summarize = (results: Awaited<ReturnType<typeof runLifecycleCoordinatorSimulation>>) =>
      results.map((entry) => ({
        scenarioId: entry.scenarioId,
        workflowState: entry.request.workflowState,
        closureDecisions: entry.closureRecords.map((record) => record.toSnapshot().decision),
        reopenCount: entry.reopenRecords.length,
        fenceEpoch: entry.fence.currentEpoch,
      }));

    const leftSummary = summarize(left);
    expect(leftSummary).toEqual(summarize(right));
    expect(leftSummary).toHaveLength(9);
    expect(leftSummary.find((entry) => entry.scenarioId === "more_info_reopen")?.reopenCount).toBe(
      1,
    );
    expect(
      leftSummary.find((entry) => entry.scenarioId === "wrong_patient_repair_release")
        ?.workflowState,
    ).toBe("triage_active");
  });
});
