import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
} from "../../services/command-api/src/phase7-embedded-context-service.ts";
import {
  createDefaultPhase7NhsAppSsoBridgeApplication,
  createPhase7SsoLocalSession,
  createPhase7SsoVerifiedBridge,
} from "../../services/command-api/src/phase7-nhs-app-sso-bridge-service.ts";
import { resolveEmbeddedStartRequestContext } from "../../apps/patient-web/src/embedded-start-request.model.ts";
import { resolveEmbeddedRequestStatusContext } from "../../apps/patient-web/src/embedded-request-status.model.ts";

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function liveContext(
  journeyPathId = "jp_pharmacy_status",
  routePath = "/requests/REQ-399/pharmacy/status",
) {
  const contextApplication = createDefaultPhase7EmbeddedContextApplication();
  return contextApplication.resolve({
    environment: "sandpit",
    journeyPathId,
    routePath,
    signedContextEvidence: createTrustedContextEvidence({ journeyPathId }),
    localSession: createPhase7SsoLocalSession(),
    bridgeCapability: createPhase7SsoVerifiedBridge(),
  });
}

function startSso(
  options: {
    readonly journeyPathId?: string;
    readonly routePath?: string;
    readonly routeFamilyRef?: string;
    readonly postAuthRoute?: string;
    readonly submissionPromotionRecordRef?: string | null;
  } = {},
) {
  const application = createDefaultPhase7NhsAppSsoBridgeApplication();
  const localSession = createPhase7SsoLocalSession();
  const journeyPathId = options.journeyPathId ?? "jp_pharmacy_status";
  const routePath = options.routePath ?? "/requests/REQ-399/pharmacy/status";
  const embeddedContext = liveContext(journeyPathId, routePath);
  const start = application.captureAndAuthorize({
    environment: "sandpit",
    journeyPathId,
    routePath,
    rawUrl: `${routePath}?from=nhsApp&assertedLoginIdentity=raw-399-secret&state=raw-state`,
    assertedLoginIdentity: "raw-399-secret",
    expectedSubjectRef: localSession.subjectRef,
    expectedIdentityBindingRef: localSession.identityBindingRef,
    expectedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
    sessionEpochRef: localSession.sessionEpochRef,
    routeFamilyRef: options.routeFamilyRef ?? "pharmacy_status",
    postAuthRoute: options.postAuthRoute ?? "/nhs-app/requests/request_211_a/status",
    submissionPromotionRecordRef: options.submissionPromotionRecordRef ?? null,
    embeddedContext,
    localSession,
    bridgeCapability: createPhase7SsoVerifiedBridge(),
  });
  return { application, localSession, embeddedContext, start };
}

function successfulCallback(
  input: ReturnType<typeof startSso>,
  overrides: Record<string, unknown> = {},
) {
  return input.application.handleCallback({
    ...input.start.callbackFixture,
    code: "auth-code-399-success",
    returnedSubjectRef: input.localSession.subjectRef,
    returnedIdentityBindingRef: input.localSession.identityBindingRef,
    returnedSubjectBindingVersionRef: input.localSession.subjectBindingVersionRef,
    assertedIdentityHash: input.start.entryGrant.assertedIdentityHash,
    claimSet: { sub: input.localSession.subjectRef, vot: "P9.Cp.Cd" },
    existingSession: {
      sessionRef: "Session:399-existing",
      subjectRef: input.localSession.subjectRef,
      identityBindingRef: input.localSession.identityBindingRef,
      sessionEpochRef: input.localSession.sessionEpochRef,
      subjectBindingVersionRef: input.localSession.subjectBindingVersionRef,
      sessionState: "active",
    },
    currentEmbeddedContext: input.embeddedContext,
    ...overrides,
  });
}

