import { describe, expect, it } from "vitest";

import {
  build349ContentInput,
  build349DraftInput,
  create349PackageHarness,
  load349CurrentCase,
  seed349ConsentReadyCase,
} from "./349_pharmacy_referral_package.helpers.ts";

describe("349 pharmacy referral package supersession and invalidation", () => {
  it("supersedes the prior frozen package when package semantics change", async () => {
    const harness = create349PackageHarness();
    const seedState = await seed349ConsentReadyCase({
      harness,
      seed: "349_supersede",
    });

    const firstDraftInput = build349DraftInput({ seedState });
    const firstDraft = await harness.packageService.composeDraftPackage(firstDraftInput);
    const firstCurrentCase = await load349CurrentCase(harness, seedState.pharmacyCaseId);
    const firstFreeze = await harness.packageService.freezePackage({
      ...firstDraftInput,
      actorRef: "actor_349_supersede",
      commandActionRecordRef: "freeze_action_349_supersede_1",
      commandSettlementRecordRef: "freeze_settlement_349_supersede_1",
      recordedAt: "2026-04-23T12:11:00.000Z",
      leaseRef: firstCurrentCase.leaseRef,
      expectedOwnershipEpoch: firstCurrentCase.ownershipEpoch,
      expectedLineageFenceRef: firstCurrentCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_supersede_1",
      reasonCode: "freeze_package",
      draftPackageId: firstDraft.package.packageId,
      idempotencyKey: "freeze_349_supersede_1",
    });

    const secondDraftInput = build349DraftInput({
      seedState,
      compiledPolicyBundleRef: `${seedState.rulePackId}::compiled_policy_bundle_v2`,
      contentInput: build349ContentInput(seedState.pharmacyCaseId, {
        clinicalSummary: {
          sourceArtifactRef: `clinical_summary_${seedState.pharmacyCaseId}`,
          sourceHash: `hash_clinical_summary_${seedState.pharmacyCaseId}_v2`,
          label: "Clinical summary",
          summaryText: `Updated clinical summary for ${seedState.pharmacyCaseId}`,
          derivationRef: "ClinicalSummary",
        },
      }),
    });
    const secondDraft = await harness.packageService.composeDraftPackage(secondDraftInput);
    const secondCurrentCase = await load349CurrentCase(harness, seedState.pharmacyCaseId);
    const secondFreeze = await harness.packageService.freezePackage({
      ...secondDraftInput,
      actorRef: "actor_349_supersede",
      commandActionRecordRef: "freeze_action_349_supersede_2",
      commandSettlementRecordRef: "freeze_settlement_349_supersede_2",
      recordedAt: "2026-04-23T12:20:00.000Z",
      leaseRef: secondCurrentCase.leaseRef,
      expectedOwnershipEpoch: secondCurrentCase.ownershipEpoch,
      expectedLineageFenceRef: secondCurrentCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_supersede_2",
      reasonCode: "freeze_package",
      draftPackageId: secondDraft.package.packageId,
      idempotencyKey: "freeze_349_supersede_2",
    });

    expect(secondFreeze.packageBundle.package.packageId).not.toBe(
      firstFreeze.packageBundle.package.packageId,
    );

    const oldPackage = await harness.packageService.getPackageById(
      firstFreeze.packageBundle.package.packageId,
    );
    expect(oldPackage?.package.packageState).toBe("superseded");
    expect(oldPackage?.package.supersededByPackageRef?.refId).toBe(
      secondFreeze.packageBundle.package.packageId,
    );
  });

  it("invalidates the frozen package when consent no longer matches the tuple", async () => {
    const harness = create349PackageHarness();
    const seedState = await seed349ConsentReadyCase({
      harness,
      seed: "349_invalidate",
    });
    const draftInput = build349DraftInput({ seedState });
    const draft = await harness.packageService.composeDraftPackage(draftInput);
    const freezeCase = await load349CurrentCase(harness, seedState.pharmacyCaseId);
    const frozen = await harness.packageService.freezePackage({
      ...draftInput,
      actorRef: "actor_349_invalidate",
      commandActionRecordRef: "freeze_action_349_invalidate",
      commandSettlementRecordRef: "freeze_settlement_349_invalidate",
      recordedAt: "2026-04-23T12:11:00.000Z",
      leaseRef: freezeCase.leaseRef,
      expectedOwnershipEpoch: freezeCase.ownershipEpoch,
      expectedLineageFenceRef: freezeCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_invalidate_freeze",
      reasonCode: "freeze_package",
      draftPackageId: draft.package.packageId,
      idempotencyKey: "freeze_349_invalidate",
    });

    const currentCase = await load349CurrentCase(harness, seedState.pharmacyCaseId);
    await harness.directoryService.revokeOrSupersedeConsent({
      pharmacyCaseId: seedState.pharmacyCaseId,
      reasonCode: "withdrawn_by_patient",
      actorRef: "actor_349_invalidate",
      recordedAt: "2026-04-23T12:16:00.000Z",
      leaseRef: currentCase.leaseRef,
      expectedOwnershipEpoch: currentCase.ownershipEpoch,
      expectedLineageFenceRef: currentCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_invalidate_revoke",
      idempotencyKey: "revoke_349_invalidate",
    });

    const invalidCase = await load349CurrentCase(harness, seedState.pharmacyCaseId);
    await expect(
      harness.packageService.freezePackage({
        ...draftInput,
        actorRef: "actor_349_invalidate",
        commandActionRecordRef: "freeze_action_349_invalidate_retry",
        commandSettlementRecordRef: "freeze_settlement_349_invalidate_retry",
        recordedAt: "2026-04-23T12:17:00.000Z",
        leaseRef: invalidCase.leaseRef,
        expectedOwnershipEpoch: invalidCase.ownershipEpoch,
        expectedLineageFenceRef: invalidCase.lineageFenceRef,
        scopedMutationGateRef: "scope_gate_349_invalidate_retry",
        reasonCode: "freeze_package",
        idempotencyKey: "freeze_349_invalidate_retry",
      }),
    ).rejects.toMatchObject({
      code: "PACKAGE_TUPLE_INVALID",
    });

    const invalidated = await harness.packageService.getPackageById(
      frozen.packageBundle.package.packageId,
    );
    expect(invalidated?.package.packageState).toBe("invalidated");
    expect(invalidated?.package.invalidationReasonCode).toBeTruthy();
  });
});
