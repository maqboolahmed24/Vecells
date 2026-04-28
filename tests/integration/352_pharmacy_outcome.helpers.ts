import {
  createPhase6PharmacyOutcomeReconciliationService,
  createPhase6PharmacyOutcomeStore,
  createPhase6PharmacyPatientStatusService,
  type PharmacyCaseSnapshot,
  type PharmacyOutcomeClassificationState,
  type PharmacyOutcomeSourceType,
} from "../../packages/domains/pharmacy/src/index.ts";
import {
  confirm351Dispatch,
  create351PatientStatusHarness,
  load351CurrentCase,
  project351PatientStatus,
  seed351DispatchPendingCase,
} from "./351_pharmacy_patient_status.helpers.ts";

export function create352OutcomeHarness() {
  const baseHarness = create351PatientStatusHarness();
  const outcomeRepositories = createPhase6PharmacyOutcomeStore();
  const outcomeService = createPhase6PharmacyOutcomeReconciliationService({
    repositories: outcomeRepositories,
    caseKernelService: baseHarness.caseKernelService,
    directoryRepositories: baseHarness.repositories,
    dispatchRepositories: baseHarness.dispatchRepositories,
    packageRepositories: baseHarness.packageRepositories,
  });
  const patientStatusService = createPhase6PharmacyPatientStatusService({
    repositories: baseHarness.patientStatusRepositories,
    outcomeRepositories,
    caseKernelService: baseHarness.caseKernelService,
    directoryRepositories: baseHarness.repositories,
    dispatchRepositories: baseHarness.dispatchRepositories,
    packageRepositories: baseHarness.packageRepositories,
    reachabilityRepositories: baseHarness.reachabilityRepositories,
    identityRepairRepositories: baseHarness.identityRepairRepositories,
  });
  return {
    ...baseHarness,
    outcomeRepositories,
    outcomeService,
    patientStatusService,
  };
}

export async function seed352OutcomeReadyCase(input: {
  harness: ReturnType<typeof create352OutcomeHarness>;
  seed: string;
}) {
  const seeded = await seed351DispatchPendingCase({
    harness: input.harness,
    seed: input.seed,
  });
  await confirm351Dispatch({
    harness: input.harness,
    dispatchAttemptId: seeded.submitted.dispatchBundle.attempt.dispatchAttemptId,
    suffix: `${input.seed}_confirmed`,
    recordedAt: "2026-04-23T17:15:00.000Z",
  });
  return {
    ...seeded,
    currentCase: await load351CurrentCase(input.harness, seeded.currentCase.pharmacyCaseId),
  };
}

export async function load352CurrentCase(
  harness: ReturnType<typeof create352OutcomeHarness>,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  return load351CurrentCase(harness, pharmacyCaseId);
}

export async function build352OutcomePayload(input: {
  harness: ReturnType<typeof create352OutcomeHarness>;
  pharmacyCaseId: string;
  classificationState: PharmacyOutcomeClassificationState;
  sourceType?: PharmacyOutcomeSourceType;
  recordedAt?: string;
  withTrustedCorrelation?: boolean;
  withExactProvider?: boolean;
  withExactPatient?: boolean;
  sourceMessageKey?: string;
  overrides?: Record<string, unknown>;
}) {
  const currentCase = await load352CurrentCase(input.harness, input.pharmacyCaseId);
  const correlationRecord =
    (
      await input.harness.packageRepositories.getCurrentCorrelationRecordForCase(input.pharmacyCaseId)
    )?.toSnapshot() ?? null;
  const provider =
    currentCase.selectedProviderRef === null
      ? null
      : (
          await input.harness.repositories.getProvider(currentCase.selectedProviderRef.refId)
        )?.toSnapshot() ?? null;
  const recordedAt = input.recordedAt ?? "2026-04-23T17:30:00.000Z";
  const correlationRefs =
    input.withTrustedCorrelation === false || correlationRecord === null
      ? []
      : [
          correlationRecord.correlationId,
          correlationRecord.packageId,
          correlationRecord.dispatchAttemptId ?? "",
          correlationRecord.outboundReferenceSet[0] ?? "",
        ].filter(Boolean);
  return {
    sourceType: input.sourceType ?? "gp_workflow_observation",
    sourceMessageKey:
      input.sourceMessageKey ??
      `${input.sourceType ?? "gp_workflow_observation"}_${input.pharmacyCaseId}_${input.classificationState}`,
    receivedAt: recordedAt,
    rawPayload: {
      classificationState: input.classificationState,
      outcomeAt: recordedAt,
      patientRefId:
        input.withExactPatient === false ? "patient_other" : currentCase.patientRef.refId,
      providerRefId:
        input.withExactProvider === false ? "provider_other" : provider?.providerId ?? null,
      providerOdsCode:
        input.withExactProvider === false ? "ODS_OTHER" : provider?.odsCode ?? null,
      serviceType: currentCase.serviceType,
      correlationRefs,
      routeIntentTupleHash: correlationRecord?.routeIntentTupleHash ?? null,
      transportHintRefs:
        correlationRecord?.transportMode === null ? [] : [correlationRecord.transportMode],
      urgentGpAction: input.classificationState === "urgent_gp_action",
      onwardReferral: input.classificationState === "onward_referral",
      unableToContact: input.classificationState === "unable_to_contact",
      pharmacyUnableToComplete:
        input.classificationState === "pharmacy_unable_to_complete",
      medicineSupplied: input.classificationState === "medicine_supplied",
      resolvedNoSupply: input.classificationState === "resolved_no_supply",
      senderIdentityRef: "community_pharmacy_sender_A",
      inboundChannelRef: "workflow_inbox_A",
      inboundTransportFamily:
        input.sourceType === "email_ingest" ? "secure_mail" : "structured_ingress",
      ...input.overrides,
    },
  };
}

export async function ingest352Outcome(input: {
  harness: ReturnType<typeof create352OutcomeHarness>;
  pharmacyCaseId: string;
  classificationState: PharmacyOutcomeClassificationState;
  sourceType?: PharmacyOutcomeSourceType;
  recordedAt?: string;
  withTrustedCorrelation?: boolean;
  withExactProvider?: boolean;
  withExactPatient?: boolean;
  sourceMessageKey?: string;
  overrides?: Record<string, unknown>;
}) {
  const command = await build352OutcomePayload(input);
  return input.harness.outcomeService.ingestOutcomeEvidence({
    ...command,
    actorRef: `outcome_actor_${input.classificationState}`,
    commandActionRecordRef: `outcome_action_${input.classificationState}_${input.pharmacyCaseId}`,
    commandSettlementRecordRef: `outcome_settlement_${input.classificationState}_${input.pharmacyCaseId}`,
    reasonCode: `ingest_${input.classificationState}`,
  });
}

export async function project352PatientStatus(input: {
  harness: ReturnType<typeof create352OutcomeHarness>;
  pharmacyCaseId: string;
  recordedAt?: string;
}) {
  return project351PatientStatus({
    harness: {
      ...input.harness,
      patientStatusService: input.harness.patientStatusService,
    },
    pharmacyCaseId: input.pharmacyCaseId,
    recordedAt: input.recordedAt ?? "2026-04-23T18:10:00.000Z",
  });
}
