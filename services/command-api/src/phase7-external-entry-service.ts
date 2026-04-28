import { createHash } from "node:crypto";
import {
  createAccessGrantSupersessionApplication,
  type AccessGrantActionScope,
  type AccessGrantFamily,
  type AccessGrantRecord,
  type AccessGrantScopeEnvelopeRecord,
  type AccessGrantService,
  type IssueAccessGrantResult,
  type RedeemAccessGrantResult,
} from "./access-grant-supersession";
import type { RouteRuntimeTuple, VerificationLevel } from "./capability-decision-engine";
import {
  createDefaultPhase7NhsAppManifestApplication,
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_MINIMUM_BRIDGE_REF,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  type JourneyPathDefinition,
  type NhsAppEnvironment,
  type Phase7NhsAppManifestApplication,
  type RouteExposureState,
} from "./phase7-nhs-app-manifest-service";

export const PHASE7_EXTERNAL_ENTRY_SERVICE_NAME = "Phase7ExternalEntryResolutionService";
export const PHASE7_EXTERNAL_ENTRY_SCHEMA_VERSION = "380.phase7.external-entry.v1";

const RECORDED_AT = "2026-04-27T00:20:15.000Z";
const DEFAULT_GRANT_EXPIRES_AT = "2026-04-27T00:35:15.000Z";
const DEFAULT_ASSOCIATION_PATHS = ["/requests/*", "/requests/drafts/*", "/appointments/*"] as const;

export type ExternalEntryMode =
  | "canonical_deep_link"
  | "nhs_app_site_link"
  | "secure_link"
  | "email_link"
  | "sms_link"
  | "continuation_link"
  | "return_to_journey";
export type ExternalResolutionOutcome =
  | "resolved_full"
  | "summary_only"
  | "placeholder_only"
  | "verification_required"
  | "bounded_recovery"
  | "denied";
export type GrantFenceState =
  | "accepted"
  | "not_presented"
  | "not_found"
  | "expired"
  | "replayed"
  | "superseded"
  | "revoked"
  | "drifted"
  | "denied";
export type SubjectBindingFenceState =
  | "not_required"
  | "matched"
  | "missing_session"
  | "subject_mismatch"
  | "session_epoch_mismatch"
  | "subject_binding_mismatch"
  | "assurance_step_up_required";
export type DraftResumeFenceState =
  | "not_applicable"
  | "same_submission_ingress"
  | "submission_ingress_mismatch"
  | "draft_promoted_request_shell_only";
export type SessionRecoveryDecision =
  | "reuse"
  | "establish_embedded_session"
  | "rotate_from_continuation"
  | "recover_only"
  | "deny";

export interface DeepLinkableRouteDefinition {
  readonly journeyPathId: string;
  readonly pathPattern: string;
  readonly routeFamilyRef: string;
  readonly actionScope: AccessGrantActionScope;
  readonly grantFamily: AccessGrantFamily;
  readonly minimumAssuranceLevel: VerificationLevel;
  readonly subjectBindingRequired: boolean;
  readonly lineageKind: "draft" | "request" | "episode" | "support_case";
  readonly summarySafetyTier: string;
  readonly placeholderContractRef: string;
  readonly fallbackRoute: string;
  readonly routeFreezeDispositionRef: string;
  readonly routeExposureState: RouteExposureState;
  readonly phiExposureClass: "none" | "minimal" | "scoped_phi";
  readonly visibilityScope: RouteRuntimeTuple["visibilityScope"];
  readonly manifestVersionRef: string;
}

export interface SiteLinkManifest {
  readonly manifestId: string;
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly configFingerprintRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly canonicalGrantServiceRef: "AccessGrantService";
  readonly routeIntentBindingRequired: true;
  readonly androidAssetLinksRef: string;
  readonly iosAssociationRef: string;
  readonly allowedPathPatterns: readonly string[];
  readonly routes: readonly DeepLinkableRouteDefinition[];
  readonly environmentBindings: {
    readonly baseUrl: string;
    readonly androidPackageName: string;
    readonly androidCertFingerprintRef: string;
    readonly iosAppId: string;
  };
  readonly generatedAt: string;
}

export interface AndroidAssetLinksExport {
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly contentType: "application/json";
  readonly wellKnownPath: "/.well-known/assetlinks.json";
  readonly body: readonly [
    {
      readonly relation: readonly ["delegate_permission/common.handle_all_urls"];
      readonly target: {
        readonly namespace: "android_app";
        readonly package_name: string;
        readonly sha256_cert_fingerprints: readonly string[];
      };
    },
  ];
}

export interface IosAssociationExport {
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly contentType: "application/json";
  readonly wellKnownPath: "/.well-known/apple-app-site-association";
  readonly body: {
    readonly applinks: {
      readonly apps: readonly [];
      readonly details: readonly [
        {
          readonly appID: string;
          readonly paths: readonly string[];
        },
      ];
    };
  };
}

export interface ExternalEntrySessionSnapshot {
  readonly sessionRef: string;
  readonly subjectRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly assuranceLevel: VerificationLevel;
  readonly sessionState: "none" | "active" | "step_up_required" | "restricted" | "expired";
  readonly embeddedSessionRef?: string | null;
}

export interface DraftResumeFenceSnapshot {
  readonly draftRef: string;
  readonly expectedSubmissionIngressRecordRef: string | null;
  readonly currentSubmissionIngressRecordRef: string | null;
  readonly submissionEnvelopeRef: string | null;
  readonly submissionPromotionRecordRef: string | null;
  readonly promotedRequestShellRef: string | null;
}

export interface IssueExternalEntryGrantInput {
  readonly environment: NhsAppEnvironment;
  readonly entryMode: ExternalEntryMode;
  readonly journeyPathId: string;
  readonly incomingPath: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly lineageFenceRef: string | null;
  readonly subjectRef?: string | null;
  readonly issueIdempotencyKey?: string;
  readonly routeIntentBindingRef?: string;
  readonly opaqueToken?: string;
  readonly actorRef?: string;
  readonly now?: string;
  readonly expiresAt?: string;
}

export interface ExternalEntryGrantIssuance {
  readonly grant: AccessGrantRecord;
  readonly scopeEnvelope: AccessGrantScopeEnvelopeRecord;
  readonly materializedToken: string | null;
  readonly replayed: boolean;
  readonly routeDefinition: DeepLinkableRouteDefinition;
  readonly routeTuple: RouteRuntimeTuple;
  readonly routeIntentBindingRef: string;
  readonly audit: LinkResolutionAudit;
}

