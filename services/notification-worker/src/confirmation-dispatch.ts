import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "../../../packages/domain-kernel/src/index";
import {
  createPhase1ConfirmationDispatchService,
  createPhase1ConfirmationDispatchStore,
  type Phase1ConfirmationDispatchRepositories,
  type Phase1ConfirmationDeliveryEvidenceState,
  type Phase1ConfirmationTransportOutcome,
} from "../../../packages/domains/communications/src/index";
import {
  createReachabilityGovernorService,
  createReachabilityStore,
  type ReachabilityDependencies,
} from "@vecells/domain-identity-access";
import {
  InMemoryTelemetrySink,
  auditLinkField,
  controlPlaneField,
  createStructuredTelemetryLogger,
  maskedContactField,
  maskedRouteField,
  publicDescriptor,
  recordMetricSample,
  recordTraceSpan,
  type EdgeCorrelationContext,
} from "@vecells/observability";
import type { ServiceConfig } from "./config";

export type NotificationWebhookScenario =
  | "delivered"
  | "bounced"
  | "expired"
  | "suppressed"
  | "disputed";

export interface ProcessQueuedConfirmationInput {
  communicationEnvelopeRef: string;
  transportSettlementKey: string;
  workerRunRef: string;
  transportOutcome: Phase1ConfirmationTransportOutcome;
  providerCorrelationRef?: string | null;
  recordedAt: string;
  correlation: EdgeCorrelationContext;
}

export interface IngestConfirmationWebhookInput {
  communicationEnvelopeRef: string;
  deliveryEvidenceKey: string;
  webhookScenario: NotificationWebhookScenario;
  providerCorrelationRef?: string | null;
  observedAt: string;
  recordedAt: string;
  correlation: EdgeCorrelationContext;
}

export interface NotificationDispatchApplication {
  readonly repositories: Phase1ConfirmationDispatchRepositories;
  readonly reachabilityRepositories: ReachabilityDependencies;
  readonly communication: ReturnType<typeof createPhase1ConfirmationDispatchService>;
  readonly reachabilityGovernor: ReturnType<typeof createReachabilityGovernorService>;
  readonly telemetrySink: InMemoryTelemetrySink;
  processQueuedConfirmation(input: ProcessQueuedConfirmationInput): Promise<{
    transportSettlementId: string | null;
    communicationEnvelopeRef: string;
    receiptBridgeRef: string;
    replayed: boolean;
    skipped: boolean;
    eventTypes: readonly string[];
  }>;
  ingestConfirmationWebhook(input: IngestConfirmationWebhookInput): Promise<{
    deliveryEvidenceId: string;
    communicationEnvelopeRef: string;
    receiptBridgeRef: string;
    replayed: boolean;
    eventTypes: readonly string[];
  }>;
}

function webhookDeliveryEvidenceState(
  scenario: NotificationWebhookScenario,
): Phase1ConfirmationDeliveryEvidenceState {
  switch (scenario) {
    case "delivered":
      return "delivered";
    case "disputed":
      return "disputed";
    case "expired":
      return "expired";
    default:
      return "failed";
  }
}

function webhookObservationClass(scenario: NotificationWebhookScenario) {
  switch (scenario) {
    case "delivered":
      return {
        observationClass: "delivery_receipt" as const,
        outcomePolarity: "positive" as const,
        authorityWeight: "moderate" as const,
      };
    case "bounced":
      return {
        observationClass: "bounce" as const,
        outcomePolarity: "negative" as const,
        authorityWeight: "strong" as const,
      };
    case "suppressed":
      return {
        observationClass: "opt_out" as const,
        outcomePolarity: "negative" as const,
        authorityWeight: "strong" as const,
      };
    case "disputed":
      return {
        observationClass: "manual_dispute" as const,
        outcomePolarity: "ambiguous" as const,
        authorityWeight: "strong" as const,
      };
    case "expired":
      return {
        observationClass: "delivery_receipt" as const,
        outcomePolarity: "negative" as const,
        authorityWeight: "moderate" as const,
      };
  }
}

