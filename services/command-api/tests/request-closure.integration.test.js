import { describe, expect, it } from "vitest";
import {
  createRequestClosureApplication,
  requestClosureMigrationPlanRefs,
  requestClosurePersistenceTables,
} from "../src/request-closure.ts";

describe("request closure command-api seam", () => {
  it("publishes the closure simulator cases, migration plan, and event seam gaps", async () => {
    const application = createRequestClosureApplication();
    const results = await application.simulation.runAllScenarios();
    const byScenario = Object.fromEntries(results.map((result) => [result.scenarioId, result]));

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/076_request_closure_record_and_exception_case_models.sql",
    );
    expect(application.migrationPlanRefs).toEqual(requestClosureMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(requestClosurePersistenceTables);
    expect(application.parallelInterfaceGaps).toHaveLength(3);
    expect(application.canonicalEventEntries).toHaveLength(8);
    expect(results).toHaveLength(7);

    expect(byScenario.legal_close_no_blockers.decision).toBe("close");
    expect(byScenario.legal_close_no_blockers.closedByMode).toBe("routine_terminal_outcome");

    expect(byScenario.defer_duplicate_review_open.decision).toBe("defer");
    expect(byScenario.defer_duplicate_review_open.deferReasonCodes).toContain(
      "REPAIR_OR_REVIEW_OPEN",
    );

    expect(byScenario.defer_fallback_review_after_degraded_progress.blockerFamily).toBe(
      "fallback_review",
    );
    expect(
      byScenario.defer_fallback_review_after_degraded_progress.fallbackCase?.patientVisibleState,
    ).toBe("submitted_degraded");

    expect(byScenario.defer_external_confirmation_pending.deferReasonCodes).toContain(
      "APPROVAL_OR_CONFIRMATION_PENDING",
    );
    expect(byScenario.defer_external_confirmation_pending.deferReasonCodes).toContain(
      "CONSENT_OR_DEGRADED_PROMISE_OPEN",
    );

    expect(byScenario.defer_grant_and_reachability_repair.deferReasonCodes).toContain(
      "LIVE_PHI_GRANT_PRESENT",
    );
    expect(byScenario.defer_grant_and_reachability_repair.deferReasonCodes).toContain(
      "REACHABILITY_REPAIR_OPEN",
    );

    expect(byScenario.defer_stale_materialized_blocker_refs.deferReasonCodes).toContain(
      "MATERIALIZED_BLOCKERS_PRESENT",
    );
  });
});
