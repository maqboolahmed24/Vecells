import { createHash } from "node:crypto";

export type Phase8InvocationRole = "clinician" | "admin" | "support" | "governance" | "unauthorised";
export type Phase8InvocationRouteFamily =
  | "triage"
  | "more_info"
  | "booking"
  | "waitlist"
  | "pharmacy"
  | "communications"
  | "support_replay"
  | "assurance_admin";
export type Phase8AudienceSurface =
  | "staff_workspace"
  | "ops_internal"
  | "release_admin"
  | "support_replay"
  | "patient_facing"
  | "artifact_preview";
export type Phase8RolloutState = "disabled" | "shadow" | "limited_pilot" | "visible_assistive" | "frozen" | "rollback";
export type Phase8InvocationTrustState = "trusted" | "degraded" | "stale" | "quarantined" | "unknown" | "hard_blocked";
export type Phase8PublicationState = "current" | "stale" | "mismatch" | "missing_runtime_bundle";
export type Phase8DisclosureScope = "full" | "partial" | "denied" | "break_glass_required";
export type Phase8DeviceLayout = "desktop" | "narrow" | "reduced_motion";
export type Phase8KillSwitchLevel =
  | "none"
  | "global_model_vendor"
  | "tenant"
  | "route_family"
  | "cohort_slice"
  | "workspace_session_stale_freeze"
  | "artifact_quarantine"
  | "runtime_publication_rollback";
export type Phase8OutputPosture = "enabled" | "read_only" | "frozen" | "blocked" | "hidden";
export type Phase8DraftPosture = "hidden" | "disabled" | "preview" | "inserted_pending_human" | "undone";
export type Phase8RecoveryPath = "none" | "regenerate_in_place" | "break_glass_review" | "release_admin" | "human_transform_only";
export type Phase8CommandAuthority = "human_command" | "model_command" | "system_automation";
export type Phase8CommandInitiator = "human" | "model" | "system";
export type Phase8InvocationFailureSeverity = "low" | "medium" | "high" | "critical";

export type Phase8InvocationFailureType =
  | "role_not_allowed"
  | "route_not_allowed"
  | "rollout_not_authorized"
  | "trust_not_authorized"
  | "publication_not_current"
  | "disclosure_fence_violation"
  | "kill_switch_not_enforced"
  | "open_output_not_frozen"
  | "draft_insert_not_human_initiated"
  | "autonomous_write_path"
  | "wrong_surface_leak"
  | "hidden_dom_leak"
  | "prohibited_network_mutation"
  | "command_settlement_identity_missing"
  | "audit_event_missing"
  | "evidence_event_missing"
  | "stale_publication_not_blocked"
  | "recovery_path_illegal"
  | "fixture_expectation_mismatch"
  | "missing_visible_affordance"
  | "missing_allowed_action"
  | "missing_blocked_action"
  | "artifact_contract_missing";

export interface Phase8CommandSettlementProof {
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  uiEventEnvelopeRef: string;
  initiatedBy: Phase8CommandInitiator;
  finalAuthority: Phase8CommandAuthority;
  suggestionMarked: boolean;
  undoAvailable: boolean;
  clinicianEditRecordRef?: string;
  sourceRefsInspectable: boolean;
  unsupportedWarningsInspectable: boolean;
  authoritativeMutationEndpoint?: string;
}

export interface Phase8ArtifactPresentationProof {
  artifactPresentationContractRef: string;
  outboundNavigationGrantRef?: string;
  downloadScope: "none" | "masked" | "full";
  disclosureFenceRef: string;
  patientSafeTransformSettlementRef?: string;
}

export interface Phase8InvocationFixtureExpectation {
  invocationAllowed: boolean;
  surfaceVisible: boolean;
  visibleAffordances: readonly string[];
  allowedActions: readonly string[];
  blockedActions: readonly string[];
  outputState: Phase8OutputPosture;
  draftState: Phase8DraftPosture;
  recoveryPath: Phase8RecoveryPath;
  reasonCodes: readonly string[];
  auditEvents: readonly string[];
  evidenceEvents: readonly string[];
}

export interface Phase8InvocationObservedState {
  visibleAffordances: readonly string[];
  allowedActions: readonly string[];
  blockedActions: readonly string[];
  outputState: Phase8OutputPosture;
  draftState: Phase8DraftPosture;
  surfaceVisible: boolean;
  recoveryPath: Phase8RecoveryPath;
  reasonCodes: readonly string[];
  auditEvents: readonly string[];
  evidenceEvents: readonly string[];
  hiddenDomText: string;
  visibleText: string;
  networkRequests: readonly string[];
  commandSettlement?: Phase8CommandSettlementProof;
  artifactPresentation?: Phase8ArtifactPresentationProof;
}

export interface Phase8InvocationRegressionFixture {
  fixtureId: string;
  title: string;
  role: Phase8InvocationRole;
  routeFamily: Phase8InvocationRouteFamily;
  audienceSurface: Phase8AudienceSurface;
  rolloutState: Phase8RolloutState;
  trustState: Phase8InvocationTrustState;
  publicationState: Phase8PublicationState;
  disclosureScope: Phase8DisclosureScope;
  deviceLayout: Phase8DeviceLayout;
  killSwitch: Phase8KillSwitchLevel;
  openOutputAtDecision: boolean;
  humanSettledTransform: boolean;
  syntheticDataOnly: true;
  sourceBlueprintRefs: readonly string[];
  expected: Phase8InvocationFixtureExpectation;
  observed: Phase8InvocationObservedState;
}

export interface Phase8InvocationRegressionCorpus {
  corpusId: string;
  corpusVersion: string;
  fixtureVersion: string;
  suiteVersion: string;
  seededClock: string;
  sourceBlueprintRefs: readonly string[];
  fixtures: readonly Phase8InvocationRegressionFixture[];
}

