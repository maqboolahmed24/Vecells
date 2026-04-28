import { describe, expect, it } from "vitest";

import {
  confirm351Dispatch,
  create351PatientStatusHarness,
  force351CaseSnapshot,
  project351PatientStatus,
  seed351ConsentStageCase,
  seed351DispatchPendingCase,
} from "./351_pharmacy_patient_status.helpers.ts";

describe("351 pharmacy macro state and copy", () => {
  it("maps consent-renewal posture to choose_or_confirm without implying an appointment", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351ConsentStageCase({
      harness,
      seed: "351_choose",
    });

    const projected = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.pharmacyCaseId,
      recordedAt: "2026-04-23T16:20:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("choose_or_confirm");
    expect(projected.instructionPanel.headlineText).toContain("Confirm");
    expect(projected.instructionPanel.nextStepText.toLowerCase()).not.toContain("appointment");
  });

  it("keeps dispatch in action_in_progress and uses referral language instead of booked-appointment language", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351DispatchPendingCase({
      harness,
      seed: "351_progress",
    });

    const projected = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T16:25:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("action_in_progress");
    expect(projected.instructionPanel.nextStepText).toContain("not a booked appointment");
    expect(projected.providerSummary.detailVisibilityState).toBe("full");
  });

  it("only allows completed once the case is resolved and calm-completion preconditions hold", async () => {
    const harness = create351PatientStatusHarness();
    const seeded = await seed351DispatchPendingCase({
      harness,
      seed: "351_completed",
    });
    await confirm351Dispatch({
      harness,
      dispatchAttemptId: seeded.submitted.dispatchBundle.attempt.dispatchAttemptId,
      suffix: "351_completed",
    });
    await force351CaseSnapshot({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T16:35:00.000Z",
      patch: {
        status: "resolved_by_pharmacy",
        currentClosureBlockerRefs: [],
        activeReachabilityDependencyRefs: [],
      },
    });

    const projected = await project351PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T16:36:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("completed");
    expect(projected.patientStatusProjection.calmCopyAllowed).toBe(true);
    expect(projected.instructionPanel.calmCompletionText).toContain("completed referral outcome");
    expect(projected.instructionPanel.nextStepText.toLowerCase()).not.toContain("appointment");
  });
});
