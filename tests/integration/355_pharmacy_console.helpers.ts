import {
  createPhase6PharmacyConsoleBackendService,
  createPhase6PharmacyConsoleStore,
  type InventorySupportRecordSnapshot,
  type PharmacyCaseSnapshot,
  type PharmacyMedicationLineStateSnapshot,
} from "../../packages/domains/pharmacy/src/index.ts";
import { create354OperationsHarness } from "./354_pharmacy_operations.helpers.ts";
import { seed350FrozenPackageCase } from "./350_pharmacy_dispatch.helpers.ts";
import {
  ingest352Outcome,
  load352CurrentCase,
  seed352OutcomeReadyCase,
} from "./352_pharmacy_outcome.helpers.ts";

export function create355ConsoleHarness() {
  const baseHarness = create354OperationsHarness();
  const consoleRepositories = createPhase6PharmacyConsoleStore();
  const consoleService = createPhase6PharmacyConsoleBackendService({
    repositories: consoleRepositories,
    caseKernelService: baseHarness.caseKernelService,
    directoryRepositories: baseHarness.repositories,
    dispatchRepositories: baseHarness.dispatchRepositories,
    outcomeRepositories: baseHarness.outcomeRepositories,
    patientStatusRepositories: baseHarness.patientStatusRepositories,
    bounceBackRepositories: baseHarness.bounceBackRepositories,
  });

  return {
    ...baseHarness,
    consoleRepositories,
    consoleService,
  };
}

export async function load355CurrentCase(
  harness: ReturnType<typeof create355ConsoleHarness>,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  return load352CurrentCase(harness, pharmacyCaseId);
}

function freshnessWindow(
  recordedAt: string,
  freshnessState: "fresh" | "aging" | "stale" | "unavailable",
) {
  if (freshnessState === "unavailable") {
    return {
      verifiedAt: null,
      staleAfterAt: null,
      hardStopAfterAt: null,
      trustState: "missing" as const,
    };
  }
  const recorded = Date.parse(recordedAt);
  const verifiedAt = new Date(recorded - 60 * 60_000).toISOString();
  const staleAfterAt =
    freshnessState === "fresh"
      ? new Date(recorded + 60 * 60_000).toISOString()
      : freshnessState === "aging"
        ? new Date(recorded + 5 * 60_000).toISOString()
        : new Date(recorded - 5 * 60_000).toISOString();
  const hardStopAfterAt =
    freshnessState === "stale"
      ? new Date(recorded - 60_000).toISOString()
      : new Date(recorded + 2 * 60 * 60_000).toISOString();
  return {
    verifiedAt,
    staleAfterAt,
    hardStopAfterAt,
    trustState: "verified" as const,
  };
}

