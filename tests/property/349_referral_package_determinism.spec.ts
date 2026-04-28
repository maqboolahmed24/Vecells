import { describe, expect, it } from "vitest";

import {
  build349DraftInput,
  create349PackageHarness,
  load349CurrentCase,
  seed349ConsentReadyCase,
} from "../integration/349_pharmacy_referral_package.helpers.ts";

describe("349 referral package determinism", () => {
  it("derives the same package tuple and representation identifiers for the same seeded case", async () => {
    const harnessA = create349PackageHarness();
    const seedStateA = await seed349ConsentReadyCase({
      harness: harnessA,
      seed: "349_prop_same_seed",
    });
    const draftInputA = build349DraftInput({ seedState: seedStateA });
    const draftA = await harnessA.packageService.composeDraftPackage(draftInputA);
    const caseA = await load349CurrentCase(harnessA, seedStateA.pharmacyCaseId);
    const frozenA = await harnessA.packageService.freezePackage({
      ...draftInputA,
      actorRef: "actor_349_prop",
      commandActionRecordRef: "freeze_action_349_prop",
      commandSettlementRecordRef: "freeze_settlement_349_prop",
      recordedAt: "2026-04-23T12:11:00.000Z",
      leaseRef: caseA.leaseRef,
      expectedOwnershipEpoch: caseA.ownershipEpoch,
      expectedLineageFenceRef: caseA.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_prop",
      reasonCode: "freeze_package",
      draftPackageId: draftA.package.packageId,
      idempotencyKey: "freeze_349_prop",
    });

    const harnessB = create349PackageHarness();
    const seedStateB = await seed349ConsentReadyCase({
      harness: harnessB,
      seed: "349_prop_same_seed",
    });
    const draftInputB = build349DraftInput({ seedState: seedStateB });
    const draftB = await harnessB.packageService.composeDraftPackage(draftInputB);
    const caseB = await load349CurrentCase(harnessB, seedStateB.pharmacyCaseId);
    const frozenB = await harnessB.packageService.freezePackage({
      ...draftInputB,
      actorRef: "actor_349_prop",
      commandActionRecordRef: "freeze_action_349_prop",
      commandSettlementRecordRef: "freeze_settlement_349_prop",
      recordedAt: "2026-04-23T12:11:00.000Z",
      leaseRef: caseB.leaseRef,
      expectedOwnershipEpoch: caseB.ownershipEpoch,
      expectedLineageFenceRef: caseB.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_prop",
      reasonCode: "freeze_package",
      draftPackageId: draftB.package.packageId,
      idempotencyKey: "freeze_349_prop",
    });

    expect(frozenA.packageBundle.package.packageFingerprint).toBe(
      frozenB.packageBundle.package.packageFingerprint,
    );
    expect(frozenA.packageBundle.package.packageHash).toBe(
      frozenB.packageBundle.package.packageHash,
    );
    expect(frozenA.packageBundle.package.fhirRepresentationSetRef).toBe(
      frozenB.packageBundle.package.fhirRepresentationSetRef,
    );
  });
});
