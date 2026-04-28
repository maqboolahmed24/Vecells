import { describe, expect, it } from "vitest";

import { buildSmokeScenario } from "../../scripts/capacity/336_partner_feed_lib.ts";
import {
  buildCollisionBindings,
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "./318_network_capacity.helpers.ts";

describe("338 capacity feed admission and quarantine", () => {
  it("admits trusted supply while degraded and quarantined feeds stay suppressed from ordinary patient frontiers", async () => {
    const harness = await setupNetworkCapacityHarness("338_capacity");
    const smoke = await buildSmokeScenario();
    const result = await harness.service.buildCandidateSnapshotForCase({
      ...buildSnapshotCommand("338_capacity"),
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
      adapterBindings: smoke.bindings,
      deliveredMinutes: 120,
      cancelledMinutes: 0,
      replacementMinutes: 0,
    });

    const admissionsBySource = new Map(
      result.sourceAdmissions.map((admission) => [admission.sourceRef, admission]),
    );
    const candidateById = new Map(result.candidates.map((candidate) => [candidate.candidateId, candidate]));

    expect(admissionsBySource.get("feed_336_gp_connect_local_twin")?.admissionDisposition).toBe(
      "trusted_admitted",
    );
    expect(admissionsBySource.get("feed_336_tpp_local_twin")?.admissionDisposition?.startsWith("degraded_")).toBe(
      true,
    );
    expect(admissionsBySource.get("feed_336_batch_import_local_twin")?.admissionDisposition).toBe(
      "quarantined_excluded",
    );
    expect(admissionsBySource.get("feed_336_tpp_local_twin")?.hiddenFromPatientTruth).toBe(true);
    expect(admissionsBySource.get("feed_336_batch_import_local_twin")?.hiddenFromPatientTruth).toBe(
      true,
    );

    for (const candidateRef of result.decisionPlan?.patientOfferableFrontierRefs ?? []) {
      const candidate = candidateById.get(candidateRef);
      expect(candidate?.sourceTrustState).not.toBe("degraded");
      expect(candidate?.sourceTrustState).not.toBe("quarantined");
    }
    for (const candidateRef of result.decisionPlan?.directCommitFrontierRefs ?? []) {
      const candidate = candidateById.get(candidateRef);
      expect(candidate?.sourceTrustState).toBe("trusted");
      expect(candidate?.offerabilityState).toBe("direct_commit");
    }

    const quarantined = result.candidates.find((candidate) => candidate.sourceTrustState === "quarantined");
    const degraded = result.candidates.find((candidate) => candidate.sourceTrustState === "degraded");
    expect(quarantined?.offerabilityState).toBe("diagnostic_only");
    expect(degraded?.offerabilityState).toBe("callback_only_reasoning");
    expect(result.supplyExceptions.map((entry) => entry.exceptionCode)).toEqual(
      expect.arrayContaining(["CAPACITY_DEGRADED_CALLBACK_ONLY", "CAPACITY_QUARANTINED"]),
    );
  });

  it("keeps a trusted candidate ahead of degraded collisions in the authoritative rank proof", async () => {
    const harness = await setupNetworkCapacityHarness("338_capacity_collision");
    const result = await harness.service.buildCandidateSnapshotForCase({
      ...buildSnapshotCommand("338_capacity_collision"),
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
      adapterBindings: buildCollisionBindings("338_capacity_collision"),
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.sourceTrustState).toBe("trusted");
    expect(result.rankProof?.orderedCandidateRefs).toEqual([
      result.candidates[0]?.candidateId,
    ]);
    expect(result.decisionPlan?.patientOfferableFrontierRefs).toContain(
      result.candidates[0]?.candidateId,
    );
    expect(result.decisionPlan?.callbackReasoningRefs).toEqual([]);
    expect(result.sourceAdmissions.map((entry) => entry.admissionDisposition)).toContain(
      "degraded_callback_only",
    );
  });
});
