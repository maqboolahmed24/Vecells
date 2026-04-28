import { createHash } from "node:crypto";

export const SUPPORT_COMMUNICATION_FAILURE_LINKAGE_SERVICE_NAME =
  "SupportCommunicationFailureLinkageService";
export const SUPPORT_RESOLUTION_SNAPSHOT_BUILDER_NAME = "SupportResolutionSnapshotBuilder";

export type SupportCommunicationDomain = "callback_case" | "clinician_message_thread";
export type SupportCommunicationSeverity = "low" | "medium" | "high" | "critical";
export type SupportCommunicationActionScope =
  | "controlled_resend"
  | "channel_change"
  | "attachment_recovery"
  | "callback_reschedule"
  | "manual_handoff"
  | "resolution_note";
export type SupportCommunicationSettlementResult =
  | "applied"
  | "awaiting_external"
  | "stale_recoverable"
  | "denied_scope"
  | "manual_handoff_required";
export type SupportCommunicationAuthoritativeOutcomeState =
  | "pending"
  | "awaiting_external"
  | "stale_recoverable"
  | "recovery_required"
  | "manual_handoff_required"
  | "settled"
  | "failed"
  | "expired";
export type SupportCommunicationProcessingAcceptanceState =
  | "not_started"
  | "accepted_for_processing"
  | "awaiting_external_confirmation"
  | "externally_accepted"
  | "externally_rejected"
  | "timed_out";
export type SupportCommunicationExternalObservationState =
  | "unobserved"
  | "delivered"
  | "resolved"
  | "transferred"
  | "disputed"
  | "failed"
  | "expired";
export type SupportCommunicationAuthoritativeDeliveryState =
  | "unobserved"
  | "delivered"
  | "failed"
  | "disputed"
  | "expired";
export type SupportResolutionConfirmationState =
  | "draft"
  | "awaiting_external"
  | "accepted_transfer"
  | "durable";

export interface SupportCommunicationTupleInput {
  readonly domain: SupportCommunicationDomain;
  readonly requestLineageRef: string;
  readonly lineageCaseLinkRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string | null;
  readonly sourceArtifactRef: string | null;
  readonly sourceEvidenceSnapshotRef: string | null;
  readonly reachabilityEpoch: number;
  readonly deliveryOrExpectationState: string;
}

export interface SupportCommunicationHashBundle {
  readonly failurePathKey: string;
  readonly bindingHash: string;
  readonly governingThreadTupleHash: string;
  readonly governingSubthreadTupleHash: string;
  readonly communicationChainHash: string;
}

export interface SupportCommunicationSettlementInput {
  readonly result: SupportCommunicationSettlementResult;
  readonly actionScope: SupportCommunicationActionScope;
  readonly deliveryState: SupportCommunicationAuthoritativeDeliveryState;
  readonly noteHasProvenance: boolean;
  readonly acceptedTransfer: boolean;
}

export interface SupportCommunicationSettlementState {
  readonly processingAcceptanceState: SupportCommunicationProcessingAcceptanceState;
  readonly externalObservationState: SupportCommunicationExternalObservationState;
  readonly authoritativeOutcomeState: SupportCommunicationAuthoritativeOutcomeState;
  readonly durableResolutionAllowed: boolean;
  readonly requiredConfirmationState: SupportResolutionConfirmationState;
}

function stableHash(parts: readonly unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}

export function buildSupportCommunicationHashBundle(
  input: SupportCommunicationTupleInput,
): SupportCommunicationHashBundle {
  const governingThreadTupleHash = stableHash([
    input.domain,
    input.governingThreadRef,
    input.governingObjectVersionRef,
    input.deliveryOrExpectationState,
    input.reachabilityEpoch,
  ]);
  const governingSubthreadTupleHash = stableHash([
    input.domain,
    input.governingSubthreadRef,
    input.sourceArtifactRef,
    input.sourceEvidenceSnapshotRef,
    input.governingObjectVersionRef,
    input.deliveryOrExpectationState,
  ]);
  return {
    failurePathKey: stableHash([
      input.domain,
      input.requestLineageRef,
      input.lineageCaseLinkRef,
      input.governingObjectRef,
      governingThreadTupleHash,
    ]),
    bindingHash: stableHash([
      input.requestLineageRef,
      input.lineageCaseLinkRef,
      input.governingObjectRef,
      input.governingObjectVersionRef,
      governingThreadTupleHash,
      governingSubthreadTupleHash,
    ]),
    governingThreadTupleHash,
    governingSubthreadTupleHash,
    communicationChainHash: stableHash([
      input.domain,
      input.governingObjectRef,
      input.governingObjectVersionRef,
      governingThreadTupleHash,
      governingSubthreadTupleHash,
      input.sourceArtifactRef,
      input.sourceEvidenceSnapshotRef,
    ]),
  };
}