export interface ResolveExternalEntryInput {
  readonly environment: NhsAppEnvironment;
  readonly entryMode: ExternalEntryMode;
  readonly journeyPathId?: string;
  readonly incomingPath: string;
  readonly presentedToken?: string | null;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string | null;
  readonly expectedSessionEpochRef?: string | null;
  readonly expectedSubjectBindingVersionRef?: string | null;
  readonly expectedManifestVersionRef?: string | null;
  readonly expectedRouteFamilyRef?: string | null;
  readonly lineageFenceRef: string | null;
  readonly currentSession: ExternalEntrySessionSnapshot | null;
  readonly draftResume?: DraftResumeFenceSnapshot | null;
  readonly actorRef?: string;
  readonly redemptionIdempotencyKey?: string;
  readonly now?: string;
}

export interface ResolvedRouteInstruction {
  readonly targetRoute: string;
  readonly routeFamilyRef: string;
  readonly routeIntentBindingRef: string | null;
  readonly safeSummaryTier: string;
  readonly placeholderContractRef: string;
  readonly includePhi: boolean;
  readonly responseHeaders: Record<string, string>;
}

export interface ExternalEntryResolutionResult {
  readonly outcome: ExternalResolutionOutcome;
  readonly routeInstruction: ResolvedRouteInstruction;
  readonly grantFenceState: GrantFenceState;
  readonly subjectBindingFenceState: SubjectBindingFenceState;
  readonly draftResumeFenceState: DraftResumeFenceState;
  readonly sessionRecoveryDecision: SessionRecoveryDecision;
  readonly redemption: RedeemAccessGrantResult | null;
  readonly audit: LinkResolutionAudit;
}

export interface LinkResolutionAudit {
  readonly auditId: string;
  readonly schemaVersion: typeof PHASE7_EXTERNAL_ENTRY_SCHEMA_VERSION;
  readonly serviceAuthority: typeof PHASE7_EXTERNAL_ENTRY_SERVICE_NAME;
  readonly eventType:
    | "site_link_manifest_exported"
    | "external_entry_grant_issued"
    | "external_entry_resolved";
  readonly environment: NhsAppEnvironment;
  readonly entryMode: ExternalEntryMode | null;
  readonly journeyPathRef: string | null;
  readonly routeFamilyRef: string | null;
  readonly grantRef: string | null;
  readonly scopeEnvelopeRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly manifestVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly grantFenceState: GrantFenceState | null;
  readonly subjectBindingFenceState: SubjectBindingFenceState | null;
  readonly draftResumeFenceState: DraftResumeFenceState | null;
  readonly sessionRecoveryDecision: SessionRecoveryDecision | null;
  readonly outcome: ExternalResolutionOutcome | null;
  readonly safeRouteRef: string | null;
  readonly incomingUrlHash: string | null;
  readonly reasonCodes: readonly string[];
  readonly phiExposureClass: "none" | "minimal" | "scoped_phi" | null;
  readonly rawTokenPersisted: false;
  readonly rawUrlPersisted: false;
  readonly metrics: Record<string, number>;
  readonly recordedAt: string;
}

interface RouteCapabilitySeed {
  readonly routeFamilyRef: string;
  readonly actionScope: AccessGrantActionScope;
  readonly grantFamily: AccessGrantFamily;
  readonly lineageKind: "draft" | "request" | "episode";
  readonly phiExposureClass: "none" | "minimal" | "scoped_phi";
  readonly visibilityScope: RouteRuntimeTuple["visibilityScope"];
  readonly subjectBindingRequired: boolean;
}

interface AssociationProfile {
  readonly androidPackageName: string;
  readonly androidCertFingerprintRef: string;
  readonly androidCertFingerprint: string;
  readonly iosAppId: string;
}

const ROUTE_CAPABILITY_SEEDS: Record<string, RouteCapabilitySeed> = {
  jp_start_medical_request: {
    routeFamilyRef: "medical_request_intake",
    actionScope: "envelope_resume",
    grantFamily: "draft_resume_minimal",
    lineageKind: "draft",
    phiExposureClass: "minimal",
    visibilityScope: "authenticated_summary",
    subjectBindingRequired: true,
  },
  jp_start_admin_request: {
    routeFamilyRef: "admin_request_intake",
    actionScope: "envelope_resume",
    grantFamily: "draft_resume_minimal",
    lineageKind: "draft",
    phiExposureClass: "minimal",
    visibilityScope: "authenticated_summary",
    subjectBindingRequired: true,
  },
  jp_continue_draft: {
    routeFamilyRef: "draft_resume",
    actionScope: "envelope_resume",
    grantFamily: "draft_resume_minimal",
    lineageKind: "draft",
    phiExposureClass: "minimal",
    visibilityScope: "authenticated_summary",
    subjectBindingRequired: true,
  },
  jp_request_status: {
    routeFamilyRef: "request_status",
    actionScope: "status_view",
    grantFamily: "public_status_minimal",
    lineageKind: "request",
    phiExposureClass: "minimal",
    visibilityScope: "authenticated_summary",
    subjectBindingRequired: true,
  },
  jp_respond_more_info: {
    routeFamilyRef: "more_info_response",
    actionScope: "respond_more_info",
    grantFamily: "transaction_action_minimal",
    lineageKind: "request",
    phiExposureClass: "scoped_phi",
    visibilityScope: "scoped_phi",
    subjectBindingRequired: true,
  },
  jp_manage_local_appointment: {
    routeFamilyRef: "appointment_manage",
    actionScope: "secure_resume",
    grantFamily: "continuation_seeded_verified",
    lineageKind: "episode",
    phiExposureClass: "scoped_phi",
    visibilityScope: "scoped_phi",
    subjectBindingRequired: true,
  },
  jp_pharmacy_choice: {
    routeFamilyRef: "pharmacy_choice",
    actionScope: "secure_resume",
    grantFamily: "continuation_seeded_verified",
    lineageKind: "request",
    phiExposureClass: "scoped_phi",
    visibilityScope: "scoped_phi",
    subjectBindingRequired: true,
  },
  jp_pharmacy_status: {
    routeFamilyRef: "pharmacy_status",
    actionScope: "status_view",
    grantFamily: "public_status_minimal",
    lineageKind: "request",
    phiExposureClass: "minimal",
    visibilityScope: "authenticated_summary",
    subjectBindingRequired: true,
  },
};

