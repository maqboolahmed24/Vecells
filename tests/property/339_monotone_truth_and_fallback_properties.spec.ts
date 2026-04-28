import { describe, expect, it } from "vitest";

import {
  atMinute,
  createImportedDisputedCommit,
} from "../integration/339_commit_mesh_no_slot.helpers.ts";
import {
  buildBeginCommitInput,
  buildManualCaptureInput,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "../integration/321_hub_commit.helpers.ts";
import {
  evaluateHubFallbackLeadTimeDecision,
  shouldEscalateHubFallbackLoop,
} from "../../packages/domains/hub_coordination/src/phase5-hub-fallback-engine.ts";

describe("339 monotone truth and fallback properties", () => {
  it("never widens weaker evidence classes into calm booked truth or closable state", async () => {
    const observations: Array<{
      confirmationTruthState: string;
      patientVisibilityState: string;
      closureState: string;
    }> = [];

    const pendingHarness = await setupHubCommitHarness("339_property_pending");
    const pendingBegin = await pendingHarness.commitService.beginCommitAttempt(
      await buildBeginCommitInput(pendingHarness, "native_api"),
    );
    const pending = await pendingHarness.commitService.submitNativeApiCommit(
      await buildNativeSubmitInput(pendingHarness, pendingBegin, {
        response: {
          responseClass: "accepted_pending",
          receiptCheckpointRef: `receipt_${pendingBegin.commitAttempt.commitAttemptId}`,
          adapterCorrelationKey: `corr_${pendingBegin.commitAttempt.commitAttemptId}`,
          providerBookingReference: `booking_${pendingBegin.commitAttempt.commitAttemptId}`,
          supplierAppointmentRef: `supplier_appt_${pendingBegin.commitAttempt.commitAttemptId}`,
          sourceFamilies: ["adapter_receipt"],
        },
      }),
    );
    observations.push(pending.truthProjection);

    const manualHarness = await setupHubCommitHarness("339_property_manual");
    const manualBegin = await manualHarness.commitService.beginCommitAttempt(
      await buildBeginCommitInput(manualHarness, "manual_pending_confirmation"),
    );
    const weakManual = await manualHarness.commitService.captureManualBookingEvidence(
      await buildManualCaptureInput(manualHarness, manualBegin),
    );
    observations.push(weakManual.truthProjection);

    const imported = await createImportedDisputedCommit("339_property_imported");
    observations.push(imported.disputed.truthProjection);

    for (const observation of observations) {
      expect(observation.confirmationTruthState).not.toBe("confirmed_pending_practice_ack");
      expect(observation.confirmationTruthState).not.toBe("confirmed");
      expect(observation.patientVisibilityState).not.toBe("confirmed_visible");
      expect(observation.closureState).not.toBe("closable");
    }
  });

  it("never routes callback beyond the remaining clinical window and escalates low-novelty loops at threshold", () => {
    for (let remainingClinicalWindowMinutes = 0; remainingClinicalWindowMinutes <= 40; remainingClinicalWindowMinutes += 5) {
      const decision = evaluateHubFallbackLeadTimeDecision({
        remainingClinicalWindowMinutes,
        offerLeadMinutes: remainingClinicalWindowMinutes + 20,
        callbackLeadMinutes: remainingClinicalWindowMinutes + 1,
        trustedAlternativeFrontierExists: false,
        callbackRequested: true,
        policyRequiresCallback: false,
        degradedOnlyEvidence: false,
      });
      expect(decision.decision).not.toBe("callback");
    }

    for (let bounceCount = 0; bounceCount <= 4; bounceCount += 1) {
      expect(
        shouldEscalateHubFallbackLoop({
          bounceCount,
          noveltyScore: 0.9,
        }),
      ).toBe(false);
      expect(
        shouldEscalateHubFallbackLoop({
          bounceCount,
          noveltyScore: 0.1,
        }),
      ).toBe(bounceCount >= 3);
    }
  });
});
