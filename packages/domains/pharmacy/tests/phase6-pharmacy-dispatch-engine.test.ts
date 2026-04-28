import { describe, expect, it } from "vitest";

import {
  create350DispatchHarness,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "../../../../tests/integration/350_pharmacy_dispatch.helpers.ts";

describe("phase6 pharmacy dispatch engine", () => {
  it("submits a frozen package onto a governed transport plan and stays pending until authoritative proof exists", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "350_unit_submit",
    });

    const submitted = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "350_unit_submit",
    });

    expect(submitted.dispatchBundle.plan.transportMode).toBe("bars_fhir");
    expect(submitted.dispatchBundle.profile.transportAssuranceProfileId).toBe(
      "TAP_343_BARS_FHIR_V1",
    );
    expect(submitted.dispatchBundle.attempt.proofState).toBe("pending");
    expect(submitted.dispatchBundle.attempt.transportAcceptanceState).toBe("accepted");
    expect(submitted.dispatchBundle.settlement.result).toBe("pending_ack");
    expect(submitted.dispatchBundle.truthProjection.authoritativeProofState).toBe("pending");
  });
});
