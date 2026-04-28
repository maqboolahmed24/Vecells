import { describe, expect, it } from "vitest";

import {
  buildEvidence,
  create347EligibilityService,
  evaluateSeededCase,
  positivePathwayEvidence,
  seed347Fixtures,
} from "./347_rule_pack.helpers.ts";
import {
  create348DirectoryHarness,
  discover348ChoiceBundle,
  reconfigure348DirectoryService,
  seed348EligibleCase,
} from "./348_pharmacy_directory.helpers.ts";
import {
  create350DispatchHarness,
  load350CurrentCase,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "./350_pharmacy_dispatch.helpers.ts";
import {
  create352OutcomeHarness,
  ingest352Outcome,
  project352PatientStatus,
  seed352OutcomeReadyCase,
} from "./352_pharmacy_outcome.helpers.ts";
import { createStaticPharmacyDiscoveryAdapter } from "../../packages/domains/pharmacy/src/index.ts";

describe("369 phase6 core eligibility directory dispatch and reconciliation suite", () => {
  it("proves eligible and fail-closed eligibility dispositions", async () => {
    const { service } = create347EligibilityService();
    const rulePackId = await seed347Fixtures(service);

    const eligible = await evaluateSeededCase(service, {
      seed: "369_eligible",
      rulePackId,
      evidence: positivePathwayEvidence("acute_sore_throat_5_plus"),
    });
    const ineligible = await evaluateSeededCase(service, {
      seed: "369_ineligible",
      rulePackId,
      evidence: buildEvidence({
        patientAgeYears: 70,
        sexAtBirth: "male",
        symptomEvidence: {},
      }),
    });

    expect(eligible.evaluation.finalDisposition).toBe("eligible_choice_pending");
    expect(eligible.evaluation.pathwayCode).toBe("acute_sore_throat_5_plus");
    expect(eligible.caseMutation.pharmacyCase.status).toBe("eligible_choice_pending");
    expect(ineligible.evaluation.finalDisposition).toBe("ineligible_returned");
    expect(ineligible.evaluation.pathwayGateResult).toBe("hard_failed");
    expect(ineligible.caseMutation.pharmacyCase.status).toBe("ineligible_returned");
  });

  it("proves directory source, zero-provider, capability, and drift behavior", async () => {
    const harness = create348DirectoryHarness();
    const { evaluated } = await seed348EligibleCase(harness, "369_directory");
    const pharmacyCaseId = evaluated.caseMutation.pharmacyCase.pharmacyCaseId;

    const discovered = await discover348ChoiceBundle({
      harness,
      pharmacyCaseId,
    });
    const capabilityStates = discovered.providerCapabilitySnapshots.map(
      (capability) => capability.capabilityState,
    );

    expect(
      discovered.sourceSnapshots.some((source) => source.adapterMode === "dohs_service_search"),
    ).toBe(true);
    expect(discovered.choiceProof.recommendedProviderRefs.map((ref) => ref.refId)).toContain(
      "provider_A10001",
    );
    expect(discovered.choiceProof.warningVisibleProviderRefs.map((ref) => ref.refId)).toContain(
      "provider_A10002",
    );
    expect(discovered.choiceProof.suppressedUnsafeProviderRefs.map((ref) => ref.refId)).toContain(
      "provider_A10003",
    );
    expect(capabilityStates).toEqual(
      expect.arrayContaining(["direct_supported", "manual_supported", "unsupported"]),
    );

    const zeroHarness = create348DirectoryHarness();
    const zeroSeed = await seed348EligibleCase(zeroHarness, "369_zero_provider");
    zeroHarness.directoryService.adapters.clear();
    zeroHarness.directoryService.adapters.set(
      "dohs_service_search",
      createStaticPharmacyDiscoveryAdapter({
        mode: "dohs_service_search",
        version: "369-zero-provider",
        sourceLabel: "DoHS zero-provider proof",
        sourceTrustClass: "strategic",
        sourceFailureClassification: "source_unavailable",
        providers: [],
        capturedAt: "2026-04-23T11:00:00.000Z",
      }),
    );
    const zero = await zeroHarness.directoryService.discoverProvidersForCase({
      pharmacyCaseId: zeroSeed.evaluated.caseMutation.pharmacyCase.pharmacyCaseId,
      location: zeroHarness.location,
      audience: "patient",
      refreshMode: "force_refresh",
      evaluatedAt: "2026-04-23T12:00:00.000Z",
    });

    expect(zero.choiceProof.visibleProviderRefs).toHaveLength(0);
    expect(zero.sourceSnapshots[0]?.sourceFailureClassification).toBe("source_unavailable");

    reconfigure348DirectoryService({
      directoryService: harness.directoryService,
      scenario: "providerDriftScenario",
    });
    const drifted = await harness.directoryService.discoverProvidersForCase({
      pharmacyCaseId,
      location: harness.location,
      audience: "patient",
      refreshMode: "force_refresh",
      evaluatedAt: "2026-04-23T13:50:00.000Z",
    });
    expect(drifted.choiceTruthProjection.visibleChoiceSetHash).not.toBe(
      discovered.choiceTruthProjection.visibleChoiceSetHash,
    );
  });

  it("proves dispatch plan idempotency, authoritative proof, expiry, and stale consent blocking", async () => {
    const harness = create350DispatchHarness();
    const frozenState = await seed350FrozenPackageCase({
      harness,
      seed: "369_dispatch_idempotent",
    });

    const first = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "369_dispatch_submit",
    });
    const replay = await submit350Dispatch({
      harness,
      frozenState,
      sourceCommandId: "369_dispatch_submit",
    });

    expect(replay.dispatchBundle.attempt.dispatchAttemptId).toBe(
      first.dispatchBundle.attempt.dispatchAttemptId,
    );
    expect(first.dispatchBundle.settlement.result).toBe("pending_ack");
    expect(first.dispatchBundle.proofEnvelope.riskState).toBe("at_risk");

    const confirmed = await harness.dispatchService.ingestReceiptEvidence({
      dispatchAttemptId: first.dispatchBundle.attempt.dispatchAttemptId,
      lane: "authoritative",
      sourceClass: "authoritative_bars_response",
      recordedAt: "2026-04-23T15:24:00.000Z",
      transportMessageId: "bars_authoritative_message_369",
      orderingKey: "2026-04-23T15:24:00.000Z",
      rawEvidence: { proof: "structured-authoritative-ack" },
      semanticEvidence: { proof: "structured-authoritative-ack" },
      proofRef: "bars_proof_369",
      satisfiesHardMatchRefs: ["authoritative_dispatch_proof"],
    });
    expect(confirmed.proofEnvelope.proofState).toBe("satisfied");
    expect(confirmed.proofEnvelope.riskState).toBe("on_track");
    expect(confirmed.settlement.result).toBe("live_referral_confirmed");

    const expiryHarness = create350DispatchHarness();
    const expiryFrozen = await seed350FrozenPackageCase({
      harness: expiryHarness,
      seed: "369_dispatch_expiry",
    });
    const expirySubmitted = await submit350Dispatch({
      harness: expiryHarness,
      frozenState: expiryFrozen,
      sourceCommandId: "369_dispatch_expiry_submit",
      recordedAt: "2026-04-23T14:20:00.000Z",
    });
    const expired = await expiryHarness.dispatchService.expireStaleAttempts({
      now: "2026-04-23T16:30:00.000Z",
    });
    const expiredBundle = expired.find(
      (entry) =>
        entry.attempt.dispatchAttemptId ===
        expirySubmitted.dispatchBundle.attempt.dispatchAttemptId,
    );
    expect(expiredBundle?.proofEnvelope.proofState).toBe("expired");
    expect(expiredBundle?.settlement.result).toBe("reconciliation_required");

    const staleHarness = create350DispatchHarness();
    const staleFrozen = await seed350FrozenPackageCase({
      harness: staleHarness,
      seed: "369_stale_consent",
    });
    const checkpointDocument = await staleHarness.repositories.getConsentCheckpoint(
      staleFrozen.packageBundle.package.consentCheckpointRef.refId,
    );
    if (!checkpointDocument) {
      throw new Error("Consent checkpoint missing for stale consent proof.");
    }
    const checkpoint = checkpointDocument.toSnapshot();
    await staleHarness.repositories.saveConsentCheckpoint(
      {
        ...checkpoint,
        checkpointState: "expired",
        version: checkpoint.version + 1,
      },
      { expectedVersion: checkpoint.version },
    );
    await expect(
      submit350Dispatch({
        harness: staleHarness,
        frozenState: staleFrozen,
        sourceCommandId: "369_stale_consent_submit",
      }),
    ).rejects.toMatchObject({ code: "STALE_CHOICE_OR_CONSENT" });
    expect((await load350CurrentCase(staleHarness, staleFrozen.pharmacyCaseId)).status).toBe(
      "consent_pending",
    );
  });

  it("proves outcome ingest, replay, weak-match review, contradiction, unmatched, and no-silence completion", async () => {
    const harness = create352OutcomeHarness();
    const seeded = await seed352OutcomeReadyCase({
      harness,
      seed: "369_outcome_resolved",
    });

    const resolved = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "resolved_no_supply",
      sourceType: "gp_workflow_observation",
      recordedAt: "2026-04-23T18:00:00.000Z",
      sourceMessageKey: "369_exact_replay",
    });
    const duplicate = await ingest352Outcome({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      classificationState: "resolved_no_supply",
      sourceType: "gp_workflow_observation",
      recordedAt: "2026-04-23T18:00:00.000Z",
      sourceMessageKey: "369_exact_replay",
    });
    const projected = await project352PatientStatus({
      harness,
      pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
      recordedAt: "2026-04-23T18:05:00.000Z",
    });

    expect(resolved.settlement.result).toBe("resolved_pending_projection");
    expect(resolved.outcomeTruthProjection.outcomeTruthState).toBe("settled_resolved");
    expect(duplicate.settlement.result).toBe("duplicate_ignored");
    expect(projected.patientStatusProjection.currentMacroState).toBe("completed");

    const weakHarness = create352OutcomeHarness();
    const weakSeeded = await seed352OutcomeReadyCase({
      harness: weakHarness,
      seed: "369_outcome_weak",
    });
    const weak = await ingest352Outcome({
      harness: weakHarness,
      pharmacyCaseId: weakSeeded.currentCase.pharmacyCaseId,
      classificationState: "medicine_supplied",
      sourceType: "email_ingest",
      recordedAt: "2026-04-23T18:20:00.000Z",
      withTrustedCorrelation: false,
    });
    expect(weak.settlement.result).toBe("review_required");
    expect(weak.reconciliationGate?.gateState).toBe("open");
    expect(weak.outcomeTruthProjection.outcomeTruthState).toBe("review_required");

    const urgentHarness = create352OutcomeHarness();
    const urgentSeeded = await seed352OutcomeReadyCase({
      harness: urgentHarness,
      seed: "369_outcome_urgent",
    });
    const urgent = await ingest352Outcome({
      harness: urgentHarness,
      pharmacyCaseId: urgentSeeded.currentCase.pharmacyCaseId,
      classificationState: "urgent_gp_action",
      sourceType: "gp_workflow_observation",
      recordedAt: "2026-04-23T18:30:00.000Z",
    });
    expect(urgent.settlement.result).toBe("reopened_for_safety");
    expect(urgent.outcomeTruthProjection.outcomeTruthState).toBe("reopened_for_safety");

    const unmatchedHarness = create352OutcomeHarness();
    const unmatchedSeeded = await seed352OutcomeReadyCase({
      harness: unmatchedHarness,
      seed: "369_outcome_unmatched",
    });
    const unmatched = await ingest352Outcome({
      harness: unmatchedHarness,
      pharmacyCaseId: unmatchedSeeded.currentCase.pharmacyCaseId,
      classificationState: "medicine_supplied",
      sourceType: "email_ingest",
      recordedAt: "2026-04-23T18:40:00.000Z",
      withTrustedCorrelation: false,
      withExactProvider: false,
      withExactPatient: false,
    });
    expect(unmatched.settlement.result).toBe("unmatched");
    expect(unmatched.outcomeTruthProjection.outcomeTruthState).toBe("unmatched");

    const noOutcomeHarness = create352OutcomeHarness();
    const noOutcomeSeeded = await seed352OutcomeReadyCase({
      harness: noOutcomeHarness,
      seed: "369_no_silence_completion",
    });
    expect(noOutcomeSeeded.currentCase.status).not.toBe("resolved_by_pharmacy");
  });
});
