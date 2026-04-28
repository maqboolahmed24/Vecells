import { describe, expect, it } from "vitest";

import {
  ingest352Outcome,
  project352PatientStatus,
  seed352OutcomeReadyCase,
  create352OutcomeHarness,
} from "./352_pharmacy_outcome.helpers.ts";

describe("352 pharmacy outcome ingest and replay", () => {
  it("settles a trusted strongly matched outcome and ignores exact replay without reopening the case", async () => {
    const harness = create352OutcomeHarness();
    const seeded = await seed352OutcomeReadyCase({
      harness,
      seed: "352_resolve",
    });

    const first = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "resolved_no_supply",
      sourceType: "gp_workflow_observation",
      sourceMessageKey: "workflow_resolve_352",
      recordedAt: "2026-04-23T18:05:00.000Z",
    });

    expect(first.settlement.result).toBe("resolved_pending_projection");
    expect(first.caseMutation?.pharmacyCase.status).toBe("resolved_by_pharmacy");
    expect(first.outcomeTruthProjection.outcomeTruthState).toBe("settled_resolved");

    const projected = await project352PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T18:06:00.000Z",
    });

    expect(projected.patientStatusProjection.currentMacroState).toBe("completed");
    expect(projected.patientStatusProjection.outcomeTruthProjectionRef?.refId).toBe(
      first.outcomeTruthProjection.pharmacyOutcomeTruthProjectionId,
    );

    const replay = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "resolved_no_supply",
      sourceType: "gp_workflow_observation",
      sourceMessageKey: "workflow_resolve_352",
      recordedAt: "2026-04-23T18:07:00.000Z",
    });

    expect(replay.settlement.result).toBe("duplicate_ignored");
    expect(replay.caseMutation).toBeNull();

    const replayProjected = await project352PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T18:08:00.000Z",
    });

    expect(replayProjected.patientStatusProjection.currentMacroState).toBe("completed");
  });
});
