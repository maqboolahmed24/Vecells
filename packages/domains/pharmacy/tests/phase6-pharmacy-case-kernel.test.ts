import { describe, expect, it } from "vitest";

import {
  buildCaptureOutcomeCommand,
  buildChooseProviderCommand,
  buildCloseCommand,
  buildCreatePharmacyCaseCommand,
  buildDispatchCommand,
  buildEvaluateCommand,
  buildReserveAuthorityCommand,
  progressCaseToResolved,
  setupEvaluatedEligibleCase,
} from "../../../../tests/integration/346_pharmacy_case.helpers.ts";
import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
} from "../src/phase6-pharmacy-case-kernel.ts";

describe("phase6 pharmacy case kernel", () => {
  it("creates a governed pharmacy lineage case and evaluates to eligible choice", async () => {
    const service = createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });

    const created = await service.createPharmacyCase(
      buildCreatePharmacyCaseCommand("346_unit_create"),
    );
    const evaluated = await service.evaluatePharmacyCase(
      buildEvaluateCommand(created.pharmacyCase, "346_unit_create"),
    );

    expect(created.replayed).toBe(false);
    expect(created.pharmacyCase.status).toBe("candidate_received");
    expect(created.lineageCaseLink.caseFamily).toBe("pharmacy");
    expect(created.lineageCaseLink.ownershipState).toBe("active");
    expect(evaluated.pharmacyCase.status).toBe("eligible_choice_pending");
    expect(evaluated.transitionJournalEntries.map((entry) => entry.transitionEvent)).toEqual([
      "pharmacy.service_type.resolved",
      "pharmacy.pathway.evaluated",
    ]);
  });

  it("writes stale-owner recovery and rejects calm progression on stale ownership epoch", async () => {
    const { service, created } = await setupEvaluatedEligibleCase("346_unit_stale");

    await expect(
      service.choosePharmacyProvider(
        buildChooseProviderCommand(created.pharmacyCase, "346_unit_stale", {
          expectedOwnershipEpoch: created.pharmacyCase.ownershipEpoch + 5,
        }),
      ),
    ).rejects.toMatchObject({
      code: "STALE_OWNERSHIP_EPOCH",
    });

    const bundle = await service.getPharmacyCase(created.pharmacyCase.pharmacyCaseId);
    expect(bundle?.pharmacyCase.status).toBe("eligible_choice_pending");
    expect(bundle?.pharmacyCase.staleOwnerRecoveryRef?.targetFamily).toBe(
      "StaleOwnershipRecoveryRecord",
    );
    expect(bundle?.transitionJournal.at(-1)?.failureCode).toBe("STALE_OWNERSHIP_EPOCH");
  });

  it("clears pending stale-owner recovery when mutation authority is reacquired", async () => {
    const { service, evaluated } = await setupEvaluatedEligibleCase("346_unit_reserve");

    await expect(
      service.choosePharmacyProvider(
        buildChooseProviderCommand(evaluated.pharmacyCase, "346_unit_reserve", {
          expectedLineageFenceRef: {
            targetFamily: "LineageFence",
            refId: "stale_lineage_fence_346_unit_reserve",
            ownerTask: "seq_342",
          },
        }),
      ),
    ).rejects.toMatchObject({
      code: "STALE_LINEAGE_FENCE",
    });

    const staleBundle = await service.getPharmacyCase(evaluated.pharmacyCase.pharmacyCaseId);
    expect(staleBundle?.staleOwnerRecovery?.recoveryState).toBe("pending");

    const reserved = await service.reserveMutationAuthority(
      buildReserveAuthorityCommand(staleBundle!.pharmacyCase, "346_unit_reserve"),
    );

    expect(reserved.pharmacyCase.staleOwnerRecoveryRef).toBeNull();
    expect(reserved.staleOwnerRecovery?.recoveryState).toBe("resolved");
    expect(reserved.pharmacyCase.ownershipEpoch).toBeGreaterThan(
      staleBundle!.pharmacyCase.ownershipEpoch,
    );
  });

  it("blocks close while confirmation gates remain open", async () => {
    const { service, evaluated } = await setupEvaluatedEligibleCase("346_unit_close_block");
    const chosen = await service.choosePharmacyProvider(
      buildChooseProviderCommand(evaluated.pharmacyCase, "346_unit_close_block"),
    );
    const dispatched = await service.dispatchPharmacyReferral(
      buildDispatchCommand(chosen.pharmacyCase, "346_unit_close_block", {
        currentConfirmationGateRefs: [
          {
            targetFamily: "ExternalConfirmationGate",
            refId: "confirmation_gate_346_unit_close_block",
            ownerTask:
              "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts",
          },
        ],
      }),
    );
    const resolved = await service.capturePharmacyOutcome(
      buildCaptureOutcomeCommand(dispatched.pharmacyCase, "346_unit_close_block"),
    );

    await expect(
      service.closePharmacyCase(
        buildCloseCommand(resolved.pharmacyCase, "346_unit_close_block"),
      ),
    ).rejects.toMatchObject({
      code: "CONFIRMATION_GATE_OPEN",
    });

    const bundle = await service.getPharmacyCase(resolved.pharmacyCase.pharmacyCaseId);
    expect(bundle?.pharmacyCase.status).toBe("resolved_by_pharmacy");
    expect(bundle?.transitionJournal.at(-1)?.failureCode).toBe("CONFIRMATION_GATE_OPEN");
  });
});
