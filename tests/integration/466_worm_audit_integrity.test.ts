import { describe, expect, it } from "vitest";
import {
  GENESIS_ASSURANCE_LEDGER_HASH,
  createPhase9InvestigationTimelineFixture,
  hashAssurancePayload,
} from "../../packages/domains/analytics_assurance/src/index";
import {
  buildPhase9AuditAssuranceSyntheticCases,
  runPhase9AuditBreakGlassAssuranceRedactionSuite,
} from "../../tools/test/run_phase9_audit_break_glass_assurance_redaction";

describe("task 466 WORM audit integrity and scoped replay", () => {
  it("keeps the WORM ledger append-only and hash-chained", () => {
    const fixture = createPhase9InvestigationTimelineFixture();

    expect(fixture.ledgerEntries).toHaveLength(4);
    expect(fixture.ledgerEntries[0]?.previousHash).toBe(GENESIS_ASSURANCE_LEDGER_HASH);
    for (let index = 1; index < fixture.ledgerEntries.length; index += 1) {
      expect(fixture.ledgerEntries[index]?.previousHash).toBe(
        fixture.ledgerEntries[index - 1]?.hash,
      );
    }

    const evidence = runPhase9AuditBreakGlassAssuranceRedactionSuite();
    expect(evidence.wormAudit.chainContinuous).toBe(true);
    expect(evidence.wormAudit.tamperDetection).toBe(true);
    expect(evidence.wormAudit.ledgerAppendCount).toBe(4);
  });

  it("orders investigation timelines deterministically by time, sequence, and ledger entry", () => {
    const fixture = createPhase9InvestigationTimelineFixture();
    const rows = fixture.baselineResult.timelineReconstruction.rows;

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.actionType)).toEqual([
      "request.opened",
      "ui.success.visible",
      "artifact.previewed",
    ]);

    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1]!;
      const current = rows[index]!;
      expect(
        previous.eventTime.localeCompare(current.eventTime) <= 0 &&
          (previous.eventTime !== current.eventTime ||
            previous.sourceSequenceRef.localeCompare(current.sourceSequenceRef) <= 0) &&
          (previous.eventTime !== current.eventTime ||
            previous.sourceSequenceRef !== current.sourceSequenceRef ||
            previous.assuranceLedgerEntryId.localeCompare(current.assuranceLedgerEntryId) <= 0),
      ).toBe(true);
    }

    const tampered = hashAssurancePayload(
      { ...rows[0], actionType: "request.opened.tampered" },
      "phase9.466.timeline-row-tamper",
    );
    const original = hashAssurancePayload(rows[0], "phase9.466.timeline-row-tamper");
    expect(tampered).not.toBe(original);
  });

  it("proves AccessEventIndex pivots always rejoin the scoped WORM timeline", () => {
    const fixture = buildPhase9AuditAssuranceSyntheticCases();
    const auditRecordRefs = new Set(fixture.investigationFixture.auditRecordRefs);

    expect(fixture.searchPivotCases.map((pivotCase) => pivotCase.pivot).sort()).toEqual([
      "actor",
      "appointment",
      "patient",
      "pharmacy_case",
      "request",
      "task",
    ]);
    for (const pivotCase of fixture.searchPivotCases) {
      expect(pivotCase.indexAuthority).toBe("AccessEventIndex");
      expect(pivotCase.truthAuthority).toContain("InvestigationScopeEnvelope");
      expect(pivotCase.pivotsToWormTimeline).toBe(true);
      expect(pivotCase.indexOnlyAllowed).toBe(false);
      expect(
        pivotCase.expectedRecordRefs.every((recordRef) => auditRecordRefs.has(recordRef)),
      ).toBe(true);
    }
  });

  it("blocks missing or expired break-glass reviews and preserves replay restore settlement", () => {
    const fixture = createPhase9InvestigationTimelineFixture();
    const evidence = runPhase9AuditBreakGlassAssuranceRedactionSuite();

    expect(fixture.breakGlassAbsentResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.breakGlassAbsentResult.auditQuerySession.blockingRefs).toContain(
      "break-glass:required-absent",
    );
    expect(fixture.breakGlassExpiredResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.breakGlassExpiredResult.auditQuerySession.blockingRefs).toContain(
      "break-glass:expired-or-inadequate",
    );
    expect(fixture.supportReplaySession.restoreSettlementRef).toMatch(/^support-replay-restore:/);
    expect(fixture.supportReplaySession.uiTelemetryDisclosureFenceRef).toBe(
      "ui-disclosure-fence:439",
    );
    expect(evidence.supportReplay.replayExitGapClosed).toBe(true);
  });
});
