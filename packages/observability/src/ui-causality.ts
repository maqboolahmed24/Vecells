import {
  digestForTelemetry,
  type CorrelationReplayState,
  type EdgeCorrelationContext,
} from "./correlation-spine";
import {
  auditLinkField,
  controlPlaneField,
  publicDescriptor,
  summarizeDisclosureFence,
  type TelemetryDisclosureClass,
  type TelemetryEnvelope,
  type TelemetrySafeField,
  type TelemetrySink,
} from "./telemetry";

export interface UIEventCausalityFrame {
  continuityFrameRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  shellSlug: string;
  selectedAnchorRef: string;
  continuityState: "live" | "restore" | "replay" | "stale";
  replayState: CorrelationReplayState;
}

export interface UIEventEmissionCheckpoint {
  checkpointRef: string;
  continuityFrameRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  eventSequence: number;
  replayState: CorrelationReplayState;
}

export interface UIProjectionVisibilityReceipt {
  visibilityReceiptRef: string;
  continuityFrameRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  projectionVersionRef: string;
  visibilityState: "visible" | "restored" | "stale" | "blocked";
  selectedAnchorChangeClass: "unchanged" | "advanced" | "restored" | "blocked";
  shellDecisionClass: "same_shell" | "restored_same_shell" | "read_only" | "blocked";
}

export interface UITransitionSettlementRecord {
  settlementRef: string;
  continuityFrameRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  settlementState: "accepted" | "projection_visible" | "authoritative" | "blocked";
  authoritativeSource: "not_yet_authoritative" | "projection" | "audit";
  authoritativeOutcomeState: "pending" | "settled" | "blocked";
  projectionVisibilityRef: string | null;
  auditRecordRef: string | null;
  settlementRevision: number;
  replayState: CorrelationReplayState;
}

export interface UITelemetryDisclosureFence {
  fenceRef: string;
  continuityFrameRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  eventName: string;
  disclosureState: "verified" | "masked" | "blocked";
  permittedClasses: readonly TelemetryDisclosureClass[];
  blockedFieldCount: number;
  maskedFieldCount: number;
  verifiedFieldCount: number;
  policyRef: string;
}

export function createUIEventCausalityFrame(input: {
  correlation: EdgeCorrelationContext;
  shellSlug: string;
  selectedAnchorRef: string;
  continuityState: UIEventCausalityFrame["continuityState"];
}): UIEventCausalityFrame {
  return {
    continuityFrameRef: `uicf_${digestForTelemetry({
      edgeCorrelationId: input.correlation.edgeCorrelationId,
      shellSlug: input.shellSlug,
      selectedAnchorRef: input.selectedAnchorRef,
      continuityState: input.continuityState,
    }).slice(0, 18)}`,
    edgeCorrelationId: input.correlation.edgeCorrelationId,
    causalToken: input.correlation.causalToken,
    shellSlug: input.shellSlug,
    selectedAnchorRef: input.selectedAnchorRef,
    continuityState: input.continuityState,
    replayState: input.correlation.replayState,
  };
}

export function createUIEventEmissionCheckpoint(input: {
  frame: UIEventCausalityFrame;
  eventSequence: number;
}): UIEventEmissionCheckpoint {
  return {
    checkpointRef: `uiec_${digestForTelemetry({
      frame: input.frame.continuityFrameRef,
      eventSequence: input.eventSequence,
    }).slice(0, 18)}`,
    continuityFrameRef: input.frame.continuityFrameRef,
    edgeCorrelationId: input.frame.edgeCorrelationId,
    causalToken: input.frame.causalToken,
    eventSequence: input.eventSequence,
    replayState: input.frame.replayState,
  };
}

