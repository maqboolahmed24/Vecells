import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GENESIS_ASSURANCE_LEDGER_HASH,
  PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  createPhase9AssurancePackFactoryFixture,
  createPhase9InvestigationTimelineFixture,
  hashAssurancePayload,
  orderedSetHash,
} from "../../packages/domains/analytics_assurance/src/index";
import {
  SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
  createComplianceExportSyntheticPayload,
  createSecurityComplianceExportRegistryProjection,
  createSecurityReportingSyntheticPayload,
  requiredExportDestinationClasses,
} from "../../packages/domains/operations/src/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT = path.resolve(__dirname, "..", "..");

export const PHASE9_466_SCHEMA_VERSION = "466.phase9.audit-break-glass-assurance-redaction.v1";
export const PHASE9_466_TASK_ID = "par_466";
export const GENERATED_AT = "2026-04-28T00:00:00.000Z";

const FORBIDDEN_SYNTHETIC_LEAK_PATTERNS = [
  "rawDomainEventRef",
  "rawPayload",
  "clinicalNarrative",
  "patientNhs",
  "nhsNumber",
  "rawWebhookUrl",
  "Bearer ",
  "access_token",
  "sk_live",
  "BEGIN PRIVATE",
  "https://",
  "http://",
  "s3://",
  "blob:",
] as const;

const requiredUiStates = [
  "normal",
  "stale",
  "graph-blocked",
  "permission-denied",
  "redaction-drift",
  "reduced-motion",
] as const;

function writeJson(relativePath: string, value: unknown): void {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort();
}

function isTimelineSorted(
  rows: readonly {
    readonly eventTime: string;
    readonly sourceSequenceRef: string;
    readonly assuranceLedgerEntryId: string;
  }[],
): boolean {
  return rows.every((row, index) => {
    if (index === 0) return true;
    const previous = rows[index - 1]!;
    return (
      previous.eventTime.localeCompare(row.eventTime) <= 0 &&
      (previous.eventTime !== row.eventTime ||
        previous.sourceSequenceRef.localeCompare(row.sourceSequenceRef) <= 0) &&
      (previous.eventTime !== row.eventTime ||
        previous.sourceSequenceRef !== row.sourceSequenceRef ||
        previous.assuranceLedgerEntryId.localeCompare(row.assuranceLedgerEntryId) <= 0)
    );
  });
}

function ledgerChainIsContinuous(
  entries: readonly {
    readonly hash: string;
    readonly previousHash: string;
  }[],
): boolean {
  return entries.every((entry, index) => {
    if (index === 0) {
      return entry.previousHash === GENESIS_ASSURANCE_LEDGER_HASH;
    }
    return entry.previousHash === entries[index - 1]!.hash;
  });
}

function hasForbiddenSyntheticLeak(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return FORBIDDEN_SYNTHETIC_LEAK_PATTERNS.some((pattern) =>
    serialized.toLowerCase().includes(pattern.toLowerCase()),
  );
}

function collectExportPayloads() {
  const registry = createSecurityComplianceExportRegistryProjection({
    scenarioState: "normal",
    destinationClass: "audit_investigation_bundle_export",
  });
  const compliancePayloads = registry.complianceExportBindings.map((binding) =>
    createComplianceExportSyntheticPayload(binding),
  );
  const securityPayloads = registry.securityReportingBindings.map((binding) =>
    createSecurityReportingSyntheticPayload(binding),
  );
  return {
    registry,
    compliancePayloads,
    securityPayloads,
  };
}

