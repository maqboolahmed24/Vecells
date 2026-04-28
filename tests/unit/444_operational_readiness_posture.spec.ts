import { describe, expect, it } from "vitest";
import {
  Phase9OperationalReadinessPostureService,
  createPhase9OperationalReadinessPostureFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("444 Phase 9 operational readiness posture", () => {
  it("essential-function mapping completeness", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.essentialFunctions.map((entry) => entry.functionCode)).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    expect(fixture.essentialFunctions.every((entry) => entry.supportingSystemRefs.length > 0)).toBe(
      true,
    );
    expect(fixture.essentialFunctions.every((entry) => entry.supportingDataRefs.length > 0)).toBe(
      true,
    );
  });

  it("recovery tier proof requirements", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.recoveryTiers.every((tier) => tier.tierState === "active")).toBe(true);
    expect(fixture.recoveryTiers.every((tier) => tier.requiredJourneyProofRefs.length > 0)).toBe(
      true,
    );
    expect(
      fixture.recoveryTiers.every((tier) => tier.requiredDependencyRestoreProofRefs.length > 0),
    ).toBe(true);
    expect(
      fixture.recoveryTiers.every((tier) => tier.requiredFailoverScenarioRefs.length > 0),
    ).toBe(true);
    expect(fixture.recoveryTiers.every((tier) => tier.requiredChaosExperimentRefs.length > 0)).toBe(
      true,
    );
    expect(fixture.recoveryTiers.every((tier) => tier.requiredBackupScopeRefs.length > 0)).toBe(
      true,
    );
  });

  it("dependency order cycle detection", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.dependencyOrderValidation.cycleDetected).toBe(false);
    expect(fixture.dependencyOrderValidation.dependencyOrderDigestRef).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.dependencyCycleValidation.cycleDetected).toBe(true);
    expect(fixture.dependencyCycleValidation.cyclePathRefs).toEqual(
      expect.arrayContaining(["digital_intake", "safety_gate", "triage_queue"]),
    );
  });

  it("backup-manifest checksum and immutability state", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.backupManifests.every((manifest) => manifest.manifestState === "current")).toBe(
      true,
    );
    expect(
      fixture.backupManifests.every((manifest) => manifest.immutabilityState === "immutable"),
    ).toBe(true);
    expect(fixture.backupManifests.every((manifest) => manifest.checksumBundleRef.length > 0)).toBe(
      true,
    );
  });

  it("tuple-compatible restore digest derivation", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.tupleCompatibleRestoreDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("operational-readiness snapshot tuple hashing", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.readySnapshot.readinessState).toBe("ready");
    expect(fixture.readySnapshot.resilienceTupleHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.readySnapshot.runbookBindingRefs.length).toBe(fixture.runbookBindings.length);
  });

  it("runbook binding staleness and withdrawal downgrades", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.staleRunbookSnapshot.readinessState).toBe("constrained");
    expect(fixture.missingRunbookPosture.postureState).not.toBe("live_control");
    expect(fixture.missingRunbookPosture.blockerRefs.some((ref) => ref.includes("runbook"))).toBe(
      true,
    );
  });

  it("recovery-control posture downgrade for stale publication, degraded trust, active freeze, missing backups, missing runbooks, stale evidence packs, missing journey proof, and partial dependency coverage", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.livePosture.postureState).toBe("live_control");
    expect(fixture.stalePublicationPosture.postureState).toBe("diagnostic_only");
    expect(fixture.degradedTrustPosture.postureState).toBe("diagnostic_only");
    expect(fixture.activeFreezePosture.postureState).toBe("governed_recovery");
    expect(fixture.missingBackupPosture.postureState).toBe("blocked");
    expect(fixture.missingRunbookPosture.postureState).toBe("diagnostic_only");
    expect(fixture.staleEvidencePackPosture.postureState).toBe("diagnostic_only");
    expect(fixture.missingJourneyProofPosture.postureState).toBe("blocked");
    expect(fixture.partialDependencyPosture.postureState).toBe("diagnostic_only");
  });

  it("tenant/scope authorization", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.tenantDeniedErrorCode).toBe("READINESS_SCOPE_TENANT_DENIED");
    expect(fixture.scopeDeniedErrorCode).toBe("READINESS_PURPOSE_OF_USE_DENIED");
  });

  it("deterministic posture recomputation", () => {
    const fixture = createPhase9OperationalReadinessPostureFixture();

    expect(fixture.deterministicPostureReplay.controlTupleHash).toBe(
      fixture.livePosture.controlTupleHash,
    );
    expect(fixture.deterministicPostureReplay.recoveryControlPostureId).toBe(
      fixture.livePosture.recoveryControlPostureId,
    );
  });

  it("stable cursor APIs for board consumption", () => {
    const service = new Phase9OperationalReadinessPostureService();
    const fixture = createPhase9OperationalReadinessPostureFixture();
    const firstPage = service.listWithCursor(fixture.essentialFunctions, undefined, 4);
    const secondPage = service.listWithCursor(fixture.essentialFunctions, firstPage.nextCursor, 4);

    expect(firstPage.rows).toHaveLength(4);
    expect(firstPage.nextCursor).toBe("cursor:4");
    expect(secondPage.rows).toHaveLength(4);
    expect(secondPage.nextCursor).toBe("cursor:8");
  });
});
