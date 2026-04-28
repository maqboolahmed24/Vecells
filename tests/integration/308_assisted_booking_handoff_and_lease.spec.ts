import { describe, expect, it } from "vitest";

import {
  buildBaseGuard,
  buildSlotSearchInput,
  buildStartSessionInput,
  mutateCapabilityRow,
  queryOfferSelection,
  setupAssistedBookingFlow,
} from "./308_manage_waitlist_assisted.helpers.ts";

describe("308 assisted booking handoff and lease", () => {
  it("preserves one lineage and lease fence from handoff through pending booking truth", async () => {
    const flow = await setupAssistedBookingFlow("308_assisted_pending");

    const started = await flow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(flow.seed),
    );
    expect(started.session?.sessionState).toBe("active");
    expect(started.session?.requestLifecycleLeaseRef).toBe(`request_lease_${flow.seed}`);
    expect(started.session?.requestOwnershipEpochRef).toBe(4);
    expect(started.session?.reviewActionLeaseRef).toBe(`review_action_lease_${flow.seed}`);

    const searched = await flow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(flow.seed),
    );
    expect(searched.currentOfferSession?.offerCandidates.length).toBeGreaterThan(0);

    const { bundle, selectedCandidate, selectionProofHash } = await queryOfferSelection(flow);
    await flow.assistedBookingApplication.selectAssistedSlot({
      bookingCaseId: `booking_case_${flow.seed}`,
      staffUserRef: `staff_actor_${flow.seed}`,
      offerSessionId: bundle.offerSession.offerSessionId,
      offerCandidateId: selectedCandidate.offerCandidateId,
      selectionToken: bundle.offerSession.selectionToken,
      selectionProofHash,
      commandActionRecordRef: `assisted_select_slot_${flow.seed}`,
      commandSettlementRecordRef: `assisted_select_slot_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:10:00.000Z",
      payloadArtifactRef: `artifact://booking/offers/${flow.seed}/assist_select`,
      edgeCorrelationId: `edge_assisted_select_${flow.seed}`,
      ...buildBaseGuard(flow.seed),
    });

    const confirmed = await flow.assistedBookingApplication.confirmAssistedSlot({
      bookingCaseId: `booking_case_${flow.seed}`,
      staffUserRef: `staff_actor_${flow.seed}`,
      offerSessionId: bundle.offerSession.offerSessionId,
      commandActionRecordRef: `assisted_confirm_slot_${flow.seed}`,
      commandSettlementRecordRef: `assisted_confirm_slot_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:15:00.000Z",
      idempotencyKey: `assisted_confirm_idempotency_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
        blockerReasonCode: "external_gate_pending",
        recoveryMode: "awaiting_supplier_confirmation",
      },
      expectedSelectionProofHash: selectionProofHash,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/assist_confirm`,
      edgeCorrelationId: `edge_assisted_confirm_${flow.seed}`,
      ...buildBaseGuard(flow.seed),
    });

    expect(confirmed.currentCommit?.transaction.authoritativeOutcomeState).toBe(
      "confirmation_pending",
    );
    expect(confirmed.currentCommit?.transaction.lineageCaseLinkRef).toBe(
      confirmed.bookingCase.bookingCase.lineageCaseLinkRef,
    );
    expect(confirmed.currentCommit?.transaction.requestLifecycleLeaseRef).toBe(
      started.session?.requestLifecycleLeaseRef,
    );
    expect(confirmed.currentCommit?.transaction.requestOwnershipEpochRef).toBe(
      started.session?.requestOwnershipEpochRef,
    );
    expect(confirmed.currentCommit?.transaction.reviewActionLeaseRef).toBe(
      started.session?.reviewActionLeaseRef,
    );
    expect(confirmed.staffConfirmationAuthority.staffVisibleState).not.toBe("confirmed");
    expect(confirmed.taskCompletionGate.mayCloseTask).toBe(false);
    expect(confirmed.taskCompletionGate.mayLaunchNextTask).toBe(false);
  });

  it("fails closed on stale review lease drift and clears stale-owner posture only after reacquire", async () => {
    const flow = await setupAssistedBookingFlow("308_assisted_reacquire");
    await flow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(flow.seed),
    );
    await flow.assistedBookingApplication.startAssistedSlotSearch(buildSlotSearchInput(flow.seed));
    const { bundle, selectedCandidate, selectionProofHash } = await queryOfferSelection(flow);

    await expect(
      flow.assistedBookingApplication.selectAssistedSlot({
        bookingCaseId: `booking_case_${flow.seed}`,
        staffUserRef: `staff_actor_${flow.seed}`,
        offerSessionId: bundle.offerSession.offerSessionId,
        offerCandidateId: selectedCandidate.offerCandidateId,
        selectionToken: bundle.offerSession.selectionToken,
        selectionProofHash,
        commandActionRecordRef: `assisted_select_slot_${flow.seed}`,
        commandSettlementRecordRef: `assisted_select_slot_settlement_${flow.seed}`,
        occurredAt: "2026-04-22T12:10:00.000Z",
        ...buildBaseGuard(flow.seed, {
          reviewActionLeaseRef: `stale_review_action_lease_${flow.seed}`,
        }),
      }),
    ).rejects.toThrow(/ASSISTED_FAIL_CLOSED/);

    const failed = await flow.assistedBookingApplication.queryCurrentAssistedBookingWorkspace(
      `booking_case_${flow.seed}`,
    );
    expect(failed?.session?.sessionState).toBe("stale_recoverable");
    expect(
      failed?.exceptionQueue.some(
        (entry) => entry.exceptionFamily === "stale_owner_or_publication_drift",
      ),
    ).toBe(true);
    expect(flow.triageState.task.staleOwnerRecoveryRef).toBe(`stale_owner_recovery_${flow.seed}`);

    const reacquired = await flow.assistedBookingApplication.reacquireAssistedBookingTask({
      bookingCaseId: `booking_case_${flow.seed}`,
      taskId: `task_${flow.seed}`,
      staffUserRef: `staff_actor_${flow.seed}`,
      reacquiredAt: "2026-04-22T12:11:00.000Z",
      ownerSessionRef: `owner_session_${flow.seed}`,
      leaseTtlSeconds: 300,
    });
    expect(reacquired.session?.sessionState).toBe("active");
    expect(reacquired.session?.blockedReasonRefs).toEqual([]);
    expect(flow.triageState.task.staleOwnerRecoveryRef).toBeNull();
    expect(
      reacquired.exceptionQueue.some(
        (entry) => entry.exceptionFamily === "stale_owner_or_publication_drift",
      ),
    ).toBe(false);
  });

  it("keeps linkage blockers and publication or binding drift explicit instead of widening staff authority", async () => {
    const linkageFlow = await setupAssistedBookingFlow("308_assisted_linkage");
    await mutateCapabilityRow(
      linkageFlow.capabilityRepositories,
      (row) =>
        row.supplierRef === "vecells_local_gateway" &&
        row.integrationMode === "local_gateway_component" &&
        row.deploymentType === "practice_local_gateway",
      (row) => ({
        ...row,
        capabilities: {
          ...row.capabilities,
          requires_gp_linkage_details: true,
        },
        rowHash: `${row.rowHash}_linkage_required`,
      }),
    );

    const linkage = await linkageFlow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(linkageFlow.seed, {
        gpLinkageCheckpointRef: `gp_linkage_checkpoint_${linkageFlow.seed}`,
        gpLinkageStatus: "missing",
      }),
    );
    expect(linkage.session?.sessionState).toBe("recovery_required");
    expect(linkage.capability?.resolution.capabilityState).toBe("linkage_required");
    expect(
      linkage.exceptionQueue.some((entry) => entry.exceptionFamily === "linkage_required_blocker"),
    ).toBe(true);

    const publicationFlow = await setupAssistedBookingFlow("308_assisted_publication");
    await publicationFlow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(publicationFlow.seed),
    );
    await publicationFlow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(publicationFlow.seed),
    );
    const publicationSelection = await queryOfferSelection(publicationFlow);

    await expect(
      publicationFlow.assistedBookingApplication.selectAssistedSlot({
        bookingCaseId: `booking_case_${publicationFlow.seed}`,
        staffUserRef: `staff_actor_${publicationFlow.seed}`,
        offerSessionId: publicationSelection.bundle.offerSession.offerSessionId,
        offerCandidateId: publicationSelection.selectedCandidate.offerCandidateId,
        selectionToken: publicationSelection.bundle.offerSession.selectionToken,
        selectionProofHash: publicationSelection.selectionProofHash,
        commandActionRecordRef: `assisted_select_slot_${publicationFlow.seed}`,
        commandSettlementRecordRef: `assisted_select_slot_settlement_${publicationFlow.seed}`,
        occurredAt: "2026-04-22T12:10:00.000Z",
        ...buildBaseGuard(publicationFlow.seed, {
          runtimePublicationBundleRef: `runtime_publication_stale_${publicationFlow.seed}`,
        }),
      }),
    ).rejects.toThrow(/ASSISTED_FAIL_CLOSED/);

    const publicationFailed =
      await publicationFlow.assistedBookingApplication.queryCurrentAssistedBookingWorkspace(
        `booking_case_${publicationFlow.seed}`,
      );
    expect(
      publicationFailed?.exceptionQueue.some(
        (entry) =>
          entry.exceptionFamily === "stale_owner_or_publication_drift" &&
          entry.reasonCodes.includes("assisted_runtime_publication_drift"),
      ),
    ).toBe(true);

    const bindingFlow = await setupAssistedBookingFlow("308_assisted_binding");
    await bindingFlow.assistedBookingApplication.startAssistedBookingSession(
      buildStartSessionInput(bindingFlow.seed),
    );
    await bindingFlow.assistedBookingApplication.startAssistedSlotSearch(
      buildSlotSearchInput(bindingFlow.seed),
    );
    await mutateCapabilityRow(
      bindingFlow.capabilityRepositories,
      (row) =>
        row.supplierRef === "vecells_local_gateway" &&
        row.integrationMode === "local_gateway_component" &&
        row.deploymentType === "practice_local_gateway",
      (row) => ({
        ...row,
        publishedAt: "2026-04-24T08:00:00.000Z",
        searchNormalizationContractRef: `${row.searchNormalizationContractRef}.rotated`,
        rowHash: `${row.rowHash}_rotated`,
      }),
    );

    await expect(
      bindingFlow.assistedBookingApplication.refreshAssistedCapabilityResolution({
        bookingCaseId: `booking_case_${bindingFlow.seed}`,
        staffUserRef: `staff_actor_${bindingFlow.seed}`,
        routeIntentBindingRef: `route_intent_assisted_${bindingFlow.seed}`,
        commandActionRecordRef: `refresh_assisted_capability_${bindingFlow.seed}`,
        commandSettlementRecordRef: `refresh_assisted_capability_settlement_${bindingFlow.seed}`,
        refreshedAt: "2026-04-22T12:20:00.000Z",
        ...buildBaseGuard(bindingFlow.seed),
      }),
    ).rejects.toThrow(/ASSISTED_PROVIDER_BINDING_MISMATCH/);
  });
});
