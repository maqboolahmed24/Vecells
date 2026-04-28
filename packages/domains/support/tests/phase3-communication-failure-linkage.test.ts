import { describe, expect, it } from "vitest";
import {
  buildSupportCommunicationHashBundle,
  canPublishSupportResolutionSnapshot,
  deriveSupportAllowedActionRefs,
  deriveSupportCommunicationReasonCategory,
  deriveSupportCommunicationSeverity,
  normalizeSupportCommunicationSettlement,
} from "../src/phase3-communication-failure-linkage.ts";

describe("phase3 support communication failure linkage helpers", () => {
  it("keeps one stable failure-path key for the same governing communication tuple", () => {
    const first = buildSupportCommunicationHashBundle({
      domain: "clinician_message_thread",
      requestLineageRef: "request_lineage_248_a",
      lineageCaseLinkRef: "lineage_case_link_248_message",
      governingObjectRef: "message_thread_248_a",
      governingObjectVersionRef: "message_thread_248_a_v5",
      governingThreadRef: "message_thread_248_a",
      governingSubthreadRef: "message_dispatch_248_a",
      sourceArtifactRef: "message_delivery_248_a",
      sourceEvidenceSnapshotRef: "message_delivery_248_a",
      reachabilityEpoch: 2,
      deliveryOrExpectationState: "delivery_repair_required",
    });
    const replay = buildSupportCommunicationHashBundle({
      domain: "clinician_message_thread",
      requestLineageRef: "request_lineage_248_a",
      lineageCaseLinkRef: "lineage_case_link_248_message",
      governingObjectRef: "message_thread_248_a",
      governingObjectVersionRef: "message_thread_248_a_v5",
      governingThreadRef: "message_thread_248_a",
      governingSubthreadRef: "message_dispatch_248_a",
      sourceArtifactRef: "message_delivery_248_a",
      sourceEvidenceSnapshotRef: "message_delivery_248_a",
      reachabilityEpoch: 2,
      deliveryOrExpectationState: "delivery_repair_required",
    });
    const drifted = buildSupportCommunicationHashBundle({
      domain: "clinician_message_thread",
      requestLineageRef: "request_lineage_248_a",
      lineageCaseLinkRef: "lineage_case_link_248_message",
      governingObjectRef: "message_thread_248_a",
      governingObjectVersionRef: "message_thread_248_a_v6",
      governingThreadRef: "message_thread_248_a",
      governingSubthreadRef: "message_dispatch_248_b",
      sourceArtifactRef: "message_delivery_248_b",
      sourceEvidenceSnapshotRef: "message_delivery_248_b",
      reachabilityEpoch: 3,
      deliveryOrExpectationState: "failed",
    });

    expect(replay.failurePathKey).toBe(first.failurePathKey);
    expect(drifted.failurePathKey).not.toBe(first.failurePathKey);
    expect(drifted.bindingHash).not.toBe(first.bindingHash);
  });

  it("normalizes settlement law so awaiting_external cannot publish a durable resolution summary", () => {
    const provisional = normalizeSupportCommunicationSettlement({
      result: "awaiting_external",
      actionScope: "controlled_resend",
      deliveryState: "failed",
      noteHasProvenance: true,
      acceptedTransfer: false,
    });

    expect(provisional.processingAcceptanceState).toBe("awaiting_external_confirmation");
    expect(provisional.authoritativeOutcomeState).toBe("awaiting_external");
    expect(
      canPublishSupportResolutionSnapshot({
        settlementState: provisional,
        noteHasProvenance: true,
      }),
    ).toBe(false);
  });

  it("requires accepted transfer for manual_handoff_required to become durable", () => {
    const unaccepted = normalizeSupportCommunicationSettlement({
      result: "manual_handoff_required",
      actionScope: "manual_handoff",
      deliveryState: "failed",
      noteHasProvenance: true,
      acceptedTransfer: false,
    });
    const accepted = normalizeSupportCommunicationSettlement({
      result: "manual_handoff_required",
      actionScope: "manual_handoff",
      deliveryState: "failed",
      noteHasProvenance: true,
      acceptedTransfer: true,
    });

    expect(unaccepted.requiredConfirmationState).toBe("draft");
    expect(accepted.requiredConfirmationState).toBe("accepted_transfer");
    expect(
      canPublishSupportResolutionSnapshot({
        settlementState: unaccepted,
        noteHasProvenance: true,
      }),
    ).toBe(false);
    expect(
      canPublishSupportResolutionSnapshot({
        settlementState: accepted,
        noteHasProvenance: true,
      }),
    ).toBe(true);
  });

  it("derives reason categories, severity, and allowed actions from the communication failure shape", () => {
    expect(
      deriveSupportCommunicationReasonCategory({
        domain: "callback_case",
        deliveryOrExpectationState: "route_invalid",
      }),
    ).toBe("callback_route_invalid");
    expect(
      deriveSupportCommunicationSeverity({
        domain: "callback_case",
        deliveryOrExpectationState: "no_answer",
        reachabilityEpoch: 3,
      }),
    ).toBe("high");
    expect(deriveSupportAllowedActionRefs("callback_case")).toEqual([
      "callback_reschedule",
      "manual_handoff",
      "resolution_note",
    ]);
  });
});
