import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import { type SubmissionLineageEventEnvelope } from "@vecells/event-contracts";
import {
  createReachabilityGovernorService,
  createReachabilityStore,
  type ReachabilityDependencies,
} from "@vecells/domain-identity-access";
import {
  createPhase1ConfirmationDispatchService,
  createPhase1ConfirmationDispatchStore,
  type Phase1ConfirmationDispatchRepositories,
} from "../../../packages/domains/communications/src/index";
import {
  createPhase1ContactPreferenceStore,
  type ContactPreferenceValidationSummary,
  type Phase1ContactPreferenceRepositories,
} from "../../../packages/domains/intake_request/src/index";

function addDays(timestamp: string, days: number): string {
  return new Date(Date.parse(timestamp) + days * 24 * 60 * 60 * 1000).toISOString();
}

export const confirmationDispatchPersistenceTables = [
  "phase1_confirmation_communication_envelopes",
  "phase1_confirmation_transport_settlements",
  "phase1_confirmation_delivery_evidence",
  "phase1_confirmation_receipt_bridges",
  "reachability_dependencies",
  "reachability_assessment_records",
] as const;

export const confirmationDispatchMigrationPlanRefs = [
  "services/command-api/migrations/069_contact_route_and_reachability.sql",
  "services/command-api/migrations/080_identity_repair_and_reachability_governor.sql",
  "services/command-api/migrations/084_phase1_contact_preference_capture.sql",
  "services/command-api/migrations/089_phase1_confirmation_dispatch_and_observability.sql",
] as const;

export interface QueueRoutineConfirmationInput {
  requestRef: string;
  requestLineageRef: string;
  triageTaskRef: string;
  receiptEnvelopeRef: string;
  outcomeArtifactRef: string;
  routeSubjectRef: string;
  contactSummary: ContactPreferenceValidationSummary | null;
  queuedAt: string;
}

export interface ConfirmationDispatchApplication {
  readonly communicationRepositories: Phase1ConfirmationDispatchRepositories;
  readonly communication: ReturnType<typeof createPhase1ConfirmationDispatchService>;
  readonly reachabilityRepositories: ReachabilityDependencies;
  readonly reachabilityGovernor: ReturnType<typeof createReachabilityGovernorService>;
  readonly contactPreferenceRepositories: Phase1ContactPreferenceRepositories;
  readonly migrationPlanRef: (typeof confirmationDispatchMigrationPlanRefs)[3];
  readonly migrationPlanRefs: typeof confirmationDispatchMigrationPlanRefs;
  queueRoutineConfirmation(input: QueueRoutineConfirmationInput): Promise<{
    replayed: boolean;
    communicationEnvelopeRef: string;
    receiptBridgeRef: string;
    reachabilityDependencyRef: string | null;
    currentContactRouteSnapshotRef: string | null;
    currentReachabilityAssessmentRef: string | null;
    events: readonly SubmissionLineageEventEnvelope<unknown>[];
  }>;
}