const ASSOCIATION_PROFILES: Record<NhsAppEnvironment, AssociationProfile> = {
  local_preview: {
    androidPackageName: "uk.nhs.nhsapp.local",
    androidCertFingerprintRef: "NHSAppAndroidCert:local-preview",
    androidCertFingerprint:
      "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00",
    iosAppId: "ABCDE12345.uk.nhs.nhsapp.local",
  },
  sandpit: {
    androidPackageName: "uk.nhs.nhsapp.sandpit",
    androidCertFingerprintRef: "NHSAppAndroidCert:sandpit",
    androidCertFingerprint:
      "22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11",
    iosAppId: "ABCDE12345.uk.nhs.nhsapp.sandpit",
  },
  aos: {
    androidPackageName: "uk.nhs.nhsapp.aos",
    androidCertFingerprintRef: "NHSAppAndroidCert:aos",
    androidCertFingerprint:
      "33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22",
    iosAppId: "ABCDE12345.uk.nhs.nhsapp.aos",
  },
  limited_release: {
    androidPackageName: "uk.nhs.nhsapp.limited",
    androidCertFingerprintRef: "NHSAppAndroidCert:limited-release",
    androidCertFingerprint:
      "44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33",
    iosAppId: "ABCDE12345.uk.nhs.nhsapp.limited",
  },
  full_release: {
    androidPackageName: "uk.nhs.nhsapp",
    androidCertFingerprintRef: "NHSAppAndroidCert:full-release",
    androidCertFingerprint:
      "55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44",
    iosAppId: "ABCDE12345.uk.nhs.nhsapp",
  },
};