export function createUIProjectionVisibilityReceipt(input: {
  frame: UIEventCausalityFrame;
  projectionVersionRef: string;
  visibilityState: UIProjectionVisibilityReceipt["visibilityState"];
  selectedAnchorChangeClass: UIProjectionVisibilityReceipt["selectedAnchorChangeClass"];
  shellDecisionClass: UIProjectionVisibilityReceipt["shellDecisionClass"];
}): UIProjectionVisibilityReceipt {
  return {
    visibilityReceiptRef: `uivr_${digestForTelemetry({
      frame: input.frame.continuityFrameRef,
      projectionVersionRef: input.projectionVersionRef,
      visibilityState: input.visibilityState,
      shellDecisionClass: input.shellDecisionClass,
    }).slice(0, 18)}`,
    continuityFrameRef: input.frame.continuityFrameRef,
    edgeCorrelationId: input.frame.edgeCorrelationId,
    causalToken: input.frame.causalToken,
    projectionVersionRef: input.projectionVersionRef,
    visibilityState: input.visibilityState,
    selectedAnchorChangeClass: input.selectedAnchorChangeClass,
    shellDecisionClass: input.shellDecisionClass,
  };
}

export function createUITransitionSettlementRecord(input: {
  frame: UIEventCausalityFrame;
  projectionVisibilityRef?: string | null;
  auditRecordRef?: string | null;
  settlementState: UITransitionSettlementRecord["settlementState"];
  authoritativeSource: UITransitionSettlementRecord["authoritativeSource"];
  authoritativeOutcomeState: UITransitionSettlementRecord["authoritativeOutcomeState"];
  settlementRevision?: number;
}): UITransitionSettlementRecord {
  return {
    settlementRef: `uits_${digestForTelemetry({
      frame: input.frame.continuityFrameRef,
      projectionVisibilityRef: input.projectionVisibilityRef ?? null,
      auditRecordRef: input.auditRecordRef ?? null,
      settlementState: input.settlementState,
      authoritativeOutcomeState: input.authoritativeOutcomeState,
    }).slice(0, 18)}`,
    continuityFrameRef: input.frame.continuityFrameRef,
    edgeCorrelationId: input.frame.edgeCorrelationId,
    causalToken: input.frame.causalToken,
    settlementState: input.settlementState,
    authoritativeSource: input.authoritativeSource,
    authoritativeOutcomeState: input.authoritativeOutcomeState,
    projectionVisibilityRef: input.projectionVisibilityRef ?? null,
    auditRecordRef: input.auditRecordRef ?? null,
    settlementRevision: input.settlementRevision ?? 1,
    replayState: input.frame.replayState,
  };
}

export function createUITelemetryDisclosureFence(input: {
  frame: UIEventCausalityFrame;
  eventName: string;
  fields: Record<string, TelemetrySafeField>;
  permittedClasses: readonly TelemetryDisclosureClass[];
  policyRef: string;
}): UITelemetryDisclosureFence {
  const summary = summarizeDisclosureFence(input.fields);
  const observedClasses = new Set(
    Object.values(input.fields).map((field) => field.disclosureClass),
  );
  const permitted = new Set(input.permittedClasses);
  const hasPolicyBreach = [...observedClasses].some((entry) => !permitted.has(entry));
  return {
    fenceRef: `uidf_${digestForTelemetry({
      frame: input.frame.continuityFrameRef,
      eventName: input.eventName,
      classes: [...observedClasses].sort(),
    }).slice(0, 18)}`,
    continuityFrameRef: input.frame.continuityFrameRef,
    edgeCorrelationId: input.frame.edgeCorrelationId,
    causalToken: input.frame.causalToken,
    eventName: input.eventName,
    disclosureState: hasPolicyBreach ? "blocked" : summary.disclosureState,
    permittedClasses: [...input.permittedClasses],
    blockedFieldCount: hasPolicyBreach ? summary.blockedFieldCount + 1 : summary.blockedFieldCount,
    maskedFieldCount: summary.maskedFieldCount,
    verifiedFieldCount: summary.verifiedFieldCount,
    policyRef: input.policyRef,
  };
}

