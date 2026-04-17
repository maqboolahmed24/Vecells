import { describe, expect, it } from "vitest";
import {
  emitIntakePromotionCommitted,
  emitIntakePromotionReplayReturned,
  emitIntakePromotionStarted,
  emitIntakePromotionSupersededGrantsApplied,
  emitIntakePromotionSettled,
  emitIntakeResumeContinuityUpdated,
  emitRequestSafetyClassified,
  emitRequestSafetyDecided,
  emitRequestSafetyPreempted,
  emitRequestSafetyUrgentDiversionRequired,
  emitRequestLineageBranched,
  emitRequestLineageCaseLinkChanged,
  submissionLineageCanonicalEventNames,
  submissionLineageParallelInterfaceGaps,
} from "../src/index.ts";

describe("submission-lineage event helpers", () => {
  it("publishes the canonical continuation and promotion events through the package root", () => {
    expect(submissionLineageCanonicalEventNames).toContain("intake.promotion.started");
    expect(submissionLineageCanonicalEventNames).toContain("intake.promotion.committed");
    expect(submissionLineageCanonicalEventNames).toContain("intake.promotion.settled");
    expect(submissionLineageCanonicalEventNames).toContain("intake.promotion.replay_returned");
    expect(submissionLineageCanonicalEventNames).toContain(
      "intake.promotion.superseded_grants_applied",
    );
    expect(submissionLineageCanonicalEventNames).toContain("intake.resume.continuity.updated");
    expect(submissionLineageCanonicalEventNames).toContain("request.safety.classified");
    expect(submissionLineageCanonicalEventNames).toContain("request.safety.preempted");
    expect(submissionLineageCanonicalEventNames).toContain("request.safety.decided");
    expect(submissionLineageCanonicalEventNames).toContain(
      "request.safety.urgent_diversion_required",
    );

    const startedEvent = emitIntakePromotionStarted({
      envelopeId: "env_001",
      sourceLineageRef: "source_lineage_001",
      receiptConsistencyKey: "receipt_key_001",
      statusConsistencyKey: "status_key_001",
    });
    const committedEvent = emitIntakePromotionCommitted({
      envelopeId: "env_001",
      promotionRecordId: "promotion_001",
      requestId: "request_001",
      requestLineageId: "lineage_001",
      receiptConsistencyKey: "receipt_key_001",
      statusConsistencyKey: "status_key_001",
    });
    const promotionEvent = emitIntakePromotionSettled({
      envelopeId: "env_001",
      promotionRecordId: "promotion_001",
      requestId: "request_001",
      requestLineageId: "lineage_001",
    });
    const replayEvent = emitIntakePromotionReplayReturned({
      envelopeId: "env_001",
      promotionRecordId: "promotion_001",
      requestId: "request_001",
      requestLineageId: "lineage_001",
      replayClass: "auth_return_replay",
      lookupField: "statusConsistencyKey",
    });
    const supersededEvent = emitIntakePromotionSupersededGrantsApplied({
      envelopeId: "env_001",
      promotionRecordId: "promotion_001",
      supersededAccessGrantRefs: ["grant_001"],
      supersededDraftLeaseRefs: ["lease_001"],
    });
    const continuityEvent = emitIntakeResumeContinuityUpdated({
      requestLineageId: "lineage_001",
      continuityWitnessClass: "workflow_return",
      continuityWitnessRef: "return_001",
    });
    const classifiedEvent = emitRequestSafetyClassified({
      requestId: "request_001",
      evidenceSnapshotRef: "snapshot_001",
      classificationDecisionRef: "classification_001",
      dominantEvidenceClass: "potentially_clinical",
      misclassificationRiskState: "ordinary",
    });
    const preemptedEvent = emitRequestSafetyPreempted({
      requestId: "request_001",
      preemptionRef: "preemption_001",
      openingSafetyEpoch: 1,
      status: "escalated_urgent",
      reasonCode: "PHASE1_SYNC_SAFETY_URGENT_REQUIRED",
    });
    const decidedEvent = emitRequestSafetyDecided({
      requestId: "request_001",
      safetyDecisionRef: "decision_001",
      requestedSafetyState: "urgent_diversion_required",
      decisionOutcome: "urgent_required",
      resultingSafetyEpoch: 1,
    });
    const urgentEvent = emitRequestSafetyUrgentDiversionRequired({
      requestId: "request_001",
      safetyDecisionRef: "decision_001",
      preemptionRef: "preemption_001",
      resultingSafetyEpoch: 1,
    });

    expect(startedEvent.eventType).toBe("intake.promotion.started");
    expect(committedEvent.eventType).toBe("intake.promotion.committed");
    expect(promotionEvent.eventType).toBe("intake.promotion.settled");
    expect(replayEvent.eventType).toBe("intake.promotion.replay_returned");
    expect(supersededEvent.eventType).toBe("intake.promotion.superseded_grants_applied");
    expect(continuityEvent.eventType).toBe("intake.resume.continuity.updated");
    expect(classifiedEvent.eventType).toBe("request.safety.classified");
    expect(preemptedEvent.eventType).toBe("request.safety.preempted");
    expect(decidedEvent.eventType).toBe("request.safety.decided");
    expect(urgentEvent.eventType).toBe("request.safety.urgent_diversion_required");
  });

  it("records bounded parallel interface gaps for branch and child-link seams", () => {
    expect(submissionLineageParallelInterfaceGaps).toHaveLength(2);
    expect(submissionLineageParallelInterfaceGaps[0]?.gapId).toBe(
      "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_BRANCHED_EVENT",
    );
    expect(submissionLineageParallelInterfaceGaps[1]?.gapId).toBe(
      "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_CASE_LINK_CHANGED_EVENT",
    );

    const branchEvent = emitRequestLineageBranched({
      requestLineageId: "lineage_branch",
      parentRequestLineageId: "lineage_parent",
      branchClass: "same_episode_branch",
      branchDecisionRef: "decision_001",
    });
    const linkEvent = emitRequestLineageCaseLinkChanged({
      requestLineageId: "lineage_parent",
      lineageCaseLinkId: "case_link_001",
      ownershipState: "active",
      caseFamily: "booking",
      returnToTriageRef: null,
    });

    expect(branchEvent.eventType).toBe("request.lineage.branched");
    expect(linkEvent.eventType).toBe("request.lineage.case_link.changed");
  });
});
