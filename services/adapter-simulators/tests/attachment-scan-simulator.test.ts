import { describe, expect, it } from "vitest";
import { createAttachmentScanSimulator } from "../src/attachment-scan-simulator";

describe("attachment scan simulator", () => {
  it("returns deterministic safe, malware, and integrity verdicts", async () => {
    const scanner = createAttachmentScanSimulator();

    const safe = await scanner.scanAttachment({
      attachmentPublicId: "att_safe_001",
      draftPublicId: "dft_safe_001",
      fileName: "proof.pdf",
      declaredMimeType: "application/pdf",
      detectedMimeType: "application/pdf",
      byteSize: 1024,
      checksumSha256: "hash_safe_001",
      suppliedChecksumSha256: "hash_safe_001",
      quarantineObjectKey: "quarantine/dft_safe_001/att_safe_001/proof.pdf",
      simulatorScenarioId: "clean",
      startedAt: "2026-04-14T20:20:00Z",
    });
    const malware = await scanner.scanAttachment({
      attachmentPublicId: "att_mal_001",
      draftPublicId: "dft_safe_001",
      fileName: "proof.pdf",
      declaredMimeType: "application/pdf",
      detectedMimeType: "application/pdf",
      byteSize: 1024,
      checksumSha256: "hash_mal_001",
      suppliedChecksumSha256: "hash_mal_001",
      quarantineObjectKey: "quarantine/dft_safe_001/att_mal_001/proof.pdf",
      simulatorScenarioId: "malware_positive",
      startedAt: "2026-04-14T20:20:00Z",
    });
    const integrity = await scanner.scanAttachment({
      attachmentPublicId: "att_int_001",
      draftPublicId: "dft_safe_001",
      fileName: "proof.pdf",
      declaredMimeType: "application/pdf",
      detectedMimeType: "application/pdf",
      byteSize: 1024,
      checksumSha256: "actual_hash",
      suppliedChecksumSha256: "wrong_hash",
      quarantineObjectKey: "quarantine/dft_safe_001/att_int_001/proof.pdf",
      simulatorScenarioId: null,
      startedAt: "2026-04-14T20:20:00Z",
    });

    expect(safe).toMatchObject({
      scenarioId: "clean",
      verdict: "clean",
      reasonCodes: [],
    });
    expect(malware).toMatchObject({
      scenarioId: "malware_positive",
      verdict: "malware",
    });
    expect(integrity).toMatchObject({
      scenarioId: "integrity_failure",
      verdict: "integrity_failure",
      reasonCodes: ["ATTACH_REASON_INTEGRITY_FAILURE"],
    });
  });
});
