import {
  type AccessGrantIssuanceOutcome,
  accessGrantParallelInterfaceGaps,
  createAccessGrantService,
  createIdentityAccessStore,
  type IdentityAccessDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  RequestAggregate,
} from "@vecells/domain-kernel";
import { EpisodeAggregate } from "@vecells/domain-identity-access";

export const accessGrantPersistenceTables = [
  "episodes",
  "requests",
  "access_grant_scope_envelopes",
  "access_grants",
  "access_grant_redemption_records",
  "access_grant_supersession_records",
] as const;

export const accessGrantMigrationPlanRefs = [
  "services/command-api/migrations/068_identity_binding_and_access_grants.sql",
] as const;

export interface AccessGrantScenarioResult {
  readonly scenarioId: string;
  readonly title: string;
  readonly outcome:
    | AccessGrantIssuanceOutcome
    | "issued_and_redeemed"
    | "step_up"
    | "reissued"
    | "revoked";
  readonly grantRef: string | null;
  readonly redemptionRef: string | null;
  readonly supersessionRef: string | null;
}

class AccessGrantSimulationHarness {
  constructor(
    private readonly repositories: IdentityAccessDependencies,
    private readonly accessGrantService: ReturnType<typeof createAccessGrantService>,
  ) {}

  private async seedLineage(requestId: string, episodeId: string, requestLineageRef: string) {
    const existingEpisode = await this.repositories.getEpisode(episodeId);
    if (!existingEpisode) {
      await this.repositories.saveEpisode(
        EpisodeAggregate.create({
          episodeId,
          episodeFingerprint: `fp_${episodeId}`,
          openedAt: "2026-04-12T16:00:00Z",
        }),
      );
    }
    const existingRequest = await this.repositories.getRequest(requestId);
    if (!existingRequest) {
      await this.repositories.saveRequest(
        RequestAggregate.create({
          requestId,
          episodeId,
          originEnvelopeRef: `envelope_${requestId}`,
          promotionRecordRef: `promotion_${requestId}`,
          tenantId: "tenant_078",
          sourceChannel: "self_service_form",
          originIngressRecordRef: `ingress_${requestId}`,
          normalizedSubmissionRef: `normalized_${requestId}`,
          requestType: "clinical_question",
          requestLineageRef,
          createdAt: "2026-04-12T16:00:00Z",
        }),
      );
    }
  }