export async function run(): Promise<void> {
  const contextApplication = createDefaultPhase7EmbeddedContextApplication();
  const trusted = liveContext();
  assertCondition(
    trusted.channelContext.resolutionDisposition === "embedded_live",
    "trusted context should be live",
  );
  assertCondition(
    trusted.hydrationBinding.rehydrateFromServerOnly,
    "hydration must be server-owned",
  );
  assertCondition(
    !trusted.shellPolicy.showHeader && !trusted.shellPolicy.showFooter,
    "embedded shell chrome not suppressed",
  );

  const querySpoof = contextApplication.resolve({
    environment: "sandpit",
    journeyPathId: "jp_request_status",
    routePath: "/requests/REQ-399/status",
    query: { from: "nhsApp", assertedLoginIdentity: "raw-spoof" },
  });
  assertCondition(
    querySpoof.channelContext.trustTier === "hinted_embedded",
    "query hint should stay hinted",
  );
  assertCondition(
    querySpoof.blockedReasons.includes("query_hint_not_trusted"),
    "query hint did not fail closed",
  );
  assertCondition(
    querySpoof.patientEmbeddedNavEligibility.eligibilityState === "placeholder_only",
    "query spoof unlocked live mode",
  );
  assertCondition(
    querySpoof.channelContext.queryEvidence.assertedLoginIdentity === "redacted",
    "raw query identity not redacted",
  );

  const hydrationConflict = contextApplication.resolve({
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routePath: "/requests/REQ-399/pharmacy/status",
    signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_pharmacy_status" }),
    localSession: createPhase7SsoLocalSession(),
    bridgeCapability: createPhase7SsoVerifiedBridge(),
    hydrationContext: {
      trustTier: "standalone_or_unknown",
      resolutionDisposition: "standalone",
      channelType: "standalone_web",
    },
  });
  assertCondition(
    hydrationConflict.blockedReasons.includes("hydration_conflict"),
    "hydration conflict not detected",
  );
  assertCondition(
    hydrationConflict.channelContext.resolutionDisposition === "bounded_recovery",
    "hydration conflict should recover safely",
  );

  const successInput = startSso();
  assertCondition(
    successInput.start.authorizeRequest.parameters.prompt === "none",
    "SSO authorize must use prompt=none",
  );
  assertCondition(
    !successInput.start.authorizeRequest.url.includes("raw-399-secret"),
    "authorize URL leaked raw identity",
  );
  const success = successfulCallback(successInput);
  assertCondition(
    success.ssoReturnDisposition.outcome === "silent_success",
    "silent auth did not succeed",
  );
  assertCondition(success.entryGrant?.grantState === "consumed", "entry grant was not consumed");
  const replay = successfulCallback(successInput);
  assertCondition(
    replay.ssoReturnDisposition.outcome === "safe_reentry_required",
    "replayed callback was not fenced",
  );
  assertCondition(
    replay.sessionMergeDecision === null,
    "replayed callback should not merge a session",
  );

  const consentInput = startSso();
  const consent = consentInput.application.handleCallback({
    ...consentInput.start.callbackFixture,
    error: "access_denied",
    errorDescription: "ConsentNotGiven",
  });
  assertCondition(
    consent.ssoReturnDisposition.outcome === "consent_denied",
    "ConsentNotGiven not mapped to denial",
  );
  assertCondition(
    consent.ssoReturnDisposition.allowRetry,
    "consent denial should allow safe retry",
  );

  const expiredInput = startSso();
  const expired = successfulCallback(expiredInput, { now: "2026-04-27T00:25:15.000Z" });
  assertCondition(
    expired.ssoReturnDisposition.outcome === "safe_reentry_required",
    "expired callback not safe re-entry",
  );

  const mismatchInput = startSso();
  const mismatch = successfulCallback(mismatchInput, {
    returnedSubjectRef: "subject:different-patient",
    claimSet: { sub: "subject:different-patient" },
  });
  assertCondition(
    mismatch.ssoReturnDisposition.outcome === "session_conflict",
    "subject mismatch not fenced",
  );
  assertCondition(
    mismatch.sessionMergeDecision?.decision === "terminate_and_reenter",
    "subject mismatch did not terminate and re-enter",
  );

  const manifestInput = startSso();
  const manifestDriftContext = contextApplication.resolve({
    environment: "sandpit",
    journeyPathId: "jp_request_status",
    routePath: "/requests/REQ-399/status",
    signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_request_status" }),
    localSession: createPhase7SsoLocalSession(),
    bridgeCapability: createPhase7SsoVerifiedBridge(),
    expectedManifestVersion: "phase7-manifest-drift",
  });
  const manifestDrift = successfulCallback(manifestInput, {
    currentEmbeddedContext: manifestDriftContext,
  });
  assertCondition(
    manifestDrift.ssoReturnDisposition.outcome === "manifest_drift",
    "manifest drift not surfaced",
  );

  const contextInput = startSso();
  const contextDrift = successfulCallback(contextInput, {
    currentEmbeddedContext: liveContext("jp_request_status", "/requests/REQ-399/status"),
  });
  assertCondition(
    contextDrift.ssoReturnDisposition.outcome === "context_drift",
    "context drift not surfaced",
  );

  const promotedInput = startSso({
    submissionPromotionRecordRef: "SubmissionPromotionRecord:399:already-promoted",
  });
  const promoted = successfulCallback(promotedInput);
  assertCondition(
    promoted.returnIntentValidation.invalidReason === "draft_already_promoted",
    "promoted draft reopened",
  );
  assertCondition(
    promoted.ssoReturnDisposition.outcome === "safe_reentry_required",
    "promoted draft not safe re-entry",
  );

  const emptyIntake = resolveEmbeddedStartRequestContext({
    pathname: "/nhs-app/start-request",
    search: "?fixture=empty",
  });
  assertCondition(emptyIntake.step === "request_type", "empty intake should start at request type");
  const receipt = resolveEmbeddedStartRequestContext({
    pathname: "/nhs-app/start-request/dft_399/receipt",
    search: "?fixture=receipt",
  });
  assertCondition(receipt.submissionEnvelope.state === "submitted", "receipt should be submitted");
  const promotedDraft = resolveEmbeddedStartRequestContext({
    pathname: "/nhs-app/start-request/dft_399/resume",
    search: "?fixture=promoted",
  });
  assertCondition(
    promotedDraft.draftContinuityEvidence.writableResume === false,
    "promoted draft stayed writable",
  );

  const status = resolveEmbeddedRequestStatusContext({
    pathname: "/nhs-app/requests/request_211_a/status",
    search: "?fixture=status",
  });
  assertCondition(status.currentState.actionability === "live", "status should be live");
  const moreInfo = resolveEmbeddedRequestStatusContext({
    pathname: "/nhs-app/requests/request_211_a/more-info",
    search: "?fixture=more-info",
  });
  assertCondition(
    moreInfo.moreInfoThread.answerabilityState === "answerable",
    "more-info should be answerable",
  );
  const callback = resolveEmbeddedRequestStatusContext({
    pathname: "/nhs-app/requests/request_211_a/callback",
    search: "?fixture=callback",
  });
  assertCondition(
    callback.callbackStatus.windowRiskState === "on_track",
    "callback should be on track",
  );
  const messages = resolveEmbeddedRequestStatusContext({
    pathname: "/nhs-app/requests/request_211_a/messages",
    search: "?fixture=messages",
  });
  assertCondition(
    messages.conversationPreview.projectionName === "PatientConversationPreviewDigest",
    "messages digest missing",
  );
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
