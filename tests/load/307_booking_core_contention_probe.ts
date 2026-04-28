import { performance } from "node:perf_hooks";

import { setupBookingCoreFlow } from "../integration/307_booking_core.helpers.ts";

export interface BookingCoreContentionProbeResult {
  readonly status: "passed" | "failed";
  readonly concurrency: number;
  readonly uniqueTransactionCount: number;
  readonly replayedCount: number;
  readonly durationMs: number;
  readonly transactionIds: readonly string[];
}

export async function runContentionProbe(): Promise<BookingCoreContentionProbeResult> {
  const flow = await setupBookingCoreFlow({
    seed: "307_contention_probe",
    forceExclusiveHold: true,
  });
  const baseInput = {
    bookingCaseId: `booking_case_${flow.seed}`,
    offerSessionId: flow.offerSession!.offerSessionId,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    occurredAt: "2026-04-22T12:25:00.000Z",
    dispatchOutcome: {
      kind: "confirmation_pending" as const,
      blockerReasonCode: "awaiting_supplier_commit",
      recoveryMode: "awaiting_external_confirmation",
      externalConfirmationGateRef: null,
      providerReference: `provider_reference_${flow.seed}`,
    },
    expectedSelectionProofHash: flow.offerSession!.selectionProofHash,
    expectedRequestLifecycleLeaseRef: `request_lease_${flow.seed}`,
    expectedOwnershipEpochRef: 4,
    expectedSourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
    expectedRuntimePublicationBundleRef: `runtime_publication_${flow.seed}`,
    expectedSurfacePublicationRef: `surface_publication_${flow.seed}`,
    reviewActionLeaseRef: `review_action_lease_${flow.seed}`,
  };

  const first = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
    ...baseInput,
    idempotencyKey: `idempotency_key_${flow.seed}_0`,
    commandActionRecordRef: `begin_commit_action_${flow.seed}_0`,
    commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}_0`,
    payloadArtifactRef: `artifact://booking/commit/${flow.seed}/0`,
    edgeCorrelationId: `edge_commit_${flow.seed}_0`,
  });

  const concurrency = 8;
  const startedAt = performance.now();
  const replays = await Promise.all(
    Array.from({ length: concurrency }, (_, index) =>
      flow.bookingCommitApplication.beginCommitFromSelectedOffer({
        ...baseInput,
        idempotencyKey: `idempotency_key_${flow.seed}_${index + 1}`,
        commandActionRecordRef: `begin_commit_action_${flow.seed}_${index + 1}`,
        commandSettlementRecordRef:
          `begin_commit_settlement_${flow.seed}_${index + 1}`,
        payloadArtifactRef: `artifact://booking/commit/${flow.seed}/${index + 1}`,
        edgeCorrelationId: `edge_commit_${flow.seed}_${index + 1}`,
      }),
    ),
  );
  const durationMs = performance.now() - startedAt;

  const transactionIds = [
    ...new Set([first, ...replays].map((entry) => entry.transaction.bookingTransactionId)),
  ];
  return {
    status:
      transactionIds.length === 1 &&
      replays.every((entry) => entry.replayed) &&
      first.transaction.authoritativeOutcomeState === "confirmation_pending"
        ? "passed"
        : "failed",
    concurrency: concurrency + 1,
    uniqueTransactionCount: transactionIds.length,
    replayedCount: replays.filter((entry) => entry.replayed).length,
    durationMs,
    transactionIds,
  };
}

if (process.argv.includes("--run")) {
  runContentionProbe()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (result.status !== "passed") {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
