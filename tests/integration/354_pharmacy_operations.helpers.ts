import {
  createPhase6PharmacyOperationsService,
  createPhase6PharmacyOperationsStore,
  type PharmacyCaseSnapshot,
} from "../../packages/domains/pharmacy/src/index.ts";
import {
  discover348ChoiceBundle,
  seed348EligibleCase,
} from "./348_pharmacy_directory.helpers.ts";
import {
  load350CurrentCase,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "./350_pharmacy_dispatch.helpers.ts";
import {
  create353BounceBackHarness,
  ingest353BounceBack,
  seed353BounceBackReadyCase,
} from "./353_pharmacy_bounce_back.helpers.ts";
import { seed352OutcomeReadyCase } from "./352_pharmacy_outcome.helpers.ts";

export function create354OperationsHarness() {
  const baseHarness = create353BounceBackHarness();
  const operationsRepositories = createPhase6PharmacyOperationsStore();
  const operationsService = createPhase6PharmacyOperationsService({
    repositories: operationsRepositories,
    caseKernelService: baseHarness.caseKernelService,
    directoryRepositories: baseHarness.repositories,
    dispatchRepositories: baseHarness.dispatchRepositories,
    outcomeRepositories: baseHarness.outcomeRepositories,
    patientStatusRepositories: baseHarness.patientStatusRepositories,
    bounceBackRepositories: baseHarness.bounceBackRepositories,
  });

  return {
    ...baseHarness,
    operationsRepositories,
    operationsService,
  };
}

export async function load354CurrentCase(
  harness: ReturnType<typeof create354OperationsHarness>,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  return load350CurrentCase(harness, pharmacyCaseId);
}

export async function seed354WaitingChoiceCase(input: {
  harness: ReturnType<typeof create354OperationsHarness>;
  seed: string;
}) {
  const seeded = await seed348EligibleCase(input.harness, input.seed);
  const discovered = await discover348ChoiceBundle({
    harness: input.harness,
    pharmacyCaseId: seeded.evaluated.caseMutation.pharmacyCase.pharmacyCaseId,
    evaluatedAt: "2026-04-23T11:30:00.000Z",
  });
  return {
    pharmacyCaseId: seeded.evaluated.caseMutation.pharmacyCase.pharmacyCaseId,
    discovered,
    currentCase: await load354CurrentCase(
      input.harness,
      seeded.evaluated.caseMutation.pharmacyCase.pharmacyCaseId,
    ),
  };
}

export async function force354DiscoveryUnavailable(input: {
  harness: ReturnType<typeof create354OperationsHarness>;
  pharmacyCaseId: string;
}) {
  const latestDirectory =
    (
      await input.harness.repositories.getLatestDirectorySnapshotForCase(input.pharmacyCaseId)
    )?.toSnapshot() ?? null;
  if (!latestDirectory) {
    throw new Error("Latest directory snapshot missing.");
  }
  const sourceSnapshots = (
    await input.harness.repositories.listDirectorySourceSnapshots(latestDirectory.directorySnapshotId)
  ).map((entry) => entry.toSnapshot());
  for (const source of sourceSnapshots) {
    await input.harness.repositories.saveDirectorySourceSnapshot(
      {
        ...source,
        sourceStatus: "failed",
        sourceFailureClassification: "source_unavailable",
        sourceFreshnessPosture: "expired",
        version: source.version + 1,
      },
      { expectedVersion: source.version },
    );
  }

  const truthDocument = await input.harness.repositories.getLatestChoiceTruthProjectionForCase(
    input.pharmacyCaseId,
  );
  if (!truthDocument) {
    throw new Error("Choice truth missing.");
  }
  const truth = truthDocument.toSnapshot();
  await input.harness.repositories.saveChoiceTruthProjection(
    {
      ...truth,
      visibleProviderRefs: [],
      recommendedProviderRefs: [],
      warningVisibleProviderRefs: [],
      selectedProviderRef: null,
      selectedProviderExplanationRef: null,
      selectedProviderCapabilitySnapshotRef: null,
      patientOverrideRequired: false,
      projectionState: "recovery_required",
      version: truth.version + 1,
    },
    { expectedVersion: truth.version },
  );
}

export async function seed354WaitingOutcomeCase(input: {
  harness: ReturnType<typeof create354OperationsHarness>;
  seed: string;
}) {
  const seeded = await seed352OutcomeReadyCase({
    harness: input.harness,
    seed: input.seed,
  });
  return {
    pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
    dispatchAttemptId: seeded.submitted.dispatchBundle.attempt.dispatchAttemptId,
    providerRef: seeded.submitted.dispatchBundle.plan.providerRef.refId,
    currentCase: await load354CurrentCase(input.harness, seeded.currentCase.pharmacyCaseId),
  };
}

export async function seed354DispatchFailureCase(input: {
  harness: ReturnType<typeof create354OperationsHarness>;
  seed: string;
}) {
  const frozenState = await seed350FrozenPackageCase({
    harness: input.harness,
    seed: input.seed,
  });
  const submitted = await submit350Dispatch({
    harness: input.harness,
    frozenState,
    sourceCommandId: `${input.seed}_submit`,
    recordedAt: "2026-04-23T14:20:00.000Z",
  });
  const failed = await input.harness.dispatchService.ingestReceiptEvidence({
    dispatchAttemptId: submitted.dispatchBundle.attempt.dispatchAttemptId,
    lane: "transport_acceptance",
    sourceClass: "mesh_transport_rejected",
    recordedAt: "2026-04-23T14:25:00.000Z",
    rawEvidence: { reason: "partner_rejected" },
    semanticEvidence: { reason: "partner_rejected" },
    transportMessageId: `mesh_reject_${input.seed}`,
    polarity: "negative",
    failsHardMatchRefs: ["partner_rejected"],
  });

  return {
    pharmacyCaseId: frozenState.pharmacyCaseId,
    failed,
    currentCase: await load354CurrentCase(input.harness, frozenState.pharmacyCaseId),
  };
}

export async function seed354BounceBackCase(input: {
  harness: ReturnType<typeof create354OperationsHarness>;
  seed: string;
}) {
  const seeded = await seed353BounceBackReadyCase({
    harness: input.harness,
    seed: input.seed,
    routeKind: "sms",
  });
  const ingested = await ingest353BounceBack({
    harness: input.harness,
    pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
    patientShellConsistencyProjectionId:
      seeded.shellProjection.patientShellConsistencyProjectionId,
    patientContactRouteRef: seeded.patientContactRouteRef,
    explicitBounceBackType: "patient_not_contactable",
    recordedAt: "2026-04-23T19:12:00.000Z",
    patientContactFailureSeverity: 0.8,
    contactRouteTrustFailure: 0.6,
    emitPatientNotification: true,
  });

  return {
    pharmacyCaseId: seeded.currentCase.pharmacyCaseId,
    ingested,
    currentCase: await load354CurrentCase(input.harness, seeded.currentCase.pharmacyCaseId),
  };
}