export interface Phase8InvocationPolicyDecision {
  invocationAllowed: boolean;
  surfaceVisible: boolean;
  draftInsertionPermitted: boolean;
  reasonCodes: readonly string[];
  killSwitchActive: boolean;
  killSwitchLevel: Phase8KillSwitchLevel;
  outputMustBeFrozen: boolean;
  allowedRecoveryPaths: readonly Phase8RecoveryPath[];
  requiredBlockedActions: readonly string[];
  requiredAuditEvents: readonly string[];
  requiredEvidenceEvents: readonly string[];
}

export interface Phase8InvocationFailure {
  fixtureId: string;
  routeFamily: Phase8InvocationRouteFamily;
  failureType: Phase8InvocationFailureType;
  severity: Phase8InvocationFailureSeverity;
  sourceRef: string;
  observedRef: string;
  requiredAlgorithmRule: string;
  humanReadableReason: string;
  auditEvidenceRef: string;
}

export interface Phase8InvocationFixtureVerdict {
  fixtureId: string;
  role: Phase8InvocationRole;
  routeFamily: Phase8InvocationRouteFamily;
  killSwitch: Phase8KillSwitchLevel;
  invocationAllowed: boolean;
  passed: boolean;
  failureCount: number;
  failures: readonly Phase8InvocationFailure[];
  auditEvidenceRefs: readonly string[];
}

export interface Phase8InvocationThresholdDefinition {
  metric: string;
  comparator: "gte" | "lte" | "eq";
  threshold: number;
  requiredAlgorithmRule: string;
  temporaryFallback?: boolean;
}

export interface Phase8InvocationThresholdConfig {
  thresholdSetRef: string;
  thresholdVersion: string;
  suiteVersion: string;
  seededClock: string;
  thresholds: readonly Phase8InvocationThresholdDefinition[];
}

export interface Phase8InvocationThresholdComparison extends Phase8InvocationThresholdDefinition {
  observed: number;
  passed: boolean;
}

export interface Phase8InvocationReportMetadata {
  commit: string;
  generatedAt: string;
  evaluatorVersion: string;
  command: string;
}

export interface Phase8InvocationRegressionReport {
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
  thresholdComparisons: readonly Phase8InvocationThresholdComparison[];
  verdicts: readonly Phase8InvocationFixtureVerdict[];
  failedFixtures: readonly string[];
}

export interface Phase8DraftInsertionCommand {
  commandActionRecordRef: string;
  uiEventEnvelopeRef: string;
  commandKind: "assistive_draft_insert";
  requestedBy: "human";
  status: "ready" | "blocked";
  reasonCodes: readonly string[];
  suggestionRef: string;
  sourceRefs: readonly string[];
  unsafeMutationEndpoint?: never;
}

export const PHASE8_INVOCATION_REGRESSION_EVALUATOR_VERSION = "phase8-invocation-regression-429.v1";

export const PHASE8_PROHIBITED_MUTATION_ENDPOINTS = [
  "/api/patient/send",
  "/api/booking/commit",
  "/api/pharmacy/outcome",
  "/api/task/close",
  "/api/request/save-authoritative",
] as const;

const CLINICAL_ROUTE_FAMILIES: readonly Phase8InvocationRouteFamily[] = [
  "triage",
  "more_info",
  "booking",
  "waitlist",
  "pharmacy",
  "communications",
];

const DRAFT_ELIGIBLE_ROUTE_FAMILIES: readonly Phase8InvocationRouteFamily[] = ["triage", "more_info", "communications"];

const REQUIRED_KILL_SWITCH_LEVELS: readonly Exclude<Phase8KillSwitchLevel, "none">[] = [
  "global_model_vendor",
  "tenant",
  "route_family",
  "cohort_slice",
  "workspace_session_stale_freeze",
  "artifact_quarantine",
  "runtime_publication_rollback",
];

export function evaluateInvocationPolicy(fixture: Phase8InvocationRegressionFixture): Phase8InvocationPolicyDecision {
  const reasonCodes: string[] = [];
  const routeAllowed = isRouteAllowedForSurface(fixture.routeFamily, fixture.audienceSurface, fixture.humanSettledTransform);
  const roleAllowed = isRoleAllowedForRoute(fixture.role, fixture.routeFamily);
  const rolloutAllowed = fixture.rolloutState === "visible_assistive" || fixture.rolloutState === "limited_pilot";
  const trustAllowed = fixture.trustState === "trusted";
  const publicationCurrent = fixture.publicationState === "current";
  const disclosureAllowed =
    fixture.disclosureScope === "full" ||
    (fixture.disclosureScope === "partial" && fixture.routeFamily === "support_replay") ||
    (fixture.humanSettledTransform && fixture.audienceSurface === "patient_facing");
  const killSwitchActive = fixture.killSwitch !== "none";
  const patientRawSurface =
    fixture.audienceSurface === "patient_facing" && !fixture.humanSettledTransform;

  if (!roleAllowed) {
    reasonCodes.push("role_not_allowed");
  }
  if (!routeAllowed) {
    reasonCodes.push(patientRawSurface ? "wrong_audience_surface" : "route_surface_not_allowed");
  }
  if (!rolloutAllowed) {
    reasonCodes.push(`rollout_${fixture.rolloutState}`);
  }
  if (!trustAllowed) {
    reasonCodes.push(`trust_${fixture.trustState}`);
  }
  if (!publicationCurrent) {
    reasonCodes.push(`publication_${fixture.publicationState}`);
  }
  if (!disclosureAllowed) {
    reasonCodes.push(`disclosure_${fixture.disclosureScope}`);
  }
  if (killSwitchActive) {
    reasonCodes.push(`kill_switch_${fixture.killSwitch}`);
  }

  const invocationAllowed =
    roleAllowed &&
    routeAllowed &&
    rolloutAllowed &&
    trustAllowed &&
    publicationCurrent &&
    disclosureAllowed &&
    !killSwitchActive &&
    !patientRawSurface;
  const surfaceVisible =
    invocationAllowed ||
    fixture.openOutputAtDecision ||
    fixture.audienceSurface === "ops_internal" ||
    fixture.audienceSurface === "release_admin" ||
    fixture.audienceSurface === "support_replay" ||
    fixture.humanSettledTransform;
  const draftInsertionPermitted =
    invocationAllowed &&
    fixture.role === "clinician" &&
    fixture.audienceSurface === "staff_workspace" &&
    DRAFT_ELIGIBLE_ROUTE_FAMILIES.includes(fixture.routeFamily) &&
    fixture.disclosureScope === "full";
  const outputMustBeFrozen =
    fixture.openOutputAtDecision &&
    (killSwitchActive ||
      fixture.rolloutState === "frozen" ||
      fixture.trustState === "stale" ||
      fixture.publicationState === "stale" ||
      fixture.killSwitch === "workspace_session_stale_freeze");

  return {
    invocationAllowed,
    surfaceVisible,
    draftInsertionPermitted,
    reasonCodes,
    killSwitchActive,
    killSwitchLevel: fixture.killSwitch,
    outputMustBeFrozen,
    allowedRecoveryPaths: allowedRecoveryPathsFor(fixture),
    requiredBlockedActions: requiredBlockedActionsFor(fixture, draftInsertionPermitted),
    requiredAuditEvents: requiredAuditEventsFor(fixture, invocationAllowed),
    requiredEvidenceEvents: requiredEvidenceEventsFor(fixture, invocationAllowed),
  };
}