export function deriveSupportCommunicationSeverity(input: {
  readonly domain: SupportCommunicationDomain;
  readonly deliveryOrExpectationState: string;
  readonly reachabilityEpoch: number;
}): SupportCommunicationSeverity {
  if (
    input.deliveryOrExpectationState === "disputed" ||
    input.deliveryOrExpectationState === "route_invalid" ||
    input.deliveryOrExpectationState === "provider_failure"
  ) {
    return "high";
  }
  if (
    input.deliveryOrExpectationState === "failed" ||
    input.deliveryOrExpectationState === "expired" ||
    input.deliveryOrExpectationState === "delivery_repair_required" ||
    input.deliveryOrExpectationState === "route_repair_required"
  ) {
    return "high";
  }
  if (input.deliveryOrExpectationState === "no_answer" && input.reachabilityEpoch >= 2) {
    return "high";
  }
  if (
    input.deliveryOrExpectationState === "no_answer" ||
    input.deliveryOrExpectationState === "at_risk" ||
    input.deliveryOrExpectationState === "likely_failed"
  ) {
    return "medium";
  }
  return input.domain === "callback_case" ? "medium" : "low";
}

export function deriveSupportCommunicationReasonCategory(input: {
  readonly domain: SupportCommunicationDomain;
  readonly deliveryOrExpectationState: string;
}): string {
  if (input.domain === "callback_case") {
    if (input.deliveryOrExpectationState === "route_invalid") {
      return "callback_route_invalid";
    }
    if (input.deliveryOrExpectationState === "provider_failure") {
      return "callback_provider_failure";
    }
    if (input.deliveryOrExpectationState === "route_repair_required") {
      return "callback_route_repair_required";
    }
    return "callback_failure_follow_up";
  }
  if (input.deliveryOrExpectationState === "disputed") {
    return "message_delivery_disputed";
  }
  if (input.deliveryOrExpectationState === "expired") {
    return "message_delivery_expired";
  }
  if (input.deliveryOrExpectationState === "delivery_repair_required") {
    return "message_delivery_repair_required";
  }
  return "message_delivery_failure";
}

export function deriveSupportAllowedActionRefs(
  domain: SupportCommunicationDomain,
): readonly SupportCommunicationActionScope[] {
  if (domain === "callback_case") {
    return ["callback_reschedule", "manual_handoff", "resolution_note"];
  }
  return [
    "controlled_resend",
    "channel_change",
    "attachment_recovery",
    "manual_handoff",
    "resolution_note",
  ];
}

export function normalizeSupportCommunicationSettlement(
  input: SupportCommunicationSettlementInput,
): SupportCommunicationSettlementState {
  switch (input.result) {
    case "applied":
      return {
        processingAcceptanceState: "externally_accepted",
        externalObservationState:
          input.deliveryState === "delivered" ? "resolved" : "resolved",
        authoritativeOutcomeState: "settled",
        durableResolutionAllowed: input.noteHasProvenance,
        requiredConfirmationState: "durable",
      };
    case "awaiting_external":
      return {
        processingAcceptanceState: "awaiting_external_confirmation",
        externalObservationState: "unobserved",
        authoritativeOutcomeState: "awaiting_external",
        durableResolutionAllowed: false,
        requiredConfirmationState: "awaiting_external",
      };
    case "stale_recoverable":
      return {
        processingAcceptanceState: "accepted_for_processing",
        externalObservationState: "unobserved",
        authoritativeOutcomeState: "stale_recoverable",
        durableResolutionAllowed: input.noteHasProvenance,
        requiredConfirmationState: "durable",
      };
    case "manual_handoff_required":
      return {
        processingAcceptanceState: input.acceptedTransfer
          ? "externally_accepted"
          : "accepted_for_processing",
        externalObservationState: input.acceptedTransfer ? "transferred" : "unobserved",
        authoritativeOutcomeState: "manual_handoff_required",
        durableResolutionAllowed: input.noteHasProvenance && input.acceptedTransfer,
        requiredConfirmationState: input.acceptedTransfer ? "accepted_transfer" : "draft",
      };
    case "denied_scope":
      return {
        processingAcceptanceState: "not_started",
        externalObservationState: "unobserved",
        authoritativeOutcomeState: "failed",
        durableResolutionAllowed: false,
        requiredConfirmationState: "draft",
      };
    default: {
      const exhaustiveCheck: never = input.result;
      return exhaustiveCheck;
    }
  }
}

export function canPublishSupportResolutionSnapshot(input: {
  readonly settlementState: SupportCommunicationSettlementState;
  readonly noteHasProvenance: boolean;
}): boolean {
  return input.settlementState.durableResolutionAllowed && input.noteHasProvenance;
}
