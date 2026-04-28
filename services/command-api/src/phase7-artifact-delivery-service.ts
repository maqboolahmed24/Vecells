import { createHash } from "node:crypto";
import type {
  BridgeAction,
  BridgeCapabilityMatrix,
  NhsAppByteDownload,
  PatientEmbeddedNavEligibilitySnapshot,
} from "../../../packages/nhs-app-bridge-runtime/src/index";
import {
  createDefaultPhase7NhsAppManifestApplication,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  type NhsAppEnvironment,
  type Phase7NhsAppManifestApplication,
} from "./phase7-nhs-app-manifest-service";

export const PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME =
  "Phase7EmbeddedArtifactDeliveryAndDegradedModeService";
export const PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION = "382.phase7.artifact-delivery.v1";

const RECORDED_AT = "2026-04-27T00:40:15.000Z";
const DEFAULT_GRANT_EXPIRES_AT = "2026-04-27T00:50:15.000Z";

export type ArtifactDeliveryPosture =
  | "live"
  | "summary_only"
  | "deferred"
  | "blocked"
  | "recovery_required";
export type ArtifactDeliveryMode =
  | "byte_download"
  | "overlay_handoff"
  | "external_browser"
  | "secure_send_later"
  | "structured_summary";
export type BinaryArtifactDeliveryState =
  | "prepared"
  | "bridge_ready"
  | "transferred"
  | "returned"
  | "expired"
  | "blocked";
export type ArtifactByteGrantState = "issued" | "redeemed" | "expired" | "superseded" | "blocked";
export type ArtifactContinuityState = "current" | "stale" | "missing";
export type RouteFreezeState = "live" | "frozen" | "kill_switch_active";
export type ArtifactSourceState = "available" | "unavailable" | "quarantined";
export type ChannelDegradedState =
  | "summary_only"
  | "safe_browser_handoff"
  | "secure_send_later"
  | "recovery_required"
  | "blocked";
export type ArtifactFailureReason =
  | "capability_missing"
  | "payload_too_large"
  | "mime_type_blocked"
  | "continuity_stale"
  | "route_frozen"
  | "subject_mismatch"
  | "source_unavailable"
  | "eligibility_not_live"
  | "manifest_mismatch"
  | "grant_expired"
  | "grant_redeemed"
  | "grant_tuple_mismatch"
  | "grant_not_found";

export interface ArtifactSummaryFallback {
  readonly summaryRef: string;
  readonly title: string;
  readonly patientSummary: string;
  readonly provenanceSummary: string;
  readonly lastSafeSummaryRef: string;
  readonly nextStepGuidance: string;
  readonly visibilityMode: "summary_only" | "governed_inline" | "placeholder_only";
}

export interface ArtifactDeliveryPolicy {
  readonly routeFamilyRef: string;
  readonly maxBytes: number;
  readonly allowedMimeTypes: readonly string[];
  readonly allowedDeliveryModes: readonly ArtifactDeliveryMode[];
  readonly fallbackMode: ChannelDegradedState;
  readonly requiresBridgeAction: BridgeAction;
  readonly cachePolicy: "no_store";
  readonly watermarkMode: "none" | "patient_and_timestamp";
}

export interface ArtifactRecord {
  readonly artifactId: string;
  readonly artifactType: "appointment_letter" | "request_summary" | "pharmacy_instructions";
  readonly journeyPathRef: string;
  readonly routeFamilyRef: string;
  readonly subjectRef: string;
  readonly artifactSurfaceContextRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly title: string;
  readonly patientSummary: string;
  readonly provenanceSummary: string;
  readonly mimeType: string;
  readonly filename: string;
  readonly contentLengthBytes: number;
  readonly checksum: string;
  readonly byteBase64: string;
  readonly sourceState: ArtifactSourceState;
  readonly sourceAuthorityRef: string;
}

export interface ArtifactByteGrant {
  readonly grantId: string;
  readonly artifactId: string;
  readonly artifactSurfaceContextRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly bridgeCapabilityMatrixRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly expiresAt: string;
  readonly maxDownloads: number;
  readonly maxBytes: number;
  readonly subjectBindingMode: "same_subject_same_session";
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string;
  readonly continuityEvidenceRef: string;
  readonly manifestVersionRef: string;
  readonly issuedBy: typeof PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME;
  readonly grantState: ArtifactByteGrantState;
  readonly tupleHash: string;
  readonly issuedAt: string;
  readonly redeemedAt: string | null;
}

export interface BinaryArtifactDelivery {
  readonly artifactId: string;
  readonly artifactType: ArtifactRecord["artifactType"];
  readonly artifactSurfaceContextRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly deliveryMode: ArtifactDeliveryMode;
  readonly byteGrantRef: string | null;
  readonly mimeType: string;
  readonly filename: string;
  readonly contentLengthBytes: number;
  readonly checksum: string;
  readonly cachePolicy: "no_store";
  readonly watermarkMode: ArtifactDeliveryPolicy["watermarkMode"];
  readonly ttl: string;
  readonly accessScope: "patient_subject_bound";
  readonly channelProfile: "embedded" | "browser" | "constrained_browser";
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly deliveryState: BinaryArtifactDeliveryState;
  readonly deliveryPosture: ArtifactDeliveryPosture;
  readonly failureReasons: readonly ArtifactFailureReason[];
  readonly summaryFallback: ArtifactSummaryFallback;
  readonly deliveryTupleHash: string;
}

