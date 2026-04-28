import { describe, expect, it } from "vitest";

import {
  buildChooseProviderCommand,
  buildCreatePharmacyCaseCommand,
  buildEvaluateCommand,
  buildReserveAuthorityCommand,
} from "../integration/346_pharmacy_case.helpers.ts";
import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts";

describe("346 pharmacy case idempotency and stale-write properties", () => {
  it("keeps one governed case identity across create and evaluate replays", async () => {
    const service = createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });

    const createCommand = buildCreatePharmacyCaseCommand("346_property_replay");
    const created = await service.createPharmacyCase(createCommand);
    const replayedCreate = await service.createPharmacyCase(createCommand);

    const evaluateCommand = buildEvaluateCommand(created.pharmacyCase, "346_property_replay");
    const evaluated = await service.evaluatePharmacyCase(evaluateCommand);
    const replayedEvaluate = await service.evaluatePharmacyCase(evaluateCommand);

    expect(replayedCreate.pharmacyCase.pharmacyCaseId).toBe(created.pharmacyCase.pharmacyCaseId);
    expect(replayedEvaluate.pharmacyCase.pharmacyCaseId).toBe(
      evaluated.pharmacyCase.pharmacyCaseId,
    );
  });

  it("materializes stale-owner recovery for stale lease, stale epoch, and stale fence attempts", async () => {
    const variants = [
      {
        suffix: "lease",
        overrides: {
          leaseRef: {
            targetFamily: "RequestLifecycleLease" as const,
            refId: "stale_lease_property",
            ownerTask: "seq_342" as const,
          },
        },
      },
      {
        suffix: "epoch",
        overrides: {
          expectedOwnershipEpoch: 77,
        },
      },
      {
        suffix: "fence",
        overrides: {
          expectedLineageFenceRef: {
            targetFamily: "LineageFence" as const,
            refId: "stale_fence_property",
            ownerTask: "seq_342" as const,
          },
        },
      },
    ];

    for (const variant of variants) {
      const service = createPhase6PharmacyCaseKernelService({
        repositories: createPhase6PharmacyCaseKernelStore(),
      });
      const created = await service.createPharmacyCase(
        buildCreatePharmacyCaseCommand(`346_property_${variant.suffix}`),
      );
      const evaluated = await service.evaluatePharmacyCase(
        buildEvaluateCommand(created.pharmacyCase, `346_property_${variant.suffix}`),
      );

      await expect(
        service.choosePharmacyProvider(
          buildChooseProviderCommand(
            evaluated.pharmacyCase,
            `346_property_${variant.suffix}`,
            variant.overrides,
          ),
        ),
      ).rejects.toMatchObject({
        code:
          variant.suffix === "lease"
            ? "STALE_REQUEST_LIFECYCLE_LEASE"
            : variant.suffix === "epoch"
              ? "STALE_OWNERSHIP_EPOCH"
              : "STALE_LINEAGE_FENCE",
      });

      const staleBundle = await service.getPharmacyCase(evaluated.pharmacyCase.pharmacyCaseId);
      expect(staleBundle?.staleOwnerRecovery?.recoveryState).toBe("pending");

      const reserved = await service.reserveMutationAuthority(
        buildReserveAuthorityCommand(
          staleBundle!.pharmacyCase,
          `346_property_${variant.suffix}`,
        ),
      );

      expect(reserved.pharmacyCase.staleOwnerRecoveryRef).toBeNull();
      expect(reserved.pharmacyCase.ownershipEpoch).toBeGreaterThan(
        staleBundle!.pharmacyCase.ownershipEpoch,
      );
    }
  });
});
