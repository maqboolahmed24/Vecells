import {
  buildNavigationContract,
  createFakeNhsAppApi,
  createLiveEligibility,
  createNhsAppBridgeRuntime,
  createOutboundNavigationGrant,
  negotiateBridgeCapabilityMatrix,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";
import {
  createDefaultPhase7ArtifactDeliveryApplication,
  type PrepareArtifactDeliveryInput,
} from "../../services/command-api/src/phase7-artifact-delivery-service.ts";
import {
  createDefaultPhase7ExternalEntryApplication,
  type ExternalEntrySessionSnapshot,
} from "../../services/command-api/src/phase7-external-entry-service.ts";
import { resolveEmbeddedBookingContext } from "../../apps/patient-web/src/embedded-booking.model.ts";
import { resolveEmbeddedPharmacyContext } from "../../apps/patient-web/src/embedded-pharmacy.model.ts";
import { resolveEmbeddedRecoveryArtifactContext } from "../../apps/patient-web/src/embedded-recovery-artifact.model.ts";

const MANIFEST = "nhsapp-manifest-v0.1.0-freeze-374";
const CONTINUITY = "ContinuityEvidence:400-current";

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function activeSession(
  input?: Partial<ExternalEntrySessionSnapshot>,
): ExternalEntrySessionSnapshot {
  return {
    sessionRef: input?.sessionRef ?? "Session:400",
    subjectRef: input?.subjectRef ?? "Subject:patient-400",
    sessionEpochRef: input?.sessionEpochRef ?? "SessionEpoch:400",
    subjectBindingVersionRef:
      input?.subjectBindingVersionRef ?? "SubjectBindingVersion:patient-400:v1",
    assuranceLevel: input?.assuranceLevel ?? "nhs_p9",
    sessionState: input?.sessionState ?? "active",
    embeddedSessionRef: input?.embeddedSessionRef ?? "EmbeddedSession:400",
  };
}

async function issuePharmacyStatusGrant(input?: {
  readonly expiresAt?: string;
  readonly issueKey?: string;
  readonly token?: string;
}) {
  const application = createDefaultPhase7ExternalEntryApplication();
  const session = activeSession();
  const issuance = await application.issueExternalEntryGrant({
    environment: "sandpit",
    entryMode: "nhs_app_site_link",
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-400/pharmacy/status?from=nhsApp",
    governingObjectRef: "Request:REQ-400",
    governingObjectVersionRef: "RequestVersion:REQ-400:v1",
    sessionEpochRef: session.sessionEpochRef,
    subjectBindingVersionRef: session.subjectBindingVersionRef,
    lineageFenceRef: "LineageFence:REQ-400",
    subjectRef: session.subjectRef,
    issueIdempotencyKey: input?.issueKey ?? "issue-400-pharmacy-status",
    opaqueToken: input?.token ?? "external-entry-token-400-pharmacy-status",
    expiresAt: input?.expiresAt,
  });
  return { application, session, issuance };
}

function externalResolveInput(
  input: Awaited<ReturnType<typeof issuePharmacyStatusGrant>>,
  overrides: Record<string, unknown> = {},
) {
  return {
    environment: "sandpit" as const,
    entryMode: "nhs_app_site_link" as const,
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-400/pharmacy/status?from=nhsApp",
    presentedToken: input.issuance.materializedToken,
    governingObjectRef: "Request:REQ-400",
    governingObjectVersionRef: "RequestVersion:REQ-400:v1",
    lineageFenceRef: "LineageFence:REQ-400",
    currentSession: input.session,
    ...overrides,
  };
}

function bridgeTruth(input?: {
  readonly missingDownload?: boolean;
  readonly missingCalendar?: boolean;
}) {
  const navigationContract = buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:400-contract",
    routeFreezeDispositionRef: "RouteFreezeDisposition:400-contract",
    continuityEvidenceRef: CONTINUITY,
  });
  const eligibility = createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST,
    continuityEvidenceRef: CONTINUITY,
  });
  const missingMethods = [
    ...(input?.missingDownload ? ["downloadBytes" as const] : []),
    ...(input?.missingCalendar ? ["addToCalendar" as const] : []),
  ];
  const api = createFakeNhsAppApi({ platform: "ios", missingMethods });
  const matrix = negotiateBridgeCapabilityMatrix({
    api,
    navigationContract,
    eligibility,
    manifestVersionRef: MANIFEST,
    contextFenceRef: "ChannelContext:400-contract",
  });
  const bridge = createNhsAppBridgeRuntime({
    api,
    channelContextRef: "ChannelContext:400-contract",
    patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:400-contract",
    navigationContract,
    eligibility,
    matrix,
    selectedAnchorRef: "SelectedAnchor:400-contract",
  });
  return { api, navigationContract, eligibility, matrix, bridge };
}

