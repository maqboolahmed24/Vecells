import { createHash } from "node:crypto";

export type Phase8TrustFixtureCategory = "trust_envelope" | "feedback_chain" | "visible_rollout";
export type Phase8TrustRouteFamily =
  | "triage"
  | "more_info"
  | "booking"
  | "waitlist"
  | "pharmacy"
  | "communications"
  | "support_replay"
  | "assurance_admin";
export type Phase8TrustAudienceSurface =
  | "workspace_queue"
  | "workspace_task"
  | "assistive_stage"
  | "decision_dock"
  | "draft_preview"
  | "ops_summary"
  | "release_admin_card";
export type Phase8TrustState =
  | "trusted"
  | "low_confidence"
  | "ungrounded"
  | "stale"
  | "drift_warning"
  | "fairness_variance"
  | "red_flag_blocked"
  | "quarantined"
  | "frozen"
  | "rolled_back"
  | "partial_disclosure";
export type Phase8TrustEnvelopeState = "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen" | "blocked";
export type Phase8ConfidenceBand = "suppressed" | "low_confidence" | "guarded" | "grounded" | "strong";
export type Phase8FreshnessState = "current" | "aging" | "stale" | "invalidated";
export type Phase8CitationState = "valid" | "invalid" | "hidden" | "denied";
export type Phase8InsertionPermission = "enabled" | "observe_only" | "blocked";
export type Phase8FeedbackEventType =
  | "accepted_suggestion"
  | "rejected_suggestion"
  | "edited_suggestion"
  | "override_reason"
  | "reliance_without_insertion"
  | "rationale_quality"
  | "citation_correctness"
  | "stale_frozen_feedback"
  | "feedback_cancellation";
export type Phase8DraftState = "none" | "suggested" | "inserted_pending_human" | "edited_by_clinician" | "undone" | "cancelled";
export type Phase8RolloutScenario =
  | "shadow_only"
  | "internal_only"
  | "pilot_cohort"
  | "tenant_limited_pilot"
  | "route_family_limited_pilot"
  | "frozen_rollout"
  | "rollback"
  | "global_disable"
  | "publication_mismatch"
  | "expired_slice";
export type Phase8RolloutRung = "shadow_only" | "visible_summary" | "visible_insert" | "visible_commit" | "frozen" | "withdrawn";
export type Phase8SliceMembershipState = "in_slice" | "out_of_slice" | "unknown" | "expired";
export type Phase8RolloutPublicationState = "published" | "stale" | "withdrawn" | "blocked";
export type Phase8RolloutRenderPosture = "shadow_only" | "visible" | "observe_only" | "read_only_provenance" | "placeholder_only" | "hidden" | "blocked";
export type Phase8FailureSeverity = "low" | "medium" | "high" | "critical";
export type Phase8TrustRolloutFailureType =
  | "trust_envelope_missing"
  | "confidence_without_provenance"
  | "provenance_disclosure_violation"
  | "freshness_mismatch"
  | "trust_state_flattened"
  | "blocked_insert_affordance"
  | "propagation_state_lost"
  | "stale_cache_overwrite"
  | "feedback_record_missing"
  | "feedback_idempotency_missing"
  | "feedback_authoritative_mutation"
  | "feedback_audit_missing"
  | "rollout_verdict_mismatch"
  | "rollout_publication_not_pinned"
  | "ops_release_language_drift"
  | "hidden_dom_leak"
  | "prohibited_network_mutation"
  | "artifact_or_navigation_policy_missing"
  | "audit_evidence_missing"
  | "fixture_expectation_mismatch";

export interface Phase8TrustEnvelope {
  trustEnvelopeRef: string;
  trustState: Phase8TrustState;
  envelopeState: Phase8TrustEnvelopeState;
  confidenceBand: Phase8ConfidenceBand;
  riskState: "none" | "watch" | "block";
  rationaleRef: string;
  provenanceRefs: readonly string[];
  freshnessState: Phase8FreshnessState;
  citationState: Phase8CitationState;
  calibrationState: "current" | "missing" | "drifted";
  disclosureScope: "full" | "partial" | "denied";
  insertionPermission: Phase8InsertionPermission;
}

export interface Phase8TrustPropagationSurface {
  surface: Phase8TrustAudienceSurface;
  trustLabel: string;
  confidenceLabel: string;
  provenanceVisible: boolean;
  freshnessLabel: Phase8FreshnessState;
  insertionControlVisible: boolean;
  rolloutBadge: string;
  hiddenDomText: string;
}

export interface Phase8FeedbackRecord {
  eventType: Phase8FeedbackEventType;
  actorRef: string;
  actorRole: "clinician" | "senior_clinician" | "support" | "admin" | "governance";
  routeFamily: Phase8TrustRouteFamily;
  suggestionRef: string;
  outputRef: string;
  trustEnvelopeRef: string;
  visibleStateAtAction: Phase8TrustEnvelopeState;
  previousDraftState: Phase8DraftState;
  resultingDraftState: Phase8DraftState;
  auditRef: string;
  assuranceEvidenceRef: string;
  idempotencyKey: string;
  dedupeKey: string;
  overrideReasonRef?: string;
  authoritativeMutation: boolean;
}

