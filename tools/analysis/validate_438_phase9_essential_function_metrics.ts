import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  createPhase9EssentialFunctionMetricsFixture,
  validateEssentialFunctionMetricAdapters,
  type Phase9EssentialFunctionMetricsFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-essential-function-metrics.ts",
  "data/contracts/438_phase9_essential_function_metrics_contract.json",
  "data/fixtures/438_phase9_essential_function_metrics_fixtures.json",
  "data/analysis/438_phase9_essential_function_metrics_summary.md",
  "data/analysis/438_algorithm_alignment_notes.md",
  "data/analysis/438_metric_lifecycle_event_adapter_matrix.csv",
  "tools/test/run_phase9_essential_function_metrics.ts",
  "tools/analysis/validate_438_phase9_essential_function_metrics.ts",
  "tests/unit/438_essential_function_metrics.spec.ts",
  "tests/integration/438_essential_function_metrics_artifacts.spec.ts",
];

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:essential-function-metrics"] ===
    "pnpm exec tsx ./tools/test/run_phase9_essential_function_metrics.ts && pnpm exec vitest run tests/unit/438_essential_function_metrics.spec.ts tests/integration/438_essential_function_metrics_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:essential-function-metrics",
);
assert(
  packageJson.scripts?.["validate:438-phase9-essential-function-metrics"] ===
    "pnpm exec tsx ./tools/analysis/validate_438_phase9_essential_function_metrics.ts",
  "PACKAGE_SCRIPT_MISSING:validate:438-phase9-essential-function-metrics",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_438_/m.test(checklist), "CHECKLIST_TASK_438_NOT_CLAIMED_OR_COMPLETE");

assert(
  readJson<{ schemaVersion?: string }>("data/contracts/432_phase9_assurance_ledger_contracts.json")
    .schemaVersion === "432.phase9.assurance-ledger-contracts.v1",
  "PHASE9_ASSURANCE_CONTRACTS_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>(
    "data/contracts/433_phase9_operational_projection_contracts.json",
  ).schemaVersion === "433.phase9.operational-projection-contracts.v1",
  "PHASE9_OPERATIONAL_CONTRACTS_MISSING_OR_DRIFTED",
);
assert(
  readJson<{ schemaVersion?: string }>(
    "data/contracts/437_phase9_operational_projection_engine_contract.json",
  ).schemaVersion === "437.phase9.operational-projection-engine.v1",
  "PHASE9_OPERATIONAL_PROJECTION_ENGINE_MISSING_OR_DRIFTED",
);

