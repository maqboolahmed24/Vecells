import { createHash } from "node:crypto";

import {
  createPhase6PharmacyPatientStatusService,
  createPhase6PharmacyPatientStatusStore,
  type AggregateRef,
  type PatientExperienceContinuityEvidenceProjectionSnapshot,
  type PatientExperienceContinuityValidationState,
  type PatientShellConsistencyProjectionSnapshot,
  type PatientShellConsistencyState,
  type PharmacyBounceBackRecordSnapshot,
  type PharmacyCaseSnapshot,
} from "../../packages/domains/pharmacy/src/index.ts";
import {
  ContactRouteRepairJourneyDocument,
  ContactRouteSnapshotDocument,
  ContactRouteVerificationCheckpointDocument,
  IdentityRepairBranchDispositionDocument,
  IdentityRepairReleaseSettlementDocument,
  ReachabilityAssessmentRecordDocument,
  ReachabilityDependencyDocument,
  createIdentityRepairStore,
  createReachabilityStore,
  type DeliveryRiskState,
  type ReachabilityRepairState,
  type ReachabilityPurpose,
  type RouteAuthorityState,
  type RouteHealthState,
} from "../../packages/domains/identity_access/src/index.ts";
import {
  create350DispatchHarness,
  load350CurrentCase,
  seed350FrozenPackageCase,
  submit350Dispatch,
} from "./350_pharmacy_dispatch.helpers.ts";
import { seed349ConsentReadyCase } from "./349_pharmacy_referral_package.helpers.ts";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;

function canonicalStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function stableProjectionId(prefix: string, input: unknown): string {
  return `${prefix}_${createHash("sha256")
    .update(canonicalStringify(input))
    .digest("hex")
    .slice(0, 16)}`;
}

function makeRef<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return {
    targetFamily,
    refId,
    ownerTask,
  };
}

function assessmentStateFromRouteHealth(routeHealthState: RouteHealthState) {
  switch (routeHealthState) {
    case "clear":
      return "clear" as const;
    case "degraded":
      return "at_risk" as const;
    case "blocked":
      return "blocked" as const;
    case "disputed":
      return "disputed" as const;
  }
}

export function create351PatientStatusHarness() {
  const baseHarness = create350DispatchHarness();
  const patientStatusRepositories = createPhase6PharmacyPatientStatusStore();
  const reachabilityRepositories = createReachabilityStore();
  const identityRepairRepositories = createIdentityRepairStore();
  const patientStatusService = createPhase6PharmacyPatientStatusService({
    repositories: patientStatusRepositories,
    caseKernelService: baseHarness.caseKernelService,
    directoryRepositories: baseHarness.repositories,
    dispatchRepositories: baseHarness.dispatchRepositories,
    packageRepositories: baseHarness.packageRepositories,
    reachabilityRepositories,
    identityRepairRepositories,
  });

  return {
    ...baseHarness,
    patientStatusRepositories,
    patientStatusService,
    reachabilityRepositories,
    identityRepairRepositories,
  };
}

export async function seed351ConsentStageCase(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  seed: string;
}) {
  const seeded = await seed349ConsentReadyCase({
    harness: input.harness,
    seed: input.seed,
  });
  return {
    ...seeded,
    currentCase: await load350CurrentCase(input.harness, seeded.pharmacyCaseId),
  };
}

export async function seed351DispatchPendingCase(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
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
  });
  return {
    frozenState,
    submitted,
    currentCase: await load350CurrentCase(input.harness, frozenState.pharmacyCaseId),
  };
}

export async function confirm351Dispatch(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  dispatchAttemptId: string;
  suffix: string;
  recordedAt?: string;
}) {
  return input.harness.dispatchService.ingestReceiptEvidence({
    dispatchAttemptId: input.dispatchAttemptId,
    lane: "authoritative",
    sourceClass: "authoritative_bars_response",
    recordedAt: input.recordedAt ?? "2026-04-23T15:24:00.000Z",
    transportMessageId: `bars_authoritative_message_${input.suffix}`,
    orderingKey: input.recordedAt ?? "2026-04-23T15:24:00.000Z",
    rawEvidence: {
      proof: "structured-authoritative-ack",
    },
    semanticEvidence: {
      proof: "structured-authoritative-ack",
    },
    proofRef: `bars_proof_${input.suffix}`,
    satisfiesHardMatchRefs: ["authoritative_dispatch_proof"],
  });
}

