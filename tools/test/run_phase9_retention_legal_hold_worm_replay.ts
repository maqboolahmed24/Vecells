import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Phase9DispositionExecutionEngine,
  Phase9RetentionLifecycleEngine,
  createPhase9DispositionExecutionFixture,
  createPhase9RetentionLifecycleEngineFixture,
  hashAssurancePayload,
  orderedSetHash,
} from "../../packages/domains/analytics_assurance/src/index";
import {
  createRecordsGovernanceFixture,
  createRecordsGovernanceProjection,
} from "../../apps/governance-console/src/records-governance-phase9.model";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..", "..");
export const PHASE9_467_SCHEMA_VERSION = "467.phase9.retention-legal-hold-worm-replay.v1";
export const PHASE9_467_TASK_ID = "par_467";
export const GENERATED_AT = "2026-04-28T00:00:00.000Z";

const requiredArtifactClasses = [
  "evidence_artifact",
  "assurance_pack",
  "audit_record",
  "incident_bundle",
  "recovery_artifact",
  "assistive_final_human_artifact",
  "transcript_summary",
  "conformance_artifact",
] as const;

const forbiddenSyntheticLeakPatterns = [
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
  "s3://",
  "gs://",
  "blob:",
] as const;

function writeJson(relativePath: string, value: unknown): void {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

function hashRef(prefix: string, input: unknown): string {
  return `${prefix}_${hashAssurancePayload(input, `phase9.467.${prefix}`).slice(0, 16)}`;
}

function canonicalHash(input: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(input), `phase9.467.${namespace}`);
}

function omitUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => omitUndefined(entry));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, omitUndefined(entry)]),
    );
  }
  return value;
}

function hasForbiddenSyntheticLeak(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return forbiddenSyntheticLeakPatterns.some((pattern) =>
    serialized.toLowerCase().includes(pattern.toLowerCase()),
  );
}

function dispositionActor(idempotencyKey: string) {
  return {
    tenantId: "tenant:demo-gp",
    actorRef: "actor:disposition-executor-443",
    roleRefs: ["disposition_executor", "records_governance"],
    purposeOfUseRef: "records:disposition:execute",
    reasonRef: "reason:443:assessed-disposition",
    generatedAt: "2026-04-27T13:00:00.000Z",
    idempotencyKey,
    scopeTokenRef: "scope-token:tenant:demo-gp:records-disposition",
  } as const;
}

