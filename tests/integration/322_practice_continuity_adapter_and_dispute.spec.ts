import { describe, expect, it } from "vitest";

import {
  createDirectApiPracticeContinuityAdapter,
  createInternalTransferPracticeContinuityAdapter,
  createManualSecureMailPracticeContinuityAdapter,
  createPhase5PracticeContinuityService,
  type PracticeContinuityDispatchAdapter,
} from "../../packages/domains/hub_coordination/src/phase5-practice-continuity-engine.ts";
import {
  buildEnqueuePracticeContinuityInput,
  setupPracticeContinuityHarness,
} from "./322_practice_continuity.helpers.ts";

describe("322 practice continuity adapter and dispute handling", () => {
  it("widens to recovery-required posture when the transport times out", async () => {
    const harness = await setupPracticeContinuityHarness("322_timeout");
    const timeoutAdapter: PracticeContinuityDispatchAdapter = {
      channel: "mesh",
      async dispatch(input) {
        return {
          outcome: "timed_out",
          adapterName: "mesh_timeout",
          adapterCorrelationKey: `${input.message.practiceContinuityMessageId}::timeout`,
        };
      },
    };
    const continuityService = createPhase5PracticeContinuityService({
      repositories: harness.repositories,
      hubCaseService: harness.service,
      offerRepositories: harness.offerRepositories,
      commitRepositories: harness.commitRepositories,
      policyService: harness.policyService,
      actingScopeService: harness.visibilityService,
      adapters: [
        timeoutAdapter,
        createDirectApiPracticeContinuityAdapter(),
        createManualSecureMailPracticeContinuityAdapter(),
        createInternalTransferPracticeContinuityAdapter(),
      ],
    });

    const enqueued = await continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness),
    );
    const dispatched = await continuityService.dispatchPracticeContinuityMessage({
      practiceContinuityMessageId: enqueued.message!.practiceContinuityMessageId,
      attemptedAt: "2026-04-23T00:16:00.000Z",
      sourceRefs: ["tests/integration/322_practice_continuity_adapter_and_dispute.spec.ts"],
    });

    expect(dispatched.dispatchAttempt?.dispatchState).toBe("timed_out");
    expect(dispatched.message?.transportAckState).toBe("timed_out");
    expect(dispatched.message?.ackState).toBe("recovery_required");
    expect(dispatched.truthProjection.practiceVisibilityState).toBe("recovery_required");
    expect(dispatched.truthProjection.closureState).toBe("blocked_by_practice_visibility");
  });
});
