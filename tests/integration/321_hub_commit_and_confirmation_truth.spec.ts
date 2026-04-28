import { describe, expect, it } from "vitest";

import {
  atMinute,
  beginNativeCommit,
  buildCommitAuthority,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "./321_hub_commit.helpers.ts";

describe("321 hub commit and confirmation truth", () => {
  it("creates booked-pending-ack truth only after native authoritative confirmation clears the gate", async () => {
    const harness = await setupHubCommitHarness("321_native_truth");
    const begin = await beginNativeCommit(harness);

    const result = await harness.commitService.submitNativeApiCommit(
      await buildNativeSubmitInput(harness, begin, {
        response: {
          responseClass: "authoritative_confirmed",
          receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
          adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
          providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
          supplierAppointmentRef: `supplier_${begin.commitAttempt.commitAttemptId}`,
          sourceFamilies: [
            "same_commit_read_after_write",
            "durable_provider_reference",
          ],
          hardMatchRefsPassed: [
            "selected_candidate",
            "capacity_unit",
            "provider_binding",
          ],
        },
      }),
    );

    expect(result.confirmationGate?.state).toBe("confirmed");
    expect(result.settlement.result).toBe("booked_pending_ack");
    expect(result.truthProjection.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );
    expect(result.truthProjection.practiceVisibilityState).toBe("ack_pending");
    expect(result.hubTransition?.hubCase.status).toBe("booked_pending_practice_ack");
    expect(result.appointment?.appointmentState).toBe("confirmed_pending_practice_ack");
    expect(result.mirrorState?.driftState).toBe("aligned");
    expect(result.continuityProjection?.validationState).toBe("trusted");
  });

  it("auto-begins imported confirmation flow and only books after hard matches clear the canonical gate", async () => {
    const harness = await setupHubCommitHarness("321_import_truth");
    const currentTruth = (
      await harness.offerRepositories.getTruthProjectionForCase(
        harness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
      )
    )!.toSnapshot();

    const result = await harness.commitService.ingestImportedConfirmation({
      hubCoordinationCaseId: harness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
      actorRef: "import_actor_321",
      routeIntentBindingRef: "route_321_import",
      commandActionRecordRef: "action_321_import",
      commandSettlementRecordRef: "settlement_321_import",
      recordedAt: atMinute(16),
      idempotencyKey: "import_321_truth",
      providerAdapterBinding: harness.providerAdapterBinding,
      presentedTruthTupleHash: currentTruth.truthTupleHash,
      selectedCandidateRef: harness.selectedCandidate.candidateId,
      selectedOfferSessionRef: harness.accepted.session.alternativeOfferSessionId,
      sourceRefs: ["tests/integration/321_hub_commit_and_confirmation_truth.spec.ts"],
      authority: await buildCommitAuthority(harness, "mark_confirmation_pending", 16),
      importedEvidence: {
        importedEvidenceRef: "imported_evidence_321_truth",
        sourceVersion: harness.providerAdapterBinding.sourceVersion,
        supplierBookingReference: "imported_booking_321_truth",
        supplierAppointmentRef: "supplier_appt_321_truth",
        supplierCorrelationKey: "supplier_corr_321_truth",
        matchedWindowMinutes: 15,
        evidenceSourceFamilies: [
          "imported_supplier_message",
          "supplier_webhook",
        ],
      },
    });

    expect(result.confirmationGate?.state).toBe("confirmed");
    expect(result.settlement.result).toBe("booked_pending_ack");
    expect(result.truthProjection.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );
    expect(result.appointment?.externalConfirmationState).toBe("confirmed");
    expect(result.appointment?.sourceBookingReference).toBe("imported_booking_321_truth");
    expect(result.hubTransition?.hubCase.status).toBe("booked_pending_practice_ack");
  });
});
