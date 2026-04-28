import { describe, expect, it } from "vitest";
import {
  buildPhase9RetentionLegalHoldWormReplaySuite,
  PHASE9_467_SCHEMA_VERSION,
} from "../../tools/test/run_phase9_retention_legal_hold_worm_replay";

describe("467 retention lifecycle binding hardening", () => {
  it("binds every required records artifact class at creation time", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const requiredArtifactClasses = [
      "evidence_artifact",
      "assurance_pack",
      "audit_record",
      "incident_bundle",
      "recovery_artifact",
      "assistive_final_human_artifact",
      "transcript_summary",
      "conformance_artifact",
    ];

    expect(fixture.schemaVersion).toBe(PHASE9_467_SCHEMA_VERSION);
    expect(evidence.coverage.artifactClassAssignment).toBe(true);
    for (const artifactClass of requiredArtifactClasses) {
      const row = fixture.retentionClassificationCases.find(
        (candidate) => candidate.artifactClass === artifactClass,
      );
      expect(row, `missing ${artifactClass}`).toBeDefined();
      expect(row?.boundAtCreation).toBe(true);
      expect(row?.explicitLifecycleBindingOnly).toBe(true);
      expect(row?.storagePathInferred).toBe(false);
      expect(row?.classificationHash).toMatch(/^[a-f0-9]{64}$/);
      expect(row?.retentionLifecycleBindingRef).toMatch(/^rlb_467_/);
    }
  });

  it("keeps lifecycle binding identity immutable after retention-class supersession", () => {
    const { fixture } = buildPhase9RetentionLegalHoldWormReplaySuite();

    expect(fixture.lifecycleBindingCase.binding?.retentionLifecycleBindingId).toMatch(/^rlb_442_/);
    expect(fixture.lifecycleBindingCase.binding?.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(fixture.lifecycleBindingCase.immutableFields).toEqual(
      expect.arrayContaining([
        "artifactRef",
        "artifactVersionRef",
        "artifactClassRef",
        "retentionClassRef",
        "createdAt",
        "classificationHash",
      ]),
    );
    expect(fixture.lifecycleBindingCase.classSupersessionPreservesOldDecision).toBe(true);
    expect(fixture.lifecycleBindingCase.storagePathInferred).toBe(false);
  });

  it("rejects raw storage scan deletion candidates before they can become delete-ready", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const rawScan = fixture.dispositionProtectionCases.rawStorageScan;

    expect(evidence.gapClosures.storageScanDeletionGap).toBe(true);
    expect(rawScan.candidateSource).toBe("raw_storage_scan");
    expect(rawScan.lifecycleAssessmentState).toBe("blocked");
    expect(rawScan.lifecycleBlockers).toContain("source:raw-storage-scan-denied");
    expect(rawScan.jobState).toBe("blocked");
    expect(rawScan.jobBlockers).toEqual(expect.arrayContaining(["source:raw_storage_scan:denied"]));
    expect(rawScan.rawObjectStorePath).not.toMatch(/^(s3|gs|https?):\/\//);
  });
});
