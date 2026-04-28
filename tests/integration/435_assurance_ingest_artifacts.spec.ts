import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  Phase9AssuranceIngestService,
  createDefaultPhase9AssuranceProducerRegistration,
  createPhase9AssuranceIngestFixture,
  createPhase9AssuranceProducerEnvelope,
  validateContractObject,
  type AssuranceIngestFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("435 Phase 9 assurance ingest artifacts", () => {
  it("publishes the service contract and deterministic fixture", () => {
    const contract = readJson<{
      schemaVersion: string;
      requiredCapabilities: string[];
      quarantineReasons: string[];
      graphHash: string;
      rebuildHash: string;
    }>("data/contracts/435_phase9_assurance_ingest_service_contract.json");
    const fixture = readJson<AssuranceIngestFixture>(
      "data/fixtures/435_phase9_assurance_ingest_service_fixtures.json",
    );
    const recomputed = createPhase9AssuranceIngestFixture();

    expect(contract.schemaVersion).toBe(PHASE9_ASSURANCE_INGEST_SERVICE_VERSION);
    expect(contract.requiredCapabilities).toContain("ingest one producer event");
    expect(contract.requiredCapabilities).toContain("fetch latest snapshot reference for a tenant scope");
    expect(contract.quarantineReasons).toContain("DUPLICATE_DIFFERENT_HASH");
    expect(contract.graphHash).toBe(fixture.snapshot.graphHash);
    expect(fixture.snapshot.graphHash).toBe(recomputed.snapshot.graphHash);
    expect(fixture.rebuildHash).toBe(recomputed.rebuildHash);
  });

  it("stores frozen contract-compatible ledger, checkpoint, artifact, and graph snapshot examples", () => {
    const fixture = readJson<AssuranceIngestFixture>(
      "data/fixtures/435_phase9_assurance_ingest_service_fixtures.json",
    );

    expect(validateContractObject("AssuranceLedgerEntry", fixture.acceptedReceipt.ledgerEntry)).toEqual({
      valid: true,
      errors: [],
    });
    expect(validateContractObject("AssuranceIngestCheckpoint", fixture.acceptedReceipt.checkpoint)).toEqual({
      valid: true,
      errors: [],
    });
    expect(validateContractObject("EvidenceArtifact", fixture.acceptedReceipt.evidenceArtifacts[0])).toEqual({
      valid: true,
      errors: [],
    });
    expect(validateContractObject("AssuranceEvidenceGraphSnapshot", fixture.snapshot)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("exposes snapshot read APIs for downstream services", () => {
    const ingest = new Phase9AssuranceIngestService([createDefaultPhase9AssuranceProducerRegistration()]);
    ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    const sealed = ingest.materializeGraphSnapshot({
      tenantScopeRef: "tenant:demo-gp",
      generatedAt: "2026-04-27T09:05:00.000Z",
      controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
    });
    const context = {
      tenantId: "tenant:demo-gp",
      role: "assurance_reader",
      purposeOfUseRef: "assurance.operations",
    };

    expect(ingest.fetchSnapshotById(sealed.snapshot.assuranceEvidenceGraphSnapshotId, context)?.graphHash).toBe(
      sealed.snapshot.graphHash,
    );
    expect(ingest.fetchLatestSnapshotRef("tenant:demo-gp", context)).toBe(
      sealed.snapshot.assuranceEvidenceGraphSnapshotId,
    );
    expect(
      ingest.fetchGraphEdges({ snapshotId: sealed.snapshot.assuranceEvidenceGraphSnapshotId, artifactRef: "control:dtac:clinical-safety:evidence" }, context)
        .length,
    ).toBeGreaterThan(0);
  });

  it("writes operator-readable summary, algorithm notes, and API matrix", () => {
    const summary = readText("data/analysis/435_phase9_assurance_ingest_service_summary.md");
    const notes = readText("data/analysis/435_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/435_assurance_ingest_api_matrix.csv");

    expect(summary).toContain("Service version: 435.phase9.assurance-ingest-service.v1");
    expect(summary).toContain("Duplicate decision: idempotent_replay");
    expect(notes).toContain("Checkpointing is exactly-once");
    expect(notes).toContain("Read APIs enforce tenant");
    expect(matrix).toContain("ingestEvent");
    expect(matrix).toContain("rebuildFromAcceptedRawEvents");
  });

  it("records that no assurance ingest producer gap artifact is needed", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_435_ASSURANCE_INGEST_PRODUCER.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
