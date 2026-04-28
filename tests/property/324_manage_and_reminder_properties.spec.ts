import { describe, expect, it } from "vitest";

import {
  evaluateManageCapabilityLease,
  evaluateReminderPlanDisposition,
} from "../../packages/domains/hub_coordination/src/phase5-reminders-manage-visibility-engine.ts";

describe("324 reminder and manage properties", () => {
  it("never produces an ordinary scheduled reminder when authoritative confirmation is missing", () => {
    for (const assessmentState of ["clear", "at_risk", "blocked", "disputed"] as const) {
      for (const routeAuthorityState of [
        "current",
        "stale_verification",
        "stale_demographics",
        "stale_preferences",
        "disputed",
      ] as const) {
        for (const rebindState of ["not_required", "rebound", "repair_required"] as const) {
          const disposition = evaluateReminderPlanDisposition({
            authoritativeConfirmation: false,
            assessmentState,
            routeAuthorityState,
            rebindState,
            continuityValidationState: "trusted",
          });

          expect(disposition.scheduleState).not.toBe("scheduled");
          expect(disposition.authoritativeOutcomeState).not.toBe("scheduled");
          expect(disposition.suppressionReasonRefs).toContain(
            "authoritative_confirmation_missing",
          );
        }
      }
    }
  });

  it("degrades manage posture whenever any revocation blocker is present", () => {
    const scenarios = [
      { ackDebtOpen: true },
      { identityHoldState: true },
      { assessmentState: "blocked" as const },
      { routeAuthorityState: "stale_verification" as const },
      { rebindState: "repair_required" as const },
      { sessionCurrent: false },
      { subjectBindingCurrent: false },
      { publicationCurrent: false },
      { policyTupleCurrent: false },
      { supplierDriftState: "drift_detected" as const },
      { manageFreezeState: "frozen" as const },
      { channelReleaseFreezeState: "frozen" as const },
    ];

    for (const scenario of scenarios) {
      const lease = evaluateManageCapabilityLease({
        authoritativeConfirmation: true,
        continuityValidationState: "trusted",
        supplierDriftState: "aligned",
        manageFreezeState: "live",
        ackDebtOpen: false,
        identityHoldState: false,
        assessmentState: "clear",
        routeAuthorityState: "current",
        rebindState: "rebound",
        policyTupleCurrent: true,
        channelReleaseFreezeState: "released",
        sessionCurrent: true,
        subjectBindingCurrent: true,
        publicationCurrent: true,
        supportedActions: ["cancel", "reschedule", "callback_request", "details_update"],
        ...scenario,
      });

      expect(lease.capabilityState).not.toBe("live");
      expect(lease.readOnlyMode).toBe("read_only");
      expect(lease.allowedActions).toHaveLength(0);
      expect(lease.blockedReasonRefs.length).toBeGreaterThan(0);
    }
  });
});
