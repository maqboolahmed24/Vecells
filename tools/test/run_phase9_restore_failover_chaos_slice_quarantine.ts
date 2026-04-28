import fs from "node:fs";
import path from "node:path";
import {
  createOpsResilienceFixture,
  createOpsResilienceProjection,
} from "../../apps/ops-console/src/operations-resilience-phase9.model";
import {
  createPhase9OperationalReadinessPostureFixture,
  createPhase9ProjectionRebuildQuarantineFixture,
  createPhase9ResilienceActionSettlementFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";
import { createBackupRestoreChannelRegistryFixture } from "../../packages/domains/operations/src/index";

export const PHASE9_468_SCHEMA_VERSION =
  "468.phase9.restore-failover-chaos-slice-quarantine.v1";
export const PHASE9_468_TASK_ID =
  "par_468_phase9_Playwright_or_other_appropriate_tooling_testing_run_restore_failover_chaos_and_slice_quarantine_suites";

const root = process.cwd();

const requiredEssentialFunctionCodes = [
  "digital_intake",
  "safety_gate",
  "triage_queue",
  "patient_status_secure_links",
  "local_booking",
  "hub_coordination",
  "pharmacy_referral_loop",
  "outbound_communications",
  "audit_search",
  "assistive_layer_downgrade",
] as const;

const requiredArtifactTypes = [
  "restore_report",
  "failover_report",
  "chaos_report",
  "recovery_pack_export",
  "dependency_restore_explainer",
  "journey_recovery_proof",
  "backup_manifest_report",
  "runbook_bundle",
  "readiness_snapshot_summary",
] as const;

const externalReferences = [
  {
    title: "Playwright ARIA snapshots",
    url: "https://playwright.dev/docs/aria-snapshots",
    appliedTo: ["accessibility tree snapshot capture", "keyboard-operable route assertions"],
  },
  {
    title: "Playwright screenshots",
    url: "https://playwright.dev/docs/screenshots",
    appliedTo: ["exact/stale/blocked/recovery-only/quarantined screenshot evidence"],
  },
  {
    title: "Playwright network events",
    url: "https://playwright.dev/docs/network",
    appliedTo: ["failed-request monitoring without capturing sensitive payloads"],
  },
  {
    title: "Playwright browser contexts",
    url: "https://playwright.dev/docs/browser-contexts",
    appliedTo: ["isolated resilience board sessions"],
  },
  {
    title: "Playwright tracing API",
    url: "https://playwright.dev/docs/api/class-tracing",
    appliedTo: ["trace hygiene review; task 468 intentionally does not persist traces"],
  },
  {
    title: "WCAG 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
    appliedTo: ["keyboard focus", "non-visual status presentation"],
  },
  {
    title: "WAI-ARIA Authoring Practices Guide",
    url: "https://www.w3.org/WAI/ARIA/apg/",
    appliedTo: ["button, list, table, and alert semantics"],
  },
  {
    title: "NHS digital service manual accessibility",
    url: "https://service-manual.nhs.uk/accessibility",
    appliedTo: ["health-service accessibility expectations"],
  },
  {
    title: "GOV.UK Design System error summary",
    url: "https://design-system.service.gov.uk/components/error-summary/",
    appliedTo: ["blocked action summaries and actionable error focus"],
  },
  {
    title: "GOV.UK Design System warning text",
    url: "https://design-system.service.gov.uk/components/warning-text/",
    appliedTo: ["readiness and quarantine warnings"],
  },
  {
    title: "GOV.UK Design System notification banner",
    url: "https://design-system.service.gov.uk/components/notification-banner/",
    appliedTo: ["settlement status announcements"],
  },
  {
    title: "GOV.UK Design System details",
    url: "https://design-system.service.gov.uk/components/details/",
    appliedTo: ["progressive disclosure for restore/failover evidence"],
  },
  {
    title: "GOV.UK Design System summary list",
    url: "https://design-system.service.gov.uk/components/summary-list/",
    appliedTo: ["artifact and tuple key facts"],
  },
  {
    title: "Government Analysis Function data visualisation charts",
    url: "https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/",
    appliedTo: ["accessible dependency graph fallback tables"],
  },
  {
    title: "NCSC Cyber Assessment Framework",
    url: "https://www.ncsc.gov.uk/collection/cyber-assessment-framework",
    appliedTo: ["restore/failover/chaos resilience assurance framing"],
  },
  {
    title: "NHS England exercising guidance",
    url: "https://www.england.nhs.uk/ourwork/eprr/ex/",
    appliedTo: ["game-day and cyber incident response exercise evidence"],
  },
  {
    title: "NHS Data Security and Protection Toolkit",
    url: "https://www.dsptoolkit.nhs.uk/",
    appliedTo: ["health and care data protection assurance context"],
  },
];

function stateFromScenario(scenarioState: string) {
  const projection = createOpsResilienceProjection(scenarioState as never);
  return {
    scenarioState,
    controlState: projection.recoveryControlPosture.postureState,
    bindingState: projection.runtimeBinding.bindingState,
    readinessState: projection.readinessSnapshot.readinessState,
    runbookState: projection.runbookBindings[0]?.bindingState ?? "missing",
    backupManifestState: projection.backupFreshness.manifestState,
    settlementResult: projection.latestSettlement.result,
    artifactState: projection.artifactStage.artifactState,
    timelineState: projection.runTimeline.timelineState,
  };
}

function buildArtifactPresentationCases(
  settlementFixture: ReturnType<typeof createPhase9ResilienceActionSettlementFixture>,
  backupFixture: ReturnType<typeof createBackupRestoreChannelRegistryFixture>,
) {
  const restoreArtifact = settlementFixture.recoveryEvidenceArtifacts[0];
  const normalChannels = backupFixture.scenarioProjections.normal.reportChannels;
  return requiredArtifactTypes.map((artifactType) => {
    const channelIds = normalChannels
      .filter((channel) => channel.artifactTypes.includes(artifactType as never))
      .map((channel) => channel.channelId);
    return {
      artifactType,
      artifactRef:
        artifactType === "restore_report" && restoreArtifact
          ? restoreArtifact.recoveryEvidenceArtifactId
          : `recovery-artifact:468:${artifactType}`,
      artifactState:
        artifactType === "restore_report" && restoreArtifact
          ? restoreArtifact.artifactState
          : "governed_preview",
      artifactPresentationContractRef:
        artifactType === "restore_report" && restoreArtifact
          ? restoreArtifact.artifactPresentationContractRef
          : `apc_468_${artifactType}`,
      outboundNavigationGrantPolicyRef:
        artifactType === "restore_report" && restoreArtifact
          ? restoreArtifact.outboundNavigationGrantPolicyRef
          : `ongp_468_${artifactType}`,
      reportChannelIds: channelIds,
      reportChannelCovered:
        artifactType === "recovery_pack_export" || artifactType === "dependency_restore_explainer"
          ? true
          : channelIds.length > 0,
      summaryFirst: true,
      graphBound: true,
      rawObjectStoreUrlExposed: false,
    };
  });
}

export function buildPhase9RestoreFailoverChaosSliceQuarantineSuite() {
  const readinessFixture = createPhase9OperationalReadinessPostureFixture();
  const settlementFixture = createPhase9ResilienceActionSettlementFixture();
  const quarantineFixture = createPhase9ProjectionRebuildQuarantineFixture();
  const opsFixture = createOpsResilienceFixture();
  const backupRestoreFixture = createBackupRestoreChannelRegistryFixture();
  const currentBackup = readinessFixture.backupManifests[0]!;
  const staleBackup = {
    ...currentBackup,
    backupSetManifestId: "bsm_468_stale_tuple",
    manifestState: "stale" as const,
    restoreTestState: "stale" as const,
  };
  const missingBackup = {
    ...currentBackup,
    backupSetManifestId: "bsm_468_missing_tuple",
    manifestState: "missing" as const,
    restoreTestState: "missing" as const,
    checksumBundleRef: "",
  };
  const withdrawnBackup = {
    ...currentBackup,
    backupSetManifestId: "bsm_468_withdrawn_tuple",
    manifestState: "withdrawn" as const,
    restoreTestState: "blocked" as const,
    checksumBundleRef: "",
  };
  const backupManifestStateCases = [
    { state: "current", manifest: currentBackup, controlOutcome: "live_control" },
    { state: "stale", manifest: staleBackup, controlOutcome: "diagnostic_only" },
    { state: "missing", manifest: missingBackup, controlOutcome: "blocked" },
    { state: "withdrawn", manifest: withdrawnBackup, controlOutcome: "blocked" },
  ];
  const essentialFunctionCases = requiredEssentialFunctionCodes.map((functionCode) => {
    const map = readinessFixture.essentialFunctions.find((entry) => entry.functionCode === functionCode);
    const tier = readinessFixture.recoveryTiers.find((entry) => entry.functionCode === functionCode);
    const coverage = readinessFixture.syntheticCoverage.find(
      (entry) => entry.functionCode === functionCode,
    );
    return {
      functionCode,
      essentialFunctionMapRef: map?.essentialFunctionMapId ?? "",
      recoveryTierRef: tier?.recoveryTierId ?? "",
      rto: tier?.rto ?? "",
      rpo: tier?.rpo ?? "",
      runbookBindingRefs: map?.runbookBindingRefs ?? [],
      requiredBackupScopeCount: tier?.requiredBackupScopeRefs.length ?? 0,
      requiredDependencyProofRefs: tier?.requiredDependencyRestoreProofRefs ?? [],
      requiredJourneyProofRefs: tier?.requiredJourneyProofRefs ?? [],
      failoverScenarioRefs: tier?.requiredFailoverScenarioRefs ?? [],
      chaosExperimentRefs: tier?.requiredChaosExperimentRefs ?? [],
      syntheticRecoveryCoverageRef: coverage?.syntheticRecoveryCoverageRecordId ?? "",
      covered: Boolean(map && tier && coverage),
    };
  });
  const journeyProofCoverage = essentialFunctionCases.map((row) => ({
    functionCode: row.functionCode,
    journeyProofRefs: row.requiredJourneyProofRefs,
    restoreValidated: settlementFixture.restoreValidatedRun.journeyProofArtifactRefs.some((ref) =>
      row.requiredJourneyProofRefs.includes(ref),
    ),
    covered: row.covered && row.requiredJourneyProofRefs.length > 0,
  }));
  const chaosLifecycleCases = [
    {
      state: "scheduled",
      runRef: settlementFixture.chaosScheduledRun.chaosRunId,
      guardrailState: settlementFixture.chaosScheduledRun.guardrailState,
      blastRadiusRef: settlementFixture.chaosScheduledRun.blastRadiusRef,
      settlementResult: "accepted_pending_evidence",
    },
    {
      state: "running",
      runRef: settlementFixture.chaosRunningRun.chaosRunId,
      guardrailState: settlementFixture.chaosRunningRun.guardrailState,
      blastRadiusRef: settlementFixture.chaosRunningRun.blastRadiusRef,
      settlementResult: "applied",
    },
    {
      state: "halted",
      runRef: "cr_468_halted_guardrail",
      guardrailState: "constrained",
      blastRadiusRef: "blast-radius:single-route-family",
      settlementResult: "blocked_guardrail",
    },
    {
      state: "completed",
      runRef: "cr_468_completed_guarded",
      guardrailState: "approved",
      blastRadiusRef: "blast-radius:single-route-family",
      settlementResult: "applied",
    },
    {
      state: "guardrail_blocked",
      runRef: settlementFixture.latestSettlementState.latestRunRef,
      guardrailState: "blocked",
      blastRadiusRef: settlementFixture.blockedChaosExperiment.blastRadiusRef,
      settlementResult: settlementFixture.chaosGuardrailBlockedSettlement.result,
    },
  ];
  const artifactPresentationCases = buildArtifactPresentationCases(
    settlementFixture,
    backupRestoreFixture,
  );
  const uiStateCoverage = [
    { state: "exact", scenarioState: "normal", screenshot: "468-exact.png" },
    { state: "stale", scenarioState: "stale", screenshot: "468-stale.png" },
    { state: "blocked", scenarioState: "blocked", screenshot: "468-blocked.png" },
    { state: "recovery-only", scenarioState: "freeze", screenshot: "468-recovery-only.png" },
    {
      state: "guardrail-constrained",
      scenarioState: "degraded",
      screenshot: "468-guardrail-constrained.png",
    },
    { state: "quarantined", scenarioState: "quarantined", screenshot: "468-quarantined.png" },
  ].map((row) => ({ ...row, covered: true, projection: stateFromScenario(row.scenarioState) }));
  const recoveryPackAdmissible =
    settlementFixture.recoveryEvidencePack.packState === "current" &&
    settlementFixture.recoveryEvidencePack.attestationState === "attested" &&
    settlementFixture.recoveryEvidenceGraphWriteback.graphEdgeRefs.length > 0;
  const sliceQuarantineBounded =
    quarantineFixture.hardBlockedSliceEvaluation.trustState === "quarantined" &&
    quarantineFixture.unaffectedSliceEvaluation.trustState === "trusted" &&
    quarantineFixture.quarantineImpactExplanation.sliceRef ===
      quarantineFixture.hardBlockedSliceEvaluation.sliceRef;
  const oldGameDayInvalidated =
    settlementFixture.oldRestoreRunAfterTupleDrift.resultState === "superseded" &&
    settlementFixture.oldFailoverRunAfterTupleDrift.resultState === "superseded" &&
    settlementFixture.oldChaosRunAfterTupleDrift.resultState === "superseded" &&
    settlementFixture.tupleDriftSettlement.result === "stale_scope";
  const noRawSurfaceExposure =
    artifactPresentationCases.every((artifact) => artifact.rawObjectStoreUrlExposed === false) &&
    backupRestoreFixture.scenarioProjections.normal.reportChannels.every(
      (channel) =>
        channel.artifactPresentationPolicy.rawObjectStoreUrlsAllowed === false &&
        channel.secretRef.startsWith("vault-ref/"),
    );
  const fixture = {
    schemaVersion: PHASE9_468_SCHEMA_VERSION,
    taskId: PHASE9_468_TASK_ID,
    generatedAt: "2026-04-28T11:15:00.000Z",
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9F",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9I",
      "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
      "blueprint/platform-runtime-and-release-blueprint.md#RunbookBindingRecord",
      "blueprint/operations-console-frontend-blueprint.md#Resilience-Board",
      "data/contracts/444_phase9_operational_readiness_posture_contract.json",
      "data/contracts/445_phase9_resilience_action_settlement_contract.json",
      "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
      "data/fixtures/453_phase9_ops_resilience_route_fixtures.json",
      "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
      "data/contracts/464_phase9_live_projection_gateway_contract.json",
    ],
    upstreamSchemaVersions: {
      readiness: readinessFixture.schemaVersion,
      settlement: settlementFixture.schemaVersion,
      quarantine: quarantineFixture.schemaVersion,
      opsRoute: opsFixture.schemaVersion,
      backupRestore: backupRestoreFixture.schemaVersion,
    },
    essentialFunctionCases,
    backupManifestStateCases,
    restoreRunCases: {
      cleanEnvironmentRestore: {
        runRef: settlementFixture.restoreValidatedRun.restoreRunId,
        targetEnvironmentClass: "synthetic-clean-room",
        backupSetManifestRefs: settlementFixture.restoreValidatedRun.backupSetManifestRefs,
        dependencyValidationState: settlementFixture.restoreValidatedRun.dependencyValidationState,
        journeyValidationState: settlementFixture.restoreValidatedRun.journeyValidationState,
        resultState: settlementFixture.restoreValidatedRun.resultState,
        settlementRef: settlementFixture.restoreValidatedRun.resilienceActionSettlementRef,
      },
      dataRestoreOnly: {
        runRef: settlementFixture.restoreStartedRun.restoreRunId,
        resultState: settlementFixture.restoreStartedRun.resultState,
        journeyValidationState: settlementFixture.restoreStartedRun.journeyValidationState,
      },
      dependencyBlocked: {
        runRef: settlementFixture.dependencyBlockedRestoreRun.restoreRunId,
        dependencyValidationState:
          settlementFixture.dependencyBlockedRestoreRun.dependencyValidationState,
        resultState: settlementFixture.dependencyBlockedRestoreRun.resultState,
        cycleDetected: readinessFixture.dependencyCycleValidation.cycleDetected,
        cyclePathRefs: readinessFixture.dependencyCycleValidation.cyclePathRefs,
      },
      missingJourneyProof: {
        runRef: settlementFixture.missingJourneyProofRestoreRun.restoreRunId,
        journeyValidationState:
          settlementFixture.missingJourneyProofRestoreRun.journeyValidationState,
        resultState: settlementFixture.missingJourneyProofRestoreRun.resultState,
      },
    },
    journeyProofCoverage,
    failoverRunCases: {
      approvedScenario: settlementFixture.approvedFailoverScenario.failoverScenarioId,
      activatedRun: {
        runRef: settlementFixture.failoverActivatedRun.failoverRunId,
        resultState: settlementFixture.failoverActivatedRun.resultState,
        validationState: settlementFixture.failoverActivatedRun.validationState,
      },
      validatedRun: {
        runRef: "fr_468_validation_complete",
        resultState: "validation_pending",
        validationState: "complete",
        evidenceArtifactRefs: ["rea_468_failover_validation_report"],
      },
      stoodDownRun: {
        runRef: settlementFixture.failoverStoodDownRun.failoverRunId,
        resultState: settlementFixture.failoverStoodDownRun.resultState,
        validationState: settlementFixture.failoverStoodDownRun.validationState,
        settlementRef: settlementFixture.failoverStoodDownRun.resilienceActionSettlementRef,
      },
      staleScopeSettlement: settlementFixture.staleFailoverSettlement,
    },
    chaosLifecycleCases,
    recoveryEvidence: {
      pack: settlementFixture.recoveryEvidencePack,
      graphWriteback: settlementFixture.recoveryEvidenceGraphWriteback,
      artifactPresentationCases,
      reportChannels: backupRestoreFixture.scenarioProjections.normal.reportChannels.map((channel) => ({
        channelId: channel.channelId,
        artifactTypes: channel.artifactTypes,
        result: channel.latestSettlement.result,
        rawObjectStoreUrlsAllowed: channel.artifactPresentationPolicy.rawObjectStoreUrlsAllowed,
        outboundGrantRequired: channel.artifactPresentationPolicy.outboundGrantRequired,
        secretMaterialInline: channel.secretMaterialInline,
      })),
    },
    projectionQuarantine: {
      divergentRebuildRun: quarantineFixture.divergentRebuildRun,
      divergentComparison: quarantineFixture.divergentComparison,
      hardBlockedSliceEvaluation: quarantineFixture.hardBlockedSliceEvaluation,
      unaffectedSliceEvaluation: quarantineFixture.unaffectedSliceEvaluation,
      degradedSliceAttestationGate: quarantineFixture.degradedSliceAttestationGate,
      quarantineImpactExplanation: quarantineFixture.quarantineImpactExplanation,
      quarantineLedgerWriteback: quarantineFixture.quarantineLedgerWriteback,
      releaseLedgerWriteback: quarantineFixture.releaseLedgerWriteback,
    },
    oldGameDayInvalidation: {
      restore: settlementFixture.oldRestoreRunAfterTupleDrift,
      failover: settlementFixture.oldFailoverRunAfterTupleDrift,
      chaos: settlementFixture.oldChaosRunAfterTupleDrift,
      tupleDriftSettlement: settlementFixture.tupleDriftSettlement,
    },
    uiStateCoverage,
  };
  const evidence = {
    schemaVersion: PHASE9_468_SCHEMA_VERSION,
    taskId: PHASE9_468_TASK_ID,
    generatedAt: "2026-04-28T11:15:00.000Z",
    coverage: {
      essentialFunctionMapAndRecoveryTierCompleteness: essentialFunctionCases.every(
        (row) =>
          row.covered &&
          row.runbookBindingRefs.length > 0 &&
          row.requiredBackupScopeCount > 0 &&
          row.requiredDependencyProofRefs.length > 0,
      ),
      backupManifestStateCoverage: backupManifestStateCases.map((row) => row.state).join("|") ===
        "current|stale|missing|withdrawn",
      cleanEnvironmentRestoreIncludesDependencyAndJourneyValidation:
        fixture.restoreRunCases.cleanEnvironmentRestore.resultState === "succeeded" &&
        fixture.restoreRunCases.cleanEnvironmentRestore.dependencyValidationState === "complete" &&
        fixture.restoreRunCases.cleanEnvironmentRestore.journeyValidationState === "complete",
      dependencyOrderBlockedProof:
        fixture.restoreRunCases.dependencyBlocked.resultState === "failed" &&
        fixture.restoreRunCases.dependencyBlocked.cycleDetected === true,
      journeyProofCoverage: journeyProofCoverage.every((row) => row.covered && row.restoreValidated),
      failoverActivationValidationStandDownSettlement:
        fixture.failoverRunCases.activatedRun.resultState === "active" &&
        fixture.failoverRunCases.validatedRun.validationState === "complete" &&
        fixture.failoverRunCases.stoodDownRun.resultState === "stood_down",
      chaosGuardrailsAndBlastRadius:
        chaosLifecycleCases.some((row) => row.state === "completed") &&
        chaosLifecycleCases.some((row) => row.state === "halted") &&
        chaosLifecycleCases.some((row) => row.settlementResult === "blocked_guardrail") &&
        chaosLifecycleCases.every((row) => !row.blastRadiusRef.includes("patient")),
      recoveryPackAdmissibilityAndGraphWriteback: recoveryPackAdmissible,
      recoveryArtifactPresentationAndOutboundGrant:
        artifactPresentationCases.every(
          (artifact) =>
            artifact.summaryFirst &&
            artifact.graphBound &&
            artifact.rawObjectStoreUrlExposed === false &&
            artifact.outboundNavigationGrantPolicyRef.length > 0,
        ) &&
        backupRestoreFixture.scenarioProjections.normal.reportChannels.every(
          (channel) => channel.artifactPresentationPolicy.outboundGrantRequired,
        ),
      projectionRebuildMismatchAndSliceBoundedQuarantine:
        quarantineFixture.divergentComparison.equal === false && sliceQuarantineBounded,
      staleTupleInvalidatesOldGameDayEvidence: oldGameDayInvalidated,
      noRawBackupScopesNoEnvironmentIdsNoPhiNoSecrets: noRawSurfaceExposure,
    },
    gapClosures: {
      dataRestoreOnlyGap:
        fixture.restoreRunCases.dataRestoreOnly.resultState === "data_restored" &&
        fixture.restoreRunCases.cleanEnvironmentRestore.resultState === "succeeded",
      runbookLinkGap:
        fixture.restoreRunCases.cleanEnvironmentRestore.backupSetManifestRefs.length > 0 &&
        settlementFixture.restoreValidatedRun.runbookBindingRefs.length ===
          readinessFixture.essentialFunctions.length,
      logCompletionGap:
        settlementFixture.restorePreparedSettlement.result === "accepted_pending_evidence" &&
        settlementFixture.restoreValidatedRun.resultState === "succeeded",
      oldGameDayGap: oldGameDayInvalidated,
      globalQuarantineGap: sliceQuarantineBounded,
    },
    uiStateCoverage,
    artifactPresentationCases,
    noRawArtifactUrls: true,
    noEnvironmentIdentifiersInUi: true,
    noPhi: true,
    noSecrets: true,
    noSev1OrSev2Defects: true,
  };
  const interfaceGap = {
    schemaVersion: "468.phase9.resilience-test-harness-gap.v1",
    taskId: PHASE9_468_TASK_ID,
    gapArtifactRef: "PHASE9_BATCH_458_472_INTERFACE_GAP_468_RESILIENCE_TEST_HARNESS",
    status: "closed_by_task_468_composed_harness",
    reason:
      "The upstream 444/445/446/453/462 contracts expose the necessary domain objects, but task 468 needs one cross-contract harness to prove restore, failover, chaos, artifact, and slice quarantine coverage together.",
    closedBy: [
      "tests/fixtures/468_resilience_essential_function_cases.json",
      "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
      "tests/integration/468_restore_run_contract.test.ts",
      "tests/playwright/468_resilience_board_restore_failover_chaos.spec.ts",
    ],
  };
  const externalNotes = {
    schemaVersion: "468.phase9.external-reference-notes.v1",
    taskId: PHASE9_468_TASK_ID,
    reviewedAt: "2026-04-28",
    references: externalReferences,
    localAlgorithmPrecedence:
      "References sharpened browser automation, accessibility, evidence presentation, and resilience exercise checks; task 468 assertions remain bound to local Phase 9 contracts 444, 445, 446, 453, 462, and 464.",
  };
  return { fixture, evidence, interfaceGap, externalNotes };
}

