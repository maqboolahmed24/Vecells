import { describe, expect, it } from "vitest";
import { settle482Wave1Promotion } from "../../tools/release/promote_482_wave1";

describe("482 Wave 1 promotion idempotency", () => {
  it("returns the original settlement for a duplicate promotion idempotency key", () => {
    const first = settle482Wave1Promotion("ready");
    const duplicate = settle482Wave1Promotion("duplicate_idempotency");

    expect(duplicate.command.idempotencyKey).toBe(first.command.idempotencyKey);
    expect(duplicate.idempotencyBinding.firstSettlementRef).toBe(
      first.settlement.waveActionSettlementId,
    );
    expect(duplicate.idempotencyBinding.replayDisposition).toBe("same_settlement_returned");
    expect(duplicate.settlement.waveActionSettlementId).toBe(
      first.settlement.waveActionSettlementId,
    );
    expect(duplicate.command.commandState).toBe("deduplicated");
  });

  it("denies promotion when the operator lacks release-manager authority", () => {
    const denied = settle482Wave1Promotion("role_denied");

    expect(denied.command.operatorRoleRef).toBe("role:support-observer");
    expect(denied.command.commandState).toBe("denied");
    expect(denied.settlement.result).toBe("denied_scope");
    expect(denied.settlement.blockerRefs).toContain(
      "blocker:482:operator-lacks-release-manager-authority",
    );
  });
});
