import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildImportedCorrelationInput,
  buildSupplierObservationInput,
  prepareBookedManageHarness,
  setupBookedIntegrityHarness,
  setupReconciliationIntegrityHarness,
} from "../integration/325_hub_background_integrity.helpers.ts";

describe("325 worker monotonicity and dedupe properties", () => {
  it("never thaws a frozen supplier mirror through replayed or weaker booked observations", async () => {
    const harness = await setupBookedIntegrityHarness("325_property_mirror");
    await prepareBookedManageHarness(harness);

    await harness.integrityService.ingestSupplierMirrorObservation(
      buildSupplierObservationInput(harness, {
        observedStatus: "cancelled",
      }),
    );

    for (const [index, observedAt] of [31, 30, 32].entries()) {
      const result = await harness.integrityService.ingestSupplierMirrorObservation(
        buildSupplierObservationInput(harness, {
          payloadId: `supplier_payload_property_${index}`,
          observedStatus: "booked",
          observedAt: atMinute(observedAt),
          recordedAt: atMinute(40 + index),
          confidenceBand: index === 2 ? "medium" : "low",
        }),
      );
      expect(result.observation.observationDisposition).toMatch(/ignored_/);
      expect(result.mirrorState.manageFreezeState).toBe("frozen");
      expect(result.mirrorState.driftState).toBe("drift_detected");
    }
  });

  it("dedupes imported confirmation correlations by evidence ref", async () => {
    const harness = await setupReconciliationIntegrityHarness("325_property_dedupe");
    const first = await harness.integrityService.correlateImportedConfirmation(
      await buildImportedCorrelationInput(harness, {
        providerAdapterBinding: {
          ...harness.providerAdapterBinding,
          sourceIdentity: `${harness.providerAdapterBinding.sourceIdentity}_wrong`,
        },
      }),
    );
    const replay = await harness.integrityService.correlateImportedConfirmation(
      await buildImportedCorrelationInput(harness, {
        providerAdapterBinding: {
          ...harness.providerAdapterBinding,
          sourceIdentity: `${harness.providerAdapterBinding.sourceIdentity}_wrong`,
        },
      }),
    );

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.correlation.hubImportedConfirmationCorrelationId).toBe(
      first.correlation.hubImportedConfirmationCorrelationId,
    );
  });
});
