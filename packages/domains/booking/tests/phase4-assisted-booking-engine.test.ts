import { describe, expect, it } from "vitest";
import {
  createPhase4AssistedBookingService,
  createPhase4AssistedBookingStore,
  type CreateOrRefreshAssistedBookingSessionInput,
  type UpsertBookingExceptionQueueEntryInput,
} from "../src/phase4-assisted-booking-engine.ts";

function buildSessionInput(
  seed = "291",
  overrides: Partial<CreateOrRefreshAssistedBookingSessionInput> = {},
): CreateOrRefreshAssistedBookingSessionInput {
  return {
    bookingCaseId: `booking_case_${seed}`,
    taskRef: `task_${seed}`,
    workspaceRef: `workspace_${seed}`,
    staffUserRef: `staff_user_${seed}`,
    mode: "summary",
    sessionState: "active",
    startedAt: "2026-04-19T08:00:00.000Z",
    lastActivityAt: "2026-04-19T08:00:00.000Z",
    currentSnapshotRef: `snapshot_${seed}`,
    capabilityResolutionRef: `capability_resolution_${seed}`,
    capabilityProjectionRef: `capability_projection_${seed}`,
    providerAdapterBindingRef: `provider_binding_${seed}`,
    providerAdapterBindingHash: `provider_binding_hash_${seed}`,
    adapterContractProfileRef: `adapter_contract_profile_${seed}`,
    capabilityTupleHash: `capability_tuple_${seed}`,
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_trust_${seed}`,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
    focusProtectionLeaseRef: `focus_protection_lease_${seed}`,
    protectedCompositionStateRef: `protected_composition_${seed}`,
    surfaceRouteContractRef: `surface_route_${seed}`,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    taskCompletionSettlementEnvelopeRef: `task_completion_envelope_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    requestOwnershipEpochRef: 4,
    blockedReasonRefs: [],
    ...overrides,
  };
}

function buildQueueInput(
  seed = "291",
  overrides: Partial<UpsertBookingExceptionQueueEntryInput> = {},
): UpsertBookingExceptionQueueEntryInput {
  return {
    bookingCaseRef: `booking_case_${seed}`,
    taskRef: `task_${seed}`,
    assistedBookingSessionRef: `assisted_booking_session_${seed}`,
    exceptionFamily: "slot_revalidation_failure",
    severity: "blocking",
    selectedAnchorRef: `selected_anchor_${seed}`,
    currentSnapshotRef: `snapshot_${seed}`,
    providerAdapterBindingRef: `provider_binding_${seed}`,
    providerAdapterBindingHash: `provider_binding_hash_${seed}`,
    capabilityResolutionRef: `capability_resolution_${seed}`,
    capabilityTupleHash: `capability_tuple_${seed}`,
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_trust_${seed}`,
    reviewActionLeaseRef: `review_action_lease_${seed}`,
    surfaceRouteContractRef: `surface_route_${seed}`,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    taskCompletionSettlementEnvelopeRef: `task_completion_envelope_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    requestOwnershipEpochRef: 4,
    staleOwnerRecoveryRef: null,
    reasonCodes: [`reason_${seed}`],
    evidenceRefs: [`evidence_${seed}`],
    observedAt: "2026-04-19T08:05:00.000Z",
    sameShellRecoveryRouteRef: `/workspace/bookings/booking_case_${seed}`,
    ...overrides,
  };
}