export const phase7ExternalEntryRoutes = [
  {
    routeId: "phase7_site_link_manifest_current",
    method: "GET",
    path: "/internal/v1/nhs-app/site-links/manifest",
    contractFamily: "SiteLinkManifestContract",
    purpose:
      "Expose route, environment, Android asset links, and iOS association truth generated from the Phase 7 manifest.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_external_entry_grants_issue",
    method: "POST",
    path: "/internal/v1/nhs-app/external-entry/grants:issue",
    contractFamily: "ExternalEntryAccessGrantIssueContract",
    purpose:
      "Issue external-entry grants only through AccessGrantService with immutable RouteIntentBinding scope.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_external_entry_resolve",
    method: "POST",
    path: "/internal/v1/nhs-app/external-entry:resolve",
    contractFamily: "ExternalEntryResolutionContract",
    purpose:
      "Resolve site links, secure links, email/SMS continuation, and return-to-journey entries through grant, subject, manifest, and draft fences.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_site_link_android_assetlinks",
    method: "GET",
    path: "/.well-known/assetlinks.json",
    contractFamily: "AndroidAssetLinksExportContract",
    purpose: "Export environment-specific Android App Links association from SiteLinkManifest.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_site_link_ios_association",
    method: "GET",
    path: "/.well-known/apple-app-site-association",
    contractFamily: "IosUniversalLinksAssociationExportContract",
    purpose: "Export environment-specific iOS Universal Links association from SiteLinkManifest.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const;

export class InMemorySiteLinkManifestRepository {
  private readonly manifests = new Map<string, SiteLinkManifest>();
  private readonly audits: LinkResolutionAudit[] = [];

  saveManifest(manifest: SiteLinkManifest): SiteLinkManifest {
    this.manifests.set(
      manifestKey(manifest.environment, manifest.manifestVersionRef),
      clone(manifest),
    );
    return clone(manifest);
  }

  getManifest(environment: NhsAppEnvironment, manifestVersionRef: string): SiteLinkManifest | null {
    const manifest = this.manifests.get(manifestKey(environment, manifestVersionRef));
    return manifest ? clone(manifest) : null;
  }

  recordAudit(record: LinkResolutionAudit): LinkResolutionAudit {
    this.audits.push(clone(record));
    return clone(record);
  }

  listAuditRecords(): LinkResolutionAudit[] {
    return this.audits.map((record) => clone(record));
  }
}

export interface Phase7ExternalEntryApplication {
  readonly repository: InMemorySiteLinkManifestRepository;
  readonly accessGrantService: AccessGrantService;
  getSiteLinkManifest(input: { environment: NhsAppEnvironment }): SiteLinkManifest;
  exportAndroidAssetLinks(input: { environment: NhsAppEnvironment }): AndroidAssetLinksExport;
  exportIosAssociation(input: { environment: NhsAppEnvironment }): IosAssociationExport;
  issueExternalEntryGrant(input: IssueExternalEntryGrantInput): Promise<ExternalEntryGrantIssuance>;
  resolveExternalEntry(input: ResolveExternalEntryInput): Promise<ExternalEntryResolutionResult>;
  listAuditRecords(): LinkResolutionAudit[];
}

export function createPhase7ExternalEntryApplication(input?: {
  repository?: InMemorySiteLinkManifestRepository;
  manifestApplication?: Phase7NhsAppManifestApplication;
  accessGrantService?: AccessGrantService;
}): Phase7ExternalEntryApplication {
  const repository = input?.repository ?? new InMemorySiteLinkManifestRepository();
  const manifestApplication =
    input?.manifestApplication ?? createDefaultPhase7NhsAppManifestApplication();
  const accessGrantService =
    input?.accessGrantService ?? createAccessGrantSupersessionApplication().accessGrantService;

  function getSiteLinkManifest(input: { environment: NhsAppEnvironment }): SiteLinkManifest {
    const environment = manifestApplication.resolveEnvironment({
      environment: input.environment,
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
      expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    });
    if (!environment.baseUrl || !environment.manifestVersion || !environment.configFingerprint) {
      throw new Error("PHASE7_380_ENVIRONMENT_NOT_PINNED_FOR_SITE_LINK_MANIFEST");
    }

    const existing = repository.getManifest(input.environment, environment.manifestVersion);
    if (existing) {
      return existing;
    }

    const exposure = manifestApplication.getManifestExposure({
      environment: input.environment,
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
      expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    });
    const routes = exposure.routes
      .map((route) => {
        const journey = manifestApplication.lookupJourneyPath({
          environment: input.environment,
          journeyPathId: route.journeyPathId,
          expectedManifestVersion: PHASE7_MANIFEST_VERSION,
          expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
        });
        return journey.journeyPath
          ? routeDefinitionFromJourney(journey.journeyPath, journey.exposureState)
          : null;
      })
      .filter((route): route is DeepLinkableRouteDefinition => route !== null);
    const associationProfile = ASSOCIATION_PROFILES[input.environment];
    const allowedPathPatterns = unique([
      ...DEFAULT_ASSOCIATION_PATHS,
      ...routes
        .filter((route) => route.routeExposureState === "exposed")
        .map((route) => toAssociationPath(route.pathPattern)),
    ]);
    const manifest: SiteLinkManifest = {
      manifestId: `SiteLinkManifest:${input.environment}:${hashString({
        manifestVersion: environment.manifestVersion,
        allowedPathPatterns,
      }).slice("sha256:".length, "sha256:".length + 16)}`,
      environment: input.environment,
      manifestVersionRef: environment.manifestVersion,
      configFingerprintRef: environment.configFingerprint,
      releaseApprovalFreezeRef:
        environment.releaseApprovalFreezeRef ?? PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      canonicalGrantServiceRef: "AccessGrantService",
      routeIntentBindingRequired: true,
      androidAssetLinksRef: `AndroidAssetLinks:${input.environment}:${environment.manifestVersion}`,
      iosAssociationRef: `AppleAppSiteAssociation:${input.environment}:${environment.manifestVersion}`,
      allowedPathPatterns,
      routes,
      environmentBindings: {
        baseUrl: environment.baseUrl,
        androidPackageName: associationProfile.androidPackageName,
        androidCertFingerprintRef: associationProfile.androidCertFingerprintRef,
        iosAppId: associationProfile.iosAppId,
      },
      generatedAt: RECORDED_AT,
    };
    const saved = repository.saveManifest(manifest);
    repository.recordAudit(
      auditRecord({
        eventType: "site_link_manifest_exported",
        environment: input.environment,
        manifestVersionRef: saved.manifestVersionRef,
        routeFamilyRef: null,
        journeyPathRef: null,
        entryMode: null,
        grantRef: null,
        scopeEnvelopeRef: null,
        routeIntentBindingRef: null,
        sessionEpochRef: null,
        subjectBindingVersionRef: null,
        grantFenceState: null,
        subjectBindingFenceState: null,
        draftResumeFenceState: null,
        sessionRecoveryDecision: null,
        outcome: null,
        safeRouteRef: null,
        incomingUrlHash: null,
        phiExposureClass: null,
        reasonCodes: [
          "PHASE7_380_SITE_LINK_MANIFEST_FROM_PHASE7_MANIFEST",
          "PHASE7_380_ANDROID_IOS_ASSOCIATION_ENV_BOUND",
        ],
      }),
    );
    return saved;
  }

  function exportAndroidAssetLinks(input: {
    environment: NhsAppEnvironment;
  }): AndroidAssetLinksExport {
    const manifest = getSiteLinkManifest(input);
    const associationProfile = ASSOCIATION_PROFILES[input.environment];
    return {
      environment: input.environment,
      manifestVersionRef: manifest.manifestVersionRef,
      contentType: "application/json",
      wellKnownPath: "/.well-known/assetlinks.json",
      body: [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: associationProfile.androidPackageName,
            sha256_cert_fingerprints: [associationProfile.androidCertFingerprint],
          },
        },
      ],
    };
  }

  function exportIosAssociation(input: { environment: NhsAppEnvironment }): IosAssociationExport {
    const manifest = getSiteLinkManifest(input);
    const associationProfile = ASSOCIATION_PROFILES[input.environment];
    return {
      environment: input.environment,
      manifestVersionRef: manifest.manifestVersionRef,
      contentType: "application/json",
      wellKnownPath: "/.well-known/apple-app-site-association",
      body: {
        applinks: {
          apps: [],
          details: [
            {
              appID: associationProfile.iosAppId,
              paths: [...manifest.allowedPathPatterns],
            },
          ],
        },
      },
    };
  }

  async function issueExternalEntryGrant(
    input: IssueExternalEntryGrantInput,
  ): Promise<ExternalEntryGrantIssuance> {
    const routeDefinition = resolveRouteDefinition({
      environment: input.environment,
      journeyPathId: input.journeyPathId,
      incomingPath: input.incomingPath,
    });
    const routeIntentBindingRef =
      input.routeIntentBindingRef ??
      `RouteIntentBinding:380:${routeDefinition.routeFamilyRef}:${hashString({
        journeyPathId: input.journeyPathId,
        governingObjectRef: input.governingObjectRef,
        sessionEpochRef: input.sessionEpochRef,
        subjectBindingVersionRef: input.subjectBindingVersionRef,
      }).slice("sha256:".length, "sha256:".length + 16)}`;
    const routeTuple = routeTupleForGrant({
      entryMode: input.entryMode,
      routeDefinition,
      governingObjectRef: input.governingObjectRef,
      governingObjectVersionRef: input.governingObjectVersionRef,
      sessionEpochRef: input.sessionEpochRef,
      subjectBindingVersionRef: input.subjectBindingVersionRef,
      lineageFenceRef: input.lineageFenceRef,
      routeIntentBindingRef,
    });
    const issueResult = await accessGrantService.issueGrant({
      issueIdempotencyKey:
        input.issueIdempotencyKey ??
        `phase7-380:${input.entryMode}:${input.journeyPathId}:${input.governingObjectRef}`,
      grantFamily: routeDefinition.grantFamily,
      actionScope: routeDefinition.actionScope,
      routeFamily: routeDefinition.routeFamilyRef,
      governingObjectRef: input.governingObjectRef,
      governingObjectVersionRef: input.governingObjectVersionRef,
      sessionEpochRef: input.sessionEpochRef,
      subjectBindingVersionRef: input.subjectBindingVersionRef,
      lineageFenceRef: input.lineageFenceRef,
      routeIntentBindingRef,
      releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      manifestVersionRef: routeDefinition.manifestVersionRef,
      channelPosture: routeTuple.channelPosture,
      embeddedPosture: routeTuple.embeddedPosture,
      audienceScope: routeTuple.audienceScope,
      visibilityScope: routeTuple.visibilityScope,
      subjectRef: input.subjectRef ?? null,
      lineageScope: {
        lineageKind: routeDefinition.lineageKind,
        lineageRef: input.governingObjectRef,
      },
      phiExposureClass: routeDefinition.phiExposureClass,
      recoveryRouteRef: routeDefinition.fallbackRoute,
      opaqueToken: input.opaqueToken,
      expiresAt: input.expiresAt ?? DEFAULT_GRANT_EXPIRES_AT,
      issuedBy: input.actorRef ?? PHASE7_EXTERNAL_ENTRY_SERVICE_NAME,
      issuedAt: input.now ?? RECORDED_AT,
      reasonCodes: [
        "PHASE7_380_EXTERNAL_ENTRY_GRANT_CANONICAL_ACCESS_GRANT",
        "PHASE7_380_ROUTE_INTENT_BINDING_REQUIRED",
      ],
    });
    const audit = repository.recordAudit(
      auditFromGrantIssue({
        environment: input.environment,
        entryMode: input.entryMode,
        routeDefinition,
        issueResult,
        incomingPath: input.incomingPath,
      }),
    );
    return {
      grant: issueResult.grant,
      scopeEnvelope: issueResult.scopeEnvelope,
      materializedToken: issueResult.materializedToken,
      replayed: issueResult.replayed,
      routeDefinition,
      routeTuple,
      routeIntentBindingRef,
      audit,
    };
  }

  async function resolveExternalEntry(
    input: ResolveExternalEntryInput,
  ): Promise<ExternalEntryResolutionResult> {
    const routeDefinition = resolveRouteDefinition({
      environment: input.environment,
      journeyPathId: input.journeyPathId,
      incomingPath: input.incomingPath,
    });
    const noTokenResult = noTokenResolution(input, routeDefinition);
    if (noTokenResult) {
      return noTokenResult;
    }

    const expectedManifestVersionRef =
      input.expectedManifestVersionRef ?? routeDefinition.manifestVersionRef;
    const expectedRouteFamilyRef = input.expectedRouteFamilyRef ?? routeDefinition.routeFamilyRef;
    const expectedSessionEpochRef =
      input.expectedSessionEpochRef !== undefined
        ? input.expectedSessionEpochRef
        : (input.currentSession?.sessionEpochRef ?? null);
    const expectedSubjectBindingVersionRef =
      input.expectedSubjectBindingVersionRef !== undefined
        ? input.expectedSubjectBindingVersionRef
        : (input.currentSession?.subjectBindingVersionRef ?? null);
    const routeTuple = routeTupleForGrant({
      entryMode: input.entryMode,
      routeDefinition,
      governingObjectRef: input.governingObjectRef,
      governingObjectVersionRef: input.governingObjectVersionRef,
      sessionEpochRef: expectedSessionEpochRef,
      subjectBindingVersionRef: expectedSubjectBindingVersionRef,
      lineageFenceRef: input.lineageFenceRef,
      routeIntentBindingRef: null,
      manifestVersionRef: expectedManifestVersionRef,
      routeFamilyRef: expectedRouteFamilyRef,
    });
    const redemption = await accessGrantService.redeemGrant({
      redemptionIdempotencyKey:
        input.redemptionIdempotencyKey ??
        `phase7-380:redeem:${input.entryMode}:${input.governingObjectRef}:${hashString({
          path: input.incomingPath,
          expectedManifestVersionRef,
          expectedRouteFamilyRef,
        }).slice("sha256:".length, "sha256:".length + 12)}`,
      presentedToken: input.presentedToken as string,
      routeTuple,
      actorRef: input.actorRef ?? PHASE7_EXTERNAL_ENTRY_SERVICE_NAME,
      sameLineageRecoveryAvailable: true,
      observedAt: input.now ?? RECORDED_AT,
    });
    const grantFenceState = grantFenceFromRedemption(redemption);
    const routeIntentBindingRef = redemption.scopeEnvelope?.routeIntentBindingRef ?? null;
    const boundTuple = routeIntentBindingRef
      ? { ...routeTuple, routeIntentBindingRef }
      : routeTuple;
    const tupleDrift = evaluateReturnIntentTuple({
      input,
      routeDefinition,
      scopeEnvelope: redemption.scopeEnvelope,
      routeTuple: boundTuple,
      expectedManifestVersionRef,
      expectedRouteFamilyRef,
      expectedSessionEpochRef,
      expectedSubjectBindingVersionRef,
    });
    const subjectFenceState = evaluateSubjectBinding({
      session: input.currentSession,
      grant: redemption.grant,
      scopeEnvelope: redemption.scopeEnvelope,
      routeDefinition,
    });
    const draftFenceState = evaluateDraftResume(input.draftResume ?? null);
    const exposureBlocksFullDetail = routeDefinition.routeExposureState !== "exposed";
    const nonAcceptedGrant = grantFenceState !== "accepted";
    const tupleDriftBlocks = tupleDrift.length > 0;

    let outcome: ExternalResolutionOutcome = "resolved_full";
    let sessionRecoveryDecision: SessionRecoveryDecision = "reuse";
    let reasonCodes = [
      "PHASE7_380_EXTERNAL_ENTRY_REDEEMED_THROUGH_ACCESS_GRANT_SERVICE",
      ...redemption.redemption.reasonCodes,
    ];
    if (nonAcceptedGrant) {
      outcome =
        grantFenceState === "denied" || grantFenceState === "not_found"
          ? "denied"
          : "bounded_recovery";
      sessionRecoveryDecision = outcome === "denied" ? "deny" : "recover_only";
      reasonCodes.push("PHASE7_380_GRANT_FENCE_BLOCKED_FULL_DETAIL");
    } else if (tupleDriftBlocks) {
      outcome = "bounded_recovery";
      sessionRecoveryDecision = "recover_only";
      reasonCodes.push("PHASE7_380_RETURN_INTENT_TUPLE_DRIFT_BLOCKED");
      reasonCodes = [...reasonCodes, ...tupleDrift];
    } else if (
      subjectFenceState === "missing_session" ||
      subjectFenceState === "assurance_step_up_required"
    ) {
      outcome = "verification_required";
      sessionRecoveryDecision = "establish_embedded_session";
      reasonCodes.push("PHASE7_380_SUBJECT_BINDING_OR_ASSURANCE_REQUIRED");
    } else if (
      subjectFenceState === "subject_mismatch" ||
      subjectFenceState === "session_epoch_mismatch" ||
      subjectFenceState === "subject_binding_mismatch"
    ) {
      outcome = "denied";
      sessionRecoveryDecision = "deny";
      reasonCodes.push("PHASE7_380_SUBJECT_BINDING_FENCE_DENIED");
    } else if (draftFenceState === "draft_promoted_request_shell_only") {
      outcome = "bounded_recovery";
      sessionRecoveryDecision = "recover_only";
      reasonCodes.push("PHASE7_380_PROMOTED_DRAFT_CANNOT_REOPEN_MUTABLE_DRAFT");
    } else if (draftFenceState === "submission_ingress_mismatch") {
      outcome = "bounded_recovery";
      sessionRecoveryDecision = "recover_only";
      reasonCodes.push("PHASE7_380_SUBMISSION_INGRESS_RECORD_MISMATCH");
    } else if (exposureBlocksFullDetail) {
      outcome = "placeholder_only";
      sessionRecoveryDecision = "recover_only";
      reasonCodes.push("PHASE7_380_ROUTE_NOT_EXPOSED_PLACEHOLDER_ONLY");
    }

    const routeInstruction = routeInstructionForOutcome({
      outcome,
      routeDefinition,
      routeIntentBindingRef,
      draftResume: input.draftResume ?? null,
      incomingPath: input.incomingPath,
    });
    const audit = repository.recordAudit(
      auditRecord({
        eventType: "external_entry_resolved",
        environment: input.environment,
        entryMode: input.entryMode,
        journeyPathRef: routeDefinition.journeyPathId,
        routeFamilyRef: routeDefinition.routeFamilyRef,
        grantRef: redemption.grant?.grantRef ?? null,
        scopeEnvelopeRef: redemption.scopeEnvelope?.scopeEnvelopeRef ?? null,
        routeIntentBindingRef,
        manifestVersionRef: routeDefinition.manifestVersionRef,
        sessionEpochRef: expectedSessionEpochRef,
        subjectBindingVersionRef: expectedSubjectBindingVersionRef,
        grantFenceState,
        subjectBindingFenceState: subjectFenceState,
        draftResumeFenceState: draftFenceState,
        sessionRecoveryDecision,
        outcome,
        safeRouteRef: redactRawUrl(routeInstruction.targetRoute),
        incomingUrlHash: hashString(redactRawUrl(input.incomingPath)),
        phiExposureClass: routeDefinition.phiExposureClass,
        reasonCodes,
      }),
    );
    return {
      outcome,
      routeInstruction,
      grantFenceState,
      subjectBindingFenceState: subjectFenceState,
      draftResumeFenceState: draftFenceState,
      sessionRecoveryDecision,
      redemption,
      audit,
    };
  }

  function resolveRouteDefinition(input: {
    environment: NhsAppEnvironment;
    journeyPathId?: string;
    incomingPath: string;
  }): DeepLinkableRouteDefinition {
    const manifest = getSiteLinkManifest({ environment: input.environment });
    if (input.journeyPathId) {
      const route = manifest.routes.find(
        (candidate) => candidate.journeyPathId === input.journeyPathId,
      );
      if (route) {
        return route;
      }
    }
    const normalizedPath = stripOrigin(input.incomingPath);
    const route = manifest.routes.find((candidate) =>
      routePatternMatches(candidate.pathPattern, normalizedPath),
    );
    if (!route) {
      throw new Error(`PHASE7_380_ROUTE_NOT_IN_SITE_LINK_MANIFEST:${input.incomingPath}`);
    }
    return route;
  }

  function noTokenResolution(
    input: ResolveExternalEntryInput,
    routeDefinition: DeepLinkableRouteDefinition,
  ): ExternalEntryResolutionResult | null {
    if (input.presentedToken) {
      return null;
    }
    const routeInstruction = routeInstructionForOutcome({
      outcome: "verification_required",
      routeDefinition,
      routeIntentBindingRef: null,
      draftResume: input.draftResume ?? null,
      incomingPath: input.incomingPath,
    });
    const audit = repository.recordAudit(
      auditRecord({
        eventType: "external_entry_resolved",
        environment: input.environment,
        entryMode: input.entryMode,
        journeyPathRef: routeDefinition.journeyPathId,
        routeFamilyRef: routeDefinition.routeFamilyRef,
        grantRef: null,
        scopeEnvelopeRef: null,
        routeIntentBindingRef: null,
        manifestVersionRef: routeDefinition.manifestVersionRef,
        sessionEpochRef: input.currentSession?.sessionEpochRef ?? null,
        subjectBindingVersionRef: input.currentSession?.subjectBindingVersionRef ?? null,
        grantFenceState: "not_presented",
        subjectBindingFenceState: "missing_session",
        draftResumeFenceState: evaluateDraftResume(input.draftResume ?? null),
        sessionRecoveryDecision: "establish_embedded_session",
        outcome: "verification_required",
        safeRouteRef: redactRawUrl(routeInstruction.targetRoute),
        incomingUrlHash: hashString(redactRawUrl(input.incomingPath)),
        phiExposureClass: routeDefinition.phiExposureClass,
        reasonCodes: [
          "PHASE7_380_NO_PRESENTED_GRANT_TOKEN",
          "PHASE7_380_VERIFICATION_REQUIRED_BEFORE_PHI",
        ],
      }),
    );
    return {
      outcome: "verification_required",
      routeInstruction,
      grantFenceState: "not_presented",
      subjectBindingFenceState: "missing_session",
      draftResumeFenceState: evaluateDraftResume(input.draftResume ?? null),
      sessionRecoveryDecision: "establish_embedded_session",
      redemption: null,
      audit,
    };
  }

  return {
    repository,
    accessGrantService,
    getSiteLinkManifest,
    exportAndroidAssetLinks,
    exportIosAssociation,
    issueExternalEntryGrant,
    resolveExternalEntry,
    listAuditRecords() {
      return repository.listAuditRecords();
    },
  };
}