export async function seed355MedicationSupportState(input: {
  harness: ReturnType<typeof create355ConsoleHarness>;
  pharmacyCaseId: string;
  seed: string;
  recordedAt?: string;
  freshnessState?: "fresh" | "aging" | "stale" | "unavailable";
  communicationPreviewed?: boolean;
}) {
  const recordedAt = input.recordedAt ?? "2026-04-24T09:00:00.000Z";
  const freshness = freshnessWindow(recordedAt, input.freshnessState ?? "fresh");
  const lineItemRef = `line_${input.seed}_amoxicillin`;
  const exactCandidateRef = `${lineItemRef}_exact`;
  const partialCandidateRef = `${lineItemRef}_partial`;

  const lineState: PharmacyMedicationLineStateSnapshot = {
    pharmacyMedicationLineStateId: `line_state_${input.seed}`,
    pharmacyCaseRef: {
      targetFamily: "PharmacyCase",
      refId: input.pharmacyCaseId,
      ownerTask: "seq_342",
    },
    lineItemRef,
    medicationLabel: "Amoxicillin 500mg capsules",
    strengthLabel: "500mg",
    formLabel: "capsule",
    baseUnit: "capsule",
    prescribedBaseUnits: 21,
    dailyBaseUnits: 3,
    packBasisRef: "amoxicillin_500mg_capsule_pack_21",
    intendedSupplyWindowDays: 7,
    selectedCandidateRef: exactCandidateRef,
    overrideState: "none",
    currentLineState: "verified",
    requiredCommunicationPreviewRefs: ["patient_comm_preview"],
    communicationPreviewed: input.communicationPreviewed ?? true,
    blockingSignalCodes: [],
    reviewSignalCodes: [],
    informationSignalCodes: ["standard_line_review"],
    verifiedEvidenceRefs: ["eps_line_item", "patient_history_summary"],
    clarificationThreadRef: null,
    crossLineImpactDigestRef: null,
    lineItemVersionRef: `line_item_version_${input.seed}`,
    policyBundleRef: `policy_bundle_${input.seed}`,
    reviewSessionRef: `review_session_${input.seed}`,
    version: 1,
  };

  const exactRecord: InventorySupportRecordSnapshot = {
    inventorySupportRecordId: `inventory_${input.seed}_exact`,
    pharmacyCaseRef: {
      targetFamily: "PharmacyCase",
      refId: input.pharmacyCaseId,
      ownerTask: "seq_342",
    },
    lineItemRef,
    candidateRef: exactCandidateRef,
    productIdentityRef: "amoxicillin_500mg_capsule",
    equivalenceClass: "exact",
    packBasisRef: "amoxicillin_500mg_capsule_pack_21",
    baseUnitsPerPack: 21,
    availableQuantity: 4,
    reservedQuantity: 0,
    batchOrLotRef: `lot_exact_${input.seed}`,
    expiryBand: input.freshnessState === "stale" ? "near_expiry" : "safe",
    storageRequirementRef: null,
    controlledStockFlag: false,
    locationOrBinRef: `bin_A_${input.seed}`,
    verifiedAt: freshness.verifiedAt,
    staleAfterAt: freshness.staleAfterAt,
    hardStopAfterAt: freshness.hardStopAfterAt,
    trustState: freshness.trustState,
    freshnessConfidenceState:
      input.freshnessState === "unavailable" ? "unknown" : "high",
    quarantineFlag: false,
    supervisorHoldFlag: false,
    substitutionPolicyState: "allowed",
    approvalBurdenRef: null,
    patientCommunicationDeltaRef: "patient_comm_preview",
    handoffConsequenceRef: "handoff_standard_release",
    selectedPackCount: 1,
    selectedBaseUnits: 21,
    policyBundleDigest: `policy_digest_${input.seed}_exact`,
    missionScopeDigest: `mission_scope_${input.seed}`,
    continuityScopeDigest: `continuity_scope_${input.seed}`,
    version: 1,
  };

  const partialRecord: InventorySupportRecordSnapshot = {
    inventorySupportRecordId: `inventory_${input.seed}_partial`,
    pharmacyCaseRef: {
      targetFamily: "PharmacyCase",
      refId: input.pharmacyCaseId,
      ownerTask: "seq_342",
    },
    lineItemRef,
    candidateRef: partialCandidateRef,
    productIdentityRef: "amoxicillin_500mg_capsule",
    equivalenceClass: "partial_supply",
    packBasisRef: "amoxicillin_500mg_capsule_pack_14",
    baseUnitsPerPack: 14,
    availableQuantity: 2,
    reservedQuantity: 0,
    batchOrLotRef: `lot_partial_${input.seed}`,
    expiryBand: "watch",
    storageRequirementRef: null,
    controlledStockFlag: false,
    locationOrBinRef: `bin_B_${input.seed}`,
    verifiedAt: freshness.verifiedAt,
    staleAfterAt: freshness.staleAfterAt,
    hardStopAfterAt: freshness.hardStopAfterAt,
    trustState: freshness.trustState,
    freshnessConfidenceState:
      input.freshnessState === "unavailable" ? "unknown" : "medium",
    quarantineFlag: false,
    supervisorHoldFlag: false,
    substitutionPolicyState: "patient_ack_required",
    approvalBurdenRef: "partial_supply_ack",
    patientCommunicationDeltaRef: "patient_partial_supply_preview",
    handoffConsequenceRef: "handoff_partial_supply_release",
    selectedPackCount: 1,
    selectedBaseUnits: 14,
    policyBundleDigest: `policy_digest_${input.seed}_partial`,
    missionScopeDigest: `mission_scope_${input.seed}`,
    continuityScopeDigest: `continuity_scope_${input.seed}`,
    version: 1,
  };

  await input.harness.consoleRepositories.saveMedicationLineState(lineState);
  await input.harness.consoleRepositories.saveInventorySupportRecord(exactRecord);
  await input.harness.consoleRepositories.saveInventorySupportRecord(partialRecord);

  return {
    lineState,
    exactRecord,
    partialRecord,
    lineItemRef,
    exactCandidateRef,
    partialCandidateRef,
    recordedAt,
  };
}

