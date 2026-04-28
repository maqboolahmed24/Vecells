import { describe, expect, it } from "vitest";

import { setupBookingCoreFlow } from "../integration/307_booking_core.helpers.ts";

type ReconciliationStep = "callback_confirmed" | "callback_duplicate" | "authoritative_read";

function permutations<T>(input: readonly T[]): T[][] {
  if (input.length <= 1) {
    return [input.slice()];
  }
  const result: T[][] = [];
  input.forEach((value, index) => {
    const rest = [...input.slice(0, index), ...input.slice(index + 1)];
    for (const tail of permutations(rest)) {
      result.push([value, ...tail]);
    }
  });
  return result;
}

describe("307 booking core properties", () => {
  it("keeps callback ordering permutations on one authoritative appointment chain", async () => {
    const stepOrders = permutations<ReconciliationStep>([
      "callback_confirmed",
      "callback_duplicate",
      "authoritative_read",
    ]);

    for (const [index, order] of stepOrders.entries()) {
      const flow = await setupBookingCoreFlow({
        seed: `307_property_order_${index}`,
        supplierRef: "optum_emis_web",
        integrationMode: "im1_patient_api",
        deploymentType: "internet_patient_shell",
        audience: "patient",
      });
      const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
        bookingCaseId: `booking_case_${flow.seed}`,
        offerSessionId: flow.offerSession!.offerSessionId,
        actorRef: `actor_${flow.seed}`,
        subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
        commandActionRecordRef: `begin_commit_action_${flow.seed}`,
        commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
        occurredAt: "2026-04-22T12:25:00.000Z",
        idempotencyKey: `idempotency_key_${flow.seed}`,
        dispatchOutcome: {
          kind: "confirmation_pending",
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
        payloadArtifactRef: `artifact://booking/commit/${flow.seed}`,
        edgeCorrelationId: `edge_commit_${flow.seed}`,
      });

      let appointmentRecordId: string | null = null;
      for (const [stepIndex, step] of order.entries()) {
        if (step === "authoritative_read") {
          const result = await flow.reconciliationApplication.forceReconcileAttempt({
            bookingTransactionId: created.transaction.bookingTransactionId,
            actorRef: `actor_${flow.seed}`,
            subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
            commandActionRecordRef: `force_reconcile_action_${flow.seed}_${stepIndex}`,
            commandSettlementRecordRef:
              `force_reconcile_settlement_${flow.seed}_${stepIndex}`,
            attemptedAt: `2026-04-22T12:27:0${stepIndex}.000Z`,
            authoritativeReadResult: {
              observedAt: `2026-04-22T12:27:0${stepIndex}.000Z`,
              outcome: "confirmed",
              providerReference: `provider_reference_${flow.seed}`,
              sourceFamily: "authoritative_read",
              hardMatchRefs: {
                selected_slot: "matched",
                patient_identity: "matched",
                appointment_window: "matched",
              },
              competingGateConfidences: [0.2],
            },
            payloadArtifactRef:
              `artifact://booking/reconciliation/${flow.seed}/read/${stepIndex}`,
            edgeCorrelationId: `edge_reconciliation_read_${flow.seed}_${stepIndex}`,
          });
          appointmentRecordId =
            result.bookingCommit.appointmentRecord?.appointmentRecordId ?? appointmentRecordId;
          continue;
        }

        const result = await flow.reconciliationApplication.assimilateBookingReceipt({
          bookingTransactionId: created.transaction.bookingTransactionId,
          actorRef: `actor_${flow.seed}`,
          subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
          commandActionRecordRef: `assimilate_receipt_action_${flow.seed}_${stepIndex}`,
          commandSettlementRecordRef:
            `assimilate_receipt_settlement_${flow.seed}_${stepIndex}`,
          observedAt: `2026-04-22T12:26:0${stepIndex}.000Z`,
          transportMessageId:
            step === "callback_duplicate"
              ? `transport_message_${flow.seed}`
              : `transport_message_${flow.seed}_${stepIndex}`,
          orderingKey: step === "callback_duplicate" ? "0002" : "0003",
          rawReceipt: {
            state: "confirmed",
            providerReference: `provider_reference_${flow.seed}`,
          },
          semanticReceipt: {
            state: "confirmed",
            providerReference: `provider_reference_${flow.seed}`,
          },
          callbackState: "confirmed",
          providerReference: `provider_reference_${flow.seed}`,
          signatureVerification: "verified",
          schemaVerified: true,
          payloadArtifactRef:
            `artifact://booking/reconciliation/${flow.seed}/receipt/${stepIndex}`,
          edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}_${stepIndex}`,
        });
        appointmentRecordId =
          result.bookingCommit.appointmentRecord?.appointmentRecordId ?? appointmentRecordId;
      }

      const current = await flow.bookingCommitApplication.queryCurrentBookingCommit({
        bookingCaseId: `booking_case_${flow.seed}`,
        requestedAt: "2026-04-22T12:30:00.000Z",
      });

      expect(current?.transaction.authoritativeOutcomeState).toBe("booked");
      expect(current?.appointmentRecord?.appointmentRecordId).toBe(appointmentRecordId);
      expect(current?.confirmationTruthProjection.confirmationTruthState).toBe("confirmed");
    }
  });
});