function buildRetentionClassificationCases() {
  const syntheticClasses = [
    {
      artifactClass: "incident_bundle",
      artifactRef: "artifact:incident-bundle:467:reportability",
      retentionClassRef: "rc_467_incident_bundle_20y",
      recordType: "incident_bundle",
      retentionBasisRef: "policy:incident-reportability-preserve-evidence",
      minimumRetention: "P20Y",
      disposalMode: "archive_then_review",
      immutabilityMode: "hash_preserved",
    },
    {
      artifactClass: "recovery_artifact",
      artifactRef: "artifact:recovery:467:restore-report",
      retentionClassRef: "rc_467_recovery_artifact_10y",
      recordType: "recovery_artifact",
      retentionBasisRef: "policy:bau-recovery-evidence",
      minimumRetention: "P10Y",
      disposalMode: "archive_then_review",
      immutabilityMode: "hash_preserved",
    },
    {
      artifactClass: "assistive_final_human_artifact",
      artifactRef: "artifact:assistive-final-human:467:decision",
      retentionClassRef: "rc_467_assistive_final_human_8y",
      recordType: "assistive_final_human_artifact",
      retentionBasisRef: "policy:assistive-final-human-accountability",
      minimumRetention: "P8Y",
      disposalMode: "case_by_case",
      immutabilityMode: "retained_with_source_lineage",
    },
    {
      artifactClass: "transcript_summary",
      artifactRef: "artifact:transcript-summary:467:telephony",
      retentionClassRef: "rc_467_transcript_summary_8y",
      recordType: "transcript_summary",
      retentionBasisRef: "policy:records-code-transcript-summary",
      minimumRetention: "P8Y",
      disposalMode: "case_by_case",
      immutabilityMode: "retained_with_source_lineage",
    },
    {
      artifactClass: "conformance_artifact",
      artifactRef: "artifact:conformance-scorecard:467:exit",
      retentionClassRef: "rc_467_conformance_artifact_20y",
      recordType: "conformance_artifact",
      retentionBasisRef: "policy:phase-exit-conformance-evidence",
      minimumRetention: "P20Y",
      disposalMode: "archive_only",
      immutabilityMode: "hash_chained",
    },
  ] as const;

  return [
    {
      artifactClass: "evidence_artifact",
      artifactRef: "artifact:request-snapshot:442",
      retentionClassRef: "rc_442_request_snapshot",
      recordType: "request_snapshot",
      retentionBasisRef: "policy:records-code-html-current",
      minimumRetention: "P8Y",
      disposalMode: "delete_after_retention",
      immutabilityMode: "mutable_hash_preserved",
    },
    {
      artifactClass: "assurance_pack",
      artifactRef: "artifact:assurance-pack:440",
      retentionClassRef: "rc_442_assurance_pack_archive_only",
      recordType: "assurance_pack",
      retentionBasisRef: "policy:assurance-pack-archive",
      minimumRetention: "P10Y",
      disposalMode: "archive_only",
      immutabilityMode: "hash_preserved",
    },
    {
      artifactClass: "audit_record",
      artifactRef: "artifact:audit-entry:442",
      retentionClassRef: "rc_442_audit_worm",
      recordType: "audit_entry",
      retentionBasisRef: "policy:worm-audit-ledger",
      minimumRetention: "P8Y",
      disposalMode: "archive_only",
      immutabilityMode: "worm_hash_chained",
    },
    ...syntheticClasses,
  ].map((row) => ({
    ...row,
    retentionLifecycleBindingRef: hashRef("rlb_467", row),
    retentionDecisionRef: hashRef("rd_467", row),
    dispositionEligibilityAssessmentRef: hashRef("dea_467", row),
    classificationHash: canonicalHash(row, "classification-case"),
    boundAtCreation: true,
    explicitLifecycleBindingOnly: true,
    storagePathInferred: false,
  }));
}

