import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  createPhase9EssentialFunctionMetricsFixture,
  phase9EssentialFunctionMetricAdapterMatrixCsv,
  phase9EssentialFunctionMetricsSummary,
  validateEssentialFunctionMetricAdapters,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "438_phase9_essential_function_metrics_contract.json",
);
const fixturePath = path.join(
  fixturesDir,
  "438_phase9_essential_function_metrics_fixtures.json",
);
const summaryPath = path.join(analysisDir, "438_phase9_essential_function_metrics_summary.md");
const notesPath = path.join(analysisDir, "438_algorithm_alignment_notes.md");
const adapterMatrixPath = path.join(
  analysisDir,
  "438_metric_lifecycle_event_adapter_matrix.csv",
);

const fixture = createPhase9EssentialFunctionMetricsFixture();
const adapterErrors = validateEssentialFunctionMetricAdapters(fixture.adapters);
if (adapterErrors.length > 0) {
  throw new Error(`Essential function metric adapter coverage failed: ${adapterErrors.join("; ")}`);
}

const contractArtifact = {
  schemaVersion: PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  projectionEngineVersion: fixture.baselineResult.projectionEngineVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  metricInputs: fixture.adapters.map((adapter) => ({
    eventFamily: adapter.eventFamily,
    sourceObject: adapter.sourceObject,
    sourceProjection: adapter.sourceProjection,
    requiredFields: adapter.requiredFields,
    orderingKey: adapter.orderingKey,
    dedupeKey: adapter.dedupeKey,
    tenantScope: adapter.tenantScope,
    timestampSemantics: adapter.timestampSemantics,
    authoritativeTruthBoundary: adapter.authoritativeTruthBoundary,
    sourceTrustDependency: adapter.sourceTrustDependency,
  })),
  producedObjects: [
    "WaitlistConversionMetricSnapshot",
    "PharmacyBounceBackMetricSnapshot",
    "NotificationDeliveryMetricSnapshot",
    "MetricAnomalySnapshot",
    "Phase9MetricAlertHook",
    "Phase9MetricDashboardDto",
    "Phase9OperationalProjectionResult",
  ],
  requiredMetricSnapshotLineageFields: [
    "sourceEventRefs",
    "sourceWindowHash",
    "metricDefinitionRef",
    "tenantId",
    "scopeRef",
    "aggregationWindow",
    "normalizationVersionRef",
    "trustState",
    "completenessState",
    "projectionHealthRef",
    "graphVerdictRef",
    "blockingRefs",
  ],
  dashboardDtoFields: [
    "topLineValue",
    "denominator",
    "window",
    "trend",
    "riskOrConfidenceBand",
    "stateLabel",
    "stateReason",
    "drillInSeed",
    "allowedInvestigationScope",
    "supportingLifecycleCounts",
    "blockedOrDegradedExplanation",
  ],
  alertHooks: fixture.baselineResult.alertHooks.map((hook) => ({
    alertCode: hook.alertCode,
    metricFamily: hook.metricFamily,
    anomalyRef: hook.anomalyRef,
  })),
  deterministicReplay: {
    baselineResultHash: fixture.baselineResult.resultHash,
    replayHash: fixture.replayHash,
    duplicateEventRefs: fixture.duplicateNotificationResult.duplicateEventRefs,
    duplicateReceiptCount:
      fixture.duplicateNotificationResult.notificationDelivery.patientReceiptEnvelope,
    lateEventRefs: fixture.lateBookingCommitResult.lateEventRefs,
    lateConversionRate: fixture.lateBookingCommitResult.waitlistConversion.conversionRate,
    incompleteLifecycleTrustState:
      fixture.incompleteLifecycleResult.waitlistConversion.trustState,
  },
  noPhiPosture: {
    dashboardDtosAreAggregateOnly: true,
    drillInsCarryPurposeScopedSeedsOnly: true,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9EssentialFunctionMetricsSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Essential Function Metrics Algorithm Alignment",
    "",
    "The 438 metrics engine consumes lifecycle events from the existing waitlist, pharmacy, notification, conversation-settlement, assurance-trust, and graph-verdict projections. No new lifecycle interface gap artifact is required.",
    "",
    "Waitlist conversion counts accepted offers only when an offer lifecycle has a booking commit. Expired, withdrawn, declined, or suppressed auto-fill paths remain in the denominator without becoming false conversions.",
    "",
    "Pharmacy bounce-back metrics keep dispatch, outcome, urgent return, routine return, unable-to-contact, staff review, safe action, and reopen states separate so no-contact loops cannot close silently and reopened loops do not double-count the original bounce-back.",
    "",
    "Notification metrics separate communication envelope creation, transport acceptance, provider acknowledgement, delivery, patient receipt, retries, and patient reply settlement. Provider acknowledgement failure updates delivery risk without counting a patient receipt.",
    "",
    "Every snapshot carries source event refs, a bounded source window hash, metric definition ref, tenant and scope, normalization version, trust and completeness state, projection health ref, graph verdict ref, and explicit blockers.",
    "",
    "Metric observations are fed into the task 437 operational projection engine so dashboards and alerts share one projection health posture instead of forming a silo.",
    "",
  ].join("\n"),
);
fs.writeFileSync(
  adapterMatrixPath,
  phase9EssentialFunctionMetricAdapterMatrixCsv(fixture.adapters),
);

console.log(`Phase 9 essential function metrics contract: ${path.relative(root, contractPath)}`);
console.log(`Baseline result hash: ${fixture.baselineResult.resultHash}`);
console.log(`Replay hash: ${fixture.replayHash}`);
