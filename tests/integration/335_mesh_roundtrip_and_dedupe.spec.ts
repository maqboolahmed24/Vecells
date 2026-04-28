import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildAcknowledgementInput,
  buildEnqueuePracticeContinuityInput,
  buildReceiptInput,
  setupPracticeContinuityHarness,
  atMinute,
} from "./322_practice_continuity.helpers.ts";
import { buildMeshRouteManifest } from "../../scripts/messaging/335_mesh_mailbox_lib.ts";

afterEach(() => {
  vi.useRealTimers();
});

describe("335 mesh roundtrip and dedupe", () => {
  it("keeps transport acceptance and delivery distinct from generation-bound practice acknowledgement", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T10:05:00.000Z"));
    const harness = await setupPracticeContinuityHarness("335_roundtrip");
    const manifest = await buildMeshRouteManifest();
    const noticeRoute = manifest.routes.find(
      (route) => route.routeId === "route_335_hub_notice_local",
    );
    const ackRoute = manifest.routes.find(
      (route) => route.routeId === "route_335_practice_ack_local",
    );

    expect(noticeRoute).toBeTruthy();
    expect(ackRoute).toBeTruthy();
    expect(ackRoute!.workflowId).toBe("VEC_HUB_BOOKING_ACK");

    const enqueued = await harness.continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness, {
        dispatchWorkflowId: noticeRoute!.workflowId,
        routeIntentBindingRef: noticeRoute!.routeId,
        sourceRefs: ["tests/integration/335_mesh_roundtrip_and_dedupe.spec.ts"],
      }),
    );

    expect(enqueued.message?.dispatchWorkflowId).toBe("VEC_HUB_BOOKING_NOTICE");
    expect(enqueued.truthProjection.practiceVisibilityState).toBe("continuity_pending");

    const dispatched = await harness.continuityService.dispatchPracticeContinuityMessage({
      practiceContinuityMessageId: enqueued.message!.practiceContinuityMessageId,
      attemptedAt: atMinute(16),
      sourceRefs: ["tests/integration/335_mesh_roundtrip_and_dedupe.spec.ts"],
    });

    expect(dispatched.dispatchAttempt?.dispatchState).toBe("accepted");
    expect(dispatched.message?.transportAckState).toBe("accepted");
    expect(dispatched.truthProjection.practiceVisibilityState).toBe("continuity_pending");

    const delivered = await harness.continuityService.recordReceiptCheckpoint(
      buildReceiptInput(enqueued.message!.practiceContinuityMessageId, "delivery_downloaded", {
        recordedAt: atMinute(17),
        sourceRefs: ["tests/integration/335_mesh_roundtrip_and_dedupe.spec.ts"],
      }),
    );

    expect(delivered.truthProjection.practiceVisibilityState).toBe("ack_pending");
    expect(delivered.message?.deliveryEvidenceState).toBe("delivered");
    expect(delivered.message?.ackState).toBe("pending");

    const acknowledged = await harness.continuityService.capturePracticeAcknowledgement(
      await buildAcknowledgementInput(harness, enqueued.message!.practiceContinuityMessageId, {
        recordedAt: atMinute(18),
        routeIntentBindingRef: ackRoute!.routeId,
        sourceRefs: ["tests/integration/335_mesh_roundtrip_and_dedupe.spec.ts"],
      }),
    );

    expect(acknowledged.message?.ackState).toBe("acknowledged");
    expect(acknowledged.truthProjection.practiceVisibilityState).toBe("acknowledged");
    expect(acknowledged.hubTransition?.hubCase.status).toBe("booked");
  });

  it("replays the same mesh continuity enqueue by dedupe key instead of minting a second live message", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T10:05:00.000Z"));
    const harness = await setupPracticeContinuityHarness("335_dedupe");
    const manifest = await buildMeshRouteManifest();
    const noticeRoute = manifest.routes.find(
      (route) => route.routeId === "route_335_hub_notice_local",
    );

    expect(noticeRoute).toBeTruthy();

    const enqueueInput = buildEnqueuePracticeContinuityInput(harness, {
      dispatchWorkflowId: noticeRoute!.workflowId,
      routeIntentBindingRef: noticeRoute!.routeId,
      sourceRefs: ["tests/integration/335_mesh_roundtrip_and_dedupe.spec.ts"],
    });

    const first = await harness.continuityService.enqueuePracticeContinuityMessage(enqueueInput);
    const replay = await harness.continuityService.enqueuePracticeContinuityMessage({
      ...enqueueInput,
      recordedAt: atMinute(19),
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.message?.practiceContinuityMessageId).toBe(
      first.message?.practiceContinuityMessageId,
    );
    expect(replay.message?.dispatchWorkflowId).toBe("VEC_HUB_BOOKING_NOTICE");

    const messages = await harness.repositories.listMessagesForCase(
      enqueueInput.hubCoordinationCaseId,
    );
    expect(messages).toHaveLength(1);
    expect(noticeRoute!.routeCorrelationTemplate).toContain("ackGeneration");
    expect(noticeRoute!.routeCorrelationTemplate).toContain("truthTupleHash");
  });
});
