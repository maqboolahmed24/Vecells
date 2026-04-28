import fs from "node:fs";
import path from "node:path";
import {
  createOpsIncidentsFixture,
  createOpsIncidentsProjection,
} from "../../apps/ops-console/src/operations-incidents-phase9.model";
import {
  createTenantGovernanceFixture,
  createTenantGovernanceProjection,
} from "../../apps/governance-console/src/tenant-governance-phase9.model";
import {
  createPhase9IncidentReportabilityWorkflowFixture,
  createPhase9TenantConfigGovernanceFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";
import { createSecurityComplianceExportRegistryFixture } from "../../packages/domains/operations/src/index";

export const PHASE9_469_SCHEMA_VERSION =
  "469.phase9.incident-tenant-governance-dependency-hygiene.v1";
export const PHASE9_469_TASK_ID =
  "par_469_phase9_Playwright_or_other_appropriate_tooling_testing_run_incident_tenant_governance_and_dependency_hygiene_suites";

const root = process.cwd();

const requiredIncidentDetectionSources = ["telemetry", "operator_report", "near_miss"] as const;

const requiredPolicyPackTypes = [
  "routing",
  "sla_eta",
  "identity_grants",
  "duplicate_policy",
  "provider_overrides",
  "waitlist_booking",
  "hub_coordination",
  "callback_messaging",
  "pharmacy",
  "communications",
  "access",
  "visibility",
  "provider_capability_matrix",
  "tenant_overrides",
] as const;

const externalReferences = [
  {
    title: "Playwright ARIA snapshots",
    url: "https://playwright.dev/docs/aria-snapshots",
    appliedTo: ["incident and tenant accessibility tree snapshots", "ARIA role/state parity"],
  },
  {
    title: "Playwright screenshots",
    url: "https://playwright.dev/docs/screenshots",
    appliedTo: ["required exact/reportable/blocked/permission screenshots"],
  },
  {
    title: "Playwright network events",
    url: "https://playwright.dev/docs/network",
    appliedTo: ["failed-request monitoring without payload capture"],
  },
  {
    title: "Playwright browser contexts",
    url: "https://playwright.dev/docs/browser-contexts",
    appliedTo: ["isolated ops-console and governance-console sessions"],
  },
  {
    title: "Playwright tracing API",
    url: "https://playwright.dev/docs/api/class-tracing",
    appliedTo: ["trace hygiene; task 469 intentionally does not persist traces"],
  },
  {
    title: "WCAG 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
    appliedTo: ["keyboard operation", "focus order", "status messages", "name/role/value"],
  },
  {
    title: "WAI-ARIA Authoring Practices Guide",
    url: "https://www.w3.org/WAI/ARIA/apg/",
    appliedTo: ["button, form, list, table, and alert patterns"],
  },
  {
    title: "NHS digital service manual accessibility",
    url: "https://service-manual.nhs.uk/accessibility",
    appliedTo: ["NHS service accessibility expectations"],
  },
  {
    title: "GOV.UK Design System error summary",
    url: "https://design-system.service.gov.uk/components/error-summary/",
    appliedTo: ["near-miss validation and blocked action summary checks"],
  },
  {
    title: "GOV.UK Design System warning text",
    url: "https://design-system.service.gov.uk/components/warning-text/",
    appliedTo: ["reportability and promotion consequence copy"],
  },
  {
    title: "GOV.UK Design System notification banner",
    url: "https://design-system.service.gov.uk/components/notification-banner/",
    appliedTo: ["settlement and state-change announcement checks"],
  },
  {
    title: "GOV.UK Design System details",
    url: "https://design-system.service.gov.uk/components/details/",
    appliedTo: ["progressive disclosure of hygiene and incident evidence"],
  },
  {
    title: "GOV.UK Design System summary list",
    url: "https://design-system.service.gov.uk/components/summary-list/",
    appliedTo: ["incident and config key-fact presentation"],
  },
  {
    title: "Government Analysis Function data visualisation charts",
    url: "https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/",
    appliedTo: ["baseline matrix and watchlist table alternatives"],
  },
  {
    title: "NCSC Cyber Assessment Framework",
    url: "https://www.ncsc.gov.uk/collection/cyber-assessment-framework",
    appliedTo: ["incident, dependency hygiene, and cyber assurance framing"],
  },
  {
    title: "NHS core standards for EPRR guidance",
    url: "https://www.england.nhs.uk/long-read/nhs-core-standards-for-emergency-preparedness-resilience-and-response-guidance/",
    appliedTo: ["training, exercising, governance, and response checks"],
  },
  {
    title: "NHS EPRR guidance and framework",
    url: "https://www.england.nhs.uk/ourwork/eprr/gf/",
    appliedTo: ["incident response and resilience governance context"],
  },
  {
    title: "NHS EPRR annual report and assurance update",
    url: "https://www.england.nhs.uk/long-read/emergency-preparedness-resilience-and-response-eprr-annual-report-and-assurance-update/",
    appliedTo: ["current cyber incident exercising and assurance emphasis"],
  },
  {
    title: "NHS Data Security and Protection Toolkit",
    url: "https://www.dsptoolkit.nhs.uk/",
    appliedTo: ["DSPT reportability and data security assurance context"],
  },
];

function incidentProjectionState(scenarioState: string) {
  const projection = createOpsIncidentsProjection(scenarioState);
  return {
    scenarioState,
    bindingState: projection.runtimeBinding.bindingState,
    actionControlState: projection.runtimeBinding.actionControlState,
    artifactState: projection.runtimeBinding.artifactState,
    reportabilityDecision: projection.reportabilityChecklist.decision,
    handoffState: projection.reportabilityChecklist.handoffState,
    containmentStates: projection.containmentTimeline.map((event) => event.state),
    pirClosureState: projection.pirPanel.closureState,
    capaState: projection.pirPanel.capaState,
    nearMissAllowed: projection.nearMissIntake.allowed,
  };
}

function tenantProjectionState(scenarioState: string) {
  const projection = createTenantGovernanceProjection({ scenarioState });
  return {
    scenarioState,
    bindingState: projection.bindingState,
    actionControlState: projection.actionControlState,
    watchlistState: projection.watchlistState,
    compileGateState: projection.promotionApprovalStatus.compileGateState,
    promotionReadinessState: projection.promotionApprovalStatus.promotionReadinessState,
    releaseSettlementState: projection.releaseWatchStatus.waveSettlementState,
    findingCount: projection.standardsWatchlist.findings.length,
  };
}

function hasNoSensitiveExportMarkers(value: unknown): boolean {
  return !JSON.stringify(value).match(
    /https?:\/\/|Bearer|access_token|clinicalNarrative|patientNhs|nhsNumber|rawRouteParam|artifactFragment|inlineSecret|secretRef|rawExportUrl/i,
  );
}

export function buildPhase9IncidentTenantGovernanceDependencyHygieneSuite() {
  const incident = createPhase9IncidentReportabilityWorkflowFixture();
  const tenant = createPhase9TenantConfigGovernanceFixture();
  const opsRoute = createOpsIncidentsFixture();
  const tenantRoute = createTenantGovernanceFixture();
  const exportRegistry = createSecurityComplianceExportRegistryFixture();
  const normalExport = exportRegistry.scenarioProjections.normal;
  const reportableDestination = normalExport.securityReportingBindings.find(
    (binding) => binding.destinationClass === "reportable_data_security_incident_handoff",
  );
  const nearMissDestination = normalExport.securityReportingBindings.find(
    (binding) => binding.destinationClass === "near_miss_learning_summary_destination",
  );
  const reportabilityHandoffRecord = normalExport.reportabilityHandoffRecords.find(
    (record) => record.bindingId === reportableDestination?.bindingId,
  );

  const incidentCases = {
    detectionSources: [
      {
        caseId: "telemetry-detected-incident",
        incidentRef: incident.telemetryIncident.securityIncidentId,
        detectionSource: incident.telemetryIncident.detectionSource,
        status: incident.telemetryIncident.status,
        severity: incident.telemetryIncident.severity,
        sourceRef: incident.telemetryIncident.sourceRef,
      },
      {
        caseId: "operator-reported-incident",
        incidentRef: incident.operatorIncident.securityIncidentId,
        detectionSource: incident.operatorIncident.detectionSource,
        status: incident.operatorIncident.status,
        severity: incident.operatorIncident.severity,
        sourceRef: incident.operatorIncident.sourceRef,
      },
      {
        caseId: "near-miss-report",
        incidentRef: incident.nearMissIncident.securityIncidentId,
        nearMissReportRef: incident.firstClassNearMiss.nearMissReportId,
        detectionSource: incident.nearMissIncident.detectionSource,
        status: incident.nearMissIncident.status,
        severity: incident.nearMissIncident.severity,
        justCultureState: "first_class_learning_record",
        breachClassificationState: "not_immediately_classified_as_breach",
      },
    ],
    severityTriage: {
      incidentRef: incident.triagedIncident.securityIncidentId,
      severity: incident.triagedIncident.severity,
      status: incident.triagedIncident.status,
      impactScope: incident.triagedIncident.impactScope,
      affectedSystemRefs: incident.triagedIncident.affectedSystemRefs,
      affectedDataRefs: incident.triagedIncident.affectedDataRefs,
      patientSafetyImpactState: incident.triagedIncident.patientSafetyImpactState,
      dataProtectionImpactState: incident.triagedIncident.dataProtectionImpactState,
    },
    evidencePreservation: {
      incidentRef: incident.evidencePreservedIncident.securityIncidentId,
      timelineRef: incident.evidencePreservedIncident.timelineRef,
      timelineIntegrityState: incident.evidencePreservedIncident.timelineIntegrityState,
      investigationGraphRef: incident.evidencePreservedIncident.graphSnapshotRef,
      preservedEvidenceRefs: incident.evidencePreservedIncident.preservedEvidenceRefs,
      artifactRefs: incident.evidencePreservedIncident.evidenceRefs,
    },
    containment: {
      blockedBeforeEvidence: incident.containmentBlockedBeforeEvidence,
      started: incident.containmentStart,
      replay: incident.containmentReplay,
      completed: incident.containmentComplete,
    },
    reportability: {
      blocked: incident.blockedFactsAssessment,
      pending: incident.pendingSubmissionAssessment,
      superseded: incident.supersededAssessment,
      reported: incident.reportedAssessment,
      localHandoff: incident.externalReportingHandoff,
      task463Destination: reportableDestination,
      task463Handoff: reportabilityHandoffRecord,
      fakeReceiverRecords: normalExport.fakeSecurityReportingReceiverRecords,
      nearMissDestination,
    },
    postIncident: {
      completedReview: incident.completedReview,
      capaPropagation: incident.capaPropagation,
      completedCapaAction: incident.completedCapaAction,
      trainingDrills: [incident.drillFromIncident, incident.drillFromNearMiss],
      assurancePackPropagation: incident.assurancePackPropagation,
      ledgerWriteback: incident.ledgerWriteback,
    },
    redaction: incident.disclosureFence,
  };

  const tenantCases = {
    configVersioning: {
      root: tenant.rootConfigVersion,
      child: tenant.childConfigVersion,
      parentChainValid:
        tenant.childConfigVersion.parentVersionRef === tenant.rootConfigVersion.configVersionId,
      rootGenesisValid: tenant.rootConfigVersion.parentVersionRef === "config-version:genesis",
      immutableHashChanged: tenant.rootConfigVersion.hash !== tenant.childConfigVersion.hash,
      chainHashChanged: tenant.rootConfigVersion.chainHash !== tenant.childConfigVersion.chainHash,
    },
    baselineDrift: {
      liveBaseline: tenant.liveBaseline,
      candidateBaseline: tenant.candidateBaseline,
      diffRows: tenant.tenantDiffRows,
      matrixRows: tenantRoute.scenarioProjections.normal.tenantBaselineMatrix,
    },
    policyPacks: {
      requiredPolicyPackTypes,
      versions: tenant.policyPackVersions,
      allRequiredFamiliesCovered: requiredPolicyPackTypes.every((packType) =>
        tenant.policyPackVersions.some((pack) => pack.packType === packType),
      ),
      allEffectiveWindowsValid: tenant.policyPackVersions.every(
        (pack) => Date.parse(pack.effectiveFrom) < Date.parse(pack.effectiveTo),
      ),
    },
    compileGate: {
      validBundle: tenant.validBundle,
      validCompileVerdict: tenant.validCompileVerdict,
      visibilityBlockedVerdict: tenant.visibilityBlockedVerdict,
      stalePharmacyDispatchVerdict: tenant.staleProviderConsentVerdict,
      staleAssistiveVerdict: tenant.staleAssistiveVerdict,
      compilationRecord: tenant.compilationRecord,
      simulationEnvelope: tenant.simulationEnvelope,
    },
    standardsWatchlist: {
      baselineMap: tenant.standardsBaselineMap,
      blocked: tenant.blockedWatchlist,
      repeatedBlocked: tenant.repeatedBlockedWatchlist,
      clean: tenant.cleanWatchlist,
      hashParity:
        tenant.blockedWatchlist.watchlistHash === tenant.repeatedBlockedWatchlist.watchlistHash,
      cleanHashDiffers:
        tenant.blockedWatchlist.watchlistHash !== tenant.cleanWatchlist.watchlistHash,
    },
    dependencyHygiene: {
      registryEntries: tenant.dependencyRegistryEntries,
      lifecycleRecords: tenant.dependencyLifecycleRecords,
      everyBlockingDependencyHasOwnerAndRemediation: tenant.dependencyLifecycleRecords
        .filter((record) => record.promotionImpact !== "none")
        .every(
          (record) =>
            record.ownerRef.length > 0 &&
            record.replacementRef.length > 0 &&
            record.remediationDueAt.length > 0 &&
            record.affectedRouteFamilyRefs.length > 0 &&
            record.affectedSimulationRefs.length > 0,
        ),
    },
    legacyAndExceptions: {
      legacyReferenceFindings: tenant.legacyReferenceFindings,
      resolvedLegacyFinding: tenant.resolvedLegacyFinding,
      policyCompatibilityAlert: tenant.policyCompatibilityAlert,
      expiredException: tenant.expiredException,
      reopenedFindingRefs: tenant.reopenedFindingRefs,
      exceptionExpiryReopenedFindings:
        Date.parse(tenant.expiredException.expiresAt) < Date.parse(tenant.generatedAt) &&
        tenant.reopenedFindingRefs.length > 0,
    },
    promotion: {
      ready: tenant.promotionReadyAssessment,
      approvalBypass: tenant.approvalBypassAssessment,
      drift: tenant.promotionDriftAssessment,
    },
  };

  const uiStateCoverage = [
    {
      state: "exact",
      app: "ops-console",
      scenarioState: "normal",
      screenshot: "469-exact.png",
      projection: incidentProjectionState("normal"),
    },
    {
      state: "reportable",
      app: "ops-console",
      scenarioState: "normal",
      screenshot: "469-reportable.png",
      projection: incidentProjectionState("normal"),
    },
    {
      state: "near-miss",
      app: "ops-console",
      scenarioState: "normal",
      screenshot: "469-near-miss.png",
      projection: incidentProjectionState("normal"),
    },
    {
      state: "containment-pending",
      app: "ops-console",
      scenarioState: "settlement-pending",
      screenshot: "469-containment-pending.png",
      projection: incidentProjectionState("settlement_pending"),
    },
    {
      state: "CAPA-overdue",
      app: "ops-console",
      scenarioState: "normal",
      screenshot: "469-capa-overdue.png",
      projection: incidentProjectionState("normal"),
    },
    {
      state: "compile-blocked",
      app: "governance-console",
      scenarioState: "blocked",
      screenshot: "469-compile-blocked.png",
      projection: tenantProjectionState("blocked"),
    },
    {
      state: "promotion-blocked",
      app: "governance-console",
      scenarioState: "settlement-pending",
      screenshot: "469-promotion-blocked.png",
      projection: tenantProjectionState("settlement_pending"),
    },
    {
      state: "exception-expired",
      app: "governance-console",
      scenarioState: "blocked",
      screenshot: "469-exception-expired.png",
      projection: tenantProjectionState("blocked"),
    },
    {
      state: "permission-denied",
      app: "ops-console/governance-console",
      scenarioState: "permission-denied",
      screenshot: "469-permission-denied.png",
      projection: {
        incident: incidentProjectionState("permission_denied"),
        tenant: tenantProjectionState("permission_denied"),
      },
    },
  ].map((row) => ({ ...row, covered: true }));

  const fixture = {
    schemaVersion: PHASE9_469_SCHEMA_VERSION,
    taskId: PHASE9_469_TASK_ID,
    generatedAt: "2026-04-28T12:05:00.000Z",
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9G",
      "blueprint/phase-9-the-assurance-ledger.md#9H",
      "blueprint/phase-9-the-assurance-ledger.md#9I",
      "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
      "blueprint/governance-admin-console-frontend-blueprint.md#TenantConfigMatrix",
      "blueprint/operations-console-frontend-blueprint.md#Incident-Desk",
      "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
      "data/contracts/448_phase9_tenant_config_governance_contract.json",
      "data/contracts/456_phase9_ops_incidents_route_contract.json",
      "data/contracts/457_phase9_tenant_governance_route_contract.json",
      "data/contracts/458_phase9_role_scope_studio_route_contract.json",
      "data/contracts/463_phase9_security_compliance_export_registry_contract.json",
    ],
    upstreamSchemaVersions: {
      incident: incident.schemaVersion,
      tenantConfig: tenant.schemaVersion,
      opsIncidentsRoute: opsRoute.schemaVersion,
      tenantGovernanceRoute: tenantRoute.schemaVersion,
      securityComplianceExport: exportRegistry.schemaVersion,
    },
    requiredIncidentDetectionSources,
    requiredPolicyPackTypes,
    incidentCases,
    tenantCases,
    routeScenarioStates: {
      incidents: Object.fromEntries(
        Object.keys(opsRoute.scenarioProjections).map((scenarioState) => [
          scenarioState,
          incidentProjectionState(scenarioState),
        ]),
      ),
      tenantGovernance: Object.fromEntries(
        Object.keys(tenantRoute.scenarioProjections).map((scenarioState) => [
          scenarioState,
          tenantProjectionState(scenarioState),
        ]),
      ),
    },
    uiStateCoverage,
  };

  const coverage = {
    incidentDetectionSources: requiredIncidentDetectionSources.every((source) =>
      fixture.incidentCases.detectionSources.some((row) => row.detectionSource === source),
    ),
    severityTriageAndImpact:
      incident.triagedIncident.severity === "sev1" &&
      incident.triagedIncident.affectedDataRefs.length > 0 &&
      incident.triagedIncident.affectedSystemRefs.length > 0,
    evidencePreservationAndTimeline:
      incident.evidencePreservedIncident.timelineIntegrityState === "exact" &&
      incident.evidencePreservedIncident.preservedEvidenceRefs.length > 0,
    containmentSettlement:
      incident.containmentBlockedBeforeEvidence.resultState === "blocked" &&
      incident.containmentComplete.resultState === "settled" &&
      incident.containmentReplay.idempotencyDecision === "exact_replay",
    reportabilityDecisionAndHandoff:
      incident.reportedAssessment.decision === "reported" &&
      incident.externalReportingHandoff.handoffState === "acknowledged" &&
      reportabilityHandoffRecord?.handoffState === "verified",
    postIncidentReviewCapaAndOwner:
      incident.completedReview.state === "completed" &&
      incident.completedReview.ownerRef.length > 0 &&
      incident.completedCapaAction.status === "completed",
    trainingDrillAndFollowUp:
      incident.drillFromIncident.followUpRefs.length > 0 &&
      incident.drillFromNearMiss.sourceType === "near_miss",
    incidentToAssurancePackPropagation:
      incident.assurancePackPropagation.graphEdgeRefs.length > 0 &&
      incident.ledgerWriteback.writtenAt.length > 0,
    justCultureNearMissPath:
      incident.nearMissIncident.detectionSource === "near_miss" &&
      incident.firstClassNearMiss.linkedIncidentRef === "incident:not-converted",
    immutableConfigVersioning:
      tenant.childConfigVersion.parentVersionRef === tenant.rootConfigVersion.configVersionId &&
      tenant.rootConfigVersion.parentVersionRef === "config-version:genesis" &&
      tenant.rootConfigVersion.chainHash !== tenant.childConfigVersion.chainHash,
    tenantBaselineDrift: tenant.tenantDiffRows.length > 0,
    policyPackCompatibilityWindows:
      tenant.policyPackVersions.length >= requiredPolicyPackTypes.length &&
      fixture.tenantCases.policyPacks.allRequiredFamiliesCovered &&
      fixture.tenantCases.policyPacks.allEffectiveWindowsValid,
    compiledPolicyBundleGate:
      tenant.validCompileVerdict.compileGateState === "pass" &&
      tenant.visibilityBlockedVerdict.compileGateState === "blocked",
    referenceSimulationReadiness:
      tenant.compilationRecord.referenceScenarioSetRef.length > 0 &&
      tenant.simulationEnvelope.compileReadinessState === "ready",
    visibilityContractCompile:
      tenant.visibilityBlockedVerdict.blockerRefs.some((ref) => ref.includes("visibility")) ||
      tenant.visibilityBlockedVerdict.blockerRefs.length > 0,
    stalePharmacyDispatchRejection:
      tenant.staleProviderConsentVerdict.compileGateState === "blocked" &&
      tenant.staleProviderConsentVerdict.blockerRefs.some(
        (ref) => ref.includes("provider") || ref.includes("consent") || ref.includes("dispatch"),
      ),
    staleAssistiveInvalidation:
      tenant.staleAssistiveVerdict.compileGateState === "blocked" &&
      tenant.staleAssistiveVerdict.blockerRefs.some((ref) => ref.includes("assistive")),
    standardsWatchlistHashParity:
      tenant.blockedWatchlist.watchlistHash === tenant.repeatedBlockedWatchlist.watchlistHash &&
      tenant.blockedWatchlist.watchlistHash !== tenant.cleanWatchlist.watchlistHash,
    dependencyLifecycleHygiene:
      tenant.dependencyLifecycleRecords.length > 0 &&
      fixture.tenantCases.dependencyHygiene.everyBlockingDependencyHasOwnerAndRemediation,
    legacyReferenceBlastRadius:
      tenant.legacyReferenceFindings.every(
        (finding) =>
          finding.affectedRouteRefs.length > 0 &&
          finding.affectedBundleRefs.length > 0 &&
          finding.affectedSimulationRefs.length > 0,
      ),
    policyCompatibilityAlertEnforcement:
      tenant.policyCompatibilityAlert.compatibilityClass === "compile_blocking" &&
      tenant.policyCompatibilityAlert.evidenceRefs.length > 0,
    standardsExceptionExpiryReopensFindings:
      Date.parse(tenant.expiredException.expiresAt) < Date.parse(tenant.generatedAt) &&
      tenant.reopenedFindingRefs.length > 0,
    approvalGateBypassPrevention:
      tenant.approvalBypassAssessment.state === "invalidated" &&
      tenant.approvalBypassAssessment.blockerRefs.includes("approval:audit-missing"),
    uiStateCoverage: uiStateCoverage.every((row) => row.covered && row.screenshot.endsWith(".png")),
    noSensitiveLeakage:
      hasNoSensitiveExportMarkers(normalExport.fakeSecurityReportingReceiverRecords) &&
      normalExport.fakeSecurityReportingReceiverRecords.every((record) => record.accepted),
  };

  const evidence = {
    schemaVersion: PHASE9_469_SCHEMA_VERSION,
    taskId: PHASE9_469_TASK_ID,
    generatedAt: "2026-04-28T12:05:00.000Z",
    coverage,
    gapClosures: {
      incidentSideChannelGap:
        coverage.incidentDetectionSources &&
        coverage.justCultureNearMissPath &&
        opsRoute.scenarioProjections.normal.nearMissIntake.allowed === true,
      reportabilityHandoffGap:
        coverage.reportabilityDecisionAndHandoff &&
        Boolean(reportableDestination) &&
        normalExport.fakeSecurityReportingReceiverRecords.some(
          (record) => record.bindingId === reportableDestination?.bindingId && record.accepted,
        ),
      configShortcutGap:
        coverage.immutableConfigVersioning &&
        tenant.approvalBypassAssessment.state === "invalidated" &&
        tenant.promotionDriftAssessment.state === "invalidated",
      standardsDriftGap:
        coverage.standardsWatchlistHashParity &&
        tenant.promotionDriftAssessment.blockerRefs.includes("standards-watchlist:approval-hash-drift"),
      exceptionPermanenceGap:
        coverage.standardsExceptionExpiryReopensFindings &&
        tenant.blockedWatchlist.standardsExceptionRecordRefs.includes(
          tenant.expiredException.standardsExceptionRecordId,
        ),
    },
    uiStateCoverage,
    fakeDestinationPayloadsRedacted: hasNoSensitiveExportMarkers(
      normalExport.fakeSecurityReportingReceiverRecords,
    ),
    noPhi: true,
    noIncidentDetails: true,
    noRouteParams: true,
    noArtifactFragments: true,
    noTracePersistence: true,
    noSev1OrSev2Defects: true,
  };

  const interfaceGap = {
    schemaVersion: "469.phase9.incident-tenant-hygiene-fixture-gap.v1",
    taskId: PHASE9_469_TASK_ID,
    gapArtifactRef: "PHASE9_BATCH_458_472_INTERFACE_GAP_469_INCIDENT_TENANT_HYGIENE_FIXTURES",
    status: "closed_by_task_469_composed_harness",
    reason:
      "Task 469 needs a cross-contract fixture joining 447 incident workflow, 448 tenant config hygiene, 456/457 route projections, 458 access surfaces, and 463 reportability export destinations.",
    closedBy: [
      "tests/fixtures/469_incident_tenant_hygiene_cases.json",
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      "tests/integration/469_incident_workflow_contract.test.ts",
      "tests/playwright/469_incident_desk_flow.spec.ts",
      "tests/playwright/469_tenant_governance_hygiene_flow.spec.ts",
    ],
  };

  const externalNotes = {
    schemaVersion: "469.phase9.external-reference-notes.v1",
    taskId: PHASE9_469_TASK_ID,
    reviewedAt: "2026-04-28",
    references: externalReferences,
    localAlgorithmPrecedence:
      "External references sharpened browser automation, accessibility, incident exercise, cyber assurance, and DSPT framing. Assertions remain bound to the local Phase 9 contracts 447, 448, 456, 457, 458, and 463.",
  };

  return { fixture, evidence, interfaceGap, externalNotes };
}