export interface Phase8RolloutVerdict {
  scenario: Phase8RolloutScenario;
  rolloutSliceContractRef: string;
  rolloutVerdictRef: string;
  routeFamily: Phase8TrustRouteFamily;
  releaseCohortRef: string;
  tenantRef: string;
  sliceMembershipState: Phase8SliceMembershipState;
  rolloutRung: Phase8RolloutRung;
  publicationState: Phase8RolloutPublicationState;
  runtimePublicationBundleState: "current" | "stale" | "missing" | "rolled_back";
  renderPosture: Phase8RolloutRenderPosture;
  insertPosture: Phase8InsertionPermission;
  staffVisibility: Phase8RolloutRenderPosture;
  opsLanguage: string;
  releaseLanguage: string;
  explanation: string;
  artifactPresentationContractRef?: string;
  outboundNavigationGrantRef?: string;
}

export interface Phase8TrustRolloutExpected {
  trustLabel: string;
  confidenceBand: Phase8ConfidenceBand;
  rationaleProvenanceChips: readonly string[];
  freshnessState: Phase8FreshnessState;
  insertionPermission: Phase8InsertionPermission;
  feedbackOptions: readonly Phase8FeedbackEventType[];
  auditEvents: readonly string[];
  evidenceEvents: readonly string[];
  opsVisibility: Phase8RolloutRenderPosture;
  releaseVisibility: Phase8RolloutRenderPosture;
  rolloutLanguage: string;
  blockedActions: readonly string[];
  noHiddenLeakTokens: readonly string[];
}

export interface Phase8TrustRolloutObserved {
  trustLabel: string;
  confidenceBand: Phase8ConfidenceBand;
  rationaleProvenanceChips: readonly string[];
  freshnessState: Phase8FreshnessState;
  insertionPermission: Phase8InsertionPermission;
  feedbackOptions: readonly Phase8FeedbackEventType[];
  auditEvents: readonly string[];
  evidenceEvents: readonly string[];
  opsVisibility: Phase8RolloutRenderPosture;
  releaseVisibility: Phase8RolloutRenderPosture;
  rolloutLanguage: string;
  blockedActions: readonly string[];
  propagationSurfaces: readonly Phase8TrustPropagationSurface[];
  hiddenDomText: string;
  networkRequests: readonly string[];
}

export interface Phase8TrustRolloutFixture {
  fixtureId: string;
  category: Phase8TrustFixtureCategory;
  title: string;
  routeFamily: Phase8TrustRouteFamily;
  primarySurface: Phase8TrustAudienceSurface;
  syntheticDataOnly: true;
  sourceBlueprintRefs: readonly string[];
  trustEnvelope: Phase8TrustEnvelope;
  feedbackRecord?: Phase8FeedbackRecord;
  rolloutVerdict: Phase8RolloutVerdict;
  expected: Phase8TrustRolloutExpected;
  observed: Phase8TrustRolloutObserved;
}

export interface Phase8TrustRolloutCorpus {
  corpusId: string;
  corpusVersion: string;
  fixtureVersion: string;
  suiteVersion: string;
  seededClock: string;
  sourceBlueprintRefs: readonly string[];
  fixtures: readonly Phase8TrustRolloutFixture[];
}

export interface Phase8TrustRolloutFailure {
  fixtureId: string;
  category: Phase8TrustFixtureCategory;
  failureType: Phase8TrustRolloutFailureType;
  severity: Phase8FailureSeverity;
  sourceRef: string;
  observedRef: string;
  requiredAlgorithmRule: string;
  humanReadableReason: string;
  auditEvidenceRef: string;
}

export interface Phase8TrustRolloutFixtureVerdict {
  fixtureId: string;
  category: Phase8TrustFixtureCategory;
  routeFamily: Phase8TrustRouteFamily;
  trustState: Phase8TrustState;
  rolloutScenario: Phase8RolloutScenario;
  passed: boolean;
  failureCount: number;
  failures: readonly Phase8TrustRolloutFailure[];
  auditEvidenceRefs: readonly string[];
}

export interface Phase8TrustRolloutThresholdDefinition {
  metric: string;
  comparator: "gte" | "lte" | "eq";
  threshold: number;
  requiredAlgorithmRule: string;
  temporaryFallback?: boolean;
}

export interface Phase8TrustRolloutThresholdConfig {
  thresholdSetRef: string;
  thresholdVersion: string;
  suiteVersion: string;
  seededClock: string;
  thresholds: readonly Phase8TrustRolloutThresholdDefinition[];
}

export interface Phase8TrustRolloutThresholdComparison extends Phase8TrustRolloutThresholdDefinition {
  observed: number;
  passed: boolean;
}

