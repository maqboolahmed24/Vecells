import fs from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildLinkCallbackInput,
  buildResolveNoSlotInput,
  openFallbackOfferSession,
  setupHubFallbackHarness,
} from "./323_hub_fallback.helpers.ts";

const MIGRATION_PATH =
  "/Users/test/Code/V/services/command-api/migrations/151_phase5_hub_fallback_workflows.sql";
const DECISION_PATH = "/Users/test/Code/V/data/analysis/323_fallback_decision_examples.csv";
const BOUNCE_PATH = "/Users/test/Code/V/data/analysis/323_bounce_and_novelty_cases.csv";
const GAP_PATH =
  "/Users/test/Code/V/data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_FALLBACK_REOPEN_LIFECYCLE_COORDINATOR.json";

describe("323 hub fallback replay and migration", () => {
  it("replays callback linkage state from persisted fallback records", async () => {
    const harness = await setupHubFallbackHarness("323_replay");
    const opened = await openFallbackOfferSession(harness);
    const created = await harness.fallbackService.resolveNoSlotFallback(
      buildResolveNoSlotInput(harness, {
        callbackRequested: true,
        trustedAlternativeFrontierExists: true,
        offerLeadMinutes: 40,
        callbackLeadMinutes: 8,
        alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
      }),
    );

    const linked = await harness.fallbackService.linkCallbackFallback(
      buildLinkCallbackInput(created.fallbackRecord!.hubFallbackRecordId, "323_replay"),
    );

    const storedFallback = (
      await harness.fallbackRepositories.getFallbackRecord(
        created.fallbackRecord!.hubFallbackRecordId,
      )
    )!.toSnapshot();
    const storedCallback = (
      await harness.fallbackRepositories.getCallbackFallbackRecord(
        storedFallback.callbackFallbackRef!,
      )
    )!.toSnapshot();

    expect(storedFallback.fallbackState).toBe("transferred");
    expect(storedFallback.truthTupleHash).toBe(linked.truthProjection.truthTupleHash);
    expect(storedCallback.callbackCaseRef).toBe(linked.callbackFallbackRecord.callbackCaseRef);
    expect(storedCallback.callbackExpectationEnvelopeRef).toBe(
      linked.callbackFallbackRecord.callbackExpectationEnvelopeRef,
    );
  });

  it("publishes the fallback migration, decision matrix, bounce cases, and reopen seam", () => {
    const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
    const decisions = fs.readFileSync(DECISION_PATH, "utf8");
    const bounce = fs.readFileSync(BOUNCE_PATH, "utf8");
    const gap = fs.readFileSync(GAP_PATH, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_fallback_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_callback_fallback_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_return_to_practice_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_fallback_cycle_counters");
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS phase5_hub_fallback_supervisor_escalations",
    );
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS phase5_hub_coordination_exceptions");
    expect(sql).toContain("148_phase5_alternative_offer_engine.sql");
    expect(sql).toContain("150_phase5_practice_continuity_chain.sql");

    expect(decisions).toContain("decision_323_002");
    expect(decisions).toContain("patient_requested_callback_within_window");
    expect(decisions).toContain("degraded_only_supply_requires_return");

    expect(bounce).toContain("bounce_323_003");
    expect(bounce).toContain("bounce_323_005");
    expect(bounce).toContain("true");

    expect(gap).toContain("\"taskId\": \"par_323\"");
    expect(gap).toContain("\"missingSurface\"");
    expect(gap).toContain("\"followUpAction\"");
  });
});
