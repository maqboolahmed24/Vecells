import {
  createPhase6PharmacyReferralPackageService,
  createPhase6PharmacyReferralPackageStore,
  type PharmacyCaseSnapshot,
  type PharmacyComposeReferralPackageDraftInput,
  type PharmacyReferralPackageContentInput,
  type PharmacyReferralRouteIntentTupleInput,
} from "../../packages/domains/pharmacy/src/index.ts";
import {
  create348DirectoryHarness,
  discover348ChoiceBundle,
  seed348EligibleCase,
} from "./348_pharmacy_directory.helpers.ts";

export function create349PackageHarness(
  scenario: Parameters<typeof create348DirectoryHarness>[0] = "baseScenario",
) {
  const directoryHarness = create348DirectoryHarness(scenario);
  const packageRepositories = createPhase6PharmacyReferralPackageStore();
  const packageService = createPhase6PharmacyReferralPackageService({
    repositories: packageRepositories,
    caseKernelService: directoryHarness.caseKernelService,
    directoryRepositories: directoryHarness.repositories,
  });
  return {
    ...directoryHarness,
    packageRepositories,
    packageService,
  };
}

export async function load349CurrentCase(
  harness: ReturnType<typeof create349PackageHarness>,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  const bundle = await harness.caseKernelService.getPharmacyCase(pharmacyCaseId);
  if (!bundle) {
    throw new Error(`PharmacyCase ${pharmacyCaseId} was not found.`);
  }
  return bundle.pharmacyCase;
}

export function build349RouteIntentTuple(
  seed: string,
  overrides: Partial<PharmacyReferralRouteIntentTupleInput> = {},
): PharmacyReferralRouteIntentTupleInput {
  return {
    actionScope: "pharmacy_referral.freeze",
    governingObjectRef: `PharmacyReferralPackage/${seed}`,
    canonicalObjectDescriptorRef: "PharmacyReferralPackage.v1",
    routeIntentRef: "phase6.pharmacy.referral.freeze",
    routeContractDigestRef: "route_contract_349_v1",
    parentAnchorRef: `request_anchor_${seed}`,
    governingObjectVersionRef: "pharmacy_referral_package_contract_v1",
    lineageScope: "pharmacy_case_lineage",
    requiredContextBoundaryRefs: [
      "boundary.pharmacy.case",
      "boundary.pharmacy.choice",
      "boundary.pharmacy.consent",
    ],
    actingContextRef: `acting_context_${seed}`,
    initiatingBoundedContextRef: "patient_access",
    governingBoundedContextRef: "pharmacy",
    ...overrides,
  };
}

export function build349ContentInput(
  seed: string,
  overrides: Partial<PharmacyReferralPackageContentInput> = {},
): PharmacyReferralPackageContentInput {
  return {
    sourcePracticeRef: `practice_${seed}`,
    sourcePracticeSummary: `Source practice summary for ${seed}`,
    requestLineageSummary: `Request lineage summary for ${seed}`,
    patientSummary: {
      sourceArtifactRef: `patient_summary_${seed}`,
      sourceHash: `hash_patient_summary_${seed}`,
      label: "Patient summary",
      summaryText: `Patient identity and contact summary for ${seed}`,
      derivationRef: "PatientProfile",
    },
    clinicalSummary: {
      sourceArtifactRef: `clinical_summary_${seed}`,
      sourceHash: `hash_clinical_summary_${seed}`,
      label: "Clinical summary",
      summaryText: `Clinical summary and red-flag posture for ${seed}`,
      derivationRef: "ClinicalSummary",
    },
    communicationPreferenceSummary: {
      sourceArtifactRef: `communication_preference_${seed}`,
      sourceHash: `hash_communication_preference_${seed}`,
      label: "Communication preferences",
      summaryText: `Preferred contact route recorded for ${seed}`,
      derivationRef: "CommunicationPreferenceSummary",
      governanceHint: "summary_only",
    },
    supportingArtifacts: [
      {
        sourceArtifactRef: `attachment_full_${seed}`,
        sourceHash: `hash_attachment_full_${seed}`,
        label: "Structured clinical note",
        classification: "clinical_note",
        mimeType: "application/pdf",
        governanceHint: "include",
      },
      {
        sourceArtifactRef: `attachment_summary_${seed}`,
        sourceHash: `hash_attachment_summary_${seed}`,
        label: "Observation digest",
        classification: "observation_digest",
        mimeType: "text/plain",
        governanceHint: "summary_only",
      },
      {
        sourceArtifactRef: `attachment_redacted_${seed}`,
        sourceHash: `hash_attachment_redacted_${seed}`,
        label: "Third-party note",
        classification: "third_party_note",
        mimeType: "application/pdf",
        governanceHint: "redact",
        redactionTransformRef: "redact.third_party.minimum_necessary",
      },
      {
        sourceArtifactRef: `attachment_missing_${seed}`,
        sourceHash: `hash_attachment_missing_${seed}`,
        label: "Deferred external result",
        classification: "external_result",
        mimeType: "application/pdf",
        governanceHint: "unavailable",
        unavailableReasonCode: "AWAITING_EXTERNAL_RESULT",
      },
    ],
    redFlagCheckRefs: [`red_flag_check_${seed}`],
    exclusionCheckRefs: [`exclusion_check_${seed}`],
    ...overrides,
  };
}

