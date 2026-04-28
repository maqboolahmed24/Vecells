import { describe, expect, it } from "vitest";
import {
  createDefaultPhase7NhsAppSsoBridgeApplication,
  createPhase7SsoLocalSession,
  createPhase7SsoVerifiedBridge,
  type ExistingLocalSession,
} from "../../services/command-api/src/phase7-nhs-app-sso-bridge-service.ts";
import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
} from "../../services/command-api/src/phase7-embedded-context-service.ts";

const RAW_ASSERTED_IDENTITY = "raw-asserted-login-identity-379-secret";

function embeddedContext(input?: { manifestDrift?: boolean; bridgeUnavailable?: boolean }) {
  const localSession = createPhase7SsoLocalSession();
  return createDefaultPhase7EmbeddedContextApplication().resolve({
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routePath: "/requests/REQ-123/status",
    signedContextEvidence: createTrustedContextEvidence({
      journeyPathId: "jp_pharmacy_status",
    }),
    localSession,
    bridgeCapability: input?.bridgeUnavailable ? null : createPhase7SsoVerifiedBridge(),
    expectedConfigFingerprint: input?.manifestDrift ? "sha256:drifted-config" : undefined,
  });
}

function existingSession(input?: Partial<ExistingLocalSession>): ExistingLocalSession {
  const localSession = createPhase7SsoLocalSession();
  return {
    sessionRef: input?.sessionRef ?? "Session:existing-379",
    subjectRef: input?.subjectRef ?? localSession.subjectRef,
    identityBindingRef: input?.identityBindingRef ?? localSession.identityBindingRef,
    sessionEpochRef: input?.sessionEpochRef ?? localSession.sessionEpochRef,
    subjectBindingVersionRef:
      input?.subjectBindingVersionRef ?? localSession.subjectBindingVersionRef,
    sessionState: input?.sessionState ?? "active",
  };
}

function startSso(input?: {
  submissionPromotionRecordRef?: string | null;
  submissionEnvelopeRef?: string | null;
}) {
  const application = createDefaultPhase7NhsAppSsoBridgeApplication();
  const localSession = createPhase7SsoLocalSession();
  const currentEmbeddedContext = embeddedContext();
  const start = application.captureAndAuthorize({
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routePath: "/requests/REQ-123/status",
    rawUrl:
      "/requests/REQ-123/status?from=nhsApp&assertedLoginIdentity=raw-asserted-login-identity-379-secret",
    assertedLoginIdentity: RAW_ASSERTED_IDENTITY,
    expectedSubjectRef: localSession.subjectRef,
    expectedIdentityBindingRef: localSession.identityBindingRef,
    expectedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
    sessionEpochRef: localSession.sessionEpochRef,
    routeFamilyRef: "pharmacy_status",
    postAuthRoute: "/requests/REQ-123/status",
    submissionEnvelopeRef: input?.submissionEnvelopeRef ?? null,
    submissionPromotionRecordRef: input?.submissionPromotionRecordRef ?? null,
    embeddedContext: currentEmbeddedContext,
    localSession,
    bridgeCapability: createPhase7SsoVerifiedBridge(),
  });
  return { application, localSession, start, currentEmbeddedContext };
}

