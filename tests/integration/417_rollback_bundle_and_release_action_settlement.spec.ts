import { describe, expect, it } from "vitest";
import { createAssistiveAssurancePlane } from "../../packages/domains/assistive_assurance/src/index.ts";
import {
  assuranceActor,
  completeSignoffs,
  fixedAssuranceClock,
  materialChangeCommand,
} from "./417_test_helpers.ts";

describe("417 rollback bundle and release action settlement", () => {
  it("blocks promotion when rollback proof is incomplete and settles once exact evidence is ready", () => {
    const plane = createAssistiveAssurancePlane({ clock: fixedAssuranceClock });
    const assessment = plane.changeImpact.assessChangeImpact(
      materialChangeCommand(),
      assuranceActor("change_impact_assessor"),
    );
    const graph = plane.approvalGraph.buildApprovalGraph(
      {
        changeRequestId: assessment.changeRequestId,
        releaseCandidateRef: assessment.releaseCandidateRef,
        releaseCandidateHash: assessment.releaseCandidateHash,
        impactAssessmentRef: assessment.impactAssessmentId,
        requesterActorRef: "user:requester",
        signoffRefs: completeSignoffs(),
      },
      assuranceActor("release_manager"),
    );
    const baseline = plane.baseline.pinBaselineSnapshot(
      {
        releaseCandidateRef: assessment.releaseCandidateRef,
        releaseCandidateHash: assessment.releaseCandidateHash,
        im1GuidanceVersionRef: "im1-guidance:2026-04-23",
        dtacVersionRef: "dtac:2026-02",
        dcbStandardVersionRef: "dcb0129-dcb0160:2025-review",
        dpiaRef: "dpia:doc-draft:v2",
        scalVersionRef: "scal:doc-draft:v2",
        medicalDeviceAssessmentRef: "medical-device-assessment:doc-draft:v2",
        evaluationDatasetRef: "evaluation-dataset:gold:v2",
        replayHarnessVersionRef: "replay-harness:v2",
        disclosureBaselineRef: "ui-disclosure:assistive:v2",
        safetyCaseDeltaRef: "safety-case-delta:doc-draft:v2",
        freshUntil: "2026-05-28T00:00:00.000Z",
      },
      assuranceActor("assurance_baseline_owner"),
    );
    const incompleteRollback = plane.rollback.assembleRollbackReadinessBundle(
      {
        releaseCandidateRef: assessment.releaseCandidateRef,
        releaseCandidateHash: assessment.releaseCandidateHash,
        rollbackTargetRef: "assistive-release-candidate:doc-draft:v1",
        dataCompatibilityState: "compatible",
        policyCompatibilityState: "compatible",
        runtimePublicationParityState: "missing",
        killSwitchPlanRef: "kill-switch:doc-draft:v2",
        operatorRunbookRef: "runbook:rollback-doc-draft:v2",
        verificationEvidenceRefs: [],
        releaseRecoveryDispositionRef: "release-recovery:assistive:v2",
      },
      assuranceActor("rollback_owner"),
    );

    const blockedAction = plane.releaseAction.createReleaseAction(
      {
        releaseCandidateRef: assessment.releaseCandidateRef,
        releaseCandidateHash: assessment.releaseCandidateHash,
        baselineSnapshotRef: baseline.baselineSnapshotId,
        baselineSnapshotHash: baseline.baselineHash,
        rollbackBundleRef: incompleteRollback.rollbackBundleId,
        rollbackBundleHash: incompleteRollback.bundleHash,
        approvalGraphRef: graph.approvalGraphId,
        rolloutSliceContractRef: "rollout-slice:staff-pilot",
        rolloutVerdictRef: "rollout-verdict:staff-pilot",
        actionType: "promote",
        routeIntentBindingRef: "route-intent:assistive-release",
        commandActionRecordRef: "command-action:promote",
        surfaceRouteContractRef: "surface-route:staff-workspace",
        surfacePublicationRef: "surface-publication:staff-workspace:v2",
        runtimePublicationBundleRef: "runtime-publication:phase8:v2",
        uiTelemetryDisclosureBaselineRef: baseline.disclosureBaselineRef,
        transitionEnvelopeRef: "transition-envelope:promote",
        releaseRecoveryDispositionRef: "release-recovery:assistive:v2",
      },
      assuranceActor("release_manager"),
    );
    const blockedSettlement = plane.releaseAction.settleReleaseAction(
      {
        assistiveReleaseActionRecordRef: blockedAction.assistiveReleaseActionRecordId,
        commandSettlementRecordRef: "command-settlement:promote-blocked",
        uiTransitionSettlementRecordRef: "ui-transition:settlement-blocked",
        uiTelemetryDisclosureFenceRef: "ui-disclosure-fence:promote",
        presentationArtifactRef: "presentation-artifact:promote-blocked",
        recoveryActionRef: "recovery-action:complete-rollback-proof",
      },
      assuranceActor("release_manager"),
    );

    expect(blockedSettlement.result).toBe("blocked_policy");
    expect(blockedSettlement.blockingReasonCodes).toContain("rollback_bundle_not_ready");

    const readyRollback = plane.rollback.assembleRollbackReadinessBundle(
      {
        releaseCandidateRef: assessment.releaseCandidateRef,
        releaseCandidateHash: assessment.releaseCandidateHash,
        rollbackTargetRef: "assistive-release-candidate:doc-draft:v1",
        dataCompatibilityState: "compatible",
        policyCompatibilityState: "compatible",
        runtimePublicationParityState: "exact",
        killSwitchPlanRef: "kill-switch:doc-draft:v2",
        operatorRunbookRef: "runbook:rollback-doc-draft:v2",
        verificationEvidenceRefs: ["rollback-rehearsal:doc-draft:v2"],
        releaseRecoveryDispositionRef: "release-recovery:assistive:v2",
      },
      assuranceActor("rollback_owner"),
    );
    const promoteAction = plane.releaseAction.createReleaseAction(
      {
        releaseCandidateRef: assessment.releaseCandidateRef,
        releaseCandidateHash: assessment.releaseCandidateHash,
        baselineSnapshotRef: baseline.baselineSnapshotId,
        baselineSnapshotHash: baseline.baselineHash,
        rollbackBundleRef: readyRollback.rollbackBundleId,
        rollbackBundleHash: readyRollback.bundleHash,
        approvalGraphRef: graph.approvalGraphId,
        rolloutSliceContractRef: "rollout-slice:staff-pilot",
        rolloutVerdictRef: "rollout-verdict:staff-pilot",
        actionType: "promote",
        routeIntentBindingRef: "route-intent:assistive-release",
        commandActionRecordRef: "command-action:promote-ready",
        surfaceRouteContractRef: "surface-route:staff-workspace",
        surfacePublicationRef: "surface-publication:staff-workspace:v2",
        runtimePublicationBundleRef: "runtime-publication:phase8:v2",
        uiTelemetryDisclosureBaselineRef: baseline.disclosureBaselineRef,
        transitionEnvelopeRef: "transition-envelope:promote",
        releaseRecoveryDispositionRef: "release-recovery:assistive:v2",
      },
      assuranceActor("release_manager"),
    );
    const promoted = plane.releaseAction.settleReleaseAction(
      {
        assistiveReleaseActionRecordRef: promoteAction.assistiveReleaseActionRecordId,
        commandSettlementRecordRef: "command-settlement:promote-ready",
        uiTransitionSettlementRecordRef: "ui-transition:settlement-ready",
        uiTelemetryDisclosureFenceRef: "ui-disclosure-fence:promote",
        presentationArtifactRef: "presentation-artifact:promote-ready",
        recoveryActionRef: "recovery-action:none",
      },
      assuranceActor("release_manager"),
    );

    expect(promoted.result).toBe("promoted");
    expect(promoted.blockingReasonCodes).toEqual([]);
  });
});