export async function seed355PackageReadyCase(input: {
  harness: ReturnType<typeof create355ConsoleHarness>;
  seed: string;
  freshnessState?: "fresh" | "aging" | "stale" | "unavailable";
  communicationPreviewed?: boolean;
}) {
  const frozen = await seed350FrozenPackageCase({
    harness: input.harness,
    seed: input.seed,
  });
  const support = await seed355MedicationSupportState({
    harness: input.harness,
    pharmacyCaseId: frozen.pharmacyCaseId,
    seed: input.seed,
    freshnessState: input.freshnessState,
    communicationPreviewed: input.communicationPreviewed,
  });
  return {
    ...frozen,
    ...support,
    currentCase: await load355CurrentCase(input.harness, frozen.pharmacyCaseId),
  };
}

export async function seed355OutcomeReviewCase(input: {
  harness: ReturnType<typeof create355ConsoleHarness>;
  seed: string;
}) {
  const seeded = await seed352OutcomeReadyCase({
    harness: input.harness,
    seed: input.seed,
  });
  const support = await seed355MedicationSupportState({
    harness: input.harness,
    pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
    seed: input.seed,
    freshnessState: "fresh",
    communicationPreviewed: true,
  });
  await ingest352Outcome({
    harness: input.harness,
    pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
    classificationState: "resolved_no_supply",
    withTrustedCorrelation: false,
    withExactProvider: false,
    sourceMessageKey: `outcome_review_${input.seed}`,
    recordedAt: "2026-04-24T10:00:00.000Z",
  });
  return {
    ...seeded,
    ...support,
    currentCase: await load355CurrentCase(input.harness, seeded.currentCase.pharmacyCaseId),
  };
}

export async function create355FenceForSelectedCandidate(input: {
  harness: ReturnType<typeof create355ConsoleHarness>;
  pharmacyCaseId: string;
  lineItemRef: string;
  candidateRef: string;
  recordedAt?: string;
}) {
  return input.harness.consoleService.createInventoryComparisonFence({
    pharmacyCaseId: input.pharmacyCaseId,
    lineItemRef: input.lineItemRef,
    candidateRef: input.candidateRef,
    actorRef: `pharmacist_${input.pharmacyCaseId}`,
    idempotencyKey: `fence_${input.pharmacyCaseId}_${input.lineItemRef}_${input.candidateRef}`,
    recordedAt: input.recordedAt ?? "2026-04-24T09:05:00.000Z",
  });
}

export async function mutate355InventoryRecord(input: {
  harness: ReturnType<typeof create355ConsoleHarness>;
  inventorySupportRecordId: string;
  patch: Partial<InventorySupportRecordSnapshot>;
}) {
  const current =
    (
      await input.harness.consoleRepositories.getInventorySupportRecord(
        input.inventorySupportRecordId,
      )
    )?.toSnapshot() ?? null;
  if (!current) {
    throw new Error(`Inventory support record ${input.inventorySupportRecordId} missing.`);
  }
  const next: InventorySupportRecordSnapshot = {
    ...current,
    ...input.patch,
    inventorySupportRecordId: current.inventorySupportRecordId,
    pharmacyCaseRef: current.pharmacyCaseRef,
    lineItemRef: current.lineItemRef,
    candidateRef: current.candidateRef,
    version: current.version + 1,
  };
  await input.harness.consoleRepositories.saveInventorySupportRecord(next, {
    expectedVersion: current.version,
  });
  return next;
}