function deliveryInput(
  input?: Partial<PrepareArtifactDeliveryInput> & { readonly missingDownload?: boolean },
): PrepareArtifactDeliveryInput {
  const { matrix, eligibility } = bridgeTruth({
    missingDownload: input?.missingDownload,
  });
  return {
    environment: "sandpit",
    artifactId: "artifact:382:appointment-letter",
    subjectRef: "Subject:patient-382",
    journeyPathId: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    selectedAnchorRef: "SelectedAnchor:400-artifact",
    returnContractRef: "ReturnContract:400-artifact",
    sessionEpochRef: eligibility.sessionEpochRef,
    subjectBindingVersionRef: eligibility.subjectBindingVersionRef,
    continuityEvidenceRef: CONTINUITY,
    bridgeCapabilityMatrix: matrix,
    patientEmbeddedNavEligibility: eligibility,
    ...input,
  };
}

export async function run(): Promise<void> {
  const externalEntry = createDefaultPhase7ExternalEntryApplication();
  const manifest = externalEntry.getSiteLinkManifest({ environment: "sandpit" });
  const android = externalEntry.exportAndroidAssetLinks({ environment: "sandpit" });
  const ios = externalEntry.exportIosAssociation({ environment: "sandpit" });
  assertCondition(
    manifest.allowedPathPatterns.includes("/requests/*"),
    "site-link manifest missing request path",
  );
  assertCondition(
    android.wellKnownPath === "/.well-known/assetlinks.json",
    "Android assetlinks path drifted",
  );
  assertCondition(
    android.body[0]?.target.package_name === "uk.nhs.nhsapp.sandpit",
    "Android package drifted",
  );
  assertCondition(
    ios.body.applinks.details[0]?.paths.includes("/requests/*"),
    "iOS associated-domain paths drifted",
  );
  assertCondition(
    !manifest.allowedPathPatterns.includes("/admin/*"),
    "unconfigured admin path should not open in app",
  );

  const issued = await issuePharmacyStatusGrant({ issueKey: "issue-400-contract-status" });
  const resolved = await issued.application.resolveExternalEntry({
    ...externalResolveInput(issued),
    redemptionIdempotencyKey: "redeem-400-contract-first",
  });
  assertCondition(
    resolved.outcome === "resolved_full",
    "first-use site link did not resolve full route",
  );
  assertCondition(
    resolved.routeInstruction.includePhi,
    "first-use site link should include PHI after grant proof",
  );

  const replay = await issued.application.resolveExternalEntry({
    ...externalResolveInput(issued),
    redemptionIdempotencyKey: "redeem-400-contract-replay",
  });
  assertCondition(replay.grantFenceState === "replayed", "site-link replay was not fenced");
  assertCondition(!replay.routeInstruction.includePhi, "site-link replay exposed PHI");

  const expiredIssued = await issuePharmacyStatusGrant({
    issueKey: "issue-400-contract-expired",
    token: "external-entry-token-400-expired",
    expiresAt: "2026-04-27T00:00:00.000Z",
  });
  const expired = await expiredIssued.application.resolveExternalEntry({
    ...externalResolveInput(expiredIssued),
    redemptionIdempotencyKey: "redeem-400-contract-expired",
    now: "2026-04-27T00:30:00.000Z",
  });
  assertCondition(expired.grantFenceState === "expired", "expired site link was not fenced");
  assertCondition(
    expired.outcome === "bounded_recovery",
    "expired site link should recover safely",
  );
  assertCondition(!expired.routeInstruction.includePhi, "expired site link exposed PHI");

  const mismatchIssued = await issuePharmacyStatusGrant({
    issueKey: "issue-400-contract-subject-mismatch",
    token: "external-entry-token-400-subject-mismatch",
  });
  const subjectMismatch = await mismatchIssued.application.resolveExternalEntry({
    ...externalResolveInput(mismatchIssued, {
      currentSession: activeSession({
        subjectRef: "Subject:other-patient",
        sessionEpochRef: mismatchIssued.session.sessionEpochRef,
        subjectBindingVersionRef: mismatchIssued.session.subjectBindingVersionRef,
      }),
    }),
    redemptionIdempotencyKey: "redeem-400-contract-subject-mismatch",
  });
  assertCondition(subjectMismatch.outcome === "denied", "cross-patient link was not denied");
  assertCondition(!subjectMismatch.routeInstruction.includePhi, "cross-patient link exposed PHI");

  const manifestDriftIssued = await issuePharmacyStatusGrant({
    issueKey: "issue-400-contract-manifest-drift",
    token: "external-entry-token-400-manifest-drift",
  });
  const manifestDrift = await manifestDriftIssued.application.resolveExternalEntry({
    ...externalResolveInput(manifestDriftIssued, {
      expectedManifestVersionRef: "nhsapp-manifest-v0.1.0-drifted",
    }),
    redemptionIdempotencyKey: "redeem-400-contract-manifest-drift",
  });
  assertCondition(
    manifestDrift.outcome === "bounded_recovery",
    "manifest drift did not recover safely",
  );

  const draftApplication = createDefaultPhase7ExternalEntryApplication();
  const draftSession = activeSession();
  const draftGrant = await draftApplication.issueExternalEntryGrant({
    environment: "sandpit",
    entryMode: "continuation_link",
    journeyPathId: "jp_continue_draft",
    incomingPath: "/requests/drafts/DRAFT-400?token=raw-token",
    governingObjectRef: "Draft:DRAFT-400",
    governingObjectVersionRef: "DraftVersion:DRAFT-400:v1",
    sessionEpochRef: draftSession.sessionEpochRef,
    subjectBindingVersionRef: draftSession.subjectBindingVersionRef,
    lineageFenceRef: "LineageFence:DRAFT-400",
    subjectRef: draftSession.subjectRef,
    issueIdempotencyKey: "issue-400-contract-promoted-draft",
    opaqueToken: "external-entry-token-400-promoted-draft",
  });
  const promotedDraft = await draftApplication.resolveExternalEntry({
    environment: "sandpit",
    entryMode: "continuation_link",
    journeyPathId: "jp_continue_draft",
    incomingPath: "/requests/drafts/DRAFT-400?token=raw-token",
    presentedToken: draftGrant.materializedToken,
    governingObjectRef: "Draft:DRAFT-400",
    governingObjectVersionRef: "DraftVersion:DRAFT-400:v1",
    lineageFenceRef: "LineageFence:DRAFT-400",
    currentSession: draftSession,
    draftResume: {
      draftRef: "Draft:DRAFT-400",
      expectedSubmissionIngressRecordRef: "SubmissionIngressRecord:400",
      currentSubmissionIngressRecordRef: "SubmissionIngressRecord:400",
      submissionEnvelopeRef: "SubmissionEnvelope:DRAFT-400",
      submissionPromotionRecordRef: "SubmissionPromotionRecord:REQ-400",
      promotedRequestShellRef: "REQ-400",
    },
    redemptionIdempotencyKey: "redeem-400-contract-promoted-draft",
  });
  assertCondition(
    promotedDraft.draftResumeFenceState === "draft_promoted_request_shell_only",
    "promoted draft reopened mutable state",
  );

  const bridge = bridgeTruth();
  let callbackCount = 0;
  const lease = bridge.bridge.setBackAction(() => {
    callbackCount += 1;
  });
  assertCondition(lease.ok, "native back lease did not install");
  bridge.api.triggerBackAction();
  assertCondition(callbackCount === 1, "native back callback did not execute");
  const staleLeases = bridge.bridge.clearForFenceDrift({
    manifestVersionRef: "nhsapp-manifest-drifted",
  });
  assertCondition(
    staleLeases[0]?.leaseState === "stale",
    "manifest drift did not stale back lease",
  );
  bridge.api.triggerBackAction();
  assertCondition(callbackCount === 1, "stale native back callback still executed");

  const calendar = bridge.bridge.addToCalendar({
    subject: "Appointment",
    body: "Appointment details",
    location: "Clinic",
    startTimeEpochInSeconds: 1_775_000_000,
    endTimeEpochInSeconds: 1_775_003_600,
  });
  assertCondition(calendar.ok, "supported calendar action was blocked");
  const noCalendar = bridgeTruth({ missingCalendar: true }).bridge.addToCalendar({
    subject: "Appointment",
    body: "Appointment details",
    location: "Clinic",
    startTimeEpochInSeconds: 1_775_000_000,
  });
  assertCondition(
    noCalendar.blockedReason === "bridge_action_not_visible" ||
      noCalendar.blockedReason === "runtime_method_missing",
    "unsupported calendar did not fail closed",
  );

  const safeExternalGrant = createOutboundNavigationGrant({
    routeFamilyRef: bridge.bridge.navigationContract.routeFamilyRef,
    destinationClass: "external_browser",
    scrubbedUrlRef: "https://www.nhs.uk/conditions/",
    allowedHostRef: "www.nhs.uk",
    allowedPathPattern: "/conditions/*",
    selectedAnchorRef: "SelectedAnchor:400-contract",
    bridgeCapabilityMatrixRef: bridge.bridge.matrix.matrixId,
    patientEmbeddedNavEligibilityRef: bridge.bridge.eligibility.embeddedNavEligibilityId,
    manifestVersionRef: bridge.bridge.navigationContract.manifestVersionRef,
  });
  assertCondition(
    bridge.bridge.openExternal("https://www.nhs.uk/conditions/", safeExternalGrant).ok,
    "allowlisted external browser grant was blocked",
  );
  const phiUrl = bridge.bridge.openExternal("https://www.nhs.uk/conditions/?token=raw", {
    ...safeExternalGrant,
    scrubbedUrlRef: "https://www.nhs.uk/conditions/?token=raw",
  });
  assertCondition(
    phiUrl.blockedReason === "destination_not_scrubbed",
    "PHI-bearing URL was not blocked",
  );
  const staleGrant = bridge.bridge.openExternal("https://www.nhs.uk/conditions/", {
    ...safeExternalGrant,
    grantState: "expired",
  });
  assertCondition(
    staleGrant.blockedReason === "outbound_navigation_grant_not_live",
    "stale grant was not blocked",
  );

  const artifactApplication = createDefaultPhase7ArtifactDeliveryApplication();
  const prepared = artifactApplication.prepareDelivery(deliveryInput());
  assertCondition(prepared.delivery.deliveryPosture === "live", "artifact delivery was not live");
  assertCondition(
    prepared.byteGrant?.grantState === "issued",
    "artifact byte grant was not issued",
  );
  const redeemed = artifactApplication.redeemByteGrant({
    grantId: prepared.byteGrant!.grantId,
    artifactId: prepared.delivery.artifactId,
    bridgeCapabilityMatrixRef: prepared.byteGrant!.bridgeCapabilityMatrixRef,
    patientEmbeddedNavEligibilityRef: prepared.byteGrant!.patientEmbeddedNavEligibilityRef,
    selectedAnchorRef: prepared.byteGrant!.selectedAnchorRef,
    returnContractRef: prepared.byteGrant!.returnContractRef,
    sessionEpochRef: prepared.byteGrant!.sessionEpochRef,
    subjectBindingVersionRef: prepared.byteGrant!.subjectBindingVersionRef,
    continuityEvidenceRef: prepared.byteGrant!.continuityEvidenceRef,
  });
  const byteReplay = artifactApplication.redeemByteGrant({
    grantId: prepared.byteGrant!.grantId,
    artifactId: prepared.delivery.artifactId,
    bridgeCapabilityMatrixRef: prepared.byteGrant!.bridgeCapabilityMatrixRef,
    patientEmbeddedNavEligibilityRef: prepared.byteGrant!.patientEmbeddedNavEligibilityRef,
    selectedAnchorRef: prepared.byteGrant!.selectedAnchorRef,
    returnContractRef: prepared.byteGrant!.returnContractRef,
    sessionEpochRef: prepared.byteGrant!.sessionEpochRef,
    subjectBindingVersionRef: prepared.byteGrant!.subjectBindingVersionRef,
    continuityEvidenceRef: prepared.byteGrant!.continuityEvidenceRef,
  });
  assertCondition(redeemed.status === "transferred", "artifact byte grant did not redeem");
  assertCondition(
    byteReplay.failureReasons.includes("grant_redeemed"),
    "artifact byte replay was not blocked",
  );

  const oversized = artifactApplication.prepareDelivery(
    deliveryInput({ artifactId: "artifact:382:large-appointment-pack" }),
  );
  assertCondition(
    oversized.delivery.failureReasons.includes("payload_too_large"),
    "oversized artifact was not blocked",
  );
  assertCondition(
    oversized.degradedMode?.degradedState === "secure_send_later",
    "oversized artifact fallback drifted",
  );
  const unsupported = artifactApplication.prepareDelivery(
    deliveryInput({
      artifactId: "artifact:382:unsupported-script",
      journeyPathId: "jp_request_status",
      routeFamilyRef: "request_status",
    }),
  );
  assertCondition(
    unsupported.delivery.failureReasons.includes("mime_type_blocked"),
    "unsupported MIME was not blocked",
  );
  const staleContinuity = artifactApplication.prepareDelivery(
    deliveryInput({ continuityState: "stale" }),
  );
  assertCondition(
    staleContinuity.delivery.failureReasons.includes("continuity_stale"),
    "stale continuity was not blocked",
  );
  const sourceUnavailable = artifactApplication.prepareDelivery(
    deliveryInput({
      artifactId: "artifact:382:pharmacy-unavailable",
      journeyPathId: "jp_pharmacy_status",
      routeFamilyRef: "pharmacy_status",
    }),
  );
  assertCondition(
    sourceUnavailable.degradedMode?.degradedState === "secure_send_later",
    "unavailable pharmacy artifact did not secure-send-later",
  );
  const subjectMismatchArtifact = artifactApplication.prepareDelivery(
    deliveryInput({ subjectRef: "Subject:other-patient" }),
  );
  assertCondition(
    subjectMismatchArtifact.delivery.failureReasons.includes("subject_mismatch"),
    "artifact subject mismatch was not blocked",
  );

  const booking = resolveEmbeddedBookingContext({
    pathname: "/nhs-app/bookings/booking_case_391/calendar",
    search: "?fixture=manage",
  });
  assertCondition(
    booking.calendarBridgeAction.capability === "available",
    "booking calendar capability drifted",
  );
  const driftedAlternatives = resolveEmbeddedBookingContext({
    pathname: "/nhs-app/bookings/booking_case_391/alternatives",
    search: "?fixture=alternatives-drifted",
  });
  assertCondition(
    driftedAlternatives.currentState.actionability === "read_only",
    "drifted alternatives stayed writable",
  );
  const pharmacy = resolveEmbeddedPharmacyContext({
    pathname: "/nhs-app/pharmacy/PHC-2103/recovery",
    search: "?fixture=urgent-return",
  });
  assertCondition(
    pharmacy.currentState.actionability === "recovery_required",
    "urgent pharmacy recovery drifted",
  );
  const artifact = resolveEmbeddedRecoveryArtifactContext({
    pathname: "/nhs-app/recovery/ART-400/artifact-fallback",
    search: "?fixture=artifact-fallback",
  });
  assertCondition(
    artifact.artifactTruth.fallbackState === "secure_send_later",
    "artifact fallback model drifted",
  );

  console.log("400_booking_artifact_navigation_contract: ok");
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