function createUiEnvelope(
  family: TelemetryEnvelope["family"],
  eventName: string,
  correlation: EdgeCorrelationContext,
  serviceRef: string,
  environment: string,
  fields: Record<string, TelemetrySafeField>,
): TelemetryEnvelope {
  const summary = summarizeDisclosureFence(fields);
  return {
    envelopeRef: `${family}_${digestForTelemetry({
      edgeCorrelationId: correlation.edgeCorrelationId,
      eventName,
      hopSequence: correlation.hopSequence,
      serviceRef,
    }).slice(0, 18)}`,
    family,
    level: "info",
    eventName,
    serviceRef,
    environment,
    emittedAt: correlation.issuedAt,
    edgeCorrelationId: correlation.edgeCorrelationId,
    causalToken: correlation.causalToken,
    traceId: correlation.traceId,
    hopKind: correlation.currentHopKind,
    hopSequence: correlation.hopSequence,
    replayState: correlation.replayState,
    hop: {
      hopRef: `hop_${digestForTelemetry({
        edgeCorrelationId: correlation.edgeCorrelationId,
        hopSequence: correlation.hopSequence,
        serviceRef,
      }).slice(0, 18)}`,
      edgeCorrelationId: correlation.edgeCorrelationId,
      causalToken: correlation.causalToken,
      traceId: correlation.traceId,
      hopSequence: correlation.hopSequence,
      hopKind: correlation.currentHopKind,
      replayState: correlation.replayState,
      serviceRef,
      environment,
      emittedAt: correlation.issuedAt,
      audienceSurfaceRef: correlation.audienceSurfaceRef,
      routeFamilyRef: correlation.routeFamilyRef,
      requestMethod: correlation.requestMethod,
      requestPath: correlation.requestPath,
    },
    disclosureFence: summary,
    fields,
  };
}

export function emitProjectionVisibilityReceipt(
  sink: TelemetrySink,
  input: {
    correlation: EdgeCorrelationContext;
    serviceRef: string;
    environment: string;
    receipt: UIProjectionVisibilityReceipt;
  },
): TelemetryEnvelope {
  const envelope = createUiEnvelope(
    "ui_visibility_receipt",
    "ui.transition.projection_seen",
    input.correlation,
    input.serviceRef,
    input.environment,
    {
      visibilityReceiptRef: auditLinkField(input.receipt.visibilityReceiptRef),
      projectionVersionRef: controlPlaneField(input.receipt.projectionVersionRef),
      visibilityState: publicDescriptor(input.receipt.visibilityState),
      selectedAnchorChangeClass: publicDescriptor(input.receipt.selectedAnchorChangeClass),
      shellDecisionClass: publicDescriptor(input.receipt.shellDecisionClass),
    },
  );
  sink.emit(envelope);
  return envelope;
}

export function emitTransitionSettlement(
  sink: TelemetrySink,
  input: {
    correlation: EdgeCorrelationContext;
    serviceRef: string;
    environment: string;
    settlement: UITransitionSettlementRecord;
  },
): TelemetryEnvelope {
  const envelope = createUiEnvelope(
    "ui_transition_settlement",
    "ui.transition.settled",
    input.correlation,
    input.serviceRef,
    input.environment,
    {
      settlementRef: auditLinkField(input.settlement.settlementRef),
      settlementState: publicDescriptor(input.settlement.settlementState),
      authoritativeSource: publicDescriptor(input.settlement.authoritativeSource),
      authoritativeOutcomeState: publicDescriptor(input.settlement.authoritativeOutcomeState),
      projectionVisibilityRef: input.settlement.projectionVisibilityRef
        ? auditLinkField(input.settlement.projectionVisibilityRef)
        : controlPlaneField(null),
      auditRecordRef: input.settlement.auditRecordRef
        ? auditLinkField(input.settlement.auditRecordRef)
        : controlPlaneField(null),
    },
  );
  sink.emit(envelope);
  return envelope;
}

export function emitAuditCorrelationRecord(
  sink: TelemetrySink,
  input: {
    correlation: EdgeCorrelationContext;
    serviceRef: string;
    environment: string;
    auditRecordRef: string;
    visibilityReceiptRef?: string | null;
    settlementRef?: string | null;
  },
): TelemetryEnvelope {
  const envelope = createUiEnvelope(
    "audit",
    "audit.correlation.bound",
    input.correlation,
    input.serviceRef,
    input.environment,
    {
      auditRecordRef: auditLinkField(input.auditRecordRef),
      visibilityReceiptRef: input.visibilityReceiptRef
        ? auditLinkField(input.visibilityReceiptRef)
        : controlPlaneField(null),
      settlementRef: input.settlementRef
        ? auditLinkField(input.settlementRef)
        : controlPlaneField(null),
    },
  );
  sink.emit(envelope);
  return envelope;
}
