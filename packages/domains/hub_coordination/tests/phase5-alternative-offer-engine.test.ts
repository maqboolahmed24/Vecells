import { describe, expect, it } from "vitest";

import {
  atMinute,
  openAlternativeOfferSession,
  setupAlternativeOfferHarness,
} from "../../../../tests/integration/320_alternative_offer.helpers.ts";

describe("phase5 alternative offer engine", () => {
  it("keeps callback fallback separate from ranked offer rows", async () => {
    const harness = await setupAlternativeOfferHarness("320_unit_solver");
    const opened = await openAlternativeOfferSession(harness);

    expect(opened.entries.length).toBeGreaterThan(0);
    expect(new Set(opened.entries.map((entry) => entry.capacityUnitRef)).size).toBe(
      opened.entries.length,
    );
    expect(opened.fallbackCard?.cardType).toBe("callback");
    expect(opened.entries.every((entry) => entry.rankOrdinal >= 1)).toBe(true);
    expect(opened.session.offerEntryRefs.length).toBe(opened.entries.length);
  });

  it("replays the stored optimisation fixture without changing the visible set", async () => {
    const harness = await setupAlternativeOfferHarness("320_unit_replay");
    const opened = await openAlternativeOfferSession(harness);

    const replay = await harness.offerService.replayAlternativeOfferSession({
      alternativeOfferSessionId: opened.session.alternativeOfferSessionId,
      replayedAt: atMinute(12),
    });

    expect(replay.matchesStoredSession).toBe(true);
    expect(replay.mismatchFields).toEqual([]);
    expect(replay.rerunVisibleCandidateRefs).toEqual(opened.session.candidateRefs);
  });
});
