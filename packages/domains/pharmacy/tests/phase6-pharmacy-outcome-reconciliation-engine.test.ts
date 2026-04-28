import { describe, expect, it } from "vitest";

import {
  createPhase6PharmacyOutcomeReconciliationService,
  createPhase6PharmacyOutcomeStore,
  createPharmacyOutcomeSourceRegistry,
} from "../src/index.ts";

describe("phase6 pharmacy outcome reconciliation engine", () => {
  it("normalizes source-specific trust and provenance by source family", () => {
    const registry = createPharmacyOutcomeSourceRegistry();

    const parsed = registry.parse({
      sourceType: "gp_workflow_observation",
      sourceMessageKey: "workflow_message_352",
      receivedAt: "2026-04-23T17:45:00.000Z",
      rawPayload: {
        classificationState: "resolved_no_supply",
        patientRefId: "patient_352",
        providerOdsCode: "A10001",
        serviceType: "clinical_pathway_consultation",
        correlationRefs: ["corr_352"],
      },
    });

    expect(parsed.envelope.trustClass).toBe("trusted_observed");
    expect(parsed.envelope.correlationRefs).toEqual(["corr_352"]);
    expect(parsed.normalized.classificationState).toBe("resolved_no_supply");
    expect(parsed.provenance.fieldOriginRefs).toContain(
      "field_origin.gp_workflow_observation",
    );
  });

  it("classifies same-key divergent semantics as collision review", async () => {
    const repositories = createPhase6PharmacyOutcomeStore();
    const service = createPhase6PharmacyOutcomeReconciliationService({
      repositories,
    });

    await service.matchOutcomeEvidence({
      sourceType: "direct_structured_message",
      sourceMessageKey: "shared_key_352",
      receivedAt: "2026-04-23T17:50:00.000Z",
      rawPayload: {
        classificationState: "resolved_no_supply",
        patientRefId: "patient_352",
      },
    });

    const second = await service.previewNormalizedOutcome({
      sourceType: "direct_structured_message",
      sourceMessageKey: "shared_key_352",
      receivedAt: "2026-04-23T17:51:00.000Z",
      rawPayload: {
        classificationState: "urgent_gp_action",
        patientRefId: "patient_352",
      },
    });

    expect(second.replayDecision.decisionClass).toBe("collision_review");
    expect(second.replayDecision.dedupeState).toBe("collision_review");
  });

  it("classifies same-key chronology drift with the same outcome meaning as semantic replay", async () => {
    const repositories = createPhase6PharmacyOutcomeStore();
    const service = createPhase6PharmacyOutcomeReconciliationService({
      repositories,
    });

    await service.matchOutcomeEvidence({
      sourceType: "gp_workflow_observation",
      sourceMessageKey: "same_meaning_352",
      receivedAt: "2026-04-23T17:50:00.000Z",
      rawPayload: {
        classificationState: "resolved_no_supply",
        outcomeAt: "2026-04-23T17:45:00.000Z",
        patientRefId: "patient_352",
        providerRefId: "provider_352",
        providerOdsCode: "A10001",
        serviceType: "clinical_pathway_consultation",
        correlationRefs: ["corr_352"],
      },
    });

    const replay = await service.previewNormalizedOutcome({
      sourceType: "gp_workflow_observation",
      sourceMessageKey: "same_meaning_352",
      receivedAt: "2026-04-23T17:52:00.000Z",
      rawPayload: {
        classificationState: "resolved_no_supply",
        outcomeAt: "2026-04-23T17:47:00.000Z",
        patientRefId: "patient_352",
        providerRefId: "provider_352",
        providerOdsCode: "A10001",
        serviceType: "clinical_pathway_consultation",
        correlationRefs: ["corr_352"],
      },
    });

    expect(replay.replayDecision.decisionClass).toBe("semantic_replay");
    expect(replay.replayDecision.dedupeState).toBe("duplicate");
  });
});