const contract = readJson<{
  schemaVersion?: string;
  projectionEngineVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  metricInputs?: readonly { eventFamily: string; sourceObject: string; sourceProjection: string }[];
  producedObjects?: readonly string[];
  requiredMetricSnapshotLineageFields?: readonly string[];
  dashboardDtoFields?: readonly string[];
  alertHooks?: readonly { alertCode: string; metricFamily: string }[];
  deterministicReplay?: {
    duplicateEventRefs?: readonly string[];
    duplicateReceiptCount?: number;
    lateEventRefs?: readonly string[];
    lateConversionRate?: number;
    incompleteLifecycleTrustState?: string;
  };
  noGapArtifactRequired?: boolean;
}>("data/contracts/438_phase9_essential_function_metrics_contract.json");
assert(contract.schemaVersion === PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION, "CONTRACT_SCHEMA_VERSION_DRIFT");
assert(
  contract.projectionEngineVersion === "437.phase9.operational-projection-engine.v1",
  "PROJECTION_ENGINE_LINK_MISSING",
);
for (const sourceRef of [
  "#9A",
  "#9B",
  "phase-4-the-booking-engine",
  "phase-6-the-pharmacy-loop",
  "patient-account-and-communications",
  "437_phase9_operational_projection_engine_contract",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const family of [
  "waitlist_lifecycle",
  "pharmacy_lifecycle",
  "notification_lifecycle",
  "assurance_metric_trust",
]) {
  assert(contract.metricInputs?.some((input) => input.eventFamily === family), `EVENT_FAMILY_MISSING:${family}`);
}
for (const sourceObject of [
  "WaitlistOffer",
  "PharmacyBounceBackRecord",
  "CommunicationEnvelope",
  "AssuranceSliceTrustRecord",
]) {
  assert(contract.metricInputs?.some((input) => input.sourceObject === sourceObject), `SOURCE_OBJECT_MISSING:${sourceObject}`);
}
for (const objectName of [
  "WaitlistConversionMetricSnapshot",
  "PharmacyBounceBackMetricSnapshot",
  "NotificationDeliveryMetricSnapshot",
  "MetricAnomalySnapshot",
  "Phase9MetricAlertHook",
  "Phase9MetricDashboardDto",
  "Phase9OperationalProjectionResult",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const field of [
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
]) {
  assert(contract.requiredMetricSnapshotLineageFields?.includes(field), `LINEAGE_FIELD_MISSING:${field}`);
}
for (const field of [
  "topLineValue",
  "denominator",
  "window",
  "riskOrConfidenceBand",
  "drillInSeed",
  "allowedInvestigationScope",
  "supportingLifecycleCounts",
  "blockedOrDegradedExplanation",
]) {
  assert(contract.dashboardDtoFields?.includes(field), `DASHBOARD_DTO_FIELD_MISSING:${field}`);
}
for (const alertCode of [
  "waitlist_conversion_drop",
  "waitlist_offer_expiry_rise",
  "pharmacy_urgent_return_backlog",
  "pharmacy_bounce_back_reason_spike",
  "notification_delivery_failure_spike",
  "notification_receipt_reply_latency_degradation",
  "notification_channel_transport_failure",
  "slice_access_inequity_persistence",
]) {
  assert(contract.alertHooks?.some((hook) => hook.alertCode === alertCode), `ALERT_HOOK_MISSING:${alertCode}`);
}
assert(
  contract.deterministicReplay?.duplicateEventRefs?.includes("evt-438-duplicate-receipt"),
  "DUPLICATE_EVENT_NOT_RECORDED",
);
assert(contract.deterministicReplay?.duplicateReceiptCount === 1, "DUPLICATE_NOTIFICATION_DOUBLE_COUNTED");
assert(
  contract.deterministicReplay?.lateEventRefs?.includes("evt-438-late-booking"),
  "LATE_BOOKING_COMMIT_NOT_RECORDED",
);
assert((contract.deterministicReplay?.lateConversionRate ?? 0) > 0.5, "LATE_BOOKING_COMMIT_NOT_APPLIED");
assert(
  contract.deterministicReplay?.incompleteLifecycleTrustState === "degraded",
  "INCOMPLETE_LIFECYCLE_DID_NOT_DEGRADE_TRUST",
);
assert(contract.noGapArtifactRequired === true, "GAP_ARTIFACT_POSTURE_MISSING");

const fixture = readJson<Phase9EssentialFunctionMetricsFixture>(
  "data/fixtures/438_phase9_essential_function_metrics_fixtures.json",
);
const recomputed = createPhase9EssentialFunctionMetricsFixture();
assert(fixture.schemaVersion === PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION, "FIXTURE_SCHEMA_VERSION_DRIFT");
assert(fixture.baselineResult.resultHash === recomputed.baselineResult.resultHash, "BASELINE_HASH_DRIFT");
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(
  fixture.baselineResult.projectionResult.projectionHealthSnapshot.projectionHealthSnapshotId ===
    recomputed.baselineResult.projectionResult.projectionHealthSnapshot.projectionHealthSnapshotId,
  "PROJECTION_HEALTH_LINK_DRIFT",
);
assert(validateEssentialFunctionMetricAdapters(fixture.adapters).length === 0, "FIXTURE_ADAPTERS_INVALID");
assert(fixture.baselineResult.waitlistConversion.offersAccepted === 1, "WAITLIST_ACCEPTANCE_COUNT_DRIFT");
assert(fixture.baselineResult.waitlistConversion.bookingsCreatedFromOffers === 1, "WAITLIST_CONVERSION_COUNT_DRIFT");
assert(fixture.baselineResult.waitlistConversion.offersExpired === 1, "WAITLIST_EXPIRY_COUNT_DRIFT");
assert(fixture.baselineResult.pharmacyBounceBack.urgentReturnCount === 1, "URGENT_RETURN_COUNT_DRIFT");
assert(fixture.baselineResult.pharmacyBounceBack.noContactCount === 1, "NO_CONTACT_COUNT_DRIFT");
assert(fixture.baselineResult.notificationDelivery.providerAckFailure === 1, "PROVIDER_ACK_FAILURE_COUNT_DRIFT");
assert(fixture.baselineResult.notificationDelivery.patientReceiptEnvelope === 1, "PATIENT_RECEIPT_COUNT_DRIFT");
assert(
  fixture.incompleteLifecycleResult.waitlistConversion.completenessState === "partial",
  "INCOMPLETE_LIFECYCLE_COMPLETENESS_NOT_PARTIAL",
);

const gapPath =
  "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_438_METRIC_LIFECYCLE_EVENT.json";
assert(!fs.existsSync(path.join(root, gapPath)), "UNEXPECTED_METRIC_LIFECYCLE_EVENT_GAP");

const sourceText = readText(
  "packages/domains/analytics_assurance/src/phase9-essential-function-metrics.ts",
);
for (const token of [
  "Phase9EssentialFunctionMetricsEngine",
  "computePhase9EssentialFunctionMetrics",
  "getDefaultEssentialFunctionMetricAdapters",
  "validateEssentialFunctionMetricAdapters",
  "projectPhase9OperationalWindow",
  "CROSS_TENANT_METRIC_AGGREGATION_DENIED",
]) {
  assert(sourceText.includes(token), `SOURCE_TOKEN_MISSING:${token}`);
}

const testsText = `${readText("tests/unit/438_essential_function_metrics.spec.ts")}\n${readText(
  "tests/integration/438_essential_function_metrics_artifacts.spec.ts",
)}`;
for (const token of [
  "waitlist offer accepted -> conversion counted once",
  "offer expired -> no booking conversion",
  "notification delivered but not received -> receipt not counted",
  "provider ACK failure -> delivery risk updated",
  "pharmacy urgent bounce-back -> urgent return metric and backlog update",
  "routine bounce-back -> correct priority band",
  "no-contact loop -> no false closure",
  "reopened pharmacy loop -> lifecycle counted without double-count",
  "late booking commit updates conversion window deterministically",
  "duplicate notification event deduped",
  "incomplete lifecycle evidence degrades metric trust",
  "cross-tenant aggregation denied",
  "dashboard DTO contains no PHI",
]) {
  assert(testsText.includes(token), `REQUIRED_TEST_TOKEN_MISSING:${token}`);
}

const summary = readText("data/analysis/438_phase9_essential_function_metrics_summary.md");
for (const token of [
  "Schema version",
  "Adapter count",
  "Baseline result hash",
  "Metric observations are fed back",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}

const matrix = readText("data/analysis/438_metric_lifecycle_event_adapter_matrix.csv");
assert(matrix.includes("eventFamily,sourceObject,sourceProjection"), "ADAPTER_MATRIX_HEADER_MISSING");
assert(matrix.includes("waitlist_lifecycle,WaitlistOffer"), "ADAPTER_MATRIX_WAITLIST_MISSING");
assert(matrix.includes("pharmacy_lifecycle,PharmacyBounceBackRecord"), "ADAPTER_MATRIX_PHARMACY_MISSING");
assert(matrix.includes("notification_lifecycle,CommunicationEnvelope"), "ADAPTER_MATRIX_NOTIFICATION_MISSING");

console.log("438 phase9 essential function metrics validated.");
