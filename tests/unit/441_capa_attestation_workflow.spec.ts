import { describe, expect, it } from "vitest";
import {
  Phase9CapaAttestationWorkflowError,
  Phase9CapaAttestationWorkflowService,
  createPhase9CapaAttestationWorkflowFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("441 Phase 9 CAPA attestation workflow", () => {
  it("gap derivation from missing evidence", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.missingEvidenceGaps).toHaveLength(1);
    expect(fixture.missingEvidenceGaps[0]?.gapType).toBe("missing_evidence");
    expect(fixture.missingEvidenceGaps[0]?.graphHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("gap de-duplication by control/scope/reason/hash", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.dedupedMissingEvidenceGaps).toHaveLength(1);
    expect(fixture.dedupedMissingEvidenceGaps[0]?.evidenceGapQueueRecordId).toBe(
      fixture.missingEvidenceGaps[0]?.evidenceGapQueueRecordId,
    );
  });

  it("CAPA creation and status transition", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.capaCreateResult.result).toBe("created");
    expect(fixture.capaCreateResult.capaAction.status).toBe("open");
    expect(fixture.capaInProgressResult.result).toBe("updated");
    expect(fixture.capaInProgressResult.capaAction.status).toBe("in_progress");
  });

  it("CAPA closure blocked when evidence unresolved", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.capaClosureBlockedResult.result).toBe("blocked");
    expect(fixture.capaClosureBlockedResult.blockerRefs).toContain(
      `gap:unresolved:${fixture.missingEvidenceGaps[0]?.evidenceGapQueueRecordId}`,
    );
  });

  it("overdue derivation", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.overdueCapaRef).toBe(fixture.capaCreateResult.capaAction.capaActionId);
  });

  it("pack attestation success", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.attestSuccessResult.result).toBe("pending_attestation");
    expect(fixture.attestSuccessResult.settlement.reproductionState).toBe("exact");
  });

  it("signoff blocked by open gap", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.signoffBlockedOpenGapResult.result).toBe("stale_pack");
    expect(fixture.signoffBlockedOpenGapResult.blockerRefs[0]).toContain("gap:open:");
  });

  it("signoff blocked by stale pack hash", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.signoffBlockedStaleHashResult.result).toBe("stale_pack");
    expect(fixture.signoffBlockedStaleHashResult.blockerRefs).toContain("pack:version-hash-changed");
  });

  it("publish blocked by graph verdict change", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.publishBlockedGraphResult.result).toBe("blocked_graph");
    expect(fixture.publishBlockedGraphResult.blockerRefs).toContain("graph:verdict-stale");
  });

  it("export-ready blocked by redaction policy mismatch", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.exportRedactionBlockedResult.result).toBe("denied_scope");
    expect(fixture.exportRedactionBlockedResult.blockerRefs).toContain("redaction:policy-hash-mismatch");
  });

  it("actor without role denied", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.actorDeniedResult.result).toBe("denied_scope");
    expect(fixture.actorDeniedResult.blockerRefs[0]).toContain("authz:role-required");
  });

  it("self-approval denied where policy requires separation", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.selfApprovalDeniedResult.result).toBe("denied_scope");
    expect(fixture.selfApprovalDeniedResult.blockerRefs).toContain("separation:self-approval-denied");
  });

  it("idempotent retry returns same settlement", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.idempotentRetrySecondResult.idempotencyDecision).toBe("exact_replay");
    expect(fixture.idempotentRetrySecondResult.settlement.assurancePackSettlementId).toBe(
      fixture.idempotentRetryFirstResult.settlement.assurancePackSettlementId,
    );
  });

  it("concurrent update fails cleanly", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.concurrentUpdateErrorCode).toBe("CAPA_CONCURRENCY_VERSION_MISMATCH");
  });

  it("audit records written for every mutation", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();

    expect(fixture.capaCreateResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.capaInProgressResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.capaClosureBlockedResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.capaCompletedResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.attestSuccessResult.auditRecords.length).toBeGreaterThan(0);
  });

  it("lists evidence gaps with stable cursor and tenant-safe detail", () => {
    const fixture = createPhase9CapaAttestationWorkflowFixture();
    const service = new Phase9CapaAttestationWorkflowService();
    const firstPage = service.listEvidenceGaps({
      tenantId: "tenant:demo-gp",
      gaps: fixture.missingEvidenceGaps,
      limit: 1,
    });
    const detail = service.getEvidenceGapDetail({
      tenantId: "tenant:demo-gp",
      gapRef: firstPage.rows[0]!.evidenceGapQueueRecordId,
      gaps: fixture.missingEvidenceGaps,
    });

    expect(firstPage.rows).toHaveLength(1);
    expect(detail.evidenceGapQueueRecordId).toBe(firstPage.rows[0]?.evidenceGapQueueRecordId);
    expect(() =>
      service.getEvidenceGapDetail({
        tenantId: "tenant:other",
        gapRef: firstPage.rows[0]!.evidenceGapQueueRecordId,
        gaps: fixture.missingEvidenceGaps,
      }),
    ).toThrow(Phase9CapaAttestationWorkflowError);
  });
});
