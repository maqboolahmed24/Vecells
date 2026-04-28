import { describe, expect, it } from "vitest";
import { build481Records } from "../../tools/testing/run_481_dr_go_live_smoke";

describe("481 failover and recovery report contracts", () => {
  it("fails closed when failover runtime switches but publication parity mismatches", () => {
    const records = build481Records([]);
    const mismatch = records.failoverProbes.find(
      (evidence) => evidence.scenarioRef === "gls_481_failover_parity_mismatch",
    );

    expect(mismatch?.runtimeSwitchState).toBe("switched");
    expect(mismatch?.publicationParityState).toBe("mismatch");
    expect(mismatch?.state).toBe("blocked");
    expect(mismatch?.blockerRefs).toContain("blocker:481:failover-publication-parity-mismatch");
  });

  it("does not treat stale audit replay as live restore authority", () => {
    const records = build481Records([]);
    const staleReplay = records.backupRestoreEvidence.find(
      (evidence) => evidence.scenarioRef === "gls_481_failover_parity_mismatch",
    );

    expect(staleReplay?.restoreDrillState).toBe("audit_replay_stale");
    expect(staleReplay?.state).toBe("blocked");
    expect(staleReplay?.blockerRefs).toContain("blocker:481:audit-replay-dependency-stale");
  });

  it("keeps recovery communication constrained when alert ownership is absent", () => {
    const records = build481Records([]);
    const absentOwner = records.recoveryCommunications.find(
      (evidence) => evidence.scenarioRef === "gls_481_alert_owner_rota_and_mobile",
    );

    expect(absentOwner?.alertDeliveryState).toBe("queued");
    expect(absentOwner?.ownerRotaState).toBe("absent");
    expect(absentOwner?.state).toBe("constrained");
  });
});
