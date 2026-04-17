import { describe, expect, it } from "vitest";
import {
  LineageCaseLinkAggregate,
  RequestAggregate,
  RequestBackboneInvariantError,
  RequestLineageAggregate,
  SubmissionEnvelopeAggregate,
} from "../src/index";

describe("submission and lineage backbone aggregates", () => {
  it("keeps drafts on SubmissionEnvelope until governed promotion succeeds", () => {
    const envelope = SubmissionEnvelopeAggregate.create({
      envelopeId: "env_001",
      sourceChannel: "self_service_form",
      initialSurfaceChannelProfile: "browser",
      intakeConvergenceContractRef: "icc_001",
      sourceLineageRef: "src_lineage_001",
      createdAt: "2026-04-12T08:00:00Z",
    });

    const captured = envelope
      .appendIngress({
        ingressRecordRef: "ingress_001",
        updatedAt: "2026-04-12T08:05:00Z",
      })
      .recordEvidenceSnapshot({
        evidenceSnapshotRef: "snapshot_001",
        updatedAt: "2026-04-12T08:06:00Z",
      })
      .recordNormalizedSubmission({
        normalizedSubmissionRef: "normalized_001",
        updatedAt: "2026-04-12T08:07:00Z",
      });

    expect(captured.state).toBe("evidence_pending");
    expect(captured.toSnapshot().promotedRequestRef).toBeNull();

    const ready = captured.markReadyToPromote({
      promotionDecisionRef: "promotion_decision_001",
      updatedAt: "2026-04-12T08:08:00Z",
    });
    const promoted = ready.promote({
      promotionRecordRef: "promotion_001",
      promotedRequestRef: "request_001",
      updatedAt: "2026-04-12T08:09:00Z",
    });

    expect(promoted.state).toBe("promoted");
    expect(promoted.toSnapshot().promotionRecordRef).toBe("promotion_001");
  });

  it("rejects patient binding shorthand on Request without verified identity", () => {
    expect(() =>
      RequestAggregate.create({
        requestId: "req_001",
        episodeId: "episode_001",
        originEnvelopeRef: "env_001",
        promotionRecordRef: "promotion_001",
        tenantId: "tenant_001",
        sourceChannel: "self_service_form",
        originIngressRecordRef: "ingress_001",
        normalizedSubmissionRef: "normalized_001",
        requestType: "clinical_question",
        requestLineageRef: "lineage_001",
        createdAt: "2026-04-12T08:10:00Z",
        patientRef: "patient_001",
        identityState: "anonymous",
      }),
    ).toThrow(RequestBackboneInvariantError);
  });

  it("keeps workflow milestones orthogonal and transitions them explicitly", () => {
    const request = RequestAggregate.create({
      requestId: "req_002",
      episodeId: "episode_001",
      originEnvelopeRef: "env_001",
      promotionRecordRef: "promotion_001",
      tenantId: "tenant_001",
      sourceChannel: "self_service_form",
      originIngressRecordRef: "ingress_001",
      normalizedSubmissionRef: "normalized_001",
      requestType: "clinical_question",
      requestLineageRef: "lineage_001",
      createdAt: "2026-04-12T08:10:00Z",
    })
      .advanceWorkflow({
        nextState: "intake_normalized",
        updatedAt: "2026-04-12T08:11:00Z",
      })
      .advanceWorkflow({
        nextState: "triage_ready",
        updatedAt: "2026-04-12T08:12:00Z",
      });

    expect(request.workflowState).toBe("triage_ready");
    expect(request.toSnapshot().currentClosureBlockerRefs).toEqual([]);
  });

  it("reuses the same RequestLineage for same-request continuation and requires explicit branch decisions otherwise", () => {
    const primary = RequestLineageAggregate.create({
      requestLineageId: "lineage_primary",
      episodeRef: "episode_001",
      requestRef: "request_001",
      originEnvelopeRef: "env_001",
      submissionPromotionRecordRef: "promotion_001",
      continuityWitnessRef: "promotion_001",
      createdAt: "2026-04-12T08:10:00Z",
    });

    const continued = primary.recordContinuation({
      continuityWitnessClass: "workflow_return",
      continuityWitnessRef: "return_001",
      updatedAt: "2026-04-12T08:20:00Z",
    });

    const branched = RequestLineageAggregate.branch({
      requestLineageId: "lineage_branch",
      episodeRef: "episode_001",
      requestRef: "request_002",
      originEnvelopeRef: "env_001",
      submissionPromotionRecordRef: "promotion_001",
      branchClass: "same_episode_branch",
      branchDecisionRef: "branch_decision_001",
      continuityWitnessClass: "duplicate_resolution",
      continuityWitnessRef: "dup_resolution_001",
      createdAt: "2026-04-12T08:21:00Z",
    });

    expect(continued.requestLineageId).toBe("lineage_primary");
    expect(continued.toSnapshot().branchClass).toBe("same_request_continuation");
    expect(branched.toSnapshot().branchDecisionRef).toBe("branch_decision_001");
  });

  it("models child workflow ownership through LineageCaseLink without workflow shortcuts", () => {
    const link = LineageCaseLinkAggregate.propose({
      lineageCaseLinkId: "case_link_001",
      requestLineageRef: "lineage_primary",
      episodeRef: "episode_001",
      requestRef: "request_001",
      caseFamily: "booking",
      domainCaseRef: "booking_case_001",
      linkReason: "direct_handoff",
      openedAt: "2026-04-12T08:30:00Z",
    })
      .transition({
        nextState: "acknowledged",
        updatedAt: "2026-04-12T08:31:00Z",
      })
      .transition({
        nextState: "active",
        updatedAt: "2026-04-12T08:32:00Z",
        latestMilestoneRef: "booking_handoff_001",
      })
      .refreshOperationalFacts({
        currentClosureBlockerRefs: ["confirmation_gate_001"],
        currentConfirmationGateRefs: ["confirmation_gate_001"],
        updatedAt: "2026-04-12T08:33:00Z",
      });

    expect(link.ownershipState).toBe("active");
    expect(link.toSnapshot().currentConfirmationGateRefs).toEqual(["confirmation_gate_001"]);
  });
});
