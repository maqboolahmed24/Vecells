import { describe, expect, it } from "vitest";
import {
  createAssistiveSuggestionOrchestratorPlane,
  type CreateSuggestionEnvelopeCommand,
  type SuggestionActorContext,
  type SuggestionActorRole,
} from "../../packages/domains/assistive_suggestion/src/index.ts";

const fixedClock = { now: () => "2026-04-27T19:00:00.000Z" };

function actor(actorRole: SuggestionActorRole): SuggestionActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_suggestion_prediction_test",
    routeIntentBindingRef: "route-intent:suggestion-orchestrator",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("409 suggestion envelope and prediction set", () => {
  it("keeps full-space calibrated probabilities before rule masking", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(
      envelopeCommand({
        endpointScores: [
          score("endpoint:routine_triage", 0.55, 0.12, 0.9),
          score("endpoint:urgent_escalation", 0.3, 0.2, 0.9),
          score("endpoint:booking", 0.1, 0.8, 0.8),
          score("endpoint:pharmacy", 0.05, 0.8, 0.8),
        ],
        ruleGuard: {
          blockedEndpointCodes: ["endpoint:urgent_escalation"],
          conflictFlags: ["urgent_path_requires_manual_review"],
        },
      }),
      actor("bounded_suggestion_orchestrator"),
    );

    const hypotheses = envelope.endpointHypotheses.map((ref) => plane.store.endpointHypotheses.get(ref));
    const urgent = hypotheses.find((hypothesis) => hypothesis?.endpointCode === "endpoint:urgent_escalation");
    const routine = hypotheses.find((hypothesis) => hypothesis?.endpointCode === "endpoint:routine_triage");

    expect(envelope.allowedSetMass).toBeCloseTo(0.7);
    expect(envelope.abstentionState).toBe("review_only");
    expect(envelope.topHypothesisRef).toBeUndefined();
    expect(urgent?.posteriorProbability).toBe(0.3);
    expect(urgent?.predictionSetState).toBe("blocked_by_guard");
    expect(routine?.allowedConditionalProbability).toBeCloseTo(0.55 / 0.7);
  });

  it("requires every endpoint in the fixed full hypothesis space", () => {
    const plane = createReadyPlane();

    expect(() =>
      plane.envelopes.createSuggestionEnvelope(
        envelopeCommand({
          endpointScores: [score("endpoint:routine_triage", 0.8, 0.1, 0.9), score("endpoint:booking", 0.2, 0.8, 0.8)],
        }),
        actor("bounded_suggestion_orchestrator"),
      ),
    ).toThrow(/full hypothesis space/i);
  });

  it("sets one top hypothesis and arms insert only when the conformal visible set is a singleton", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(envelopeCommand(), actor("bounded_suggestion_orchestrator"));
    const top = envelope.topHypothesisRef ? plane.store.endpointHypotheses.get(envelope.topHypothesisRef) : undefined;

    expect(envelope.abstentionState).toBe("none");
    expect(envelope.oneClickInsertState).toBe("armed");
    expect(top?.endpointCode).toBe("endpoint:routine_triage");
    expect(top?.insertEligible).toBe(true);
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