export function evaluateRolloutSlice(
  rolloutState: Phase8RolloutState,
  publicationState: Phase8PublicationState,
): {
  visibleControls: boolean;
  observeOnly: boolean;
  reasonCodes: readonly string[];
} {
  const reasonCodes: string[] = [];
  if (publicationState !== "current") {
    reasonCodes.push(`publication_${publicationState}`);
  }
  if (rolloutState === "shadow") {
    reasonCodes.push("rollout_shadow");
  }
  if (rolloutState === "frozen") {
    reasonCodes.push("rollout_frozen");
  }
  if (rolloutState === "disabled" || rolloutState === "rollback") {
    reasonCodes.push(`rollout_${rolloutState}`);
  }
  return {
    visibleControls:
      publicationState === "current" &&
      (rolloutState === "limited_pilot" || rolloutState === "visible_assistive"),
    observeOnly: publicationState === "current" && rolloutState === "shadow",
    reasonCodes,
  };
}

export function highestPrecedenceKillSwitch(
  killSwitches: readonly Phase8KillSwitchLevel[],
): Exclude<Phase8KillSwitchLevel, "none"> | "none" {
  const active = killSwitches.filter(
    (switchLevel): switchLevel is Exclude<Phase8KillSwitchLevel, "none"> => switchLevel !== "none",
  );
  if (active.length === 0) {
    return "none";
  }
  const precedence: readonly Exclude<Phase8KillSwitchLevel, "none">[] = [
    "global_model_vendor",
    "tenant",
    "route_family",
    "cohort_slice",
    "workspace_session_stale_freeze",
    "artifact_quarantine",
    "runtime_publication_rollback",
  ];
  return precedence.find((switchLevel) => active.includes(switchLevel)) ?? "none";
}

export function enforceDisclosureFence(fixture: Phase8InvocationRegressionFixture): {
  allowed: boolean;
  ceiling: "full" | "partial" | "none" | "human_transformed";
  reasonCodes: readonly string[];
} {
  if (fixture.audienceSurface === "patient_facing" && fixture.humanSettledTransform) {
    return { allowed: true, ceiling: "human_transformed", reasonCodes: [] };
  }
  if (fixture.audienceSurface === "patient_facing") {
    return { allowed: false, ceiling: "none", reasonCodes: ["wrong_audience_surface"] };
  }
  if (
    fixture.disclosureScope === "break_glass_required" &&
    (fixture.audienceSurface === "ops_internal" || fixture.audienceSurface === "release_admin")
  ) {
    return { allowed: true, ceiling: "none", reasonCodes: ["disclosure_break_glass_required"] };
  }
  if (fixture.disclosureScope === "denied" || fixture.disclosureScope === "break_glass_required") {
    return { allowed: false, ceiling: "none", reasonCodes: [`disclosure_${fixture.disclosureScope}`] };
  }
  if (fixture.disclosureScope === "partial") {
    return { allowed: fixture.routeFamily === "support_replay", ceiling: "partial", reasonCodes: [] };
  }
  return { allowed: true, ceiling: "full", reasonCodes: [] };
}

export function buildDraftInsertionCommand(
  fixture: Phase8InvocationRegressionFixture,
  actorRef: string,
): Phase8DraftInsertionCommand {
  const policy = evaluateInvocationPolicy(fixture);
  if (!policy.draftInsertionPermitted) {
    return {
      commandActionRecordRef: `command-action:${fixture.fixtureId}:blocked`,
      uiEventEnvelopeRef: `ui-event:${fixture.fixtureId}:blocked`,
      commandKind: "assistive_draft_insert",
      requestedBy: "human",
      status: "blocked",
      reasonCodes: policy.reasonCodes.length > 0 ? policy.reasonCodes : ["draft_insertion_not_permitted"],
      suggestionRef: `assistive-suggestion:${fixture.fixtureId}`,
      sourceRefs: fixture.sourceBlueprintRefs,
    };
  }
  return {
    commandActionRecordRef: `command-action:${fixture.fixtureId}:${actorRef}`,
    uiEventEnvelopeRef: `ui-event:${fixture.fixtureId}:${actorRef}`,
    commandKind: "assistive_draft_insert",
    requestedBy: "human",
    status: "ready",
    reasonCodes: [],
    suggestionRef: `assistive-suggestion:${fixture.fixtureId}`,
    sourceRefs: fixture.sourceBlueprintRefs,
  };
}