  async runAllScenarios(): Promise<readonly AccessGrantScenarioResult[]> {
    await this.seedLineage("request_078_harness", "episode_078_harness", "lineage_078_harness");

    const draft = await this.accessGrantService.issueGrantForUseCase({
      useCase: "draft_resume",
      routeFamilyRef: "rf_intake_self_service",
      governingObjectRef: "envelope_078_harness",
      governingVersionRef: "envelope_078_harness_v1",
      recoveryRouteRef: "rf_patient_secure_link_recovery",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedLineageFenceEpoch: 1,
      presentedToken: "",
      expiresAt: "2026-04-12T16:45:00Z",
      createdAt: "2026-04-12T16:01:00Z",
    });

    const message = await this.accessGrantService.issueGrantForUseCase({
      useCase: "message_reply",
      routeFamilyRef: "rf_patient_messages",
      governingObjectRef: "message_thread_078_harness",
      governingVersionRef: "message_thread_078_harness_v1",
      issuedRouteIntentBindingRef: "route_intent_078_harness_message",
      requiredIdentityBindingRef: "binding_078_harness",
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_078_harness_message",
      requiredReleaseApprovalFreezeRef: "release_freeze_078_harness_message",
      requiredAssuranceSliceTrustRefs: ["assurance_slice_078_harness_message"],
      recoveryRouteRef: "rf_recover_message_reply",
      subjectRef: "subject_078_harness",
      boundPatientRef: "patient_078_harness",
      issuedIdentityBindingRef: "binding_078_harness",
      boundContactRouteRef: "contact_route_078_harness_sms",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedSessionEpochRef: "session_epoch_078_harness",
      issuedSubjectBindingVersionRef: "binding_078_harness@v1",
      issuedLineageFenceEpoch: 2,
      presentedToken: "",
      expiresAt: "2026-04-12T16:35:00Z",
      createdAt: "2026-04-12T16:02:00Z",
    });

    const redeemed =
      draft.outcome === "issued"
        ? await this.accessGrantService.redeemGrant({
            presentedToken: draft.materializedToken?.opaqueToken ?? "missing",
            context: {
              routeFamily: "rf_intake_self_service",
              actionScope: "envelope_resume",
              lineageScope: "envelope",
              governingObjectRef: "envelope_078_harness",
              governingVersionRef: "envelope_078_harness_v1",
              routeIntentBindingState: "live",
              lineageFenceEpoch: 1,
              tokenKeyVersionRef: "token_key_local_v1",
            },
            recordedAt: "2026-04-12T16:03:00Z",
          })
        : null;

    const recoverOnly = await this.accessGrantService.issueGrantForUseCase({
      useCase: "recover_only",
      routeFamilyRef: "rf_patient_secure_link_recovery",
      governingObjectRef: "request_078_harness",
      governingVersionRef: "request_078_harness_v1",
      recoveryRouteRef: "rf_patient_secure_link_recovery",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedLineageFenceEpoch: 3,
      presentedToken: "",
      expiresAt: "2026-04-12T16:50:00Z",
      createdAt: "2026-04-12T16:04:00Z",
    });

    const manualOnly = await this.accessGrantService.issueGrantForUseCase({
      useCase: "support_reissue",
      requestedOutcome: "manual_only",
      routeFamilyRef: "rf_patient_secure_link_recovery",
      governingObjectRef: "request_078_harness",
      governingVersionRef: "request_078_harness_v1",
      recoveryRouteRef: "rf_patient_secure_link_recovery",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedLineageFenceEpoch: 3,
      presentedToken: "",
      expiresAt: "2026-04-12T16:50:00Z",
      createdAt: "2026-04-12T16:05:00Z",
    });

    const reissued =
      message.outcome === "issued"
        ? await this.accessGrantService.replaceGrant({
            priorGrantRef: message.grant.grantId,
            causeClass: "secure_link_reissue",
            recordedAt: "2026-04-12T16:06:00Z",
            lineageFenceEpoch: 4,
            governingObjectRef: "message_thread_078_harness",
            replacementGrant: {
              grantFamily: "transaction_action_minimal",
              actionScope: "message_thread_entry",
              lineageScope: "request",
              routeFamilyRef: "rf_patient_messages",
              governingObjectRef: "message_thread_078_harness",
              governingVersionRef: "message_thread_078_harness_v2",
              phiExposureClass: "minimal",
              issuedRouteIntentBindingRef: "route_intent_078_harness_message_v2",
              requiredIdentityBindingRef: "binding_078_harness",
              requiredReleaseApprovalFreezeRef: "release_freeze_078_harness_message_v2",
              requiredChannelReleaseFreezeRef: null,
              requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_078_harness_message_v2",
              minimumBridgeCapabilitiesRef: null,
              requiredAssuranceSliceTrustRefs: ["assurance_slice_078_harness_message"],
              recoveryRouteRef: "rf_recover_message_reply",
              subjectRef: "subject_078_harness",
              boundPatientRef: "patient_078_harness",
              issuedIdentityBindingRef: "binding_078_harness",
              boundContactRouteRef: "contact_route_078_harness_sms",
              subjectBindingMode: "hard_subject",
              tokenKeyVersionRef: "token_key_local_v1",
              issuedSessionEpochRef: "session_epoch_078_harness_v2",
              issuedSubjectBindingVersionRef: "binding_078_harness@v2",
              issuedLineageFenceEpoch: 4,
              presentedToken: "",
              expiresAt: "2026-04-12T16:55:00Z",
              createdAt: "2026-04-12T16:06:00Z",
            },
          })
        : null;

    const revoked = reissued
      ? await this.accessGrantService.revokeGrant({
          grantRef: reissued.replacement.grant.grantId,
          governingObjectRef: "message_thread_078_harness",
          lineageFenceEpoch: 5,
          causeClass: "logout",
          reasonCodes: ["LOGOUT_REQUESTED"],
          recordedAt: "2026-04-12T16:07:00Z",
        })
      : null;

    return [
      {
        scenarioId: "draft_resume_grant",
        title: "Draft resume issues a redeemable minimal continuation grant.",
        outcome: "issued_and_redeemed",
        grantRef: draft.outcome === "issued" ? draft.grant.grantId : null,
        redemptionRef: redeemed?.redemption?.redemptionId ?? null,
        supersessionRef: redeemed?.supersession?.supersessionId ?? null,
      },
      {
        scenarioId: "recover_only_outcome",
        title: "Legacy or drifted continuity can emit an explicit recover-only disposition.",
        outcome: recoverOnly.outcome,
        grantRef: null,
        redemptionRef: null,
        supersessionRef: null,
      },
      {
        scenarioId: "manual_only_outcome",
        title: "Unsafe support reissue can degrade to manual-only instead of minting a link.",
        outcome: manualOnly.outcome,
        grantRef: null,
        redemptionRef: null,
        supersessionRef: null,
      },
      {
        scenarioId: "message_reissue",
        title: "Support reissue replaces an old message grant with a fresh canonical token.",
        outcome: "reissued",
        grantRef: reissued?.replacement.grant.grantId ?? null,
        redemptionRef: null,
        supersessionRef: reissued?.supersession.supersessionId ?? null,
      },
      {
        scenarioId: "logout_revoke",
        title: "Logout supersedes the currently live replacement grant.",
        outcome: "revoked",
        grantRef: revoked?.revokedGrant.grantId ?? null,
        redemptionRef: null,
        supersessionRef: revoked?.supersession.supersessionId ?? null,
      },
    ];
  }
}

export interface AccessGrantApplication {
  readonly repositories: IdentityAccessDependencies;
  readonly accessGrantService: ReturnType<typeof createAccessGrantService>;
  readonly simulation: AccessGrantSimulationHarness;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  readonly parallelInterfaceGaps: readonly string[];
}

export function createAccessGrantApplication(options?: {
  repositories?: IdentityAccessDependencies;
  idGenerator?: BackboneIdGenerator;
}): AccessGrantApplication {
  const repositories = options?.repositories ?? createIdentityAccessStore();
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("command_api_access_grant");
  const accessGrantService = createAccessGrantService(repositories, idGenerator);
  const simulation = new AccessGrantSimulationHarness(repositories, accessGrantService);

  return {
    repositories,
    accessGrantService,
    simulation,
    persistenceTables: accessGrantPersistenceTables,
    migrationPlanRef: accessGrantMigrationPlanRefs[0],
    migrationPlanRefs: accessGrantMigrationPlanRefs,
    parallelInterfaceGaps: accessGrantParallelInterfaceGaps,
  };
}
