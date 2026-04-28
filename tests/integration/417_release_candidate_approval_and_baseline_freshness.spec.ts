import { describe, expect, it } from "vitest";
import { createAssistiveAssurancePlane } from "../../packages/domains/assistive_assurance/src/index.ts";
import {
  assuranceActor,
  completeSignoffs,
  fixedAssuranceClock,
  materialChangeCommand,
} from "./417_test_helpers.ts";

describe("417 release candidate approval and baseline freshness", () => {
  it("blocks promotion-facing approval when a requester self-approves", () => {
    const plane = createAssistiveAssurancePlane({ clock: fixedAssuranceClock });
    const assessment = plane.changeImpact.assessChangeImpact(
      materialChangeCommand(),
      assuranceActor("change_impact_assessor", "user:requester"),
    );

    const graph = plane.approvalGraph.buildApprovalGraph(
      {
        changeRequestId: assessment.changeRequestId,
        releaseCandidateRef: assessment.releaseCandidateRef,
        releaseCandidateHash: assessment.releaseCandidateHash,
        impactAssessmentRef: assessment.impactAssessmentId,
        requesterActorRef: "user:requester",
        signoffRefs: [
          ...completeSignoffs(),
          {
            role: "product_owner",
            actorRef: "user:requester",
            evidenceRef: "signoff:self",
            signedAt: fixedAssuranceClock.now(),
          },
        ],
      },
      assuranceActor("release_manager"),
    );

    expect(graph.currentApprovalState).toBe("blocked");
    expect(graph.blockingReasonCodes).toContain("self_approval_forbidden");
  });

  it("freezes the candidate when a supplier assurance baseline drifts", () => {
    const plane = createAssistiveAssurancePlane({ clock: fixedAssuranceClock });
    plane.baseline.registerSubprocessorAssurance(
      {
        subprocessorRefId: "subprocessor:llm-host",
        supplierName: "Example LLM Host",
        suppliedModelOrServiceRefs: ["model:doc-draft:v2"],
        safetyEvidenceRef: "supplier-safety:llm-host:v1",
        dpiaRef: "dpia:llm-host:v1",
        contractualControlRef: "contract-control:llm-host:v1",
        assuranceVersion: "v1",
        assuranceFreshUntil: "2026-05-28T00:00:00.000Z",
        driftState: "drifted",
        suspensionState: "active",
      },
      assuranceActor("assurance_baseline_owner"),
    );

    const baseline = plane.baseline.pinBaselineSnapshot(
      {
        releaseCandidateRef: "assistive-release-candidate:doc-draft-v2",
        releaseCandidateHash: "candidate-hash:doc-draft-v2",
        im1GuidanceVersionRef: "im1-guidance:2026-04-23",
        dtacVersionRef: "dtac:2026-02",
        dcbStandardVersionRef: "dcb0129-dcb0160:2025-review",
        dpiaRef: "dpia:doc-draft:v2",
        scalVersionRef: "scal:doc-draft:v2",
        medicalDeviceAssessmentRef: "medical-device-assessment:doc-draft:v2",
        evaluationDatasetRef: "evaluation-dataset:gold:v2",
        replayHarnessVersionRef: "replay-harness:v2",
        supplierAssuranceRefs: ["subprocessor:llm-host"],
        disclosureBaselineRef: "ui-disclosure:assistive:v2",
        safetyCaseDeltaRef: "safety-case-delta:doc-draft:v2",
        freshUntil: "2026-05-28T00:00:00.000Z",
      },
      assuranceActor("assurance_baseline_owner"),
    );

    const freeze = plane.assuranceFreeze.evaluateAssuranceFreeze(
      {
        scopeRef: "scope:staff-pilot",
        releaseCandidateRef: baseline.releaseCandidateRef,
        releaseCandidateHash: baseline.releaseCandidateHash,
        baselineSnapshotRef: baseline.baselineSnapshotId,
        supplierAssuranceRefs: ["subprocessor:llm-host"],
        triggerRef: "supplier-drift:llm-host",
        activatedBy: "system:assurance-watch",
      },
      assuranceActor("system"),
    );

    expect(baseline.baselineState).toBe("stale");
    expect(freeze.freezeState).toBe("frozen");
    expect(freeze.blockingReasonCodes).toEqual(
      expect.arrayContaining(["supplier_assurance_drifted:subprocessor:llm-host"]),
    );
  });
});