describe("379 identity binding, session merge, and return intent", () => {
  it("rotates into a fresh local session when no active session exists", () => {
    const { application, localSession, start, currentEmbeddedContext } = startSso();

    const result = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-new-session",
      returnedSubjectRef: localSession.subjectRef,
      returnedIdentityBindingRef: localSession.identityBindingRef,
      returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      currentEmbeddedContext,
    });

    expect(result.identityAssertionBinding?.bindingState).toBe("matched");
    expect(result.sessionMergeDecision?.subjectComparisonState).toBe("no_session");
    expect(result.sessionMergeDecision?.decision).toBe("rotate");
    expect(result.ssoReturnDisposition.outcome).toBe("silent_success");
  });

  it("fails closed when the returned NHS login subject does not match the assertion fence", () => {
    const { application, localSession, start, currentEmbeddedContext } = startSso();

    const result = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-mismatch",
      returnedSubjectRef: "subject:other-patient",
      returnedIdentityBindingRef: "IdentityBinding:other-patient-v1",
      returnedSubjectBindingVersionRef: "SubjectBindingVersion:1",
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      existingSession: existingSession({ subjectRef: localSession.subjectRef }),
      currentEmbeddedContext,
    });

    expect(result.identityAssertionBinding?.bindingState).toBe("mismatched");
    expect(result.sessionMergeDecision?.decision).toBe("terminate_and_reenter");
    expect(result.ssoReturnDisposition.outcome).toBe("session_conflict");
  });

  it("terminates and re-enters when an existing session belongs to another subject", () => {
    const { application, localSession, start, currentEmbeddedContext } = startSso();

    const result = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-existing-conflict",
      returnedSubjectRef: localSession.subjectRef,
      returnedIdentityBindingRef: localSession.identityBindingRef,
      returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      existingSession: existingSession({
        subjectRef: "subject:other-patient",
        identityBindingRef: "IdentityBinding:other-patient-v1",
      }),
      currentEmbeddedContext,
    });

    expect(result.identityAssertionBinding?.bindingState).toBe("matched");
    expect(result.sessionMergeDecision?.subjectComparisonState).toBe("different_subject");
    expect(result.sessionMergeDecision?.decision).toBe("terminate_and_reenter");
    expect(result.ssoReturnDisposition.outcome).toBe("session_conflict");
  });

  it("routes manifest drift to the manifest recovery disposition", () => {
    const { application, localSession, start } = startSso();

    const result = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-manifest-drift",
      returnedSubjectRef: localSession.subjectRef,
      returnedIdentityBindingRef: localSession.identityBindingRef,
      returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      existingSession: existingSession(),
      currentEmbeddedContext: embeddedContext({ manifestDrift: true }),
    });

    expect(result.returnIntentValidation.invalidReason).toBe("manifest_drift");
    expect(result.ssoReturnDisposition.outcome).toBe("manifest_drift");
    expect(result.ssoReturnDisposition.patientRouteRef).toBe("/nhs-app/recovery/manifest-drift");
  });

  it("routes non-live embedded eligibility to context drift", () => {
    const { application, localSession, start } = startSso();

    const result = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-context-drift",
      returnedSubjectRef: localSession.subjectRef,
      returnedIdentityBindingRef: localSession.identityBindingRef,
      returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      existingSession: existingSession(),
      currentEmbeddedContext: embeddedContext({ bridgeUnavailable: true }),
    });

    expect(result.returnIntentValidation.invalidReason).toBe("embedded_eligibility_not_live");
    expect(result.ssoReturnDisposition.outcome).toBe("context_drift");
  });

  it("blocks promoted draft resume return intents", () => {
    const { application, localSession, start, currentEmbeddedContext } = startSso({
      submissionEnvelopeRef: "SubmissionEnvelope:REQ-123-draft",
      submissionPromotionRecordRef: "SubmissionPromotionRecord:REQ-123-promoted",
    });

    const result = application.handleCallback({
      ...start.callbackFixture,
      code: "auth-code-379-promoted-draft",
      returnedSubjectRef: localSession.subjectRef,
      returnedIdentityBindingRef: localSession.identityBindingRef,
      returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
      assertedIdentityHash: start.entryGrant.assertedIdentityHash,
      existingSession: existingSession(),
      currentEmbeddedContext,
    });

    expect(result.returnIntentValidation.invalidReason).toBe("draft_already_promoted");
    expect(result.ssoReturnDisposition.outcome).toBe("safe_reentry_required");
    expect(result.sessionMergeDecision?.resumeIntentDisposition).toBe("consume_intent");
  });
});
