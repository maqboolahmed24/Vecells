import { describe, expect, it } from "vitest";

import {
  create353BounceBackHarness,
  ingest353BounceBack,
  seed353BounceBackReadyCase,
} from "./353_pharmacy_bounce_back.helpers.ts";

describe("353 pharmacy bounce-back replay and concurrency", () => {
  it("collapses concurrent duplicate bounce-back delivery into one authoritative record", async () => {
    const harness = create353BounceBackHarness();
    const seeded = await seed353BounceBackReadyCase({
      harness,
      seed: "353_concurrency",
    });

    const input = {
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      patientShellConsistencyProjectionId:
        seeded.shellProjection.patientShellConsistencyProjectionId,
      patientContactRouteRef: seeded.patientContactRouteRef,
      explicitBounceBackType: "routine_gp_return" as const,
      recordedAt: "2026-04-23T19:20:00.000Z",
      deltaClinical: 0.2,
      deltaContact: 0,
      deltaProvider: 0,
      deltaConsent: 0,
      deltaTiming: 0.1,
      emitPatientNotification: false,
    };

    const [left, right] = await Promise.all([
      ingest353BounceBack(input),
      ingest353BounceBack(input),
    ]);

    expect(left.bounceBackRecord.bounceBackRecordId).toBe(right.bounceBackRecord.bounceBackRecordId);
    const stored = await harness.bounceBackRepositories.listBounceBackRecordsByCase(
      seeded.currentCase.pharmacyCaseId,
    );
    expect(stored).toHaveLength(1);

    const replay = await ingest353BounceBack(input);
    expect(replay.replayed).toBe(true);
    expect(replay.bounceBackRecord.bounceBackRecordId).toBe(left.bounceBackRecord.bounceBackRecordId);
  });
});