function telemetryFieldsForEnvelope(snapshot: {
  communicationEnvelopeId: string;
  requestRef: string;
  maskedDestination: string;
  currentContactRouteSnapshotRef: string | null;
  dispatchEligibilityState: string;
  queueState: string;
  authoritativeOutcomeState: string;
}) {
  return {
    communicationEnvelopeRef: auditLinkField(snapshot.communicationEnvelopeId),
    requestRef: auditLinkField(snapshot.requestRef),
    maskedDestination: maskedContactField(snapshot.maskedDestination),
    routeSnapshotRef:
      snapshot.currentContactRouteSnapshotRef === null
        ? controlPlaneField("missing")
        : maskedRouteField(snapshot.currentContactRouteSnapshotRef),
    dispatchEligibilityState: publicDescriptor(snapshot.dispatchEligibilityState),
    queueState: publicDescriptor(snapshot.queueState),
    authoritativeOutcomeState: publicDescriptor(snapshot.authoritativeOutcomeState),
  };
}

export function createNotificationDispatchApplication(
  config: Pick<ServiceConfig, "serviceName" | "environment" | "providerMode">,
  options?: {
    repositories?: Phase1ConfirmationDispatchRepositories;
    reachabilityRepositories?: ReachabilityDependencies;
    idGenerator?: BackboneIdGenerator;
    telemetrySink?: InMemoryTelemetrySink;
  },
) {
  const repositories = options?.repositories ?? createPhase1ConfirmationDispatchStore();
  const reachabilityRepositories =
    options?.reachabilityRepositories ?? createReachabilityStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("notification_worker_confirmation_dispatch");
  const communication = createPhase1ConfirmationDispatchService({
    repositories,
    idGenerator,
  });
  const reachabilityGovernor = createReachabilityGovernorService(
    reachabilityRepositories,
    idGenerator,
  );
  const telemetrySink = options?.telemetrySink ?? new InMemoryTelemetrySink();
  const telemetryLogger = createStructuredTelemetryLogger({
    serviceRef: config.serviceName,
    environment: config.environment,
    sink: telemetrySink,
  });

  const application: NotificationDispatchApplication = {
    repositories,
    reachabilityRepositories,
    communication,
    reachabilityGovernor,
    telemetrySink,
    async processQueuedConfirmation(input: ProcessQueuedConfirmationInput) {
      const before = await communication.getCommunicationEnvelope(input.communicationEnvelopeRef);
      if (!before) {
        throw new Error(`Confirmation envelope ${input.communicationEnvelopeRef} was not found.`);
      }
      recordTraceSpan(telemetrySink, {
        correlation: input.correlation,
        serviceRef: config.serviceName,
        environment: config.environment,
        spanName: "notification.confirmation.dispatch",
        fields: telemetryFieldsForEnvelope(before.toSnapshot()),
      });
      const result = await communication.dispatchQueuedConfirmation({
        communicationEnvelopeRef: input.communicationEnvelopeRef,
        transportSettlementKey: input.transportSettlementKey,
        workerRunRef: input.workerRunRef,
        providerMode: config.providerMode,
        transportOutcome: input.transportOutcome,
        providerCorrelationRef: input.providerCorrelationRef ?? null,
        recordedAt: input.recordedAt,
      });
      const after = result.envelope.toSnapshot();
      telemetryLogger.info("notification_confirmation_dispatch_settled", {
        correlation: input.correlation,
        fields: {
          ...telemetryFieldsForEnvelope(after),
          replayed: controlPlaneField(result.replayed),
          skipped: controlPlaneField(result.skipped),
          transportOutcome: publicDescriptor(
            result.transportSettlement?.toSnapshot().outcome ?? "not_started",
          ),
        },
      });
      const metrics = await communication.buildMetricsSnapshot(input.recordedAt);
      recordMetricSample(telemetrySink, {
        correlation: input.correlation,
        serviceRef: config.serviceName,
        environment: config.environment,
        metricName: "notification.provider_acceptance_rate",
        metricValue: metrics.providerAcceptanceRate,
        unit: "ratio",
        fields: {
          queueDepth: controlPlaneField(metrics.queueDepth),
          queueBlockageCount: controlPlaneField(metrics.queueBlockageCount),
        },
      });
      return {
        transportSettlementId: result.transportSettlement?.transportSettlementId ?? null,
        communicationEnvelopeRef: result.envelope.communicationEnvelopeId,
        receiptBridgeRef: result.receiptBridge.receiptBridgeId,
        replayed: result.replayed,
        skipped: result.skipped,
        eventTypes: result.events.map((event) => event.eventType),
      };
    },
    async ingestConfirmationWebhook(input: IngestConfirmationWebhookInput) {
      const envelope = await communication.getCommunicationEnvelope(input.communicationEnvelopeRef);
      if (!envelope) {
        throw new Error(`Confirmation envelope ${input.communicationEnvelopeRef} was not found.`);
      }

      const envelopeSnapshot = envelope.toSnapshot();
      if (
        envelopeSnapshot.reachabilityDependencyRef &&
        envelopeSnapshot.currentContactRouteSnapshotRef
      ) {
        const observationMapping = webhookObservationClass(input.webhookScenario);
        await reachabilityGovernor.recordObservation({
          reachabilityDependencyRef: envelopeSnapshot.reachabilityDependencyRef,
          contactRouteSnapshotRef: envelopeSnapshot.currentContactRouteSnapshotRef,
          observationClass: observationMapping.observationClass,
          observationSourceRef: `notification-worker:${config.providerMode}`,
          observedAt: input.observedAt,
          recordedAt: input.recordedAt,
          outcomePolarity: observationMapping.outcomePolarity,
          authorityWeight: observationMapping.authorityWeight,
          evidenceRef: input.deliveryEvidenceKey,
        });
        const refreshed = await reachabilityGovernor.refreshDependencyAssessment({
          reachabilityDependencyRef: envelopeSnapshot.reachabilityDependencyRef,
          contactRouteSnapshotRef: envelopeSnapshot.currentContactRouteSnapshotRef,
          assessedAt: input.recordedAt,
        });
        await communication.refreshRouteTruth({
          communicationEnvelopeRef: input.communicationEnvelopeRef,
          currentContactRouteSnapshotRef: refreshed.dependency.toSnapshot().currentContactRouteSnapshotRef,
          currentReachabilityAssessmentRef:
            refreshed.assessment.reachabilityAssessmentId,
          routeAuthorityState: refreshed.assessment.toSnapshot().routeAuthorityState,
          reachabilityAssessmentState: refreshed.assessment.toSnapshot().assessmentState,
          deliveryRiskState: refreshed.assessment.toSnapshot().deliveryRiskState,
          recordedAt: input.recordedAt,
          reasonCodes: [refreshed.assessment.toSnapshot().dominantReasonCode],
        });
      }

      const result = await communication.recordDeliveryEvidence({
        communicationEnvelopeRef: input.communicationEnvelopeRef,
        deliveryEvidenceKey: input.deliveryEvidenceKey,
        evidenceSource: "provider_delivery_webhook",
        providerCorrelationRef: input.providerCorrelationRef ?? null,
        deliveryEvidenceState: webhookDeliveryEvidenceState(input.webhookScenario),
        observedAt: input.observedAt,
        recordedAt: input.recordedAt,
      });
      telemetryLogger.info("notification_confirmation_webhook_recorded", {
        correlation: input.correlation,
        fields: {
          ...telemetryFieldsForEnvelope(result.envelope.toSnapshot()),
          webhookScenario: publicDescriptor(input.webhookScenario),
          replayed: controlPlaneField(result.replayed),
        },
      });
      const metrics = await communication.buildMetricsSnapshot(input.recordedAt);
      recordMetricSample(telemetrySink, {
        correlation: input.correlation,
        serviceRef: config.serviceName,
        environment: config.environment,
        metricName: "notification.delivery_evidence_rate",
        metricValue: metrics.deliveryEvidenceRate,
        unit: "ratio",
        fields: {
          deliveredCount: controlPlaneField(metrics.deliveredCount),
          failureCount: controlPlaneField(metrics.failureCount),
          receiptRecoveryRequiredCount: controlPlaneField(
            metrics.receiptRecoveryRequiredCount,
          ),
        },
      });
      return {
        deliveryEvidenceId: result.deliveryEvidence.deliveryEvidenceId,
        communicationEnvelopeRef: result.envelope.communicationEnvelopeId,
        receiptBridgeRef: result.receiptBridge.receiptBridgeId,
        replayed: result.replayed,
        eventTypes: result.events.map((event) => event.eventType),
      };
    },
  };

  return application;
}
