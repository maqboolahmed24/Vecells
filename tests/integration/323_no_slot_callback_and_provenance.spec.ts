import { describe, expect, it } from "vitest";

import {
  buildCompleteFallbackInput,
  buildLinkCallbackInput,
  buildResolveNoSlotInput,
  openFallbackOfferSession,
  setupHubFallbackHarness,
} from "./323_hub_fallback.helpers.ts";

describe("323 hub fallback callback flow", () => {
  it("creates callback fallback from a live offer session and preserves stale offer provenance", async () => {
    const harness = await setupHubFallbackHarness("323_callback_provenance");
    const opened = await openFallbackOfferSession(harness);

    const result = await harness.fallbackService.resolveNoSlotFallback(
      buildResolveNoSlotInput(harness, {
        callbackRequested: true,
        trustedAlternativeFrontierExists: true,
        offerLeadMinutes: 40,
        callbackLeadMinutes: 8,
        alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
      }),
    );

    expect(result.route).toBe("callback");
    expect(result.fallbackRecord).not.toBeNull();
    expect(result.callbackFallbackRecord).not.toBeNull();
    expect(result.hubTransition?.hubCase.status).toBe("callback_transfer_pending");
    expect(result.truthProjection?.fallbackLinkState).toBe("callback_pending_link");
    expect(result.truthProjection?.patientVisibilityState).toBe("fallback_visible");
    expect(result.truthProjection?.closureState).toBe("blocked_by_fallback_linkage");
    expect(result.session?.openChoiceState).toBe("read_only_provenance");
    expect(result.session?.patientChoiceState).toBe("callback_requested");
    expect(result.fallbackCard?.sourceFallbackRef).toBe(result.fallbackRecord?.hubFallbackRecordId);
    expect(result.fallbackRecord?.waitlistFallbackObligationRef).toContain(
      "waitlist_fallback_obligation",
    );
    expect(result.callbackFallbackRecord?.sourceOfferSessionRef).toBe(
      opened.openResult.session.alternativeOfferSessionId,
    );
  });

  it("links callback fallback to the governed callback domain before the case can close", async () => {
    const harness = await setupHubFallbackHarness("323_callback_link");
    const opened = await openFallbackOfferSession(harness);
    const created = await harness.fallbackService.resolveNoSlotFallback(
      buildResolveNoSlotInput(harness, {
        callbackRequested: true,
        trustedAlternativeFrontierExists: true,
        offerLeadMinutes: 50,
        callbackLeadMinutes: 8,
        alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
      }),
    );
    const fallbackId = created.fallbackRecord!.hubFallbackRecordId;

    const linked = await harness.fallbackService.linkCallbackFallback(
      buildLinkCallbackInput(fallbackId, "323_callback_link"),
    );

    expect(linked.callbackFallbackRecord.callbackCaseRef).toContain("callback_case_");
    expect(linked.callbackFallbackRecord.callbackExpectationEnvelopeRef).toContain(
      "callback_expectation_",
    );
    expect(linked.fallbackRecord.fallbackState).toBe("transferred");
    expect(linked.truthProjection.fallbackLinkState).toBe("callback_linked");
    expect(linked.truthProjection.closureState).toBe("closable");
    expect(linked.hubTransition.hubCase.status).toBe("callback_offered");

    const completed = await harness.fallbackService.completeHubFallback(
      buildCompleteFallbackInput(fallbackId, "323_callback_link"),
    );

    expect(completed.fallbackRecord.fallbackState).toBe("completed");
    expect(completed.closedCase?.hubCase.status).toBe("closed");
  });
});
