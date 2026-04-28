import { describe, expect, it } from "vitest";
import {
  Phase9InvestigationTimelineService,
  createPhase9InvestigationTimelineFixture,
  type InvestigationAuditQueryFilters,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const filters: InvestigationAuditQueryFilters = {
  windowStart: "2026-04-27T07:55:00.000Z",
  windowEnd: "2026-04-27T08:10:00.000Z",
  entityRefs: ["request:439-001"],
  subjectRefs: ["subject:439-001"],
  requiredEdgeCorrelationId: "edge-correlation:439-request",
  requiredContinuityFrameRefs: ["continuity:439-request"],
  selectedAnchorRef: "request:439-001",
};

function baselineInput() {
  const fixture = createPhase9InvestigationTimelineFixture();
  return {
    fixture,
    input: {
      envelope: fixture.envelope,
      openedBy: "actor:ops-439",
      filtersRef: "filters:439:test",
      filters,
      auditRecords: fixture.auditRecords,
      ledgerEntries: fixture.ledgerEntries,
      graphSnapshot: fixture.graphSnapshot,
      graphEdges: fixture.graphEdges,
      graphVerdict: fixture.graphVerdict,
      surfaceBindingRefs: {
        assuranceSurfaceRuntimeBindingRef: "surface-runtime-binding:ops-audit",
        surfaceRouteContractRef: "surface-route-contract:ops-audit",
        surfacePublicationRef: "surface-publication:ops-audit",
        runtimePublicationBundleRef: "runtime-publication:ops-audit",
        releasePublicationParityRef: "release-publication-parity:ops-audit",
        releaseRecoveryDispositionRef: "release-recovery:ops-audit",
      },
      generatedAt: "2026-04-27T08:20:00.000Z",
      reasonRef: "reason:439:test",
    },
  };
}

describe("439 Phase 9 investigation timeline service", () => {
  it("query without envelope rejected", () => {
    const { input } = baselineInput();
    const service = new Phase9InvestigationTimelineService();

    expect(() => service.executeScopedAuditQuery({ ...input, envelope: undefined })).toThrow(
      /INVESTIGATION_SCOPE_ENVELOPE_REQUIRED/,
    );
  });

  it("envelope with expired scope rejected", () => {
    const { fixture, input } = baselineInput();
    const service = new Phase9InvestigationTimelineService();

    expect(() =>
      service.executeScopedAuditQuery({ ...input, envelope: fixture.expiredEnvelope }),
    ).toThrow(/INVESTIGATION_SCOPE_ENVELOPE_EXPIRED/);
  });

  it("valid scoped query returns only scoped records", () => {
    const { fixture } = baselineInput();

    expect(fixture.baselineResult.auditQuerySession.coverageState).toBe("exact");
    expect(
      fixture.baselineResult.returnedAuditRecords.every((record) =>
        fixture.envelope.scopeEntityRefs.includes(record.entityRef) ||
        fixture.envelope.scopeEntityRefs.includes(record.subjectRef),
      ),
    ).toBe(true);
    expect(fixture.baselineResult.returnedAuditRecords.map((record) => record.entityRef)).not.toContain(
      "request:outside",
    );
  });

  it("break-glass required and absent -> blocked", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.breakGlassAbsentResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.breakGlassAbsentResult.auditQuerySession.blockingRefs).toContain(
      "break-glass:required-absent",
    );
  });

  it("break-glass with expired grant -> blocked", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.breakGlassExpiredResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.breakGlassExpiredResult.auditQuerySession.blockingRefs).toContain(
      "break-glass:expired-or-inadequate",
    );
  });

  it("deterministic timeline ordering", () => {
    const fixture = createPhase9InvestigationTimelineFixture();
    const rows = fixture.baselineResult.timelineReconstruction.rows;

    expect(rows.map((row) => row.eventTime)).toEqual([...rows.map((row) => row.eventTime)].sort());
    expect(rows[0]?.sourceSequenceRef).toBe("seq:000001");
  });

  it("missing graph verdict -> blocked", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.missingGraphVerdictResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.missingGraphVerdictResult.auditQuerySession.blockingRefs).toContain(
      "graph-verdict:missing",
    );
  });

  it("orphan graph edge -> blocked", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.orphanGraphEdgeResult.auditQuerySession.coverageState).toBe("blocked");
    expect(
      fixture.orphanGraphEdgeResult.auditQuerySession.blockingRefs.some((ref) =>
        ref.includes("graph:orphan-edge"),
      ),
    ).toBe(true);
  });

  it("visibility gap -> blocked", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.visibilityGapResult.auditQuerySession.coverageState).toBe("blocked");
    expect(
      fixture.visibilityGapResult.auditQuerySession.blockingRefs.some((ref) =>
        ref.includes("visibility:coverage-gap"),
      ),
    ).toBe(true);
  });

  it("cross-tenant subject denied", () => {
    const { input } = baselineInput();
    const service = new Phase9InvestigationTimelineService();

    expect(() =>
      service.executeScopedAuditQuery({
        ...input,
        auditRecords: [{ ...input.auditRecords[0]!, tenantId: "tenant:other" }],
      }),
    ).toThrow(/CROSS_TENANT_INVESTIGATION_REFERENCE_DENIED/);
  });

  it("timeline hash stable for same inputs", () => {
    const { input } = baselineInput();
    const service = new Phase9InvestigationTimelineService();
    const first = service.executeScopedAuditQuery(input);
    const second = service.executeScopedAuditQuery({
      ...input,
      auditRecords: [...input.auditRecords].reverse(),
      ledgerEntries: [...input.ledgerEntries].reverse(),
    });

    expect(second.timelineReconstruction.timelineHash).toBe(first.timelineReconstruction.timelineHash);
    expect(second.timelineReconstruction.rows.map((row) => row.rowHash)).toEqual(
      first.timelineReconstruction.rows.map((row) => row.rowHash),
    );
  });

  it("support replay uses same timeline reconstruction", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.supportReplaySession.timelineReconstructionRef).toBe(
      fixture.baselineResult.timelineReconstruction.investigationTimelineReconstructionId,
    );
    expect(fixture.supportReplaySession.timelineHash).toBe(
      fixture.baselineResult.timelineReconstruction.timelineHash,
    );
  });

  it("export/preview denied without artifact presentation policy", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.exportDeniedPreview.previewState).toBe("denied");
    expect(fixture.exportDeniedPreview.denialRefs).toEqual(
      expect.arrayContaining([
        "artifact-presentation-contract:missing",
        "outbound-navigation-grant:missing",
      ]),
    );
  });

  it("all privileged reads produce audit records", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.baselineResult.privilegedReadAuditRecords.length).toBeGreaterThanOrEqual(
      fixture.baselineResult.returnedAuditRecords.length + 1,
    );
    expect(
      fixture.baselineResult.privilegedReadAuditRecords.every(
        (record) => record.readTargetHash.length > 0 && record.reasonRef.length > 0,
      ),
    ).toBe(true);
  });
});