export interface EmbeddedErrorContract {
  readonly errorContractId: string;
  readonly artifactId: string;
  readonly routeFamilyRef: string;
  readonly failureReasons: readonly ArtifactFailureReason[];
  readonly title: string;
  readonly body: string;
  readonly nextStep: string;
  readonly shellDisposition: "same_shell_summary" | "same_shell_recovery" | "same_shell_blocked";
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly preserveSummary: true;
  readonly severity: "info" | "warning" | "blocked";
}

export interface ChannelDegradedMode {
  readonly degradedModeId: string;
  readonly artifactId: string;
  readonly routeFamilyRef: string;
  readonly degradedState: ChannelDegradedState;
  readonly deliveryPosture: ArtifactDeliveryPosture;
  readonly byteDeliverySuppressed: boolean;
  readonly summaryFallback: ArtifactSummaryFallback;
  readonly embeddedErrorContract: EmbeddedErrorContract;
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly truthTupleHash: string;
}

export interface ArtifactTelemetryRecord {
  readonly telemetryId: string;
  readonly schemaVersion: typeof PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION;
  readonly serviceAuthority: typeof PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME;
  readonly eventType:
    | "artifact_delivery_prepared"
    | "artifact_delivery_blocked"
    | "artifact_byte_grant_issued"
    | "artifact_byte_grant_redeemed"
    | "artifact_degraded_mode_resolved";
  readonly artifactHash: string;
  readonly subjectHash: string | null;
  readonly routeFamilyRef: string;
  readonly manifestVersionRef: string;
  readonly bridgeCapabilityMatrixRef: string | null;
  readonly deliveryPosture: ArtifactDeliveryPosture;
  readonly failureReasons: readonly ArtifactFailureReason[];
  readonly byteCount: number | null;
  readonly grantRef: string | null;
  readonly recordedAt: string;
}

export interface PrepareArtifactDeliveryInput {
  readonly environment: NhsAppEnvironment;
  readonly artifactId: string;
  readonly requestedMode?: ArtifactDeliveryMode;
  readonly subjectRef: string;
  readonly journeyPathId: string;
  readonly routeFamilyRef: string;
  readonly manifestVersionRef?: string;
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string;
  readonly continuityEvidenceRef: string;
  readonly continuityState?: ArtifactContinuityState;
  readonly routeFreezeState?: RouteFreezeState;
  readonly bridgeCapabilityMatrix: BridgeCapabilityMatrix;
  readonly patientEmbeddedNavEligibility: PatientEmbeddedNavEligibilitySnapshot;
  readonly channelProfile?: "embedded" | "browser" | "constrained_browser";
  readonly now?: string;
  readonly expiresAt?: string;
}

export interface ArtifactDeliveryResult {
  readonly delivery: BinaryArtifactDelivery;
  readonly byteGrant: ArtifactByteGrant | null;
  readonly embeddedErrorContract: EmbeddedErrorContract | null;
  readonly degradedMode: ChannelDegradedMode | null;
  readonly telemetry: readonly ArtifactTelemetryRecord[];
}

export interface RedeemArtifactByteGrantInput {
  readonly grantId: string;
  readonly artifactId: string;
  readonly bridgeCapabilityMatrixRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string;
  readonly continuityEvidenceRef: string;
  readonly manifestVersionRef?: string;
  readonly now?: string;
}

export interface ArtifactByteGrantRedemptionResult {
  readonly status: "transferred" | "blocked";
  readonly byteDownload: NhsAppByteDownload | null;
  readonly grant: ArtifactByteGrant | null;
  readonly failureReasons: readonly ArtifactFailureReason[];
  readonly embeddedErrorContract: EmbeddedErrorContract | null;
  readonly telemetry: readonly ArtifactTelemetryRecord[];
}