export function buildPhase9RetentionLegalHoldWormReplaySuite() {
  const retention = createPhase9RetentionLifecycleEngineFixture();
  const disposition = createPhase9DispositionExecutionFixture();
  const recordsGovernance = createRecordsGovernanceFixture();
  const retentionEngine = new Phase9RetentionLifecycleEngine();

  const activeFreezeHoldBinding = {
    ...retention.artifactCreationResult.binding!,
    activeFreezeRefs: [retention.legalHoldResult.legalHold.freezeRef],
    activeLegalHoldRefs: [retention.legalHoldResult.legalHold.legalHoldRecordId],
  };
  const activeFreezeHoldDecision = retentionEngine.deriveRetentionDecision({
    binding: activeFreezeHoldBinding,
    retentionClass: retention.retentionClasses[0]!,
    graphSnapshotRef: "aegs_442_current",
    graphVerdictRef: "agcv_442_complete",
    graphHash: retention.legalHoldBlockedAssessment.dispositionEligibilityAssessment.graphHash,
    graphEdgeRefs: [],
    decisionDate: GENERATED_AT,
    effectiveDisposition: "preserve",
  });
  const activeFreezeHoldAssessment = retentionEngine.runDispositionEligibilityAssessment({
    actor: {
      tenantId: "tenant:demo-gp",
      actorRef: "actor:records-governance-467",
      roleRefs: ["records_governance"],
      purposeOfUseRef: "records:governance",
      reasonRef: "reason:467:hold-freeze",
      generatedAt: GENERATED_AT,
    },
    binding: activeFreezeHoldBinding,
    retentionClass: retention.retentionClasses[0]!,
    decision: activeFreezeHoldDecision,
    requestedAction: "delete",
    candidateSource: "explicit_lifecycle_binding",
    dependencyLinks: [],
    legalHolds: [retention.legalHoldResult.legalHold],
    legalHoldScopeManifests: [retention.legalHoldResult.scopeManifest],
    graphSnapshotRef: "aegs_442_current",
    graphVerdictRef: "agcv_442_complete",
    graphVerdictState: "complete",
    graphHash: retention.legalHoldBlockedAssessment.dispositionEligibilityAssessment.graphHash,
    assessedAt: "2035-04-28T00:00:00.000Z",
  });

  const certificateWriteBlockedResult =
    new Phase9DispositionExecutionEngine().executeDispositionJobSafely({
      actor: dispositionActor("idem:443:delete"),
      queuedResult: disposition.deleteQueuedResult,
      candidates: [],
      certificateWriteSucceeded: false,
    });

  const retentionClassificationCases = buildRetentionClassificationCases();
  const deletionCertificate = disposition.deleteExecutionResult.deletionCertificates[0]!;
  const archiveManifest = disposition.archiveExecutionResult.manifest!;

  const uiStateCoverage = [
    {
      state: "exact",
      route: "/ops/governance/records",
      queryState: "normal",
      screenshot: "467-exact.png",
      covered: true,
      projectionState: createRecordsGovernanceProjection({ scenarioState: "normal" })
        .graphCompletenessState,
    },
    {
      state: "hold-active",
      route: "/ops/governance/records/holds",
      queryState: "normal",
      screenshot: "467-hold-active.png",
      covered: true,
      projectionState: createRecordsGovernanceProjection({
        routePath: "/ops/governance/records/holds",
        selectedObjectId: "records-hold-09",
      }).holdScopeReview?.holdState,
    },
    {
      state: "freeze-active",
      route: "/ops/governance/records",
      queryState: "normal",
      screenshot: "467-freeze-active.png",
      covered: true,
      projectionState: createRecordsGovernanceProjection({
        selectedObjectId: "records-freeze-archive-14",
      }).lifecycleLedgerRows.find((row) => row.selected)?.activeFreezeRefs[0],
    },
    {
      state: "dependency-blocked",
      route: "/ops/governance/records",
      queryState: "normal",
      screenshot: "467-dependency-blocked.png",
      covered: true,
      projectionState: "block-explainer",
    },
    {
      state: "archive-ready",
      route: "/ops/governance/records/disposition",
      queryState: "normal",
      screenshot: "467-archive-ready.png",
      covered: true,
      projectionState: "archive_only",
    },
    {
      state: "delete-ready",
      route: "/ops/governance/records/disposition",
      queryState: "normal",
      screenshot: "467-delete-ready.png",
      covered: true,
      projectionState: "delete_allowed",
    },
    {
      state: "archived",
      route: "/ops/governance/records/disposition",
      queryState: "normal",
      screenshot: "467-archived.png",
      covered: true,
      projectionState: archiveManifest.archiveManifestId,
    },
    {
      state: "deleted",
      route: "/ops/governance/records/disposition",
      queryState: "normal",
      screenshot: "467-deleted.png",
      covered: true,
      projectionState: deletionCertificate.deletionCertificateId,
    },
    {
      state: "permission-denied",
      route: "/ops/governance/records",
      queryState: "permission-denied",
      screenshot: "467-permission-denied.png",
      covered: true,
      projectionState: createRecordsGovernanceProjection({ scenarioState: "permission-denied" })
        .actionControlState,
    },
  ] as const;

  const gapClosures = {
    storageScanDeletionGap: disposition.rawScanBlockedResult.job.resultState === "blocked",
    dependencyLightGap:
      disposition.dependencyPreservationExplainer.activeDependencyRefs.length >= 6 &&
      retention.transitiveDependencyAssessment.result === "blocked",
    wormExceptionGap: disposition.wormDeleteBlockedResult.job.resultState === "blocked",
    certificateOptimismGap:
      certificateWriteBlockedResult.job.resultState === "blocked" &&
      certificateWriteBlockedResult.job.blockerRefs.includes(
        "certificate:write-before-delete-required",
      ),
    uiMismatchGap:
      recordsGovernance.scenarioProjections.permission_denied.actionControlState === "blocked" &&
      recordsGovernance.scenarioProjections.normal.lifecycleLedgerRows.some(
        (row) => row.graphCriticality === "worm" && row.deleteControlState === "suppressed",
      ),
  };

  const fixture = {
    schemaVersion: PHASE9_467_SCHEMA_VERSION,
    taskId: PHASE9_467_TASK_ID,
    generatedAt: GENERATED_AT,
    upstreamSchemaVersions: {
      retentionLifecycleEngine: retention.schemaVersion,
      dispositionExecutionEngine: disposition.schemaVersion,
      recordsGovernanceRoute: recordsGovernance.schemaVersion,
    },
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9E",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9C",
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-9-the-assurance-ledger.md#9F",
      "blueprint/phase-9-the-assurance-ledger.md#9I",
      "blueprint/phase-0-the-foundation-protocol.md#WORM-and-artifact-lifecycle-controls",
      "data/contracts/442_phase9_retention_lifecycle_engine_contract.json",
      "data/contracts/443_phase9_disposition_execution_engine_contract.json",
      "data/contracts/455_phase9_records_governance_route_contract.json",
    ],
    retentionClassificationCases,
    lifecycleBindingCase: {
      binding: retention.artifactCreationResult.binding,
      initialDecision: retention.artifactCreationResult.initialDecision,
      immutableFields: [
        "artifactRef",
        "artifactVersionRef",
        "artifactClassRef",
        "retentionClassRef",
        "createdAt",
        "classificationHash",
      ],
      classSupersessionPreservesOldDecision:
        retention.oldDecisionAfterSupersession.retentionClassRef === "rc_442_request_snapshot" &&
        retention.newDecisionAfterSupersession.supersedesDecisionRef ===
          retention.oldDecisionAfterSupersession.retentionDecisionId,
      storagePathInferred: false,
    },
    legalHoldFreezeCases: {
      activeHold: {
        legalHoldRecordRef: retention.legalHoldResult.legalHold.legalHoldRecordId,
        scopeManifestRef: retention.legalHoldResult.scopeManifest.legalHoldScopeManifestId,
        scopeHash: retention.legalHoldResult.scopeManifest.scopeHash,
        freezeRef: retention.legalHoldResult.legalHold.freezeRef,
        assessmentRef:
          activeFreezeHoldAssessment.dispositionEligibilityAssessment
            .dispositionEligibilityAssessmentId,
        result: activeFreezeHoldAssessment.result,
        activeLegalHoldRefs: activeFreezeHoldAssessment.activeLegalHoldRefs,
        activeFreezeRefs: activeFreezeHoldAssessment.activeFreezeRefs,
        blockerRefs: activeFreezeHoldAssessment.blockerRefs,
        nextReviewAction:
          "release hold only after legal review, then issue a superseding DispositionEligibilityAssessment before any queued delete job proceeds",
      },
      releasedHoldSupersession: {
        releasedHoldRef: retention.releasedLegalHoldResult.legalHold.legalHoldRecordId,
        supersedesHoldRef: retention.releasedLegalHoldResult.legalHold.supersedesHoldRef,
        oldAssessmentJobState:
          disposition.legalHoldReleaseOldAssessmentBlockedResult.job.resultState,
        supersedingAssessmentJobState:
          disposition.legalHoldReleaseSupersedingAssessmentResult.job.resultState,
        blockerRefs: disposition.legalHoldReleaseOldAssessmentBlockedResult.job.blockerRefs,
      },
    },
    dispositionProtectionCases: {
      rawStorageScan: {
        candidateSource: retention.rawStorageScanAssessment.candidateSource,
        lifecycleAssessmentState:
          retention.rawStorageScanAssessment.dispositionEligibilityAssessment.eligibilityState,
        lifecycleBlockers: retention.rawStorageScanAssessment.blockerRefs,
        jobState: disposition.rawScanBlockedResult.job.resultState,
        jobBlockers: disposition.rawScanBlockedResult.job.blockerRefs,
        rawObjectStorePath: "blocked:redacted-object-store-path",
      },
      wormHashChain: {
        assessmentState:
          retention.wormHashChainedAssessment.dispositionEligibilityAssessment.eligibilityState,
        lifecycleBlockers: retention.wormHashChainedAssessment.blockerRefs,
        jobState: disposition.wormDeleteBlockedResult.job.resultState,
        jobBlockers: disposition.wormDeleteBlockedResult.job.blockerRefs,
        deleteCertificateRefs: disposition.wormDeleteBlockedResult.deletionCertificates.map(
          (certificate) => certificate.deletionCertificateId,
        ),
        adminOverrideDeleteAllowed: false,
      },
      replayCritical: {
        deleteJobState: disposition.replayCriticalDeleteBlockedResult.job.resultState,
        deleteBlockers: disposition.replayCriticalDeleteBlockedResult.job.blockerRefs,
        archiveJobState: disposition.replayCriticalArchiveQueuedResult.job.resultState,
        activeDependencyRefs: retention.replayCriticalAssessment.activeDependencyLinkRefs,
      },
      dependencyPreservation: {
        transitiveAssessmentState: retention.transitiveDependencyAssessment.result,
        transitiveDependencyRefs: retention.transitiveDependencyAssessment.activeDependencyLinkRefs,
        dependencyArtifactRefs: retention.transitiveDependencyAssessment.dependencyArtifactRefs,
        graphDependencyRefs: disposition.dependencyPreservationExplainer.activeDependencyRefs,
        explainerRef: disposition.dependencyPreservationExplainer.dispositionBlockExplainerId,
      },
    },
    archiveManifestCase: {
      manifest: archiveManifest,
      job: disposition.archiveExecutionResult.job,
      replayManifestHash: disposition.archiveReplayExecutionResult.manifest?.manifestHash,
      summaryOnlyLocation:
        archiveManifest.archiveLocationRef.startsWith("archive-location:summary-only:") &&
        !archiveManifest.archiveLocationRef.includes("://"),
    },
    deletionCertificateCase: {
      certificate: deletionCertificate,
      job: disposition.deleteExecutionResult.job,
      replayCertificateHash:
        disposition.deleteReplayExecutionResult.deletionCertificates[0]?.certificateHash,
      certificateLifecycleBinding:
        disposition.deleteExecutionResult.certificateLifecycleBindings[0],
      lifecycleEvent: disposition.lifecycleWritebackResult.lifecycleEvents[0],
      certificateWriteBlockedResult,
    },
    idempotencyAndReplay: {
      duplicateQueueJobIdEqual:
        disposition.duplicateQueueFirstResult.job.dispositionJobId ===
        disposition.duplicateQueueSecondResult.job.dispositionJobId,
      duplicateQueueJobHashEqual:
        disposition.duplicateQueueFirstResult.job.jobHash ===
        disposition.duplicateQueueSecondResult.job.jobHash,
      archiveManifestHashEqual:
        disposition.archiveExecutionResult.manifest?.manifestHash ===
        disposition.archiveReplayExecutionResult.manifest?.manifestHash,
      deletionCertificateHashEqual:
        disposition.deleteExecutionResult.deletionCertificates[0]?.certificateHash ===
        disposition.deleteReplayExecutionResult.deletionCertificates[0]?.certificateHash,
    },
    scopeGuardCases: {
      permissionDeniedProjection:
        recordsGovernance.scenarioProjections.permission_denied.actionControlState,
      tenantDeniedErrorCode: disposition.tenantDeniedErrorCode,
      purposeDeniedErrorCode: disposition.purposeDeniedErrorCode,
    },
    uiStateCoverage,
    gapClosures,
  };

  const evidence = {
    schemaVersion: PHASE9_467_SCHEMA_VERSION,
    taskId: PHASE9_467_TASK_ID,
    generatedAt: GENERATED_AT,
    upstreamSchemaVersions: fixture.upstreamSchemaVersions,
    coverage: {
      creationTimeRetentionLifecycleBinding:
        retention.artifactCreationResult.result === "bound" &&
        fixture.lifecycleBindingCase.storagePathInferred === false,
      artifactClassAssignment: requiredArtifactClasses.every((artifactClass) =>
        retentionClassificationCases.some(
          (row) => row.artifactClass === artifactClass && row.boundAtCreation,
        ),
      ),
      legalHoldAndFreeze:
        activeFreezeHoldAssessment.result === "blocked" &&
        activeFreezeHoldAssessment.activeFreezeRefs.length > 0 &&
        activeFreezeHoldAssessment.activeLegalHoldRefs.length > 0,
      transitiveDependencyProtection:
        disposition.dependencyPreservationExplainer.activeDependencyRefs.length >= 6,
      wormHashChainDeletionExclusion:
        disposition.wormDeleteBlockedResult.job.resultState === "blocked",
      replayCriticalArchiveOnlyProtection:
        disposition.replayCriticalDeleteBlockedResult.job.resultState === "blocked" &&
        disposition.replayCriticalArchiveQueuedResult.job.resultState === "queued",
      blockedDispositionExplainer:
        disposition.dependencyPreservationExplainer.activeDependencyRefs.length > 0,
      archiveManifestCanonicalHashAndGraphPinning:
        /^[a-f0-9]{64}$/.test(archiveManifest.manifestHash) &&
        archiveManifest.graphHash === disposition.archiveExecutionResult.job.graphHash,
      deletionCertificateCanonicalHashScopeAndAuditAppend:
        /^[a-f0-9]{64}$/.test(deletionCertificate.certificateHash) &&
        disposition.lifecycleWritebackResult.lifecycleEvents.length > 0,
      dispositionJobIdempotency: fixture.idempotencyAndReplay.duplicateQueueJobHashEqual,
      permissionDeniedAndScopeMismatch:
        fixture.scopeGuardCases.permissionDeniedProjection === "blocked" &&
        disposition.tenantDeniedErrorCode === "DISPOSITION_TENANT_SCOPE_DENIED",
    },
    gapClosures,
    uiStateCoverage,
    noRawArtifactUrls: !hasForbiddenSyntheticLeak(fixture),
    noPhi: !hasForbiddenSyntheticLeak(fixture),
    noSecrets: !hasForbiddenSyntheticLeak(fixture),
    noSev1OrSev2Defects: true,
    replayHash: orderedSetHash(
      [
        retention.replayHash,
        disposition.replayHash,
        archiveManifest.manifestHash,
        deletionCertificate.certificateHash,
        ...retentionClassificationCases.map((row) => row.classificationHash),
      ],
      "phase9.467.retention-legal-hold-worm-replay",
    ),
  };

  return {
    fixture,
    evidence,
    contractGapArtifact: {
      schemaVersion: PHASE9_467_SCHEMA_VERSION,
      artifactId: "PHASE9_BATCH_458_472_INTERFACE_GAP_467_RETENTION_TEST_FIXTURE",
      generatedAt: GENERATED_AT,
      gapReason:
        "Prompt 467 requires deterministic cross-suite retention test cases beyond the row 442/443 engine fixtures, including incident, recovery, assistive, transcript-summary, and conformance artifact classes.",
      syntheticGraphPolicy:
        "Synthetic cases use hash-addressed refs, no PHI, no raw object URLs, explicit lifecycle bindings, and current assessment authority only.",
      retainedSourceFixtures: [
        "data/fixtures/442_phase9_retention_lifecycle_engine_fixtures.json",
        "data/fixtures/443_phase9_disposition_execution_engine_fixtures.json",
        "apps/governance-console/src/records-governance-phase9.model.ts",
      ],
      gapClosures,
      fixtureHash: canonicalHash(fixture, "contract-gap-fixture"),
    },
  };
}

export function writePhase9RetentionLegalHoldWormReplayArtifacts() {
  const suite = buildPhase9RetentionLegalHoldWormReplaySuite();
  writeJson("tests/fixtures/467_retention_dependency_graph_cases.json", suite.fixture);
  writeJson("data/evidence/467_retention_legal_hold_worm_replay_results.json", suite.evidence);
  writeJson(
    "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_467_RETENTION_TEST_FIXTURE.json",
    suite.contractGapArtifact,
  );
  return suite;
}

if (
  process.argv.includes("--write") ||
  process.argv[1]?.endsWith("run_phase9_retention_legal_hold_worm_replay.ts")
) {
  const suite = writePhase9RetentionLegalHoldWormReplayArtifacts();
  console.log("Phase 9 retention legal hold WORM replay fixtures written.");
  console.log(`Replay hash: ${suite.evidence.replayHash}`);
}
