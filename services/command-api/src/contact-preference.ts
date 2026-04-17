import {
  createDraftAutosaveStore,
  createDraftSessionAutosaveService,
  createReachabilityGovernorService,
  createReachabilityStore,
  type DraftAutosaveDependencies,
  type ReachabilityDependencies,
} from "@vecells/domain-identity-access";
import {
  createPhase1ContactPreferenceService,
  createPhase1ContactPreferenceStore,
  type CaptureContactPreferencesInput,
  type CaptureContactPreferencesResult,
  type ContactPreferenceMaskedView,
  type ContactPreferenceValidationSummary,
  type FreezeContactPreferencesForSubmitResult,
  type Phase1ContactPreferenceRepositories,
} from "../../../packages/domains/intake_request/src/index";
import { createSubmissionEnvelopeValidationApplication } from "./submission-envelope-validation";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

function defaultSourceAuthorityClass(
  surfaceChannelProfile: "browser" | "embedded",
): CaptureContactPreferencesInput["sourceAuthorityClass"] {
  return surfaceChannelProfile === "embedded"
    ? "self_service_embedded_entry"
    : "self_service_browser_entry";
}

export const contactPreferencePersistenceTables = [
  "phase1_contact_preference_captures",
  "phase1_contact_preference_masked_views",
  "phase1_contact_route_snapshot_seeds",
  "phase1_contact_preference_submit_freezes",
  "contact_route_snapshots",
] as const;

export const contactPreferenceMigrationPlanRefs = [
  "services/command-api/migrations/069_contact_route_and_reachability.sql",
  "services/command-api/migrations/080_identity_repair_and_reachability_governor.sql",
  "services/command-api/migrations/082_draft_session_lease_and_autosave.sql",
  "services/command-api/migrations/084_phase1_contact_preference_capture.sql",
] as const;

