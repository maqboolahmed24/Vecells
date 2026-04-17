import { describe, expect, it } from "vitest";
import {
  EvidenceClassificationDecisionDocument,
  IncrementalSafetyRuleEvaluator,
  StaticSafetyRulePackLoader,
  assertRoutineContinuationAllowed,
  createAssimilationSafetyServices,
  createAssimilationSafetySimulationHarness,
  createAssimilationSafetyStore,
} from "../src/index.ts";

describe("canonical assimilation and safety backbone", () => {
  it("covers post-submit evidence, re-safety, replay, and inflight coalescing scenarios", async () => {
    const harness = createAssimilationSafetySimulationHarness();
    const results = await harness.runAllScenarios();
    const byScenario = Object.fromEntries(results.map((result) => [result.scenarioId, result]));

    expect(results).toHaveLength(8);

    expect(byScenario.post_submit_reply_no_material_change.attachmentDisposition).toBe(
      "derivative_only",
    );
    expect(byScenario.post_submit_reply_no_material_change.assimilationState).toBe(
      "settled_no_re_safety",
    );
    expect(byScenario.post_submit_reply_no_material_change.decisionOutcome).toBeNull();

    expect(byScenario.reply_clinically_material_forces_resafety.attachmentDisposition).toBe(
      "new_snapshot",
    );
    expect(byScenario.reply_clinically_material_forces_resafety.triggerDecision).toBe(
      "re_safety_required",
    );
    expect(byScenario.reply_clinically_material_forces_resafety.decisionOutcome).toBe(
      "residual_review",
    );

    expect(
      byScenario.contradictory_low_assurance_cannot_clear_prior_urgent.requestedSafetyState,
    ).toBe("urgent_diversion_required");
    expect(byScenario.contradictory_low_assurance_cannot_clear_prior_urgent.decisionOutcome).toBe(
      "urgent_required",
    );

    expect(byScenario.callback_outcome_triggers_urgent_diversion.decisionOutcome).toBe(
      "urgent_live",
    );
    expect(byScenario.callback_outcome_triggers_urgent_diversion.urgentDiversionState).toBe(
      "issued",
    );

    expect(byScenario.support_capture_changes_contact_safety_meaning.dominantEvidenceClass).toBe(
      "contact_safety_relevant",
    );
    expect(byScenario.weak_pharmacy_outcome_forces_manual_review.decisionOutcome).toBe(
      "fallback_manual_review",
    );

    expect(byScenario.exact_replay_returns_existing_assimilation.replayDisposition).toBe(
      "exact_replay",
    );
    expect(byScenario.overlapping_inflight_assimilation_coalesces.replayDisposition).toBe(
      "coalesced_inflight",
    );
  });

  it("reuses the same assimilation record on exact replay", async () => {
    const harness = createAssimilationSafetySimulationHarness();
    const results = await harness.runAllScenarios();
    const replay = results.find(
      (result) => result.scenarioId === "exact_replay_returns_existing_assimilation",
    );

    expect(replay?.replayDisposition).toBe("exact_replay");
    expect(replay?.assimilationRecord.assimilationState).toBe("settled_triggered");
  });

  it("limits rescoring to impacted rules plus hard stops when only bounded deltas changed", async () => {
    const evaluator = new IncrementalSafetyRuleEvaluator();
    const loader = new StaticSafetyRulePackLoader();
    const classification = EvidenceClassificationDecisionDocument.create({
      classificationDecisionId: "classification_rule_eval_001",
      requestId: "request_rule_eval_001",
      triggeringSnapshotRef: "snapshot_rule_eval_001",
      evidenceAssimilationRef: "assimilation_rule_eval_001",
      sourceDomain: "support_capture",
      governingObjectRef: "support_case_rule_eval",
      classifiedEvidenceRefs: ["evidence_rule_eval_001"],
      classifierVersionRef: "classifier_v1",
      dominantEvidenceClass: "contact_safety_relevant",
      classificationBasis: "route_dependency",
      triggerReasonCodes: ["contact_route_invalidated"],
      activeDependencyRefs: ["reachability_callback"],
      confidenceBand: "high",
      misclassificationRiskState: "ordinary",
      decisionState: "applied",
      supersedesDecisionRef: null,
      decidedByRef: "test",
      decidedAt: "2026-04-12T19:00:00Z",
    }).toSnapshot();

    const first = await evaluator.evaluate(
      "request_rule_eval_001",
      classification,
      {
        requestTypeRef: "callback_request",
        featureStates: {
          urgent_red_flag: "absent",
          callback_unreachable: "absent",
        },
        deltaFeatureRefs: ["urgent_red_flag", "callback_unreachable"],
        activeReachabilityDependencyRefs: ["reachability_callback"],
      },
      loader,
    );
    const second = await evaluator.evaluate(
      "request_rule_eval_001",
      classification,
      {
        requestTypeRef: "callback_request",
        featureStates: {
          urgent_red_flag: "absent",
          callback_unreachable: "present",
        },
        deltaFeatureRefs: ["callback_unreachable"],
        deltaDependencyRefs: ["reachability_callback"],
        activeReachabilityDependencyRefs: ["reachability_callback"],
      },
      loader,
    );

    expect(first.evaluatedRuleRefs.length).toBeGreaterThan(second.evaluatedRuleRefs.length);
    expect(second.impactedRuleRefs).toContain("RULE_HARDSTOP_URGENT_RED_FLAG");
    expect(second.impactedRuleRefs).toContain("RULE_URGENT_CALLBACK_FAILURE");
    expect(second.evaluatedRuleRefs).not.toContain("RULE_RESIDUAL_CONSENT_WITHDRAWAL");
  });

  it("blocks routine continuation while urgent diversion settlement is still pending", async () => {
    const harness = createAssimilationSafetySimulationHarness();
    const results = await harness.runAllScenarios();
    const contradiction = results.find(
      (result) => result.scenarioId === "contradictory_low_assurance_cannot_clear_prior_urgent",
    );

    expect(() =>
      assertRoutineContinuationAllowed({
        latestAssimilation: contradiction?.assimilationRecord ?? null,
        latestPreemption: contradiction?.preemption ?? null,
        latestSafetyDecision: contradiction?.safetyDecision ?? null,
        latestUrgentDiversionSettlement: contradiction?.urgentDiversionSettlement ?? null,
        expectedSafetyEpoch: contradiction?.safetyDecision?.resultingSafetyEpoch ?? null,
      }),
    ).toThrowError(/urgent_diversion_required/i);
  });

  it("coalesces overlapping in-flight assimilation to one append-only record", async () => {
    const repositories = createAssimilationSafetyStore();
    const services = createAssimilationSafetyServices(repositories);
    const first = services.coordinator.assimilateEvidence({
      episodeId: "episode_overlap",
      requestId: "request_overlap",
      sourceDomain: "async_enrichment",
      governingObjectRef: "enrichment_overlap",
      ingressEvidenceRefs: ["evidence_overlap"],
      decidedAt: "2026-04-12T19:10:00Z",
      currentSafetyDecisionEpoch: 4,
      currentPendingPreemptionRef: "preemption_open_001",
      currentPendingSafetyEpoch: 5,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_overlap"],
        changedFeatureRefs: ["new_clinical_detail"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_overlap",
            suggestedClass: "potentially_clinical",
            confidence: 0.8,
          },
        ],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: { new_clinical_detail: "present" },
        deltaFeatureRefs: ["new_clinical_detail"],
      },
    });
    const second = services.coordinator.assimilateEvidence({
      episodeId: "episode_overlap",
      requestId: "request_overlap",
      sourceDomain: "async_enrichment",
      governingObjectRef: "enrichment_overlap",
      ingressEvidenceRefs: ["evidence_overlap"],
      decidedAt: "2026-04-12T19:10:00Z",
      currentSafetyDecisionEpoch: 4,
      currentPendingPreemptionRef: "preemption_open_001",
      currentPendingSafetyEpoch: 5,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_overlap"],
        changedFeatureRefs: ["new_clinical_detail"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_overlap",
            suggestedClass: "potentially_clinical",
            confidence: 0.8,
          },
        ],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: { new_clinical_detail: "present" },
        deltaFeatureRefs: ["new_clinical_detail"],
      },
    });

    const [left, right] = await Promise.all([first, second]);

    expect(left.assimilationRecord.evidenceAssimilationId).toBe(
      right.assimilationRecord.evidenceAssimilationId,
    );
    expect(right.replayDisposition).toBe("coalesced_inflight");
  });
});