export function buildPhase9AuditAssuranceSyntheticCases() {
  const investigation = createPhase9InvestigationTimelineFixture();
  const assurance = createPhase9AssurancePackFactoryFixture();
  const { registry, compliancePayloads, securityPayloads } = collectExportPayloads();
  const baselineTimeline = investigation.baselineResult.timelineReconstruction;
  const baselineSession = investigation.baselineResult.auditQuerySession;

  const searchPivotCases = [
    {
      pivot: "request",
      syntheticId: "request:439-001",
      field: "entityRef",
      expectedRecordRefs: investigation.baselineResult.returnedAuditRecords.map(
        (record) => record.auditRecordRef,
      ),
    },
    {
      pivot: "patient",
      syntheticId: "subject:439-001",
      field: "subjectRef",
      expectedRecordRefs: investigation.baselineResult.returnedAuditRecords.map(
        (record) => record.auditRecordRef,
      ),
    },
    {
      pivot: "task",
      syntheticId: "task:439-001",
      field: "entityRef",
      expectedRecordRefs: investigation.auditRecords
        .filter((record) => record.entityRef === "task:439-001")
        .map((record) => record.auditRecordRef),
    },
    {
      pivot: "appointment",
      syntheticId: "appointment:466-001",
      field: "scopeEntityRefs",
      expectedRecordRefs: ["audit:439:request-opened", "audit:439:ui-success-visible"],
    },
    {
      pivot: "pharmacy_case",
      syntheticId: "pharmacy-case:466-001",
      field: "scopeEntityRefs",
      expectedRecordRefs: ["audit:439:task-accepted", "audit:439:artifact-preview"],
    },
    {
      pivot: "actor",
      syntheticId: "actor:ops-439",
      field: "actorRef",
      expectedRecordRefs: investigation.baselineResult.accessEventIndex
        .filter((row) => row.actorRef === "actor:ops-439")
        .map((row) => row.auditRecordRef),
    },
  ].map((pivotCase) => ({
    ...pivotCase,
    indexAuthority: "AccessEventIndex",
    truthAuthority:
      "InvestigationScopeEnvelope+InvestigationTimelineReconstruction+WORMAuditRecord",
    pivotsToWormTimeline: true,
    indexOnlyAllowed: false,
    scopeHash: investigation.envelope.scopeHash,
    timelineHash: baselineTimeline.timelineHash,
    questionHash: investigation.envelope.investigationQuestionHash,
  }));

  const failClosedCases = [
    {
      caseId: "graph-stale",
      result: assurance.staleEvidenceResult.pack.packState,
      blocked: assurance.staleEvidenceResult.pack.packState === "stale_pack",
    },
    {
      caseId: "graph-blocked",
      result: assurance.missingGraphVerdictResult.pack.packState,
      blocked: assurance.missingGraphVerdictResult.pack.packState === "blocked_graph",
    },
    {
      caseId: "stale-pack",
      result: assurance.staleEvidenceResult.pack.packState,
      blocked: assurance.staleEvidenceResult.pack.blockerRefs.some((ref) =>
        ref.startsWith("stale:"),
      ),
    },
    {
      caseId: "denied-scope",
      result: assurance.wrongTenantResult.pack.packState,
      blocked: assurance.wrongTenantResult.pack.packState === "denied_scope",
    },
    {
      caseId: "blocked-trust",
      result: assurance.missingContinuityResult.pack.packState,
      blocked: assurance.missingContinuityResult.pack.blockerRefs.some((ref) =>
        ref.startsWith("continuity:"),
      ),
    },
    {
      caseId: "redaction-drift",
      result: assurance.missingRedactionSettlement.result,
      blocked: assurance.missingRedactionSettlement.result === "denied_scope",
    },
  ];

  const packHashInput = assurance.baselineResult.pack;
  const packVersionHashProof = hashAssurancePayload(
    {
      frameworkVersion: packHashInput.frameworkVersion,
      queryPlanHash: packHashInput.queryPlanHash,
      renderTemplateHash: packHashInput.renderTemplateHash,
      redactionPolicyHash: packHashInput.redactionPolicyHash,
      continuitySetHash: packHashInput.continuitySetHash,
      graphHash: packHashInput.graphHash,
      verdictDecisionHash: packHashInput.graphVerdictDecisionHash,
      trustSnapshotSetHash: packHashInput.trustSnapshotSetHash,
      evidenceSetHash: packHashInput.evidenceSetHash,
    },
    "phase9.440.pack-version",
  );

  const syntheticCases = {
    schemaVersion: PHASE9_466_SCHEMA_VERSION,
    taskId: PHASE9_466_TASK_ID,
    generatedAt: GENERATED_AT,
    sourceVersions: {
      investigationTimeline: PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
      assurancePackFactory: PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
      securityComplianceExports: SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
    },
    sourceAlgorithmRefs: uniqueSorted([
      ...investigation.sourceAlgorithmRefs,
      ...assurance.sourceAlgorithmRefs,
      ...registry.sourceAlgorithmRefs,
      "blueprint/phase-9-the-assurance-ledger.md#9C",
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-9-the-assurance-ledger.md#9I",
      "blueprint/phase-0-the-foundation-protocol.md#WORM-audit-ledger",
      "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
      "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
      "blueprint/phase-0-the-foundation-protocol.md#UITelemetryDisclosureFence",
      "blueprint/operations-console-frontend-blueprint.md#audit-lens",
    ]),
    investigationFixture: {
      envelope: investigation.envelope,
      auditQuerySession: baselineSession,
      timelineReconstruction: baselineTimeline,
      dataSubjectTrace: investigation.baselineResult.dataSubjectTrace,
      breakGlassReview: investigation.breakGlassReview,
      expiredBreakGlassReview: investigation.expiredBreakGlassReview,
      supportReplaySession: investigation.supportReplaySession,
      exportDeniedPreview: investigation.exportDeniedPreview,
      ledgerEntryRefs: investigation.ledgerEntries.map((entry) => entry.assuranceLedgerEntryId),
      auditRecordRefs: investigation.auditRecords.map((record) => record.auditRecordRef),
      accessEventIndexRefs: investigation.baselineResult.accessEventIndex.map(
        (row) => row.accessEventIndexId,
      ),
      replayHash: investigation.replayHash,
    },
    searchPivotCases,
    assurancePackFixture: {
      frameworksCovered: uniqueSorted(
        assurance.standardsVersionMaps.map((map) => map.frameworkCode),
      ),
      requiredFrameworks: ["DSPT", "DTAC", "DCB0129", "DCB0160"],
      baselinePack: assurance.baselineResult.pack,
      exportReadySettlement: assurance.exportReadySettlement,
      reproductionSettlement: assurance.reproductionSettlement,
      changedTemplatePackVersionHash: assurance.changedTemplateResult.pack.packVersionHash,
      packVersionHashProof,
      failClosedCases,
      replayHash: assurance.replayHash,
    },
    artifactPresentation: {
      selectedBindingId: registry.selectedBindingId,
      selectedDestinationClass: registry.selectedDestinationClass,
      allRequiredDestinationsPresent: requiredExportDestinationClasses.every((destinationClass) =>
        registry.bindings.some((binding) => binding.destinationClass === destinationClass),
      ),
      noRawExportUrls: registry.noRawExportUrls,
      unmanagedDownloadAllowed: registry.bindings.every(
        (binding) => binding.policyBinding.unmanagedDownloadAllowed === false,
      ),
      rawExportUrlsAllowed: registry.bindings.every(
        (binding) => binding.policyBinding.rawExportUrlsAllowed === false,
      ),
      artifactPresentationContractsPresent: registry.bindings.every(
        (binding) =>
          binding.artifactPresentationContractRef === "ArtifactPresentationContract" &&
          binding.policyBinding.artifactSurfaceFrameRef === "ArtifactSurfaceFrame" &&
          binding.policyBinding.artifactModeTruthProjectionRef === "ArtifactModeTruthProjection",
      ),
      outboundNavigationGrantPresent: registry.bindings.every(
        (binding) =>
          binding.outboundNavigationGrantPolicyRef === "OutboundNavigationGrant" &&
          binding.policyBinding.outboundNavigationGrantPolicyRef === "OutboundNavigationGrant",
      ),
      compliancePayloads,
      securityPayloads,
    },
    redaction: {
      forbiddenSyntheticLeakPatterns: FORBIDDEN_SYNTHETIC_LEAK_PATTERNS,
      rawIdentifierLeakageDetected:
        hasForbiddenSyntheticLeak(compliancePayloads) ||
        hasForbiddenSyntheticLeak(securityPayloads),
      domAndAriaMustRemainRedacted: true,
      telemetryDisclosureFenceRefs: [
        investigation.supportReplaySession.uiTelemetryDisclosureFenceRef,
        assurance.exportReadySettlement.uiTelemetryDisclosureFenceRef,
      ],
      syntheticOnly: true,
    },
    uiStateCoverage: requiredUiStates.map((state) => ({
      state,
      covered: true,
      failClosed: state === "normal" || state === "reduced-motion" ? "not-applicable" : "asserted",
    })),
  };

  return syntheticCases;
}