export function createDefaultPhase7ExternalEntryApplication(): Phase7ExternalEntryApplication {
  return createPhase7ExternalEntryApplication();
}

function routeDefinitionFromJourney(
  journeyPath: JourneyPathDefinition,
  exposureState: RouteExposureState,
): DeepLinkableRouteDefinition | null {
  const seed = ROUTE_CAPABILITY_SEEDS[journeyPath.journeyPathId];
  if (!seed || !journeyPath.supportsDeepLink) {
    return null;
  }
  return {
    journeyPathId: journeyPath.journeyPathId,
    pathPattern: journeyPath.routePattern,
    routeFamilyRef: seed.routeFamilyRef,
    actionScope: seed.actionScope,
    grantFamily: seed.grantFamily,
    minimumAssuranceLevel: normalizeMinimumAssurance(journeyPath.minimumAssuranceLevel),
    subjectBindingRequired: seed.subjectBindingRequired,
    lineageKind: seed.lineageKind,
    summarySafetyTier: journeyPath.summarySafetyTier,
    placeholderContractRef: journeyPath.placeholderContractRef,
    fallbackRoute: journeyPath.fallbackRoute,
    routeFreezeDispositionRef: journeyPath.routeFreezeDispositionRef,
    routeExposureState: exposureState,
    phiExposureClass: seed.phiExposureClass,
    visibilityScope: seed.visibilityScope,
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
  };
}

