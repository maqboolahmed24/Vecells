import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { writePhase7ChannelReconciliationArtifacts } from "../../tools/conformance/reconcile_473_phase7_deferred_channel";

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

describe("task 473 Phase 7 deferred reconciliation output", () => {
  beforeAll(() => {
    writePhase7ChannelReconciliationArtifacts();
  });

  it("preserves the task 472 deferred Phase 7 row while keeping the core scorecard exact", () => {
    const reconciliation = readJson<any>(
      "data/conformance/473_phase7_channel_readiness_reconciliation.json",
    );
    const patch = readJson<any>("data/conformance/473_phase7_phase_conformance_row_patch.json");
    const masterAfter = readJson<any>(
      "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    );

    expect(reconciliation.readinessPredicate.state).toBe("deferred");
    expect(patch.patchState).toBe("deferred_preserved");
    expect(patch.rowStateAfterPatch).toBe("deferred_scope");
    expect(patch.mandatoryForCurrentCoreReleaseAfterPatch).toBe(false);
    expect(patch.channelActivationPermitted).toBe(false);
    expect(masterAfter.scorecardState).toBe("exact");
    expect(masterAfter.coreReleaseScorecardStillExact).toBe(true);
    expect(masterAfter.preserved472DeferredScope).toBe(true);
    expect(masterAfter.phase7ChannelReadinessState).toBe("deferred");
  });

  it("makes missing future activation authority explicit", () => {
    const reconciliation = readJson<any>(
      "data/conformance/473_phase7_channel_readiness_reconciliation.json",
    );
    const blockers = readJson<any>("data/conformance/473_phase7_deferred_scope_blockers.json");

    expect(
      reconciliation.readinessPredicate.optionalFutureInputStates.map((input: any) => [
        input.taskId,
        input.availabilityState,
      ]),
    ).toEqual([
      ["seq_476", "not_yet_available"],
      ["seq_477", "not_yet_available"],
      ["seq_481", "not_yet_available"],
      ["seq_482", "not_yet_available"],
      ["seq_483", "not_yet_available"],
      ["seq_486", "not_yet_available"],
    ]);
    expect(blockers.blockers.map((blocker: any) => blocker.reasonCode)).toEqual(
      expect.arrayContaining([
        "future_channel_enablement_authority_not_yet_available",
        "channel_exposure_flag_must_stay_off",
        "external_nhs_app_approval_not_claimed_by_local_exit_gate",
      ]),
    );
    expect(
      blockers.blockers.every((blocker: any) => blocker.blockerHash.match(/^[a-f0-9]{64}$/)),
    ).toBe(true);
  });
});