export interface Phase8TrustRolloutReportMetadata {
  commit: string;
  generatedAt: string;
  evaluatorVersion: string;
  command: string;
}

export interface Phase8TrustRolloutReport {
  reportId: string;
  reportVersion: string;
  corpusId: string;
  corpusVersion: string;
  fixtureVersion: string;
  suiteVersion: string;
  evaluatorVersion: string;
  thresholdSetRef: string;
  seededClock: string;
  commit: string;
  command: string;
  generatedAt: string;
  evidenceArtifactRef: string;
  summary: {
    fixtureCount: number;
    passedFixtureCount: number;
    unexpectedFailureCount: number;
    thresholdPassCount: number;
    thresholdCount: number;
    suitePassed: boolean;
  };
  metrics: Record<string, number>;
  thresholdComparisons: readonly Phase8TrustRolloutThresholdComparison[];
  verdicts: readonly Phase8TrustRolloutFixtureVerdict[];
  failedFixtures: readonly string[];
}

export const PHASE8_TRUST_ROLLOUT_EVALUATOR_VERSION = "phase8-trust-rollout-regression-430.v1";

export const PHASE8_TRUST_ROLLOUT_PROHIBITED_ENDPOINTS = [
  "/api/patient/send",
  "/api/booking/commit",
  "/api/pharmacy/outcome",
  "/api/task/close",
  "/api/request/save-authoritative",
] as const;

const DISTINCT_TRUST_LABELS: Readonly<Record<Phase8TrustState, string>> = {
  trusted: "Grounded",
  low_confidence: "Low confidence",
  ungrounded: "Ungrounded",
  stale: "Stale",
  drift_warning: "Drift warning",
  fairness_variance: "Fairness variance",
  red_flag_blocked: "Blocked red flag",
  quarantined: "Quarantined",
  frozen: "Frozen",
  rolled_back: "Rolled back",
  partial_disclosure: "Partial disclosure",
};

export function expectedTrustLabel(trustState: Phase8TrustState): string {
  return DISTINCT_TRUST_LABELS[trustState];
}

export function evaluateRolloutVerdict(verdict: Phase8RolloutVerdict): {
  renderPosture: Phase8RolloutRenderPosture;
  insertPosture: Phase8InsertionPermission;
  reasonCodes: readonly string[];
} {
  const reasonCodes: string[] = [];
  if (verdict.publicationState !== "published" || verdict.runtimePublicationBundleState !== "current") {
    reasonCodes.push("runtime_publication_not_current");
  }
  if (verdict.sliceMembershipState !== "in_slice") {
    reasonCodes.push(`slice_${verdict.sliceMembershipState}`);
  }
  if (verdict.rolloutRung === "frozen" || verdict.rolloutRung === "withdrawn") {
    reasonCodes.push(`rollout_${verdict.rolloutRung}`);
  }
  if (verdict.scenario === "global_disable") {
    reasonCodes.push("global_disable");
  }

  if (
    verdict.publicationState !== "published" ||
    verdict.runtimePublicationBundleState !== "current" ||
    verdict.scenario === "global_disable" ||
    verdict.sliceMembershipState === "unknown" ||
    verdict.sliceMembershipState === "expired"
  ) {
    return {
      renderPosture: verdict.scenario === "rollback" ? "read_only_provenance" : "blocked",
      insertPosture: "blocked",
      reasonCodes,
    };
  }
  if (verdict.sliceMembershipState === "out_of_slice" || verdict.rolloutRung === "shadow_only") {
    return { renderPosture: "shadow_only", insertPosture: "blocked", reasonCodes };
  }
  if (verdict.rolloutRung === "frozen") {
    return { renderPosture: "read_only_provenance", insertPosture: "blocked", reasonCodes };
  }
  if (verdict.rolloutRung === "visible_summary") {
    return { renderPosture: "visible", insertPosture: "observe_only", reasonCodes };
  }
  if (verdict.rolloutRung === "visible_insert") {
    return { renderPosture: "visible", insertPosture: "enabled", reasonCodes };
  }
  if (verdict.rolloutRung === "visible_commit") {
    return { renderPosture: "visible", insertPosture: "enabled", reasonCodes };
  }
  return { renderPosture: "blocked", insertPosture: "blocked", reasonCodes };
}

export function evaluateFeedbackRecord(record: Phase8FeedbackRecord | undefined): {
  passed: boolean;
  failures: readonly Phase8TrustRolloutFailureType[];
} {
  if (!record) {
    return { passed: false, failures: ["feedback_record_missing"] };
  }
  const failures: Phase8TrustRolloutFailureType[] = [];
  if (!record.idempotencyKey || !record.dedupeKey) {
    failures.push("feedback_idempotency_missing");
  }
  if (!record.auditRef || !record.assuranceEvidenceRef) {
    failures.push("feedback_audit_missing");
  }
  if (record.authoritativeMutation) {
    failures.push("feedback_authoritative_mutation");
  }
  return { passed: failures.length === 0, failures };
}

