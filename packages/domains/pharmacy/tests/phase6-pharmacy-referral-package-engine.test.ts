import { describe, expect, it } from "vitest";

import {
  build349DraftInput,
  create349PackageHarness,
  seed349ConsentReadyCase,
} from "../../../../tests/integration/349_pharmacy_referral_package.helpers.ts";

describe("phase6 pharmacy referral package engine", () => {
  it("validates the package tuple and persists deterministic governance decisions in the draft", async () => {
    const harness = create349PackageHarness();
    const seedState = await seed349ConsentReadyCase({
      harness,
      seed: "349_unit_draft",
    });
    const draftInput = build349DraftInput({ seedState });

    const validation = await harness.packageService.validatePackageTuple(draftInput);
    expect(validation.status).toBe("valid");
    expect(validation.packageFingerprint).toBeTruthy();
    expect(validation.packageHash).toBeTruthy();

    const draft = await harness.packageService.composeDraftPackage(draftInput);
    expect(draft.package.packageState).toBe("composing");
    expect(draft.package.packageFingerprint).toBe(validation.packageFingerprint);
    expect(draft.package.packageHash).toBe(validation.packageHash);
    expect(draft.contentGovernanceDecisions.map((decision) => decision.decisionState)).toEqual(
      expect.arrayContaining([
        "included",
        "included_summary_only",
        "included_redaction_required",
        "unavailable",
      ]),
    );
  });
});
