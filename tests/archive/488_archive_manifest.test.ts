import { describe, expect, it } from "vitest";
import {
  build488ScenarioRecords,
  hashValue,
  required488EdgeCases,
  write488LaunchEvidenceArchiveArtifacts,
} from "../../tools/archive/archive_488_launch_evidence";

describe("488 launch evidence archive manifest", () => {
  it("seals the active archive with deterministic WORM lineage and exceptions", () => {
    write488LaunchEvidenceArchiveArtifacts();
    const records = build488ScenarioRecords("sealed_with_exceptions", []);

    expect(records.manifest.archiveVerdict).toBe("sealed_with_exceptions");
    expect(records.manifest.blockerRefs).toEqual([]);
    expect(records.manifest.archivedEvidenceItemRefs.length).toBeGreaterThanOrEqual(10);
    expect(new Set(records.items.map((item) => item.family))).toEqual(
      new Set([
        "Scorecard",
        "Migration",
        "Signoff",
        "Tests",
        "DR",
        "Waves",
        "Assistive",
        "Channel",
        "BAU",
        "Lessons",
      ]),
    );
    expect(records.command.roleAuthorizationRef).toContain("records-governance");
    expect(records.command.idempotencyKey).toContain("488");
    expect(records.settlement.result).toBe(records.manifest.archiveVerdict);
    expect(records.exportPosture.exportState).toBe("permitted_with_redaction");
  });

  it("blocks required source, hash, owner, authorization and wave observation edge cases", () => {
    for (const scenarioId of required488EdgeCases) {
      const records = build488ScenarioRecords(scenarioId, []);
      if (scenarioId === "trace_sensitive_quarantine") {
        expect(records.manifest.archiveVerdict).toBe("sealed_with_exceptions");
        expect(records.manifest.quarantinedArtifactRefs.length).toBeGreaterThan(0);
      } else {
        expect(records.manifest.archiveVerdict, scenarioId).toBe("blocked");
        expect(records.manifest.blockerRefs.length, scenarioId).toBeGreaterThan(0);
        expect(records.settlement.archiveRecoveryActionRef, scenarioId).toBe(
          "recovery:488:hold-archive-unsealed",
        );
      }
    }
  });

  it("keeps archive hashes stable across repeated fixture runs", () => {
    const first = build488ScenarioRecords("sealed_with_exceptions", []);
    const second = build488ScenarioRecords("sealed_with_exceptions", []);
    const { recordHash: _recordHash, ...withoutHash } = first.manifest;

    expect(first.manifest.recordHash).toBe(second.manifest.recordHash);
    expect(first.manifest.wormSealDigest).toBe(second.manifest.wormSealDigest);
    expect(hashValue(withoutHash)).toBe(first.manifest.recordHash);
  });
});
