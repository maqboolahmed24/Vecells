import { createDeterministicBackboneIdGenerator } from "../../packages/domain-kernel/src/index.ts";
import {
  createLifecycleCoordinatorService,
  createLifecycleCoordinatorStore,
  createReachabilityGovernorService,
} from "../../packages/domains/identity_access/src/index.ts";
import {
  createPhase6PharmacyBounceBackService,
  createPhase6PharmacyBounceBackStore,
  type IngestPharmacyBounceBackInput,
  type PharmacyBounceBackType,
  type PharmacyCaseSnapshot,
  type PharmacyPracticeTriageReentryState,
} from "../../packages/domains/pharmacy/src/index.ts";
import { stage351Shell } from "./351_pharmacy_patient_status.helpers.ts";
import {
  create352OutcomeHarness,
  load352CurrentCase,
  seed352OutcomeReadyCase,
} from "./352_pharmacy_outcome.helpers.ts";

export function create353BounceBackHarness() {
  const baseHarness = create352OutcomeHarness();
  const bounceBackRepositories = createPhase6PharmacyBounceBackStore();
  const lifecycleRepositories = createLifecycleCoordinatorStore();
  const lifecycleService = createLifecycleCoordinatorService(
    lifecycleRepositories,
    createDeterministicBackboneIdGenerator("353_lifecycle"),
  );
  const reachabilityGovernor = createReachabilityGovernorService(
    baseHarness.reachabilityRepositories,
    createDeterministicBackboneIdGenerator("353_reachability"),
  );
  const bounceBackService = createPhase6PharmacyBounceBackService({
    repositories: bounceBackRepositories,
    patientStatusRepositories: baseHarness.patientStatusRepositories,
    patientStatusService: baseHarness.patientStatusService,
    caseKernelService: baseHarness.caseKernelService,
    directoryRepositories: baseHarness.repositories,
    dispatchRepositories: baseHarness.dispatchRepositories,
    outcomeRepositories: baseHarness.outcomeRepositories,
    reachabilityRepositories: baseHarness.reachabilityRepositories,
    reachabilityGovernor,
    lifecycleRepositories,
    lifecycleService,
  });

  return {
    ...baseHarness,
    bounceBackRepositories,
    bounceBackService,
    lifecycleRepositories,
    lifecycleService,
    reachabilityGovernor,
  };
}

export async function seed353BounceBackReadyCase(input: {
  harness: ReturnType<typeof create353BounceBackHarness>;
  seed: string;
  routeKind?: "sms" | "voice" | "email";
}) {
  const seeded = await seed352OutcomeReadyCase({
    harness: input.harness,
    seed: input.seed,
  });
  const currentCase = await load352CurrentCase(input.harness, seeded.currentCase.pharmacyCaseId);
  const shell = await stage351Shell({
    harness: input.harness,
    pharmacyCaseId: currentCase.pharmacyCaseId,
    recordedAt: "2026-04-23T19:00:00.000Z",
  });
  const routeKind = input.routeKind ?? "sms";
  const frozenRoute = await input.harness.reachabilityGovernor.freezeContactRouteSnapshot({
    subjectRef: currentCase.patientRef.refId,
    routeRef: `contact_route_${input.seed}`,
    routeVersionRef: `contact_route_${input.seed}_v1`,
    routeKind,
    normalizedAddressRef:
      routeKind === "email"
        ? `${input.seed}@example.test`
        : routeKind === "voice"
          ? `tel:+447700900${input.seed.length.toString().padStart(3, "0")}`
          : `tel:+447700901${input.seed.length.toString().padStart(3, "0")}`,
    preferenceProfileRef: `preference_profile_${input.seed}`,
    verificationState: "verified_current",
    demographicFreshnessState: "current",
    preferenceFreshnessState: "current",
    sourceAuthorityClass: "patient_confirmed",
    createdAt: "2026-04-23T19:00:00.000Z",
  });

  return {
    ...seeded,
    currentCase,
    shellProjection: shell.shellProjection,
    patientContactRouteRef: frozenRoute.snapshot.toSnapshot().routeRef,
  };
}

export async function load353CurrentCase(
  harness: ReturnType<typeof create353BounceBackHarness>,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  return load352CurrentCase(harness, pharmacyCaseId);
}

