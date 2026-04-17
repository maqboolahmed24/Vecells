import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RequestAggregate,
  RequestBackboneInvariantError,
  SubmissionEnvelopeAggregate,
} from "../src/index.ts";

const suiteResults = JSON.parse(
  fs.readFileSync(new URL("../../../data/test/transition_suite_results.json", import.meta.url), "utf8"),
);

const workflowStates = [
  "submitted",
  "intake_normalized",
  "triage_ready",
  "triage_active",
  "handoff_active",
  "outcome_recorded",
  "closed",
] as const;

function createBaseRequest() {
  return RequestAggregate.create({
    requestId: "req_seq133_001",
    episodeId: "episode_seq133_001",
    originEnvelopeRef: "env_seq133_001",
    promotionRecordRef: "promotion_seq133_001",
    tenantId: "tenant_seq133",
    sourceChannel: "self_service_form",
    originIngressRecordRef: "ingress_seq133_001",
    normalizedSubmissionRef: "normalized_seq133_001",
    requestType: "clinical_question",
    requestLineageRef: "lineage_seq133_001",
    createdAt: "2026-04-14T10:00:00Z",
  });
}

function createRequestAtWorkflowState(targetState: (typeof workflowStates)[number]) {
  const request = createBaseRequest();
  const sequence: Record<(typeof workflowStates)[number], (typeof workflowStates)[number][]> = {
    submitted: [],
    intake_normalized: ["intake_normalized"],
    triage_ready: ["intake_normalized", "triage_ready"],
    triage_active: ["intake_normalized", "triage_ready", "triage_active"],
    handoff_active: ["intake_normalized", "triage_ready", "triage_active", "handoff_active"],
    outcome_recorded: ["intake_normalized", "triage_ready", "triage_active", "outcome_recorded"],
    closed: ["intake_normalized", "triage_ready", "triage_active", "outcome_recorded", "closed"],
  };

  let current = request;
  sequence[targetState].forEach((state, index) => {
    current = current.advanceWorkflow({
      nextState: state,
      updatedAt: `2026-04-14T10:0${index + 1}:00Z`,
    });
  });
  return current;
}

describe("seq_133 domain transition compatibility", () => {
  it("publishes allowed and forbidden coverage for every required canonical axis", () => {
    const coverage = suiteResults.transitionCoverage;
    const requiredCanonicals = [
      "SubmissionEnvelope.state",
      "Request.workflowState",
      "Request.safetyState",
      "Request.identityState",
      "DuplicateCluster.reviewStatus",
      "FallbackReviewCase.patientVisibleState",
      "RequestClosureRecord.decision",
      "IdentityBinding.bindingState",
    ];

    expect(coverage.map((row: { canonicalName: string }) => row.canonicalName)).toEqual(
      requiredCanonicals,
    );
    coverage.forEach((row: { allowedRowCount: number; forbiddenRowCount: number }) => {
      expect(row.allowedRowCount).toBeGreaterThan(0);
      expect(row.forbiddenRowCount).toBeGreaterThan(0);
    });
  });

  it("accepts only published workflow transitions and rejects every other target state", () => {
    const workflowRows = suiteResults.transitionRows.filter(
      (row: { canonicalName: string }) => row.canonicalName === "Request.workflowState",
    );
    const allowedByFrom = new Map<string, Set<string>>();

    workflowRows
      .filter((row: { transitionVerdict: string }) => row.transitionVerdict === "allowed")
      .forEach((row: { fromState: string; toState: string }) => {
        if (!allowedByFrom.has(row.fromState)) {
          allowedByFrom.set(row.fromState, new Set());
        }
        allowedByFrom.get(row.fromState)?.add(row.toState);
      });

    workflowStates.forEach((fromState) => {
      workflowStates.forEach((toState) => {
        if (fromState === toState) {
          return;
        }
        const request = createRequestAtWorkflowState(fromState);
        const isAllowed = allowedByFrom.get(fromState)?.has(toState) ?? false;
        if (isAllowed) {
          expect(
            request.advanceWorkflow({
              nextState: toState,
              updatedAt: "2026-04-14T10:30:00Z",
            }).workflowState,
          ).toBe(toState);
        } else {
          expect(() =>
            request.advanceWorkflow({
              nextState: toState,
              updatedAt: "2026-04-14T10:30:00Z",
            }),
          ).toThrow(RequestBackboneInvariantError);
        }
      });
    });
  });

  it("enforces submission promotion preconditions and replay safety", () => {
    const bareEnvelope = SubmissionEnvelopeAggregate.create({
      envelopeId: "env_seq133_promotion",
      sourceChannel: "self_service_form",
      initialSurfaceChannelProfile: "browser",
      intakeConvergenceContractRef: "icc_seq133",
      sourceLineageRef: "src_lineage_seq133",
      createdAt: "2026-04-14T11:00:00Z",
    });

    expect(() =>
      bareEnvelope.markReadyToPromote({
        promotionDecisionRef: "promotion_decision_missing",
        updatedAt: "2026-04-14T11:01:00Z",
      }),
    ).toThrow(RequestBackboneInvariantError);

    const readyEnvelope = bareEnvelope
      .appendIngress({
        ingressRecordRef: "ingress_seq133_ready",
        updatedAt: "2026-04-14T11:02:00Z",
      })
      .recordEvidenceSnapshot({
        evidenceSnapshotRef: "snapshot_seq133_ready",
        updatedAt: "2026-04-14T11:03:00Z",
      })
      .recordNormalizedSubmission({
        normalizedSubmissionRef: "normalized_seq133_ready",
        updatedAt: "2026-04-14T11:04:00Z",
      })
      .markReadyToPromote({
        promotionDecisionRef: "promotion_decision_seq133",
        updatedAt: "2026-04-14T11:05:00Z",
      });

    expect(() =>
      bareEnvelope.promote({
        promotionRecordRef: "promotion_seq133_forbidden",
        promotedRequestRef: "request_seq133_forbidden",
        updatedAt: "2026-04-14T11:06:00Z",
      }),
    ).toThrow(RequestBackboneInvariantError);

    const promoted = readyEnvelope.promote({
      promotionRecordRef: "promotion_seq133_ok",
      promotedRequestRef: "request_seq133_ok",
      updatedAt: "2026-04-14T11:07:00Z",
    });

    const replay = promoted.promote({
      promotionRecordRef: "promotion_seq133_ok",
      promotedRequestRef: "request_seq133_ok",
      updatedAt: "2026-04-14T11:08:00Z",
    });

    expect(replay.toSnapshot().promotedRequestRef).toBe("request_seq133_ok");
    try {
      promoted.promote({
        promotionRecordRef: "promotion_seq133_ok",
        promotedRequestRef: "request_seq133_drift",
        updatedAt: "2026-04-14T11:09:00Z",
      });
      throw new Error("Expected promotion replay mismatch to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestBackboneInvariantError);
      expect((error as RequestBackboneInvariantError).code).toBe(
        "ENVELOPE_PROMOTION_REPLAY_MISMATCH",
      );
    }
  });

  it("keeps safety and identity axes orthogonal to blocker semantics", () => {
    const scopedRows = suiteResults.transitionRows.filter((row: { canonicalName: string }) =>
      ["Request.safetyState", "Request.identityState"].includes(row.canonicalName),
    );
    const stateTerms = new Set<string>();
    scopedRows.forEach((row: { fromState: string; toState: string }) => {
      stateTerms.add(row.fromState);
      stateTerms.add(row.toState);
    });
    expect([...stateTerms]).not.toEqual(
      expect.arrayContaining(["confirmation_pending", "identity_hold", "review_required"]),
    );
  });
});
