import { describe, expect, it } from "vitest";

import {
  create348DirectoryHarness,
  discover348ChoiceBundle,
  reconfigure348DirectoryService,
  seed348EligibleCase,
} from "./348_pharmacy_directory.helpers.ts";

describe("348 pharmacy directory replay and drift", () => {
  it("supersedes granted consent and forces recovery when the selected provider falls out of the visible set", async () => {
    const harness = create348DirectoryHarness();
    const { evaluated } = await seed348EligibleCase(harness, "348_drift");
    const caseSnapshot = evaluated.caseMutation.pharmacyCase;

    const discovered = await discover348ChoiceBundle({
      harness,
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
    });
    const selected = await harness.directoryService.selectProvider({
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
      providerRef: "provider_A10001",
      actorRef: "actor_348_drift",
      expectedChoiceRevision: discovered.choiceSession.revision,
      commandActionRecordRef: "select_action_348_drift",
      commandSettlementRecordRef: "select_settlement_348_drift",
      recordedAt: "2026-04-23T12:05:00.000Z",
      leaseRef: caseSnapshot.leaseRef,
      expectedOwnershipEpoch: caseSnapshot.ownershipEpoch,
      expectedLineageFenceRef: caseSnapshot.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_348_drift_select",
      reasonCode: "select_provider",
      idempotencyKey: "348_drift_select",
    });
    const consent = await harness.directoryService.capturePharmacyConsent({
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
      consentScriptVersion: "consent_script_v1",
      actorRef: "actor_348_drift",
      expectedSelectionBindingHash: selected.choiceSession.selectionBindingHash!,
      referralScope: "pharmacy_first_referral",
      channel: "patient_direct",
      patientAwarenessOfGpVisibility: true,
      recordedAt: "2026-04-23T12:06:00.000Z",
      leaseRef: selected.caseMutation.pharmacyCase.leaseRef,
      expectedOwnershipEpoch: selected.caseMutation.pharmacyCase.ownershipEpoch,
      expectedLineageFenceRef: selected.caseMutation.pharmacyCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_348_drift_capture",
      reasonCode: "capture_consent",
      idempotencyKey: "348_drift_capture",
    });

    const driftedService = reconfigure348DirectoryService({
      directoryService: harness.directoryService,
      scenario: "providerDriftScenario",
    });
    const refreshed = await driftedService.discoverProvidersForCase({
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
      location: harness.location,
      audience: "patient",
      refreshMode: "force_refresh",
      evaluatedAt: "2026-04-23T13:50:00.000Z",
    });

    const latestConsent = (
      await harness.repositories.getLatestConsentRecordForCase(caseSnapshot.pharmacyCaseId)
    )?.toSnapshot();
    const latestCheckpoint = (
      await harness.repositories.getLatestConsentCheckpointForCase(caseSnapshot.pharmacyCaseId)
    )?.toSnapshot();

    expect(consent.consentRecord.state).toBe("granted");
    expect(refreshed.choiceSession.sessionState).toBe("recovery_required");
    expect(refreshed.choiceTruthProjection.projectionState).toBe("recovery_required");
    expect(refreshed.choiceSession.selectedProviderRef?.refId).toBe("provider_A10001");
    expect(refreshed.choiceProof.visibleProviderRefs.map((ref) => ref.refId)).toEqual([
      "provider_A10001",
    ]);
    expect(latestConsent?.state).toBe("superseded");
    expect(latestCheckpoint?.checkpointState).toBe("superseded");
    expect(latestCheckpoint?.continuityState).toBe("stale");
  });
});
