import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts";
import {
  buildCaptureOutcomeCommand,
  buildCreatePharmacyCaseCommand,
  buildEvaluateCommand,
  buildChooseProviderCommand,
  buildDispatchCommand,
  buildReopenCommand,
  ref,
  setupEvaluatedEligibleCase,
} from "./346_pharmacy_case.helpers.ts";

describe("346 pharmacy case replay, reopen, and migration", () => {
  it("replays create and evaluate idempotently on their frozen tuples", async () => {
    const service = createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });

    const createCommand = buildCreatePharmacyCaseCommand("346_replay");
    const created = await service.createPharmacyCase(createCommand);
    const replayedCreate = await service.createPharmacyCase(createCommand);

    const evaluateCommand = buildEvaluateCommand(created.pharmacyCase, "346_replay");
    const evaluated = await service.evaluatePharmacyCase(evaluateCommand);
    const replayedEvaluate = await service.evaluatePharmacyCase(evaluateCommand);

    const bundle = await service.getPharmacyCase(created.pharmacyCase.pharmacyCaseId);
    expect(created.replayed).toBe(false);
    expect(replayedCreate.replayed).toBe(true);
    expect(evaluated.replayed).toBe(false);
    expect(replayedEvaluate.replayed).toBe(true);
    expect(bundle?.transitionJournal).toHaveLength(3);
  });

  it("reopens an unresolved return back onto the same governed case identity", async () => {
    const { service, evaluated } = await setupEvaluatedEligibleCase("346_reopen");
    const chosen = await service.choosePharmacyProvider(
      buildChooseProviderCommand(evaluated.pharmacyCase, "346_reopen"),
    );
    const dispatched = await service.dispatchPharmacyReferral(
      buildDispatchCommand(chosen.pharmacyCase, "346_reopen"),
    );
    const returned = await service.capturePharmacyOutcome(
      buildCaptureOutcomeCommand(dispatched.pharmacyCase, "346_reopen", {
        disposition: "unresolved_returned",
        bounceBackRef: ref(
          "PharmacyBounceBackRecord",
          "bounce_back_346_reopen",
          "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts",
        ),
      }),
    );

    const reopened = await service.reopenPharmacyCase(
      buildReopenCommand(returned.pharmacyCase, "346_reopen"),
    );

    expect(returned.pharmacyCase.status).toBe("unresolved_returned");
    expect(reopened.pharmacyCase.status).toBe("candidate_received");
    expect(reopened.pharmacyCase.pharmacyCaseId).toBe(returned.pharmacyCase.pharmacyCaseId);
    expect(reopened.lineageCaseLink.lineageCaseLinkId).toBe(
      returned.lineageCaseLink.lineageCaseLinkId,
    );
    expect(reopened.emittedEvents.map((event) => event.eventType)).toContain(
      "pharmacy.case.reopened",
    );
  });

  it("publishes the authoritative migration tables and indices for the pharmacy case kernel", () => {
    const migration = readFileSync(
      "/Users/test/Code/V/services/command-api/migrations/154_phase6_pharmacy_case_kernel.sql",
      "utf8",
    );

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS phase6_pharmacy_cases");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS phase6_pharmacy_stale_ownership_recoveries");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS phase6_pharmacy_case_transition_journal");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS phase6_pharmacy_case_event_journal");
    expect(migration).toContain("idx_phase6_pharmacy_cases_lineage");
  });
});