export interface ContactPreferenceApplication {
  readonly repositories: DraftAutosaveDependencies & ReachabilityDependencies;
  readonly drafts: ReturnType<typeof createDraftSessionAutosaveService>;
  readonly contactPreferenceRepositories: Phase1ContactPreferenceRepositories;
  readonly contactPreferences: ReturnType<typeof createPhase1ContactPreferenceService>;
  readonly reachabilityGovernor: ReturnType<typeof createReachabilityGovernorService>;
  readonly validation: ReturnType<typeof createSubmissionEnvelopeValidationApplication>;
  readonly migrationPlanRef: (typeof contactPreferenceMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof contactPreferenceMigrationPlanRefs;
  captureContactPreferences(
    input: Omit<CaptureContactPreferencesInput, "envelopeRef" | "sourceAuthorityClass"> & {
      sourceAuthorityClass?: CaptureContactPreferencesInput["sourceAuthorityClass"];
    },
  ): Promise<CaptureContactPreferencesResult>;
  getMaskedContactPreferenceView(draftPublicId: string): Promise<ContactPreferenceMaskedView | null>;
  buildContactPreferenceValidationSummary(
    draftPublicId: string,
  ): Promise<ContactPreferenceValidationSummary>;
  freezeContactPreferencesForSubmit(input: {
    draftPublicId: string;
    frozenAt: string;
  }): Promise<FreezeContactPreferencesForSubmitResult>;
  mintInitialContactRouteSnapshot(input: {
    draftPublicId: string;
    subjectRef: string;
    createdAt: string;
  }): Promise<{
    routeSnapshotSeedRef: string;
    contactPreferencesRef: string;
    contactRouteSnapshotRef: string;
  }>;
}

export function createContactPreferenceApplication(options?: {
  repositories?: DraftAutosaveDependencies;
  reachabilityRepositories?: ReachabilityDependencies;
  contactPreferenceRepositories?: Phase1ContactPreferenceRepositories;
  idGenerator?: BackboneIdGenerator;
}) {
  const draftRepositories = options?.repositories ?? createDraftAutosaveStore();
  const reachabilityRepositories = options?.reachabilityRepositories ?? createReachabilityStore();
  const repositories = new Proxy(
    {},
    {
      get(_target, property, receiver) {
        const draftValue = Reflect.get(draftRepositories as object, property, receiver);
        if (draftValue !== undefined) {
          return typeof draftValue === "function" ? draftValue.bind(draftRepositories) : draftValue;
        }
        const reachabilityValue = Reflect.get(
          reachabilityRepositories as object,
          property,
          receiver,
        );
        return typeof reachabilityValue === "function"
          ? reachabilityValue.bind(reachabilityRepositories)
          : reachabilityValue;
      },
      has(_target, property) {
        return property in draftRepositories || property in reachabilityRepositories;
      },
    },
  ) as DraftAutosaveDependencies & ReachabilityDependencies;
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("command_api_contact_preferences");
  const drafts = createDraftSessionAutosaveService(repositories, idGenerator);
  const contactPreferenceRepositories =
    options?.contactPreferenceRepositories ?? createPhase1ContactPreferenceStore();
  const contactPreferences = createPhase1ContactPreferenceService({
    repositories: contactPreferenceRepositories,
    idGenerator,
  });
  const reachabilityGovernor = createReachabilityGovernorService(repositories, idGenerator);

  async function requireProjection(draftPublicId: string) {
    const projection = await repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
    if (!projection) {
      throw new Error(`Draft projection not found for ${draftPublicId}.`);
    }
    return projection;
  }

  const validation = createSubmissionEnvelopeValidationApplication({
    repositories,
    contactPreferenceResolver: async ({ draftPublicId, envelopeRef }) =>
      contactPreferences.buildValidationSummaryForDraft(draftPublicId, envelopeRef),
  });

  const application: ContactPreferenceApplication = {
    repositories,
    drafts,
    contactPreferenceRepositories,
    contactPreferences,
    reachabilityGovernor,
    validation,
    migrationPlanRef: contactPreferenceMigrationPlanRefs[3],
    migrationPlanRefs: contactPreferenceMigrationPlanRefs,
    async captureContactPreferences(input) {
      const projection = await requireProjection(input.draftPublicId);
      const snapshot = projection.toSnapshot();
      return contactPreferences.captureContactPreferences({
        ...input,
        envelopeRef: snapshot.envelopeRef,
        sourceAuthorityClass:
          input.sourceAuthorityClass ?? defaultSourceAuthorityClass(snapshot.surfaceChannelProfile),
      });
    },
    async getMaskedContactPreferenceView(draftPublicId: string) {
      const maskedView = await contactPreferences.getLatestMaskedViewForDraft(draftPublicId);
      return maskedView?.toSnapshot() ?? null;
    },
    async buildContactPreferenceValidationSummary(draftPublicId: string) {
      const projection = await requireProjection(draftPublicId);
      return contactPreferences.buildValidationSummaryForDraft(
        draftPublicId,
        projection.toSnapshot().envelopeRef,
      );
    },
    async freezeContactPreferencesForSubmit(input: { draftPublicId: string; frozenAt: string }) {
      const projection = await requireProjection(input.draftPublicId);
      return contactPreferences.freezeContactPreferencesForSubmit({
        draftPublicId: input.draftPublicId,
        envelopeRef: projection.toSnapshot().envelopeRef,
        frozenAt: input.frozenAt,
      });
    },
    async mintInitialContactRouteSnapshot(input: {
      draftPublicId: string;
      subjectRef: string;
      createdAt: string;
    }) {
      await requireProjection(input.draftPublicId);
      const seed =
        await contactPreferences.getLatestRouteSnapshotSeedForDraft(input.draftPublicId);
      if (!seed) {
        throw new Error(
          `No route snapshot seed exists for ${input.draftPublicId}; capture complete contact preferences first.`,
        );
      }
      const seedSnapshot = seed.toSnapshot();
      const frozen = await reachabilityGovernor.freezeContactRouteSnapshot({
        subjectRef: input.subjectRef,
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
        createdAt: input.createdAt,
      });
      return {
        routeSnapshotSeedRef: seedSnapshot.routeSnapshotSeedId,
        contactPreferencesRef: seedSnapshot.contactPreferencesRef,
        contactRouteSnapshotRef: frozen.snapshot.contactRouteSnapshotId,
      };
    },
  };

  return application;
}
