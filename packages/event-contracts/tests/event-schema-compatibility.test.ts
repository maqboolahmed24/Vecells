import crypto from "node:crypto";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalEventContracts } from "../src/index.ts";

const suiteResults = JSON.parse(
  fs.readFileSync(new URL("../../../data/test/transition_suite_results.json", import.meta.url), "utf8"),
);

function replayJoinFingerprint(input: {
  eventName: string;
  edgeCorrelationId: string;
  causalToken: string;
  governingAggregateRef: string;
  governingLineageRef: string;
}) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

describe("seq_133 event schema compatibility", () => {
  it("covers the required published contracts and bounded seam gaps", () => {
    const publishedRows = suiteResults.schemaRows.filter(
      (row: { rowKind: string }) => row.rowKind === "published_contract",
    );
    const gapRows = suiteResults.schemaRows.filter(
      (row: { rowKind: string }) => row.rowKind === "gap_transition_or_schema",
    );

    expect(publishedRows.map((row: { eventName: string }) => row.eventName)).toEqual(
      expect.arrayContaining([
        "request.workflow.changed",
        "request.safety.changed",
        "request.identity.changed",
        "request.closure_blockers.changed",
        "request.duplicate.review_required",
        "exception.review_case.opened",
        "identity.repair_case.freeze_committed",
        "identity.repair_release.settled",
        "confirmation.gate.created",
        "intake.promotion.settled",
      ]),
    );
    expect(gapRows.map((row: { eventName: string }) => row.eventName)).toEqual(
      expect.arrayContaining([
        "intake.promotion.started",
        "intake.promotion.committed",
        "intake.promotion.replay_returned",
        "request.lineage.branched",
        "request.lineage.case_link.changed",
      ]),
    );
  });

  it("requires canonical envelope fields, privacy guards, and replay joins on published rows", () => {
    const publishedRows = suiteResults.schemaRows.filter(
      (row: { rowKind: string }) => row.rowKind === "published_contract",
    );
    expect(publishedRows.length).toBeGreaterThan(20);

    publishedRows.forEach(
      (row: {
        envelopeRequiredFieldsPresent: string;
        privacySafePayload: string;
        edgeCorrelationRequired: string;
        causalTokenRequired: string;
        governingJoinRequired: string;
        rawAggregateInternalDependencyState: string;
        replayDeterminismState: string;
      }) => {
        expect(row.envelopeRequiredFieldsPresent).toBe("yes");
        expect(row.privacySafePayload).toBe("yes");
        expect(row.edgeCorrelationRequired).toBe("yes");
        expect(row.causalTokenRequired).toBe("yes");
        expect(row.governingJoinRequired).toBe("yes");
        expect(row.rawAggregateInternalDependencyState).toBe("forbidden_by_schema");
        expect(row.replayDeterminismState.startsWith("covered")).toBe(true);
      },
    );
  });

  it("normalizes legacy aliases before canonical ingestion", () => {
    const contractIds = new Set(
      canonicalEventContracts.map(
        (contract: { canonicalEventContractId: string }) => contract.canonicalEventContractId,
      ),
    );
    const aliasCases = suiteResults.aliasCases;

    expect(aliasCases.length).toBeGreaterThan(10);
    aliasCases.forEach(
      (row: {
        targetCanonicalEventContractRef: string;
        targetCanonicalEventName: string;
        compatibilityExpectation: string;
      }) => {
        expect(contractIds.has(row.targetCanonicalEventContractRef)).toBe(true);
        expect(row.targetCanonicalEventName).toBeTruthy();
        expect(row.compatibilityExpectation).toBe("normalize_before_ingestion");
      },
    );
    expect(
      aliasCases.some(
        (row: { sourceAliasEventName: string; targetCanonicalEventName: string }) =>
          row.sourceAliasEventName.startsWith("fallback.review_case.") &&
          row.targetCanonicalEventName.startsWith("exception.review_case."),
      ),
    ).toBe(true);
  });

  it("keeps replay fingerprints deterministic for canonical event joins", () => {
    const fingerprintBase = replayJoinFingerprint({
      eventName: "request.workflow.changed",
      edgeCorrelationId: "corr_seq133_001",
      causalToken: "causal_seq133_001",
      governingAggregateRef: "request_seq133_001",
      governingLineageRef: "lineage_seq133_001",
    });
    const fingerprintReplay = replayJoinFingerprint({
      eventName: "request.workflow.changed",
      edgeCorrelationId: "corr_seq133_001",
      causalToken: "causal_seq133_001",
      governingAggregateRef: "request_seq133_001",
      governingLineageRef: "lineage_seq133_001",
    });
    const fingerprintChangedCorrelation = replayJoinFingerprint({
      eventName: "request.workflow.changed",
      edgeCorrelationId: "corr_seq133_002",
      causalToken: "causal_seq133_001",
      governingAggregateRef: "request_seq133_001",
      governingLineageRef: "lineage_seq133_001",
    });
    const fingerprintChangedCausalToken = replayJoinFingerprint({
      eventName: "request.workflow.changed",
      edgeCorrelationId: "corr_seq133_001",
      causalToken: "causal_seq133_002",
      governingAggregateRef: "request_seq133_001",
      governingLineageRef: "lineage_seq133_001",
    });
    const fingerprintChangedJoin = replayJoinFingerprint({
      eventName: "request.workflow.changed",
      edgeCorrelationId: "corr_seq133_001",
      causalToken: "causal_seq133_001",
      governingAggregateRef: "request_seq133_002",
      governingLineageRef: "lineage_seq133_001",
    });

    expect(fingerprintReplay).toBe(fingerprintBase);
    expect(fingerprintChangedCorrelation).not.toBe(fingerprintBase);
    expect(fingerprintChangedCausalToken).not.toBe(fingerprintBase);
    expect(fingerprintChangedJoin).not.toBe(fingerprintBase);
  });
});
