import { describe, expect, it } from "vitest";
import {
  createAssistiveSuggestionOrchestratorPlane,
  type CreateSuggestionEnvelopeCommand,
  type SuggestionActorContext,
  type SuggestionActorRole,
} from "../../packages/domains/assistive_suggestion/src/index.ts";

const fixedClock = { now: () => "2026-04-27T20:00:00.000Z" };

function actor(actorRole: SuggestionActorRole): SuggestionActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_suggestion_action_test",
    routeIntentBindingRef: "route-intent:suggestion-orchestrator",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("409 insert draft settlement and recovery", () => {
  it("settles one-click insert as a draft action and consumes the lease", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(envelopeCommand(), actor("bounded_suggestion_orchestrator"));
    const lease = plane.actions.issueDraftInsertionLease(
      {
        assistiveSessionRef: "assistive-session:001",
        suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
        selectedAnchorRef: "selected-anchor:001",
        decisionDockRef: "decision-dock:001",
        draftInsertionPointRef: "draft-insertion-point:endpoint:001",
        slotHash: "slot-hash:endpoint:001",
        expiresAt: "2026-04-27T20:10:00.000Z",
      },
      actor("clinical_reviewer"),
    );
    const action = plane.actions.submitAction(
      {
        assistiveSessionRef: "assistive-session:001",
        suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
        suggestionDraftInsertionLeaseRef: lease.suggestionDraftInsertionLeaseId,
        assistiveArtifactActionRecordRef: "assistive-artifact-action:001",
        actionType: "insert_draft",
        decisionDockRef: "decision-dock:001",
        selectedAnchorRef: "selected-anchor:001",
        allowedSuggestionSetHash: envelope.allowedSuggestionSetHash,
        submittedBy: "clinician:001",
        commandActionRecordRef: "command-action:001",
      },
      actor("clinical_reviewer"),
    );
    const settlement = plane.actions.settleAction(
      {
        suggestionActionRecordRef: action.suggestionActionRecordId,
        commandSettlementRecordRef: "command-settlement:001",
        transitionEnvelopeRef: "transition-envelope:001",
        requestedResult: "draft_inserted",
        releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
      },
      actor("bounded_suggestion_orchestrator"),
    );

    expect(settlement.result).toBe("draft_inserted");
    expect(plane.store.insertionLeases.get(lease.suggestionDraftInsertionLeaseId)?.leaseState).toBe("consumed");
    expect(plane.store.actionSettlements.size).toBe(1);
  });

  it("fails stale or mismatched allowed-set submissions before settlement", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(envelopeCommand(), actor("bounded_suggestion_orchestrator"));

    expect(() =>
      plane.actions.submitAction(
        {
          assistiveSessionRef: "assistive-session:001",
          suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
          assistiveArtifactActionRecordRef: "assistive-artifact-action:001",
          actionType: "dismiss",
          decisionDockRef: "decision-dock:001",
          selectedAnchorRef: "selected-anchor:001",
          allowedSuggestionSetHash: "stale-hash",
          submittedBy: "clinician:001",
          commandActionRecordRef: "command-action:001",
        },
        actor("clinical_reviewer"),
      ),
    ).toThrow(/allowed-set hash/i);
  });

  it("downgrades settlement when the envelope is invalidated before insert settles", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(envelopeCommand(), actor("bounded_suggestion_orchestrator"));
    const lease = plane.actions.issueDraftInsertionLease(
      {
        assistiveSessionRef: "assistive-session:001",
        suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
        selectedAnchorRef: "selected-anchor:001",
        decisionDockRef: "decision-dock:001",
        draftInsertionPointRef: "draft-insertion-point:endpoint:001",
        slotHash: "slot-hash:endpoint:001",
        expiresAt: "2026-04-27T20:10:00.000Z",
      },
      actor("clinical_reviewer"),
    );
    const action = plane.actions.submitAction(
      {
        assistiveSessionRef: "assistive-session:001",
        suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
        suggestionDraftInsertionLeaseRef: lease.suggestionDraftInsertionLeaseId,
        assistiveArtifactActionRecordRef: "assistive-artifact-action:001",
        actionType: "insert_draft",
        decisionDockRef: "decision-dock:001",
        selectedAnchorRef: "selected-anchor:001",
        allowedSuggestionSetHash: envelope.allowedSuggestionSetHash,
        submittedBy: "clinician:001",
        commandActionRecordRef: "command-action:001",
      },
      actor("clinical_reviewer"),
    );
    plane.envelopes.invalidateEnvelope(envelope.suggestionEnvelopeId, actor("bounded_suggestion_orchestrator"));

    const settlement = plane.actions.settleAction(
      {
        suggestionActionRecordRef: action.suggestionActionRecordId,
        commandSettlementRecordRef: "command-settlement:001",
        transitionEnvelopeRef: "transition-envelope:001",
        requestedResult: "draft_inserted",
        releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
      },
      actor("bounded_suggestion_orchestrator"),
    );

    expect(settlement.result).toBe("stale_recoverable");
    expect(plane.store.insertionLeases.get(lease.suggestionDraftInsertionLeaseId)?.leaseState).toBe("stale");
  });

  it("blocks unsafe presentation handoff without outbound navigation grant", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(envelopeCommand(), actor("bounded_suggestion_orchestrator"));

    const artifact = plane.presentationArtifacts.createPresentationArtifact(
      {
        artifactType: "endpoint_explainer",
        suggestionEnvelopeRef: envelope.suggestionEnvelopeId,
        summaryRef: "suggestion-summary:endpoint:001",
        artifactPresentationContractRef: "artifact-presentation:suggestion:v1",
        maskingPolicyRef: "masking-policy:suggestion:v1",
        externalHandoffPolicyRef: "external-handoff:suggestion:v1",
        requestedArtifactState: "interactive_same_shell",
        rawArtifactUrl: "https://example.invalid/raw",
      },
      actor("artifact_presentation_worker"),
    );

    expect(artifact.artifactState).toBe("blocked");
    expect(artifact.blockingReasonCodes).toEqual(expect.arrayContaining(["raw_artifact_url_forbidden", "outbound_navigation_grant_required"]));
  });
});

