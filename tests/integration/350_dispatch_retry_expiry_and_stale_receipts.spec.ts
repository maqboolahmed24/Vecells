import { describe, expect, it } from "vitest";

import {
  create350DispatchHarness,
  load350CurrentCase,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "./350_pharmacy_dispatch.helpers.ts";

describe("350 dispatch retry, expiry, and stale consent", () => {
  it("expires stale pending attempts without claiming calm referral truth", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_expiry",
    });

    const submitted = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_expiry_submit",
      recordedAt: "2026-04-23T14:20:00.000Z",
    });

    const expired = await harness.dispatchService.expireStaleAttempts({
      now: "2026-04-23T16:30:00.000Z",
    });

    const bundle = expired.find(
      (entry) =>
        entry.attempt.dispatchAttemptId === submitted.dispatchBundle.attempt.dispatchAttemptId,
    );
    expect(bundle).toBeDefined();
    expect(bundle?.proofEnvelope.proofState).toBe("expired");
    expect(bundle?.settlement.result).toBe("reconciliation_required");
    expect(bundle?.truthProjection.authoritativeProofState).toBe("expired");
  });

  it("fails closed when consent drifts immediately before send", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_stale",
    });

    const checkpointDocument = await harness.repositories.getConsentCheckpoint(
      frozenState.packageBundle.package.consentCheckpointRef.refId,
    );
    if (!checkpointDocument) {
      throw new Error("Consent checkpoint missing.");
    }
    const checkpoint = checkpointDocument.toSnapshot();
    await harness.repositories.saveConsentCheckpoint(
      {
        ...checkpoint,
        checkpointState: "expired",
        version: checkpoint.version + 1,
      },
      { expectedVersion: checkpoint.version },
    );

    await expect(
      submit350Dispatch({
        harness,
        frozenState,
        sourceCommandId: "350_stale_submit",
      }),
    ).rejects.toMatchObject({
      code: "STALE_CHOICE_OR_CONSENT",
    });

    const currentCase = await load350CurrentCase(harness, frozenState.pharmacyCaseId);
    expect(currentCase.status).toBe("consent_pending");
  });
});
