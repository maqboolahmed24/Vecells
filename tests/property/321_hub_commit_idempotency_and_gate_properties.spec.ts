import { describe, expect, it } from "vitest";

import { phase5HubCommitModes } from "../../packages/domains/hub_coordination/src/phase5-hub-commit-engine.ts";
import {
  atMinute,
  buildBeginCommitInput,
  buildCommitAuthority,
  setupHubCommitHarness,
} from "../integration/321_hub_commit.helpers.ts";

describe("321 hub commit idempotency and gate properties", () => {
  it("keeps begin idempotency stable across every declared commit mode", async () => {
    for (const commitMode of phase5HubCommitModes) {
      const harness = await setupHubCommitHarness(`321_property_${commitMode}`);
      const beginInput = await buildBeginCommitInput(harness, commitMode);

      const first = await harness.commitService.beginCommitAttempt(beginInput);
      const replay = await harness.commitService.beginCommitAttempt({
        ...beginInput,
        recordedAt: atMinute(14),
      });

      expect(replay.commitAttempt.commitAttemptId).toBe(first.commitAttempt.commitAttemptId);
      expect(replay.commitAttempt.commitMode).toBe(commitMode);
      expect(replay.reservation.reservationId).toBe(first.reservation.reservationId);
    }
  });

  it("keeps imported confirmation gate outcomes stable across source-family order permutations", async () => {
    const permutations = [
      ["imported_supplier_message", "supplier_webhook"],
      ["supplier_webhook", "imported_supplier_message"],
    ] as const;
    const resultStates = new Set<string>();
    const gateStates = new Set<string>();

    for (const [index, evidenceSourceFamilies] of permutations.entries()) {
      const harness = await setupHubCommitHarness(`321_property_import_${index}`);
      const currentTruth = (
        await harness.offerRepositories.getTruthProjectionForCase(
          harness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
        )
      )!.toSnapshot();
      const result = await harness.commitService.ingestImportedConfirmation({
        hubCoordinationCaseId: harness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
        actorRef: `import_actor_${index}`,
        routeIntentBindingRef: `route_import_${index}`,
        commandActionRecordRef: `action_import_${index}`,
        commandSettlementRecordRef: `settlement_import_${index}`,
        recordedAt: atMinute(16 + index),
        idempotencyKey: `import_property_${index}`,
        providerAdapterBinding: harness.providerAdapterBinding,
        presentedTruthTupleHash: currentTruth.truthTupleHash,
        selectedCandidateRef: harness.selectedCandidate.candidateId,
        selectedOfferSessionRef: harness.accepted.session.alternativeOfferSessionId,
        sourceRefs: ["tests/property/321_hub_commit_idempotency_and_gate_properties.spec.ts"],
        authority: await buildCommitAuthority(harness, "mark_confirmation_pending", 16 + index),
        importedEvidence: {
          importedEvidenceRef: `imported_property_${index}`,
          sourceVersion: harness.providerAdapterBinding.sourceVersion,
          supplierBookingReference: `supplier_booking_property_${index}`,
          supplierAppointmentRef: `supplier_appointment_property_${index}`,
          supplierCorrelationKey: `supplier_corr_property_${index}`,
          matchedWindowMinutes: 15,
          evidenceSourceFamilies: [...evidenceSourceFamilies],
        },
      });
      resultStates.add(result.settlement.result);
      gateStates.add(result.confirmationGate?.state ?? "missing");
    }

    expect(resultStates.size).toBe(1);
    expect(gateStates.size).toBe(1);
    expect([...resultStates][0]).toBe("booked_pending_ack");
    expect([...gateStates][0]).toBe("confirmed");
  });
});