export function settleDraftInsertionCommand(command: Phase8DraftInsertionCommand): Phase8CommandSettlementProof {
  return {
    commandActionRecordRef: command.commandActionRecordRef,
    commandSettlementRecordRef: `command-settlement:${command.commandActionRecordRef}`,
    uiEventEnvelopeRef: command.uiEventEnvelopeRef,
    initiatedBy: "human",
    finalAuthority: "human_command",
    suggestionMarked: true,
    undoAvailable: true,
    clinicianEditRecordRef: `clinician-edit:${command.commandActionRecordRef}`,
    sourceRefsInspectable: command.sourceRefs.length > 0,
    unsupportedWarningsInspectable: true,
  };
}

export function detectProhibitedMutationRequests(networkRequests: readonly string[]): readonly string[] {
  return networkRequests.filter((requestUrl) =>
    PHASE8_PROHIBITED_MUTATION_ENDPOINTS.some((prohibited) => requestUrl.includes(prohibited)),
  );
}

export function evaluatePhase8InvocationFixture(
  fixture: Phase8InvocationRegressionFixture,
): Phase8InvocationFixtureVerdict {
  const failures: Phase8InvocationFailure[] = [];
  const policy = evaluateInvocationPolicy(fixture);
  const disclosureFence = enforceDisclosureFence(fixture);

  if (fixture.expected.invocationAllowed !== policy.invocationAllowed) {
    pushFailure(failures, fixture, {
      failureType: policy.invocationAllowed ? "fixture_expectation_mismatch" : expectationFailureType(policy.reasonCodes),
      severity: "high",
      sourceRef: "phase8:invocation-policy",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Fixture expectations must match the Phase 8 invocation gate calculation.",
      humanReadableReason: `Expected invocationAllowed=${fixture.expected.invocationAllowed} but policy calculated ${policy.invocationAllowed}.`,
    });
  }
  if (fixture.expected.surfaceVisible !== policy.surfaceVisible) {
    pushFailure(failures, fixture, {
      failureType: "fixture_expectation_mismatch",
      severity: "high",
      sourceRef: "phase8:surface-visibility",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Surface visibility expectations must follow the audience and disclosure fence.",
      humanReadableReason: `Expected surfaceVisible=${fixture.expected.surfaceVisible} but policy calculated ${policy.surfaceVisible}.`,
    });
  }
  if (fixture.observed.surfaceVisible !== fixture.expected.surfaceVisible) {
    pushFailure(failures, fixture, {
      failureType: "wrong_surface_leak",
      severity: "critical",
      sourceRef: "phase8:audience-surface",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Assistive content may not appear on an audience surface outside its disclosure fence.",
      humanReadableReason: `Observed surfaceVisible=${fixture.observed.surfaceVisible} but expected ${fixture.expected.surfaceVisible}.`,
    });
  }
  if (!disclosureFence.allowed && fixture.observed.surfaceVisible) {
    pushFailure(failures, fixture, {
      failureType: "disclosure_fence_violation",
      severity: "critical",
      sourceRef: "phase8:disclosure-fence",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Denied or patient-facing raw assistive content must fail closed.",
      humanReadableReason: `Disclosure ceiling ${disclosureFence.ceiling} was not enforced.`,
    });
  }

  assertArrayContainsAll(
    failures,
    fixture,
    fixture.expected.visibleAffordances,
    fixture.observed.visibleAffordances,
    "missing_visible_affordance",
    "Expected visible affordances must be present or visibly disabled with explanatory copy.",
  );
  assertArrayContainsAll(
    failures,
    fixture,
    fixture.expected.allowedActions,
    fixture.observed.allowedActions,
    "missing_allowed_action",
    "Expected safe actions must be reachable when invocation is allowed.",
  );
  assertArrayContainsAll(
    failures,
    fixture,
    [...fixture.expected.blockedActions, ...policy.requiredBlockedActions],
    fixture.observed.blockedActions,
    "missing_blocked_action",
    "Expected blocked actions must be absent or disabled with a specific explanation.",
  );

  if (fixture.observed.outputState !== fixture.expected.outputState) {
    pushFailure(failures, fixture, {
      failureType: "fixture_expectation_mismatch",
      severity: "high",
      sourceRef: "phase8:output-posture",
      observedRef: fixture.observed.outputState,
      requiredAlgorithmRule: "Observed assistive output posture must match the fixture oracle.",
      humanReadableReason: `Expected output state ${fixture.expected.outputState} but saw ${fixture.observed.outputState}.`,
    });
  }
  if (fixture.observed.draftState !== fixture.expected.draftState) {
    pushFailure(failures, fixture, {
      failureType: "fixture_expectation_mismatch",
      severity: "high",
      sourceRef: "phase8:draft-posture",
      observedRef: fixture.observed.draftState,
      requiredAlgorithmRule: "Observed draft posture must match the fixture oracle.",
      humanReadableReason: `Expected draft state ${fixture.expected.draftState} but saw ${fixture.observed.draftState}.`,
    });
  }
  if (fixture.expected.draftState !== "hidden" && fixture.expected.draftState !== "disabled" && !policy.draftInsertionPermitted) {
    pushFailure(failures, fixture, {
      failureType: "draft_insert_not_human_initiated",
      severity: "critical",
      sourceRef: "phase8:draft-insertion-gate",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Draft insertion controls are only permitted when all invocation gates are live and trusted.",
      humanReadableReason: "Fixture expected a draft-capable state even though policy forbids insertion.",
    });
  }
  if (policy.killSwitchActive) {
    applyKillSwitchAssertions(fixture, failures, policy);
  }
  if (policy.outputMustBeFrozen && fixture.observed.outputState !== "frozen" && fixture.observed.outputState !== "read_only") {
    pushFailure(failures, fixture, {
      failureType: "open_output_not_frozen",
      severity: "critical",
      sourceRef: "phase8:freeze-in-place",
      observedRef: fixture.observed.outputState,
      requiredAlgorithmRule: "Already-open assistive output must freeze or become read-only when authority changes.",
      humanReadableReason: `Open output was ${fixture.observed.outputState} instead of frozen or read-only.`,
    });
  }
  if (fixture.publicationState !== "current" && !["blocked", "frozen", "read_only", "hidden"].includes(fixture.observed.outputState)) {
    pushFailure(failures, fixture, {
      failureType: "stale_publication_not_blocked",
      severity: "critical",
      sourceRef: "phase8:runtime-publication",
      observedRef: fixture.publicationState,
      requiredAlgorithmRule: "Stale, mismatched, or missing runtime publications must block current assistive controls.",
      humanReadableReason: `Publication state ${fixture.publicationState} still exposed ${fixture.observed.outputState}.`,
    });
  }

  applyDraftSettlementAssertions(fixture, failures);
  applyNetworkAssertions(fixture, failures);
  applyHiddenDomAssertions(fixture, failures);
  applyArtifactAssertions(fixture, failures);
  applyAuditAssertions(fixture, failures, policy);
  applyRecoveryAssertions(fixture, failures, policy);

  return {
    fixtureId: fixture.fixtureId,
    role: fixture.role,
    routeFamily: fixture.routeFamily,
    killSwitch: fixture.killSwitch,
    invocationAllowed: fixture.expected.invocationAllowed,
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
    auditEvidenceRefs: fixture.observed.auditEvents,
  };
}

