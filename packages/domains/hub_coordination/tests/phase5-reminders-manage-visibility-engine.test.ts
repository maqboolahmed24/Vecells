import { describe, expect, it } from "vitest";

import {
  evaluateManageCapabilityLease,
  evaluateReminderPlanDisposition,
} from "../src/phase5-reminders-manage-visibility-engine.ts";

describe("phase5 reminders, manage, and visibility engine", () => {
  it("keeps reminder plans out of ordinary scheduled posture until confirmation is authoritative", () => {
    const disposition = evaluateReminderPlanDisposition({
      authoritativeConfirmation: false,
      assessmentState: "clear",
      routeAuthorityState: "current",
      rebindState: "rebound",
      continuityValidationState: "trusted",
    });

    expect(disposition.scheduleState).toBe("draft");
    expect(disposition.authoritativeOutcomeState).toBe("recovery_required");
    expect(disposition.suppressionReasonRefs).toContain("authoritative_confirmation_missing");
  });

  it("degrades manage authority when supplier drift or acknowledgement debt is open", () => {
    const lease = evaluateManageCapabilityLease({
      authoritativeConfirmation: true,
      continuityValidationState: "trusted",
      supplierDriftState: "drift_detected",
      manageFreezeState: "live",
      ackDebtOpen: true,
      identityHoldState: false,
      assessmentState: "clear",
      routeAuthorityState: "current",
      rebindState: "rebound",
      policyTupleCurrent: true,
      channelReleaseFreezeState: "released",
      sessionCurrent: true,
      supportedActions: ["cancel", "reschedule"],
    });

    expect(lease.capabilityState).toBe("stale");
    expect(lease.readOnlyMode).toBe("read_only");
    expect(lease.allowedActions).toHaveLength(0);
    expect(lease.blockedReasonRefs).toEqual(
      expect.arrayContaining(["supplier_drift_detected", "practice_ack_debt_open"]),
    );
  });
});