function routeTupleForGrant(input: {
  entryMode: ExternalEntryMode;
  routeDefinition: DeepLinkableRouteDefinition;
  governingObjectRef: string;
  governingObjectVersionRef: string | null;
  sessionEpochRef: string | null;
  subjectBindingVersionRef: string | null;
  lineageFenceRef: string | null;
  routeIntentBindingRef: string | null;
  manifestVersionRef?: string | null;
  routeFamilyRef?: string | null;
}): RouteRuntimeTuple {
  return {
    routeFamily: input.routeFamilyRef ?? input.routeDefinition.routeFamilyRef,
    actionScope: input.routeDefinition.actionScope,
    governingObjectRef: input.governingObjectRef,
    governingObjectVersionRef: input.governingObjectVersionRef,
    sessionEpochRef: input.sessionEpochRef,
    subjectBindingVersionRef: input.subjectBindingVersionRef,
    lineageFenceRef: input.lineageFenceRef,
    grantFamily: input.routeDefinition.grantFamily,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    manifestVersionRef: input.manifestVersionRef ?? input.routeDefinition.manifestVersionRef,
    channelPosture: channelPostureForEntry(input.entryMode),
    embeddedPosture: embeddedPostureForEntry(input.entryMode),
    audienceScope:
      input.routeDefinition.subjectBindingRequired ||
      input.routeDefinition.phiExposureClass !== "none"
        ? "patient_authenticated"
        : "patient_public",
    visibilityScope: input.routeDefinition.visibilityScope,
    routeProfileRef: `RouteCapabilityProfile:phase7-380:${input.routeDefinition.routeFamilyRef}`,
    ...(input.routeIntentBindingRef ? { routeIntentBindingRef: input.routeIntentBindingRef } : {}),
  } as RouteRuntimeTuple & { routeIntentBindingRef?: string };
}