export async function ingest353BounceBack(input: {
  harness: ReturnType<typeof create353BounceBackHarness>;
  pharmacyCaseId: string;
  patientShellConsistencyProjectionId: string;
  patientContactRouteRef: string;
  sourceKind?: IngestPharmacyBounceBackInput["sourceKind"];
  explicitBounceBackType?: PharmacyBounceBackType | null;
  evidenceSummaryRef?: string;
  recordedAt?: string;
  normalizedEvidenceRefs?: readonly string[];
  patientContactFailureSeverity?: number;
  contactRouteTrustFailure?: number;
  patientDeclinedRequiresAlternative?: boolean;
  outstandingClinicalWorkRequired?: boolean;
  emitPatientNotification?: boolean;
  deltaClinical?: number;
  deltaContact?: number;
  deltaProvider?: number;
  deltaConsent?: number;
  deltaTiming?: number;
}) {
  const currentCase = await load353CurrentCase(input.harness, input.pharmacyCaseId);
  return input.harness.bounceBackService.ingestBounceBackEvidence({
    pharmacyCaseId: input.pharmacyCaseId,
    patientShellConsistencyProjectionId: input.patientShellConsistencyProjectionId,
    patientContactRouteRef: input.patientContactRouteRef,
    sourceKind: input.sourceKind ?? "manual_capture",
    explicitBounceBackType: input.explicitBounceBackType ?? "routine_gp_return",
    normalizedEvidenceRefs:
      input.normalizedEvidenceRefs ?? [`evidence:${input.pharmacyCaseId}:${input.recordedAt ?? "default"}`],
    evidenceSummaryRef:
      input.evidenceSummaryRef ?? `evidence_summary:${input.pharmacyCaseId}:${input.recordedAt ?? "default"}`,
    trustClass: "medium",
    patientContactFailureSeverity: input.patientContactFailureSeverity,
    contactRouteTrustFailure: input.contactRouteTrustFailure,
    patientDeclinedRequiresAlternative: input.patientDeclinedRequiresAlternative,
    outstandingClinicalWorkRequired: input.outstandingClinicalWorkRequired,
    deltaClinical: input.deltaClinical,
    deltaContact: input.deltaContact,
    deltaProvider: input.deltaProvider,
    deltaConsent: input.deltaConsent,
    deltaTiming: input.deltaTiming,
    actorRef: `bounce_back_actor:${input.pharmacyCaseId}`,
    commandActionRecordRef: `bounce_back_action:${input.pharmacyCaseId}:${input.recordedAt ?? "default"}`,
    commandSettlementRecordRef: `bounce_back_settlement:${input.pharmacyCaseId}:${input.recordedAt ?? "default"}`,
    leaseRef: currentCase.leaseRef,
    expectedOwnershipEpoch: currentCase.ownershipEpoch,
    expectedLineageFenceRef: currentCase.lineageFenceRef,
    scopedMutationGateRef: `scoped_gate:${input.pharmacyCaseId}`,
    reasonCode: `ingest_bounce_back:${input.explicitBounceBackType ?? "routine_gp_return"}`,
    receivedAt: input.recordedAt ?? "2026-04-23T19:10:00.000Z",
    recordedAt: input.recordedAt ?? "2026-04-23T19:10:00.000Z",
    emitPatientNotification: input.emitPatientNotification,
  });
}

export async function load353Summary(
  harness: ReturnType<typeof create353BounceBackHarness>,
  pharmacyCaseId: string,
) {
  return harness.bounceBackService.getActiveBounceBackSummary(pharmacyCaseId);
}

export async function load353LoopPosture(
  harness: ReturnType<typeof create353BounceBackHarness>,
  pharmacyCaseId: string,
) {
  return harness.bounceBackService.getLoopRiskAndSupervisorPosture(pharmacyCaseId);
}

export async function resolve353SupervisorReview(input: {
  harness: ReturnType<typeof create353BounceBackHarness>;
  pharmacyCaseId: string;
  bounceBackRecordId: string;
  resolution: "resolved_allow_redispatch" | "resolved_keep_block" | "dismiss_as_material_change";
  recordedAt?: string;
}) {
  return input.harness.bounceBackService.resolveSupervisorReview({
    pharmacyCaseId: input.pharmacyCaseId,
    bounceBackRecordId: input.bounceBackRecordId,
    actorRef: `supervisor:${input.pharmacyCaseId}`,
    resolution: input.resolution,
    assignedSupervisorRef: `supervisor_owner:${input.pharmacyCaseId}`,
    resolutionNotesRef: `notes:${input.resolution}`,
    recordedAt: input.recordedAt ?? "2026-04-23T19:20:00.000Z",
  });
}

export async function reopen353FromBounceBack(input: {
  harness: ReturnType<typeof create353BounceBackHarness>;
  pharmacyCaseId: string;
  bounceBackRecordId: string;
  patientShellConsistencyProjectionId: string;
  reopenToStatus: "candidate_received" | "rules_evaluating" | "consent_pending";
  recordedAt?: string;
}): Promise<{
  triageReentryState: PharmacyPracticeTriageReentryState;
  result: Awaited<ReturnType<ReturnType<typeof create353BounceBackHarness>["bounceBackService"]["reopenCaseFromBounceBack"]>>;
}> {
  const currentCase = await load353CurrentCase(input.harness, input.pharmacyCaseId);
  const result = await input.harness.bounceBackService.reopenCaseFromBounceBack({
    pharmacyCaseId: input.pharmacyCaseId,
    bounceBackRecordId: input.bounceBackRecordId,
    patientShellConsistencyProjectionId: input.patientShellConsistencyProjectionId,
    actorRef: `reopen_actor:${input.pharmacyCaseId}`,
    commandActionRecordRef: `reopen_action:${input.pharmacyCaseId}`,
    commandSettlementRecordRef: `reopen_settlement:${input.pharmacyCaseId}`,
    leaseRef: currentCase.leaseRef,
    expectedOwnershipEpoch: currentCase.ownershipEpoch,
    expectedLineageFenceRef: currentCase.lineageFenceRef,
    scopedMutationGateRef: `reopen_gate:${input.pharmacyCaseId}`,
    reasonCode: `reopen_from_bounce_back:${input.reopenToStatus}`,
    recordedAt: input.recordedAt ?? "2026-04-23T19:30:00.000Z",
    reopenToStatus: input.reopenToStatus,
  });

  return {
    triageReentryState: result.bounceBackTruthProjection.triageReentryState,
    result,
  };
}
