import { describe, expect, it } from "vitest";
import { createIdentityEvidenceVaultApplication } from "../src/identity-evidence-vault.ts";
import {
  createInMemoryTelephonyIdentityBindingAuthorityPort,
  createInMemoryTelephonyVerificationRepository,
  createSeedTelephonyVerificationCalibrationRepository,
  createTelephonyVerificationApplication,
  telephonyVerificationGapResolutions,
  telephonyVerificationHashIdentifier,
  telephonyVerificationMigrationPlanRefs,
  telephonyVerificationPersistenceTables,
} from "../src/telephony-verification-pipeline.ts";

const callSessionRef = "call_session_189_demo";
const subjectRef = "subject_tel_189_demo";
const observedAt = "2026-04-15T13:00:00.000Z";
const raw = {
  nhsNumber: "9434765919",
  dateOfBirth: "1980-02-03",
  surname: "Okafor",
  postcode: "SW1A 1AA",
  phone: "+447700900189",
};

function patientRecord(overrides = {}) {
  const phoneHash = telephonyVerificationHashIdentifier("caller_id_hint", raw.phone);
  return {
    candidatePatientRef: overrides.candidatePatientRef ?? "patient_189_okafor",
    candidateLabel: overrides.candidateLabel ?? "Candidate A",
    patientLinkCandidateRef: overrides.patientLinkCandidateRef ?? "plc_189_okafor",
    identityAttributeHashes: {
      nhsNumberHash:
        overrides.nhsNumberHash ??
        telephonyVerificationHashIdentifier("nhs_number", raw.nhsNumber),
      dateOfBirthHash:
        overrides.dateOfBirthHash ??
        telephonyVerificationHashIdentifier("date_of_birth", raw.dateOfBirth),
      surnameHash:
        overrides.surnameHash ?? telephonyVerificationHashIdentifier("surname", raw.surname),
      postcodeHash:
        overrides.postcodeHash ??
        telephonyVerificationHashIdentifier("postcode", raw.postcode),
      callerIdHintHash: overrides.callerIdHintHash ?? phoneHash,
    },
    destinationHashes: {
      verifiedSmsDestinationHash: overrides.verifiedSmsDestinationHash ?? phoneHash,
      verifiedCallbackNumberHash: overrides.verifiedCallbackNumberHash ?? phoneHash,
      handsetStepUpBindingHash: overrides.handsetStepUpBindingHash ?? "handset_189_okafor",
    },
    candidateSourceRef: overrides.candidateSourceRef ?? "patient_linker_fixture_189",
  };
}

function createApp({ records = [patientRecord()], authorityPort } = {}) {
  const vault = createIdentityEvidenceVaultApplication();
  const repository = createInMemoryTelephonyVerificationRepository({
    patientIndexRecords: records,
  });
  const app = createTelephonyVerificationApplication({
    evidenceVault: vault.evidenceVault,
    repository,
    authorityPort,
  });
  return { app, repository, vault };
}

async function appendCapture(app, fieldFamily, rawValue, index, captureSource = "ivr") {
  return app.service.appendIdentifierCapture({
    callSessionRef,
    routeSensitivity: "sms_continuation",
    fieldFamily,
    rawValue,
    captureSource,
    actorRef: "telephony_operator_189",
    idempotencyKey: `idem_${fieldFamily}_${index}`,
    provenanceRef: `prov_${fieldFamily}_${index}`,
    capturedAt: new Date(Date.parse(observedAt) + index * 1000).toISOString(),
  });
}

async function appendStrongCaptures(app, options = {}) {
  await appendCapture(app, "surname", raw.surname, 3, "speech");
  await appendCapture(app, "nhs_number", raw.nhsNumber, 1);
  await appendCapture(app, "date_of_birth", raw.dateOfBirth, 2);
  await appendCapture(app, "postcode", raw.postcode, 4, "speech");
  await appendCapture(app, "caller_id_hint", raw.phone, 5, "provider_callback");
  if (options.withDestinationProof !== false) {
    await appendCapture(app, "verified_callback", true, 6, "provider_callback");
    await appendCapture(app, "handset_step_up_proof", true, 7, "handset_step_up");
  }
  await appendCapture(app, "ivr_consistency", "consistent", 8, "ivr");
}

function expectNoRawTelephonyLeak(value) {
  const text = JSON.stringify(value);
  expect(text).not.toContain(raw.nhsNumber);
  expect(text).not.toContain(raw.dateOfBirth);
  expect(text).not.toContain(raw.surname);
  expect(text).not.toContain(raw.postcode);
  expect(text).not.toContain(raw.phone);
}