export function createConfirmationDispatchApplication(options?: {
  communicationRepositories?: Phase1ConfirmationDispatchRepositories;
  reachabilityRepositories?: ReachabilityDependencies;
  contactPreferenceRepositories?: Phase1ContactPreferenceRepositories;
  idGenerator?: BackboneIdGenerator;
}) {
  const communicationRepositories =
    options?.communicationRepositories ?? createPhase1ConfirmationDispatchStore();
  const reachabilityRepositories =
    options?.reachabilityRepositories ?? createReachabilityStore();
  const contactPreferenceRepositories =
    options?.contactPreferenceRepositories ?? createPhase1ContactPreferenceStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_confirmation_dispatch");
  const communication = createPhase1ConfirmationDispatchService({
    repositories: communicationRepositories,
    idGenerator,
  });
  const reachabilityGovernor = createReachabilityGovernorService(
    reachabilityRepositories,
    idGenerator,
  );

  const application: ConfirmationDispatchApplication = {
    communicationRepositories,
    communication,
    reachabilityRepositories,
    reachabilityGovernor,
    contactPreferenceRepositories,
    migrationPlanRef: confirmationDispatchMigrationPlanRefs[3],
    migrationPlanRefs: confirmationDispatchMigrationPlanRefs,
    async queueRoutineConfirmation(input: QueueRoutineConfirmationInput) {
      const contactSummary = input.contactSummary;
      const preferredChannel = contactSummary?.preferredChannel;
      const maskedDestination = contactSummary?.preferredDestinationMasked;
      if (!preferredChannel || !maskedDestination) {
        const queued = await communication.queueConfirmationCommunication({
          requestRef: input.requestRef,
          requestLineageRef: input.requestLineageRef,
          triageTaskRef: input.triageTaskRef,
          receiptEnvelopeRef: input.receiptEnvelopeRef,
          outcomeArtifactRef: input.outcomeArtifactRef,
          contactPreferencesRef: contactSummary?.contactPreferencesRef ?? null,
          routeSnapshotSeedRef: contactSummary?.routeSnapshotSeedRef ?? null,
          preferredChannel: "email",
          maskedDestination: maskedDestination ?? "Not provided",
          templateVariantRef: "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
          routeAuthorityState: "unknown",
          reachabilityAssessmentState: "blocked",
          deliveryRiskState: "unknown",
          enqueueIdempotencyKey: `confirm_dispatch::${input.requestRef}::${input.receiptEnvelopeRef}`,
          queuedAt: input.queuedAt,
        });
        return {
          replayed: queued.replayed,
          communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
          receiptBridgeRef: queued.receiptBridge.receiptBridgeId,
          reachabilityDependencyRef: null,
          currentContactRouteSnapshotRef: null,
          currentReachabilityAssessmentRef: null,
          events: queued.events,
        };
      }

      const existing = await communicationRepositories.findCommunicationEnvelopeByIdempotencyKey(
        `confirm_dispatch::${input.requestRef}::${input.receiptEnvelopeRef}`,
      );
      if (existing) {
        const bridge = await communication.getReceiptBridgeForCommunicationEnvelope(
          existing.communicationEnvelopeId,
        );
        return {
          replayed: true,
          communicationEnvelopeRef: existing.communicationEnvelopeId,
          receiptBridgeRef: bridge?.receiptBridgeId ?? "missing_receipt_bridge",
          reachabilityDependencyRef: existing.toSnapshot().reachabilityDependencyRef,
          currentContactRouteSnapshotRef: existing.toSnapshot().currentContactRouteSnapshotRef,
          currentReachabilityAssessmentRef:
            existing.toSnapshot().currentReachabilityAssessmentRef,
          events: [],
        };
      }

      let currentContactRouteSnapshotRef: string | null = null;
      let currentReachabilityAssessmentRef: string | null = null;
      let reachabilityDependencyRef: string | null = null;
      let routeAuthorityState:
        | "current"
        | "stale_verification"
        | "stale_demographics"
        | "stale_preferences"
        | "disputed"
        | "superseded"
        | "unknown" = "unknown";
      let reachabilityAssessmentState:
        | "clear"
        | "at_risk"
        | "blocked"
        | "disputed"
        | "unknown" = "blocked";
      let deliveryRiskState:
        | "on_track"
        | "at_risk"
        | "likely_failed"
        | "disputed"
        | "unknown" = "unknown";

      const routeSnapshotSeedRef = contactSummary?.routeSnapshotSeedRef ?? null;
      if (routeSnapshotSeedRef) {
        const seed =
          await contactPreferenceRepositories.getContactRouteSnapshotSeed(routeSnapshotSeedRef);
        if (seed) {
          const seedSnapshot = seed.toSnapshot();
          const frozen = await reachabilityGovernor.freezeContactRouteSnapshot({
            subjectRef: input.routeSubjectRef,
            routeRef: seedSnapshot.routeRef,
            routeVersionRef: seedSnapshot.routeVersionRef,
            routeKind: seedSnapshot.routeKind,
            normalizedAddressRef: seedSnapshot.normalizedAddressRef,
            preferenceProfileRef: seedSnapshot.contactPreferencesRef,
            verificationCheckpointRef: null,
            verificationState: seedSnapshot.verificationState,
            demographicFreshnessState: seedSnapshot.demographicFreshnessState,
            preferenceFreshnessState: seedSnapshot.preferenceFreshnessState,
            sourceAuthorityClass: seedSnapshot.sourceAuthorityClass,
            createdAt: input.queuedAt,
          });
          const dependencyResult = await reachabilityGovernor.createDependency({
            episodeId: input.requestLineageRef,
            requestId: input.requestRef,
            domain: "patient",
            domainObjectRef: `confirmation_queue::${input.requestRef}`,
            requiredRouteRef: seedSnapshot.routeRef,
            purpose: "outcome_confirmation",
            blockedActionScopeRefs: ["status_view", "contact_route_repair"],
            selectedAnchorRef: "receipt_outcome",
            requestReturnBundleRef: null,
            resumeContinuationRef: null,
            deadlineAt: addDays(input.queuedAt, 2),
            failureEffect: "invalidate_pending_action",
            assessedAt: input.queuedAt,
          });
          currentContactRouteSnapshotRef = frozen.snapshot.contactRouteSnapshotId;
          currentReachabilityAssessmentRef =
            dependencyResult.assessment.reachabilityAssessmentId;
          reachabilityDependencyRef = dependencyResult.dependency.dependencyId;
          routeAuthorityState = dependencyResult.assessment.toSnapshot().routeAuthorityState;
          reachabilityAssessmentState =
            dependencyResult.assessment.toSnapshot().assessmentState;
          deliveryRiskState = dependencyResult.assessment.toSnapshot().deliveryRiskState;
        }
      }

      const queued = await communication.queueConfirmationCommunication({
        requestRef: input.requestRef,
        requestLineageRef: input.requestLineageRef,
        triageTaskRef: input.triageTaskRef,
        receiptEnvelopeRef: input.receiptEnvelopeRef,
        outcomeArtifactRef: input.outcomeArtifactRef,
        contactPreferencesRef: contactSummary?.contactPreferencesRef ?? null,
        routeSnapshotSeedRef: contactSummary?.routeSnapshotSeedRef ?? null,
        currentContactRouteSnapshotRef,
        currentReachabilityAssessmentRef,
        reachabilityDependencyRef,
        preferredChannel:
          preferredChannel === "phone" ? "sms" : preferredChannel,
        maskedDestination,
        templateVariantRef: "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
        routeAuthorityState,
        reachabilityAssessmentState,
        deliveryRiskState,
        enqueueIdempotencyKey: `confirm_dispatch::${input.requestRef}::${input.receiptEnvelopeRef}`,
        queuedAt: input.queuedAt,
      });
      return {
        replayed: queued.replayed,
        communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
        receiptBridgeRef: queued.receiptBridge.receiptBridgeId,
        reachabilityDependencyRef,
        currentContactRouteSnapshotRef,
        currentReachabilityAssessmentRef,
        events: queued.events,
      };
    },
  };

  return application;
}