export function detectTrustRolloutProhibitedRequests(networkRequests: readonly string[]): readonly string[] {
  return networkRequests.filter((requestUrl) =>
    PHASE8_TRUST_ROLLOUT_PROHIBITED_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint)),
  );
}

export function evaluatePhase8TrustRolloutFixture(
  fixture: Phase8TrustRolloutFixture,
): Phase8TrustRolloutFixtureVerdict {
  const failures: Phase8TrustRolloutFailure[] = [];
  const rolloutDecision = evaluateRolloutVerdict(fixture.rolloutVerdict);

  if (!fixture.trustEnvelope.trustEnvelopeRef) {
    pushFailure(failures, fixture, {
      failureType: "trust_envelope_missing",
      severity: "critical",
      sourceRef: "phase8:AssistiveCapabilityTrustEnvelope",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Every visible assistive artifact must resolve one current trust envelope.",
      humanReadableReason: "Fixture did not include a trust envelope reference.",
    });
  }
  if (fixture.observed.trustLabel !== fixture.expected.trustLabel || fixture.expected.trustLabel !== expectedTrustLabel(fixture.trustEnvelope.trustState)) {
    pushFailure(failures, fixture, {
      failureType: "trust_state_flattened",
      severity: "high",
      sourceRef: "phase8:trust-state-language",
      observedRef: fixture.observed.trustLabel,
      requiredAlgorithmRule: "Degraded, quarantined, stale, frozen, blocked, and rollback states must not flatten into generic warning copy.",
      humanReadableReason: `Expected trust label ${fixture.expected.trustLabel} but saw ${fixture.observed.trustLabel}.`,
    });
  }
  if (fixture.observed.confidenceBand !== fixture.expected.confidenceBand) {
    pushFailure(failures, fixture, {
      failureType: "fixture_expectation_mismatch",
      severity: "high",
      sourceRef: "phase8:confidence-digest",
      observedRef: fixture.observed.confidenceBand,
      requiredAlgorithmRule: "The confidence chip must render from AssistiveConfidenceDigest.displayBand.",
      humanReadableReason: `Expected confidence ${fixture.expected.confidenceBand} but saw ${fixture.observed.confidenceBand}.`,
    });
  }
  if (
    fixture.observed.confidenceBand !== "suppressed" &&
    (fixture.observed.rationaleProvenanceChips.length === 0 || fixture.trustEnvelope.provenanceRefs.length === 0)
  ) {
    pushFailure(failures, fixture, {
      failureType: "confidence_without_provenance",
      severity: "critical",
      sourceRef: "phase8:confidence-provenance-binding",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Confidence may not be displayed without provenance.",
      humanReadableReason: "Visible confidence lacked provenance chips or envelope source refs.",
    });
  }
  if (
    fixture.trustEnvelope.disclosureScope === "denied" &&
    fixture.observed.rationaleProvenanceChips.some((chip) => !chip.includes("masked"))
  ) {
    pushFailure(failures, fixture, {
      failureType: "provenance_disclosure_violation",
      severity: "critical",
      sourceRef: "phase8:provenance-disclosure",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Denied or hidden source material may not render full provenance.",
      humanReadableReason: "Denied disclosure fixture exposed non-masked provenance.",
    });
  }
  if (fixture.observed.freshnessState !== fixture.expected.freshnessState) {
    pushFailure(failures, fixture, {
      failureType: "freshness_mismatch",
      severity: "critical",
      sourceRef: "phase8:freshness-state",
      observedRef: fixture.observed.freshnessState,
      requiredAlgorithmRule: "A stale or invalidated source cannot look current.",
      humanReadableReason: `Expected freshness ${fixture.expected.freshnessState} but saw ${fixture.observed.freshnessState}.`,
    });
  }
  if (fixture.trustEnvelope.insertionPermission === "blocked" && fixture.observed.insertionPermission !== "blocked") {
    pushFailure(failures, fixture, {
      failureType: "blocked_insert_affordance",
      severity: "critical",
      sourceRef: "phase8:insert-posture",
      observedRef: fixture.observed.insertionPermission,
      requiredAlgorithmRule: "Blocked, stale, quarantined, frozen, or rolled-back suggestions cannot expose insertion affordances.",
      humanReadableReason: "Observed insertion control was not blocked.",
    });
  }
  if (fixture.rolloutVerdict.renderPosture !== rolloutDecision.renderPosture || fixture.rolloutVerdict.insertPosture !== rolloutDecision.insertPosture) {
    pushFailure(failures, fixture, {
      failureType: "rollout_verdict_mismatch",
      severity: "critical",
      sourceRef: "phase8:AssistiveCapabilityRolloutVerdict",
      observedRef: fixture.rolloutVerdict.rolloutVerdictRef,
      requiredAlgorithmRule: "Rollout verdicts must compute a monotonic visible and insert ceiling from slice, publication, trust, and runtime state.",
      humanReadableReason: `Expected ${rolloutDecision.renderPosture}/${rolloutDecision.insertPosture} from evaluator but fixture carried ${fixture.rolloutVerdict.renderPosture}/${fixture.rolloutVerdict.insertPosture}.`,
    });
  }
  if (
    fixture.rolloutVerdict.publicationState !== "published" &&
    fixture.observed.rolloutLanguage.toLowerCase().includes("current")
  ) {
    pushFailure(failures, fixture, {
      failureType: "rollout_publication_not_pinned",
      severity: "critical",
      sourceRef: "phase8:runtime-publication-pinning",
      observedRef: fixture.observed.rolloutLanguage,
      requiredAlgorithmRule: "Rolled-back, stale, withdrawn, or mismatched publications cannot show current rollout controls.",
      humanReadableReason: "Rollout language implied current publication when publication was not published.",
    });
  }
  if (fixture.rolloutVerdict.opsLanguage !== fixture.rolloutVerdict.releaseLanguage) {
    pushFailure(failures, fixture, {
      failureType: "ops_release_language_drift",
      severity: "high",
      sourceRef: "phase8:shared-trust-grammar",
      observedRef: `${fixture.rolloutVerdict.opsLanguage} != ${fixture.rolloutVerdict.releaseLanguage}`,
      requiredAlgorithmRule: "Workspace, ops, and release surfaces must use the same rollout and trust grammar.",
      humanReadableReason: "Ops and release rollout language differed.",
    });
  }

  applyPropagationChecks(fixture, failures);
  applyFeedbackChecks(fixture, failures);
  applyAuditEvidenceChecks(fixture, failures);
  applyLeakChecks(fixture, failures);
  applyArtifactAndNavigationChecks(fixture, failures);

  return {
    fixtureId: fixture.fixtureId,
    category: fixture.category,
    routeFamily: fixture.routeFamily,
    trustState: fixture.trustEnvelope.trustState,
    rolloutScenario: fixture.rolloutVerdict.scenario,
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
    auditEvidenceRefs: fixture.observed.auditEvents,
  };
}