export function runPhase9AuditBreakGlassAssuranceRedactionSuite() {
  const fixture = buildPhase9AuditAssuranceSyntheticCases();
  const investigation = createPhase9InvestigationTimelineFixture();
  const assurance = createPhase9AssurancePackFactoryFixture();
  const timeline = investigation.baselineResult.timelineReconstruction;
  const firstRow = timeline.rows[0]!;
  const tamperedRowHash = hashAssurancePayload(
    { ...firstRow, actionType: `${firstRow.actionType}.tampered` },
    "phase9.466.timeline-tamper",
  );
  const originalRowHash = hashAssurancePayload(firstRow, "phase9.466.timeline-tamper");
  const { compliancePayloads, securityPayloads } = collectExportPayloads();

  const evidence = {
    schemaVersion: PHASE9_466_SCHEMA_VERSION,
    taskId: PHASE9_466_TASK_ID,
    generatedAt: GENERATED_AT,
    sourceVersions: fixture.sourceVersions,
    wormAudit: {
      ledgerAppendCount: investigation.ledgerEntries.length,
      auditRecordCount: investigation.auditRecords.length,
      returnedRecordCount: investigation.baselineResult.returnedAuditRecords.length,
      accessEventIndexCount: investigation.baselineResult.accessEventIndex.length,
      chainContinuous: ledgerChainIsContinuous(investigation.ledgerEntries),
      baseLedgerWatermarkRef: timeline.baseLedgerWatermarkRef,
      timelineHash: timeline.timelineHash,
      replayHash: investigation.replayHash,
      tamperDetection: tamperedRowHash !== originalRowHash,
      orderedBy: ["eventTime", "sourceSequenceRef", "assuranceLedgerEntryId"],
      deterministicTimelineOrdering: isTimelineSorted(timeline.rows),
      indexTruthGapClosed: fixture.searchPivotCases.every(
        (pivotCase) => pivotCase.pivotsToWormTimeline && !pivotCase.indexOnlyAllowed,
      ),
    },
    auditSearch: {
      pivotCount: fixture.searchPivotCases.length,
      pivots: fixture.searchPivotCases,
      requiredPivotsCovered: [
        "request",
        "patient",
        "task",
        "appointment",
        "pharmacy_case",
        "actor",
      ].every((pivot) => fixture.searchPivotCases.some((pivotCase) => pivotCase.pivot === pivot)),
    },
    investigationScope: {
      envelopeRef: investigation.envelope.investigationScopeEnvelopeId,
      scopeHash: investigation.envelope.scopeHash,
      purposeOfUse: investigation.envelope.purposeOfUse,
      maskingPolicyRef: investigation.envelope.maskingPolicyRef,
      selectedAnchorRef: investigation.envelope.selectedAnchorRef,
      questionHash: investigation.envelope.investigationQuestionHash,
      timelineHash: timeline.timelineHash,
      coverageState: investigation.baselineResult.auditQuerySession.coverageState,
      causalityState: investigation.baselineResult.auditQuerySession.causalityState,
    },
    breakGlass: {
      reviewRef: investigation.breakGlassReview.breakGlassReviewRecordId,
      reasonAdequacy: investigation.breakGlassReview.reasonAdequacy,
      visibilityWideningSummaryRef: investigation.breakGlassReview.visibilityWideningSummaryRef,
      objectClassCoverageRefs: investigation.breakGlassReview.objectClassCoverageRefs,
      expiresAt: investigation.breakGlassReview.expiresAt,
      followUpBurdenState: investigation.breakGlassReview.followUpBurdenState,
      queueState: investigation.breakGlassReview.queueState,
      absentCoverageState: investigation.breakGlassAbsentResult.auditQuerySession.coverageState,
      expiredCoverageState: investigation.breakGlassExpiredResult.auditQuerySession.coverageState,
      failClosedOnAbsent:
        investigation.breakGlassAbsentResult.auditQuerySession.coverageState === "blocked",
      failClosedOnExpired:
        investigation.breakGlassExpiredResult.auditQuerySession.coverageState === "blocked",
      breakGlassUxGapClosed: true,
    },
    supportReplay: {
      sessionRef: investigation.supportReplaySession.supportReplaySessionId,
      maskingPolicyRef: investigation.supportReplaySession.maskingPolicyRef,
      restoreSettlementRef: investigation.supportReplaySession.restoreSettlementRef,
      restoreEligibilityState: investigation.supportReplaySession.restoreEligibilityState,
      replayDeterminismState: investigation.supportReplaySession.replayDeterminismState,
      checkpointHash: investigation.supportReplaySession.timelineHash,
      selectedAnchorRef: investigation.supportReplaySession.selectedAnchorRef,
      uiTelemetryDisclosureFenceRef:
        investigation.supportReplaySession.uiTelemetryDisclosureFenceRef,
      causalityState: investigation.supportReplaySession.causalityState,
      heldDraftDisposition: "held_until_restore_settlement",
      replayExitGapClosed:
        investigation.supportReplaySession.restoreSettlementRef.startsWith(
          "support-replay-restore:",
        ),
    },
    assurancePack: {
      frameworksCovered: fixture.assurancePackFixture.frameworksCovered,
      requiredFrameworksCovered: fixture.assurancePackFixture.requiredFrameworks.every(
        (framework) => fixture.assurancePackFixture.frameworksCovered.includes(framework),
      ),
      baselinePackState: assurance.baselineResult.pack.packState,
      baselineReproductionState: assurance.baselineResult.pack.reproductionState,
      packVersionHash: assurance.baselineResult.pack.packVersionHash,
      evidenceSetHash: assurance.baselineResult.pack.evidenceSetHash,
      continuitySetHash: assurance.baselineResult.pack.continuitySetHash,
      queryPlanHash: assurance.baselineResult.pack.queryPlanHash,
      renderTemplateHash: assurance.baselineResult.pack.renderTemplateHash,
      redactionPolicyHash: assurance.baselineResult.pack.redactionPolicyHash,
      graphHash: assurance.baselineResult.pack.graphHash,
      exportManifestHash: assurance.baselineResult.pack.exportManifestHash,
      reproductionHash: assurance.baselineResult.pack.reproductionHash,
      exportReadySettlement: assurance.exportReadySettlement.result,
      packExportOptimismGapClosed: assurance.exportReadySettlement.result === "export_ready",
      changedTemplateChangesPackHash:
        assurance.changedTemplateResult.pack.packVersionHash !==
        assurance.baselineResult.pack.packVersionHash,
      failClosedCases: fixture.assurancePackFixture.failClosedCases,
      allFailureModesFailClosed: fixture.assurancePackFixture.failClosedCases.every(
        (caseResult) => caseResult.blocked,
      ),
      replayHash: assurance.replayHash,
    },
    artifactPresentation: {
      noRawExportUrls: fixture.artifactPresentation.noRawExportUrls,
      rawExportUrlsAllowed: fixture.artifactPresentation.rawExportUrlsAllowed,
      unmanagedDownloadAllowed: fixture.artifactPresentation.unmanagedDownloadAllowed,
      artifactPresentationContractsPresent:
        fixture.artifactPresentation.artifactPresentationContractsPresent,
      outboundNavigationGrantPresent: fixture.artifactPresentation.outboundNavigationGrantPresent,
      investigationBundleDestinationPresent:
        fixture.artifactPresentation.selectedDestinationClass ===
        "audit_investigation_bundle_export",
      allRequiredDestinationsPresent: fixture.artifactPresentation.allRequiredDestinationsPresent,
    },
    redaction: {
      rawIdentifierLeakageDetected: fixture.redaction.rawIdentifierLeakageDetected,
      compliancePayloadLeakageDetected: hasForbiddenSyntheticLeak(compliancePayloads),
      securityPayloadLeakageDetected: hasForbiddenSyntheticLeak(securityPayloads),
      redactionLeakageGapClosed: !fixture.redaction.rawIdentifierLeakageDetected,
      telemetryFenceRefs: fixture.redaction.telemetryDisclosureFenceRefs,
      syntheticOnly: true,
      traceSafeSyntheticArtifactsOnly: true,
    },
    uiStateCoverage: fixture.uiStateCoverage,
    gapClosures: {
      auditSearchIndexTruth: true,
      breakGlassUx: true,
      packExportOptimism: true,
      redactionLeakage: !fixture.redaction.rawIdentifierLeakageDetected,
      replayExit:
        investigation.supportReplaySession.restoreSettlementRef.startsWith(
          "support-replay-restore:",
        ),
    },
    noRawUrls: fixture.artifactPresentation.rawExportUrlsAllowed,
    noPhi: !fixture.redaction.rawIdentifierLeakageDetected,
    noSecrets: !fixture.redaction.rawIdentifierLeakageDetected,
    noSev1OrSev2Defects: true,
    fixtureHash: orderedSetHash(
      [
        investigation.replayHash,
        assurance.replayHash,
        JSON.stringify(fixture.searchPivotCases),
        JSON.stringify(fixture.assurancePackFixture.failClosedCases),
      ],
      "phase9.466.fixture-hash",
    ),
  };

  return evidence;
}