export async function load351CurrentCase(
  harness: ReturnType<typeof create351PatientStatusHarness>,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  return load350CurrentCase(harness, pharmacyCaseId);
}

export async function force351CaseSnapshot(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  pharmacyCaseId: string;
  recordedAt: string;
  patch: Partial<PharmacyCaseSnapshot>;
}) {
  const currentCase = await load351CurrentCase(input.harness, input.pharmacyCaseId);
  const nextCase: PharmacyCaseSnapshot = {
    ...currentCase,
    ...input.patch,
    pharmacyCaseId: currentCase.pharmacyCaseId,
    updatedAt: input.recordedAt,
    version: currentCase.version + 1,
  };
  await input.harness.caseRepositories.savePharmacyCase(nextCase, {
    expectedVersion: currentCase.version,
  });
  return nextCase;
}

async function infer351ContinuityEvidenceRef(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  pharmacyCaseId: string;
}) {
  const dispatchTruth =
    (
      await input.harness.dispatchRepositories.getCurrentDispatchTruthProjectionForCase(
        input.pharmacyCaseId,
      )
    )?.toSnapshot() ?? null;
  return (
    dispatchTruth?.continuityEvidenceRef ??
    stableProjectionId("synthetic_patient_continuity_evidence", {
      pharmacyCaseId: input.pharmacyCaseId,
    })
  );
}

export async function stage351Shell(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  pharmacyCaseId: string;
  recordedAt: string;
  shellConsistencyState?: PatientShellConsistencyState;
  continuityValidationState?: PatientExperienceContinuityValidationState;
  continuityEvidenceRef?: string;
}) {
  const continuityEvidenceRef =
    input.continuityEvidenceRef ??
    (await infer351ContinuityEvidenceRef({
      harness: input.harness,
      pharmacyCaseId: input.pharmacyCaseId,
    }));
  const shellProjection: PatientShellConsistencyProjectionSnapshot = {
    patientShellConsistencyProjectionId: stableProjectionId("patient_shell_consistency", {
      pharmacyCaseId: input.pharmacyCaseId,
      recordedAt: input.recordedAt,
      shellConsistencyState: input.shellConsistencyState ?? "live",
    }),
    shellContinuityKey: `pharmacy_shell_${input.pharmacyCaseId}`,
    selectedSectionRef: "pharmacy_status",
    activeRouteFamilyRef: "patient.pharmacy.status",
    selectedAnchorRef: `pharmacy_anchor_${input.pharmacyCaseId}`,
    activeReturnContractRef: null,
    bundleVersion: "phase6.patient_shell.v1",
    audienceTier: "patient",
    shellConsistencyState: input.shellConsistencyState ?? "live",
    computedAt: input.recordedAt,
    staleAt: "2026-04-24T00:00:00.000Z",
    causalConsistencyState: "authoritative_current",
    version: 1,
  };
  await input.harness.patientStatusRepositories.savePatientShellConsistencyProjection(shellProjection);

  const existingContinuityProjection = (
    await input.harness.patientStatusRepositories.getPatientExperienceContinuityProjection(
      continuityEvidenceRef,
    )
  )?.toSnapshot();
  const continuityProjection: PatientExperienceContinuityEvidenceProjectionSnapshot = {
    ...(existingContinuityProjection ?? {}),
    patientExperienceContinuityEvidenceProjectionId: continuityEvidenceRef,
    patientShellConsistencyRef: shellProjection.patientShellConsistencyProjectionId,
    controlCode: "patient_nav",
    routeFamilyRef: shellProjection.activeRouteFamilyRef,
    selectedAnchorRef: shellProjection.selectedAnchorRef,
    sourceSettlementOrContinuationRef: `continuation_${input.pharmacyCaseId}`,
    experienceContinuityEvidenceRef: continuityEvidenceRef,
    continuityTupleHash: stableProjectionId("continuity_tuple", {
      pharmacyCaseId: input.pharmacyCaseId,
      continuityEvidenceRef,
    }),
    validationState: input.continuityValidationState ?? "trusted",
    capturedAt: input.recordedAt,
    version: (existingContinuityProjection?.version ?? 0) + 1,
  };
  await input.harness.patientStatusRepositories.savePatientExperienceContinuityProjection(
    continuityProjection,
  );

  return {
    shellProjection,
    continuityProjection,
  };
}

