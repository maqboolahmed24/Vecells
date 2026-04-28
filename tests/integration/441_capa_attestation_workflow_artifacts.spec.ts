import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  createPhase9CapaAttestationWorkflowFixture,
  type Phase9CapaAttestationWorkflowFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("441 Phase 9 CAPA attestation workflow artifacts", () => {
  it("publishes CAPA attestation workflow contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      deterministicReplay: {
        replayHash: string;
        firstRetrySettlementId: string;
        secondRetrySettlementId: string;
      };
    }>("data/contracts/441_phase9_capa_attestation_workflow_contract.json");
    const fixture = readJson<Phase9CapaAttestationWorkflowFixture>(
      "data/fixtures/441_phase9_capa_attestation_workflow_fixtures.json",
    );
    const recomputed = createPhase9CapaAttestationWorkflowFixture();

    expect(contract.schemaVersion).toBe(PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "EvidenceGapQueueRecord",
        "CAPAAction",
        "AssurancePackActionRecord",
        "AssurancePackSettlement",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining(["deriveEvidenceGaps", "transitionCapaStatus", "performPackAction"]),
    );
    expect(contract.deterministicReplay.firstRetrySettlementId).toBe(
      contract.deterministicReplay.secondRetrySettlementId,
    );
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("records required gap status CAPA lifecycle and queue DTO fields", () => {
    const contract = readJson<{
      gapTypes: string[];
      capaStatuses: string[];
      queueDtoFields: string[];
    }>("data/contracts/441_phase9_capa_attestation_workflow_contract.json");
    const fixture = readJson<Phase9CapaAttestationWorkflowFixture>(
      "data/fixtures/441_phase9_capa_attestation_workflow_fixtures.json",
    );

    expect(contract.gapTypes).toEqual(
      expect.arrayContaining(["missing_evidence", "missing_attestation", "incident_capa_follow_up_required"]),
    );
    expect(contract.capaStatuses).toEqual(
      expect.arrayContaining(["open", "in_progress", "awaiting_evidence", "awaiting_attestation", "completed"]),
    );
    expect(contract.queueDtoFields).toEqual(
      expect.arrayContaining(["severity", "reason", "ownerRef", "nextSafeAction", "blockerRefs", "auditRefs"]),
    );
    expect(fixture.queueDtos[0]?.nextSafeAction).toBe("attest");
  });

  it("stores pack workflow blocking settlements", () => {
    const fixture = readJson<Phase9CapaAttestationWorkflowFixture>(
      "data/fixtures/441_phase9_capa_attestation_workflow_fixtures.json",
    );

    expect(fixture.attestSuccessResult.result).toBe("pending_attestation");
    expect(fixture.signoffBlockedOpenGapResult.result).toBe("stale_pack");
    expect(fixture.signoffBlockedStaleHashResult.result).toBe("stale_pack");
    expect(fixture.publishBlockedGraphResult.result).toBe("blocked_graph");
    expect(fixture.exportRedactionBlockedResult.result).toBe("denied_scope");
    expect(fixture.actorDeniedResult.result).toBe("denied_scope");
    expect(fixture.selfApprovalDeniedResult.result).toBe("denied_scope");
  });

  it("stores audit and idempotency evidence for workflow mutations", () => {
    const fixture = readJson<Phase9CapaAttestationWorkflowFixture>(
      "data/fixtures/441_phase9_capa_attestation_workflow_fixtures.json",
    );

    expect(fixture.capaCreateResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.capaInProgressResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.capaClosureBlockedResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.attestSuccessResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.idempotentRetrySecondResult.idempotencyDecision).toBe("exact_replay");
    expect(fixture.concurrentUpdateErrorCode).toBe("CAPA_CONCURRENCY_VERSION_MISMATCH");
  });

  it("stores operator-readable summary alignment notes and no gap artifact", () => {
    const summary = readText("data/analysis/441_phase9_capa_attestation_workflow_summary.md");
    const notes = readText("data/analysis/441_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/441_capa_attestation_blocking_matrix.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_441_CAPA_ATTESTATION_WORKFLOW.json",
    );

    expect(summary).toContain("Baseline pack ref");
    expect(summary).toContain("Replay hash");
    expect(notes).toContain("EvidenceGapRecord rows become queue records");
    expect(matrix).toContain("signoff_open_gap");
    expect(matrix).toContain("export_redaction");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