export function evaluatePhase8TrustRolloutCorpus(
  corpus: Phase8TrustRolloutCorpus,
  thresholdConfig: Phase8TrustRolloutThresholdConfig,
  metadata: Phase8TrustRolloutReportMetadata,
): Phase8TrustRolloutReport {
  validateCorpusShape(corpus);
  const verdicts = corpus.fixtures.map(evaluatePhase8TrustRolloutFixture);
  const metrics = computeMetrics(corpus, verdicts);
  const thresholdComparisons = thresholdConfig.thresholds.map((definition) => {
    const observed = metrics[definition.metric] ?? Number.NaN;
    return {
      ...definition,
      observed,
      passed: compareMetric(observed, definition.comparator, definition.threshold),
    };
  });
  const failedFixtures = verdicts.filter((verdict) => !verdict.passed).map((verdict) => verdict.fixtureId);
  const thresholdPassCount = thresholdComparisons.filter((comparison) => comparison.passed).length;
  const reportBasis = {
    corpusId: corpus.corpusId,
    corpusVersion: corpus.corpusVersion,
    fixtureVersion: corpus.fixtureVersion,
    thresholdSetRef: thresholdConfig.thresholdSetRef,
    commit: metadata.commit,
    generatedAt: metadata.generatedAt,
  };

  return {
    reportId: `phase8_trust_rollout_report_${hashFor(reportBasis).slice(0, 12)}`,
    reportVersion: "430.phase8.trust-rollout-regression-report.v1",
    corpusId: corpus.corpusId,
    corpusVersion: corpus.corpusVersion,
    fixtureVersion: corpus.fixtureVersion,
    suiteVersion: corpus.suiteVersion,
    evaluatorVersion: metadata.evaluatorVersion,
    thresholdSetRef: thresholdConfig.thresholdSetRef,
    seededClock: thresholdConfig.seededClock,
    commit: metadata.commit,
    command: metadata.command,
    generatedAt: metadata.generatedAt,
    evidenceArtifactRef: `phase8-trust-rollout-evidence:${corpus.fixtureVersion}:${thresholdConfig.thresholdVersion}`,
    summary: {
      fixtureCount: verdicts.length,
      passedFixtureCount: verdicts.filter((verdict) => verdict.passed).length,
      unexpectedFailureCount: failedFixtures.length,
      thresholdPassCount,
      thresholdCount: thresholdComparisons.length,
      suitePassed: failedFixtures.length === 0 && thresholdPassCount === thresholdComparisons.length,
    },
    metrics,
    thresholdComparisons,
    verdicts,
    failedFixtures,
  };
}