describe("phase4 assisted booking engine", () => {
  it("keeps one durable assisted session per booking case and preserves focus-protection compatibility on refresh", async () => {
    const service = createPhase4AssistedBookingService({
      repositories: createPhase4AssistedBookingStore(),
    });

    const started = await service.createOrRefreshAssistedBookingSession(
      buildSessionInput("291_session"),
    );

    expect(started.session.assistedBookingSessionId).toContain("assisted_booking_session_");
    expect(started.session.focusProtectionLeaseRef).toBe("focus_protection_lease_291_session");
    expect(started.session.workProtectionLeaseRef).toBe("focus_protection_lease_291_session");
    expect(started.emittedEvents.map((event) => event.eventType)).toEqual([
      "booking.assisted_session.started",
    ]);

    const refreshed = await service.recordAssistedBookingSessionState({
      assistedBookingSessionId: started.session.assistedBookingSessionId,
      mode: "slot_compare",
      sessionState: "stale_recoverable",
      lastActivityAt: "2026-04-19T08:10:00.000Z",
      currentOfferSessionRef: "offer_session_291_session",
      compareAnchorRefs: ["slot_b", "slot_a", "slot_a"],
      blockedReasonRefs: ["publication_drift", "review_lease_mismatch"],
      focusProtectionLeaseRef: "focus_protection_lease_291_session",
    });

    expect(refreshed.session.assistedBookingSessionId).toBe(
      started.session.assistedBookingSessionId,
    );
    expect(refreshed.session.version).toBe(started.session.version + 1);
    expect(refreshed.session.mode).toBe("slot_compare");
    expect(refreshed.session.sessionState).toBe("stale_recoverable");
    expect(refreshed.session.currentOfferSessionRef).toBe("offer_session_291_session");
    expect(refreshed.session.compareAnchorRefs).toEqual(["slot_a", "slot_b"]);
    expect(refreshed.session.blockedReasonRefs).toEqual([
      "publication_drift",
      "review_lease_mismatch",
    ]);
    expect(refreshed.session.workProtectionLeaseRef).toBe("focus_protection_lease_291_session");
    expect(refreshed.emittedEvents.map((event) => event.eventType)).toEqual([
      "booking.assisted_session.refreshed",
    ]);

    const current = await service.queryCurrentAssistedBookingSession("booking_case_291_session");
    expect(current?.assistedBookingSessionId).toBe(started.session.assistedBookingSessionId);
    expect(current?.mode).toBe("slot_compare");
  });

  it("maintains one queue entry per family, preserves claim state across refresh, and resolves entries explicitly", async () => {
    const service = createPhase4AssistedBookingService({
      repositories: createPhase4AssistedBookingStore(),
    });

    const opened = await service.upsertBookingExceptionQueueEntry(
      buildQueueInput("291_queue", {
        exceptionFamily: "reminder_delivery_failure",
        severity: "warn",
      }),
    );
    expect(opened.entry.entryState).toBe("open");
    expect(opened.emittedEvents.map((event) => event.eventType)).toEqual([
      "booking.exception_queue.opened",
    ]);

    const claimed = await service.claimBookingExceptionQueueEntry({
      bookingExceptionQueueEntryId: opened.entry.bookingExceptionQueueEntryId,
      claimedByRef: "staff_user_291_queue",
      claimedAt: "2026-04-19T08:06:00.000Z",
    });
    expect(claimed.entry.entryState).toBe("claimed");
    expect(claimed.entry.claimedByRef).toBe("staff_user_291_queue");

    const refreshed = await service.upsertBookingExceptionQueueEntry(
      buildQueueInput("291_queue", {
        exceptionFamily: "reminder_delivery_failure",
        severity: "warn",
        reasonCodes: ["delivery_failed", "delivery_failed", "route_authority_stale"],
        evidenceRefs: ["delivery_receipt_291_queue"],
        observedAt: "2026-04-19T08:07:00.000Z",
      }),
    );
    expect(refreshed.entry.bookingExceptionQueueEntryId).toBe(
      opened.entry.bookingExceptionQueueEntryId,
    );
    expect(refreshed.entry.entryState).toBe("claimed");
    expect(refreshed.entry.claimedByRef).toBe("staff_user_291_queue");
    expect(refreshed.entry.reasonCodes).toEqual([
      "delivery_failed",
      "reason_291_queue",
      "route_authority_stale",
    ]);
    expect(refreshed.entry.evidenceRefs).toEqual([
      "delivery_receipt_291_queue",
      "evidence_291_queue",
    ]);

    await service.upsertBookingExceptionQueueEntry(
      buildQueueInput("291_critical", {
        exceptionFamily: "ambiguous_commit",
        severity: "critical",
        observedAt: "2026-04-19T08:08:00.000Z",
      }),
    );
    const current = await service.queryBookingExceptionQueue({
      bookingCaseRef: "booking_case_291_critical",
    });
    expect(current.map((entry) => entry.exceptionFamily)).toEqual(["ambiguous_commit"]);

    const reopened = await service.reopenBookingExceptionQueueEntry({
      bookingExceptionQueueEntryId: opened.entry.bookingExceptionQueueEntryId,
      reopenedAt: "2026-04-19T08:09:00.000Z",
      reasonCodes: ["operator_reopened"],
    });
    expect(reopened.entry.entryState).toBe("open");
    expect(reopened.entry.claimedByRef).toBeNull();
    expect(reopened.entry.reasonCodes).toContain("operator_reopened");

    const resolved = await service.resolveBookingExceptionQueueEntry({
      bookingExceptionQueueEntryId: opened.entry.bookingExceptionQueueEntryId,
      resolvedAt: "2026-04-19T08:10:00.000Z",
      reasonCodes: ["condition_cleared"],
    });
    expect(resolved.entry.entryState).toBe("resolved");
    expect(resolved.entry.resolvedAt).toBe("2026-04-19T08:10:00.000Z");

    const remaining = await service.queryBookingExceptionQueue({
      bookingCaseRef: "booking_case_291_queue",
      entryStates: ["open", "claimed"],
    });
    expect(remaining).toEqual([]);
  });
});