describe("TelephonyVerificationPipeline", () => {
  it("captures identifiers in controlled order and persists raw values only in the evidence vault", async () => {
    const { app, repository, vault } = createApp();
    await appendStrongCaptures(app);
    const snapshots = repository.snapshots();
    const captureFamilies = snapshots.captureAttempts.map((capture) => capture.fieldFamily);

    expect(app.migrationPlanRefs).toEqual(telephonyVerificationMigrationPlanRefs);
    expect(app.persistenceTables).toEqual(telephonyVerificationPersistenceTables);
    expect(app.gapResolutions).toEqual(telephonyVerificationGapResolutions);
    expect(captureFamilies).toEqual([
      "nhs_number",
      "date_of_birth",
      "surname",
      "postcode",
      "caller_id_hint",
      "verified_callback",
      "handset_step_up_proof",
      "ivr_consistency",
    ]);
    expect(snapshots.captureAttempts.every((capture) => capture.vaultEvidenceRef)).toBe(true);
    expect(snapshots.captureAttempts.every((capture) => capture.normalizedValueHash)).toBe(true);
    expectNoRawTelephonyLeak(snapshots);
    expect(vault.repositories.snapshots().envelopes).toHaveLength(8);
  });

  it("resolves candidates and emits a seeded decision from lower-bound identity and destination thresholds", async () => {
    const authorityPort = createInMemoryTelephonyIdentityBindingAuthorityPort();
    const { app } = createApp({ authorityPort });
    await appendStrongCaptures(app);

    const result = await app.service.evaluateVerification({
      callSessionRef,
      routeSensitivity: "sms_continuation",
      subjectRef,
      targetDestinationHash: telephonyVerificationHashIdentifier("caller_id_hint", raw.phone),
      actorRef: "telephony_operator_189",
      idempotencyKey: "idem_eval_seeded_189",
      observedAt,
    });

    expect(result.candidateSet.candidateCount).toBe(1);
    expect(result.identityAssessment?.bestCandidateRef).toBe("patient_189_okafor");
    expect(result.identityAssessment?.gap_id).toBeGreaterThan(1.1);
    expect(result.destinationAssessment?.seedLowerBoundMethod).toBe(
      "dependence_safe_frechet_lower_bound",
    );
    expect(result.destinationAssessment?.P_seed_lower).toBeGreaterThanOrEqual(0.72);
    expect(result.decision.outcome).toBe("telephony_verified_seeded");
    expect(result.decision.nextAllowedContinuationPosture).toBe(
      "seeded_continuation_candidate",
    );
    expect(result.decision.reasonCodes).toContain(
      "TEL_VERIFY_189_EVIDENCE_SUBMITTED_TO_IDENTITY_BINDING_AUTHORITY",
    );
    expect(result.decision.localBindingMutation).toBe("forbidden");
    expect(authorityPort.submissions()).toHaveLength(1);
    expect(result.evidencePackage?.localBindingMutation).toBe("forbidden");
  });

  it("allows only challenge continuation when identity is strong but destination confidence is low", async () => {
    const { app } = createApp();
    await appendStrongCaptures(app, { withDestinationProof: false });

    const result = await app.service.evaluateVerification({
      callSessionRef,
      routeSensitivity: "sms_continuation",
      subjectRef,
      targetDestinationHash: null,
      actorRef: "telephony_operator_189",
      idempotencyKey: "idem_eval_challenge_189",
      observedAt,
    });

    expect(result.decision.outcome).toBe("telephony_verified_challenge");
    expect(result.decision.nextAllowedContinuationPosture).toBe("challenge_continuation_only");
    expect(result.decision.reasonCodes).toContain(
      "TEL_VERIFY_189_DESTINATION_BELOW_SEEDED_THRESHOLD",
    );
    expect(result.evidencePackage).toBeNull();
  });

  it("fails closed to manual follow-up when caller ID is the only positive evidence", async () => {
    const { app } = createApp();
    await appendCapture(app, "caller_id_hint", raw.phone, 1, "provider_callback");

    const result = await app.service.evaluateVerification({
      callSessionRef,
      routeSensitivity: "sms_continuation",
      subjectRef,
      targetDestinationHash: telephonyVerificationHashIdentifier("caller_id_hint", raw.phone),
      actorRef: "telephony_operator_189",
      idempotencyKey: "idem_eval_caller_only_189",
      observedAt,
    });

    expect(result.decision.outcome).toBe("manual_followup_required");
    expect(result.decision.reasonCodes).toContain("TEL_VERIFY_189_CALLER_ID_ONLY_BLOCKED");
    expect(result.decision.nextAllowedContinuationPosture).toBe("manual_followup_only");
  });

  it("fails closed when runner-up competition is ambiguous", async () => {
    const records = [
      patientRecord({ candidatePatientRef: "patient_189_a", candidateLabel: "Candidate A" }),
      patientRecord({ candidatePatientRef: "patient_189_b", candidateLabel: "Candidate B" }),
    ];
    const { app } = createApp({ records });
    await appendStrongCaptures(app);

    const result = await app.service.evaluateVerification({
      callSessionRef,
      routeSensitivity: "sms_continuation",
      subjectRef,
      targetDestinationHash: telephonyVerificationHashIdentifier("caller_id_hint", raw.phone),
      actorRef: "telephony_operator_189",
      idempotencyKey: "idem_eval_ambiguous_189",
      observedAt,
    });

    expect(result.candidateSet.candidateCount).toBe(2);
    expect(result.decision.outcome).toBe("ambiguous_candidate_set");
    expect(result.decision.reasonCodes).toContain(
      "TEL_VERIFY_189_AMBIGUOUS_RUNNER_UP_FAIL_CLOSED",
    );
    expect(result.decision.submittedEvidencePackageRef).toBeNull();
  });

  it("reports insufficient calibration for routes without validated profiles", async () => {
    const { app } = createApp();
    await appendStrongCaptures(app);

    const result = await app.service.evaluateVerification({
      callSessionRef,
      routeSensitivity: "future_protected_records",
      subjectRef,
      targetDestinationHash: telephonyVerificationHashIdentifier("caller_id_hint", raw.phone),
      actorRef: "telephony_operator_189",
      idempotencyKey: "idem_eval_no_calibration_189",
      observedAt,
    });

    expect(result.decision.outcome).toBe("insufficient_calibration");
    expect(result.decision.reasonCodes).toContain(
      "TEL_VERIFY_189_NO_VALIDATED_CALIBRATION_FAIL_CLOSED",
    );
    expect(result.identityAssessment).toBeNull();
  });

  it("downgrades seeded success to challenge when IdentityBindingAuthority is unavailable", async () => {
    const authorityPort = createInMemoryTelephonyIdentityBindingAuthorityPort({
      unavailable: true,
    });
    const { app } = createApp({ authorityPort });
    await appendStrongCaptures(app);

    const result = await app.service.evaluateVerification({
      callSessionRef,
      routeSensitivity: "sms_continuation",
      subjectRef,
      targetDestinationHash: telephonyVerificationHashIdentifier("caller_id_hint", raw.phone),
      actorRef: "telephony_operator_189",
      idempotencyKey: "idem_eval_authority_unavailable_189",
      observedAt,
    });

    expect(result.decision.outcome).toBe("telephony_verified_challenge");
    expect(result.authoritySubmission?.accepted).toBe(false);
    expect(result.decision.reasonCodes).toContain(
      "TEL_VERIFY_189_AUTHORITY_UNAVAILABLE_NON_BINDING_FALLBACK",
    );
    expect(result.decision.reasonCodes).toContain("TEL_VERIFY_189_SEEDED_DOWNGRADED_TO_CHALLENGE");
    expect(result.decision.localBindingMutation).toBe("forbidden");
  });

  it("supports a missing calibration repository as an explicit insufficient-calibration outcome", async () => {
    const calibrationRepository = createSeedTelephonyVerificationCalibrationRepository([]);
    const fallbackApp = createTelephonyVerificationApplication({
      evidenceVault: createIdentityEvidenceVaultApplication().evidenceVault,
      repository: createInMemoryTelephonyVerificationRepository({
        patientIndexRecords: [patientRecord()],
      }),
      calibrationRepository,
    });
    await appendStrongCaptures(fallbackApp);

    const result = await fallbackApp.service.evaluateVerification({
      callSessionRef,
      routeSensitivity: "sms_continuation",
      subjectRef,
      targetDestinationHash: telephonyVerificationHashIdentifier("caller_id_hint", raw.phone),
      actorRef: "telephony_operator_189",
      idempotencyKey: "idem_eval_missing_profile_189",
      observedAt,
    });

    expect(result.decision.outcome).toBe("insufficient_calibration");
    expect(result.decision.thresholdProfileRef).toBe(
      "telephony-verification-threshold-missing-sms_continuation-189.v1",
    );
  });
});
