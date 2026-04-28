import { describe, expect, it } from "vitest";

import {
  build349DraftInput,
  create349PackageHarness,
  load349CurrentCase,
  seed349ConsentReadyCase,
} from "./349_pharmacy_referral_package.helpers.ts";

describe("349 pharmacy referral package freeze and replay", () => {
  it("freezes a canonical package, materializes FHIR once, and replays deterministically", async () => {
    const harness = create349PackageHarness();
    const seedState = await seed349ConsentReadyCase({
      harness,
      seed: "349_freeze_replay",
    });
    const draftInput = build349DraftInput({ seedState });
    const draft = await harness.packageService.composeDraftPackage(draftInput);
    const currentCase = await load349CurrentCase(harness, seedState.pharmacyCaseId);

    const frozen = await harness.packageService.freezePackage({
      ...draftInput,
      actorRef: "actor_349_freeze_replay",
      commandActionRecordRef: "freeze_action_349_freeze_replay",
      commandSettlementRecordRef: "freeze_settlement_349_freeze_replay",
      recordedAt: "2026-04-23T12:11:00.000Z",
      leaseRef: currentCase.leaseRef,
      expectedOwnershipEpoch: currentCase.ownershipEpoch,
      expectedLineageFenceRef: currentCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_freeze_replay_freeze",
      reasonCode: "freeze_package",
      draftPackageId: draft.package.packageId,
      idempotencyKey: "freeze_349_freeze_replay",
    });

    expect(frozen.packageBundle.package.packageState).toBe("frozen");
    expect(frozen.packageBundle.package.fhirRepresentationSetRef).toBeTruthy();
    expect(frozen.packageBundle.package.serviceRequestArtifactRef).not.toBeNull();
    expect(frozen.packageBundle.package.patientSummaryRef).not.toBeNull();
    expect(frozen.correlationRecord.packageId).toBe(frozen.packageBundle.package.packageId);
    expect(frozen.caseMutation?.pharmacyCase.status).toBe("package_ready");
    expect(
      frozen.packageBundle.contentGovernanceDecisions.map((decision) => decision.decisionState),
    ).toEqual(
      expect.arrayContaining([
        "included",
        "included_summary_only",
        "included_redaction_required",
        "unavailable",
      ]),
    );

    const replay = await harness.packageService.replayCanonicalRepresentationGeneration({
      packageId: frozen.packageBundle.package.packageId,
      generatedAt: "2026-04-23T12:12:00.000Z",
    });
    expect(replay.replayed).toBe(true);
    expect(replay.representationSetId).toBe(
      frozen.packageBundle.package.fhirRepresentationSetRef,
    );

    const idempotentReplay = await harness.packageService.freezePackage({
      ...draftInput,
      actorRef: "actor_349_freeze_replay",
      commandActionRecordRef: "freeze_action_349_freeze_replay",
      commandSettlementRecordRef: "freeze_settlement_349_freeze_replay",
      recordedAt: "2026-04-23T12:13:00.000Z",
      leaseRef: (
        await load349CurrentCase(harness, seedState.pharmacyCaseId)
      ).leaseRef,
      expectedOwnershipEpoch: (
        await load349CurrentCase(harness, seedState.pharmacyCaseId)
      ).ownershipEpoch,
      expectedLineageFenceRef: (
        await load349CurrentCase(harness, seedState.pharmacyCaseId)
      ).lineageFenceRef,
      scopedMutationGateRef: "scope_gate_349_freeze_replay_freeze",
      reasonCode: "freeze_package",
      idempotencyKey: "freeze_349_freeze_replay",
    });
    expect(idempotentReplay.replayed).toBe(true);
    expect(idempotentReplay.packageBundle.package.packageId).toBe(
      frozen.packageBundle.package.packageId,
    );
  });
});
