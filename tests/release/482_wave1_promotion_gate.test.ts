import { describe, expect, it } from "vitest";
import {
  build482Preflight,
  build482Records,
  hashValue,
  required482EdgeCases,
  settle482Wave1Promotion,
} from "../../tools/release/promote_482_wave1";

describe("482 Wave 1 promotion gates", () => {
  it("promotes only when every preflight lane is exact", () => {
    const ready = settle482Wave1Promotion("ready");

    expect(ready.preflight.state).toBe("exact");
    expect(ready.preflight.blockerRefs).toEqual([]);
    expect(ready.preflight.lanes.every((lane) => lane.state === "exact")).toBe(true);
    expect(ready.command.commandState).toBe("accepted");
    expect(ready.settlement.result).toBe("applied");
    expect(ready.parity.parityState).toBe("exact");
    expect(ready.activationEvidence.activationState).toBe("active_under_observation");
  });

  it("covers every required promotion edge case", () => {
    const records = build482Records([]);
    const edgeCaseIds = new Set(records.edgeCaseFixtures.map((fixture) => fixture.edgeCaseId));

    for (const edgeCase of required482EdgeCases) {
      expect(edgeCaseIds.has(edgeCase)).toBe(true);
    }
  });

  it("fails closed for stale, expired, widened, and missing rollback authority lanes", () => {
    expect(build482Preflight("expired_signoff").blockerRefs).toContain(
      "blocker:482:signoff-register-expired-after-signing",
    );
    expect(build482Preflight("stale_migration").blockerRefs).toContain(
      "blocker:482:migration-readiness-stale-after-wave-manifest",
    );
    expect(build482Preflight("widened_selector").blockerRefs).toContain(
      "blocker:482:wave1-selector-widened-by-tenant-regrouping",
    );
    expect(build482Preflight("missing_rollback").blockerRefs).toContain(
      "blocker:482:rollback-binding-absent-for-wave1-route-family",
    );
  });

  it("blocks activation when post-promotion publication parity mismatches", () => {
    const parityFailed = settle482Wave1Promotion("parity_failed");

    expect(parityFailed.command.commandState).toBe("accepted");
    expect(parityFailed.parity.parityState).toBe("mismatch");
    expect(parityFailed.settlement.result).toBe("pending_probe");
    expect(parityFailed.activationEvidence.activationState).toBe("blocked");
    expect(parityFailed.activationEvidence.blockerRefs).toContain(
      "blocker:482:post-promotion-publication-parity-mismatch",
    );
  });

  it("hashes promotion preflight evidence deterministically", () => {
    const preflight = build482Preflight("ready");
    const { recordHash, ...withoutHash } = preflight;

    expect(recordHash).toBe(hashValue(withoutHash));
  });
});