export function summarizePhase8TrustRolloutReport(report: Phase8TrustRolloutReport): string {
  const lines = [
    `# Phase 8 Trust and Rollout Regression Report ${report.reportId}`,
    "",
    `Suite passed: ${report.summary.suitePassed ? "yes" : "no"}`,
    `Fixtures: ${report.summary.passedFixtureCount}/${report.summary.fixtureCount}`,
    `Thresholds: ${report.summary.thresholdPassCount}/${report.summary.thresholdCount}`,
    `Evidence artifact: ${report.evidenceArtifactRef}`,
    `Commit: ${report.commit}`,
    `Seeded clock: ${report.seededClock}`,
    "",
    "## Threshold table",
    "",
    "| Metric | Observed | Comparator | Threshold | Passed |",
    "| --- | ---: | --- | ---: | --- |",
    ...report.thresholdComparisons.map(
      (comparison) =>
        `| ${comparison.metric} | ${formatMetric(comparison.observed)} | ${comparison.comparator} | ${formatMetric(
          comparison.threshold,
        )} | ${comparison.passed ? "yes" : "no"} |`,
    ),
    "",
    "## Failed fixtures",
    "",
    report.failedFixtures.length === 0 ? "None." : report.failedFixtures.map((fixtureId) => `- ${fixtureId}`).join("\n"),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function phase8TrustRolloutThresholdsToCsv(report: Phase8TrustRolloutReport): string {
  const header = "metric,observed,comparator,threshold,passed,requiredAlgorithmRule";
  const rows = report.thresholdComparisons.map((comparison) =>
    [
      comparison.metric,
      formatMetric(comparison.observed),
      comparison.comparator,
      formatMetric(comparison.threshold),
      String(comparison.passed),
      csvEscape(comparison.requiredAlgorithmRule),
    ].join(","),
  );
  return `${[header, ...rows].join("\n")}\n`;
}

export function hashFor(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function applyPropagationChecks(
  fixture: Phase8TrustRolloutFixture,
  failures: Phase8TrustRolloutFailure[],
): void {
  const requiredSurfaces =
    fixture.category === "trust_envelope"
      ? [
          "workspace_queue",
          "workspace_task",
          "assistive_stage",
          "decision_dock",
          "draft_preview",
          "ops_summary",
          "release_admin_card",
        ]
      : ["workspace_task", "ops_summary", "release_admin_card"];
  const surfaces = new Map(fixture.observed.propagationSurfaces.map((surface) => [surface.surface, surface]));
  for (const surfaceName of requiredSurfaces) {
    const surface = surfaces.get(surfaceName as Phase8TrustAudienceSurface);
    if (!surface) {
      pushFailure(failures, fixture, {
        failureType: "propagation_state_lost",
        severity: "high",
        sourceRef: "phase8:trust-envelope-propagation",
        observedRef: surfaceName,
        requiredAlgorithmRule: "Trust state must survive queue, task, stage, dock, draft preview, ops, release, reload, and route-return transitions.",
        humanReadableReason: `Missing propagation surface ${surfaceName}.`,
      });
      continue;
    }
    if (surface.trustLabel !== fixture.expected.trustLabel || surface.freshnessLabel !== fixture.expected.freshnessState) {
      pushFailure(failures, fixture, {
        failureType: surface.surface === "workspace_task" ? "stale_cache_overwrite" : "propagation_state_lost",
        severity: "critical",
        sourceRef: "phase8:trust-envelope-propagation",
        observedRef: surface.surface,
        requiredAlgorithmRule: "A downgraded trust state cannot be overwritten by local browser cache or route transitions.",
        humanReadableReason: `Surface ${surface.surface} rendered ${surface.trustLabel}/${surface.freshnessLabel}.`,
      });
    }
    if (fixture.expected.insertionPermission === "blocked" && surface.insertionControlVisible) {
      pushFailure(failures, fixture, {
        failureType: "blocked_insert_affordance",
        severity: "critical",
        sourceRef: "phase8:insert-posture-propagation",
        observedRef: surface.surface,
        requiredAlgorithmRule: "Blocked suggestions cannot expose insertion controls on any propagated surface.",
        humanReadableReason: `Surface ${surface.surface} exposed insertion control.`,
      });
    }
  }
}

function applyFeedbackChecks(
  fixture: Phase8TrustRolloutFixture,
  failures: Phase8TrustRolloutFailure[],
): void {
  if (!fixture.feedbackRecord) {
    return;
  }
  const feedback = evaluateFeedbackRecord(fixture.feedbackRecord);
  for (const failureType of feedback.failures) {
    pushFailure(failures, fixture, {
      failureType,
      severity: failureType === "feedback_authoritative_mutation" ? "critical" : "high",
      sourceRef: "phase8:feedback-chain",
      observedRef: fixture.feedbackRecord?.eventType ?? fixture.fixtureId,
      requiredAlgorithmRule: "Feedback, override, reliance, and edited-by-clinician events must create auditable, idempotent evidence without mutating authoritative workflow state.",
      humanReadableReason: `Feedback record failed ${failureType}.`,
    });
  }
}

function applyAuditEvidenceChecks(
  fixture: Phase8TrustRolloutFixture,
  failures: Phase8TrustRolloutFailure[],
): void {
  for (const auditEvent of fixture.expected.auditEvents) {
    if (!fixture.observed.auditEvents.includes(auditEvent)) {
      pushFailure(failures, fixture, {
        failureType: "audit_evidence_missing",
        severity: "high",
        sourceRef: "phase8:audit-events",
        observedRef: auditEvent,
        requiredAlgorithmRule: "Trust, feedback, rollout, freeze, and rollback outcomes must emit audit events.",
        humanReadableReason: `Missing audit event ${auditEvent}.`,
      });
    }
  }
  for (const evidenceEvent of fixture.expected.evidenceEvents) {
    if (!fixture.observed.evidenceEvents.includes(evidenceEvent)) {
      pushFailure(failures, fixture, {
        failureType: "audit_evidence_missing",
        severity: "high",
        sourceRef: "phase8:assurance-evidence",
        observedRef: evidenceEvent,
        requiredAlgorithmRule: "Trust, feedback, and rollout evidence must be consumable by Phase 8 exit and Phase 9 assurance ledger.",
        humanReadableReason: `Missing evidence event ${evidenceEvent}.`,
      });
    }
  }
}

function applyLeakChecks(
  fixture: Phase8TrustRolloutFixture,
  failures: Phase8TrustRolloutFailure[],
): void {
  const hiddenText = [
    fixture.observed.hiddenDomText,
    ...fixture.observed.propagationSurfaces.map((surface) => surface.hiddenDomText),
  ].join("\n");
  for (const token of fixture.expected.noHiddenLeakTokens) {
    if (hiddenText.includes(token)) {
      pushFailure(failures, fixture, {
        failureType: "hidden_dom_leak",
        severity: "critical",
        sourceRef: "phase8:hidden-dom",
        observedRef: token,
        requiredAlgorithmRule: "Blocked, hidden, or denied assistive content must not remain in hidden DOM.",
        humanReadableReason: `Hidden DOM contained ${token}.`,
      });
    }
  }
  for (const requestUrl of detectTrustRolloutProhibitedRequests(fixture.observed.networkRequests)) {
    pushFailure(failures, fixture, {
      failureType: "prohibited_network_mutation",
      severity: "critical",
      sourceRef: "phase8:no-autonomous-write",
      observedRef: requestUrl,
      requiredAlgorithmRule: "Feedback and rollout tests must not call authoritative patient, booking, pharmacy, task, or communication write endpoints.",
      humanReadableReason: `Observed prohibited endpoint ${requestUrl}.`,
    });
  }
}

function applyArtifactAndNavigationChecks(
  fixture: Phase8TrustRolloutFixture,
  failures: Phase8TrustRolloutFailure[],
): void {
  if (
    fixture.rolloutVerdict.scenario !== "pilot_cohort" &&
    fixture.rolloutVerdict.scenario !== "tenant_limited_pilot" &&
    fixture.rolloutVerdict.scenario !== "route_family_limited_pilot"
  ) {
    return;
  }
  if (!fixture.rolloutVerdict.artifactPresentationContractRef || !fixture.rolloutVerdict.outboundNavigationGrantRef) {
    pushFailure(failures, fixture, {
      failureType: "artifact_or_navigation_policy_missing",
      severity: "high",
      sourceRef: "phase8:ArtifactPresentationContract-OutboundNavigationGrant",
      observedRef: fixture.rolloutVerdict.rolloutVerdictRef,
      requiredAlgorithmRule: "Rollout training, freeze explanations, and evidence packs must use governed artifact and navigation policy.",
      humanReadableReason: "Visible rollout fixture lacked artifact presentation or outbound navigation policy refs.",
    });
  }
}

function computeMetrics(
  corpus: Phase8TrustRolloutCorpus,
  verdicts: readonly Phase8TrustRolloutFixtureVerdict[],
): Record<string, number> {
  const total = corpus.fixtures.length;
  const failures = verdicts.flatMap((verdict) => verdict.failures);
  const trustFixtures = corpus.fixtures;
  const feedbackFixtures = corpus.fixtures.filter((fixture) => fixture.feedbackRecord);
  const rolloutFixtures = corpus.fixtures;
  const passedById = new Set(verdicts.filter((verdict) => verdict.passed).map((verdict) => verdict.fixtureId));
  const completeFeedback = feedbackFixtures.filter((fixture) => evaluateFeedbackRecord(fixture.feedbackRecord).passed);
  const distinctTrustStates = new Set(corpus.fixtures.map((fixture) => fixture.trustEnvelope.trustState));
  const rolloutScenarios = new Set(corpus.fixtures.map((fixture) => fixture.rolloutVerdict.scenario));
  const allRequests = corpus.fixtures.flatMap((fixture) => fixture.observed.networkRequests);
  const propagationPassed = corpus.fixtures.filter(
    (fixture) => !evaluatePhase8TrustRolloutFixture(fixture).failures.some((failure) => failure.failureType === "propagation_state_lost" || failure.failureType === "stale_cache_overwrite"),
  );
  const rolloutParity = rolloutFixtures.filter((fixture) => {
    const decision = evaluateRolloutVerdict(fixture.rolloutVerdict);
    return decision.renderPosture === fixture.rolloutVerdict.renderPosture && decision.insertPosture === fixture.rolloutVerdict.insertPosture;
  });
  const opsReleaseParity = corpus.fixtures.filter(
    (fixture) => fixture.rolloutVerdict.opsLanguage === fixture.rolloutVerdict.releaseLanguage,
  );

  return {
    fixturePassRate: ratio(verdicts.filter((verdict) => verdict.passed).length, total),
    trustEnvelopeFixturePassRate: ratio(
      trustFixtures.filter((fixture) => passedById.has(fixture.fixtureId)).length,
      trustFixtures.length,
    ),
    trustStateCoverageRate: ratio(distinctTrustStates.size, 11),
    propagationPassRate: ratio(propagationPassed.length, total),
    feedbackEvidenceCompletenessRate: ratio(completeFeedback.length, feedbackFixtures.length),
    feedbackIdempotencyRate: ratio(
      feedbackFixtures.filter((fixture) => Boolean(fixture.feedbackRecord?.idempotencyKey && fixture.feedbackRecord?.dedupeKey)).length,
      feedbackFixtures.length,
    ),
    feedbackAuthoritativeMutationRate: ratio(
      feedbackFixtures.filter((fixture) => fixture.feedbackRecord?.authoritativeMutation).length,
      feedbackFixtures.length,
    ),
    rolloutScenarioCoverageRate: ratio(rolloutScenarios.size, 10),
    rolloutVerdictParityRate: ratio(rolloutParity.length, rolloutFixtures.length),
    visibleRolloutPinningRate: ratio(
      rolloutFixtures.filter(
        (fixture) =>
          fixture.rolloutVerdict.runtimePublicationBundleState === "current" ||
          fixture.rolloutVerdict.renderPosture !== "visible",
      ).length,
      rolloutFixtures.length,
    ),
    opsReleaseLanguageParityRate: ratio(opsReleaseParity.length, total),
    distinctDegradedStateRate: ratio(
      corpus.fixtures.filter((fixture) => fixture.expected.trustLabel === expectedTrustLabel(fixture.trustEnvelope.trustState)).length,
      total,
    ),
    staleCurrentMismatchRate: ratio(
      failures.filter((failure) => failure.failureType === "freshness_mismatch").length,
      total,
    ),
    hiddenDomLeakRate: ratio(
      failures.filter((failure) => failure.failureType === "hidden_dom_leak").length,
      total,
    ),
    prohibitedNetworkMutationRate: ratio(
      detectTrustRolloutProhibitedRequests(allRequests).length,
      Math.max(allRequests.length, 1),
    ),
    auditEvidenceCompletenessRate: ratio(
      corpus.fixtures.filter((fixture) =>
        [...fixture.expected.auditEvents, ...fixture.expected.evidenceEvents].every(
          (event) => fixture.observed.auditEvents.includes(event) || fixture.observed.evidenceEvents.includes(event),
        ),
      ).length,
      total,
    ),
  };
}

function validateCorpusShape(corpus: Phase8TrustRolloutCorpus): void {
  const ids = new Set<string>();
  for (const fixture of corpus.fixtures) {
    if (ids.has(fixture.fixtureId)) {
      throw new Error(`Duplicate fixture id ${fixture.fixtureId}`);
    }
    ids.add(fixture.fixtureId);
    if (!fixture.syntheticDataOnly) {
      throw new Error(`Fixture ${fixture.fixtureId} is not marked synthetic-only.`);
    }
    if (fixture.sourceBlueprintRefs.length === 0) {
      throw new Error(`Fixture ${fixture.fixtureId} has no blueprint refs.`);
    }
    if (fixture.expected.auditEvents.length === 0 || fixture.expected.evidenceEvents.length === 0) {
      throw new Error(`Fixture ${fixture.fixtureId} lacks audit or evidence events.`);
    }
  }
}

function pushFailure(
  failures: Phase8TrustRolloutFailure[],
  fixture: Phase8TrustRolloutFixture,
  failure: Omit<Phase8TrustRolloutFailure, "fixtureId" | "category" | "auditEvidenceRef">,
): void {
  failures.push({
    fixtureId: fixture.fixtureId,
    category: fixture.category,
    auditEvidenceRef: fixture.observed.auditEvents[0] ?? `audit:${fixture.fixtureId}:missing`,
    ...failure,
  });
}

function compareMetric(observed: number, comparator: Phase8TrustRolloutThresholdDefinition["comparator"], threshold: number): boolean {
  if (!Number.isFinite(observed)) {
    return false;
  }
  if (comparator === "gte") {
    return observed >= threshold;
  }
  if (comparator === "lte") {
    return observed <= threshold;
  }
  return observed === threshold;
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 1;
  }
  return Number((numerator / denominator).toFixed(6));
}

function formatMetric(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function csvEscape(value: string): string {
  if (!/[",\n]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}