export function evaluatePhase8InvocationCorpus(
  corpus: Phase8InvocationRegressionCorpus,
  thresholdConfig: Phase8InvocationThresholdConfig,
  metadata: Phase8InvocationReportMetadata,
): Phase8InvocationRegressionReport {
  validateCorpusShape(corpus);
  const verdicts = corpus.fixtures.map(evaluatePhase8InvocationFixture);
  const metrics = computePhase8InvocationMetrics(corpus, verdicts);
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
    generatedAt: metadata.generatedAt,
    commit: metadata.commit,
  };

  return {
    reportId: `phase8_invocation_report_${hashFor(reportBasis).slice(0, 12)}`,
    reportVersion: "429.phase8.invocation-regression-report.v1",
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
    evidenceArtifactRef: `phase8-invocation-evidence:${corpus.fixtureVersion}:${thresholdConfig.thresholdVersion}`,
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

export function summarizePhase8InvocationReport(report: Phase8InvocationRegressionReport): string {
  const lines = [
    `# Phase 8 Invocation Regression Report ${report.reportId}`,
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

export function phase8InvocationThresholdsToCsv(report: Phase8InvocationRegressionReport): string {
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

function applyKillSwitchAssertions(
  fixture: Phase8InvocationRegressionFixture,
  failures: Phase8InvocationFailure[],
  policy: Phase8InvocationPolicyDecision,
): void {
  if (!fixture.observed.reasonCodes.includes(`kill_switch_${fixture.killSwitch}`)) {
    pushFailure(failures, fixture, {
      failureType: "kill_switch_not_enforced",
      severity: "critical",
      sourceRef: "phase8:kill-switch",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Kill switches must expose specific reason codes and take effect without refresh assumptions.",
      humanReadableReason: `Missing kill-switch reason code for ${policy.killSwitchLevel}.`,
    });
  }
  if (fixture.observed.allowedActions.includes("insert_draft") || fixture.observed.allowedActions.includes("invoke_assistive")) {
    pushFailure(failures, fixture, {
      failureType: "kill_switch_not_enforced",
      severity: "critical",
      sourceRef: "phase8:kill-switch",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Kill switches must remove or disable invocation and insertion controls.",
      humanReadableReason: "Kill-switched fixture still exposed invocation or insertion as an allowed action.",
    });
  }
  if (fixture.openOutputAtDecision && fixture.observed.outputState !== "frozen" && fixture.observed.outputState !== "read_only") {
    pushFailure(failures, fixture, {
      failureType: "open_output_not_frozen",
      severity: "critical",
      sourceRef: "phase8:kill-switch-open-output",
      observedRef: fixture.observed.outputState,
      requiredAlgorithmRule: "Open assistive output must freeze, invalidate, or become read-only when a kill switch lands.",
      humanReadableReason: "Kill switch did not freeze an already-open output.",
    });
  }
}

function applyDraftSettlementAssertions(
  fixture: Phase8InvocationRegressionFixture,
  failures: Phase8InvocationFailure[],
): void {
  const draftVisible =
    fixture.observed.draftState === "preview" ||
    fixture.observed.draftState === "inserted_pending_human" ||
    fixture.observed.draftState === "undone";
  if (!draftVisible) {
    return;
  }
  const settlement = fixture.observed.commandSettlement;
  if (!settlement) {
    pushFailure(failures, fixture, {
      failureType: "command_settlement_identity_missing",
      severity: "critical",
      sourceRef: "phase8:command-settlement",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Draft insertion must bind to UIEventEnvelope, CommandActionRecord, and CommandSettlementRecord.",
      humanReadableReason: "Draft state is visible without command settlement proof.",
    });
    return;
  }
  if (
    settlement.initiatedBy !== "human" ||
    settlement.finalAuthority !== "human_command" ||
    !settlement.suggestionMarked ||
    !settlement.undoAvailable ||
    !settlement.sourceRefsInspectable ||
    !settlement.unsupportedWarningsInspectable
  ) {
    pushFailure(failures, fixture, {
      failureType: settlement.finalAuthority === "model_command" ? "autonomous_write_path" : "command_settlement_identity_missing",
      severity: "critical",
      sourceRef: "phase8:human-settlement",
      observedRef: settlement.commandSettlementRecordRef,
      requiredAlgorithmRule: "Draft insertion must be visible, reversible, source-inspectable, and human-settled.",
      humanReadableReason: "Draft command settlement proof did not identify a human authority with undo and source inspection.",
    });
  }
  if (settlement.authoritativeMutationEndpoint) {
    pushFailure(failures, fixture, {
      failureType: "autonomous_write_path",
      severity: "critical",
      sourceRef: "phase8:no-autonomous-write",
      observedRef: settlement.authoritativeMutationEndpoint,
      requiredAlgorithmRule: "Assistive draft insertion must not save authoritative patient, booking, pharmacy, or task state.",
      humanReadableReason: `Settlement attempted authoritative endpoint ${settlement.authoritativeMutationEndpoint}.`,
    });
  }
}

function applyNetworkAssertions(
  fixture: Phase8InvocationRegressionFixture,
  failures: Phase8InvocationFailure[],
): void {
  const prohibitedRequests = detectProhibitedMutationRequests(fixture.observed.networkRequests);
  for (const requestUrl of prohibitedRequests) {
    pushFailure(failures, fixture, {
      failureType: "prohibited_network_mutation",
      severity: "critical",
      sourceRef: "phase8:no-autonomous-write-network",
      observedRef: requestUrl,
      requiredAlgorithmRule: "Browser insertion proof must show no patient-send, booking-commit, pharmacy-outcome, or task-close request.",
      humanReadableReason: `Observed prohibited mutation request ${requestUrl}.`,
    });
  }
}

function applyHiddenDomAssertions(
  fixture: Phase8InvocationRegressionFixture,
  failures: Phase8InvocationFailure[],
): void {
  const leakedTokens = ["RAW_ASSISTIVE_RATIONALE", "CLINICIAN_ONLY_RATIONALE", "UNSETTLED_MODEL_DRAFT"];
  for (const token of leakedTokens) {
    if (fixture.observed.hiddenDomText.includes(token)) {
      pushFailure(failures, fixture, {
        failureType: "hidden_dom_leak",
        severity: "critical",
        sourceRef: "phase8:hidden-dom",
        observedRef: token,
        requiredAlgorithmRule: "Blocked or wrong-surface assistive content must not be present in hidden DOM.",
        humanReadableReason: `Hidden DOM contained disallowed token ${token}.`,
      });
    }
  }
  if (
    fixture.audienceSurface === "patient_facing" &&
    !fixture.humanSettledTransform &&
    fixture.observed.visibleText.toLowerCase().includes("assistive rationale")
  ) {
    pushFailure(failures, fixture, {
      failureType: "wrong_surface_leak",
      severity: "critical",
      sourceRef: "phase8:patient-surface",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Patient-facing surfaces cannot show raw assistive rationale.",
      humanReadableReason: "Patient surface text contained raw assistive rationale wording.",
    });
  }
  if (fixture.role === "support" && fixture.observed.visibleText.includes("clinician-only rationale")) {
    pushFailure(failures, fixture, {
      failureType: "disclosure_fence_violation",
      severity: "critical",
      sourceRef: "phase8:support-disclosure-ceiling",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Support replay disclosure ceilings must mask clinician-only rationale.",
      humanReadableReason: "Support fixture exposed clinician-only rationale.",
    });
  }
}

function applyArtifactAssertions(
  fixture: Phase8InvocationRegressionFixture,
  failures: Phase8InvocationFailure[],
): void {
  if (fixture.audienceSurface !== "artifact_preview") {
    return;
  }
  const artifact = fixture.observed.artifactPresentation;
  if (!artifact || !artifact.artifactPresentationContractRef || !artifact.disclosureFenceRef) {
    pushFailure(failures, fixture, {
      failureType: "artifact_contract_missing",
      severity: "high",
      sourceRef: "phase0:ArtifactPresentationContract",
      observedRef: fixture.fixtureId,
      requiredAlgorithmRule: "Artifact preview and download surfaces must bind to ArtifactPresentationContract and disclosure fence.",
      humanReadableReason: "Artifact preview lacked presentation contract proof.",
    });
  }
}

function applyAuditAssertions(
  fixture: Phase8InvocationRegressionFixture,
  failures: Phase8InvocationFailure[],
  policy: Phase8InvocationPolicyDecision,
): void {
  for (const auditEvent of [...fixture.expected.auditEvents, ...policy.requiredAuditEvents]) {
    if (!fixture.observed.auditEvents.includes(auditEvent)) {
      pushFailure(failures, fixture, {
        failureType: "audit_event_missing",
        severity: "high",
        sourceRef: "phase8:audit-evidence",
        observedRef: auditEvent,
        requiredAlgorithmRule: "Invocation, insertion, rejection, and kill-switch outcomes must emit audit evidence.",
        humanReadableReason: `Missing audit event ${auditEvent}.`,
      });
    }
  }
  for (const evidenceEvent of [...fixture.expected.evidenceEvents, ...policy.requiredEvidenceEvents]) {
    if (!fixture.observed.evidenceEvents.includes(evidenceEvent)) {
      pushFailure(failures, fixture, {
        failureType: "evidence_event_missing",
        severity: "high",
        sourceRef: "phase8:assurance-evidence",
        observedRef: evidenceEvent,
        requiredAlgorithmRule: "Regression outcomes must emit assurance evidence consumable by the Phase 8 exit gate.",
        humanReadableReason: `Missing evidence event ${evidenceEvent}.`,
      });
    }
  }
}

function applyRecoveryAssertions(
  fixture: Phase8InvocationRegressionFixture,
  failures: Phase8InvocationFailure[],
  policy: Phase8InvocationPolicyDecision,
): void {
  if (!policy.allowedRecoveryPaths.includes(fixture.observed.recoveryPath)) {
    pushFailure(failures, fixture, {
      failureType: "recovery_path_illegal",
      severity: "high",
      sourceRef: "phase8:recovery-disposition",
      observedRef: fixture.observed.recoveryPath,
      requiredAlgorithmRule: "Recovery actions must be shown only when the source algorithm permits them.",
      humanReadableReason: `Recovery path ${fixture.observed.recoveryPath} was not in ${policy.allowedRecoveryPaths.join(", ")}.`,
    });
  }
}

function computePhase8InvocationMetrics(
  corpus: Phase8InvocationRegressionCorpus,
  verdicts: readonly Phase8InvocationFixtureVerdict[],
): Record<string, number> {
  const total = corpus.fixtures.length;
  const allowedFixtures = corpus.fixtures.filter((fixture) => fixture.expected.invocationAllowed);
  const blockedFixtures = corpus.fixtures.filter((fixture) => !fixture.expected.invocationAllowed);
  const killSwitchFixtures = corpus.fixtures.filter((fixture) => fixture.killSwitch !== "none");
  const killSwitchesCovered = REQUIRED_KILL_SWITCH_LEVELS.filter((switchLevel) =>
    corpus.fixtures.some((fixture) => fixture.killSwitch === switchLevel),
  ).length;
  const draftFixtures = corpus.fixtures.filter(
    (fixture) => fixture.observed.draftState === "preview" || fixture.observed.draftState === "inserted_pending_human",
  );
  const stalePublicationFixtures = corpus.fixtures.filter((fixture) => fixture.publicationState !== "current");
  const allFailures = verdicts.flatMap((verdict) => verdict.failures);
  const passedById = new Set(verdicts.filter((verdict) => verdict.passed).map((verdict) => verdict.fixtureId));
  const allNetworkRequests = corpus.fixtures.flatMap((fixture) => fixture.observed.networkRequests);
  const completeAuditFixtures = corpus.fixtures.filter((fixture) =>
    fixture.expected.auditEvents.every((auditEvent) => fixture.observed.auditEvents.includes(auditEvent)),
  );
  const completeEvidenceFixtures = corpus.fixtures.filter((fixture) =>
    fixture.expected.evidenceEvents.every((evidenceEvent) => fixture.observed.evidenceEvents.includes(evidenceEvent)),
  );
  const humanSettledDrafts = draftFixtures.filter((fixture) => {
    const settlement = fixture.observed.commandSettlement;
    return (
      settlement &&
      settlement.initiatedBy === "human" &&
      settlement.finalAuthority === "human_command" &&
      settlement.suggestionMarked &&
      settlement.undoAvailable
    );
  });
  const staleBlocked = stalePublicationFixtures.filter((fixture) =>
    ["blocked", "frozen", "read_only", "hidden"].includes(fixture.observed.outputState),
  );
  const recoveryLegal = corpus.fixtures.filter((fixture) => {
    const policy = evaluateInvocationPolicy(fixture);
    return policy.allowedRecoveryPaths.includes(fixture.observed.recoveryPath);
  });
  const surfaceFencePassed = corpus.fixtures.filter((fixture) => {
    const fence = enforceDisclosureFence(fixture);
    return fence.allowed || !fixture.observed.surfaceVisible;
  });

  return {
    fixturePassRate: ratio(verdicts.filter((verdict) => verdict.passed).length, total),
    allowedInvocationPassRate: ratio(allowedFixtures.filter((fixture) => passedById.has(fixture.fixtureId)).length, allowedFixtures.length),
    blockedInvocationPassRate: ratio(blockedFixtures.filter((fixture) => passedById.has(fixture.fixtureId)).length, blockedFixtures.length),
    killSwitchCoverageRate: ratio(killSwitchesCovered, REQUIRED_KILL_SWITCH_LEVELS.length),
    killSwitchPassRate: ratio(killSwitchFixtures.filter((fixture) => passedById.has(fixture.fixtureId)).length, killSwitchFixtures.length),
    wrongSurfaceLeakRate: ratio(
      allFailures.filter((failure) => failure.failureType === "wrong_surface_leak").length,
      total,
    ),
    autonomousWritePathRate: ratio(
      allFailures.filter((failure) => failure.failureType === "autonomous_write_path").length,
      total,
    ),
    draftHumanSettlementRate: ratio(humanSettledDrafts.length, draftFixtures.length),
    auditEvidenceCompletenessRate: ratio(completeAuditFixtures.length, total),
    assuranceEvidenceCompletenessRate: ratio(completeEvidenceFixtures.length, total),
    stalePublicationBlockRate: ratio(staleBlocked.length, stalePublicationFixtures.length),
    hiddenDomLeakRate: ratio(
      allFailures.filter((failure) => failure.failureType === "hidden_dom_leak").length,
      total,
    ),
    prohibitedNetworkMutationRate: ratio(detectProhibitedMutationRequests(allNetworkRequests).length, Math.max(allNetworkRequests.length, 1)),
    recoveryLegalityRate: ratio(recoveryLegal.length, total),
    surfaceFencePassRate: ratio(surfaceFencePassed.length, total),
  };
}

function validateCorpusShape(corpus: Phase8InvocationRegressionCorpus): void {
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
    if (fixture.expected.auditEvents.length === 0) {
      throw new Error(`Fixture ${fixture.fixtureId} has no expected audit events.`);
    }
    if (fixture.expected.evidenceEvents.length === 0) {
      throw new Error(`Fixture ${fixture.fixtureId} has no expected evidence events.`);
    }
  }
}

function isRoleAllowedForRoute(role: Phase8InvocationRole, routeFamily: Phase8InvocationRouteFamily): boolean {
  if (role === "clinician") {
    return CLINICAL_ROUTE_FAMILIES.includes(routeFamily);
  }
  if (role === "admin" || role === "governance") {
    return routeFamily === "assurance_admin";
  }
  if (role === "support") {
    return routeFamily === "support_replay";
  }
  return false;
}

function isRouteAllowedForSurface(
  routeFamily: Phase8InvocationRouteFamily,
  audienceSurface: Phase8AudienceSurface,
  humanSettledTransform: boolean,
): boolean {
  if (audienceSurface === "patient_facing") {
    return humanSettledTransform;
  }
  if (CLINICAL_ROUTE_FAMILIES.includes(routeFamily)) {
    return audienceSurface === "staff_workspace" || audienceSurface === "artifact_preview";
  }
  if (routeFamily === "support_replay") {
    return audienceSurface === "support_replay";
  }
  return audienceSurface === "ops_internal" || audienceSurface === "release_admin";
}

function allowedRecoveryPathsFor(fixture: Phase8InvocationRegressionFixture): readonly Phase8RecoveryPath[] {
  if (fixture.humanSettledTransform && fixture.audienceSurface === "patient_facing") {
    return ["none", "human_transform_only"];
  }
  if (fixture.disclosureScope === "break_glass_required") {
    return ["break_glass_review", "release_admin", "none"];
  }
  if (fixture.publicationState !== "current" || fixture.killSwitch === "runtime_publication_rollback") {
    return ["release_admin", "none"];
  }
  if (
    fixture.killSwitch === "workspace_session_stale_freeze" ||
    fixture.trustState === "stale"
  ) {
    return ["regenerate_in_place", "none"];
  }
  if (fixture.killSwitch !== "none" || fixture.rolloutState === "frozen") {
    return ["release_admin", "none"];
  }
  if (fixture.audienceSurface === "patient_facing" && !fixture.humanSettledTransform) {
    return ["human_transform_only", "none"];
  }
  return ["none"];
}

function requiredBlockedActionsFor(
  fixture: Phase8InvocationRegressionFixture,
  draftInsertionPermitted: boolean,
): readonly string[] {
  const blocked = new Set<string>([
    "send_to_patient",
    "commit_booking",
    "change_pharmacy_outcome",
    "close_task",
    "save_authoritative_patient_state",
  ]);
  if (!draftInsertionPermitted) {
    blocked.add("insert_draft");
  }
  if (
    fixture.killSwitch !== "none" ||
    fixture.rolloutState === "disabled" ||
    fixture.rolloutState === "shadow" ||
    fixture.rolloutState === "frozen" ||
    fixture.rolloutState === "rollback"
  ) {
    blocked.add("invoke_assistive");
  }
  return [...blocked].sort();
}

function requiredAuditEventsFor(
  fixture: Phase8InvocationRegressionFixture,
  invocationAllowed: boolean,
): readonly string[] {
  const events = new Set<string>(["assistive.invocation.policy_evaluated"]);
  events.add(invocationAllowed ? "assistive.invocation.allowed" : "assistive.invocation.blocked");
  if (fixture.killSwitch !== "none") {
    events.add("assistive.kill_switch.enforced");
  }
  if (fixture.observed.draftState === "preview" || fixture.observed.draftState === "inserted_pending_human") {
    events.add("assistive.draft.command_built");
  }
  return [...events].sort();
}

function requiredEvidenceEventsFor(
  fixture: Phase8InvocationRegressionFixture,
  invocationAllowed: boolean,
): readonly string[] {
  const events = new Set<string>(["assistive.evidence.invocation_fixture_recorded"]);
  events.add(invocationAllowed ? "assistive.evidence.allowed_path_recorded" : "assistive.evidence.blocked_path_recorded");
  if (fixture.killSwitch !== "none") {
    events.add("assistive.evidence.kill_switch_recorded");
  }
  return [...events].sort();
}

function expectationFailureType(reasonCodes: readonly string[]): Phase8InvocationFailureType {
  if (reasonCodes.some((reason) => reason.startsWith("trust_"))) {
    return "trust_not_authorized";
  }
  if (reasonCodes.some((reason) => reason.startsWith("publication_"))) {
    return "publication_not_current";
  }
  if (reasonCodes.some((reason) => reason.startsWith("rollout_"))) {
    return "rollout_not_authorized";
  }
  if (reasonCodes.some((reason) => reason.startsWith("disclosure_"))) {
    return "disclosure_fence_violation";
  }
  if (reasonCodes.includes("role_not_allowed")) {
    return "role_not_allowed";
  }
  if (reasonCodes.includes("route_surface_not_allowed") || reasonCodes.includes("wrong_audience_surface")) {
    return "route_not_allowed";
  }
  return "fixture_expectation_mismatch";
}

function assertArrayContainsAll(
  failures: Phase8InvocationFailure[],
  fixture: Phase8InvocationRegressionFixture,
  expected: readonly string[],
  observed: readonly string[],
  failureType: Phase8InvocationFailureType,
  requiredAlgorithmRule: string,
): void {
  for (const expectedValue of expected) {
    if (!observed.includes(expectedValue)) {
      pushFailure(failures, fixture, {
        failureType,
        severity: failureType === "missing_blocked_action" ? "critical" : "high",
        sourceRef: "phase8:fixture-oracle",
        observedRef: expectedValue,
        requiredAlgorithmRule,
        humanReadableReason: `Missing expected value ${expectedValue}.`,
      });
    }
  }
}

function pushFailure(
  failures: Phase8InvocationFailure[],
  fixture: Phase8InvocationRegressionFixture,
  failure: Omit<Phase8InvocationFailure, "fixtureId" | "routeFamily" | "auditEvidenceRef">,
): void {
  failures.push({
    fixtureId: fixture.fixtureId,
    routeFamily: fixture.routeFamily,
    auditEvidenceRef: fixture.observed.auditEvents[0] ?? `audit:${fixture.fixtureId}:missing`,
    ...failure,
  });
}

function compareMetric(
  observed: number,
  comparator: Phase8InvocationThresholdDefinition["comparator"],
  threshold: number,
): boolean {
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
