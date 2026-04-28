import { describe, expect, it } from "vitest";
import {
  buildRecoveryEvidencePack,
  canonicalBackupScopes,
  canonicalEssentialFunctionMap,
  canonicalRecoveryTiers,
  compileOperationalReadinessSnapshot,
  createBackupSetManifest,
  createResilienceBaselineSimulationHarness,
  createResilienceTupleHash,
  createRunbookBindingRecord,
  runRestoreRehearsal,
  selectResilienceBaselineScenario,
  validateBackupSetManifest,
} from "../src/resilience-baseline.ts";

describe("resilience baseline controls", () => {
  it("generates tuple-bound backup manifests with source digest evidence", () => {
    const tuple = {
      environmentRing: "local",
      previewEnvironmentRef: null,
      runtimePublicationBundleRef: "rpb::local::authoritative",
      releasePublicationParityRef: "rpp::local::authoritative",
      releaseWatchTupleRef: "RWT_LOCAL_V1::local_satisfied",
      waveObservationPolicyRef: "WOP_LOCAL_V1::local_satisfied",
      buildProvenanceRef: "bpr::run_release_controls_local_verified",
      requiredAssuranceSliceRefs: [
        "asr_runtime_topology_tuple",
        "asr_release_watch_tuple",
        "asr_restore_readiness",
      ],
      activeFreezeRefs: [],
    } as const;
    const manifest = createBackupSetManifest({
      tuple,
      scope: canonicalBackupScopes[0]!,
      essentialFunctionRefs: ["ef_patient_entry_recovery"],
      sourceDigestEntries: [
        {
          sourceRef: "data/analysis/store_and_retention_matrix.csv",
          relativePath: "store_domain_transaction/primary.json",
          digest: "digest-a",
          sizeBytes: 128,
        },
      ],
      capturedAt: "2026-04-13T12:00:00.000Z",
    });
    const validation = validateBackupSetManifest(manifest);

    expect(validation.valid).toBe(true);
    expect(manifest.manifestTupleHash).toBe(createResilienceTupleHash(tuple));
    expect(manifest.backupArtifactDigest).toBeTruthy();
  });

  it("publishes restore runs that stop at journey-validation-pending without pretending readiness", () => {
    const tuple = {
      environmentRing: "local",
      previewEnvironmentRef: null,
      runtimePublicationBundleRef: "rpb::local::authoritative",
      releasePublicationParityRef: "rpp::local::authoritative",
      releaseWatchTupleRef: "RWT_LOCAL_V1::local_satisfied",
      waveObservationPolicyRef: "WOP_LOCAL_V1::local_satisfied",
      buildProvenanceRef: "bpr::run_release_controls_local_verified",
      requiredAssuranceSliceRefs: [
        "asr_runtime_topology_tuple",
        "asr_release_watch_tuple",
        "asr_restore_readiness",
      ],
      activeFreezeRefs: [],
    } as const;

    const restoreRun = runRestoreRehearsal({
      tuple,
      functionCode: "ef_workspace_settlement",
      restoreTargetRef: "restore-target://local/ef_workspace_settlement",
      backupSetManifestRefs: ["BSM_101_LOCAL_STORE_DOMAIN_TRANSACTION"],
      runbookBindingRefs: ["RBR_101_EF_WORKSPACE_SETTLEMENT"],
      requiredJourneyProofRefs: ["journey://workspace/task-completion"],
      initiatedAt: "2026-04-13T12:00:00.000Z",
      journeyValidationState: "pending",
    });

    expect(restoreRun.restoreState).toBe("journey_validation_pending");
    expect(restoreRun.stageRecords.at(-1)?.stage).toBe("journey_validation_pending");
    expect(restoreRun.completedAt).toBeNull();
  });

  it("compiles an exact-and-ready snapshot for the canonical harness", () => {
    const harness = createResilienceBaselineSimulationHarness();

    expect(harness.scenario.expectedReadinessState).toBe("exact_and_ready");
    expect(harness.scenario.snapshot.readinessState).toBe("exact_and_ready");
    expect(harness.scenario.snapshot.functionVerdicts).toHaveLength(
      canonicalEssentialFunctionMap.length,
    );
    expect(harness.snapshotValidation.valid).toBe(true);
  });

  it("fails closed on stale rehearsal evidence", () => {
    const scenario = selectResilienceBaselineScenario({
      scenarioId: "LOCAL_STALE_REHEARSAL",
    });

    expect(scenario.snapshot.readinessState).toBe("stale_rehearsal_evidence");
    expect(
      scenario.snapshot.functionVerdicts.some(
        (verdict) => verdict.readinessState === "stale_rehearsal_evidence",
      ),
    ).toBe(true);
  });

  it("fails closed when a required backup manifest is missing", () => {
    const scenario = selectResilienceBaselineScenario({
      scenarioId: "CI_PREVIEW_MISSING_BACKUP_MANIFEST",
    });

    expect(scenario.snapshot.readinessState).toBe("missing_backup_manifest");
    expect(scenario.snapshot.blockerRefs).toContain("MISSING_BACKUP_MANIFEST");
  });

  it("fails closed on tuple drift between evidence and the current publication tuple", () => {
    const scenario = selectResilienceBaselineScenario({
      scenarioId: "PREPROD_TUPLE_DRIFT",
    });

    expect(scenario.snapshot.readinessState).toBe("tuple_drift");
    expect(scenario.snapshot.blockerRefs).toContain("RESILIENCE_TUPLE_DRIFT");
  });

  it("blocks readiness when assurance or freeze posture is active", () => {
    const scenario = selectResilienceBaselineScenario({
      scenarioId: "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
    });

    expect(scenario.snapshot.readinessState).toBe("assurance_or_freeze_blocked");
    expect(scenario.snapshot.activeFreezeRefs.length).toBeGreaterThan(0);
  });

  it("keeps the essential function map and recovery tiers fully covered by backup scopes", () => {
    const backupScopeIds = new Set(canonicalBackupScopes.map((scope) => scope.datasetScopeRef));
    const recoveryTierIds = new Set(canonicalRecoveryTiers.map((tier) => tier.recoveryTierId));

    expect(canonicalEssentialFunctionMap).toHaveLength(9);
    canonicalEssentialFunctionMap.forEach((binding) => {
      expect(recoveryTierIds.has(binding.recoveryTierRef)).toBe(true);
      binding.requiredBackupScopeRefs.forEach((scopeRef) => {
        expect(backupScopeIds.has(scopeRef)).toBe(true);
      });
      expect(binding.requiredJourneyProofRefs.length).toBeGreaterThan(0);
      expect(binding.currentRunbookBindingRefs.length).toBeGreaterThan(0);
    });
  });

  it("compiles a blocked snapshot when a restore run and evidence pack disagree with freshness", () => {
    const tuple = {
      environmentRing: "integration",
      previewEnvironmentRef: "pev_integration",
      runtimePublicationBundleRef: "rpb::integration::authoritative",
      releasePublicationParityRef: "rpp::integration::authoritative",
      releaseWatchTupleRef: "RWT_INTEGRATION_V1::integration_active",
      waveObservationPolicyRef: "WOP_INTEGRATION_V1::integration_active",
      buildProvenanceRef: "bpr::run_release_controls_integration_verified",
      requiredAssuranceSliceRefs: [
        "asr_runtime_topology_tuple",
        "asr_release_watch_tuple",
        "asr_restore_readiness",
      ],
      activeFreezeRefs: [],
    } as const;
    const runbook = createRunbookBindingRecord({
      tuple,
      functionCode: "ef_patient_entry_recovery",
      runbookRef: "runbook://ef_patient_entry_recovery",
      ownerRef: "owner://patient",
      bindingState: "current",
      lastRehearsedAt: "2026-04-13T11:00:00.000Z",
      freshnessDeadlineAt: "2026-04-13T18:00:00.000Z",
      sourceRefs: ["prompt/101.md"],
    });
    const manifest = createBackupSetManifest({
      tuple,
      scope: canonicalBackupScopes[0]!,
      essentialFunctionRefs: ["ef_patient_entry_recovery"],
      sourceDigestEntries: [
        {
          sourceRef: "data/analysis/store_and_retention_matrix.csv",
          relativePath: "store_domain_transaction/primary.json",
          digest: "digest-a",
          sizeBytes: 128,
        },
      ],
      capturedAt: "2026-04-13T12:00:00.000Z",
    });
    const restoreRun = runRestoreRehearsal({
      tuple,
      functionCode: "ef_patient_entry_recovery",
      restoreTargetRef: "restore-target://integration/ef_patient_entry_recovery",
      backupSetManifestRefs: [manifest.backupSetManifestId],
      runbookBindingRefs: [runbook.runbookBindingRecordId],
      requiredJourneyProofRefs: ["journey://patient-entry/intake-resume"],
      initiatedAt: "2026-04-13T12:00:00.000Z",
      journeyValidationState: "validated",
      blockerRefs: ["RESTORE_VALIDATION_MISMATCH"],
    });
    const evidencePack = buildRecoveryEvidencePack(
      {
        tuple,
        functionCode: "ef_patient_entry_recovery",
        backupSetManifestRefs: [manifest.backupSetManifestId],
        runbookBindingRefs: [runbook.runbookBindingRecordId],
        restoreRunRef: restoreRun.restoreRunId,
        syntheticJourneyProofRefs: ["journey://patient-entry/intake-resume"],
        generatedAt: "2026-04-13T12:10:00.000Z",
        validUntil: "2026-04-13T18:00:00.000Z",
      },
      restoreRun,
      [runbook],
      [manifest],
    );

    const snapshot = compileOperationalReadinessSnapshot({
      tuple,
      buildProvenanceState: "verified",
      compiledAt: "2026-04-13T12:20:00.000Z",
      essentialFunctions: canonicalEssentialFunctionMap.filter(
        (binding) => binding.functionCode === "ef_patient_entry_recovery",
      ),
      recoveryTiers: canonicalRecoveryTiers,
      backupManifests: [manifest],
      runbookBindings: [runbook],
      restoreRuns: [restoreRun],
      evidencePacks: [evidencePack],
    });

    expect(snapshot.readinessState).toBe("blocked_restore_proof");
    expect(snapshot.blockerRefs).toContain("BLOCKED_RESTORE_PROOF");
  });
});
