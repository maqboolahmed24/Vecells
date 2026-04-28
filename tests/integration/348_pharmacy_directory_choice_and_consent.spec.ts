import { describe, expect, it } from "vitest";

import {
  create348DirectoryHarness,
  discover348ChoiceBundle,
  seed348EligibleCase,
} from "./348_pharmacy_directory.helpers.ts";

describe("348 pharmacy directory choice and consent", () => {
  it("requires warned-choice acknowledgement before consent for manual-supported providers", async () => {
    const harness = create348DirectoryHarness();
    const { evaluated } = await seed348EligibleCase(harness, "348_choice_consent");
    const caseSnapshot = evaluated.caseMutation.pharmacyCase;

    const discovered = await discover348ChoiceBundle({
      harness,
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
    });

    const selected = await harness.directoryService.selectProvider({
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
      providerRef: "provider_A10002",
      actorRef: "actor_348_choice_consent",
      expectedChoiceRevision: discovered.choiceSession.revision,
      commandActionRecordRef: "select_action_348_choice_consent",
      commandSettlementRecordRef: "select_settlement_348_choice_consent",
      recordedAt: "2026-04-23T12:05:00.000Z",
      leaseRef: caseSnapshot.leaseRef,
      expectedOwnershipEpoch: caseSnapshot.ownershipEpoch,
      expectedLineageFenceRef: caseSnapshot.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_348_choice_consent_select",
      reasonCode: "select_provider",
      idempotencyKey: "348_choice_consent_select",
    });

    expect(selected.choiceSession.patientOverrideRequired).toBe(true);
    expect(selected.caseMutation.pharmacyCase.status).toBe("consent_pending");
    await expect(
      harness.directoryService.capturePharmacyConsent({
        pharmacyCaseId: caseSnapshot.pharmacyCaseId,
        consentScriptVersion: "consent_script_v1",
        actorRef: "actor_348_choice_consent",
        expectedSelectionBindingHash: selected.choiceSession.selectionBindingHash!,
        referralScope: "pharmacy_first_referral",
        channel: "staff_assisted",
        patientAwarenessOfGpVisibility: true,
        recordedAt: "2026-04-23T12:06:00.000Z",
        leaseRef: selected.caseMutation.pharmacyCase.leaseRef,
        expectedOwnershipEpoch: selected.caseMutation.pharmacyCase.ownershipEpoch,
        expectedLineageFenceRef: selected.caseMutation.pharmacyCase.lineageFenceRef,
        scopedMutationGateRef: "scope_gate_348_choice_consent_capture_fail",
        reasonCode: "capture_consent",
        idempotencyKey: "348_choice_consent_capture_fail",
      }),
    ).rejects.toMatchObject({
      code: "WARNED_CHOICE_ACKNOWLEDGEMENT_REQUIRED",
    });

    const acknowledged = await harness.directoryService.acknowledgeWarnedChoice({
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
      acknowledgementScriptRef: "warn.manual_route.same_day",
      actorRef: "actor_348_choice_consent",
      actorRole: "staff",
      expectedChoiceRevision: selected.choiceSession.revision,
      recordedAt: "2026-04-23T12:07:00.000Z",
      leaseRef: selected.caseMutation.pharmacyCase.leaseRef,
      expectedOwnershipEpoch: selected.caseMutation.pharmacyCase.ownershipEpoch,
      expectedLineageFenceRef: selected.caseMutation.pharmacyCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_348_choice_consent_ack",
      reasonCode: "ack_warned_choice",
      idempotencyKey: "348_choice_consent_ack",
    });

    const consent = await harness.directoryService.capturePharmacyConsent({
      pharmacyCaseId: caseSnapshot.pharmacyCaseId,
      consentScriptVersion: "consent_script_v1",
      actorRef: "actor_348_choice_consent",
      expectedSelectionBindingHash: acknowledged.choiceSession.selectionBindingHash!,
      referralScope: "pharmacy_first_referral",
      channel: "staff_assisted",
      patientAwarenessOfGpVisibility: true,
      recordedAt: "2026-04-23T12:08:00.000Z",
      leaseRef: selected.caseMutation.pharmacyCase.leaseRef,
      expectedOwnershipEpoch: selected.caseMutation.pharmacyCase.ownershipEpoch,
      expectedLineageFenceRef: selected.caseMutation.pharmacyCase.lineageFenceRef,
      scopedMutationGateRef: "scope_gate_348_choice_consent_capture",
      reasonCode: "capture_consent",
      packageFingerprint: "pkg_fingerprint_348",
      idempotencyKey: "348_choice_consent_capture",
    });

    expect(acknowledged.choiceSession.patientOverrideRequired).toBe(false);
    expect(consent.consentCheckpoint.checkpointState).toBe("satisfied");
    expect(consent.choiceSession.sessionState).toBe("completed");
    expect(consent.choiceTruthProjection.projectionState).toBe("read_only_provenance");
  });
});