function createReadyPlane() {
  const plane = createAssistiveSuggestionOrchestratorPlane({ clock: fixedClock });
  plane.calibrationBundles.registerCalibrationBundle(
    {
      calibrationBundleId: "suggestion-calibration:endpoint:v1",
      capabilityCode: "capability:endpoint_suggestion",
      releaseCohortRef: "release-cohort:phase8:rc1",
      watchTupleRef: "watch-tuple:phase8:rc1",
      calibrationVersion: "calibration:endpoint:v1",
      riskMatrixVersion: "risk-matrix:endpoint:v1",
      uncertaintySelectorVersionRef: "uncertainty-selector:endpoint:v1",
      conformalBundleRef: "conformal:endpoint:v1",
      thresholdSetRef: "threshold-set:endpoint:v1",
      validatedCalibrationState: "validated",
      validatedUncertaintySelectorState: "validated",
      validatedConformalState: "validated",
      fixedHypothesisSpace: ["endpoint:routine_triage", "endpoint:urgent_escalation", "endpoint:booking", "endpoint:pharmacy"],
      coverageTarget: 0.9,
      riskTarget: 0.05,
      nonconformityVersion: "nonconformity:endpoint:v1",
      qAlpha: 0.5,
      thresholds: {
        gammaFloor: 0.25,
        gammaVisible: 0.55,
        uBlock: 0.7,
        uVisible: 0.35,
        thetaVisible: 0.45,
        cVisible: 0.65,
        piInsert: 0.65,
        marginInsert: 0.2,
        disallowedMassFloor: 0.2,
        hMax: 1,
        buckets: [
          { descriptor: "strong", minScore: 0.85 },
          { descriptor: "supported", minScore: 0.7 },
          { descriptor: "guarded", minScore: 0.45 },
          { descriptor: "insufficient", minScore: 0 },
        ],
      },
      lossMatrix: lossMatrix(),
    },
    actor("calibration_release_manager"),
  );
  return plane;
}

function envelopeCommand(overrides: Partial<CreateSuggestionEnvelopeCommand> = {}): CreateSuggestionEnvelopeCommand {
  return {
    contextSnapshotId: "documentation-context:001",
    capabilityCode: "capability:endpoint_suggestion",
    priorityBandSuggestion: "routine",
    calibrationBundleRef: "suggestion-calibration:endpoint:v1",
    activeReleaseCohortRef: "release-cohort:phase8:rc1",
    activeWatchTupleRef: "watch-tuple:phase8:rc1",
    reviewVersionRef: "review-version:001",
    decisionEpochRef: "decision-epoch:001",
    policyBundleRef: "policy-bundle:phase8:001",
    lineageFenceEpoch: "lineage-fence:001",
    endpointScores: [
      score("endpoint:routine_triage", 0.75, 0.1, 0.9),
      score("endpoint:urgent_escalation", 0.05, 0.7, 0.7),
      score("endpoint:booking", 0.1, 0.8, 0.8),
      score("endpoint:pharmacy", 0.1, 0.8, 0.8),
    ],
    epistemicUncertainty: 0.12,
    surfaceBinding: {
      routeFamilyRef: "route-family:staff-workspace",
      assistiveSurfaceBindingRef: "assistive-surface-binding:endpoint:v1",
      staffWorkspaceConsistencyProjectionRef: "workspace-consistency:001",
      workspaceSliceTrustProjectionRef: "workspace-slice-trust:001",
      audienceSurfaceRouteContractRef: "audience-route:staff-workspace:v1",
      surfacePublicationRef: "surface-publication:staff-workspace:v1",
      runtimePublicationBundleRef: "runtime-publication:phase8:v1",
      releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
      placeholderContractRef: "placeholder:suggestion:v1",
    },
    ...overrides,
  };
}

function score(endpointCode: string, fullSpaceCalibratedProbability: number, nonconformityScore: number, coverage: number) {
  return {
    endpointCode,
    rawScore: fullSpaceCalibratedProbability * 10,
    fullSpaceCalibratedProbability,
    rationaleRef: `rationale:${endpointCode}`,
    supportingEvidenceRefs: [`evidence-span:${endpointCode}`],
    supportedEvidenceWeight: coverage,
    requiredEvidenceWeight: 1,
    nonconformityScore,
    severityRank: endpointCode === "endpoint:urgent_escalation" ? 4 : 1,
  };
}

function lossMatrix() {
  const endpoints = ["endpoint:routine_triage", "endpoint:urgent_escalation", "endpoint:booking", "endpoint:pharmacy"];
  return endpoints.flatMap((predictedEndpointCode) =>
    endpoints.map((trueEndpointCode) => ({
      predictedEndpointCode,
      trueEndpointCode,
      loss:
        predictedEndpointCode === trueEndpointCode
          ? 0
          : predictedEndpointCode === "endpoint:routine_triage" && trueEndpointCode === "endpoint:urgent_escalation"
            ? 1
            : predictedEndpointCode === "endpoint:urgent_escalation"
              ? 0.25
              : 0.4,
    })),
  );
}