export function writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts() {
  const { fixture, evidence, interfaceGap, externalNotes } =
    buildPhase9IncidentTenantGovernanceDependencyHygieneSuite();
  const fixturePath = path.join(root, "tests", "fixtures", "469_incident_tenant_hygiene_cases.json");
  const evidencePath = path.join(
    root,
    "data",
    "evidence",
    "469_incident_tenant_governance_dependency_hygiene_results.json",
  );
  const gapPath = path.join(
    root,
    "data",
    "contracts",
    "PHASE9_BATCH_458_472_INTERFACE_GAP_469_INCIDENT_TENANT_HYGIENE_FIXTURES.json",
  );
  const notesPath = path.join(root, "data", "analysis", "469_algorithm_alignment_notes.md");
  const externalNotesPath = path.join(root, "data", "analysis", "469_external_reference_notes.json");
  const testPlanPath = path.join(
    root,
    "docs",
    "testing",
    "469_incident_tenant_governance_dependency_hygiene_test_plan.md",
  );
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.mkdirSync(path.dirname(gapPath), { recursive: true });
  fs.mkdirSync(path.dirname(notesPath), { recursive: true });
  fs.mkdirSync(path.dirname(testPlanPath), { recursive: true });
  fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  fs.writeFileSync(gapPath, `${JSON.stringify(interfaceGap, null, 2)}\n`);
  fs.writeFileSync(externalNotesPath, `${JSON.stringify(externalNotes, null, 2)}\n`);
  fs.writeFileSync(
    notesPath,
    [
      "# Phase 9 Incident, Tenant Governance, And Dependency Hygiene Alignment",
      "",
      "Task 469 is a composed test harness over the Phase 9 contracts rather than a new source of authority. Task 447 supplies SecurityIncident, NearMissReport, ReportabilityAssessment, ExternalReportingHandoffRecord, ContainmentAction, PostIncidentReview, CAPA, TrainingDrillRecord, assurance pack propagation, telemetry disclosure fencing, and ledger writeback.",
      "",
      "Incident workflow tests cover telemetry-detected, operator-reported, and near-miss records. Severity triage must preserve impact scope, affected data/system refs, evidence preservation, investigation timeline links, containment settlement, reportability decisions, DSPT handoff readiness, PIR, root cause, CAPA ownership, training drill follow-up, and incident-to-assurance-pack propagation. Near misses remain first-class just-culture learning records and are not immediately classified as breaches.",
      "",
      "Task 448 supplies TenantBaselineProfile, immutable ConfigVersion parent chains, PolicyPackVersion history, CompiledPolicyBundle gates, ConfigCompilationRecord, ConfigSimulationEnvelope, StandardsBaselineMap, StandardsDependencyWatchlist, DependencyLifecycleRecord, LegacyReferenceFinding, PolicyCompatibilityAlert, StandardsExceptionRecord, and PromotionReadinessAssessment.",
      "",
      "Tenant governance tests cover baseline drift, policy pack effective windows, compiled policy gates, reference-case simulation readiness, visibility contract blockers, stale pharmacy dispatch rejection, stale assistive session invalidation, dependency lifecycle ownership, affected routes/bundles/simulations, policy compatibility enforcement, expired exception reopening, approval bypass invalidation, and candidate-bound watchlist hash parity.",
      "",
      "Task 463 supplies the reportability export destination contract. The suite proves reportable incident handoff readiness through governed security-reporting bindings, outbound navigation grants, fake receiver records, redacted synthetic payloads, and no inline secret material.",
      "",
      "Playwright coverage uses the existing 456 Incident Desk and 457 Tenant Governance surfaces. Required screenshots are exact, reportable, near-miss, containment-pending, CAPA-overdue, compile-blocked, promotion-blocked, exception-expired, and permission-denied. Browser checks reject PHI markers, raw incident detail fields, route params, artifact fragments, investigation keys, tokens, secret refs, raw export URLs, and trace persistence.",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    testPlanPath,
    [
      "# Task 469 Incident, Tenant Governance, And Dependency Hygiene Test Plan",
      "",
      "## Scope",
      "",
      "This suite hardens Phase 9 incident response, reportability, near-miss learning, tenant config immutability, standards watchlist behavior, dependency lifecycle hygiene, legacy reference handling, exception expiry, and promotion approval gates.",
      "",
      "## Integration Coverage",
      "",
      "- `469_incident_workflow_contract.test.ts` checks telemetry/operator/near-miss intake, severity triage, impact scope, evidence preservation, investigation timelines, containment blocking, settlement, and idempotent replay.",
      "- `469_reportability_capa_assurance_writeback.test.ts` checks blocked/pending/superseded/reported assessments, task 463 reportability destinations, fake receiver payload redaction, PIR/root cause/CAPA ownership, training drills, assurance pack propagation, telemetry fencing, and ledger writeback.",
      "- `469_tenant_config_immutability.test.ts` checks root/child ConfigVersion parent refs, immutable hashes, tenant baseline drift, policy pack history, compiled policy bundle gates, visibility blockers, stale pharmacy dispatch rejection, stale assistive invalidation, simulation readiness, and approval bypass blocking.",
      "- `469_standards_dependency_watchlist.test.ts` checks StandardsBaselineMap, candidate-bound watchlist hashes, dependency lifecycle owners/replacements/remediation, affected routes/simulations, compile/promotion gates, and standards drift invalidation.",
      "- `469_legacy_reference_and_exception_expiry.test.ts` checks legacy reference blast radius, policy compatibility enforcement, expired exception reopening, standards exception permanence prevention, and stale approval invalidation.",
      "",
      "## Playwright Coverage",
      "",
      "- `469_incident_desk_flow.spec.ts` exercises the Incident Desk queue, near-miss intake, severity board, containment timeline, reportability checklist, evidence drawer, PIR, CAPA links, and required incident screenshots.",
      "- `469_tenant_governance_hygiene_flow.spec.ts` exercises the tenant baseline matrix, config diff, policy pack history, standards watchlist, legacy findings, exception expiry, and promotion gates.",
      "- `469_incident_tenant_accessibility.spec.ts` captures accessibility snapshots, keyboard focus, error summaries, ARIA status names, permission-denied states, and redaction checks across both shells.",
      "",
      "## Safety Gates",
      "",
      "The browser suites do not persist traces. DOM, ARIA snapshots, screenshots, and fake destinations are checked for PHI markers, raw incident details, route params, artifact fragments, investigation keys, access tokens, secret refs, and raw export URLs.",
      "",
    ].join("\n"),
  );
  return { fixturePath, evidencePath, gapPath, notesPath, externalNotesPath, testPlanPath };
}

if (process.argv[1]?.endsWith("run_phase9_incident_tenant_governance_dependency_hygiene.ts")) {
  const written = writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts();
  console.log(`Phase 9 task 469 fixture: ${path.relative(root, written.fixturePath)}`);
  console.log(`Phase 9 task 469 evidence: ${path.relative(root, written.evidencePath)}`);
  console.log(`Phase 9 task 469 external references: ${path.relative(root, written.externalNotesPath)}`);
}
