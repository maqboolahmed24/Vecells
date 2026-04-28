import { describe, expect, it } from "vitest";
import {
  GENESIS_ASSURANCE_LEDGER_HASH,
  Phase9AssuranceIngestService,
  Phase9AssuranceIngestServiceError,
  assertEvidenceArtifactImmutable,
  canonicalProducerEventHash,
  createDefaultPhase9AssuranceProducerRegistration,
  createPhase9AssuranceProducerEnvelope,
  validateLedgerPreviousHashContinuity,
  type EvidenceArtifact,
} from "../../packages/domains/analytics_assurance/src/index.ts";

function service() {
  return new Phase9AssuranceIngestService([createDefaultPhase9AssuranceProducerRegistration()]);
}

describe("435 Phase 9 assurance ingest service", () => {
  it("valid event accepted and ledger entry created", () => {
    const ingest = service();
    const receipt = ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());

    expect(receipt.decision).toBe("accepted");
    expect(receipt.ledgerEntry?.previousHash).toBe(GENESIS_ASSURANCE_LEDGER_HASH);
    expect(receipt.ledgerEntry?.producerRef).toBe("producer:assistive-rollout");
    expect(receipt.evidenceArtifacts).toHaveLength(1);
    expect(ingest.queryCheckpoint({
      producerRef: "producer:assistive-rollout",
      namespaceRef: "canonical.assurance.assistive",
      schemaVersionRef: receipt.ledgerEntry!.schemaVersionRef,
      tenantId: "tenant:demo-gp",
    })?.lastAcceptedSequenceRef).toBe("seq:000001");
  });

  it("duplicate same hash handled idempotently", () => {
    const ingest = service();
    const first = ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    const second = ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());

    expect(first.decision).toBe("accepted");
    expect(second.decision).toBe("idempotent_replay");
    expect(ingest.getState().ledgerEntries).toHaveLength(1);
  });

  it("duplicate different hash quarantined", () => {
    const ingest = service();
    ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    const duplicate = ingest.ingestEvent(
      createPhase9AssuranceProducerEnvelope({
        payload: { changed: true },
      }),
    );

    expect(duplicate.decision).toBe("quarantined");
    expect(duplicate.quarantineRecord?.reason).toBe("DUPLICATE_DIFFERENT_HASH");
    expect(ingest.getState().ledgerEntries).toHaveLength(1);
  });

  it("out-of-order sequence quarantined", () => {
    const ingest = service();
    ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    const outOfOrder = ingest.ingestEvent(createPhase9AssuranceProducerEnvelope({ sourceSequenceRef: "seq:000003" }));

    expect(outOfOrder.decision).toBe("quarantined");
    expect(outOfOrder.quarantineRecord?.reason).toBe("SEQUENCE_GAP");
  });

  it("unsupported schema quarantined", () => {
    const receipt = service().ingestEvent(
      createPhase9AssuranceProducerEnvelope({ schemaVersionRef: "unsupported.schema.v1" }),
    );

    expect(receipt.decision).toBe("quarantined");
    expect(receipt.quarantineRecord?.reason).toBe("UNSUPPORTED_SCHEMA");
  });

  it("missing bounded-context owner quarantined", () => {
    const receipt = service().ingestEvent(
      createPhase9AssuranceProducerEnvelope({ sourceBoundedContextRef: "bounded-context:wrong-owner" }),
    );

    expect(receipt.decision).toBe("quarantined");
    expect(receipt.quarantineRecord?.reason).toBe("INVALID_BOUNDED_CONTEXT_OWNER");
  });

  it("cross-tenant reference denied", () => {
    const receipt = service().ingestEvent(
      createPhase9AssuranceProducerEnvelope({ referencedTenantIds: ["tenant:demo-gp", "tenant:other"] }),
    );

    expect(receipt.decision).toBe("quarantined");
    expect(receipt.quarantineRecord?.reason).toBe("CROSS_TENANT_REFERENCE");
  });

  it("enforces previous-hash continuity", () => {
    const ingest = service();
    const first = ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    const second = ingest.ingestEvent(
      createPhase9AssuranceProducerEnvelope({
        sourceSequenceRef: "seq:000002",
        expectedPreviousHash: "0".repeat(64),
      }),
    );

    expect(first.ledgerEntry?.hash).not.toBe("0".repeat(64));
    expect(second.decision).toBe("quarantined");
    expect(second.quarantineRecord?.reason).toBe("PREVIOUS_HASH_DISCONTINUITY");
    expect(validateLedgerPreviousHashContinuity(ingest.getState().ledgerEntries)).toEqual({ valid: true, errors: [] });
  });

  it("canonical hash determinism is stable across key order", () => {
    const first = createPhase9AssuranceProducerEnvelope({
      payload: { zeta: true, alpha: "first" },
    });
    const second = createPhase9AssuranceProducerEnvelope({
      payload: { alpha: "first", zeta: true },
    });

    expect(canonicalProducerEventHash(first)).toBe(canonicalProducerEventHash(second));
  });

  it("evidence artifact immutability rejects in-place mutation", () => {
    const ingest = service();
    const receipt = ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    const artifact = receipt.evidenceArtifacts[0]!;
    const mutated: EvidenceArtifact = { ...artifact, visibilityScope: "tenant:demo-gp:too-wide" };

    expect(() => assertEvidenceArtifactImmutable(artifact, mutated)).toThrow(Phase9AssuranceIngestServiceError);
  });

  it("graph snapshot deterministic ordering and hash", () => {
    const ingest = service();
    ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    const first = ingest.materializeGraphSnapshot({
      tenantScopeRef: "tenant:demo-gp",
      generatedAt: "2026-04-27T09:05:00.000Z",
      controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
    });
    const second = ingest.materializeGraphSnapshot({
      tenantScopeRef: "tenant:demo-gp",
      generatedAt: "2026-04-27T09:05:00.000Z",
      controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
    });

    expect(first.snapshot.graphHash).toBe(second.snapshot.graphHash);
    expect(first.edges.map((edge) => edge.edgeHash)).toEqual([...first.edges.map((edge) => edge.edgeHash)].sort());
  });

  it("rebuild from raw accepted inputs yields identical ledger and graph snapshot", () => {
    const ingest = service();
    ingest.ingestBatch([
      createPhase9AssuranceProducerEnvelope(),
      createPhase9AssuranceProducerEnvelope({ sourceSequenceRef: "seq:000002" }),
    ]);
    const snapshot = ingest.materializeGraphSnapshot({
      tenantScopeRef: "tenant:demo-gp",
      generatedAt: "2026-04-27T09:05:00.000Z",
      controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
    });
    const rebuild = ingest.rebuildFromAcceptedRawEvents({
      tenantScopeRef: "tenant:demo-gp",
      generatedAt: "2026-04-27T09:05:00.000Z",
      controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
    });

    expect(rebuild.snapshot.graphHash).toBe(snapshot.snapshot.graphHash);
    expect(rebuild.ledgerEntries.map((entry) => entry.hash)).toEqual(
      ingest.getState().ledgerEntries.map((entry) => entry.hash),
    );
  });

  it("concurrent ingest does not double-accept", async () => {
    const ingest = service();
    const envelope = createPhase9AssuranceProducerEnvelope();
    const receipts = await Promise.all([
      Promise.resolve().then(() => ingest.ingestEvent(envelope)),
      Promise.resolve().then(() => ingest.ingestEvent(envelope)),
    ]);

    expect(receipts.map((receipt) => receipt.decision).sort()).toEqual(["accepted", "idempotent_replay"]);
    expect(ingest.getState().ledgerEntries).toHaveLength(1);
  });

  it("authorization denial protects read APIs", () => {
    const ingest = service();
    ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
    ingest.materializeGraphSnapshot({
      tenantScopeRef: "tenant:demo-gp",
      generatedAt: "2026-04-27T09:05:00.000Z",
      controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
    });

    expect(() =>
      ingest.fetchLatestSnapshotRef("tenant:demo-gp", {
        tenantId: "tenant:demo-gp",
        role: "support_reader",
        purposeOfUseRef: "support.replay",
      }),
    ).toThrow(Phase9AssuranceIngestServiceError);
  });

  it("no PHI in logs even when payload contains sensitive fields", () => {
    const ingest = service();
    ingest.ingestEvent(
      createPhase9AssuranceProducerEnvelope({
        payload: {
          patientName: "Example Person",
          nhsNumber: "0000000000",
          payloadDigestRef: "digest:redacted",
        },
      }),
    );

    const logs = JSON.stringify(ingest.getSafeLogs());
    expect(logs).not.toContain("Example Person");
    expect(logs).not.toContain("0000000000");
    expect(logs).toContain("canonicalInputHash");
  });
});