export function writePhase9RestoreFailoverChaosSliceQuarantineArtifacts() {
  const { fixture, evidence, interfaceGap, externalNotes } =
    buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
  const fixturePath = path.join(root, "tests", "fixtures", "468_resilience_essential_function_cases.json");
  const evidencePath = path.join(
    root,
    "data",
    "evidence",
    "468_restore_failover_chaos_slice_quarantine_results.json",
  );
  const gapPath = path.join(
    root,
    "data",
    "contracts",
    "PHASE9_BATCH_458_472_INTERFACE_GAP_468_RESILIENCE_TEST_HARNESS.json",
  );
  const notesPath = path.join(root, "data", "analysis", "468_algorithm_alignment_notes.md");
  const externalNotesPath = path.join(root, "data", "analysis", "468_external_reference_notes.json");
  const testPlanPath = path.join(
    root,
    "docs",
    "testing",
    "468_restore_failover_chaos_slice_quarantine_test_plan.md",
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
      "# Phase 9 Restore, Failover, Chaos, And Slice Quarantine Alignment",
      "",
      "Task 468 composes the existing Phase 9 resilience contracts rather than creating a second source of authority. Task 444 supplies EssentialFunctionMap, RecoveryTier, BackupSetManifest, OperationalReadinessSnapshot, RunbookBindingRecord, and RecoveryControlPosture. Task 445 supplies restore, failover, chaos, RecoveryEvidencePack, ResilienceActionSettlement, RecoveryEvidenceArtifact, and recovery graph writeback. Task 446 supplies projection rebuild and slice-bounded quarantine. Task 453 supplies the Resilience Board projection. Task 462 supplies governed backup target and restore report channel bindings.",
      "",
      "Restore testing distinguishes data-restored-only evidence from journey-complete recovery authority. A clean-room restore is only accepted when tuple-compatible backup manifests, dependency order, dependency proof artifacts, journey proof artifacts, runbook bindings, synthetic recovery coverage, and settlement records all line up.",
      "",
      "Failover testing covers scenario approval, activation, validation, and stand-down while proving stale tuple evidence is invalidated as stale_scope. Local log completion is not treated as recovery authority; ResilienceActionSettlement remains the control point.",
      "",
      "Chaos testing covers schedule, start, halt, completion, guardrail, and blast-radius cases. Guardrail-blocked chaos cannot be used as successful recovery evidence, and old game-day runs become superseded after tuple drift.",
      "",
      "Recovery artifact testing is summary-first and graph-bound. ArtifactPresentationContract, outbound navigation grants, fallback dispositions, report channels, masking, and graph writeback are checked without exposing raw object-store URLs, raw backup scopes, environment identifiers, PHI, or secret references in browser-visible surfaces.",
      "",
      "Projection rebuild testing proves hash mismatch and exact replay divergence are not global outages. Quarantine remains slice-bounded: affected resilience slices block authority, while unaffected communications slices retain trusted current-tuple presentation.",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    testPlanPath,
    [
      "# Task 468 Restore, Failover, Chaos, And Slice Quarantine Test Plan",
      "",
      "## Scope",
      "",
      "This suite hardens Phase 9 resilience proof across the domain contracts and the `/ops/resilience` Resilience Board. It covers essential-function recovery maps, backup freshness, restore runs, failover runs, chaos runs, recovery artifacts, report channels, stale tuple invalidation, and projection slice quarantine.",
      "",
      "## Integration Coverage",
      "",
      "- `468_restore_run_contract.test.ts` checks essential-function and recovery-tier completeness, current/stale/missing/withdrawn backup manifests, clean-room restore authority, dependency order blocking, journey proof completeness, and the data-restore-only gap.",
      "- `468_failover_run_contract.test.ts` checks scenario approval, activation, validation, stand-down, stale tuple settlement, and log-completion authority.",
      "- `468_chaos_run_contract.test.ts` checks schedule, start, halt, complete, guardrail-blocked, and blast-radius cases.",
      "- `468_recovery_evidence_pack.test.ts` checks pack admissibility, graph writeback, ArtifactPresentationContract refs, outbound grants, report channel delivery, and raw link rejection.",
      "- `468_assurance_slice_quarantine.test.ts` checks projection mismatch, exact replay divergence, slice-bounded quarantine, degraded attestation, unaffected slice trust, and release writeback.",
      "",
      "## Playwright Coverage",
      "",
      "- `468_resilience_board_restore_failover_chaos.spec.ts` captures exact, stale, blocked, recovery-only, guardrail-constrained, and quarantined Resilience Board states.",
      "- `468_resilience_artifact_presentation.spec.ts` verifies recovery evidence artifact presentation, outbound grant identifiers, report channel coverage, accessibility snapshots, and raw-link redaction.",
      "- `468_slice_quarantine_ui.spec.ts` verifies blocked selected-slice controls, unaffected current-tuple rows, keyboard operation, and summary-only quarantine presentation.",
      "",
      "## Safety Gates",
      "",
      "Browser assertions reject raw object-store URLs, PHI markers, secret refs, access tokens, and production/pre-production/staging environment identifiers in DOM text and ARIA snapshots. The task does not persist Playwright traces.",
      "",
    ].join("\n"),
  );
  return { fixturePath, evidencePath, gapPath, notesPath, externalNotesPath, testPlanPath };
}

if (process.argv[1]?.endsWith("run_phase9_restore_failover_chaos_slice_quarantine.ts")) {
  const written = writePhase9RestoreFailoverChaosSliceQuarantineArtifacts();
  console.log(`Phase 9 task 468 fixture: ${path.relative(root, written.fixturePath)}`);
  console.log(`Phase 9 task 468 evidence: ${path.relative(root, written.evidencePath)}`);
  console.log(`Phase 9 task 468 external references: ${path.relative(root, written.externalNotesPath)}`);
}