export const phase7ArtifactDeliveryRoutes = [
  {
    routeId: "phase7_embedded_artifact_prepare_delivery",
    method: "POST",
    path: "/internal/v1/nhs-app/artifacts:prepare-delivery",
    contractFamily: "BinaryArtifactDeliveryContract",
    purpose:
      "Prepare webview-safe artifact delivery, byte grant, and summary-first fallback for one embedded route.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_embedded_artifact_byte_grant_redeem",
    method: "POST",
    path: "/internal/v1/nhs-app/artifact-byte-grants:redeem",
    contractFamily: "ArtifactByteGrantRedemptionContract",
    purpose:
      "Redeem a single-use ArtifactByteGrant into a byte payload only when route, continuity, bridge, and eligibility truth still match.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_embedded_artifact_degraded_mode_resolve",
    method: "POST",
    path: "/internal/v1/nhs-app/artifacts:resolve-degraded-mode",
    contractFamily: "ChannelDegradedModeContract",
    purpose:
      "Resolve governed same-shell degraded mode and EmbeddedErrorContract for unsafe artifact actions.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
] as const;

const ARTIFACT_POLICIES: Record<string, ArtifactDeliveryPolicy> = {
  appointment_manage: {
    routeFamilyRef: "appointment_manage",
    maxBytes: 1_500_000,
    allowedMimeTypes: ["application/pdf", "text/calendar"],
    allowedDeliveryModes: ["byte_download", "secure_send_later", "structured_summary"],
    fallbackMode: "secure_send_later",
    requiresBridgeAction: "downloadBytes",
    cachePolicy: "no_store",
    watermarkMode: "patient_and_timestamp",
  },
  request_status: {
    routeFamilyRef: "request_status",
    maxBytes: 750_000,
    allowedMimeTypes: ["application/pdf", "text/plain"],
    allowedDeliveryModes: ["byte_download", "secure_send_later", "structured_summary"],
    fallbackMode: "summary_only",
    requiresBridgeAction: "downloadBytes",
    cachePolicy: "no_store",
    watermarkMode: "patient_and_timestamp",
  },
  pharmacy_status: {
    routeFamilyRef: "pharmacy_status",
    maxBytes: 1_000_000,
    allowedMimeTypes: ["application/pdf", "text/plain"],
    allowedDeliveryModes: ["byte_download", "secure_send_later", "structured_summary"],
    fallbackMode: "secure_send_later",
    requiresBridgeAction: "downloadBytes",
    cachePolicy: "no_store",
    watermarkMode: "patient_and_timestamp",
  },
};

const FIXTURE_ARTIFACTS: ArtifactRecord[] = [
  buildArtifact({
    artifactId: "artifact:382:appointment-letter",
    artifactType: "appointment_letter",
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    subjectRef: "Subject:patient-382",
    title: "Appointment letter",
    patientSummary:
      "Your appointment is booked. The letter includes the time, place, and what to bring.",
    provenanceSummary: "Generated from BookingConfirmationTruthProjection:382:confirmed.",
    mimeType: "application/pdf",
    filename: "appointment-letter.pdf",
    contentLengthBytes: 640_000,
    byteBase64: "JVBERi0xLjQKJUZha2UgUGhhc2UgNyAzODIgYXBwb2ludG1lbnQgbGV0dGVyCg==",
    sourceState: "available",
  }),
  buildArtifact({
    artifactId: "artifact:382:large-appointment-pack",
    artifactType: "appointment_letter",
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    subjectRef: "Subject:patient-382",
    title: "Large appointment pack",
    patientSummary:
      "Your appointment pack is available, but the file is too large for embedded download.",
    provenanceSummary: "Generated from BookingConfirmationTruthProjection:382:large-pack.",
    mimeType: "application/pdf",
    filename: "large-appointment-pack.pdf",
    contentLengthBytes: 3_400_000,
    byteBase64: "JVBERi0xLjQKJUZha2UgTGFyZ2UgUGFjayAzODIK",
    sourceState: "available",
  }),
  buildArtifact({
    artifactId: "artifact:382:unsupported-script",
    artifactType: "request_summary",
    journeyPathRef: "jp_request_status",
    routeFamilyRef: "request_status",
    subjectRef: "Subject:patient-382",
    title: "Unsupported attachment",
    patientSummary:
      "A document summary is available, but this file type cannot be downloaded here.",
    provenanceSummary: "Generated from EvidenceSnapshot:382:unsupported.",
    mimeType: "application/x-msdownload",
    filename: "unsafe.exe",
    contentLengthBytes: 14_000,
    byteBase64: "TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    sourceState: "available",
  }),
  buildArtifact({
    artifactId: "artifact:382:pharmacy-unavailable",
    artifactType: "pharmacy_instructions",
    journeyPathRef: "jp_pharmacy_status",
    routeFamilyRef: "pharmacy_status",
    subjectRef: "Subject:patient-382",
    title: "Pharmacy instructions",
    patientSummary:
      "The pharmacy instructions summary is still available while the source file refreshes.",
    provenanceSummary: "Generated from PharmacyDispatchTruthProjection:382:pending-refresh.",
    mimeType: "application/pdf",
    filename: "pharmacy-instructions.pdf",
    contentLengthBytes: 380_000,
    byteBase64: "JVBERi0xLjQKJUZha2UgUGhhcm1hY3kgSW5zdHJ1Y3Rpb25zCg==",
    sourceState: "unavailable",
  }),
];

export class ArtifactRepository {
  private readonly artifacts = new Map<string, ArtifactRecord>();

  constructor(seed: readonly ArtifactRecord[] = FIXTURE_ARTIFACTS) {
    for (const artifact of seed) {
      this.artifacts.set(artifact.artifactId, cloneArtifact(artifact));
    }
  }

  get(artifactId: string): ArtifactRecord | null {
    const artifact = this.artifacts.get(artifactId);
    return artifact ? cloneArtifact(artifact) : null;
  }
}

export class ArtifactByteGrantStore {
  private readonly grants = new Map<string, ArtifactByteGrant>();

  issue(input: Omit<ArtifactByteGrant, "grantId" | "grantState" | "tupleHash" | "redeemedAt">) {
    const tupleHash = hashString(
      stableStringify({
        artifactId: input.artifactId,
        bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrixRef,
        patientEmbeddedNavEligibilityRef: input.patientEmbeddedNavEligibilityRef,
        selectedAnchorRef: input.selectedAnchorRef,
        returnContractRef: input.returnContractRef,
        sessionEpochRef: input.sessionEpochRef,
        subjectBindingVersionRef: input.subjectBindingVersionRef,
        continuityEvidenceRef: input.continuityEvidenceRef,
        manifestVersionRef: input.manifestVersionRef,
        maxBytes: input.maxBytes,
      }),
    );
    const grant = freeze({
      ...input,
      grantId: `ArtifactByteGrant:382:${tupleHash.slice(7, 23)}`,
      grantState: "issued" as const,
      tupleHash,
      redeemedAt: null,
    });
    this.grants.set(grant.grantId, grant);
    return cloneGrant(grant);
  }

  get(grantId: string): ArtifactByteGrant | null {
    const grant = this.grants.get(grantId);
    return grant ? cloneGrant(grant) : null;
  }

  update(grant: ArtifactByteGrant): ArtifactByteGrant {
    const cloned = cloneGrant(grant);
    this.grants.set(cloned.grantId, cloned);
    return cloneGrant(cloned);
  }

  list(): ArtifactByteGrant[] {
    return Array.from(this.grants.values()).map((grant) => cloneGrant(grant));
  }
}

export class ArtifactTelemetryStore {
  private readonly records: ArtifactTelemetryRecord[] = [];

  record(input: Omit<ArtifactTelemetryRecord, "telemetryId" | "recordedAt">) {
    const record = freeze({
      ...input,
      telemetryId: `telemetry:382:${input.eventType}:${hashString(
        stableStringify({
          eventType: input.eventType,
          artifactHash: input.artifactHash,
          routeFamilyRef: input.routeFamilyRef,
          deliveryPosture: input.deliveryPosture,
          failureReasons: input.failureReasons,
          grantRef: input.grantRef,
          byteCount: input.byteCount,
        }),
      ).slice(7, 23)}`,
      recordedAt: RECORDED_AT,
    });
    this.records.push(record);
    return cloneTelemetry(record);
  }

  list(): ArtifactTelemetryRecord[] {
    return this.records.map((record) => cloneTelemetry(record));
  }
}

export interface Phase7ArtifactDeliveryApplication {
  repository: ArtifactRepository;
  grantStore: ArtifactByteGrantStore;
  telemetryStore: ArtifactTelemetryStore;
  prepareDelivery(input: PrepareArtifactDeliveryInput): ArtifactDeliveryResult;
  redeemByteGrant(input: RedeemArtifactByteGrantInput): ArtifactByteGrantRedemptionResult;
  resolveDegradedMode(input: {
    artifactId: string;
    routeFamilyRef: string;
    failureReasons: readonly ArtifactFailureReason[];
    selectedAnchorRef: string;
    returnContractRef: string;
  }): ChannelDegradedMode;
  listTelemetry(): ArtifactTelemetryRecord[];
  listByteGrants(): ArtifactByteGrant[];
}

export function createDefaultPhase7ArtifactDeliveryApplication(input?: {
  manifestApplication?: Phase7NhsAppManifestApplication;
  repository?: ArtifactRepository;
  grantStore?: ArtifactByteGrantStore;
  telemetryStore?: ArtifactTelemetryStore;
}): Phase7ArtifactDeliveryApplication {
  const manifestApplication =
    input?.manifestApplication ?? createDefaultPhase7NhsAppManifestApplication();
  const repository = input?.repository ?? new ArtifactRepository();
  const grantStore = input?.grantStore ?? new ArtifactByteGrantStore();
  const telemetryStore = input?.telemetryStore ?? new ArtifactTelemetryStore();

  function prepareDelivery(input: PrepareArtifactDeliveryInput): ArtifactDeliveryResult {
    const now = input.now ?? RECORDED_AT;
    const manifestVersionRef = input.manifestVersionRef ?? PHASE7_MANIFEST_VERSION;
    const requestedMode = input.requestedMode ?? "byte_download";
    const artifact = repository.get(input.artifactId);
    const synthetic = artifact ?? unavailableArtifact(input.artifactId, input);
    const policy = policyFor(input.routeFamilyRef);
    const failureReasons = evaluateDeliveryFences({
      artifact: synthetic,
      policy,
      input,
      manifestVersionRef,
      requestedMode,
    });
    const canIssueByteGrant =
      requestedMode === "byte_download" &&
      failureReasons.length === 0 &&
      policy.allowedDeliveryModes.includes("byte_download");
    const posture = postureFor(failureReasons);
    const deliveryMode = canIssueByteGrant
      ? "byte_download"
      : modeForFailure(failureReasons, policy);
    const summaryFallback = buildSummaryFallback(synthetic, failureReasons);
    const byteGrant = canIssueByteGrant
      ? grantStore.issue({
          artifactId: synthetic.artifactId,
          artifactSurfaceContextRef: synthetic.artifactSurfaceContextRef,
          artifactModeTruthProjectionRef: synthetic.artifactModeTruthProjectionRef,
          bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrix.matrixId,
          patientEmbeddedNavEligibilityRef:
            input.patientEmbeddedNavEligibility.embeddedNavEligibilityId,
          selectedAnchorRef: input.selectedAnchorRef,
          returnContractRef: input.returnContractRef,
          expiresAt: input.expiresAt ?? DEFAULT_GRANT_EXPIRES_AT,
          maxDownloads: 1,
          maxBytes: Math.min(policy.maxBytes, input.bridgeCapabilityMatrix.maxByteDownloadSize),
          subjectBindingMode: "same_subject_same_session",
          sessionEpochRef: input.sessionEpochRef,
          subjectBindingVersionRef: input.subjectBindingVersionRef,
          continuityEvidenceRef: input.continuityEvidenceRef,
          manifestVersionRef,
          issuedBy: PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME,
          issuedAt: now,
        })
      : null;
    const delivery = freeze({
      artifactId: synthetic.artifactId,
      artifactType: synthetic.artifactType,
      artifactSurfaceContextRef: synthetic.artifactSurfaceContextRef,
      artifactModeTruthProjectionRef: synthetic.artifactModeTruthProjectionRef,
      deliveryMode,
      byteGrantRef: byteGrant?.grantId ?? null,
      mimeType: synthetic.mimeType,
      filename: synthetic.filename,
      contentLengthBytes: synthetic.contentLengthBytes,
      checksum: synthetic.checksum,
      cachePolicy: policy.cachePolicy,
      watermarkMode: policy.watermarkMode,
      ttl: "PT10M",
      accessScope: "patient_subject_bound" as const,
      channelProfile: input.channelProfile ?? "embedded",
      selectedAnchorRef: input.selectedAnchorRef,
      returnContractRef: input.returnContractRef,
      deliveryState: canIssueByteGrant ? ("bridge_ready" as const) : ("blocked" as const),
      deliveryPosture: posture,
      failureReasons,
      summaryFallback,
      deliveryTupleHash: hashString(
        stableStringify({
          artifactId: synthetic.artifactId,
          bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrix.matrixId,
          patientEmbeddedNavEligibilityRef:
            input.patientEmbeddedNavEligibility.embeddedNavEligibilityId,
          selectedAnchorRef: input.selectedAnchorRef,
          returnContractRef: input.returnContractRef,
          mode: deliveryMode,
          failureReasons,
        }),
      ),
    });
    const degradedMode =
      failureReasons.length > 0
        ? buildDegradedMode({
            artifact: synthetic,
            routeFamilyRef: input.routeFamilyRef,
            failureReasons,
            selectedAnchorRef: input.selectedAnchorRef,
            returnContractRef: input.returnContractRef,
            summaryFallback,
            posture,
            policy,
          })
        : null;
    const preparedTelemetry = telemetryStore.record({
      schemaVersion: PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION,
      serviceAuthority: PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME,
      eventType:
        failureReasons.length > 0 ? "artifact_delivery_blocked" : "artifact_delivery_prepared",
      artifactHash: hashString(synthetic.artifactId),
      subjectHash: hashString(input.subjectRef),
      routeFamilyRef: input.routeFamilyRef,
      manifestVersionRef,
      bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrix.matrixId,
      deliveryPosture: posture,
      failureReasons,
      byteCount: canIssueByteGrant ? synthetic.contentLengthBytes : null,
      grantRef: byteGrant?.grantId ?? null,
    });
    const grantTelemetry = byteGrant
      ? telemetryStore.record({
          schemaVersion: PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION,
          serviceAuthority: PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME,
          eventType: "artifact_byte_grant_issued",
          artifactHash: hashString(synthetic.artifactId),
          subjectHash: hashString(input.subjectRef),
          routeFamilyRef: input.routeFamilyRef,
          manifestVersionRef,
          bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrix.matrixId,
          deliveryPosture: "live",
          failureReasons: [],
          byteCount: synthetic.contentLengthBytes,
          grantRef: byteGrant.grantId,
        })
      : null;
    if (degradedMode) {
      telemetryStore.record({
        schemaVersion: PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION,
        serviceAuthority: PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME,
        eventType: "artifact_degraded_mode_resolved",
        artifactHash: hashString(synthetic.artifactId),
        subjectHash: hashString(input.subjectRef),
        routeFamilyRef: input.routeFamilyRef,
        manifestVersionRef,
        bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrix.matrixId,
        deliveryPosture: posture,
        failureReasons,
        byteCount: null,
        grantRef: null,
      });
    }
    manifestApplication.lookupJourneyPath({
      environment: input.environment,
      journeyPathId: input.journeyPathId,
      expectedManifestVersion: manifestVersionRef,
    });
    return {
      delivery: cloneDelivery(delivery),
      byteGrant,
      embeddedErrorContract: degradedMode?.embeddedErrorContract ?? null,
      degradedMode,
      telemetry: [preparedTelemetry, ...(grantTelemetry ? [grantTelemetry] : [])],
    };
  }

  function redeemByteGrant(input: RedeemArtifactByteGrantInput): ArtifactByteGrantRedemptionResult {
    const now = input.now ?? RECORDED_AT;
    const manifestVersionRef = input.manifestVersionRef ?? PHASE7_MANIFEST_VERSION;
    const grant = grantStore.get(input.grantId);
    const artifact =
      repository.get(input.artifactId) ??
      unavailableArtifact(input.artifactId, {
        journeyPathId: "unknown",
        routeFamilyRef: "unknown",
        subjectRef: "unknown",
      });
    const failureReasons = validateGrantRedemption(grant, input, manifestVersionRef, now);
    if (!grant || failureReasons.length > 0) {
      const embeddedErrorContract = buildErrorContract({
        artifact,
        routeFamilyRef: artifact.routeFamilyRef,
        failureReasons,
        selectedAnchorRef: input.selectedAnchorRef,
        returnContractRef: input.returnContractRef,
      });
      const telemetry = telemetryStore.record({
        schemaVersion: PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION,
        serviceAuthority: PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME,
        eventType: "artifact_delivery_blocked",
        artifactHash: hashString(input.artifactId),
        subjectHash: null,
        routeFamilyRef: artifact.routeFamilyRef,
        manifestVersionRef,
        bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrixRef,
        deliveryPosture: "blocked",
        failureReasons,
        byteCount: null,
        grantRef: input.grantId,
      });
      return {
        status: "blocked",
        byteDownload: null,
        grant,
        failureReasons,
        embeddedErrorContract,
        telemetry: [telemetry],
      };
    }
    const redeemed = grantStore.update({
      ...grant,
      grantState: "redeemed",
      redeemedAt: now,
    });
    const byteDownload: NhsAppByteDownload = {
      base64data: artifact.byteBase64,
      filename: artifact.filename,
      mimeType: artifact.mimeType,
      byteLength: artifact.contentLengthBytes,
    };
    const telemetry = telemetryStore.record({
      schemaVersion: PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION,
      serviceAuthority: PHASE7_ARTIFACT_DELIVERY_SERVICE_NAME,
      eventType: "artifact_byte_grant_redeemed",
      artifactHash: hashString(input.artifactId),
      subjectHash: null,
      routeFamilyRef: artifact.routeFamilyRef,
      manifestVersionRef,
      bridgeCapabilityMatrixRef: input.bridgeCapabilityMatrixRef,
      deliveryPosture: "live",
      failureReasons: [],
      byteCount: artifact.contentLengthBytes,
      grantRef: redeemed.grantId,
    });
    return {
      status: "transferred",
      byteDownload,
      grant: redeemed,
      failureReasons: [],
      embeddedErrorContract: null,
      telemetry: [telemetry],
    };
  }

  function resolveDegradedMode(input: {
    artifactId: string;
    routeFamilyRef: string;
    failureReasons: readonly ArtifactFailureReason[];
    selectedAnchorRef: string;
    returnContractRef: string;
  }): ChannelDegradedMode {
    const artifact =
      repository.get(input.artifactId) ??
      unavailableArtifact(input.artifactId, {
        journeyPathId: "unknown",
        routeFamilyRef: input.routeFamilyRef,
        subjectRef: "unknown",
      });
    return buildDegradedMode({
      artifact,
      routeFamilyRef: input.routeFamilyRef,
      failureReasons: input.failureReasons,
      selectedAnchorRef: input.selectedAnchorRef,
      returnContractRef: input.returnContractRef,
      summaryFallback: buildSummaryFallback(artifact, input.failureReasons),
      posture: postureFor(input.failureReasons),
      policy: policyFor(input.routeFamilyRef),
    });
  }

  return {
    repository,
    grantStore,
    telemetryStore,
    prepareDelivery,
    redeemByteGrant,
    resolveDegradedMode,
    listTelemetry: () => telemetryStore.list(),
    listByteGrants: () => grantStore.list(),
  };
}

function buildArtifact(
  input: Omit<
    ArtifactRecord,
    | "artifactSurfaceContextRef"
    | "artifactModeTruthProjectionRef"
    | "checksum"
    | "sourceAuthorityRef"
  >,
): ArtifactRecord {
  const checksum = hashString(input.byteBase64);
  return freeze({
    ...input,
    artifactSurfaceContextRef: `ArtifactSurfaceContext:382:${input.artifactId.split(":").at(-1)}`,
    artifactModeTruthProjectionRef: `ArtifactModeTruthProjection:382:${hashString(
      `${input.artifactId}:${input.routeFamilyRef}:${checksum}`,
    ).slice(7, 23)}`,
    checksum,
    sourceAuthorityRef: `ArtifactSourceAuthority:382:${input.routeFamilyRef}`,
  });
}

function evaluateDeliveryFences(input: {
  artifact: ArtifactRecord;
  policy: ArtifactDeliveryPolicy;
  input: PrepareArtifactDeliveryInput;
  manifestVersionRef: string;
  requestedMode: ArtifactDeliveryMode;
}): ArtifactFailureReason[] {
  const reasons: ArtifactFailureReason[] = [];
  const bridge = input.input.bridgeCapabilityMatrix;
  const eligibility = input.input.patientEmbeddedNavEligibility;
  if (input.artifact.sourceState !== "available") {
    appendUnique(reasons, "source_unavailable");
  }
  if (input.artifact.subjectRef !== input.input.subjectRef) {
    appendUnique(reasons, "subject_mismatch");
  }
  if (input.artifact.routeFamilyRef !== input.input.routeFamilyRef) {
    appendUnique(reasons, "grant_tuple_mismatch");
  }
  if (input.artifact.journeyPathRef !== input.input.journeyPathId) {
    appendUnique(reasons, "grant_tuple_mismatch");
  }
  if (input.manifestVersionRef !== PHASE7_MANIFEST_VERSION) {
    appendUnique(reasons, "manifest_mismatch");
  }
  if ((input.input.continuityState ?? "current") !== "current") {
    appendUnique(reasons, "continuity_stale");
  }
  if ((input.input.routeFreezeState ?? "live") !== "live") {
    appendUnique(reasons, "route_frozen");
  }
  if (!input.policy.allowedMimeTypes.includes(input.artifact.mimeType)) {
    appendUnique(reasons, "mime_type_blocked");
  }
  if (!input.policy.allowedDeliveryModes.includes(input.requestedMode)) {
    appendUnique(reasons, "capability_missing");
  }
  const ceiling = Math.min(input.policy.maxBytes, bridge.maxByteDownloadSize);
  if (input.artifact.contentLengthBytes > ceiling) {
    appendUnique(reasons, "payload_too_large");
  }
  if (eligibility.eligibilityState !== "live") {
    appendUnique(reasons, "eligibility_not_live");
  }
  if (
    input.requestedMode === "byte_download" &&
    (bridge.capabilityState !== "verified" ||
      !bridge.supportedMethods.includes(input.policy.requiresBridgeAction) ||
      !eligibility.allowedBridgeActionRefs.includes(input.policy.requiresBridgeAction))
  ) {
    appendUnique(reasons, "capability_missing");
  }
  if (eligibility.manifestVersionRef !== input.manifestVersionRef) {
    appendUnique(reasons, "manifest_mismatch");
  }
  if (eligibility.continuityEvidenceRef !== input.input.continuityEvidenceRef) {
    appendUnique(reasons, "continuity_stale");
  }
  return reasons;
}

function validateGrantRedemption(
  grant: ArtifactByteGrant | null,
  input: RedeemArtifactByteGrantInput,
  manifestVersionRef: string,
  now: string,
): ArtifactFailureReason[] {
  if (!grant) {
    return ["grant_not_found"];
  }
  const reasons: ArtifactFailureReason[] = [];
  if (grant.grantState === "redeemed") {
    appendUnique(reasons, "grant_redeemed");
  }
  if (grant.grantState === "expired" || Date.parse(grant.expiresAt) <= Date.parse(now)) {
    appendUnique(reasons, "grant_expired");
  }
  if (
    grant.artifactId !== input.artifactId ||
    grant.bridgeCapabilityMatrixRef !== input.bridgeCapabilityMatrixRef ||
    grant.patientEmbeddedNavEligibilityRef !== input.patientEmbeddedNavEligibilityRef ||
    grant.selectedAnchorRef !== input.selectedAnchorRef ||
    grant.returnContractRef !== input.returnContractRef ||
    grant.sessionEpochRef !== input.sessionEpochRef ||
    grant.subjectBindingVersionRef !== input.subjectBindingVersionRef ||
    grant.continuityEvidenceRef !== input.continuityEvidenceRef ||
    grant.manifestVersionRef !== manifestVersionRef
  ) {
    appendUnique(reasons, "grant_tuple_mismatch");
  }
  return reasons;
}

function buildSummaryFallback(
  artifact: ArtifactRecord,
  reasons: readonly ArtifactFailureReason[],
): ArtifactSummaryFallback {
  return freeze({
    summaryRef: `ArtifactSummaryFallback:382:${hashString(
      `${artifact.artifactId}:${reasons.join("|")}`,
    ).slice(7, 23)}`,
    title: artifact.title,
    patientSummary: artifact.patientSummary,
    provenanceSummary: artifact.provenanceSummary,
    lastSafeSummaryRef: `LastSafeArtifactSummary:382:${hashString(artifact.artifactId).slice(7, 23)}`,
    nextStepGuidance: nextStepFor(reasons),
    visibilityMode: reasons.includes("subject_mismatch")
      ? "placeholder_only"
      : reasons.length > 0
        ? "summary_only"
        : "governed_inline",
  });
}

function buildErrorContract(input: {
  artifact: ArtifactRecord;
  routeFamilyRef: string;
  failureReasons: readonly ArtifactFailureReason[];
  selectedAnchorRef: string;
  returnContractRef: string;
}): EmbeddedErrorContract {
  const blocked = input.failureReasons.includes("subject_mismatch");
  const recovery = input.failureReasons.some((reason) =>
    ["continuity_stale", "manifest_mismatch", "grant_tuple_mismatch"].includes(reason),
  );
  return freeze({
    errorContractId: `EmbeddedErrorContract:382:${hashString(
      stableStringify({
        artifactId: input.artifact.artifactId,
        routeFamilyRef: input.routeFamilyRef,
        failureReasons: input.failureReasons,
        selectedAnchorRef: input.selectedAnchorRef,
      }),
    ).slice(7, 23)}`,
    artifactId: input.artifact.artifactId,
    routeFamilyRef: input.routeFamilyRef,
    failureReasons: [...input.failureReasons],
    title: blocked
      ? "We cannot show this document here"
      : recovery
        ? "We need to refresh this document"
        : "This document cannot be downloaded here",
    body: blocked
      ? "The document is not available for this signed-in patient. We have kept the safe summary in this page."
      : recovery
        ? "The page needs current route and continuity information before the document can be opened."
        : "The NHS App may not support this file action in the current webview, so we have kept the document summary available.",
    nextStep: nextStepFor(input.failureReasons),
    shellDisposition: blocked
      ? "same_shell_blocked"
      : recovery
        ? "same_shell_recovery"
        : "same_shell_summary",
    selectedAnchorRef: input.selectedAnchorRef,
    returnContractRef: input.returnContractRef,
    preserveSummary: true,
    severity: blocked ? "blocked" : recovery ? "warning" : "info",
  });
}

function buildDegradedMode(input: {
  artifact: ArtifactRecord;
  routeFamilyRef: string;
  failureReasons: readonly ArtifactFailureReason[];
  selectedAnchorRef: string;
  returnContractRef: string;
  summaryFallback: ArtifactSummaryFallback;
  posture: ArtifactDeliveryPosture;
  policy: ArtifactDeliveryPolicy;
}): ChannelDegradedMode {
  const degradedState = degradedStateFor(input.failureReasons, input.policy);
  const embeddedErrorContract = buildErrorContract(input);
  return freeze({
    degradedModeId: `ChannelDegradedMode:382:${hashString(
      stableStringify({
        artifactId: input.artifact.artifactId,
        routeFamilyRef: input.routeFamilyRef,
        degradedState,
        selectedAnchorRef: input.selectedAnchorRef,
        returnContractRef: input.returnContractRef,
      }),
    ).slice(7, 23)}`,
    artifactId: input.artifact.artifactId,
    routeFamilyRef: input.routeFamilyRef,
    degradedState,
    deliveryPosture: input.posture,
    byteDeliverySuppressed: true,
    summaryFallback: input.summaryFallback,
    embeddedErrorContract,
    selectedAnchorRef: input.selectedAnchorRef,
    returnContractRef: input.returnContractRef,
    truthTupleHash: hashString(
      stableStringify({
        artifactModeTruthProjectionRef: input.artifact.artifactModeTruthProjectionRef,
        failureReasons: input.failureReasons,
        degradedState,
      }),
    ),
  });
}

function unavailableArtifact(
  artifactId: string,
  input: Pick<PrepareArtifactDeliveryInput, "journeyPathId" | "routeFamilyRef" | "subjectRef">,
): ArtifactRecord {
  return buildArtifact({
    artifactId,
    artifactType: "request_summary",
    journeyPathRef: input.journeyPathId,
    routeFamilyRef: input.routeFamilyRef,
    subjectRef: input.subjectRef,
    title: "Document summary",
    patientSummary: "A safe summary remains available while the document source is refreshed.",
    provenanceSummary: "Generated from unavailable embedded artifact source.",
    mimeType: "application/pdf",
    filename: "document-summary.pdf",
    contentLengthBytes: 0,
    byteBase64: "",
    sourceState: "unavailable",
  });
}

function policyFor(routeFamilyRef: string): ArtifactDeliveryPolicy {
  return (
    ARTIFACT_POLICIES[routeFamilyRef] ?? {
      routeFamilyRef,
      maxBytes: 0,
      allowedMimeTypes: [],
      allowedDeliveryModes: ["structured_summary"],
      fallbackMode: "summary_only",
      requiresBridgeAction: "downloadBytes",
      cachePolicy: "no_store",
      watermarkMode: "none",
    }
  );
}

function postureFor(reasons: readonly ArtifactFailureReason[]): ArtifactDeliveryPosture {
  if (reasons.length === 0) {
    return "live";
  }
  if (
    reasons.some((reason) =>
      ["continuity_stale", "manifest_mismatch", "grant_tuple_mismatch"].includes(reason),
    )
  ) {
    return "recovery_required";
  }
  if (reasons.includes("subject_mismatch") || reasons.includes("route_frozen")) {
    return "blocked";
  }
  if (reasons.includes("payload_too_large") || reasons.includes("source_unavailable")) {
    return "deferred";
  }
  return "summary_only";
}

function degradedStateFor(
  reasons: readonly ArtifactFailureReason[],
  policy: ArtifactDeliveryPolicy,
): ChannelDegradedState {
  if (reasons.includes("subject_mismatch") || reasons.includes("route_frozen")) {
    return "blocked";
  }
  if (
    reasons.some((reason) =>
      ["continuity_stale", "manifest_mismatch", "grant_tuple_mismatch"].includes(reason),
    )
  ) {
    return "recovery_required";
  }
  if (reasons.includes("payload_too_large") || reasons.includes("source_unavailable")) {
    return "secure_send_later";
  }
  return policy.fallbackMode;
}

function modeForFailure(
  reasons: readonly ArtifactFailureReason[],
  policy: ArtifactDeliveryPolicy,
): ArtifactDeliveryMode {
  const degradedState = degradedStateFor(reasons, policy);
  if (degradedState === "secure_send_later") {
    return "secure_send_later";
  }
  if (degradedState === "safe_browser_handoff") {
    return "external_browser";
  }
  return "structured_summary";
}

function nextStepFor(reasons: readonly ArtifactFailureReason[]): string {
  if (reasons.includes("payload_too_large")) {
    return "We will keep the summary here and send the full document through the safer route.";
  }
  if (reasons.includes("capability_missing") || reasons.includes("mime_type_blocked")) {
    return "Use the summary here. If you still need the full document, open it later from a supported route.";
  }
  if (reasons.includes("continuity_stale") || reasons.includes("manifest_mismatch")) {
    return "Refresh this page from the current NHS App journey before opening the document.";
  }
  if (reasons.includes("route_frozen")) {
    return "The route is temporarily read-only. Use the summary while we keep the document action stopped.";
  }
  if (reasons.includes("subject_mismatch")) {
    return "Return to the NHS App and sign in again before trying to view this document.";
  }
  if (reasons.includes("source_unavailable")) {
    return "Use the summary here while we refresh the source document.";
  }
  return "Use the summary here and try the document action again when the page has refreshed.";
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
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

function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function freeze<T extends object>(value: T): T {
  return Object.freeze(value);
}

function cloneArtifact(artifact: ArtifactRecord): ArtifactRecord {
  return {
    ...artifact,
  };
}

function cloneGrant(grant: ArtifactByteGrant): ArtifactByteGrant {
  return {
    ...grant,
  };
}

function cloneDelivery(delivery: BinaryArtifactDelivery): BinaryArtifactDelivery {
  return {
    ...delivery,
    failureReasons: [...delivery.failureReasons],
    summaryFallback: { ...delivery.summaryFallback },
  };
}

function cloneTelemetry(record: ArtifactTelemetryRecord): ArtifactTelemetryRecord {
  return {
    ...record,
    failureReasons: [...record.failureReasons],
  };
}