export interface Seed349ConsentReadyState {
  rulePackId: string;
  pharmacyCaseId: string;
  discovered: Awaited<ReturnType<typeof discover348ChoiceBundle>>;
  selected: Awaited<
    ReturnType<ReturnType<typeof create349PackageHarness>["directoryService"]["selectProvider"]>
  >;
  acknowledged:
    | Awaited<
        ReturnType<
          ReturnType<typeof create349PackageHarness>["directoryService"]["acknowledgeWarnedChoice"]
        >
      >
    | null;
  consent: Awaited<
    ReturnType<ReturnType<typeof create349PackageHarness>["directoryService"]["capturePharmacyConsent"]>
  >;
  currentCase: PharmacyCaseSnapshot;
}

export async function seed349ConsentReadyCase(input: {
  harness: ReturnType<typeof create349PackageHarness>;
  seed: string;
  providerRef?: string;
  referralScope?: string;
}): Promise<Seed349ConsentReadyState> {
  const { harness, seed } = input;
  const { rulePackId, evaluated } = await seed348EligibleCase(harness, seed);
  const pharmacyCaseId = evaluated.caseMutation.pharmacyCase.pharmacyCaseId;
  const discovered = await discover348ChoiceBundle({
    harness,
    pharmacyCaseId,
  });

  const selected = await harness.directoryService.selectProvider({
    pharmacyCaseId,
    providerRef: input.providerRef ?? "provider_A10001",
    actorRef: `actor_${seed}`,
    expectedChoiceRevision: discovered.choiceSession.revision,
    commandActionRecordRef: `select_action_${seed}`,
    commandSettlementRecordRef: `select_settlement_${seed}`,
    recordedAt: "2026-04-23T12:05:00.000Z",
    leaseRef: evaluated.caseMutation.pharmacyCase.leaseRef,
    expectedOwnershipEpoch: evaluated.caseMutation.pharmacyCase.ownershipEpoch,
    expectedLineageFenceRef: evaluated.caseMutation.pharmacyCase.lineageFenceRef,
    scopedMutationGateRef: `scope_gate_${seed}_select`,
    reasonCode: "select_provider",
    idempotencyKey: `select_provider_${seed}`,
  });

  let acknowledged: Seed349ConsentReadyState["acknowledged"] = null;
  let acknowledgedSession = selected.choiceSession;
  if (selected.choiceSession.patientOverrideRequired) {
    acknowledged = await harness.directoryService.acknowledgeWarnedChoice({
      pharmacyCaseId,
      acknowledgementScriptRef: "warn.manual_route.same_day",
      actorRef: `actor_${seed}`,
      actorRole: "staff",
      expectedChoiceRevision: selected.choiceSession.revision,
      recordedAt: "2026-04-23T12:06:00.000Z",
      leaseRef: selected.caseMutation.pharmacyCase.leaseRef,
      expectedOwnershipEpoch: selected.caseMutation.pharmacyCase.ownershipEpoch,
      expectedLineageFenceRef: selected.caseMutation.pharmacyCase.lineageFenceRef,
      scopedMutationGateRef: `scope_gate_${seed}_ack`,
      reasonCode: "acknowledge_warned_choice",
      idempotencyKey: `ack_warned_choice_${seed}`,
    });
    acknowledgedSession = acknowledged.choiceSession;
  }

  const consent = await harness.directoryService.capturePharmacyConsent({
    pharmacyCaseId,
    consentScriptVersion: "consent_script_v1",
    actorRef: `actor_${seed}`,
    expectedSelectionBindingHash: acknowledgedSession.selectionBindingHash!,
    referralScope: input.referralScope ?? "pharmacy_first_referral",
    channel: "staff_assisted",
    patientAwarenessOfGpVisibility: true,
    recordedAt: "2026-04-23T12:08:00.000Z",
    leaseRef: selected.caseMutation.pharmacyCase.leaseRef,
    expectedOwnershipEpoch: selected.caseMutation.pharmacyCase.ownershipEpoch,
    expectedLineageFenceRef: selected.caseMutation.pharmacyCase.lineageFenceRef,
    scopedMutationGateRef: `scope_gate_${seed}_consent`,
    reasonCode: "capture_consent",
    idempotencyKey: `capture_consent_${seed}`,
  });

  return {
    rulePackId,
    pharmacyCaseId,
    discovered,
    selected,
    acknowledged,
    consent,
    currentCase: await load349CurrentCase(harness, pharmacyCaseId),
  };
}

export function build349DraftInput(input: {
  seedState: Seed349ConsentReadyState;
  compiledPolicyBundleRef?: string;
  routeIntentBindingRef?: string;
  routeIntentTuple?: PharmacyReferralRouteIntentTupleInput;
  contentInput?: PharmacyReferralPackageContentInput;
}): PharmacyComposeReferralPackageDraftInput {
  const seed = input.seedState.pharmacyCaseId;
  return {
    pharmacyCaseId: input.seedState.pharmacyCaseId,
    compiledPolicyBundleRef:
      input.compiledPolicyBundleRef ?? `${input.seedState.rulePackId}::compiled_policy_bundle`,
    expectedSelectionBindingHash: input.seedState.consent.consentCheckpoint.selectionBindingHash,
    routeIntentBindingRef: input.routeIntentBindingRef ?? `route_binding_${seed}`,
    routeIntentTuple: input.routeIntentTuple ?? build349RouteIntentTuple(seed),
    contentInput: input.contentInput ?? build349ContentInput(seed),
    expectedChoiceProofRef: input.seedState.discovered.choiceProof.pharmacyChoiceProofId,
    expectedSelectedExplanationRef:
      input.seedState.selected.selectedExplanation.pharmacyChoiceExplanationId,
    expectedDirectorySnapshotRef: input.seedState.discovered.directorySnapshot.directorySnapshotId,
    expectedConsentCheckpointRef:
      input.seedState.consent.consentCheckpoint.pharmacyConsentCheckpointId,
    recordedAt: "2026-04-23T12:10:00.000Z",
  };
}
