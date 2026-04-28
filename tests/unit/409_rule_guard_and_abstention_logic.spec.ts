import { describe, expect, it } from "vitest";
import {
  createAssistiveSuggestionOrchestratorPlane,
  type CreateSuggestionEnvelopeCommand,
  type SuggestionActorContext,
  type SuggestionActorRole,
} from "../../packages/domains/assistive_suggestion/src/index.ts";

const fixedClock = { now: () => "2026-04-27T18:00:00.000Z" };

function actor(actorRole: SuggestionActorRole): SuggestionActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_suggestion_unit_test",
    routeIntentBindingRef: "route-intent:suggestion-orchestrator",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("409 rule guard and abstention logic", () => {
  it("creates full abstention when a typed rule guard hard-stop fires", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(
      envelopeCommand({
        ruleGuard: {
          hardStopReasonCodes: ["red_flag_safety_review_required"],
          conflictFlags: ["safety_epoch_pending"],
        },
      }),
      actor("bounded_suggestion_orchestrator"),
    );

    expect(envelope.abstentionState).toBe("full");
    expect(envelope.oneClickInsertState).toBe("blocked");
    expect([...plane.store.abstentionRecords.values()][0]?.reasonCode).toBe("rule_guard_hard_stop");
  });

  it("abstains instead of renormalizing when allowed-set mass collapses", () => {
    const plane = createReadyPlane();
    const envelope = plane.envelopes.createSuggestionEnvelope(
      envelopeCommand({
        ruleGuard: {
          blockedEndpointCodes: ["endpoint:routine_triage", "endpoint:booking", "endpoint:pharmacy"],
        },
      }),
      actor("bounded_suggestion_orchestrator"),
    );

    expect(envelope.allowedSetMass).toBeCloseTo(0.05);
    expect(envelope.abstentionState).toBe("full");
    expect(envelope.topHypothesisRef).toBeUndefined();
    expect([...plane.store.abstentionRecords.values()][0]?.reasonCode).toBe("allowed_set_mass_below_floor");
  });

  it("blocks raw rationale text from routine telemetry payloads", () => {
    const plane = createReadyPlane();

    expect(() =>
      plane.envelopes.createSuggestionEnvelope(
        envelopeCommand({
          rawRationaleText: "The model wrote a PHI-bearing explanation here.",
        }),
        actor("bounded_suggestion_orchestrator"),
      ),
    ).toThrow(/rationale refs/i);
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
    riskSignals: [
      {
        signalType: "red_flag_absent",
        severity: "low",
        supportingEvidenceRefs: ["evidence-span:risk:001"],
        posteriorProbability: 0.85,
        evidenceCoverage: 0.9,
      },
    ],
    questionRecommendations: [
      {
        questionSetRef: "question-set:routine-followup:v1",
        triggerReason: "clarify_duration",
        posteriorProbability: 0.8,
        evidenceRefs: ["evidence-span:question:001"],
        evidenceCoverage: 0.82,
      },
    ],
    endpointScores: endpointScores(),
    epistemicUncertainty: 0.12,
    surfaceBinding: surfaceBinding(),
    ...overrides,
  };
}

function endpointScores() {
  return [
    {
      endpointCode: "endpoint:routine_triage",
      rawScore: 4,
      fullSpaceCalibratedProbability: 0.75,
      rationaleRef: "rationale:routine",
      supportingEvidenceRefs: ["evidence-span:routine:001"],
      supportedEvidenceWeight: 0.9,
      requiredEvidenceWeight: 1,
      nonconformityScore: 0.1,
      severityRank: 1,
    },
    {
      endpointCode: "endpoint:urgent_escalation",
      rawScore: 1,
      fullSpaceCalibratedProbability: 0.05,
      rationaleRef: "rationale:urgent",
      supportingEvidenceRefs: ["evidence-span:urgent:001"],
      supportedEvidenceWeight: 0.7,
      requiredEvidenceWeight: 1,
      nonconformityScore: 0.7,
      severityRank: 4,
    },
    {
      endpointCode: "endpoint:booking",
      rawScore: 1.5,
      fullSpaceCalibratedProbability: 0.1,
      rationaleRef: "rationale:booking",
      supportingEvidenceRefs: ["evidence-span:booking:001"],
      supportedEvidenceWeight: 0.8,
      requiredEvidenceWeight: 1,
      nonconformityScore: 0.8,
      severityRank: 2,
    },
    {
      endpointCode: "endpoint:pharmacy",
      rawScore: 1.5,
      fullSpaceCalibratedProbability: 0.1,
      rationaleRef: "rationale:pharmacy",
      supportingEvidenceRefs: ["evidence-span:pharmacy:001"],
      supportedEvidenceWeight: 0.8,
      requiredEvidenceWeight: 1,
      nonconformityScore: 0.8,
      severityRank: 2,
    },
  ] as const;
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

function surfaceBinding() {
  return {
    routeFamilyRef: "route-family:staff-workspace",
    assistiveSurfaceBindingRef: "assistive-surface-binding:endpoint:v1",
    staffWorkspaceConsistencyProjectionRef: "workspace-consistency:001",
    workspaceSliceTrustProjectionRef: "workspace-slice-trust:001",
    audienceSurfaceRouteContractRef: "audience-route:staff-workspace:v1",
    surfacePublicationRef: "surface-publication:staff-workspace:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    releaseRecoveryDispositionRef: "release-recovery:phase8:v1",
    placeholderContractRef: "placeholder:suggestion:v1",
  };
}
