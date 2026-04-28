import { describe, expect, it } from "vitest";
import { build481Records } from "../../tools/testing/run_481_dr_go_live_smoke";

describe("481 essential-function continuity contracts", () => {
  it("constrains go-live when patient smoke passes but staff queue projection lag breaches threshold", () => {
    const records = build481Records([]);
    const queueLag = records.continuityVerdicts.find(
      (evidence) => evidence.scenarioRef === "gls_481_patient_staff_queue_lag",
    );

    expect(queueLag?.patientRouteState).toBe("passed");
    expect(queueLag?.staffQueueProjectionLagSeconds).toBeGreaterThan(120);
    expect(queueLag?.continuityState).toBe("constrained");
    expect(queueLag?.fallbackActionRef).toBe("fallback:hold-wave-until-queue-projection-fresh");
  });

  it("keeps mobile embedded channel constrained outside Wave 1 scope", () => {
    const records = build481Records([]);
    const mobile = records.continuityVerdicts.find(
      (evidence) => evidence.scenarioRef === "gls_481_alert_owner_rota_and_mobile",
    );

    expect(mobile?.essentialFunctionRef).toBe("essential-function:patient-nav-embedded");
    expect(mobile?.continuityState).toBe("constrained");
    expect(mobile?.fallbackActionRef).toBe("fallback:keep-nhs-app-channel-deferred");
  });

  it("blocks rollback smoke when assistive insert controls remain visible after freeze", () => {
    const records = build481Records([]);
    const rollback = records.rollbackSmokeEvidence.find(
      (evidence) => evidence.scenarioRef === "gls_481_rollback_assistive_freeze",
    );

    expect(rollback?.freezeState).toBe("frozen");
    expect(rollback?.assistiveInsertControlsVisibleAfterFreeze).toBe(true);
    expect(rollback?.state).toBe("blocked");
    expect(rollback?.blockerRefs).toContain("blocker:481:rollback-assistive-insert-visible");
  });
});