function channelPostureForEntry(entryMode: ExternalEntryMode): RouteRuntimeTuple["channelPosture"] {
  if (entryMode === "sms_link") {
    return "sms";
  }
  if (
    entryMode === "secure_link" ||
    entryMode === "email_link" ||
    entryMode === "continuation_link"
  ) {
    return "secure_link";
  }
  if (entryMode === "canonical_deep_link") {
    return "web";
  }
  return "embedded";
}

function embeddedPostureForEntry(
  entryMode: ExternalEntryMode,
): RouteRuntimeTuple["embeddedPosture"] {
  return entryMode === "nhs_app_site_link" || entryMode === "return_to_journey"
    ? "trusted"
    : "not_embedded";
}

function grantFenceFromRedemption(redemption: RedeemAccessGrantResult): GrantFenceState {
  if (!redemption.grant) {
    return "not_found";
  }
  if (redemption.replayed) {
    return "replayed";
  }
  if (redemption.redemption.decision === "redeemed") {
    return "accepted";
  }
  if (redemption.redemption.decision === "expired") {
    return "expired";
  }
  if (redemption.redemption.decision === "recover_only") {
    return "drifted";
  }
  if (redemption.redemption.decision === "superseded") {
    return "superseded";
  }
  return redemption.grant.grantState === "revoked" ? "revoked" : "denied";
}

function evaluateReturnIntentTuple(input: {
  input: ResolveExternalEntryInput;
  routeDefinition: DeepLinkableRouteDefinition;
  scopeEnvelope: AccessGrantScopeEnvelopeRecord | null;
  routeTuple: RouteRuntimeTuple;
  expectedManifestVersionRef: string | null;
  expectedRouteFamilyRef: string | null;
  expectedSessionEpochRef: string | null;
  expectedSubjectBindingVersionRef: string | null;
}): string[] {
  const reasons: string[] = [];
  const scopeEnvelope = input.scopeEnvelope;
  if (!scopeEnvelope) {
    return reasons;
  }
  if (scopeEnvelope.manifestVersionRef !== input.expectedManifestVersionRef) {
    reasons.push("PHASE7_380_MANIFEST_VERSION_REF_MISMATCH");
  }
  if (scopeEnvelope.routeFamily !== input.expectedRouteFamilyRef) {
    reasons.push("PHASE7_380_ROUTE_FAMILY_REF_MISMATCH");
  }
  if (scopeEnvelope.sessionEpochRef !== input.expectedSessionEpochRef) {
    reasons.push("PHASE7_380_SESSION_EPOCH_REF_MISMATCH");
  }
  if (scopeEnvelope.subjectBindingVersionRef !== input.expectedSubjectBindingVersionRef) {
    reasons.push("PHASE7_380_SUBJECT_BINDING_VERSION_REF_MISMATCH");
  }
  if (input.routeDefinition.routeExposureState !== "exposed") {
    reasons.push("PHASE7_380_ROUTE_EXPOSURE_NOT_LIVE");
  }
  return unique(reasons);
}

function evaluateSubjectBinding(input: {
  session: ExternalEntrySessionSnapshot | null;
  grant: AccessGrantRecord | null;
  scopeEnvelope: AccessGrantScopeEnvelopeRecord | null;
  routeDefinition: DeepLinkableRouteDefinition;
}): SubjectBindingFenceState {
  if (!input.routeDefinition.subjectBindingRequired) {
    return "not_required";
  }
  if (!input.session || input.session.sessionState !== "active") {
    return "missing_session";
  }
  if (input.grant?.subjectRef && input.session.subjectRef !== input.grant.subjectRef) {
    return "subject_mismatch";
  }
  if (input.scopeEnvelope?.sessionEpochRef !== input.session.sessionEpochRef) {
    return "session_epoch_mismatch";
  }
  if (input.scopeEnvelope?.subjectBindingVersionRef !== input.session.subjectBindingVersionRef) {
    return "subject_binding_mismatch";
  }
  if (
    assuranceRank(input.session.assuranceLevel) <
    assuranceRank(input.routeDefinition.minimumAssuranceLevel)
  ) {
    return "assurance_step_up_required";
  }
  return "matched";
}

function evaluateDraftResume(draftResume: DraftResumeFenceSnapshot | null): DraftResumeFenceState {
  if (!draftResume) {
    return "not_applicable";
  }
  if (draftResume.submissionPromotionRecordRef) {
    return "draft_promoted_request_shell_only";
  }
  if (
    draftResume.expectedSubmissionIngressRecordRef !== draftResume.currentSubmissionIngressRecordRef
  ) {
    return "submission_ingress_mismatch";
  }
  return "same_submission_ingress";
}

