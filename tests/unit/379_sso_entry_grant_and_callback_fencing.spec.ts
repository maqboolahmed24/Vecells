import { describe, expect, it } from "vitest";
import {
  createDefaultPhase7NhsAppSsoBridgeApplication,
  createPhase7SsoLocalSession,
  createPhase7SsoVerifiedBridge,
} from "../../services/command-api/src/phase7-nhs-app-sso-bridge-service.ts";
import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
} from "../../services/command-api/src/phase7-embedded-context-service.ts";

const RAW_ASSERTED_IDENTITY = "raw-asserted-login-identity-379-secret";

function liveEmbeddedContext() {
  const localSession = createPhase7SsoLocalSession();
  const bridgeCapability = createPhase7SsoVerifiedBridge();
  return createDefaultPhase7EmbeddedContextApplication().resolve({
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routePath: "/requests/REQ-123/status",
    signedContextEvidence: createTrustedContextEvidence({
      journeyPathId: "jp_pharmacy_status",
    }),
    localSession,
    bridgeCapability,
  });
}

function startSso() {
  const application = createDefaultPhase7NhsAppSsoBridgeApplication();
  const localSession = createPhase7SsoLocalSession();
  const embeddedContext = liveEmbeddedContext();
  const start = application.captureAndAuthorize({
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routePath: "/requests/REQ-123/status",
    rawUrl:
      "/requests/REQ-123/status?from=nhsApp&assertedLoginIdentity=raw-asserted-login-identity-379-secret&foo=bar",
    assertedLoginIdentity: RAW_ASSERTED_IDENTITY,
    expectedSubjectRef: localSession.subjectRef,
    expectedIdentityBindingRef: localSession.identityBindingRef,
    expectedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
    sessionEpochRef: localSession.sessionEpochRef,
    routeFamilyRef: "pharmacy_status",
    postAuthRoute: "/requests/REQ-123/status",
    embeddedContext,
    localSession,
    bridgeCapability: createPhase7SsoVerifiedBridge(),
  });
  return { application, localSession, embeddedContext, start };
}

describe("379 SSO entry grant and callback fencing", () => {
  it("captures assertedLoginIdentity without persisting the raw value", () => {
    const { application, start } = startSso();

    expect(start.redactedRequest.redirectUrl).toBe("/requests/REQ-123/status?from=nhsApp&foo=bar");
    expect(start.redactedRequest.responseHeaders["Cache-Control"]).toBe("no-store");
    expect(start.redactedRequest.responseHeaders["Referrer-Policy"]).toBe("no-referrer");
    expect(start.entryGrant.assertedIdentityHash).toMatch(/^sha256:/);
    expect(start.entryGrant.maxRedemptions).toBe(1);
    expect(start.authorizeRequest.parameters.prompt).toBe("none");
    expect(start.authorizeRequest.convertedAssertedIdentityParameter).toBe(
      "asserted_login_identity",
    );
    expect(start.authorizeRequest.url).not.toContain(RAW_ASSERTED_IDENTITY);
    expect(start.authorizeRequest.loggingQueryString).not.toContain(RAW_ASSERTED_IDENTITY);

    const persistedSnapshot = JSON.stringify({
      grants: application.entryGrantStore.list(),
      transactions: application.transactionStore.list(),
      records: application.recordStore.snapshot(),
    });
    expect(persistedSnapshot).not.toContain(RAW_ASSERTED_IDENTITY);
  });

  it("settles the first valid callback and blocks replayed callbacks", () => {
    const { application, localSession, embeddedContext, start } = startSso();

    const first = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-success",
      returnedSubjectRef: localSession.subjectRef,
      returnedIdentityBindingRef: localSession.identityBindingRef,
      returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      claimSet: { sub: localSession.subjectRef, vot: "P9.Cp.Cd" },
      existingSession: {
        sessionRef: "Session:existing-379",
        subjectRef: localSession.subjectRef,
        identityBindingRef: localSession.identityBindingRef,
        sessionEpochRef: localSession.sessionEpochRef,
        subjectBindingVersionRef: localSession.subjectBindingVersionRef,
        sessionState: "active",
      },
      currentEmbeddedContext: embeddedContext,
    });

    const replay = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-success",
      returnedSubjectRef: localSession.subjectRef,
      returnedIdentityBindingRef: localSession.identityBindingRef,
      returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      existingSession: {
        sessionRef: "Session:existing-379",
        subjectRef: localSession.subjectRef,
        identityBindingRef: localSession.identityBindingRef,
        sessionEpochRef: localSession.sessionEpochRef,
        subjectBindingVersionRef: localSession.subjectBindingVersionRef,
        sessionState: "active",
      },
      currentEmbeddedContext: embeddedContext,
    });

    expect(first.entryGrant?.grantState).toBe("consumed");
    expect(first.transaction?.transactionState).toBe("verified");
    expect(first.identityAssertionBinding?.bindingState).toBe("matched");
    expect(first.sessionMergeDecision?.decision).toBe("reuse");
    expect(first.ssoReturnDisposition.outcome).toBe("silent_success");
    expect(replay.ssoReturnDisposition.outcome).toBe("safe_reentry_required");
    expect(replay.sessionMergeDecision).toBeNull();
  });

  it("handles ConsentNotGiven as a safe consent_denied disposition", () => {
    const { application, start } = startSso();

    const result = application.handleCallback({
      ...start.callbackFixture,
      error: "access_denied",
      errorDescription: "ConsentNotGiven",
    });

    expect(result.entryGrant?.grantState).toBe("denied");
    expect(result.transaction?.transactionState).toBe("denied");
    expect(result.ssoReturnDisposition.outcome).toBe("consent_denied");
    expect(result.ssoReturnDisposition.allowRetry).toBe(true);
    expect(result.identityAssertionBinding).toBeNull();
    expect(result.responseHeaders["Cache-Control"]).toBe("no-store");
  });
});
