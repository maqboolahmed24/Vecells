import { describe, expect, it } from "vitest";

import {
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "./318_network_capacity.helpers.ts";

describe("318 network capacity snapshot and ledgers", () => {
  it("builds one authoritative candidate snapshot, proof tuple, decision plan, and ledgers", async () => {
    const harness = await setupNetworkCapacityHarness("318_snapshot");
    const result = await harness.service.buildCandidateSnapshotForCase({
      ...buildSnapshotCommand("318_snapshot"),
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
    });

    expect(result.snapshot).not.toBeNull();
    expect(result.rankProof).not.toBeNull();
    expect(result.decisionPlan).not.toBeNull();
    expect(result.candidates).toHaveLength(5);
    expect(result.snapshot?.candidateCount).toBe(5);
    expect(result.snapshot?.trustedCandidateCount).toBe(3);
    expect(result.snapshot?.degradedCandidateCount).toBe(1);
    expect(result.snapshot?.quarantinedCandidateCount).toBe(1);
    expect(result.rankProof?.orderedCandidateRefs).toEqual(
      result.candidates.map((candidate) => candidate.candidateId),
    );

    expect(result.decisionPlan?.patientOfferableFrontierRefs).toHaveLength(2);
    expect(result.decisionPlan?.directCommitFrontierRefs).toHaveLength(1);
    expect(result.decisionPlan?.callbackReasoningRefs).toHaveLength(2);
    expect(result.decisionPlan?.diagnosticOnlyRefs).toHaveLength(1);

    const offerability = result.candidates.map((candidate) => candidate.offerabilityState);
    expect(offerability).toEqual([
      "direct_commit",
      "callback_only_reasoning",
      "diagnostic_only",
      "patient_offerable",
      "callback_only_reasoning",
    ]);

    expect(result.minutesLedger.requiredMinutes).toBe(120);
    expect(result.minutesLedger.ledgerState).toBe("make_up_required");
    expect(result.cancellationMakeUpLedger?.makeUpState).toBe("replacement_due");

    expect(result.supplyExceptions.map((value) => value.exceptionCode)).toEqual(
      expect.arrayContaining([
        "CAPACITY_DEGRADED_CALLBACK_ONLY",
        "CAPACITY_QUARANTINED",
        "CAPACITY_HIDDEN",
      ]),
    );
    expect(result.policyResult.exceptions.map((value) => value.exceptionCode)).toEqual(
      expect.arrayContaining(["SERVICE_OBLIGATION_MAKE_UP_REQUIRED"]),
    );
  });
});