export async function project351PatientStatus(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  pharmacyCaseId: string;
  recordedAt: string;
  shellConsistencyState?: PatientShellConsistencyState;
  continuityValidationState?: PatientExperienceContinuityValidationState;
  continuityEvidenceRef?: string;
}) {
  const shell = await stage351Shell(input);
  return input.harness.patientStatusService.projectPatientStatus({
    pharmacyCaseId: input.pharmacyCaseId,
    patientShellConsistencyProjectionId:
      shell.shellProjection.patientShellConsistencyProjectionId,
    recordedAt: input.recordedAt,
  });
}

export async function attach351ReachabilityBlocker(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  pharmacyCaseId: string;
  dependencySuffix: string;
  purpose: ReachabilityPurpose;
  routeHealthState?: RouteHealthState;
  repairState?: ReachabilityRepairState;
  routeAuthorityState?: RouteAuthorityState;
  deliveryRiskState?: DeliveryRiskState;
  withRepairJourney?: boolean;
}) {
  const routeHealthState = input.routeHealthState ?? "blocked";
  const repairState = input.repairState ?? "repair_required";
  const routeAuthorityState = input.routeAuthorityState ?? "stale_verification";
  const deliveryRiskState = input.deliveryRiskState ?? "likely_failed";
  const currentSnapshot = ContactRouteSnapshotDocument.create({
    contactRouteSnapshotId: `contact_snapshot_${input.dependencySuffix}`,
    subjectRef: `subject_${input.dependencySuffix}`,
    routeRef: `route_${input.dependencySuffix}`,
    routeVersionRef: `route_version_${input.dependencySuffix}`,
    routeKind: input.purpose === "pharmacy_contact" ? "voice" : "sms",
    normalizedAddressRef: `normalized_${input.dependencySuffix}`,
    preferenceProfileRef: `preferences_${input.dependencySuffix}`,
    verificationCheckpointRef: null,
    verificationState: "unverified",
    demographicFreshnessState: "stale",
    preferenceFreshnessState: "stale",
    sourceAuthorityClass: "patient_confirmed",
    supersedesSnapshotRef: null,
    snapshotVersion: 1,
    createdAt: "2026-04-23T15:00:00.000Z",
    updatedAt: "2026-04-23T15:00:00.000Z",
  });
  await input.harness.reachabilityRepositories.saveContactRouteSnapshot(currentSnapshot);

  const assessment = ReachabilityAssessmentRecordDocument.create({
    reachabilityAssessmentId: `reachability_assessment_${input.dependencySuffix}`,
    reachabilityDependencyRef: `reachability_dependency_${input.dependencySuffix}`,
    governingObjectRef: `pharmacy_case:${input.pharmacyCaseId}:${input.purpose}`,
    contactRouteSnapshotRef: currentSnapshot.contactRouteSnapshotId,
    consideredObservationRefs: [],
    priorAssessmentRef: null,
    routeAuthorityState,
    deliverabilityState: routeHealthState === "clear" ? "confirmed_reachable" : "confirmed_failed",
    deliveryRiskState,
    assessmentState: assessmentStateFromRouteHealth(routeHealthState),
    falseNegativeGuardState: "stale_input",
    dominantReasonCode: `reason_${input.purpose}`,
    resultingRepairState: repairState,
    resultingReachabilityEpoch: 1,
    assessedAt: "2026-04-23T15:02:00.000Z",
  });
  await input.harness.reachabilityRepositories.saveReachabilityAssessment(assessment);

  let repairJourneyRef: string | null = null;
  if (input.withRepairJourney) {
    repairJourneyRef = `contact_repair_${input.dependencySuffix}`;
    const journey = ContactRouteRepairJourneyDocument.create({
      repairJourneyId: repairJourneyRef,
      reachabilityDependencyRef: `reachability_dependency_${input.dependencySuffix}`,
      governingObjectRef: `pharmacy_case:${input.pharmacyCaseId}:${input.purpose}`,
      blockedActionScopeRefs: ["pharmacy_status_entry", "contact_route_repair"],
      selectedAnchorRef: `pharmacy_anchor_${input.pharmacyCaseId}`,
      requestReturnBundleRef: `return_bundle_${input.dependencySuffix}`,
      resumeContinuationRef: `resume_${input.dependencySuffix}`,
      patientRecoveryLoopRef: `recovery_loop_${input.dependencySuffix}`,
      blockedAssessmentRef: assessment.reachabilityAssessmentId,
      currentContactRouteSnapshotRef: currentSnapshot.contactRouteSnapshotId,
      candidateContactRouteSnapshotRef: currentSnapshot.contactRouteSnapshotId,
      verificationCheckpointRef: `verification_checkpoint_${input.dependencySuffix}`,
      resultingReachabilityAssessmentRef: null,
      journeyState: "awaiting_verification",
      issuedAt: "2026-04-23T15:03:00.000Z",
      updatedAt: "2026-04-23T15:03:00.000Z",
      completedAt: null,
    });
    await input.harness.reachabilityRepositories.saveContactRouteRepairJourney(journey);
    const checkpoint = ContactRouteVerificationCheckpointDocument.create({
      checkpointId: `verification_checkpoint_${input.dependencySuffix}`,
      repairJourneyRef,
      contactRouteRef: currentSnapshot.routeRef,
      contactRouteVersionRef: currentSnapshot.toSnapshot().routeVersionRef,
      preVerificationAssessmentRef: assessment.reachabilityAssessmentId,
      verificationMethod: "otp",
      verificationState: "pending",
      resultingContactRouteSnapshotRef: null,
      resultingReachabilityAssessmentRef: null,
      rebindState: "pending",
      dependentGrantRefs: [],
      dependentRouteIntentRefs: [],
      evaluatedAt: "2026-04-23T15:03:00.000Z",
    });
    await input.harness.reachabilityRepositories.saveContactRouteVerificationCheckpoint(checkpoint);
  }

  const dependency = ReachabilityDependencyDocument.create({
    dependencyId: `reachability_dependency_${input.dependencySuffix}`,
    episodeId: `episode_${input.pharmacyCaseId}`,
    requestId: `request_${input.pharmacyCaseId}`,
    domain: "pharmacy",
    domainObjectRef: `pharmacy_case:${input.pharmacyCaseId}:${input.purpose}`,
    requiredRouteRef: currentSnapshot.routeRef,
    contactRouteVersionRef: currentSnapshot.toSnapshot().routeVersionRef,
    currentContactRouteSnapshotRef: currentSnapshot.contactRouteSnapshotId,
    currentReachabilityAssessmentRef: assessment.reachabilityAssessmentId,
    reachabilityEpoch: 1,
    purpose: input.purpose,
    blockedActionScopeRefs: ["pharmacy_status_entry", "contact_route_repair"],
    selectedAnchorRef: `pharmacy_anchor_${input.pharmacyCaseId}`,
    requestReturnBundleRef: `return_bundle_${input.dependencySuffix}`,
    resumeContinuationRef: `resume_${input.dependencySuffix}`,
    repairJourneyRef,
    routeAuthorityState,
    routeHealthState,
    deliveryRiskState,
    repairState,
    deadlineAt: "2026-04-24T12:00:00.000Z",
    failureEffect:
      input.purpose === "urgent_return" ? "urgent_review" : "invalidate_pending_action",
    state: "active",
    createdAt: "2026-04-23T15:00:00.000Z",
    updatedAt: "2026-04-23T15:03:00.000Z",
  });
  await input.harness.reachabilityRepositories.saveReachabilityDependency(dependency);

  const currentCase = await load351CurrentCase(input.harness, input.pharmacyCaseId);
  const nextDependencies = [
    ...currentCase.activeReachabilityDependencyRefs,
    makeRef("ReachabilityDependency", dependency.dependencyId, TASK_344),
  ];
  await force351CaseSnapshot({
    harness: input.harness,
    pharmacyCaseId: input.pharmacyCaseId,
    recordedAt: "2026-04-23T15:04:00.000Z",
    patch: {
      activeReachabilityDependencyRefs: nextDependencies,
    },
  });

  return dependency.toSnapshot();
}

