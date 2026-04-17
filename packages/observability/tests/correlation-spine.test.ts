import { describe, expect, it } from "vitest";
import {
  InMemoryTelemetrySink,
  advanceCorrelationHop,
  auditLinkField,
  blockedRawPhiField,
  controlPlaneField,
  createStructuredTelemetryLogger,
  createUIEventCausalityFrame,
  createUIEventEmissionCheckpoint,
  createUIProjectionVisibilityReceipt,
  createUITransitionSettlementRecord,
  emitAuditCorrelationRecord,
  emitProjectionVisibilityReceipt,
  emitTransitionSettlement,
  maskedContactField,
  mintEdgeCorrelation,
  phiReferenceField,
  publicDescriptor,
  readCorrelationFromHeaders,
  reconstructCorrelationChain,
  recordMetricSample,
  recordTraceSpan,
  serializeCorrelationHeaders,
} from "../src/index.ts";

describe("edge correlation spine", () => {
  it("reconstructs one browser-to-audit chain without leaking raw PHI", () => {
    const sink = new InMemoryTelemetrySink();
    const gatewayLogger = createStructuredTelemetryLogger({
      serviceRef: "api-gateway",
      environment: "ci-preview",
      sink,
    });
    const commandLogger = createStructuredTelemetryLogger({
      serviceRef: "command-api",
      environment: "ci-preview",
      sink,
    });
    const workerLogger = createStructuredTelemetryLogger({
      serviceRef: "projection-worker",
      environment: "ci-preview",
      sink,
    });

    const browser = mintEdgeCorrelation({
      environment: "ci-preview",
      serviceRef: "patient-web",
      hopKind: "browser",
      routeFamilyRef: "rf_patient_requests",
      audienceSurfaceRef: "audsurf_patient_authenticated_portal",
      requestMethod: "POST",
      requestPath: "/requests/submit",
      issuedAt: "2026-04-13T12:00:00Z",
    });
    const gateway = advanceCorrelationHop(browser, {
      hopKind: "gateway",
      environment: "ci-preview",
      serviceRef: "api-gateway",
      emittedAt: "2026-04-13T12:00:01Z",
    });
    gatewayLogger.info("gateway.request.accepted", {
      correlation: gateway,
      fields: {
        routeFamilyRef: controlPlaneField("rf_patient_requests"),
        requestRef: phiReferenceField("request_093_demo"),
        contactRoute: maskedContactField("patient@example.test"),
      },
    });
    recordTraceSpan(sink, {
      correlation: gateway,
      serviceRef: "api-gateway",
      environment: "ci-preview",
      spanName: "gateway.route.resolve",
      fields: {
        gatewaySurfaceRef: controlPlaneField("agws_patient_web"),
      },
    });

    const command = advanceCorrelationHop(gateway, {
      hopKind: "command_handler",
      environment: "ci-preview",
      serviceRef: "command-api",
      emittedAt: "2026-04-13T12:00:02Z",
    });
    commandLogger.info("command.accepted", {
      correlation: command,
      fields: {
        idempotencyKey: controlPlaneField("idem_093_demo"),
        requestRef: phiReferenceField("request_093_demo"),
      },
    });

    const eventBus = advanceCorrelationHop(command, {
      hopKind: "event_bus",
      environment: "ci-preview",
      serviceRef: "event-spine",
      emittedAt: "2026-04-13T12:00:03Z",
    });
    recordMetricSample(sink, {
      correlation: eventBus,
      serviceRef: "event-spine",
      environment: "ci-preview",
      metricName: "event_spine.publish.latency_ms",
      metricValue: 12,
      unit: "ms",
      fields: {
        queueRef: controlPlaneField("q_event_projection_live"),
      },
    });

    const worker = advanceCorrelationHop(eventBus, {
      hopKind: "worker",
      environment: "ci-preview",
      serviceRef: "projection-worker",
      emittedAt: "2026-04-13T12:00:04Z",
    });
    workerLogger.info("projection.worker.applied", {
      correlation: worker,
      fields: {
        projectionName: publicDescriptor("patient-home"),
        projectionVersionRef: controlPlaneField("proj_v093_demo"),
      },
    });

    const projection = advanceCorrelationHop(worker, {
      hopKind: "projection",
      environment: "ci-preview",
      serviceRef: "projection-store",
      emittedAt: "2026-04-13T12:00:05Z",
    });
    const frame = createUIEventCausalityFrame({
      correlation: projection,
      shellSlug: "patient-web",
      selectedAnchorRef: "request-timeline",
      continuityState: "live",
    });
    const checkpoint = createUIEventEmissionCheckpoint({
      frame,
      eventSequence: 1,
    });
    expect(checkpoint.eventSequence).toBe(1);

    const visibility = createUIProjectionVisibilityReceipt({
      frame,
      projectionVersionRef: "proj_v093_demo",
      visibilityState: "visible",
      selectedAnchorChangeClass: "unchanged",
      shellDecisionClass: "same_shell",
    });
    const visibilityHop = advanceCorrelationHop(projection, {
      hopKind: "ui_visibility_receipt",
      environment: "ci-preview",
      serviceRef: "patient-web",
      emittedAt: "2026-04-13T12:00:06Z",
    });
    emitProjectionVisibilityReceipt(sink, {
      correlation: visibilityHop,
      serviceRef: "patient-web",
      environment: "ci-preview",
      receipt: visibility,
    });

    const settlement = createUITransitionSettlementRecord({
      frame,
      projectionVisibilityRef: visibility.visibilityReceiptRef,
      auditRecordRef: "audit_093_demo",
      settlementState: "authoritative",
      authoritativeSource: "audit",
      authoritativeOutcomeState: "settled",
    });
    emitTransitionSettlement(sink, {
      correlation: visibilityHop,
      serviceRef: "patient-web",
      environment: "ci-preview",
      settlement,
    });

    const audit = advanceCorrelationHop(visibilityHop, {
      hopKind: "audit",
      environment: "ci-preview",
      serviceRef: "audit-ledger",
      emittedAt: "2026-04-13T12:00:07Z",
      replayState: "settled",
    });
    emitAuditCorrelationRecord(sink, {
      correlation: audit,
      serviceRef: "audit-ledger",
      environment: "ci-preview",
      auditRecordRef: "audit_093_demo",
      visibilityReceiptRef: visibility.visibilityReceiptRef,
      settlementRef: settlement.settlementRef,
    });

    const reconstructed = reconstructCorrelationChain(sink.list(), browser.edgeCorrelationId);
    expect(reconstructed.hopKinds).toEqual([
      "gateway",
      "command_handler",
      "event_bus",
      "worker",
      "ui_visibility_receipt",
      "audit",
    ]);
    expect(reconstructed.maskedEnvelopeCount).toBeGreaterThan(0);
    expect(reconstructed.blockedEnvelopeCount).toBe(0);
    expect(reconstructed.visibilityVisible).toBe(true);
    expect(reconstructed.settlementVisible).toBe(true);
    expect(reconstructed.finalReplayState).toBe("settled");

    const serialized = JSON.stringify(sink.list());
    expect(serialized).not.toContain("patient@example.test");
    expect(serialized).not.toContain("request_093_demo");
    expect(serialized).toContain(browser.edgeCorrelationId);
  });

  it("fails closed on missing protected correlation context", () => {
    expect(() => readCorrelationFromHeaders({}, { requireContext: true })).toThrow(
      /edge correlation context is required/i,
    );
  });

  it("serializes propagated headers and blocks raw phi classes", () => {
    const browser = mintEdgeCorrelation({
      environment: "local",
      serviceRef: "patient-web",
      requestMethod: "GET",
      requestPath: "/tracker",
      issuedAt: "2026-04-13T13:00:00Z",
    });
    const headers = serializeCorrelationHeaders(browser);
    expect(headers["x-vecells-edge-correlation-id"]).toBe(browser.edgeCorrelationId);
    expect(headers["x-vecells-causal-token"]).toBe(browser.causalToken);

    const sink = new InMemoryTelemetrySink();
    const logger = createStructuredTelemetryLogger({
      serviceRef: "patient-web",
      environment: "local",
      sink,
    });
    logger.warn("ui.disclosure.blocked", {
      correlation: advanceCorrelationHop(browser, {
        hopKind: "ui_visibility_receipt",
        serviceRef: "patient-web",
        environment: "local",
        emittedAt: "2026-04-13T13:00:01Z",
        replayState: "stale",
      }),
      fields: {
        blockedField: blockedRawPhiField(
          "phase-0-the-foundation-protocol.md#UITelemetryDisclosureFence",
        ),
        auditRecordRef: auditLinkField("audit_093_blocked"),
      },
    });

    const blocked = sink.list()[0];
    expect(blocked.disclosureFence.disclosureState).toBe("blocked");
    expect(blocked.replayState).toBe("stale");
  });
});
