import { describe, expect, it } from "vitest";

import {
  confirm351Dispatch,
  create351PatientStatusHarness,
  force351CaseSnapshot,
  project351PatientStatus,
  save351BounceBackRecord,
  seed351DispatchPendingCase,
} from "./351_pharmacy_patient_status.helpers.ts";

describe("351 review, urgent return, and patient-safe references", () => {
  it("keeps provider and referral summaries visible while outcome review remains open", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351DispatchPendingCase({
      harness,
      seed: "351_review",
    });
    await confirm351Dispatch({
      harness,
      dispatchAttemptId: seeded.submitted.dispatchBundle.attempt.dispatchAttemptId,
      suffix: "351_review",
    });
    await force351CaseSnapshot({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T17:00:00.000Z",
      patch: {
        status: "outcome_reconciliation_pending",
      },
    });

    const projected = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T17:01:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("reviewing_next_steps");
    expect(projected.patientStatusProjection.calmCopyAllowed).toBe(false);
    expect(projected.providerSummary.detailVisibilityState).toBe("full");
    expect(projected.referralReferenceSummary.displayMode).toBe("available");
    expect(projected.instructionPanel.reviewText).toContain("reviewing an update from the pharmacy");

    const currentStatus = await harness.patientStatusService.getPatientPharmacyStatus(
      seeded.currentCase.pharmacyCaseId,
    );
    const currentPanel = await harness.patientStatusService.getPatientInstructionPanel(
      seeded.currentCase.pharmacyCaseId,
    );
    const currentRepair = await harness.patientStatusService.getPatientContactRouteRepairEntry(
      seeded.currentCase.pharmacyCaseId,
    );
    const currentReference = await harness.patientStatusService.getPatientReferralReferenceSummary(
      seeded.currentCase.pharmacyCaseId,
    );

    expect(currentStatus?.pharmacyPatientStatusProjectionId).toBe(
      projected.patientStatusProjection.pharmacyPatientStatusProjectionId,
    );
    expect(currentPanel?.pharmacyPatientInstructionPanelId).toBe(
      projected.instructionPanel.pharmacyPatientInstructionPanelId,
    );
    expect(currentRepair?.pharmacyPatientReachabilityRepairProjectionId).toBe(
      projected.reachabilityRepairProjection.pharmacyPatientReachabilityRepairProjectionId,
    );
    expect(currentReference?.pharmacyPatientReferralReferenceSummaryId).toBe(
      projected.referralReferenceSummary.pharmacyPatientReferralReferenceSummaryId,
    );
  });

  it("switches to urgent_action when urgent return pre-empts routine pharmacy flow", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351DispatchPendingCase({
      harness,
      seed: "351_urgent",
    });
    await confirm351Dispatch({
      harness,
      dispatchAttemptId: seeded.submitted.dispatchBundle.attempt.dispatchAttemptId,
      suffix: "351_urgent",
    });
    const bounceBack = await save351BounceBackRecord({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      suffix: "351_urgent",
      bounceBackType: "urgent_gp_return",
    });
    await force351CaseSnapshot({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T17:10:00.000Z",
      patch: {
        status: "urgent_bounce_back",
        bounceBackRef: {
          targetFamily: "PharmacyBounceBackRecord",
          refId: bounceBack.bounceBackRecordId,
          ownerTask:
            "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts",
        },
      },
    });

    const projected = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T17:11:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("urgent_action");
    expect(projected.instructionPanel.nextStepText).toContain("Do not wait for routine pharmacy contact");
    expect(projected.instructionPanel.warningText).toContain("routine progress guidance is no longer safe");
    expect(projected.instructionPanel.symptomsWorsenText).toContain("straight away");
  });
});