export async function attach351IdentityFreeze(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  pharmacyCaseId: string;
  suffix: string;
  released?: boolean;
}) {
  const branch = IdentityRepairBranchDispositionDocument.create({
    branchDispositionId: `identity_branch_${input.suffix}`,
    identityRepairCaseRef: `identity_case_${input.suffix}`,
    branchType: "pharmacy",
    governingObjectRef: `pharmacy_case:${input.pharmacyCaseId}`,
    frozenIdentityBindingRef: `identity_binding_${input.suffix}`,
    requiredDisposition: "suppress_visibility",
    compensationRef: null,
    revalidationSettlementRef: null,
    branchState: input.released ? "released" : "quarantined",
    releasedAt: input.released ? "2026-04-23T15:30:00.000Z" : null,
  });
  await input.harness.identityRepairRepositories.saveIdentityRepairBranchDisposition(branch);

  let releaseSettlementId: string | null = null;
  if (input.released) {
    const release = IdentityRepairReleaseSettlementDocument.create({
      releaseSettlementId: `identity_release_${input.suffix}`,
      identityRepairCaseRef: `identity_case_${input.suffix}`,
      resultingIdentityBindingRef: `identity_binding_${input.suffix}_corrected`,
      freezeRecordRef: `freeze_${input.suffix}`,
      downstreamDispositionRefs: [branch.branchDispositionId],
      projectionRebuildRef: `projection_rebuild_${input.suffix}`,
      replacementAccessGrantRefs: [],
      replacementRouteIntentBindingRefs: [],
      replacementSessionEstablishmentDecisionRef: null,
      communicationsResumeState: "resumed",
      releaseMode: "writable_resume",
      recordedAt: "2026-04-23T15:30:00.000Z",
    });
    await input.harness.identityRepairRepositories.saveIdentityRepairReleaseSettlement(release);
    releaseSettlementId = release.releaseSettlementId;
  }

  await force351CaseSnapshot({
    harness: input.harness,
    pharmacyCaseId: input.pharmacyCaseId,
    recordedAt: "2026-04-23T15:31:00.000Z",
    patch: {
      identityRepairBranchDispositionRef: makeRef(
        "IdentityRepairBranchDisposition",
        branch.branchDispositionId,
        TASK_342,
      ),
      identityRepairReleaseSettlementRef:
        releaseSettlementId === null
          ? null
          : makeRef(
              "IdentityRepairReleaseSettlement",
              releaseSettlementId,
              TASK_342,
            ),
    },
  });

  return {
    branch: branch.toSnapshot(),
    releaseSettlementId,
  };
}