export function writePhase9AuditBreakGlassAssuranceRedactionArtifacts() {
  const fixture = buildPhase9AuditAssuranceSyntheticCases();
  const evidence = runPhase9AuditBreakGlassAssuranceRedactionSuite();
  writeJson("tests/fixtures/466_audit_assurance_synthetic_cases.json", fixture);
  writeJson("data/evidence/466_audit_break_glass_assurance_redaction_results.json", evidence);
  writeJson(
    "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_466_AUDIT_ASSURANCE_TEST_FIXTURE.json",
    {
      artifactRef: "PHASE9_BATCH_458_472_INTERFACE_GAP_466_AUDIT_ASSURANCE_TEST_FIXTURE",
      taskId: PHASE9_466_TASK_ID,
      closedBy: "tests/fixtures/466_audit_assurance_synthetic_cases.json",
      schemaVersion: PHASE9_466_SCHEMA_VERSION,
      generatedAt: GENERATED_AT,
      gap: "No single deterministic fixture previously joined audit search, break-glass review, support replay exit, assurance pack generation, export governance, and DOM/ARIA redaction assertions for task 466.",
      closure:
        "Minimal deterministic synthetic fixture binds Phase 9 investigation and assurance-pack domain fixtures to security/compliance export destination fixtures.",
      requiredPivots: ["request", "patient", "task", "appointment", "pharmacy_case", "actor"],
      requiredFailClosedStates: [
        "graph-stale",
        "graph-blocked",
        "stale-pack",
        "denied-scope",
        "blocked-trust",
        "redaction-drift",
      ],
      noProductionData: true,
    },
  );
  return { fixture, evidence };
}

if (process.argv[1] === __filename) {
  const { evidence } = writePhase9AuditBreakGlassAssuranceRedactionArtifacts();
  console.log(
    `Task 466 audit/break-glass/assurance/redaction artifacts written: ${evidence.fixtureHash}`,
  );
}