function routeInstructionForOutcome(input: {
  outcome: ExternalResolutionOutcome;
  routeDefinition: DeepLinkableRouteDefinition;
  routeIntentBindingRef: string | null;
  draftResume: DraftResumeFenceSnapshot | null;
  incomingPath?: string;
}): ResolvedRouteInstruction {
  let targetRoute = input.incomingPath
    ? stripOrigin(input.incomingPath)
    : input.routeDefinition.pathPattern;
  if (input.outcome === "verification_required") {
    targetRoute = `/nhs-app/recovery/verify?continue=${encodeURIComponent(input.routeDefinition.fallbackRoute)}`;
  } else if (input.outcome === "bounded_recovery" && input.draftResume?.promotedRequestShellRef) {
    targetRoute = `/requests/${encodeURIComponent(input.draftResume.promotedRequestShellRef)}/status`;
  } else if (input.outcome === "bounded_recovery" || input.outcome === "placeholder_only") {
    targetRoute = input.routeDefinition.fallbackRoute;
  } else if (input.outcome === "denied") {
    targetRoute = "/nhs-app/recovery/safe-reentry";
  }
  return {
    targetRoute,
    routeFamilyRef: input.routeDefinition.routeFamilyRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    safeSummaryTier: input.routeDefinition.summarySafetyTier,
    placeholderContractRef: input.routeDefinition.placeholderContractRef,
    includePhi: input.outcome === "resolved_full",
    responseHeaders: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Phase7-External-Entry": PHASE7_EXTERNAL_ENTRY_SCHEMA_VERSION,
    },
  };
}

function auditFromGrantIssue(input: {
  environment: NhsAppEnvironment;
  entryMode: ExternalEntryMode;
  routeDefinition: DeepLinkableRouteDefinition;
  issueResult: IssueAccessGrantResult;
  incomingPath: string;
}): LinkResolutionAudit {
  return auditRecord({
    eventType: "external_entry_grant_issued",
    environment: input.environment,
    entryMode: input.entryMode,
    journeyPathRef: input.routeDefinition.journeyPathId,
    routeFamilyRef: input.routeDefinition.routeFamilyRef,
    grantRef: input.issueResult.grant.grantRef,
    scopeEnvelopeRef: input.issueResult.scopeEnvelope.scopeEnvelopeRef,
    routeIntentBindingRef: input.issueResult.scopeEnvelope.routeIntentBindingRef,
    manifestVersionRef: input.issueResult.scopeEnvelope.manifestVersionRef,
    sessionEpochRef: input.issueResult.scopeEnvelope.sessionEpochRef,
    subjectBindingVersionRef: input.issueResult.scopeEnvelope.subjectBindingVersionRef,
    grantFenceState: "accepted",
    subjectBindingFenceState: null,
    draftResumeFenceState: null,
    sessionRecoveryDecision: null,
    outcome: null,
    safeRouteRef: input.routeDefinition.pathPattern,
    incomingUrlHash: hashString(redactRawUrl(input.incomingPath)),
    phiExposureClass: input.routeDefinition.phiExposureClass,
    reasonCodes: [
      "PHASE7_380_EXTERNAL_ENTRY_GRANT_CANONICAL_ACCESS_GRANT",
      "PHASE7_380_LINK_RESOLUTION_AUDIT_HASH_ONLY",
    ],
  });
}

function auditRecord(
  input: Omit<
    LinkResolutionAudit,
    | "auditId"
    | "schemaVersion"
    | "serviceAuthority"
    | "rawTokenPersisted"
    | "rawUrlPersisted"
    | "metrics"
    | "recordedAt"
  >,
): LinkResolutionAudit {
  return {
    auditId: `LinkResolutionAudit:${hashString(input).slice("sha256:".length, "sha256:".length + 24)}`,
    schemaVersion: PHASE7_EXTERNAL_ENTRY_SCHEMA_VERSION,
    serviceAuthority: PHASE7_EXTERNAL_ENTRY_SERVICE_NAME,
    rawTokenPersisted: false,
    rawUrlPersisted: false,
    metrics: {
      "phase7.external_entry.audit_recorded": 1,
      ...(input.outcome ? { [`phase7.external_entry.outcome.${input.outcome}`]: 1 } : {}),
      ...(input.grantFenceState
        ? { [`phase7.external_entry.grant_fence.${input.grantFenceState}`]: 1 }
        : {}),
    },
    recordedAt: RECORDED_AT,
    ...input,
  };
}

function normalizeMinimumAssurance(value: string): VerificationLevel {
  if (value.includes("p9")) {
    return "nhs_p9";
  }
  if (value.includes("p5")) {
    return "nhs_p5_plus";
  }
  if (value.includes("low")) {
    return "nhs_low";
  }
  return "none";
}

function assuranceRank(value: VerificationLevel): number {
  const ranks: Record<VerificationLevel, number> = {
    none: 0,
    contact_seeded: 1,
    nhs_low: 2,
    nhs_p5_plus: 3,
    nhs_p9: 4,
    manual_verified: 4,
  };
  return ranks[value];
}

function toAssociationPath(routePattern: string): string {
  const pathname = routePattern.split("?")[0] ?? routePattern;
  return pathname.replace(/:[^/]+/g, "*");
}

function routePatternMatches(routePattern: string, incomingPath: string): boolean {
  const [patternPath, patternQuery = ""] = routePattern.split("?");
  const [path = "", query = ""] = incomingPath.split("?");
  const pathRegex = new RegExp(`^${escapeRegExp(patternPath ?? "").replace(/:[^/]+/g, "[^/]+")}$`);
  if (!pathRegex.test(path)) {
    return false;
  }
  if (!patternQuery) {
    return true;
  }
  const patternParams = new URLSearchParams(patternQuery);
  const incomingParams = new URLSearchParams(query);
  for (const [key, value] of patternParams.entries()) {
    if (incomingParams.get(key) !== value) {
      return false;
    }
  }
  return true;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripOrigin(value: string): string {
  try {
    const parsed = new URL(value);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return value;
  }
}

function redactRawUrl(value: string): string {
  try {
    const parsed = new URL(value, "https://redacted.invalid");
    for (const key of ["token", "code", "assertedLoginIdentity", "asserted_login_identity"]) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, "[redacted]");
      }
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return value.replace(
      /(token|code|assertedLoginIdentity|asserted_login_identity)=([^&]+)/g,
      "$1=[redacted]",
    );
  }
}

function manifestKey(environment: NhsAppEnvironment, manifestVersionRef: string): string {
  return `${environment}:${manifestVersionRef}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  if (value === undefined) {
    return "undefined";
  }
  return JSON.stringify(value);
}

function hashString(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
