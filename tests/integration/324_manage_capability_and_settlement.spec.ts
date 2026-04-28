import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildManageActionInput,
  buildManageCapabilitiesInput,
  currentHubCoordinationCaseId,
  settlePracticeAcknowledgement,
  setupReminderManageHarness,
} from "./324_hub_manage_reminders.helpers.ts";

describe("324 manage capability leases and settlements", () => {
  it("blocks manage posture while practice acknowledgement debt remains open", async () => {
    const harness = await setupReminderManageHarness("324_manage_blocked");

    const compiled = await harness.manageService.compileNetworkManageCapabilities(
      buildManageCapabilitiesInput(harness),
    );

    expect(compiled.replayed).toBe(false);
    expect(compiled.capabilities.capabilityState).toBe("blocked");
    expect(compiled.capabilities.readOnlyMode).toBe("read_only");
    expect(compiled.capabilities.allowedActions).toHaveLength(0);
    expect(compiled.capabilities.blockedReasonRefs).toContain("practice_ack_debt_open");
    expect(compiled.capabilities.fallbackRouteRef).toBe("hub_practice_visibility_review");
  });

  it("leases live manage authority after acknowledgement and settles cancel in the same shell", async () => {
    const harness = await setupReminderManageHarness("324_manage_apply");
    const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);

    await settlePracticeAcknowledgement(harness);
    await harness.manageService.refreshPracticeVisibilityProjection({
      hubCoordinationCaseId,
      visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
      recordedAt: atMinute(20),
      sourceRefs: ["tests/integration/324_manage_capability_and_settlement.spec.ts"],
    });

    const compiled = await harness.manageService.compileNetworkManageCapabilities(
      buildManageCapabilitiesInput(harness, {
        recordedAt: atMinute(21),
      }),
    );

    expect(compiled.capabilities.capabilityState).toBe("live");
    expect(compiled.capabilities.readOnlyMode).toBe("interactive");
    expect(compiled.capabilities.allowedActions).toContain("cancel");

    const settled = await harness.manageService.executeHubManageAction(
      buildManageActionInput(
        harness,
        compiled.capabilities.networkManageCapabilitiesId,
        "cancel",
      ),
    );

    expect(settled.replayed).toBe(false);
    expect(settled.settlement.result).toBe("applied");
    expect(settled.settlement.actionScope).toBe("cancel");
    expect(settled.capabilities.capabilityState).toBe("blocked");
    expect(settled.capabilities.readOnlyMode).toBe("read_only");
    expect(settled.capabilities.reasonCode).toBe("post_mutation_refresh_required");
    expect(settled.capabilities.blockedReasonRefs).toContain(
      "post_mutation_refresh_required",
    );
    expect(settled.deltaRecord?.changeClass).toBe("cancelled");
    expect(settled.deltaRecord?.deltaReason).toBe("appointment_version_changed");
    expect(settled.visibilityProjection?.manageSettlementState).toBe("applied");
    expect(settled.visibilityProjection?.practiceAcknowledgementState).toBe("ack_pending");
    expect(settled.visibilityProjection?.actionRequiredState).toBe("practice_ack_required");

    const currentState =
      await harness.manageService.queryCurrentReminderManageVisibilityState(hubCoordinationCaseId);
    expect(currentState.latestManageSettlement?.hubManageSettlementId).toBe(
      settled.settlement.hubManageSettlementId,
    );
    expect(currentState.latestDeltaRecord?.practiceVisibilityDeltaRecordId).toBe(
      settled.deltaRecord?.practiceVisibilityDeltaRecordId,
    );
  });
});