export async function save351BounceBackRecord(input: {
  harness: ReturnType<typeof create351PatientStatusHarness>;
  pharmacyCaseId: string;
  suffix: string;
  bounceBackType: PharmacyBounceBackRecordSnapshot["bounceBackType"];
}) {
  const bounceBackRecord: PharmacyBounceBackRecordSnapshot = {
    bounceBackRecordId: `bounce_back_${input.suffix}`,
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCaseId, TASK_342),
    bounceBackEvidenceEnvelopeRef: makeRef(
      "PharmacyBounceBackEvidenceEnvelope",
      `bounce_evidence_${input.suffix}`,
      TASK_344,
    ),
    bounceBackType: input.bounceBackType,
    normalizedEvidenceRefs: [`bounce_evidence_${input.suffix}`],
    urgencyCarryFloor: input.bounceBackType === "urgent_gp_return" ? 100 : 50,
    materialChange: 0.8,
    loopRisk: 0.1,
    reopenSignal: 0.9,
    reopenPriorityBand: input.bounceBackType === "urgent_gp_return" ? 100 : 70,
    sourceOutcomeOrDispatchRef: null,
    reachabilityDependencyRef: null,
    patientInstructionRef: makeRef(
      "PharmacyPatientStatusProjection",
      `placeholder_instruction_${input.suffix}`,
      TASK_344,
    ),
    practiceVisibilityRef: makeRef(
      "PharmacyPracticeVisibilityProjection",
      `placeholder_visibility_${input.suffix}`,
      TASK_344,
    ),
    supervisorReviewState: "not_required",
    directUrgentRouteRef: null,
    gpActionRequired: input.bounceBackType === "urgent_gp_return",
    reopenedCaseStatus:
      input.bounceBackType === "urgent_gp_return"
        ? "urgent_bounce_back"
        : input.bounceBackType === "patient_not_contactable"
          ? "no_contact_return_pending"
          : "unresolved_returned",
    currentReachabilityPlanRef: null,
    wrongPatientFreezeState: "clear",
    autoRedispatchBlocked: true,
    autoCloseBlocked: true,
    returnedTaskRef: `returned_task_${input.suffix}`,
    reopenByAt: "2026-04-24T12:00:00.000Z",
    patientInformedAt: null,
    createdAt: "2026-04-23T15:40:00.000Z",
    updatedAt: "2026-04-23T15:40:00.000Z",
    version: 1,
  };
  await input.harness.patientStatusRepositories.saveBounceBackRecord(bounceBackRecord);
  return bounceBackRecord;
}
