import { describe, expect, it } from "vitest";

import {
  attach351IdentityFreeze,
  attach351ReachabilityBlocker,
  confirm351Dispatch,
  create351PatientStatusHarness,
  force351CaseSnapshot,
  project351PatientStatus,
  seed351DispatchPendingCase,
} from "../integration/351_pharmacy_patient_status.helpers.ts";

describe("351 patient status monotonicity", () => {
  it("never returns calm completed posture once a stronger blocker enters the truth tuple", async () => {
    const scenarios = [
      {
        label: "reachability blocker",
        apply: async (harness: ReturnType<typeof create351PatientStatusHarness>, pharmacyCaseId: string) => {
          await attach351ReachabilityBlocker({
            harness,
            pharmacyCaseId,
            dependencySuffix: "351_prop_reachability",
            purpose: "outcome_confirmation",
            withRepairJourney: false,
          });
        },
      },
      {
        label: "identity freeze",
        apply: async (harness: ReturnType<typeof create351PatientStatusHarness>, pharmacyCaseId: string) => {
          await attach351IdentityFreeze({
            harness,
            pharmacyCaseId,
            suffix: "351_prop_identity",
          });
        },
      },
      {
        label: "open outcome review",
        apply: async (harness: ReturnType<typeof create351PatientStatusHarness>, pharmacyCaseId: string) => {
          await force351CaseSnapshot({
            harness,
            pharmacyCaseId,
            recordedAt: "2026-04-23T17:30:00.000Z",
            patch: {
              status: "outcome_reconciliation_pending",
            },
          });
        },
      },
    ] as const;

    for (const scenario of scenarios) {
      const harness = create351PatientStatusHarness();
      const seeded = await seed351DispatchPendingCase({
        harness,
        seed: `351_prop_${scenario.label.replace(/\s+/g, "_")}`,
      });
      await confirm351Dispatch({
        harness,
        dispatchAttemptId: seeded.submitted.dispatchBundle.attempt.dispatchAttemptId,
        suffix: `351_prop_${scenario.label.replace(/\s+/g, "_")}`,
      });
      await force351CaseSnapshot({
        harness,
        pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
        recordedAt: "2026-04-23T17:25:00.000Z",
        patch: {
          status: "resolved_by_pharmacy",
          currentClosureBlockerRefs: [],
          activeReachabilityDependencyRefs: [],
          identityRepairBranchDispositionRef: null,
          identityRepairReleaseSettlementRef: null,
        },
      });

      const baseline = await project351PatientStatus({
        harness,
        pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
        recordedAt: "2026-04-23T17:26:00.000Z",
      });
      expect(baseline.patientStatusProjection.currentMacroState).toBe("completed");

      await scenario.apply(harness, seeded.currentCase.pharmacyCaseId);

      const projected = await project351PatientStatus({
        harness,
        pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
        recordedAt: "2026-04-23T17:35:00.000Z",
      });

      expect(projected.patientStatusProjection.currentMacroState, scenario.label).not.toBe(
        "completed",
      );
      expect(projected.patientStatusProjection.calmCopyAllowed, scenario.label).toBe(false);
      expect(projected.instructionPanel.calmCompletionText, scenario.label).toBeNull();
    }
  });
});
